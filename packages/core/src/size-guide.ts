/** Body measurements in inches. */
export const SIZE_CHARTS = {
  tailored: {
    title: "Sherwanis, Bandhgalas & Jodhpuris",
    note: "Chest size in inches. Measure around the fullest part of the chest, under the arms.",
    columns: ["Size", "Chest", "Waist", "Shoulder", "Sleeve", "Sherwani length"],
    rows: [
      ["36", "36", "30", "17", "24", "41"],
      ["38", "38", "32", "17.5", "24.5", "42"],
      ["40", "40", "34", "18", "25", "43"],
      ["42", "42", "36", "18.5", "25.5", "44"],
      ["44", "44", "38", "19", "26", "45"],
      ["46", "46", "40", "19.5", "26", "46"],
    ],
  },
  alpha: {
    title: "Kurtas, Jackets, Shirts, Polos & Tees",
    note: "For a relaxed fit choose your usual size; for a slim fit size down.",
    columns: ["Size", "Chest", "Waist", "Shoulder", "Kurta length"],
    rows: [
      ["S", "36–38", "30–32", "17", "40"],
      ["M", "38–40", "32–34", "17.5", "41"],
      ["L", "40–42", "34–36", "18", "42"],
      ["XL", "42–44", "36–38", "18.5", "43"],
      ["XXL", "44–46", "38–40", "19", "44"],
    ],
  },
  trousers: {
    title: "Trousers, Chinos & Breeches",
    note: "Waist size in inches, measured at the natural waist.",
    columns: ["Size", "Waist", "Hip", "Inseam"],
    rows: [
      ["30", "30", "38", "31"],
      ["32", "32", "40", "31.5"],
      ["34", "34", "42", "32"],
      ["36", "36", "44", "32"],
      ["38", "38", "46", "32.5"],
      ["40", "40", "48", "32.5"],
    ],
  },
  footwear: {
    title: "Mojaris",
    note: "Mojaris run true to UK size; if between sizes, size up — leather softens with wear.",
    columns: ["UK", "EU", "Foot length (cm)"],
    rows: [
      ["6", "40", "24.6"],
      ["7", "41", "25.4"],
      ["8", "42", "26.2"],
      ["9", "43", "27.1"],
      ["10", "44", "27.9"],
      ["11", "45", "28.8"],
    ],
  },
} as const;

export type SizeChartKey = keyof typeof SIZE_CHARTS;

export function chartForCategory(category: string, sizes: readonly string[]): SizeChartKey {
  if (sizes[0]?.startsWith("UK")) return "footwear";
  if (category === "sherwanis" || category === "bandhgalas") return "tailored";
  if (category === "trousers" && /^\d/.test(sizes[0] ?? "")) return "trousers";
  return "alpha";
}

export const HOW_TO_MEASURE = [
  { part: "Chest", how: "Around the fullest part of the chest, tape under the arms and level across the back." },
  { part: "Waist", how: "Around the natural waistline, just above the navel, keeping one finger under the tape." },
  { part: "Shoulder", how: "From the edge of one shoulder bone across the back to the other." },
  { part: "Sleeve", how: "From the shoulder seam down to the wrist bone, arm relaxed." },
  { part: "Inseam", how: "From the crotch seam down the inside leg to the ankle." },
];
