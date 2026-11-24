import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { FitProfile } from "@sarpech/core/fit";
import type { Address, CustomerPublic } from "@sarpech/core/types";
import { api, getToken, setToken } from "@/lib/api";
import { KEYS, readJson, writeJson } from "@/lib/storage";

interface Snapshot {
  customer: CustomerPublic;
  wishlist: string[];
  fitProfile: FitProfile | null;
}

interface AccountState {
  ready: boolean;
  customer: CustomerPublic | null;
  /** Bumps after the account and this phone are merged, so wishlist/fit reload from storage. */
  syncStamp: number;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (fields: { name: string; email: string; phone: string; password: string; marketing: boolean; terms: boolean }) => Promise<void>;
  signOut: () => Promise<void>;
  setCustomer: (c: CustomerPublic) => void;
  setAddresses: (a: Address[]) => void;
}

const Ctx = createContext<AccountState | null>(null);

/** Signed-in customer. Wishlist and Royal Fit are merged with the account on sign-in and on launch. */
export function AccountProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [customer, setCustomer] = useState<CustomerPublic | null>(null);
  const [syncStamp, setSyncStamp] = useState(0);

  const sync = useCallback(async () => {
    const [wishlist, fitProfile] = await Promise.all([readJson<string[]>(KEYS.wishlist, []), readJson<FitProfile | null>(KEYS.fit, null)]);
    const snap = await api<Snapshot>("/me/sync", { method: "PUT", body: { wishlist, fitProfile } });
    setCustomer(snap.customer);
    await Promise.all([writeJson(KEYS.wishlist, snap.wishlist), writeJson(KEYS.fit, snap.fitProfile)]);
    setSyncStamp((n) => n + 1);
  }, []);

  useEffect(() => {
    void (async () => {
      if (await getToken()) {
        try {
          await sync();
        } catch (e) {
          if ((e as { status?: number }).status === 401) await setToken(null);
        }
      }
      setReady(true);
    })();
  }, [sync]);

  const start = useCallback(
    async (res: { token: string } & Snapshot) => {
      await setToken(res.token);
      setCustomer(res.customer);
      await sync();
    },
    [sync],
  );

  const signIn = useCallback(async (email: string, password: string) => start(await api("/auth/login", { body: { email, password }, auth: false })), [start]);
  const signUp = useCallback<AccountState["signUp"]>(async (fields) => start(await api("/auth/register", { body: fields, auth: false })), [start]);
  const signOut = useCallback(async () => {
    try {
      await api("/auth/logout", { method: "POST" });
    } catch {
      /* already signed out on the server */
    }
    await setToken(null);
    setCustomer(null);
  }, []);
  const setAddresses = useCallback((addresses: Address[]) => setCustomer((c) => (c ? { ...c, addresses } : c)), []);

  const value = useMemo(
    () => ({ ready, customer, syncStamp, signIn, signUp, signOut, setCustomer, setAddresses }),
    [ready, customer, syncStamp, signIn, signUp, signOut, setAddresses],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAccount() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAccount outside AccountProvider");
  return c;
}
