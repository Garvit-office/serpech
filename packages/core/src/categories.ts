import type { Category } from "./types";

export const categories: Category[] = [
  {
    slug: "sherwanis",
    name: "Sherwanis",
    short: "Wedding · Reception · Indo-Western",
    description:
      "Knee-length sherwanis in raw silk and brocade, with hand-laid zari on the collar, cuffs and placket.",
  },
  {
    slug: "bandhgalas",
    name: "Bandhgalas & Jodhpuris",
    short: "Closed-neck tailoring",
    description: "The Jodhpur court's closed-collar jacket, cut on a Savile Row block with brass buttons.",
  },
  {
    slug: "kurtas",
    name: "Kurtas & Sets",
    short: "Chikankari · Thread work",
    description: "Straight-cut kurtas with fine thread embroidery at the neckline and placket.",
  },
  {
    slug: "nehru-jackets",
    name: "Nehru Jackets",
    short: "Brocade · Sleeveless",
    description: "Sleeveless jackets in jaali brocade — the easiest way to crown a kurta.",
  },
  {
    slug: "shirts",
    name: "Shirts",
    short: "Formal · Linen · Embroidered collar",
    description: "Shirting from Egyptian cotton and Irish linen, with the sarpech embroidered at the cuff.",
  },
  {
    slug: "polos",
    name: "Polos",
    short: "Premium piqué",
    description: "Long-staple piqué polos with a gold sarpech embroidered on the left chest.",
  },
  {
    slug: "t-shirts",
    name: "T-Shirts",
    short: "Heavyweight heritage prints",
    description: "240 GSM cotton tees with jaali, paisley and crest prints.",
  },
  {
    slug: "trousers",
    name: "Trousers",
    short: "Tailored · Chinos · Churidars · Breeches",
    description: "From sharp tailored trousers to Jodhpuri breeches, the foundation of every look.",
  },
  {
    slug: "accessories",
    name: "Accessories",
    short: "Safa · Sarpech · Mojari · Stoles",
    description: "The finishing jewels — safas, sarpech brooches, stoles, mojaris and cufflinks.",
  },
];

export function getCategory(slug: string) {
  return categories.find((c) => c.slug === slug);
}
