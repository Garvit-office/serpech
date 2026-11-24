/**
 * Where the SARPECH server is. Set EXPO_PUBLIC_API_URL per build (eas.json does
 * this for every profile; locally use apps/mobile/.env.local). Simulators reach the
 * dev server on the Mac via localhost (Android: run `adb reverse tcp:3000 tcp:3000`
 * once). On a real phone use an https address — the camera Fit Check needs a
 * secure origin.
 */
const DEFAULT_URL = __DEV__ ? "http://localhost:3000" : "https://sarpech.in";
export const API_URL = (process.env.EXPO_PUBLIC_API_URL || DEFAULT_URL).replace(/\/$/, "");

/** Origin (scheme + host + port) of the SARPECH server. */
export const API_ORIGIN = new URL(API_URL).origin;

/** Absolute URL for a site path such as /media/abc.jpg. */
export const siteUrl = (path: string) => (/^https?:\/\//.test(path) ? path : `${API_URL}${path.startsWith("/") ? "" : "/"}${path}`);
