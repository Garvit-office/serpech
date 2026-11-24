import "server-only";
import { randomUUID } from "node:crypto";
import { validateMeasurements, type FitProfile } from "@sarpech/core/fit";
import type { Address, CustomerPublic } from "@sarpech/core/types";
import {
  createCustomer,
  createResetToken,
  findCustomer,
  findCustomerByEmail,
  hashPassword,
  normaliseEmail,
  passwordProblem,
  toPublicCustomer,
  updateCustomer,
  verifyPassword,
  type CustomerRecord,
} from "./customers";
import { sendMail, siteUrl } from "./mail";
import { createThrottle } from "./throttle";

/**
 * Customer-account rules shared by the website (server actions + cookie
 * sessions) and the mobile app (/api/mobile/v1 + bearer tokens). Sessions are
 * started by the caller; everything else — validation, throttling, password
 * checks, emails — happens here so both channels behave identically.
 */

export const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE = /^(\+?\d[\d\s-]{7,16})$/;
const loginThrottle = createThrottle(8, 10 * 60_000); // per IP+email
const signupThrottle = createThrottle(5, 60 * 60_000); // per IP
const resetThrottle = createThrottle(5, 60 * 60_000); // per IP

export type Problem = { error: string; fieldErrors?: Record<string, string>; values?: Record<string, string> };

/* ───────────── Sign up / sign in ───────────── */

export async function registerCustomer(
  raw: { name?: unknown; email?: unknown; phone?: unknown; password?: unknown; marketing?: unknown; terms?: unknown },
  ip: string,
): Promise<{ ok: true; customer: CustomerRecord } | ({ ok: false } & Problem)> {
  const name = String(raw.name ?? "").trim().slice(0, 80);
  const email = normaliseEmail(String(raw.email ?? "")).slice(0, 160);
  const phone = String(raw.phone ?? "").trim().slice(0, 20);
  const password = String(raw.password ?? "");
  const values = { name, email, phone };
  const fieldErrors: Record<string, string> = {};
  if (name.length < 2) fieldErrors.name = "Please enter your name.";
  if (!EMAIL.test(email)) fieldErrors.email = "Enter a valid email address.";
  if (phone && !PHONE.test(phone)) fieldErrors.phone = "Enter a valid phone number, or leave it blank.";
  const pw = passwordProblem(password);
  if (pw) fieldErrors.password = pw;
  if (!raw.terms) fieldErrors.terms = "Please accept the terms to continue.";
  if (Object.keys(fieldErrors).length) return { ok: false, error: "Please check the highlighted fields.", fieldErrors, values };

  if (signupThrottle.blocked(ip)) return { ok: false, error: "Too many sign-ups from this network. Please try again later.", values };
  signupThrottle.hit(ip);
  if (findCustomerByEmail(email)) {
    return { ok: false, error: "An account with this email already exists.", fieldErrors: { email: "Already registered — sign in instead." }, values };
  }
  const customer = await createCustomer({ email, name, phone, password, marketing: !!raw.marketing });
  await sendMail({
    to: customer.email,
    subject: "Welcome to SARPECH",
    text: `Dear ${customer.name.split(" ")[0]},\n\nWelcome to the royal court. Your account is ready.\n\n— SARPECH`,
  });
  return { ok: true, customer };
}

// A real scrypt hash of a random secret, so unknown emails take as long as real ones.
let dummyHash: Promise<string> | null = null;
const getDummyHash = () => (dummyHash ??= hashPassword(randomUUID()));

export async function authenticate(rawEmail: unknown, rawPassword: unknown, ip: string): Promise<{ ok: true; customer: CustomerRecord } | ({ ok: false } & Problem)> {
  const email = normaliseEmail(String(rawEmail ?? "")).slice(0, 160);
  const password = String(rawPassword ?? "");
  const values = { email };
  if (!EMAIL.test(email) || !password) return { ok: false, error: "Enter your email and password.", values };
  const key = `${ip}|${email}`;
  if (loginThrottle.blocked(key)) return { ok: false, error: "Too many attempts. Please wait a few minutes and try again.", values };
  const c = findCustomerByEmail(email);
  // Always run a hash comparison so response time doesn't reveal whether the email exists.
  const ok = await verifyPassword(password, c ? c.passwordHash : await getDummyHash());
  if (!c || !ok) {
    loginThrottle.hit(key);
    return { ok: false, error: "That email and password don't match our records.", values };
  }
  loginThrottle.reset(key);
  return { ok: true, customer: c };
}

