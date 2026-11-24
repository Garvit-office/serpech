"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Lockup } from "@sarpech/brand/Logo";
import { ZariBorder } from "@sarpech/brand/ornaments/ZariBorder";
import { BagIcon, HeartIcon, MenuIcon, SearchIcon, UserIcon } from "@/components/ui/icons";
import { PRIMARY_NAV } from "@/lib/nav";
import { useAccount } from "@/lib/store/account";
import { useCart } from "@/lib/store/cart";
import { useCatalog } from "@/lib/store/catalog";
import { useWishlist } from "@/lib/store/wishlist";
import { CartDrawer } from "./CartDrawer";
import { MobileNav } from "./MobileNav";
import { SearchDialog } from "./SearchDialog";

export function Header() {
  const pathname = usePathname();
  const cart = useCart();
  const wishlist = useWishlist();
  const { settings } = useCatalog();
  const { customer } = useAccount();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const closeCart = cart.close;

  // Close overlays on navigation
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- respond to route change
    setMenuOpen(false);
    setSearchOpen(false);
    closeCart();
  }, [pathname, closeCart]);

  // Compact header once the page scrolls; toggled on the element to avoid re-renders while scrolling.
  const headerRef = useRef<HTMLElement>(null);
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    let ticking = false;
    const update = () => {
      el.dataset.scrolled = String(window.scrollY > 40);
      ticking = false;
    };
    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isActive = (href: string) => (href === "/shop" ? pathname === "/shop" : pathname.startsWith(href));

  return (
    <>
      <a
        href="#main"
        className="sr-only z-[60] bg-gold px-4 py-2 font-display text-xs tracking-[0.2em] text-brand-green focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
      >
        Skip to content
      </a>
      <div className="bg-brand-green-2 text-ivory">
        <p className="mx-auto max-w-7xl px-4 py-1.5 text-center font-display text-[0.62rem] uppercase tracking-[0.26em] sm:text-[0.68rem]">
          {settings.announcement} <span className="mx-2 text-gold" aria-hidden>✦</span>
          <Link href="/contact" className="link-thread">
            Book a private fitting
          </Link>
        </p>
      </div>
      <header ref={headerRef} style={{ viewTransitionName: "site-header" }} className="group/header on-dark sticky top-0 z-40 bg-brand-green text-ivory transition-shadow duration-300 data-[scrolled=true]:shadow-lift">
        <div className="mx-auto grid max-w-7xl grid-cols-[1fr_auto_1fr] items-center px-3 py-2.5 transition-[padding] duration-300 sm:px-6 lg:py-3 lg:group-data-[scrolled=true]/header:py-1.5">
          <div className="flex items-center gap-1">
            <button
              type="button"
              className="grid size-11 place-items-center lg:hidden"
              aria-label="Open menu"
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen(true)}
            >
              <MenuIcon />
            </button>
            <button
              type="button"
              className="grid size-11 place-items-center"
              aria-label="Search the collection"
              onClick={() => setSearchOpen(true)}
            >
              <SearchIcon />
            </button>
          </div>

          <Link href="/" aria-label="SARPECH — home" className="justify-self-center">
            <Lockup
              tone="ivory"
              emblemClassName="h-9 w-9 transition-[width,height] duration-300 sm:h-11 sm:w-11 lg:group-data-[scrolled=true]/header:h-9 lg:group-data-[scrolled=true]/header:w-9"
              textClassName="text-base sm:text-xl"
            />
          </Link>

          <div className="flex items-center justify-end gap-1">
            <Link
              href={customer ? "/account" : "/account/login"}
              className="relative hidden size-11 place-items-center sm:grid"
              aria-label={customer ? `My account, signed in as ${customer.name}` : "Sign in or create an account"}
            >
              {customer ? (
                <span aria-hidden className="grid size-7 place-items-center rounded-full border border-gold font-display text-[0.7rem] text-gold-light">
                  {customer.name.trim().charAt(0).toUpperCase()}
                </span>
              ) : (
                <UserIcon />
              )}
            </Link>
            <Link href="/wishlist" className="relative grid size-11 place-items-center" aria-label={`Wishlist, ${wishlist.slugs.length} items`}>
              <HeartIcon />
              {wishlist.slugs.length > 0 && (
                <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-gold" aria-hidden />
              )}
            </Link>
            <button
              type="button"
              className="relative grid size-11 place-items-center"
              aria-label={`Open cart, ${cart.count} items`}
              onClick={cart.open}
            >
              <BagIcon />
              {cart.count > 0 && (
                <span className="absolute right-0.5 top-0.5 grid min-w-5 place-items-center rounded-full bg-ruby px-1 font-display text-[0.62rem] leading-5 text-white">
                  {cart.count}
                </span>
              )}
            </button>
          </div>
        </div>

        <nav aria-label="Primary" className="hidden border-t border-gold/25 lg:block">
          <ul className="mx-auto flex max-w-7xl items-center justify-center gap-x-4 px-4 xl:gap-x-7 xl:px-6">
            {PRIMARY_NAV.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className={`relative block whitespace-nowrap py-3 font-display text-[0.66rem] uppercase tracking-[0.16em] transition-colors xl:text-[0.7rem] xl:tracking-[0.22em] hover:text-gold-light ${
                    isActive(item.href) ? "text-gold-light" : "text-ivory"
                  } after:absolute after:inset-x-0 after:bottom-1.5 after:mx-auto after:h-px after:w-0 after:bg-gold after:transition-all hover:after:w-full aria-[current=page]:after:w-full`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </header>
      <ZariBorder className="bg-white" />

      <MobileNav open={menuOpen} onClose={() => setMenuOpen(false)} isActive={isActive} customerName={customer?.name ?? null} />
      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
      <CartDrawer />
    </>
  );
}
