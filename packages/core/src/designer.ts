/**
 * Design Studio — customers design their own shirt, polo, kurta or sherwani.
 *
 * Everything here is plain data + pure functions shared by the website, the
 * mobile app and the server:
 *   - the design spec (garment, fabrics per zone, style options)
 *   - drawing data (SVG paths + pattern tiles) that each renderer turns into
 *     <svg> (web) or react-native-svg (app) — one look on every screen
 *   - pricing, validation and the tailor's description
 *
 * The server always re-validates and re-prices a design; clients only preview.
 */
import type { CategorySlug, Product } from "./types";

/* ───────────── Spec ───────────── */

export type GarmentKind = "shirt" | "polo" | "kurta" | "sherwani";
export type Zone = "body" | "sleeves" | "collar" | "trim";
export type PatternKind = "solid" | "stripes" | "pinstripe" | "checks" | "gingham" | "polka" | "herringbone" | "paisley" | "booti" | "jaali";
export type PatternAngle = 0 | 45 | 90 | 135;

export interface Fabric {
  /** Ground colour, #RRGGBB. */
  color: string;
  pattern: PatternKind;
  /** Pattern colour, #RRGGBB (unused for solid). */
  accent: string;
  /** Pattern size, 0.6 (fine) – 1.6 (bold). */
  scale: number;
  angle: PatternAngle;
}

export type SleeveStyle = "full" | "three-quarter" | "half";
export type CollarStyle = "spread" | "button-down" | "mandarin" | "polo" | "tipped-polo" | "band" | "round";
export type LengthStyle = "regular" | "long";
export type ButtonStyle = "matching" | "gold" | "pearl" | "onyx";
export type Embroidery = "none" | "collar" | "border" | "booti";

export interface DesignOptions {
  sleeve: SleeveStyle;
  collar: CollarStyle;
  length: LengthStyle;
  buttons: ButtonStyle;
  embroidery: Embroidery;
  pocket: boolean;
}

export interface DesignSpec {
  version: 1;
  garment: GarmentKind;
  fabrics: Record<Zone, Fabric>;
  options: DesignOptions;
  /** The customer's name for it, e.g. "Sangeet kurta". */
  name: string;
}

export const ZONES: { key: Zone; label: string }[] = [
  { key: "body", label: "Body" },
  { key: "sleeves", label: "Sleeves" },
  { key: "collar", label: "Collar" },
  { key: "trim", label: "Cuffs & trims" },
];

/* ───────────── Catalogue of choices ───────────── */

export const FABRIC_COLORS: { name: string; hex: string }[] = [
  { name: "Ivory", hex: "#EFE6D2" },
  { name: "Pearl White", hex: "#F7F4EC" },
  { name: "Sand", hex: "#D8C7A6" },
  { name: "Antique Gold", hex: "#D6B56A" },
  { name: "Kesariya", hex: "#E0912F" },
  { name: "Rajputana Red", hex: "#B4262E" },
  { name: "Maroon", hex: "#5B1A24" },
  { name: "Wine", hex: "#4A1520" },
  { name: "Rani Pink", hex: "#C2477A" },
  { name: "Rose Blush", hex: "#E5C4BB" },
  { name: "Powder Blue", hex: "#C3D5E6" },
  { name: "Midnight Blue", hex: "#1C2A44" },
  { name: "Peacock Teal", hex: "#1F5E66" },
  { name: "Emerald", hex: "#1F5B45" },
  { name: "Royal Green", hex: "#14291F" },
  { name: "Mint", hex: "#C9DCCD" },
  { name: "Olive", hex: "#5E6B45" },
  { name: "Stone Grey", hex: "#9A9890" },
  { name: "Charcoal", hex: "#3A3D40" },
  { name: "Onyx Black", hex: "#17191A" },
];

export const PATTERNS: { key: PatternKind; label: string; tier: 0 | 1 | 2; note: string }[] = [
  { key: "solid", label: "Solid", tier: 0, note: "Plain weave" },
  { key: "stripes", label: "Stripes", tier: 1, note: "Bold woven stripe" },
  { key: "pinstripe", label: "Pinstripe", tier: 1, note: "Fine single-thread stripe" },
  { key: "checks", label: "Checks", tier: 1, note: "Classic window check" },
  { key: "gingham", label: "Gingham", tier: 1, note: "Even two-tone check" },
  { key: "polka", label: "Polka", tier: 1, note: "Woven dots" },
  { key: "herringbone", label: "Herringbone", tier: 1, note: "Chevron twill" },
  { key: "paisley", label: "Paisley", tier: 2, note: "Mughal keri motif" },
  { key: "booti", label: "Booti", tier: 2, note: "Scattered floral buttis" },
  { key: "jaali", label: "Jaali", tier: 2, note: "Lattice inspired by palace screens" },
];

