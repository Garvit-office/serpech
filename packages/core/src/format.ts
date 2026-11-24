const inr = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });

export function formatINR(value: number) {
  return inr.format(value);
}

export const SITE = {
  name: "SARPECH",
  devanagari: "सरपेच",
  tagline: "Crowned in Heritage",
  secondary: "Est. 2026 · Royal Heritage Wear",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "https://sarpech.in",
  description:
    "SARPECH — luxury Indian menswear crowned in heritage. Sherwanis, bandhgalas, kurtas and modern tailoring with hand-laid gold zari.",
};
