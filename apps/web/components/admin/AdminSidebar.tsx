"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { logoutAction } from "@/app/admin/login/actions";
import { SarpechEmblem } from "@sarpech/brand/SarpechEmblem";
import { CloseIcon, MenuIcon } from "@/components/ui/icons";

export const ADMIN_NAV = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/orders", label: "Orders" },
  { href: "/admin/customers", label: "Customers" },
  { href: "/admin/products", label: "Products" },
  { href: "/admin/coupons", label: "Coupons" },
  { href: "/admin/sales", label: "Sales" },
  { href: "/admin/activity", label: "Activity" },
  { href: "/admin/inbox", label: "Inbox" },
  { href: "/admin/settings", label: "Settings" },
];

export function AdminSidebar({ admin }: { admin: string }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- close the mobile menu on navigation
  useEffect(() => setOpen(false), [pathname]);
  const active = (href: string) => (href === "/admin" ? pathname === "/admin" : pathname.startsWith(href));

  return (
    <aside style={{ viewTransitionName: "admin-sidebar" }} className="on-dark sticky top-0 z-30 bg-brand-green text-ivory lg:h-dvh lg:w-60 lg:shrink-0">
      <div className="flex items-center justify-between px-4 py-3 lg:px-5 lg:py-6">
        <Link href="/admin" className="flex items-center gap-2.5">
          <SarpechEmblem tone="gold" className="h-9 w-9" />
          <span className="leading-tight">
            <span className="block font-display text-sm tracking-[0.28em]">SARPECH</span>
            <span className="block font-display text-[0.6rem] tracking-[0.24em] text-gold-light">ADMIN</span>
          </span>
        </Link>
        <button
          type="button"
          className="grid size-11 place-items-center lg:hidden"
          aria-label={open ? "Close admin menu" : "Open admin menu"}
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          {open ? <CloseIcon /> : <MenuIcon />}
        </button>
      </div>
      <nav aria-label="Admin" className={`${open ? "block" : "hidden"} border-t border-gold/20 lg:block lg:border-0`}>
        <ul className="px-3 py-2">
          {ADMIN_NAV.map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active(item.href) ? "page" : undefined}
                className="flex items-center gap-3 rounded-sm px-3 py-2.5 font-display text-[0.72rem] uppercase tracking-[0.2em] text-ivory/85 transition-colors hover:bg-brand-green-2 hover:text-ivory aria-[current=page]:bg-brand-green-2 aria-[current=page]:text-gold-light"
              >
                <span aria-hidden className="size-1.5 rotate-45 border border-gold" />
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
        <div className="mt-2 border-t border-gold/20 px-6 py-4 text-sm lg:absolute lg:inset-x-0 lg:bottom-0">
          <p className="truncate text-ivory/70" title={admin}>
            {admin}
          </p>
          <div className="mt-2 flex items-center gap-4">
            <Link href="/" className="link-thread text-ivory/90" target="_blank">
              View store ↗
            </Link>
            <form action={logoutAction}>
              <button type="submit" className="link-thread text-ivory/90">
                Sign out
              </button>
            </form>
          </div>
        </div>
      </nav>
    </aside>
  );
}