export const BUTTONS: { key: ButtonStyle; label: string; hex: string | null }[] = [
  { key: "matching", label: "Matching", hex: null },
  { key: "gold", label: "Antique gold", hex: "#C9A04A" },
  { key: "pearl", label: "Pearl", hex: "#F4EFE6" },
  { key: "onyx", label: "Onyx", hex: "#17191A" },
];

export const EMBROIDERY: { key: Embroidery; label: string; note: string }[] = [
  { key: "none", label: "None", note: "Clean finish" },
  { key: "collar", label: "Collar & placket", note: "Zari outline at the neck and opening" },
  { key: "border", label: "Zari border", note: "Woven gold border at hem and cuffs" },
  { key: "booti", label: "Booti all over", note: "Hand-placed gold buttis across the body" },
];

export const ZARI = "#C9A04A";

interface GarmentDef {
  kind: GarmentKind;
  label: string;
  category: CategorySlug;
  /** Starting price in INR for a solid-colour design. */
  basePrice: number;
  sizes: string[];
  sleeves: SleeveStyle[];
  collars: CollarStyle[];
  lengths: LengthStyle[];
  embroidery: Embroidery[];
  pocket: boolean;
  blurb: string;
}

const ALPHA = ["S", "M", "L", "XL", "XXL"];
const CHEST = ["36", "38", "40", "42", "44", "46"];

export const GARMENTS: GarmentDef[] = [
  {
    kind: "shirt",
    label: "Shirt",
    category: "shirts",
    basePrice: 4900,
    sizes: ALPHA,
    sleeves: ["full", "half"],
    collars: ["spread", "button-down", "mandarin"],
    lengths: ["regular"],
    embroidery: ["none", "collar"],
    pocket: true,
    blurb: "Crisp cotton shirt, cut to your choice of collar and sleeve.",
  },
  {
    kind: "polo",
    label: "Polo T-shirt",
    category: "polos",
    basePrice: 3500,
    sizes: ALPHA,
    sleeves: ["half", "full"],
    collars: ["polo", "tipped-polo"],
    lengths: ["regular"],
    embroidery: ["none"],
    pocket: true,
    blurb: "Pique-knit polo with ribbed collar and cuffs.",
  },
  {
    kind: "kurta",
    label: "Kurta",
    category: "kurtas",
    basePrice: 6900,
    sizes: ALPHA,
    sleeves: ["full", "three-quarter"],
    collars: ["band", "round", "mandarin"],
    lengths: ["regular", "long"],
    embroidery: ["none", "collar", "border", "booti"],
    pocket: false,
    blurb: "Straight kurta with side slits, from festive silk to everyday cotton.",
  },
  {
    kind: "sherwani",
    label: "Sherwani",
    category: "sherwanis",
    basePrice: 42000,
    sizes: CHEST,
    sleeves: ["full"],
    collars: ["mandarin"],
    lengths: ["long"],
    embroidery: ["none", "collar", "border", "booti"],
    pocket: false,
    blurb: "Structured, fully lined sherwani for the wedding stage.",
  },
];

export const garmentDef = (k: GarmentKind) => GARMENTS.find((g) => g.kind === k)!;

export const SLEEVE_LABEL: Record<SleeveStyle, string> = { full: "Full sleeves", "three-quarter": "Three-quarter sleeves", half: "Half sleeves" };
export const COLLAR_LABEL: Record<CollarStyle, string> = {
  spread: "Spread collar",
  "button-down": "Button-down collar",
  mandarin: "Mandarin collar",
  polo: "Polo collar",
  "tipped-polo": "Tipped polo collar",
  band: "Band collar",
  round: "Round neck",
};
export const LENGTH_LABEL: Record<LengthStyle, string> = { regular: "Regular length", long: "Long length" };

/** Made-to-order pieces leave the atelier this many working days after the order. */
export const DESIGN_DAYS = 14;

/* ───────────── Defaults ───────────── */

const fabric = (color: string, pattern: PatternKind = "solid", accent = "#C9A04A", scale = 1, angle: PatternAngle = 0): Fabric => ({ color, pattern, accent, scale, angle });

