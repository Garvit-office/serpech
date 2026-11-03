"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { effectivePrice } from "@/lib/catalog-shared";
import { MTM_SIZE, snapshotKey } from "@/lib/fit";
import { track } from "@/lib/track";
import type { Product as CatalogProduct } from "@/lib/types";
import { useCatalog } from "./catalog";
import type { CartLine, Product } from "@/lib/types";

const KEY = "sarpech.cart.v1";

export interface CartItem extends CartLine {
  product: Product;
  unitPrice: number;
  lineTotal: number;
}

interface CartState {
  ready: boolean;
  items: CartItem[];
  count: number;
  subtotal: number;
  shipping: number;
  total: number;
  isOpen: boolean;
  open: () => void;
  close: () => void;
  add: (line: Omit<CartLine, "qty"> & { qty?: number }, opts?: { openDrawer?: boolean }) => void;
  setQty: (key: string, qty: number) => void;
  remove: (key: string) => void;
  clear: () => void;
}

const CartContext = createContext<CartState | null>(null);

export const lineKey = (l: Pick<CartLine, "slug" | "size" | "color" | "fit">) =>
  `${l.slug}__${l.size}__${l.color}${l.fit ? `__${snapshotKey(l.fit)}` : ""}`;

function read(getProduct: (slug: string) => CatalogProduct | undefined): CartLine[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as CartLine[]) : [];
    return Array.isArray(parsed) ? parsed.filter((l) => getProduct(l.slug)) : [];
  } catch {
    return [];
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { getProduct, settings } = useCatalog();
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);
  const [isOpen, setOpen] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from storage after mount
    setLines(read(getProduct));
    setReady(true);
    const onStorage = (e: StorageEvent) => e.key === KEY && setLines(read(getProduct));
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [getProduct]);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(KEY, JSON.stringify(lines));
    } catch {
      /* storage unavailable: cart lives for this session only */
    }
  }, [lines, ready]);

  const add = useCallback<CartState["add"]>((line, opts) => {
    const qty = line.qty ?? 1;
    setLines((prev) => {
      const k = lineKey(line);
      const existing = prev.find((l) => lineKey(l) === k);
      if (existing) return prev.map((l) => (lineKey(l) === k ? { ...l, qty: Math.min(10, l.qty + qty) } : l));
      return [...prev, { productId: line.productId, slug: line.slug, size: line.size, color: line.color, qty, ...(line.fit ? { fit: line.fit } : {}) }];
    });
    track("add_to_cart", { slug: line.slug, size: line.size, color: line.color, qty, ...(line.fit ? { mtm: true, fit: line.fit.preferences.fit } : {}) });
    if (opts?.openDrawer !== false) setOpen(true);
  }, []);

  const setQty = useCallback((key: string, qty: number) => {
    setLines((prev) =>
      qty <= 0 ? prev.filter((l) => lineKey(l) !== key) : prev.map((l) => (lineKey(l) === key ? { ...l, qty: Math.min(10, qty) } : l)),
    );
  }, []);

  const open = useCallback(() => setOpen(true), []);
  const close = useCallback(() => setOpen(false), []);
  const remove = useCallback((key: string) => {
    track("remove_from_cart", { slug: key.split("__")[0] });
    setLines((prev) => prev.filter((l) => lineKey(l) !== key));
  }, []);
  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<CartState>(() => {
    const items: CartItem[] = lines.flatMap((l) => {
      const product = getProduct(l.slug);
      if (!product) return [];
      const unitPrice = effectivePrice(product) + (l.size === MTM_SIZE ? settings.madeToMeasureFee : 0);
      return [{ ...l, product, unitPrice, lineTotal: unitPrice * l.qty }];
    });
    const subtotal = items.reduce((s, i) => s + i.lineTotal, 0);
    const shipping = subtotal === 0 || subtotal >= settings.freeShippingThreshold ? 0 : settings.standardShipping;
    return {
      ready,
      items,
      count: items.reduce((s, i) => s + i.qty, 0),
      subtotal,
      shipping,
      total: subtotal + shipping,
      isOpen,
      open,
      close,
      add,
      setQty,
      remove,
      clear,
    };
  }, [lines, ready, isOpen, open, close, add, setQty, remove, clear, getProduct, settings]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
