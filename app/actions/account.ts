"use server";

import { randomUUID } from "node:crypto";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { validateMeasurements, type FitProfile } from "@/lib/fit";
import { clientIp, currentCustomer, currentToken, endSession, startSession } from "@/lib/server/customer-auth";
import {
  consumeResetToken,
  createCustomer,
  createResetToken,
  deleteCustomer,
  deleteOtherSessions,
  findCustomer,
  findCustomerByEmail,
  hashPassword,
  normaliseEmail,
  passwordProblem,
  setPassword,
  toPublicCustomer,
  updateCustomer,
  verifyPassword,
} from "@/lib/server/customers";
import { sendMail } from "@/lib/server/mail";
import { createThrottle } from "@/lib/server/throttle";
import type { Address, CustomerPublic } from "@/lib/types";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const loginThrottle = createThrottle(8, 10 * 60_000); // per IP+email
const signupThrottle = createThrottle(5, 60 * 60_000); // per IP
const resetThrottle = createThrottle(5, 60 * 60_000); // per IP

export type AuthState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
  values?: Record<string, string>;
  message?: string;
} | null;

/** Only allow redirects back into this site. */
function safeNext(raw: FormDataEntryValue | null, fallback = "/account") {
  const n = String(raw ?? "");
  return n.startsWith("/") && !n.startsWith("//") && !n.startsWith("/admin") ? n : fallback;
}

export async function signUpAction(_prev: AuthState, form: FormData): Promise<AuthState> {
  const name = String(form.get("name") ?? "").trim().slice(0, 80);
  const email = normaliseEmail(String(form.get("email") ?? "")).slice(0, 160);
  const phone = String(form.get("phone") ?? "").trim().slice(0, 20);
  const password = String(form.get("password") ?? "");
  const values = { name, email, phone };
  const fieldErrors: Record<string, string> = {};
  if (name.length < 2) fieldErrors.name = "Please enter your name.";
  if (!EMAIL.test(email)) fieldErrors.email = "Enter a valid email address.";
  if (phone && !/^(\+?\d[\d\s-]{7,16})$/.test(phone)) fieldErrors.phone = "Enter a valid phone number, or leave it blank.";
  const pw = passwordProblem(password);
  if (pw) fieldErrors.password = pw;
  if (form.get("terms") !== "on") fieldErrors.terms = "Please accept the terms to continue.";
  if (Object.keys(fieldErrors).length) return { error: "Please check the highlighted fields.", fieldErrors, values };

  const ip = await clientIp();
  if (signupThrottle.blocked(ip)) return { error: "Too many sign-ups from this network. Please try again later.", values };
  signupThrottle.hit(ip);
  if (findCustomerByEmail(email)) {
    return { error: "An account with this email already exists.", fieldErrors: { email: "Already registered — sign in instead." }, values };
  }
  const c = await createCustomer({ email, name, phone, password, marketing: form.get("marketing") === "on" });
  await startSession(c.id, true);
  await sendMail({
    to: c.email,
    subject: "Welcome to SARPECH",
    text: `Dear ${c.name.split(" ")[0]},\n\nWelcome to the royal court. Your account is ready.\n\n— SARPECH`,
  });
  redirect(safeNext(form.get("next"), "/account?welcome=1"));
}

export async function signInAction(_prev: AuthState, form: FormData): Promise<AuthState> {
  const email = normaliseEmail(String(form.get("email") ?? "")).slice(0, 160);
  const password = String(form.get("password") ?? "");
  const values = { email };
  if (!EMAIL.test(email) || !password) return { error: "Enter your email and password.", values };
  const key = `${await clientIp()}|${email}`;
  if (loginThrottle.blocked(key)) return { error: "Too many attempts. Please wait a few minutes and try again.", values };

  const c = findCustomerByEmail(email);
  // Always run a hash comparison so response time doesn't reveal whether the email exists.
  const ok = await verifyPassword(password, c ? c.passwordHash : await getDummyHash());
  if (!c || !ok) {
    loginThrottle.hit(key);
    return { error: "That email and password don't match our records.", values };
  }
  loginThrottle.reset(key);
  await startSession(c.id, form.get("remember") === "on");
  redirect(safeNext(form.get("next")));
}