export function defaultDesign(kind: GarmentKind = "kurta"): DesignSpec {
  const g = garmentDef(kind);
  const presets: Record<GarmentKind, { body: Fabric; trim: Fabric; buttons: ButtonStyle; embroidery: Embroidery }> = {
    shirt: { body: fabric("#C3D5E6", "pinstripe", "#1C2A44", 1, 0), trim: fabric("#C3D5E6"), buttons: "pearl", embroidery: "none" },
    polo: { body: fabric("#14291F"), trim: fabric("#14291F", "solid"), buttons: "matching", embroidery: "none" },
    kurta: { body: fabric("#EFE6D2", "booti", "#C9A04A", 1, 0), trim: fabric("#5B1A24"), buttons: "gold", embroidery: "collar" },
    sherwani: { body: fabric("#5B1A24", "jaali", "#D6B56A", 1, 0), trim: fabric("#5B1A24"), buttons: "gold", embroidery: "border" },
  };
  const p = presets[kind];
  return {
    version: 1,
    garment: kind,
    fabrics: { body: p.body, sleeves: { ...p.body }, collar: { ...p.body }, trim: p.trim },
    options: {
      sleeve: g.sleeves[0],
      collar: g.collars[0],
      length: g.lengths[g.lengths.length - 1],
      buttons: p.buttons,
      embroidery: p.embroidery,
      pocket: kind === "shirt",
    },
    name: "",
  };
}

/** Switch garment, keeping the customer's fabrics and any options the new garment allows. */
export function changeGarment(spec: DesignSpec, kind: GarmentKind): DesignSpec {
  const g = garmentDef(kind);
  const o = spec.options;
  return {
    ...spec,
    garment: kind,
    options: {
      sleeve: g.sleeves.includes(o.sleeve) ? o.sleeve : g.sleeves[0],
      collar: g.collars.includes(o.collar) ? o.collar : g.collars[0],
      length: g.lengths.includes(o.length) ? o.length : g.lengths[g.lengths.length - 1],
      buttons: o.buttons,
      embroidery: g.embroidery.includes(o.embroidery) ? o.embroidery : "none",
      pocket: g.pocket ? o.pocket : false,
    },
  };
}

/* ───────────── Validation ───────────── */

const HEX = /^#[0-9a-fA-F]{6}$/;
const ANGLES: PatternAngle[] = [0, 45, 90, 135];

function cleanFabric(raw: unknown, fallback: Fabric): Fabric {
  const f = (raw ?? {}) as Partial<Fabric>;
  return {
    color: typeof f.color === "string" && HEX.test(f.color) ? f.color.toUpperCase() : fallback.color,
    pattern: PATTERNS.some((p) => p.key === f.pattern) ? (f.pattern as PatternKind) : fallback.pattern,
    accent: typeof f.accent === "string" && HEX.test(f.accent) ? f.accent.toUpperCase() : fallback.accent,
    scale: Math.round(Math.min(1.6, Math.max(0.6, Number(f.scale) || 1)) * 10) / 10,
    angle: ANGLES.includes(Number(f.angle) as PatternAngle) ? (Number(f.angle) as PatternAngle) : 0,
  };
}

/** Accept a design from a client: unknown values are replaced, options are limited to what the garment allows. Null if unusable. */
export function sanitiseDesign(raw: unknown): DesignSpec | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Partial<DesignSpec>;
  if (r.version !== 1 || !GARMENTS.some((g) => g.kind === r.garment)) return null;
  const base = defaultDesign(r.garment as GarmentKind);
  const fabrics = Object.fromEntries(ZONES.map(({ key }) => [key, cleanFabric(r.fabrics?.[key], base.fabrics[key])])) as Record<Zone, Fabric>;
  const o = (r.options ?? {}) as Partial<DesignOptions>;
  const spec = changeGarment(
    {
      ...base,
      fabrics,
      options: {
        sleeve: o.sleeve as SleeveStyle,
        collar: o.collar as CollarStyle,
        length: o.length as LengthStyle,
        buttons: BUTTONS.some((b) => b.key === o.buttons) ? (o.buttons as ButtonStyle) : base.options.buttons,
        embroidery: o.embroidery as Embroidery,
        pocket: !!o.pocket,
      },
      name: String(r.name ?? "").trim().slice(0, 40),
    },
    r.garment as GarmentKind,
  );
  return spec;
}

/** Stable key: the same design always produces the same key (used for bag lines). */
export function designKey(spec: DesignSpec): string {
  const f = (x: Fabric) => `${x.color}${x.pattern}${x.accent}${x.scale}${x.angle}`;
  const o = spec.options;
  const raw = [spec.garment, ...ZONES.map((z) => f(spec.fabrics[z.key])), o.sleeve, o.collar, o.length, o.buttons, o.embroidery, o.pocket ? 1 : 0].join("|");
  let h = 5381;
  for (let i = 0; i < raw.length; i++) h = ((h << 5) + h + raw.charCodeAt(i)) | 0;
  return `d${(h >>> 0).toString(36)}`;
}

/* ───────────── Pricing ───────────── */

const roundTo100 = (n: number) => Math.round(n / 100) * 100;

export interface DesignPrice {
  total: number;
  lines: { label: string; amount: number }[];
}

