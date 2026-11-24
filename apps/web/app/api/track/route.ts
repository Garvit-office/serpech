import { NextResponse, type NextRequest } from "next/server";
import { TRACK_TYPES, recordEvent } from "@sarpech/backend/activity";
import type { TrackEventType } from "@sarpech/core/types";

const BOT = /bot|crawl|spider|slurp|headless|lighthouse|preview/i;

function device(ua: string) {
  if (/ipad|tablet/i.test(ua)) return "tablet";
  if (/mobi|android|iphone/i.test(ua)) return "mobile";
  return "desktop";
}

/** Storefront activity beacon. Accepts small JSON bodies; ignores bots. */
export async function POST(req: NextRequest) {
  const ua = req.headers.get("user-agent") ?? "";
  if (BOT.test(ua)) return new NextResponse(null, { status: 204 });
  let body: { type?: string; sessionId?: string; path?: string; referrer?: string | null; data?: Record<string, unknown> | null };
  try {
    const text = await req.text();
    if (text.length > 4000) return new NextResponse(null, { status: 413 });
    body = JSON.parse(text);
  } catch {
    return new NextResponse(null, { status: 400 });
  }
  if (!body.type || !TRACK_TYPES.includes(body.type as TrackEventType)) return new NextResponse(null, { status: 400 });
  // Same-site referrers are noise; keep only external sources.
  const ref = body.referrer && !body.referrer.startsWith(req.nextUrl.origin) ? body.referrer : null;
  recordEvent({
    type: body.type as TrackEventType,
    sessionId: typeof body.sessionId === "string" ? body.sessionId : null,
    path: typeof body.path === "string" ? body.path : null,
    device: device(ua),
    referrer: ref,
    data: body.data && typeof body.data === "object" ? body.data : null,
  });
  return new NextResponse(null, { status: 204 });
}
