"use client";

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { Product, StoreSettings } from "@sarpech/core/types";

interface CatalogState {
  products: Product[];
  settings: StoreSettings;
  getProduct: (slug: string) => Product | undefined;
}

const CatalogContext = createContext<CatalogState | null>(null);

/** Server-provided catalogue (with live sale prices) and store settings for client components. */
export function CatalogProvider({ products, settings, children }: { products: Product[]; settings: StoreSettings; children: ReactNode }) {
  const value = useMemo(() => {
    const bySlug = new Map(products.map((p) => [p.slug, p]));
    return { products, settings, getProduct: (slug: string) => bySlug.get(slug) };
  }, [products, settings]);
  return <CatalogContext.Provider value={value}>{children}</CatalogContext.Provider>;
}

export function useCatalog() {
  const ctx = useContext(CatalogContext);
  if (!ctx) throw new Error("useCatalog must be used inside <CatalogProvider>");
  return ctx;
}
