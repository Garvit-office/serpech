"use client";

import { HeartIcon } from "@/components/ui/icons";
import { useWishlist } from "@/lib/store/wishlist";

export function WishlistButton({ slug, name, className = "", variant = "icon" }: { slug: string; name: string; className?: string; variant?: "icon" | "full" }) {
  const wl = useWishlist();
  const on = wl.has(slug);
  if (variant === "full") {
    return (
      <button type="button" onClick={() => wl.toggle(slug)} aria-pressed={on} className={`btn-outline ${className}`}>
        <HeartIcon filled={on} className={on ? "text-ruby" : ""} />
        {on ? "In Wishlist" : "Add to Wishlist"}
      </button>
    );
  }
  return (
    <button
      type="button"
      onClick={() => wl.toggle(slug)}
      aria-pressed={on}
      aria-label={on ? `Remove ${name} from wishlist` : `Add ${name} to wishlist`}
      className={`grid size-10 place-items-center rounded-full bg-white/90 text-brand-green shadow-sm transition hover:scale-105 ${className}`}
    >
      <HeartIcon filled={on} className={on ? "text-ruby" : ""} width={18} height={18} />
    </button>
  );
}
