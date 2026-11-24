/* Mobile API v1 — auth/logout. Mounted by apps/web/app/api/mobile/v1/auth/logout/route.ts. */
import type { NextRequest } from "next/server";
import { json, revokeToken } from "../mobile-api";

export async function POST(req: NextRequest) {
  revokeToken(req);
  return json({ ok: true });
}