/** Always answers the same way, so it can't be used to discover accounts. */
export async function requestPasswordReset(rawEmail: unknown, ip: string, origin?: { host?: string | null; proto?: string | null }): Promise<{ ok: true; message: string } | ({ ok: false } & Problem)> {
  const email = normaliseEmail(String(rawEmail ?? "")).slice(0, 160);
  if (!EMAIL.test(email)) return { ok: false, error: "Enter a valid email address.", values: { email } };
  if (resetThrottle.blocked(ip)) return { ok: false, error: "Too many requests. Please try again later.", values: { email } };
  resetThrottle.hit(ip);
  const c = findCustomerByEmail(email);
  if (c) {
    const token = createResetToken(c.id);
    await sendMail({
      to: c.email,
      subject: "Reset your SARPECH password",
      text: `Reset your password within the next hour:\n${siteUrl(origin?.host, origin?.proto)}/account/reset?token=${token}\n\nIf you didn't ask for this, you can ignore this email.`,
    });
  }
  return { ok: true, message: "If an account exists for that email, a reset link is on its way. It expires in one hour." };
}

/* ───────────── Profile ───────────── */

export function updateProfile(c: CustomerRecord, raw: { name?: unknown; phone?: unknown; marketing?: unknown }): { ok: true } | ({ ok: false } & Problem) {
  const name = String(raw.name ?? "").trim().slice(0, 80);
  const phone = String(raw.phone ?? "").trim().slice(0, 20);
  const fieldErrors: Record<string, string> = {};
  if (name.length < 2) fieldErrors.name = "Please enter your name.";
  if (phone && !PHONE.test(phone)) fieldErrors.phone = "Enter a valid phone number, or leave it blank.";
  if (Object.keys(fieldErrors).length) return { ok: false, error: "Please check the highlighted fields.", fieldErrors, values: { name, phone } };
  updateCustomer(c.id, { name, phone, marketing: !!raw.marketing });
  return { ok: true };
}

/* ───────────── Addresses ───────────── */

export function cleanAddress(raw: Partial<Address>): { address?: Address; errors?: Record<string, string> } {
  const s = (v: unknown, n = 160) => String(v ?? "").trim().slice(0, n);
  const a: Address = {
    id: s(raw?.id, 40) || randomUUID(),
    label: s(raw?.label, 30) || "Home",
    firstName: s(raw?.firstName, 60),
    lastName: s(raw?.lastName, 60),
    phone: s(raw?.phone, 20),
    line1: s(raw?.line1),
    line2: s(raw?.line2),
    city: s(raw?.city, 60),
    state: s(raw?.state, 40),
    pin: s(raw?.pin, 6),
    isDefault: !!raw?.isDefault,
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

export function saveAddress(c: CustomerRecord, raw: Partial<Address>): { ok: true; addresses: Address[] } | { ok: false; fieldErrors: Record<string, string> } {
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

export function deleteAddress(c: CustomerRecord, id: string): Address[] {
  let list = c.addresses.filter((x) => x.id !== id);
  if (list.length && !list.some((x) => x.isDefault)) list = list.map((x, i) => ({ ...x, isDefault: i === 0 }));
  updateCustomer(c.id, { addresses: list });
  return list;
}

/* ───────────── Wishlist + Royal Fit sync ───────────── */

export interface AccountSnapshot {
  customer: CustomerPublic;
  wishlist: string[];
  fitProfile: FitProfile | null;
}

/**
 * Merge a device's wishlist and Royal Fit into the account and return the
 * result. Wishlists are unioned; the most recently updated Royal Fit wins.
 */
export function syncAccount(c: CustomerRecord, local: { wishlist?: unknown; fitProfile?: unknown }): AccountSnapshot {
  const incoming = (Array.isArray(local?.wishlist) ? local.wishlist : []).filter((s): s is string => typeof s === "string").map((s) => s.slice(0, 120));
  const wish = [...new Set([...(c.wishlist ?? []), ...incoming])].slice(0, 200);
  let fit = c.fitProfile;
  const lf = local?.fitProfile as FitProfile | null | undefined;
  if (lf && lf.version === 1 && validateMeasurements(lf.measurements ?? {}).ok && (!fit || new Date(lf.updatedAt) > new Date(fit.updatedAt))) fit = lf;
  updateCustomer(c.id, { wishlist: wish, fitProfile: fit });
  const fresh = findCustomer(c.id)!;
  return { customer: toPublicCustomer(fresh), wishlist: wish, fitProfile: fit };
}

export function snapshot(c: CustomerRecord): AccountSnapshot {
  return { customer: toPublicCustomer(c), wishlist: c.wishlist, fitProfile: c.fitProfile };
}
