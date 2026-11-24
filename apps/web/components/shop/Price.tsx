import { formatINR } from "@sarpech/core/format";
import type { Product } from "@sarpech/core/types";

export function Price({ product, size = "sm" }: { product: Product; size?: "sm" | "lg" }) {
  const text = size === "lg" ? "text-2xl" : "text-[1.05rem]";
  if (!product.salePrice) {
    return <p className={`font-serif font-semibold ${text}`}>{formatINR(product.price)}</p>;
  }
  const off = Math.round((1 - product.salePrice / product.price) * 100);
  return (
    <p className={`flex flex-wrap items-baseline gap-x-2 font-serif ${text}`}>
      <span className="font-semibold text-ruby">
        <span className="sr-only">Sale price </span>
        {formatINR(product.salePrice)}
      </span>
      <s className="text-[0.85em] text-ink-soft">
        <span className="sr-only">Original price </span>
        {formatINR(product.price)}
      </s>
      {size === "lg" && <span className="font-display text-[0.6rem] uppercase tracking-[0.2em] text-ruby">{off}% off</span>}
    </p>
  );
}
