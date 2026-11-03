import "server-only";
import { listProducts } from "@/lib/server/products";

/** slug → product name resolver for one request (falls back to a readable slug). */
export function productNamer() {
  const names = new Map(listProducts({ includeDrafts: true }).map((p) => [p.slug, p.name]));
  return (slug: string) => names.get(slug) ?? slug.replace(/-/g, " ");
}
