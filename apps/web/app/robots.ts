import type { MetadataRoute } from "next";
import { SITE } from "@sarpech/core/format";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/cart", "/checkout", "/wishlist", "/account", "/admin", "/style-guide"] },
    sitemap: `${SITE.url}/sitemap.xml`,
  };
}