/** The price of a design. The server recomputes this — the client value is only a preview. */
export function designPrice(spec: DesignSpec): DesignPrice {
  const g = garmentDef(spec.garment);
  const lines: DesignPrice["lines"] = [{ label: `${g.label}, made to order`, amount: g.basePrice }];
  const tier = Math.max(...ZONES.map((z) => PATTERNS.find((p) => p.key === spec.fabrics[z.key].pattern)!.tier));
  if (tier === 1) lines.push({ label: "Woven pattern", amount: roundTo100(g.basePrice * 0.08) });
  if (tier === 2) lines.push({ label: "Heritage motif weave", amount: roundTo100(g.basePrice * 0.15) });
  const body = spec.fabrics.body;
  const contrast = ZONES.some((z) => z.key !== "body" && fabricLabel(spec.fabrics[z.key]) !== fabricLabel(body));
  if (contrast) lines.push({ label: "Contrast panels", amount: roundTo100(g.basePrice * 0.05) });
  const emb = { none: 0, collar: 0.12, border: 0.25, booti: 0.35 }[spec.options.embroidery];
  if (emb) lines.push({ label: `Hand embroidery — ${EMBROIDERY.find((e) => e.key === spec.options.embroidery)!.label.toLowerCase()}`, amount: roundTo100(g.basePrice * emb) });
  return { total: lines.reduce((s, l) => s + l.amount, 0), lines };
}

/* ───────────── Description (cart, emails, tailoring sheet) ───────────── */

export const colorName = (hex: string) => FABRIC_COLORS.find((c) => c.hex.toUpperCase() === hex.toUpperCase())?.name ?? hex.toUpperCase();

export function fabricLabel(f: Fabric) {
  if (f.pattern === "solid") return `${colorName(f.color)} solid`;
  const p = PATTERNS.find((x) => x.key === f.pattern)!.label.toLowerCase();
  return `${colorName(f.color)} with ${colorName(f.accent)} ${p}${f.scale !== 1 ? ` (${f.scale < 1 ? "fine" : "bold"} ${f.scale}×)` : ""}${f.angle ? `, ${f.angle}°` : ""}`;
}

export function designTitle(spec: DesignSpec) {
  return spec.name ? `${spec.name} — custom ${garmentDef(spec.garment).label.toLowerCase()}` : `Custom ${garmentDef(spec.garment).label}`;
}

/** Short summary, e.g. "Long · full sleeves · band collar · gold buttons · zari border". */
export function designSummary(spec: DesignSpec) {
  const g = garmentDef(spec.garment);
  const o = spec.options;
  return [
    g.lengths.length > 1 ? LENGTH_LABEL[o.length] : null,
    SLEEVE_LABEL[o.sleeve],
    COLLAR_LABEL[o.collar],
    `${BUTTONS.find((b) => b.key === o.buttons)!.label.toLowerCase()} buttons`,
    o.embroidery !== "none" ? EMBROIDERY.find((e) => e.key === o.embroidery)!.label.toLowerCase() : null,
    o.pocket ? "chest pocket" : null,
  ]
    .filter(Boolean)
    .join(" · ");
}

/** Full spec for the tailor: one line per zone plus the style summary. */
export function designSpecLines(spec: DesignSpec) {
  return [
    { label: "Style", value: designSummary(spec) },
    ...ZONES.filter((z) => z.key !== "collar" || spec.options.collar !== "round").map((z) => ({ label: z.label, value: fabricLabel(spec.fabrics[z.key]) })),
  ];
}

/* ───────────── Drawing data ───────────── */

/** A shape inside a pattern tile, in tile units. "accent" uses the fabric's pattern colour. */
export type Prim =
  | { kind: "rect"; x: number; y: number; w: number; h: number; opacity?: number }
  | { kind: "circle"; cx: number; cy: number; r: number; fill?: boolean; sw?: number; opacity?: number }
  | { kind: "path"; d: string; fill?: boolean; sw?: number; opacity?: number };

