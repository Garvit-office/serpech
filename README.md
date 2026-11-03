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
| Customers | Registered customers with orders, spend, addresses, wishlist and Royal Fit |
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
| `/cart`, `/checkout` | Full cart page (plus slide-out drawer everywhere); 3-step checkout — address, shipping, Razorpay payment |
| `/wedding-edit`, `/our-story` | Lookbook and brand story |
| `/contact`, `/faq`, `/shipping-returns`, `/size-guide` | Book a fitting, help pages |
| `/wishlist`, `/search` | Saved pieces; live search (also in the header) |
| `/account/…` | Sign in, register, forgot/reset password, My Account, order detail — see [Customer accounts](#customer-accounts) |
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

## Customer accounts

Customers sign up and sign in at `/account/register` and `/account/login`. Guest checkout stays available. **My Account** (`/account`) has order history and order detail, profile, saved addresses, Royal Fit, password change and account deletion.

- **Passwords:** hashed with scrypt and a per-user salt; checks run in constant time, including for unknown emails.
- **Sessions:** random 256-bit tokens in an HTTP-only cookie (`sp_session`). Only their SHA-256 hash is stored. "Keep me signed in" lasts 30 days, otherwise until the browser closes. Changing the password signs out other devices.
- **Abuse protection:** sign-in, sign-up and reset are throttled per IP. Password reset links expire after one hour and work once.
- **Checkout:** prefilled for signed-in customers, and the order is linked to the account. A first order's address is saved as the default.
- **Sync:** the wishlist and Royal Fit sync to the account, so they follow the customer across devices.
- **Admin:** a **Customers** section with each customer's orders, spend, addresses and measurements.
- **Email:** welcome and password-reset emails go through `lib/server/mail.ts` — see [Email](#email). Set up Resend before launch, or customers won't receive reset links.
- **Forgot password:** `/account/forgot` → emailed link to `/account/reset` (one use, one hour).
- **Pages stay fast:** the header learns who is signed in from `/api/account/me`, so storefront pages stay static and cached.

## Royal Fit (Fit Check & made to measure)

`/royal-fit`, plus a "Find your Royal Fit" panel on every product page.

1. **Measure:**
   - **Fit Check (camera):** MediaPipe Pose runs in the browser. Customers stand 2–3 m away with arms out, then optionally turn side-on. Height sets the scale, the silhouette gives chest, waist and hip girths, and joint positions give shoulder, sleeve and inseam. Values are medians over many frames.
   - **Manual entry,** or a **quick estimate** from height, weight and build.
2. **Choose a fit:** Royal Tailored, Regular, Relaxed (a little baggy) or Loose, plus length and sleeve preferences and notes for the tailor.
3. **Result:** each product shows the recommended size (from `data/size-guide.ts`, see `recommendSize` in `lib/fit.ts`) and, where allowed, **Made to Measure**. That adds the fee and stores the measurements on the order. Admin → Orders shows a printable **tailoring sheet**.

The profile is saved only in the customer's browser. The camera image never leaves the device; the model and runtime are self-hosted in `public/fitcheck/` (`npm install` copies the runtime there).

- **HTTPS:** browsers only allow the camera on `https://` or `localhost`. To test on a phone over your network, run `npx next dev --experimental-https`, or deploy.
- **Accuracy:** camera readings are estimates (typically within a few cm, depending on clothing, light and pose). Customers review every value, and the tailoring sheet marks camera and estimated measurements "confirm with customer". Calibrate the factors in `lib/fitcheck/measure.ts` against real tape measurements before relying on them.
- **Admin:** made-to-measure fee and extra days in Settings; per-product on/off in the product editor (defaults to on for sherwanis, bandhgalas, kurtas, Nehru jackets, shirts and trousers).

## Plugging in a CMS or Shopify

The storefront reads products through `lib/catalog.ts` (cached with `"use cache"` and the `catalog` tag; admin edits call `updateTag("catalog")`). Storage is behind the repositories in `lib/server/` (`products.ts`, `sales.ts`, `coupons.ts`, `orders.ts`, `activity.ts`, `inbox.ts`, `settings.ts`). To switch to Postgres, a CMS or Shopify, re-implement those modules with the same function signatures. Client components get the catalogue from `CatalogProvider` (filled by the store layout).

## Payments (Razorpay)

Set `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` (test keys `rzp_test_…` first) and checkout takes payment. Without them, orders are recorded unpaid and the customer is told the team will arrange payment.

1. **Place order:** the `placeOrder` server action (`app/actions/store.ts`) re-prices the bag, reserves stock, saves the order as `placed` and creates a Razorpay order for the server-computed total (`lib/server/razorpay.ts`). The secret key never reaches the browser.
2. **Pay:** `components/shop/CheckoutView.tsx` opens Razorpay Checkout. If the customer closes it, the order is held and **Pay** reopens it.
3. **Confirm:** the `confirmPayment` action verifies Razorpay's signature and marks the order `paid`, then sends the confirmation email.
4. **Webhook (recommended):** in the Razorpay Dashboard → Webhooks add `https://<your-domain>/api/razorpay/webhook` with events `payment.captured` and `order.paid`, and set the same secret as `RAZORPAY_WEBHOOK_SECRET`. This confirms payments even if the customer closes the tab before returning. Confirmation is idempotent, so the email goes out once.
5. **Abandoned payments:** an order left unpaid for 60 minutes is cancelled automatically and its stock released (checked on each new order and each webhook).

Admin → Orders shows the Razorpay order and payment ids. Refunds are made in the Razorpay Dashboard; then mark the order `refunded`.

## Email

`lib/server/mail.ts` sends through [Resend](https://resend.com) when `RESEND_API_KEY` and `MAIL_FROM` are set (verify your domain in Resend first). Otherwise every message is printed to the server log, which is handy in development: the password-reset link appears there.

Emails sent: welcome, password reset, order confirmation (on payment, or at once when payments are off), and status updates when an order is marked shipped, delivered, cancelled or refunded. The order texts are in `lib/server/order-mail.ts`. To use another provider (Postmark, SES, SMTP), change only `sendMail`.

## Stock

Stock is optional and per size. In **Admin → Products → (product) → Stock**, tick *Track stock* and enter units per size; leave a size blank to stop tracking it.

- Placing an order takes stock (all or nothing; the customer is told exactly what ran out). Cancelling or refunding an order in the admin puts it back, and re-opening one takes it again.
- Sizes at 0 are shown struck through and can't be chosen; at 3 or fewer the product page shows "Only N left". A product sold out in every size shows **Sold out** on its card. Made-to-measure pieces are cut to order and never use stock.
- The product list shows units on hand with *sold out* and *low* flags.
