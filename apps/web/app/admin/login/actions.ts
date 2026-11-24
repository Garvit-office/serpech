"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { audit } from "@sarpech/backend/activity";
import { ipFromHeaders } from "@sarpech/backend/throttle";
import { attemptLogin, authConfigured, loginBlocked, logout } from "@sarpech/backend/auth";

type LoginState = { error: string; email?: string } | null;

export async function loginAction(_prev: LoginState, form: FormData): Promise<LoginState> {
  if (!authConfigured()) {
    return { error: "Admin sign-in isn't configured. Set ADMIN_EMAIL, ADMIN_PASSWORD and ADMIN_SECRET." };
  }
  const ip = ipFromHeaders(await headers());
  const email = String(form.get("email") ?? "").slice(0, 200);
  if (loginBlocked(ip)) return { error: "Too many attempts. Try again in 10 minutes.", email };
  const ok = await attemptLogin(email, String(form.get("password") ?? ""), ip, form.get("remember") === "on");
  if (!ok) return { error: "Incorrect email or password.", email };

  audit(email, "login", "session", null, "Signed in");
  const next = String(form.get("next") ?? "/admin");
  redirect(next.startsWith("/admin") && !next.startsWith("//") ? next : "/admin");
}

export async function logoutAction() {
  await logout();
  redirect("/admin/login");
}
