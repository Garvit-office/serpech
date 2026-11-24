import { Linking } from "react-native";
import type { ShouldStartLoadRequest } from "react-native-webview/lib/WebViewTypes";

/** Parse a postMessage payload from a WebView; null if it isn't a JSON object with a `type`. */
export function parseMessage<T extends { type: string }>(data: string): T | null {
  try {
    const v = JSON.parse(data) as unknown;
    return v && typeof v === "object" && typeof (v as { type?: unknown }).type === "string" ? (v as T) : null;
  } catch {
    return null;
  }
}

/** Same origin as `origin` (scheme + host + port). */
export function sameOrigin(url: string, origin: string) {
  try {
    return new URL(url).origin === origin;
  } catch {
    return false;
  }
}

/**
 * Turn an Android `intent://…#Intent;scheme=upi;package=…;end` link into the
 * URL the app should open (upi://…), or its browser fallback.
 */
function fromIntent(url: string) {
  const [, rest = ""] = url.split("intent://");
  const [path, fragment = ""] = rest.split("#Intent;");
  const params = Object.fromEntries(
    fragment
      .split(";")
      .map((kv) => kv.split("="))
      .filter(([k, v]) => k && v),
  ) as Record<string, string>;
  return { app: params.scheme ? `${params.scheme}://${path}` : null, fallback: params["S.browser_fallback_url"] ? decodeURIComponent(params["S.browser_fallback_url"]) : null };
}

/**
 * WebView navigation guard for payment pages: web pages load inside the view;
 * app links (upi://, phonepe://, tez://, paytmmp://, intent://, tel:, mailto:…)
 * open the matching app on the phone instead of failing inside the WebView.
 */
export function openAppLinks(req: ShouldStartLoadRequest) {
  const { url } = req;
  if (/^(https?|about|data|blob|javascript):/i.test(url)) return true;
  if (/^intent:/i.test(url)) {
    const { app, fallback } = fromIntent(url);
    const openFallback = () => {
      if (fallback) Linking.openURL(fallback).catch(() => {});
    };
    if (app) Linking.openURL(app).catch(openFallback);
    else openFallback();
    return false;
  }
  Linking.openURL(url).catch(() => {});
  return false;
}
