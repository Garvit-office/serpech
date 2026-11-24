"use client";

import { useCallback, useEffect, useState } from "react";
import { sanitiseDesign, type DesignSpec } from "@sarpech/core/designer";

/** Designs saved on this device (Design Studio → "Save design"). */
export interface SavedDesign {
  id: string;
  savedAt: string;
  spec: DesignSpec;
}

const KEY = "sarpech.designs.v1";
const MAX = 24;

function read(): SavedDesign[] {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "[]") as SavedDesign[];
    return Array.isArray(raw)
      ? raw.flatMap((d) => {
          const spec = sanitiseDesign(d?.spec);
          return spec && typeof d.id === "string" ? [{ id: d.id, savedAt: String(d.savedAt), spec }] : [];
        })
      : [];
  } catch {
    return [];
  }
}

export function useSavedDesigns() {
  const [designs, setDesigns] = useState<SavedDesign[]>([]);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from storage after mount
    setDesigns(read());
  }, []);

  const persist = useCallback((next: SavedDesign[]) => {
    setDesigns(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* storage unavailable: kept for this visit */
    }
  }, []);

  const save = useCallback(
    (spec: DesignSpec, id?: string) => {
      const entry: SavedDesign = { id: id ?? `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, savedAt: new Date().toISOString(), spec };
      persist([entry, ...read().filter((d) => d.id !== entry.id)].slice(0, MAX));
      return entry.id;
    },
    [persist],
  );
  const remove = useCallback((id: string) => persist(read().filter((d) => d.id !== id)), [persist]);

  return { designs, save, remove };
}
