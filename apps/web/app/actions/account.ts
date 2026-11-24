"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import type { FitProfile } from "@sarpech/core/fit";
import type { Address } from "@sarpech/core/types";
import {
  authenticate,
  deleteAddress,
  registerCustomer,
  requestPasswordReset,
  saveAddress,
  syncAccount,
  updateProfile,
  type AccountSnapshot,
} from "@sarpech/backend/account-core";
import { clientIp, currentCustomer, currentToken, endSession, startSession } from "@sarpech/backend/customer-auth";
import { consumeResetToken, deleteCustomer, deleteOtherSessions, passwordProblem, setPassword, updateCustomer, verifyPassword } from "@sarpech/backend/customers";

/* Website account actions (cookie sessions). The rules live in lib/server/account-core.ts, shared with the mobile API. */

export type { AccountSnapshot };

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
  const res = await registerCustomer(
    {
      name: form.get("name"),
      email: form.get("email"),
      phone: form.get("phone"),
      password: form.get("password"),
      marketing: form.get("marketing") === "on",
      terms: form.get("terms") === "on",
    },
    await clientIp(),
  );
  if (!res.ok) return { error: res.error, fieldErrors: res.fieldErrors, values: res.values };
  await startSession(res.customer.id, true);
  redirect(safeNext(form.get("next"), "/account?welcome=1"));
}

export async function signInAction(_prev: AuthState, form: FormData): Promise<AuthState> {
  const res = await authenticate(form.get("email"), form.get("password"), await clientIp());
  if (!res.ok) return { error: res.error, values: res.values };
  await startSession(res.customer.id, form.get("remember") === "on");
  redirect(safeNext(form.get("next")));
}

export async function signOutAction() {
  await endSession();
  redirect("/");
}

export async function requestResetAction(_prev: AuthState, form: FormData): Promise<AuthState> {
  const h = await headers();
  const res = await requestPasswordReset(form.get("email"), await clientIp(), { host: h.get("host"), proto: h.get("x-forwarded-proto") });
  const values = { email: String(form.get("email") ?? "") };
  return res.ok ? { ok: true, message: res.message, values } : { error: res.error, values };
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
  const res = updateProfile(c, { name: form.get("name"), phone: form.get("phone"), marketing: form.get("marketing") === "on" });
  const values = { name: String(form.get("name") ?? "").trim(), phone: String(form.get("phone") ?? "").trim() };
  return res.ok ? { ok: true, message: "Your details are saved.", values } : { error: res.error, fieldErrors: res.fieldErrors, values: res.values };
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

export async function saveAddressAction(raw: Partial<Address>): Promise<{ ok: true; addresses: Address[] } | { ok: false; fieldErrors: Record<string, string> }> {
  return saveAddress(await me(), raw);
}

export async function deleteAddressAction(id: string): Promise<{ ok: true; addresses: Address[] }> {
  return { ok: true, addresses: deleteAddress(await me(), id) };
}

export async function deleteAccountAction(_prev: AuthState, form: FormData): Promise<AuthState> {
  const c = await me();
  if (!(await verifyPassword(String(form.get("password") ?? ""), c.passwordHash))) return { error: "Incorrect password." };
  await endSession();
  deleteCustomer(c.id);
  redirect("/?account-deleted=1");
}

/* ───────────── Sync between this device and the account ───────────── */

export async function syncAccountAction(local: { wishlist?: string[]; fitProfile?: FitProfile | null }): Promise<AccountSnapshot | null> {
  const c = await currentCustomer();
  return c ? syncAccount(c, local) : null;
}

/** Explicit removal (sync only adds). */
export async function removeFromAccountWishlist(slug: string) {
  const c = await currentCustomer();
  if (c) updateCustomer(c.id, { wishlist: c.wishlist.filter((s) => s !== slug) });
}

export async function clearAccountFitProfile() {
  const c = await currentCustomer();
  if (c) updateCustomer(c.id, { fitProfile: null });
}