/** Repeating tile for a fabric pattern; renderers wrap it in <pattern width=size*scale patternTransform=rotate(angle)>. */
export function patternTile(pattern: PatternKind): { size: number; prims: Prim[] } {
  switch (pattern) {
    case "solid":
      return { size: 10, prims: [] };
    case "stripes":
      return { size: 16, prims: [{ kind: "rect", x: 0, y: 0, w: 6, h: 16 }] };
    case "pinstripe":
      return { size: 10, prims: [{ kind: "rect", x: 0, y: 0, w: 1, h: 10 }] };
    case "checks":
      return {
        size: 26,
        prims: [
          { kind: "rect", x: 0, y: 0, w: 9, h: 26, opacity: 0.45 },
          { kind: "rect", x: 0, y: 0, w: 26, h: 9, opacity: 0.45 },
          { kind: "rect", x: 16, y: 0, w: 1, h: 26, opacity: 0.8 },
          { kind: "rect", x: 0, y: 16, w: 26, h: 1, opacity: 0.8 },
        ],
      };
    case "gingham":
      return {
        size: 16,
        prims: [
          { kind: "rect", x: 0, y: 0, w: 8, h: 16, opacity: 0.5 },
          { kind: "rect", x: 0, y: 0, w: 16, h: 8, opacity: 0.5 },
        ],
      };
    case "polka":
      return {
        size: 18,
        prims: [
          { kind: "circle", cx: 4.5, cy: 4.5, r: 2.3, fill: true },
          { kind: "circle", cx: 13.5, cy: 13.5, r: 2.3, fill: true },
        ],
      };
    case "herringbone":
      return {
        size: 16,
        prims: [
          { kind: "path", d: "M0 0 L8 8 L0 16 M8 0 L16 8 L8 16", sw: 1.6, opacity: 0.85 },
        ],
      };
    case "paisley":
      return {
        size: 44,
        prims: [
          { kind: "path", d: "M14 6 C22 6 26 14 24 22 C22 30 12 33 7 27 C3 22 6 16 11 16 C15 16 16 20 14 22", fill: false, sw: 1.6 },
          { kind: "path", d: "M14 10 C19 11 21 16 20 21 C18 26 12 27 10 23", fill: false, sw: 0.9, opacity: 0.8 },
          { kind: "circle", cx: 16, cy: 19, r: 1.6, fill: true },
          { kind: "path", d: "M36 28 C44 28 48 36 46 44 C44 52 34 55 29 49 C25 44 28 38 33 38 C37 38 38 42 36 44", fill: false, sw: 1.6 },
          { kind: "path", d: "M36 28 C40 30 42 34 42 38", fill: false, sw: 0.9, opacity: 0.8 },
          { kind: "circle", cx: 4, cy: 38, r: 1.2, fill: true, opacity: 0.8 },
          { kind: "circle", cx: 30, cy: 8, r: 1.2, fill: true, opacity: 0.8 },
        ],
      };
    case "booti":
      return {
        size: 28,
        prims: [
          { kind: "circle", cx: 7, cy: 4.6, r: 1.9, fill: true },
          { kind: "circle", cx: 9.4, cy: 7, r: 1.9, fill: true },
          { kind: "circle", cx: 7, cy: 9.4, r: 1.9, fill: true },
          { kind: "circle", cx: 4.6, cy: 7, r: 1.9, fill: true },
          { kind: "circle", cx: 21, cy: 18.6, r: 1.9, fill: true },
          { kind: "circle", cx: 23.4, cy: 21, r: 1.9, fill: true },
          { kind: "circle", cx: 21, cy: 23.4, r: 1.9, fill: true },
          { kind: "circle", cx: 18.6, cy: 21, r: 1.9, fill: true },
        ],
      };
    case "jaali":
      return {
        size: 24,
        prims: [
          { kind: "path", d: "M12 0 L24 12 L12 24 L0 12 Z", fill: false, sw: 1.2 },
          { kind: "circle", cx: 12, cy: 12, r: 2.6, fill: false, sw: 1 },
          { kind: "circle", cx: 0, cy: 0, r: 1.4, fill: true },
          { kind: "circle", cx: 24, cy: 0, r: 1.4, fill: true },
          { kind: "circle", cx: 0, cy: 24, r: 1.4, fill: true },
          { kind: "circle", cx: 24, cy: 24, r: 1.4, fill: true },
        ],
      };
  }
}

/** A filled piece of the garment. `mirror` pieces are drawn again, flipped across the centre line. */
export interface Piece {
  id: string;
  zone: Zone;
  d: string;
  mirror?: boolean;
}

export interface Drawing {
  width: number;
  height: number;
  /** Back to front: sleeves, body, trims, collar. */
  pieces: Piece[];
  /** Overlay drawn with the zari pattern over these pieces (booti embroidery, borders). */
  zari: { d: string; mirror?: boolean; pattern: PatternKind }[];
  /** Zari outlines (collar / placket embroidery). */
  zariLines: { d: string; mirror?: boolean }[];
  /** Seams and folds — thin dark lines at low opacity. */
  lines: { d: string; mirror?: boolean; opacity: number }[];
  buttons: { cx: number; cy: number; r: number }[];
  buttonColor: string;
  /** Tipped polo collars: stripes in the trim accent colour. */
  tipping: { d: string; mirror?: boolean }[];
}

export const DRAW_W = 300;
export const DRAW_H = 380;
const CX = DRAW_W / 2;

