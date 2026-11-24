/**
 * Geometry of the official SARPECH emblem (public/logo/sarpech_emblem_*.svg),
 * scaled from its 400×400 artboard to a 200×200 grid.
 *
 * The inline React <SarpechEmblem/> and the garment crest draw from these
 * paths so they can take any tone and animate their strokes. If the master
 * artwork changes, update these paths to match the files in /public/logo.
 */

/** Paths drawn once, on the centre line. Index order is relied on by the garment Crest. */
export const CENTRE_STROKES: string[] = [
  // [0] central plume (kalgi)
  "M100 113C91 90 92 60 100 36C108 60 109 90 100 113Z",
  // [1] curl at the plume tip
  "M100 36C105 28 115 27 119 33C115 32 111 34 109 38",
  // [2] spine
  "M100 111L100 40",
  // [3] chevron barbs
  "M100 102.5l-4.5-4.5M100 102.5l4.5-4.5M100 95.5l-4.5-4.5M100 95.5l4.5-4.5M100 88.5l-4.5-4.5M100 88.5l4.5-4.5M100 81.5l-4.5-4.5M100 81.5l4.5-4.5M100 74.5l-4.5-4.5M100 74.5l4.5-4.5M100 67.5l-4.5-4.5M100 67.5l4.5-4.5M100 60.5l-4.5-4.5M100 60.5l4.5-4.5M100 53.5l-4.5-4.5M100 53.5l4.5-4.5M100 46.5l-4.5-4.5M100 46.5l4.5-4.5",
  // [4] almond jewel setting
  "M100 112C113 118 114 141 100 150C86 141 87 118 100 112Z",
  // [5] pendant stem
  "M100 150L100 157",
];

/** Per-path stroke widths relative to the base width (matches the master file). */
export const CENTRE_STROKE_SCALE = [1, 1, 0.62, 0.5, 1.15, 1];

/** Paths drawn on the left half and mirrored onto the right. */
export const MIRRORED_STROKES: string[] = [
  // [0] side plume
  "M96 114C84 107 73 90 70 69C80 80 90 95 98 111",
  // [1] scroll arm
  "M93 131C75 134 59 125 58 111C57.5 103 65 99 70 103C74 106 72 112 68 111",
];

/** Oval ruby inside the setting. */
export const RUBY_PATH = "M93.5 131a6.5 9 0 1 0 13 0a6.5 9 0 1 0 -13 0Z";
/** Light glint on the ruby. */
export const RUBY_GLINT = { cx: 98, cy: 127.5, rx: 1.5, ry: 2.5 };

/** Pearls: [cx, cy, r]. Points left of centre are mirrored. */
export const PEARLS: [number, number, number][] = [
  [100, 161, 3.5],
  [80, 138, 1.6],
  [87, 142, 1.6],
];

/** Extra seed pearls (none in the current master). */
export const SEED_PEARLS: [number, number, number][] = [];

/** Diamond finial at the top of the ring. */
export const FINIAL_PATH = "M100 9l3 4-3 4-3-4z";

export const RING = { r: 88, inner: 84 };

export const GOLD = {
  light: "#F3DFA2",
  mid: "#C9A04A",
  dark: "#8E6A22",
};
export const GREEN = "#0E1A15";
export const RUBY = "#A3162B";
export const IVORY = "#F5EEE0";

/** Mirror helper for pearl coordinates. */
export function mirrored(points: [number, number, number][]): [number, number, number][] {
  return points.flatMap(([x, y, r]) => (x === 100 ? [[x, y, r]] : [[x, y, r], [200 - x, y, r]])) as [
    number,
    number,
    number,
  ][];
}

/** Static asset paths for the official artwork. */
export const LOGO_FILES = {
  primary: "/logo/sarpech_logo_primary.svg",
  primaryPng: "/logo/sarpech_logo_primary.png",
  emblemGold: "/logo/sarpech_emblem_gold.svg",
  emblemGreen: "/logo/sarpech_emblem_green.svg",
  emblemWhite: "/logo/sarpech_emblem_white.svg",
  lockup: "/logo/sarpech_lockup_horizontal.svg",
  favicon: "/logo/favicon_512.png",
};
