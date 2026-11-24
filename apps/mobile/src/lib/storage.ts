import AsyncStorage from "@react-native-async-storage/async-storage";

/** Small JSON helpers over AsyncStorage. Failures fall back silently — the app keeps working for the session. */
export async function readJson<T>(key: string, fallback: T): Promise<T> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

export async function writeJson(key: string, value: unknown) {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable */
  }
}

export const KEYS = {
  catalog: "sarpech.catalog.v1",
  cart: "sarpech.cart.v1",
  wishlist: "sarpech.wishlist.v1",
  fit: "sarpech.royalfit.v1",
  designs: "sarpech.designs.v1",
  address: "sarpech.checkout.address.v1",
};