/** Shade a hex colour: amt < 0 darkens, > 0 lightens (−1…1). */
export function shade(hex: string, amt: number) {
  const n = parseInt(hex.slice(1), 16);
  const ch = (v: number) => Math.round(Math.min(255, Math.max(0, amt < 0 ? v * (1 + amt) : v + (255 - v) * amt)));
  const r = ch((n >> 16) & 255);
  const g = ch((n >> 8) & 255);
  const b = ch(n & 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1).toUpperCase()}`;
}

interface Silhouette {
  hem: number;
  flare: number;
  neckDip: number;
  curve: number;
}

const SILHOUETTE: Record<GarmentKind, (o: DesignOptions) => Silhouette> = {
  shirt: () => ({ hem: 300, flare: 2, neckDip: 12, curve: 18 }),
  polo: () => ({ hem: 286, flare: 0, neckDip: 14, curve: 6 }),
  kurta: (o) => (o.length === "long" ? { hem: 364, flare: 20, neckDip: o.collar === "round" ? 20 : 12, curve: 10 } : { hem: 332, flare: 16, neckDip: o.collar === "round" ? 20 : 12, curve: 10 }),
  sherwani: () => ({ hem: 364, flare: 12, neckDip: 12, curve: 6 }),
};

const L = 86;
const R = 214;
/** x of the left side seam at height y (sides flare out below the waist). */
const sideX = (s: Silhouette, y: number) => (y <= 130 ? L + 2 : L + 2 - (s.flare * (y - 130)) / (s.hem - 6 - 130));

function torsoPath(s: Silhouette) {
  const bl = L + 2 - s.flare;
  const br = R - 2 + s.flare;
  return `M128 44 Q${CX} ${44 + s.neckDip} 172 44 L206 56 Q${R} 60 ${R} 70 L${R - 2} 130 L${br} ${s.hem - 6} Q${CX} ${s.hem + s.curve} ${bl} ${s.hem - 6} L${L + 2} 130 L${L} 70 Q${L} 60 94 56 Z`;
}

/** Hem band (for zari border) following the hem curve. */
function hemBand(s: Silhouette, depth = 16) {
  const y0 = s.hem - 6 - depth;
  const l0 = sideX(s, y0);
  const r0 = DRAW_W - l0;
  const bl = L + 2 - s.flare;
  const br = R - 2 + s.flare;
  return `M${l0} ${y0} Q${CX} ${y0 + s.curve} ${r0} ${y0} L${br} ${s.hem - 6} Q${CX} ${s.hem + s.curve} ${bl} ${s.hem - 6} Z`;
}

const SLEEVES: Record<SleeveStyle, { sleeve: string; cuff: string; crease: string }> = {
  full: {
    sleeve: "M94 56 Q80 58 72 68 L46 246 L76 252 L90 140 L86 70 Q86 60 94 56 Z",
    cuff: "M46 246 L76 252 L73 272 L42 266 Z",
    crease: "M74 96 L60 236",
  },
  "three-quarter": {
    sleeve: "M94 56 Q80 58 72 68 L52 200 L82 206 L90 140 L86 70 Q86 60 94 56 Z",
    cuff: "M52 200 L82 206 L81 214 L51 208 Z",
    crease: "M74 96 L64 192",
  },
  half: {
    sleeve: "M94 56 Q80 58 72 68 L58 140 L88 146 L90 110 L86 70 Q86 60 94 56 Z",
    cuff: "M58 140 L88 146 L87 155 L57 149 Z",
    crease: "M76 92 L70 134",
  },
};

function collarPieces(c: CollarStyle): { pieces: Piece[]; zari: string[]; tipping: { d: string; mirror?: boolean }[]; buttons: { cx: number; cy: number; r: number }[] } {
  switch (c) {
    case "spread":
    case "button-down":
      return {
        pieces: [
          { id: "collar-band", zone: "collar", d: `M128 44 Q${CX} 54 172 44 L170 36 Q${CX} 46 130 36 Z` },
          { id: "collar-leaf", zone: "collar", d: "M131 39 L150 62 L137 79 L115 53 Z", mirror: true },
        ],
        zari: ["M116 53 L137 78 L150 62"],
        tipping: [],
        buttons: c === "button-down" ? [{ cx: 124, cy: 68, r: 1.8 }, { cx: 176, cy: 68, r: 1.8 }] : [],
      };
    case "mandarin":
      return {
        pieces: [{ id: "collar-stand", zone: "collar", d: `M126 47 Q${CX} 60 174 47 L174 34 Q${CX} 47 126 34 Z` }],
        zari: [`M127 36 Q${CX} 49 173 36`, `M127 45 Q${CX} 58 173 45`],
        tipping: [],
        buttons: [],
      };
    case "band":
      return {
        pieces: [{ id: "collar-band", zone: "collar", d: `M128 47 Q${CX} 58 172 47 L172 39 Q${CX} 50 128 39 Z` }],
        zari: [`M129 41 Q${CX} 52 171 41`],
        tipping: [],
        buttons: [],
      };
    case "polo":
    case "tipped-polo":
      return {
        pieces: [
          { id: "collar-band", zone: "collar", d: `M128 44 Q${CX} 54 172 44 L170 36 Q${CX} 46 130 36 Z` },
          { id: "collar-flap", zone: "collar", d: "M131 39 L150 56 L141 84 L111 62 Q117 49 131 39 Z", mirror: true },
        ],
        zari: [],
        tipping: c === "tipped-polo" ? [{ d: "M114 61 L140 80", mirror: true }, { d: "M116 57 L141 76", mirror: true }] : [],
        buttons: [],
      };
    case "round":
      return { pieces: [], zari: [`M128 44 Q${CX} 64 172 44`], tipping: [], buttons: [] };
  }
}

/** Everything a renderer needs to draw the design (viewBox 0 0 300 380). */
export function drawGarment(spec: DesignSpec): Drawing {
  const o = spec.options;
  const s = SILHOUETTE[spec.garment](o);
  const sl = SLEEVES[o.sleeve];
  const col = collarPieces(o.collar);
  const pieces: Piece[] = [
    { id: "sleeve", zone: "sleeves", d: sl.sleeve, mirror: true },
    { id: "cuff", zone: "trim", d: sl.cuff, mirror: true },
    { id: "body", zone: "body", d: torsoPath(s) },
  ];
  const lines: Drawing["lines"] = [
    { d: sl.crease, mirror: true, opacity: 0.18 },
    { d: `M112 ${s.hem - 120} Q116 ${s.hem - 70} 110 ${s.hem - 20}`, mirror: true, opacity: 0.1 },
  ];
  const zari: Drawing["zari"] = [];
  const zariLines: Drawing["zariLines"] = [];
  const buttons: Drawing["buttons"] = [...col.buttons];

  switch (spec.garment) {
    case "shirt": {
      lines.push({ d: `M145 52 L145 ${s.hem + 2}`, opacity: 0.22 }, { d: `M155 52 L155 ${s.hem + 2}`, opacity: 0.22 });
      for (let y = 72; y < s.hem - 10; y += 32) buttons.push({ cx: CX, cy: y, r: 2.8 });
      if (o.pocket) {
        pieces.push({ id: "pocket", zone: "body", d: "M166 98 L192 98 L192 124 L179 130 L166 124 Z" });
        lines.push({ d: "M166 104 L192 104", opacity: 0.2 });
      }
      if (o.embroidery === "collar") zariLines.push({ d: `M145 64 L145 ${s.hem - 4}` });
      break;
    }
    case "polo": {
      pieces.push({ id: "placket", zone: "trim", d: "M143 52 L157 52 L157 116 L143 116 Z" });
      for (const y of [66, 84, 102]) buttons.push({ cx: CX, cy: y, r: 2.6 });
      pieces.push({ id: "hem-rib", zone: "body", d: `M${L + 2} ${s.hem - 14} L${R - 2} ${s.hem - 14} L${R - 2} ${s.hem - 6} Q${CX} ${s.hem + s.curve} ${L + 2} ${s.hem - 6} Z` });
      lines.push({ d: `M${L + 2} ${s.hem - 6} L${L + 2} ${s.hem - 26}`, mirror: true, opacity: 0.3 });
      if (o.pocket) pieces.push({ id: "pocket", zone: "trim", d: "M168 100 L190 100 L190 122 L168 122 Z" });
      break;
    }
    case "kurta": {
      pieces.push({ id: "placket", zone: "trim", d: "M143 50 L157 50 L157 148 L143 148 Z" });
      for (const y of [64, 86, 108, 130]) buttons.push({ cx: CX, cy: y, r: 2.6 });
      const slitTop = s.hem - 58;
      lines.push({ d: `M${sideX(s, s.hem - 6)} ${s.hem - 6} L${sideX(s, slitTop)} ${slitTop}`, mirror: true, opacity: 0.35 });
      if (o.embroidery === "collar") zariLines.push({ d: "M143 50 L143 148 L157 148 L157 50" });
      break;
    }
    case "sherwani": {
      lines.push({ d: `M${CX} 50 L${CX} ${s.hem + 4}`, opacity: 0.3 });
      for (let y = 62; y <= 254; y += 24) buttons.push({ cx: CX, cy: y, r: 3.2 });
      lines.push({ d: "M166 112 L192 109", opacity: 0.35 }, { d: `M${sideX(s, s.hem - 6)} ${s.hem - 6} L${sideX(s, s.hem - 40)} ${s.hem - 40}`, mirror: true, opacity: 0.3 });
      if (o.embroidery === "collar") zariLines.push({ d: `M${CX - 3} 50 L${CX - 3} ${s.hem - 4}` }, { d: `M${CX + 3} 50 L${CX + 3} ${s.hem - 4}` });
      break;
    }
  }

  pieces.push(...col.pieces);
  if (o.embroidery === "collar") col.zari.forEach((d) => zariLines.push({ d, mirror: o.collar === "spread" || o.collar === "button-down" }));
  if (o.embroidery === "border") {
    zari.push({ d: hemBand(s), pattern: "jaali" }, { d: sl.cuff, mirror: true, pattern: "jaali" });
    zariLines.push({ d: `M${sideX(s, s.hem - 22)} ${s.hem - 22} Q${CX} ${s.hem - 22 + s.curve} ${DRAW_W - sideX(s, s.hem - 22)} ${s.hem - 22}` });
  }
  if (o.embroidery === "booti") zari.push({ d: torsoPath(s), pattern: "booti" });

  const btn = BUTTONS.find((b) => b.key === o.buttons)!;
  return {
    width: DRAW_W,
    height: DRAW_H,
    pieces,
    zari,
    zariLines,
    lines,
    buttons,
    buttonColor: btn.hex ?? shade(spec.fabrics.trim.color, -0.35),
    tipping: col.tipping,
  };
}

/** Transform that mirrors a piece across the garment's centre line. */
export const MIRROR = `translate(${DRAW_W} 0) scale(-1 1)`;

/* ───────────── In the bag ───────────── */

export const DESIGN_PRODUCT_ID = "DESIGN";
export const designSlug = (k: GarmentKind) => `design-${k}`;
export const isDesignSlug = (slug: string) => slug.startsWith("design-");

/**
 * A product-shaped stand-in for a design, so bags, summaries and order lists
 * can treat it like any piece. Its one "colour" is the design key, which keeps
 * different designs on separate bag lines. Made-to-measure is included free.
 */
export function designProduct(spec: DesignSpec): Product {
  const g = garmentDef(spec.garment);
  return {
    id: DESIGN_PRODUCT_ID,
    slug: designSlug(spec.garment),
    name: designTitle(spec),
    category: g.category,
    price: designPrice(spec).total,
    sizes: g.sizes,
    colors: [{ name: designKey(spec), hex: spec.fabrics.body.color }],
    fabric: fabricLabel(spec.fabrics.body),
    description: designSummary(spec),
    details: designSpecLines(spec).map((l) => `${l.label}: ${l.value}`),
    care: [],
    tags: [],
    occasions: [],
    madeToMeasure: true,
    design: spec,
  };
}

/* ───────────── Starting looks ───────────── */

function look(kind: GarmentKind, f: { body: Fabric; sleeves?: Fabric; collar?: Fabric; trim?: Fabric }, o: Partial<DesignOptions>, name: string): DesignSpec {
  const d = defaultDesign(kind);
  return changeGarment(
    {
      ...d,
      fabrics: { body: f.body, sleeves: f.sleeves ?? { ...f.body }, collar: f.collar ?? { ...f.body }, trim: f.trim ?? { ...f.body } },
      options: { ...d.options, ...o },
      name,
    },
    kind,
  );
}

/** Curated starting points shown at the top of the Studio (web and app). */
export const DESIGN_LOOKS: { title: string; note: string; spec: DesignSpec }[] = [
  {
    title: "Sangeet ivory",
    note: "Ivory kurta, gold booti, maroon trims",
    spec: look("kurta", { body: fabric("#EFE6D2", "booti", "#C9A04A"), trim: fabric("#5B1A24") }, { embroidery: "collar", buttons: "gold", length: "long", collar: "band" }, "Sangeet ivory"),
  },
  {
    title: "Royal maroon",
    note: "Jaali-woven sherwani with zari border",
    spec: look("sherwani", { body: fabric("#5B1A24", "jaali", "#D6B56A"), trim: fabric("#5B1A24") }, { embroidery: "border", buttons: "gold" }, "Royal maroon"),
  },
  {
    title: "Boardroom blue",
    note: "Powder-blue pinstripe, white collar",
    spec: look("shirt", { body: fabric("#C3D5E6", "pinstripe", "#1C2A44"), collar: fabric("#F7F4EC"), trim: fabric("#F7F4EC") }, { collar: "spread", buttons: "pearl", pocket: false }, "Boardroom blue"),
  },
  {
    title: "Club green",
    note: "Royal-green polo with gold tipping",
    spec: look("polo", { body: fabric("#14291F"), trim: fabric("#14291F", "solid", "#C9A04A") }, { collar: "tipped-polo", buttons: "gold", pocket: false }, "Club green"),
  },
  {
    title: "Monsoon paisley",
    note: "Teal paisley kurta, round neck",
    spec: look("kurta", { body: fabric("#1F5E66", "paisley", "#E5C4BB", 1.1), trim: fabric("#1F5E66") }, { collar: "round", embroidery: "none", length: "regular", buttons: "pearl" }, "Monsoon paisley"),
  },
];
