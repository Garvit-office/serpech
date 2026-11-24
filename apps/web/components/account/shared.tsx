import Link from "next/link";
import type { ReactNode } from "react";
import type { OrderStatus } from "@sarpech/core/types";

/* Server-safe building blocks for the customer account area. */

export const ACCOUNT_TABS = [
  { key: "overview", label: "Overview" },
  { key: "orders", label: "Orders" },
  { key: "royal-fit", label: "Royal Fit" },
  { key: "addresses", label: "Addresses" },
  { key: "profile", label: "Profile" },
  { key: "security", label: "Security" },
] as const;

export type AccountTab = (typeof ACCOUNT_TABS)[number]["key"];

export const STATUS_LABEL: Record<OrderStatus, string> = {
  placed: "Order placed",
  paid: "Paid",
  processing: "Being prepared",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
  refunded: "Refunded",
};

const STATUS_STYLE: Record<OrderStatus, string> = {
  placed: "bg-[#F6EDD3] text-[#6E521A]",
  paid: "bg-[#E3E9F3] text-[#1E2A3E]",
  processing: "bg-[#E3E9F3] text-[#1E2A3E]",
  shipped: "bg-[#E4EFE8] text-[#1F5B45]",
  delivered: "bg-[#E4EFE8] text-[#1F5B45]",
  cancelled: "bg-[#F6E1E4] text-ruby",
  refunded: "bg-[#ECEBE6] text-ink-soft",
};

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 font-display text-[0.6rem] uppercase tracking-[0.14em] ${STATUS_STYLE[status]}`}>
      {STATUS_LABEL[status]}
    </span>
  );
}

/** Tabs as links (?tab=) — a side rail on desktop, a horizontal scroller on mobile. */
export function AccountNav({ active }: { active: AccountTab }) {
  return (
    <nav aria-label="My account" className="lg:sticky lg:top-32 lg:self-start">
      <ul className="no-scrollbar -mx-4 flex gap-1 overflow-x-auto border-b border-mist px-4 lg:mx-0 lg:flex-col lg:gap-0 lg:overflow-visible lg:border-b-0 lg:border-l lg:px-0">
        {ACCOUNT_TABS.map((t) => (
          <li key={t.key} className="shrink-0">
            <Link
              href={t.key === "overview" ? "/account" : `/account?tab=${t.key}`}
              aria-current={active === t.key ? "page" : undefined}
              scroll={false}
              className="relative block whitespace-nowrap px-4 py-3 font-display text-[0.68rem] uppercase tracking-[0.2em] text-ink-soft transition-colors hover:text-brand-green aria-[current=page]:text-brand-green max-lg:aria-[current=page]:after:absolute max-lg:aria-[current=page]:after:inset-x-3 max-lg:aria-[current=page]:after:bottom-0 max-lg:aria-[current=page]:after:h-0.5 max-lg:aria-[current=page]:after:bg-gold lg:-ml-px lg:border-l-2 lg:border-transparent lg:py-2.5 lg:pl-5 lg:aria-[current=page]:border-gold"
            >
              {t.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export function Panel({ title, action, children, className = "" }: { title?: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`relative border border-mist bg-white ${className}`}>
      {(title || action) && (
        <div className="flex items-center justify-between gap-3 border-b border-mist px-5 py-3.5">
          {title && <h2 className="font-display text-[0.72rem] font-medium tracking-[0.22em]">{title}</h2>}
          {action}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function Notice({ tone = "gold", children }: { tone?: "gold" | "green" | "ruby"; children: ReactNode }) {
  const style = {
    gold: "border-gold/60 bg-pearl",
    green: "border-[#1F5B45]/40 bg-[#E4EFE8]",
    ruby: "border-ruby/40 bg-ruby/5 text-ruby",
  }[tone];
  return (
    <p role="status" className={`border px-4 py-3 text-lg ${style}`}>
      {children}
    </p>
  );
}

export function orderDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "long", year: "numeric" });
}

export const INDIAN_STATES = [
  "Andaman and Nicobar Islands",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chandigarh",
  "Chhattisgarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu and Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Ladakh",
  "Lakshadweep",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Puducherry",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
];
