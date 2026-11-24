"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { validateMeasurements, type FitProfile } from "@sarpech/core/fit";
import type { Product } from "@sarpech/core/types";

const KEY = "sarpech.royalfit.v1";

interface WizardRequest {
  /** Product the customer is sizing, for an in-context recommendation. */
  product?: Product;
  /** Called when the customer picks a size or made-to-measure from the result. */
  onChoose?: (choice: { size?: string; madeToMeasure?: boolean }) => void;
}

interface FitState {
  ready: boolean;
  profile: FitProfile | null;
  save: (p: FitProfile) => void;
  clear: () => void;
  wizard: WizardRequest | null;
  openWizard: (req?: WizardRequest) => void;
  closeWizard: () => void;
}

const FitContext = createContext<FitState | null>(null);

function read(): FitProfile | null {
  try {
    const p = JSON.parse(localStorage.getItem(KEY) ?? "null") as FitProfile | null;
    return p && p.version === 1 && validateMeasurements(p.measurements).ok ? p : null;
  } catch {
    return null;
  }
}

/** The customer's Royal Fit profile, kept on this device only. */
export function FitProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<FitProfile | null>(null);
  const [ready, setReady] = useState(false);
  const [wizard, setWizard] = useState<WizardRequest | null>(null);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from storage after mount
    setProfile(read());
    setReady(true);
    const onStorage = (e: StorageEvent) => e.key === KEY && setProfile(read());
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const save = useCallback((p: FitProfile) => {
    setProfile(p);
    try {
      localStorage.setItem(KEY, JSON.stringify(p));
    } catch {
      /* storage unavailable: profile lasts for this visit */
    }
  }, []);

  const clear = useCallback(() => {
    setProfile(null);
    try {
      localStorage.removeItem(KEY);
    } catch {
      /* ignore */
    }
  }, []);

  const openWizard = useCallback((req: WizardRequest = {}) => setWizard(req), []);
  const closeWizard = useCallback(() => setWizard(null), []);

  const value = useMemo(
    () => ({ ready, profile, save, clear, wizard, openWizard, closeWizard }),
    [ready, profile, save, clear, wizard, openWizard, closeWizard],
  );
  return <FitContext.Provider value={value}>{children}</FitContext.Provider>;
}

export function useFit() {
  const ctx = useContext(FitContext);
  if (!ctx) throw new Error("useFit must be used inside <FitProvider>");
  return ctx;
}
