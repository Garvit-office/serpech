import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { sanitiseDesign, type DesignSpec } from "@sarpech/core/designer";
import { validateMeasurements, type FitProfile } from "@sarpech/core/fit";
import { api } from "@/lib/api";
import { KEYS, readJson, writeJson } from "@/lib/storage";
import { useAccount } from "./account";

/* Wishlist, Royal Fit and saved designs: kept on the phone, synced to the account when signed in. */

interface PersonalState {
  wishlist: string[];
  isWished: (slug: string) => boolean;
  toggleWish: (slug: string) => void;
  fit: FitProfile | null;
  saveFit: (p: FitProfile) => void;
  clearFit: () => void;
  designs: { id: string; savedAt: string; spec: DesignSpec }[];
  saveDesign: (spec: DesignSpec, id?: string) => string;
  removeDesign: (id: string) => void;
}

const Ctx = createContext<PersonalState | null>(null);

export function PersonalProvider({ children }: { children: ReactNode }) {
  const { customer, syncStamp } = useAccount();
  const signedIn = !!customer;
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [fit, setFit] = useState<FitProfile | null>(null);
  const [designs, setDesigns] = useState<PersonalState["designs"]>([]);

  // Load (and reload after an account sync).
  useEffect(() => {
    void (async () => {
      const [w, f, d] = await Promise.all([
        readJson<string[]>(KEYS.wishlist, []),
        readJson<FitProfile | null>(KEYS.fit, null),
        readJson<PersonalState["designs"]>(KEYS.designs, []),
      ]);
      setWishlist(Array.isArray(w) ? w.filter((s) => typeof s === "string") : []);
      setFit(f && f.version === 1 && validateMeasurements(f.measurements).ok ? f : null);
      setDesigns((Array.isArray(d) ? d : []).flatMap((x) => {
        const spec = sanitiseDesign(x?.spec);
        return spec ? [{ id: String(x.id), savedAt: String(x.savedAt), spec }] : [];
      }));
    })();
  }, [syncStamp]);

  const toggleWish = useCallback(
    (slug: string) => {
      setWishlist((prev) => {
        const next = prev.includes(slug) ? prev.filter((s) => s !== slug) : [slug, ...prev];
        void writeJson(KEYS.wishlist, next);
        if (signedIn) void api("/me/wishlist", { method: "PUT", body: { slugs: next } }).catch(() => undefined);
        return next;
      });
    },
    [signedIn],
  );

  const saveFit = useCallback(
    (p: FitProfile) => {
      setFit(p);
      void writeJson(KEYS.fit, p);
      if (signedIn) void api("/me/fit", { method: "PUT", body: { profile: p } }).catch(() => undefined);
    },
    [signedIn],
  );
  const clearFit = useCallback(() => {
    setFit(null);
    void writeJson(KEYS.fit, null);
    if (signedIn) void api("/me/fit", { method: "PUT", body: { profile: null } }).catch(() => undefined);
  }, [signedIn]);

  const saveDesign = useCallback((spec: DesignSpec, id?: string) => {
    const entry = { id: id ?? `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, savedAt: new Date().toISOString(), spec };
    setDesigns((prev) => {
      const next = [entry, ...prev.filter((d) => d.id !== entry.id)].slice(0, 24);
      void writeJson(KEYS.designs, next);
      return next;
    });
    return entry.id;
  }, []);
  const removeDesign = useCallback((id: string) => {
    setDesigns((prev) => {
      const next = prev.filter((d) => d.id !== id);
      void writeJson(KEYS.designs, next);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({ wishlist, isWished: (s: string) => wishlist.includes(s), toggleWish, fit, saveFit, clearFit, designs, saveDesign, removeDesign }),
    [wishlist, toggleWish, fit, saveFit, clearFit, designs, saveDesign, removeDesign],
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function usePersonal() {
  const c = useContext(Ctx);
  if (!c) throw new Error("usePersonal outside PersonalProvider");
  return c;
}
