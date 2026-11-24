import "server-only";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import { ipFromHeaders } from "./throttle";
import { CUSTOMER_COOKIE, createSession, customerForToken, deleteSession, type CustomerRecord } from "./customers";

/** Signed-in customer for this request, or null. */
export async function currentCustomer(): Promise<CustomerRecord | null> {
  const token = (await cookies()).get(CUSTOMER_COOKIE)?.value;
  await connection(); // session expiry is checked against the current time
  return customerForToken(token);
}

/** For account pages: redirect to sign-in (and back afterwards) when signed out. */
export async function requireCustomer(next = "/account"): Promise<CustomerRecord> {
  const c = await currentCustomer();
  if (!c) redirect(`/account/login?next=${encodeURIComponent(next)}`);
  return c;
}

export async function startSession(customerId: string, remember: boolean) {
  const ua = (await headers()).get("user-agent");
  const { token, expires } = createSession(customerId, ua, remember ? 30 : 1);
  (await cookies()).set(CUSTOMER_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    // "Keep me signed in" → persistent cookie; otherwise a browser-session cookie
    ...(remember ? { expires } : {}),
  });
}

export async function endSession() {
  const jar = await cookies();
  deleteSession(jar.get(CUSTOMER_COOKIE)?.value);
  jar.delete(CUSTOMER_COOKIE);
}

export async function currentToken() {
  return (await cookies()).get(CUSTOMER_COOKIE)?.value;
}

export async function clientIp() {
  return ipFromHeaders(await headers());
}
