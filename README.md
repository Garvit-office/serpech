# SARPECH — Royal Heritage Wear

E-commerce storefront for **SARPECH (सरपेच)**, a luxury Indian menswear label. *Crowned in Heritage.*

Next.js 16 (App Router) · TypeScript · Tailwind CSS v4 · SQLite (Node's built-in driver). Cart and wishlist live in the browser; products, sales, coupons, orders and activity live in the database and are managed at **`/admin`**.

## Run it

```bash
npm install
npm run dev          # http://localhost:3000
npm run build && npm start   # production
npm run lint
```

Requires **Node 22.13+** (uses the built-in `node:sqlite`). On first start the database is created at `storage/sarpech.db` and filled with the sample catalogue.

Copy `.env.example` to `.env.local` and set the values — see [Admin](#admin).

## Admin

Sign in at **`/admin`**. In development the defaults are `admin@sarpech.in` / `sarpech-admin`; in production you **must** set `ADMIN_EMAIL`, `ADMIN_PASSWORD` and `ADMIN_SECRET` (32+ random characters) or sign-in stays disabled. Sessions last 12 hours; failed sign-ins are throttled (5 per 10 minutes).

| Section | What it does |
| --- | --- |
| Dashboard | Revenue, orders, AOV, visitors, conversion, funnel, top products/searches/pages, devices, coupon performance, live activity |
| Orders | List, search, filter by status, CSV export, detail with status updates, notes, customer journey, packing slip |
| Products | Add / edit / duplicate / publish / delete, image upload, sizes, colours (with per-colour photos), tags, Complete-the-Look |
| Sales | % off the whole store, chosen categories or chosen products, with start/end times. Shown as badges + sale prices storewide |
| Coupons | Percent or fixed codes, minimum order, usage limits, category restrictions, start/end times, pause |
| Activity | Every storefront event (page views, product views, add to cart, searches, checkouts, coupons, orders) by visitor, plus the admin audit log |
| Inbox | Fitting requests (with status) and newsletter subscribers (CSV export) |
| Settings | Announcement bar, free-shipping threshold, shipping fees, activity retention |

Prices are always recalculated on the server at checkout (sale + coupon + shipping); the browser never decides what a customer pays.

### Data & deployment

Everything is stored under `storage/` (override with `SARPECH_DATA_DIR`): `sarpech.db` and `uploads/` (served at `/media/...`). Back up that folder. Deploy to a host with a persistent disk — a VPS, Railway, Render or Fly.io volume. Serverless platforms without a disk (e.g. Vercel) need the repositories in `lib/server/*` moved to a hosted database (Postgres/Turso) and uploads to object storage; nothing else changes.

Set `NEXT_PUBLIC_SITE_URL` (e.g. `https://sarpech.in`) for absolute URLs in the sitemap, canonical tags and Open Graph.

## Pages

| Route | What |
| --- | --- |
| `/` | Hero, Shop by Category, Wedding Edit feature, Bestsellers carousel, The Meaning of Sarpech, Craftsmanship, newsletter |
| `/shop`, `/shop/[category]` | Listing with filters (category, size, colour, price, occasion), sort, quick-add. Filters live in the URL |
| `/product/[slug]` | Gallery, colour swatches, sizes + size-guide modal, quantity, Add to Cart / Buy Now, accordions, Complete the Look, Product JSON-LD |
| `/cart`, `/checkout` | Full cart page (plus slide-out drawer everywhere); 3-step checkout — address, shipping, payment placeholder |
| `/wedding-edit`, `/our-story` | Lookbook and brand story |
| `/contact`, `/faq`, `/shipping-returns`, `/size-guide` | Book a fitting, help pages |
| `/wishlist`, `/search` | Saved pieces; live search (also in the header) |
| `/style-guide` | Design system: logo, colours, type, buttons, ornaments, product card |
| `/admin` | Store admin (sign-in required) — see [Admin](#admin) |

## Structure

```
app/                      routes, sitemap.ts, robots.ts, manifest.ts, opengraph-image.tsx, icon.png
components/
  brand/                  SarpechEmblem (inline official emblem), Logo (roundel, wordmark, lockup)
  ornaments/              ZariBorder, CornerOrnament, SectionDivider, Jaali, EmbroideredFrame, StitchIn
  shop/                   ProductCard, ProductImage, ProductDetail, ShopView, CartLines, CheckoutView, …
  layout/                 Header, Footer, MobileNav, CartDrawer, SearchDialog, PageHeader
  content/                page-specific pieces (fitting form, accordion, measuring diagram)
  ui/                     Dialog (native <dialog>), icons, QuantityStepper
data/                     products.ts (first-run seed), categories.ts, size-guide.ts
lib/                      catalog.ts (cached storefront reads), catalog-shared.ts, types.ts, track.ts, store/ (cart, wishlist, catalog)
lib/server/               database + repositories, auth, admin action helpers (server-only)
app/admin/                admin (login + (panel)/…); app/actions/store.ts — checkout, coupons, forms
app/api/track             activity beacon · app/media — uploaded images · proxy.ts — admin route guard
public/logo/              official logo files
```

### Design tokens

Defined in `app/globals.css` under `@theme` and available as Tailwind utilities:

| Token | Value | Use |
| --- | --- | --- |
| `brand-green` | `#0E1A15` | header, footer, buttons, headings, text |
| `brand-green-2` | `#1F3A2E` | hover, cards on dark |
| `gold` / `gold-light` / `gold-dark` | `#C9A04A` / `#F3DFA2` / `#8E6A22` | decoration only on white (fails AA as text) |
| `ruby` | `#A3162B` | sale tags, cart count, jewel |
| `ivory` | `#F5EEE0` | text on green |

Fonts: Cinzel (`font-display`) and Cormorant Garamond (`font-serif`), self-hosted via `next/font/google`.
Motion (`.stitch-in`, `.gold-shimmer`) is switched off under `prefers-reduced-motion`.

## Logo

The official files are in `public/logo/`. They're used for the favicon and app icon (`app/icon.png`, `app/apple-icon.png` copied from `favicon_512.png`), the web manifest, and the Open Graph image (`sarpech_logo_primary.png`).

The header, footer, dividers and placeholders draw the emblem inline with `<SarpechEmblem/>` so it can be gold, green, ivory or white and "stitch in" on scroll. Its paths in `components/brand/emblem-geometry.ts` are the official artwork's paths scaled to a 200-unit grid. If the master logo changes, update that file to match.

## Add a product

Use **Admin → Products → Add product**. Upload photos (first image = card image; 5:6 portrait, ~1500×1800 px works best), set price, sizes, colours, tags (`bestseller` puts it in the home carousel, `wedding-edit` in the Wedding Edit) and publish. Changes appear on the storefront immediately.

`data/products.ts` is only the **seed** used the very first time the database is created. To start from an empty catalogue, delete the sample products in the admin (or empty that array before first run).

Until a product has photos it shows a branded "Image coming soon" card. Per-colour photos replace the main photos when that colour is selected. `components/shop/ProductImage.tsx` is the single place imagery is rendered (via `next/image`, lazy-loaded).

## Sales & coupons

There are no sale prices in product data. A **Sale** (Admin → Sales) discounts by a percentage across the store, selected categories or selected products during its time window; the best live sale applies and its badge ("Festive Sale · 20% off") shows on cards. A **Coupon** (Admin → Coupons) is entered at checkout and is validated and applied on the server.

## Plugging in a CMS or Shopify

The storefront reads products through `lib/catalog.ts` (cached with `"use cache"` and the `catalog` tag; admin edits call `updateTag("catalog")`). Storage is behind the repositories in `lib/server/` (`products.ts`, `sales.ts`, `coupons.ts`, `orders.ts`, `activity.ts`, `inbox.ts`, `settings.ts`). To switch to Postgres, a CMS or Shopify, re-implement those modules with the same function signatures. Client components get the catalogue from `CatalogProvider` (filled by the store layout).

## Payments (Razorpay)

Checkout stops at a placeholder; no payment is taken. To integrate:

1. Add a route handler (e.g. `app/api/razorpay/order/route.ts`) that creates a Razorpay order with your secret key. Never expose the key to the client.
2. Orders are created by the `placeOrder` server action (`app/actions/store.ts`) with status `placed`. Create the Razorpay order there for the server-computed total, return its id, and open Razorpay Checkout from `components/shop/CheckoutView.tsx`.
3. Verify the payment signature in a webhook/route handler and set the order to `paid` (`updateOrder` in `lib/server/orders.ts`).
# serpech
# serpech