// A real scrypt hash of a random secret, so unknown emails take as long as real ones.
let dummyHash: Promise<string> | null = null;
const getDummyHash = () => (dummyHash ??= hashPassword(randomUUID()));

export async function signOutAction() {
  await endSession();
  redirect("/");
}

export async function requestResetAction(_prev: AuthState, form: FormData): Promise<AuthState> {
  const email = normaliseEmail(String(form.get("email") ?? "")).slice(0, 160);
  if (!EMAIL.test(email)) return { error: "Enter a valid email address.", values: { email } };
  const ip = await clientIp();
  if (resetThrottle.blocked(ip)) return { error: "Too many requests. Please try again later.", values: { email } };
  resetThrottle.hit(ip);
  const c = findCustomerByEmail(email);
  if (c) {
    const token = createResetToken(c.id);
    const h = await headers();
    const origin = process.env.NEXT_PUBLIC_SITE_URL ?? `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host")}`;
    await sendMail({
      to: c.email,
      subject: "Reset your SARPECH password",
      text: `Reset your password within the next hour:\n${origin}/account/reset?token=${token}\n\nIf you didn't ask for this, you can ignore this email.`,
    });
  }
  // Same answer either way, so the form can't be used to discover accounts.
  return { ok: true, message: "If an account exists for that email, a reset link is on its way. It expires in one hour.", values: { email } };
}

export async function resetPasswordAction(_prev: AuthState, form: FormData): Promise<AuthState> {
  const token = String(form.get("token") ?? "");
  const password = String(form.get("password") ?? "");
  const pw = passwordProblem(password);
  if (pw) return { error: pw, fieldErrors: { password: pw } };
  if (password !== String(form.get("confirm") ?? "")) return { error: "Passwords don't match.", fieldErrors: { confirm: "Passwords don't match." } };
  const id = consumeResetToken(token);
  if (!id) return { error: "This reset link has expired or was already used. Please request a new one." };
  await setPassword(id, password);
  deleteOtherSessions(id);
  await startSession(id, true);
  redirect("/account?reset=1");
}

/* ───────────── Signed-in account management ───────────── */

async function me() {
  const c = await currentCustomer();
  if (!c) redirect("/account/login");
  return c;
}

export async function updateProfileAction(_prev: AuthState, form: FormData): Promise<AuthState> {
  const c = await me();
  const name = String(form.get("name") ?? "").trim().slice(0, 80);
  const phone = String(form.get("phone") ?? "").trim().slice(0, 20);
  const fieldErrors: Record<string, string> = {};
  if (name.length < 2) fieldErrors.name = "Please enter your name.";
  if (phone && !/^(\+?\d[\d\s-]{7,16})$/.test(phone)) fieldErrors.phone = "Enter a valid phone number, or leave it blank.";
  if (Object.keys(fieldErrors).length) return { error: "Please check the highlighted fields.", fieldErrors, values: { name, phone } };
  updateCustomer(c.id, { name, phone, marketing: form.get("marketing") === "on" });
  return { ok: true, message: "Your details are saved.", values: { name, phone } };
}

export async function changePasswordAction(_prev: AuthState, form: FormData): Promise<AuthState> {
  const c = await me();
  const current = String(form.get("current") ?? "");
  const next = String(form.get("password") ?? "");
  if (!(await verifyPassword(current, c.passwordHash))) return { error: "Your current password is incorrect.", fieldErrors: { current: "Incorrect password." } };
  const pw = passwordProblem(next);
  if (pw) return { error: pw, fieldErrors: { password: pw } };
  if (next !== String(form.get("confirm") ?? "")) return { error: "Passwords don't match.", fieldErrors: { confirm: "Passwords don't match." } };
  await setPassword(c.id, next);
  deleteOtherSessions(c.id, await currentToken());
  return { ok: true, message: "Password changed. Other devices have been signed out." };
}

