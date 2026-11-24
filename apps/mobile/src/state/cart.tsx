import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { effectivePrice } from "@sarpech/core/catalog";
import { designProduct, sanitiseDesign } from "@sarpech/core/designer";
import { MTM_SIZE, snapshotKey } from "@sarpech/core/fit";
import type { CartLine, Product } from "@sarpech/core/types";
import { KEYS, readJson, writeJson } from "@/lib/storage";
import { useCatalog } from "./catalog";

export interface CartItem extends CartLine {
  key: string;
  product: Product;
  unitPrice: number;
  lineTotal: number;
}

interface CartState {
  items: CartItem[];
  count: number;
  subtotal: number;
  add: (line: Omit<CartLine, "qty"> & { qty?: number }) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
  /** Lines in the shape the server's checkout expects. */
  lines: () => Pick<CartLine, "slug" | "size" | "color" | "qty" | "fit" | "design">[];
}

const Ctx = createContext<CartState | null>(null);

/** Same key rule as the website's bag, so a piece in one size/colour/fit/design is one line. */
export const lineKey = (l: Pick<CartLine, "slug" | "size" | "color" | "fit">) => `${l.slug}__${l.size}__${l.color}${l.fit ? `__${snapshotKey(l.fit)}` : ""}`;

export function CartProvider({ children }: { children: ReactNode }) {
  const { data, getProduct } = useCatalog();
  const [lines, setLines] = useState<CartLine[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    void readJson<CartLine[]>(KEYS.cart, []).then((saved) => {
      setLines(
        (Array.isArray(saved) ? saved : []).flatMap((l) => {
          if (l.design === undefined) return [l];
          const design = sanitiseDesign(l.design);
          return design ? [{ ...l, design }] : [];
        }),
      );
      setLoaded(true);
    });
  }, []);
  useEffect(() => {
    if (loaded) void writeJson(KEYS.cart, lines);
  }, [lines, loaded]);

  const add = useCallback<CartState["add"]>((line) => {
    const qty = line.qty ?? 1;
    setLines((prev) => {
      const k = lineKey(line);
      if (prev.some((l) => lineKey(l) === k)) return prev.map((l) => (lineKey(l) === k ? { ...l, qty: Math.min(10, l.qty + qty) } : l));
      return [...prev, { ...line, qty }];
    });
  }, []);
  const setQty = useCallback((key: string, qty: number) => {
    setLines((prev) => (qty <= 0 ? prev.filter((l) => lineKey(l) !== key) : prev.map((l) => (lineKey(l) === key ? { ...l, qty: Math.min(10, qty) } : l))));
  }, []);
  const remove = useCallback((key: string) => setLines((prev) => prev.filter((l) => lineKey(l) !== key)), []);
  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<CartState>(() => {
    const fee = data?.settings.madeToMeasureFee ?? 0;
    const items = lines.flatMap((l) => {
      const product = l.design ? designProduct(l.design) : getProduct(l.slug);
      if (!product) return [];
      const unitPrice = effectivePrice(product) + (l.size === MTM_SIZE && !l.design ? fee : 0);
      return [{ ...l, key: lineKey(l), product, unitPrice, lineTotal: unitPrice * l.qty }];
    });
    return {
      items,
      count: items.reduce((s, i) => s + i.qty, 0),
      subtotal: items.reduce((s, i) => s + i.lineTotal, 0),
      add,
      setQty,
      remove,
      clear,
      lines: () => items.map(({ slug, size, color, qty, fit, design }) => ({ slug, size, color, qty, fit, design })),
    };
  }, [lines, data, getProduct, add, setQty, remove, clear]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useCart outside CartProvider");
  return c;
}
