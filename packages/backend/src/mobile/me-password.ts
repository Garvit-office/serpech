/* Mobile API v1 — me/password. Mounted by apps/web/app/api/mobile/v1/me/password/route.ts. */
import type { NextRequest } from "next/server";
import { deleteOtherSessions, passwordProblem, setPassword, verifyPassword } from "../customers";
import { bearerToken, fail, json, readJson, withCustomer } from "../mobile-api";

/** Change password; every other session (web and app) is signed out. */
export const POST = withCustomer(async (req: NextRequest, c) => {
  const body = await readJson(req);
  if (!(await verifyPassword(String(body?.current ?? ""), c.passwordHash))) return fail(403, "Your current password is incorrect.", { fieldErrors: { current: "Incorrect password." } });
  const next = String(body?.password ?? "");
  const pw = passwordProblem(next);
  if (pw) return fail(422, pw, { fieldErrors: { password: pw } });
  await setPassword(c.id, next);
  deleteOtherSessions(c.id, bearerToken(req));
  return json({ ok: true, message: "Password changed. Other devices have been signed out." });
});
