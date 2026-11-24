import * as SecureStore from "expo-secure-store";
import { API_URL } from "./config";

/**
 * Client for the SARPECH mobile API (/api/mobile/v1). The session token lives
 * in the phone's secure storage (Keychain / Keystore) and travels as a bearer token.
 */
const TOKEN_KEY = "sarpech.session";
let token: string | null = null;
let loaded = false;

export async function getToken() {
  if (!loaded) {
    try {
      token = await SecureStore.getItemAsync(TOKEN_KEY);
    } catch {
      token = null;
    }
    loaded = true;
  }
  return token;
}

export async function setToken(next: string | null) {
  token = next;
  loaded = true;
  try {
    if (next) await SecureStore.setItemAsync(TOKEN_KEY, next);
    else await SecureStore.deleteItemAsync(TOKEN_KEY);
  } catch {
    /* secure storage unavailable: session lasts until the app closes */
  }
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public fieldErrors: Record<string, string> = {},
  ) {
    super(message);
  }
}

export async function api<T>(path: string, init: { method?: string; body?: unknown; auth?: boolean } = {}): Promise<T> {
  const headers: Record<string, string> = { accept: "application/json" };
  if (init.body !== undefined) headers["content-type"] = "application/json";
  const t = init.auth === false ? null : await getToken();
  if (t) headers.authorization = `Bearer ${t}`;
  let res: Response;
  try {
    res = await fetch(`${API_URL}/api/mobile/v1${path}`, {
      method: init.method ?? (init.body !== undefined ? "POST" : "GET"),
      headers,
      body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    });
  } catch {
    throw new ApiError("Can't reach SARPECH right now. Check your connection and try again.", 0);
  }
  const data = (await res.json().catch(() => ({}))) as T & { error?: string; fieldErrors?: Record<string, string> };
  if (!res.ok) throw new ApiError(data.error ?? "Something went wrong. Please try again.", res.status, data.fieldErrors ?? {});
  return data;
}
