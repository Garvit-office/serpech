"use client";

import type { TrackEventType } from "./types";

const SID_KEY = "sarpech.sid";

/** Anonymous per-browser id used to group activity into visits. */
export function sessionId(): string {
  try {
    let id = localStorage.getItem(SID_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(SID_KEY, id);
    }
    return id;
  } catch {
    return "anonymous";
  }
}

/** Fire-and-forget activity event for the admin dashboard. Never blocks the UI. */
export function track(type: TrackEventType, data?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  const body = JSON.stringify({
    type,
    sessionId: sessionId(),
    path: location.pathname + location.search,
    referrer: document.referrer || null,
    data: data ?? null,
  });
  try {
    if (navigator.sendBeacon?.(new URL("/api/track", location.origin), new Blob([body], { type: "application/json" }))) return;
  } catch {
    /* fall through */
  }
  fetch("/api/track", { method: "POST", body, headers: { "content-type": "application/json" }, keepalive: true }).catch(() => {});
}
