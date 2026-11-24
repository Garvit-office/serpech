import type { DesignSpec } from "./designer";
import type { FitSnapshot } from "./fit";

/**
 * Catalogue types. These mirror the shape a headless CMS or Shopify
 * Storefront query would be mapped into, so the UI never depends on the
 * mock data directly — only on lib/catalog.ts.
 */

export type CategorySlug =
  | "sherwanis"
  | "bandhgalas"
  | "kurtas"
  | "nehru-jackets"
  | "shirts"
  | "polos"
  | "t-shirts"
  | "trousers"
  | "accessories";

export type Occasion = "wedding" | "reception" | "festive" | "workwear" | "everyday" | "travel";

export type ProductTag = "new" | "bestseller" | "wedding-edit";

export interface ProductColor {
  name: string;
  hex: string;
  /** Optional per-colour photography; overrides product.images when present. */
  images?: string[];
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  category: CategorySlug;
  subcategory?: string;
  /** Price in INR (whole rupees). */
  price: number;
  /** Computed from active Sales (admin) — never stored on the product. */
  salePrice?: number;
  /** Badge text of the sale that produced salePrice. */
  saleLabel?: string;
  sizes: string[];
  colors: ProductColor[];
  fabric: string;
  description: string;
  details: string[];
  care: string[];
  tags: ProductTag[];
  occasions: Occasion[];
  /**
   * Product photography, in gallery order (front, back, detail, …).
   * e.g. ["/products/maharaja-ivory-sherwani/front.jpg"]. Until images are
   * added a branded placeholder is shown.
   */
  images?: string[];
  /** Slugs of products to show under "Complete the Look". */
  completeTheLook?: string[];
  /** Only on the stand-in product built for a Design Studio piece (see designProduct). */
  design?: DesignSpec;
  /** Offer made-to-measure (Royal Fit). Undefined = category default (see lib/fit.ts). */
  madeToMeasure?: boolean;
  /**
   * Units in stock per size, e.g. { "40": 3, "42": 0 }. A size with no entry is
   * not tracked (always available). Made-to-measure never uses stock.
   */
  stock?: Record<string, number>;
}

export interface Category {
  slug: CategorySlug;
  name: string;
  short: string;
  description: string;
  /** Optional tile image for category cards. */
  image?: string;
}

export interface CartLine {
  productId: string;
  slug: string;
  size: string;
  color: string;
  qty: number;
  /** Present when size is "Made to Measure": the customer's Royal Fit measurements. */
  fit?: FitSnapshot;
  /** Present for Design Studio pieces: the customer's design (slug is "design-<garment>"). */
  design?: DesignSpec;
}

/* ───────────── Commerce & admin ───────────── */

export type ProductStatus = "active" | "draft";

export interface AdminProduct extends Product {
  status: ProductStatus;
  sort: number;
  createdAt: string;
  updatedAt: string;
}

export interface Coupon {
  id: string;
  code: string;
  description: string;
  type: "percent" | "fixed";
  /** Percent (0–100) or rupees. */
  value: number;
  minOrder: number;
  maxUses: number | null;
  uses: number;
  /** Restrict to these categories; null = whole order. */
  categories: CategorySlug[] | null;
  startsAt: string | null;
  endsAt: string | null;
  active: boolean;
  createdAt: string;
}

export interface Sale {
  id: string;
  name: string;
  /** Badge shown on product cards, e.g. "Festive Sale". */
  badge: string;
  percent: number;
  scope: "all" | "categories" | "products";
  /** Category slugs or product slugs, depending on scope. */
  targets: string[];
  startsAt: string | null;
  endsAt: string | null;
  active: boolean;
  createdAt: string;
}

export type OrderStatus = "placed" | "paid" | "processing" | "shipped" | "delivered" | "cancelled" | "refunded";

export interface OrderItem {
  productId: string;
  slug: string;
  name: string;
  size: string;
  color: string;
  qty: number;
  unitPrice: number;
  listPrice: number;
  /** Made-to-measure surcharge included in unitPrice. */
  mtmFee?: number;
  fit?: FitSnapshot;
  /** Design Studio piece: the full design for the atelier. */
  design?: DesignSpec;
}

export interface OrderCustomer {
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pin: string;
}

export interface Order {
  id: string;
  createdAt: string;
  status: OrderStatus;
  customer: OrderCustomer;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  couponCode: string | null;
  shipping: number;
  shippingMethod: "standard" | "express";
  total: number;
  sessionId: string | null;
  notes: string;
  /** Signed-in customer who placed the order (null for guest checkout). */
  customerId?: string | null;
  /** Razorpay order id while payment is pending or after it is taken (null when payments are off). */
  paymentRef?: string | null;
  /** Razorpay payment id once paid. */
  paymentId?: string | null;
}

export type TrackEventType =
  | "page_view"
  | "product_view"
  | "add_to_cart"
  | "remove_from_cart"
  | "wishlist_add"
  | "search"
  | "checkout_start"
  | "coupon_applied"
  | "coupon_failed"
  | "order_placed"
  | "order_paid"
  | "newsletter_signup"
  | "fitting_request"
  | "fit_profile_saved";

export interface ActivityEvent {
  id: number;
  ts: string;
  type: TrackEventType;
  sessionId: string | null;
  path: string | null;
  device: string | null;
  referrer: string | null;
  data: Record<string, unknown> | null;
}

export interface AuditEntry {
  id: number;
  ts: string;
  actor: string;
  action: string;
  entity: string;
  entityId: string | null;
  summary: string;
}

export type FittingStatus = "new" | "contacted" | "booked" | "closed";

export interface FittingRequest {
  id: string;
  createdAt: string;
  status: FittingStatus;
  data: Record<string, string>;
}

export interface StoreSettings {
  announcement: string;
  freeShippingThreshold: number;
  standardShipping: number;
  expressShipping: number;
  /** Surcharge per made-to-measure piece (INR). */
  madeToMeasureFee: number;
  /** Extra days to dispatch made-to-measure pieces. */
  madeToMeasureDays: number;
}

/* ───────────── Customer accounts ───────────── */

export interface Address {
  id: string;
  label: string;
  firstName: string;
  lastName: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pin: string;
  isDefault: boolean;
}

/** Customer as exposed to the browser (never includes the password hash). */
export interface CustomerPublic {
  id: string;
  email: string;
  name: string;
  phone: string;
  addresses: Address[];
  marketing: boolean;
  createdAt: string;
}