function cleanAddress(raw: Partial<Address>): { address?: Address; errors?: Record<string, string> } {
  const s = (v: unknown, n = 160) => String(v ?? "").trim().slice(0, n);
  const a: Address = {
    id: s(raw.id, 40) || randomUUID(),
    label: s(raw.label, 30) || "Home",
    firstName: s(raw.firstName, 60),
    lastName: s(raw.lastName, 60),
    phone: s(raw.phone, 20),
    line1: s(raw.line1),
    line2: s(raw.line2),
    city: s(raw.city, 60),
    state: s(raw.state, 40),
    pin: s(raw.pin, 6),
    isDefault: !!raw.isDefault,
  };
  const errors: Record<string, string> = {};
  if (!a.firstName) errors.firstName = "Required.";
  if (!a.line1) errors.line1 = "Required.";
  if (!a.city) errors.city = "Required.";
  if (!a.state) errors.state = "Choose a state.";
  if (!/^\d{6}$/.test(a.pin)) errors.pin = "Enter a 6-digit PIN code.";
  if (a.phone && !/^(\+91[\s-]?)?[6-9]\d{9}$/.test(a.phone.replace(/\s/g, ""))) errors.phone = "Enter a 10-digit mobile number.";
  return Object.keys(errors).length ? { errors } : { address: a };
}

export async function saveAddressAction(raw: Partial<Address>): Promise<{ ok: true; addresses: Address[] } | { ok: false; fieldErrors: Record<string, string> }> {
  const c = await me();
  const { address, errors } = cleanAddress(raw);
  if (!address) return { ok: false, fieldErrors: errors! };
  let list = c.addresses.filter((x) => x.id !== address.id);
  if (address.isDefault || list.length === 0) {
    list = list.map((x) => ({ ...x, isDefault: false }));
    address.isDefault = true;
  }
  const existingIdx = c.addresses.findIndex((x) => x.id === address.id);
  if (existingIdx >= 0) list.splice(existingIdx, 0, address);
  else list.push(address);
  list = list.slice(0, 10);
  updateCustomer(c.id, { addresses: list });
  return { ok: true, addresses: list };
}

export async function deleteAddressAction(id: string): Promise<{ ok: true; addresses: Address[] }> {
  const c = await me();
  let list = c.addresses.filter((x) => x.id !== id);
  if (list.length && !list.some((x) => x.isDefault)) list = list.map((x, i) => ({ ...x, isDefault: i === 0 }));
  updateCustomer(c.id, { addresses: list });
  return { ok: true, addresses: list };
}

export async function deleteAccountAction(_prev: AuthState, form: FormData): Promise<AuthState> {
  const c = await me();
  if (!(await verifyPassword(String(form.get("password") ?? ""), c.passwordHash))) return { error: "Incorrect password." };
  await endSession();
  deleteCustomer(c.id);
  redirect("/?account-deleted=1");
}

/* ───────────── Sync between this device and the account ───────────── */

export interface AccountSnapshot {
  customer: CustomerPublic;
  wishlist: string[];
  fitProfile: FitProfile | null;
}

/**
 * Merge this device's wishlist and Royal Fit into the account and return the
 * result. Wishlists are unioned; the most recently updated Royal Fit wins.
 */
export async function syncAccountAction(local: { wishlist?: string[]; fitProfile?: FitProfile | null }): Promise<AccountSnapshot | null> {
  const c = await currentCustomer();
  if (!c) return null;
  const wish = [...new Set([...(c.wishlist ?? []), ...(local.wishlist ?? []).filter((s) => typeof s === "string").map((s) => s.slice(0, 120))])].slice(0, 200);
  let fit = c.fitProfile;
  const lf = local.fitProfile;
  if (lf && lf.version === 1 && validateMeasurements(lf.measurements).ok && (!fit || new Date(lf.updatedAt) > new Date(fit.updatedAt))) fit = lf;
  updateCustomer(c.id, { wishlist: wish, fitProfile: fit });
  const fresh = findCustomer(c.id)!;
  return { customer: toPublicCustomer(fresh), wishlist: wish, fitProfile: fit };
}

/** Explicit removal (sync only adds). */
export async function removeFromAccountWishlist(slug: string) {
  const c = await currentCustomer();
  if (!c) return;
  updateCustomer(c.id, { wishlist: c.wishlist.filter((s) => s !== slug) });
}

export async function clearAccountFitProfile() {
  const c = await currentCustomer();
  if (c) updateCustomer(c.id, { fitProfile: null });
}
