import Image from "next/image";
import { SarpechEmblem } from "@sarpech/brand/SarpechEmblem";
import { Jaali } from "@sarpech/brand/ornaments/Jaali";
import type { Product } from "@sarpech/core/types";
import { DesignArt } from "@/components/design/DesignArt";

/** Images for a product in the chosen colour (per-colour photos win). */
export function productImages(product: Product, colorName?: string): string[] {
  const color = product.colors.find((c) => c.name === colorName) ?? product.colors[0];
  return color?.images?.length ? color.images : (product.images ?? []);
}

/**
 * The one place product imagery is decided: real photography via next/image
 * when the product has `images`, otherwise a quiet branded placeholder.
 */
export function ProductImage({
  product,
  colorName,
  index = 0,
  className = "h-full w-full",
  sizes = "(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw",
  priority = false,
  fit = "cover",
}: {
  product: Product;
  colorName?: string;
  index?: number;
  className?: string;
  sizes?: string;
  priority?: boolean;
  fit?: "cover" | "contain";
}) {
  const color = product.colors.find((c) => c.name === colorName) ?? product.colors[0];
  const photos = productImages(product, colorName);
  const alt = `${product.name}${color ? ` in ${color.name}` : ""}${index ? ` — view ${index + 1}` : ""}`;

  // Design Studio pieces are drawn from the customer's design.
  if (product.design) {
    return (
      <span className={`relative flex items-center justify-center bg-pearl ${className}`}>
        <DesignArt spec={product.design} title={product.name} className="h-[92%] w-[92%]" />
      </span>
    );
  }

  if (photos[index]) {
    return (
      <span className={`relative block ${className}`}>
        <Image
          src={photos[index]}
          alt={alt}
          fill
          sizes={sizes}
          priority={priority}
          className={fit === "cover" ? "object-cover" : "object-contain"}
        />
      </span>
    );
  }

  return <ImagePlaceholder label={alt} swatch={color?.hex} className={className} />;
}

/** Branded stand-in shown until product photography is supplied. */
export function ImagePlaceholder({ label, swatch, className = "h-full w-full" }: { label: string; swatch?: string; className?: string }) {
  return (
    <span role="img" aria-label={`${label} — image coming soon`} className={`@container relative flex flex-col items-center justify-center gap-3 bg-pearl ${className}`}>
      <Jaali opacity={0.06} size={40} />
      <span aria-hidden className="pointer-events-none absolute inset-3 border border-gold/30" />
      <SarpechEmblem tone="gold" className="relative h-1/3 max-h-28 w-1/3 max-w-28 opacity-70" />
      <span aria-hidden className="eyebrow hidden px-4 text-center text-[0.58rem] text-ink-soft @[14rem]:block">Image coming soon</span>
      {swatch && <span aria-hidden className="size-3 rounded-full border border-brand-green/20" style={{ background: swatch }} />}
    </span>
  );
}
