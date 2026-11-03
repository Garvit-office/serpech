"use client";

import { usePathname } from "next/navigation";
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { clearAccountFitProfile, removeFromAccountWishlist, syncAccountAction } from "@/app/actions/account";
import type { CustomerPublic } from "@/lib/types";
import { useFit } from "./fit";
import { useWishlist } from "./wishlist";

interface AccountState {
  /** false until the first check completes */
  ready: boolean;
  customer: CustomerPublic | null;
  refresh: () => Promise<void>;
}

const AccountContext = createContext<AccountState | null>(null);

/**
 * Signed-in customer for client components. Pages stay static and cacheable;
 * the session is looked up from the browser via /api/account/me.
 * While signed in, the wishlist and Royal Fit are kept in sync with the account.
 */
export function AccountProvider({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [customer, setCustomer] = useState<CustomerPublic | null>(null);
  const [ready, setReady] = useState(false);
  const wishlist = useWishlist();
  const fit = useFit();
  const synced = useRef<string | null>(null); // customer id we've merged with
  const lastWish = useRef<string[]>([]);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/account/me", { cache: "no-store" });
      const data = (await res.json()) as { customer: CustomerPublic | null };
      setCustomer(data.customer);
      if (!data.customer) synced.current = null;
    } catch {
      /* offline: keep last known state */
    } finally {
      setReady(true);
    }
  }, []);

  // Re-check on every navigation (sign-in / sign-out redirect through the router).
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- session check after navigation
    void refresh();
  }, [pathname, refresh]);

  // First sync after sign-in: merge this device into the account, then adopt the result.
  useEffect(() => {
    if (!customer || !wishlist.ready || !fit.ready || synced.current === customer.id) return;
    synced.current = customer.id;
    void syncAccountAction({ wishlist: wishlist.slugs, fitProfile: fit.profile }).then((snap) => {
      if (!snap) return;
      lastWish.current = snap.wishlist;
      wishlist.replace(snap.wishlist);
      if (snap.fitProfile && snap.fitProfile.updatedAt !== fit.profile?.updatedAt) fit.save(snap.fitProfile);
    });
  }, [customer, wishlist, fit]);

  // Ongoing: push wishlist changes (add + remove) and Royal Fit updates.
  useEffect(() => {
    if (!customer || synced.current !== customer.id) return;
    const removed = lastWish.current.filter((s) => !wishlist.slugs.includes(s));
    const added = wishlist.slugs.filter((s) => !lastWish.current.includes(s));
    lastWish.current = wishlist.slugs;
    removed.forEach((s) => void removeFromAccountWishlist(s));
    if (added.length) void syncAccountAction({ wishlist: wishlist.slugs });
  }, [customer, wishlist.slugs]);

  const lastFit = useRef<string | null | undefined>(undefined);
  useEffect(() => {
    if (!customer || synced.current !== customer.id) return;
    const stamp = fit.profile?.updatedAt ?? null;
    if (lastFit.current === undefined) {
      lastFit.current = stamp;
      return;
    }
    if (stamp === lastFit.current) return;
    lastFit.current = stamp;
    if (fit.profile) void syncAccountAction({ fitProfile: fit.profile });
    else void clearAccountFitProfile();
  }, [customer, fit.profile]);

  const value = useMemo(() => ({ ready, customer, refresh }), [ready, customer, refresh]);
  return <AccountContext.Provider value={value}>{children}</AccountContext.Provider>;
}

export function useAccount() {
  const ctx = useContext(AccountContext);
  if (!ctx) throw new Error("useAccount must be used inside <AccountProvider>");
  return ctx;
}
