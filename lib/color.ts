/** Small colour helpers for shading garment illustrations. */

function clamp(n: number) {
  return Math.max(0, Math.min(255, Math.round(n)));
}

export function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function rgbToHex([r, g, b]: [number, number, number]) {
  return `#${[r, g, b].map((v) => clamp(v).toString(16).padStart(2, "0")).join("")}`;
}

/** Mix towards black (amount < 0) or white (amount > 0). amount in [-1, 1]. */
export function shade(hex: string, amount: number) {
  const [r, g, b] = hexToRgb(hex);
  const t = amount < 0 ? 0 : 255;
  const a = Math.abs(amount);
  return rgbToHex([r + (t - r) * a, g + (t - g) * a, b + (t - b) * a]);
}

/** Relative luminance 0–1. */
export function luminance(hex: string) {
  const [r, g, b] = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function isLight(hex: string) {
  return luminance(hex) > 0.45;
}

/** Outline colour for a fabric: darker for light cloth, lighter for dark cloth. */
export function outlineFor(hex: string) {
  return isLight(hex) ? shade(hex, -0.38) : shade(hex, -0.45);
}
