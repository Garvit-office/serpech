import type { MetadataRoute } from "next";
import { SITE } from "@/lib/format";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SITE.name} — ${SITE.tagline}`,
    short_name: SITE.name,
    description: SITE.description,
    start_url: "/",
    display: "standalone",
    background_color: "#FFFFFF",
    theme_color: "#0E1A15",
    icons: [{ src: "/logo/favicon_512.png", sizes: "512x512", type: "image/png" }],
  };
}
