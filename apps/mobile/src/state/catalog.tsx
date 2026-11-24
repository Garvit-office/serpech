import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { Category, Product, StoreSettings } from "@sarpech/core/types";
import { api } from "@/lib/api";
import { KEYS, readJson, writeJson } from "@/lib/storage";

export interface CatalogData {
  products: Product[];
  categories: Category[];
  settings: StoreSettings;
  paymentMode: "razorpay" | "none";
  fetchedAt: string;
}

interface CatalogState {
  data: CatalogData | null;
  status: "loading" | "ready" | "offline";
  refreshing: boolean;
  refresh: () => Promise<void>;
  getProduct: (slug: string) => Product | undefined;
}

const Ctx = createContext<CatalogState | null>(null);

/** Products, categories and settings from the server; the last copy is kept for offline browsing. */
export function CatalogProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<CatalogData | null>(null);
  const [status, setStatus] = useState<CatalogState["status"]>("loading");
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const fresh = await api<CatalogData>("/catalog", { auth: false });
      setData(fresh);
      setStatus("ready");
      void writeJson(KEYS.catalog, fresh);
    } catch {
      setStatus((s) => (s === "ready" ? s : "offline"));
    }
  }, []);

  useEffect(() => {
    void (async () => {
      const cached = await readJson<CatalogData | null>(KEYS.catalog, null);
      if (cached?.products) {
        setData(cached);
        setStatus("ready");
      }
      await load();
    })();
  }, [load]);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const bySlug = useMemo(() => new Map((data?.products ?? []).map((p) => [p.slug, p])), [data]);
  const getProduct = useCallback((slug: string) => bySlug.get(slug), [bySlug]);
  const value = useMemo(() => ({ data, status, refreshing, refresh, getProduct }), [data, status, refreshing, refresh, getProduct]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCatalog() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCatalog outside CatalogProvider");
  return c;
}
