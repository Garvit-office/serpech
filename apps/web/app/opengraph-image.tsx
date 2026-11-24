import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { ImageResponse } from "next/og";

export const alt = "SARPECH — Crowned in Heritage. Luxury Indian menswear.";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Social card: the official primary logo on brand green with the wordmark. */
export default async function OpengraphImage() {
  const logo = await readFile(join(process.cwd(), "public/logo/sarpech_logo_primary.png"));
  const src = `data:image/png;base64,${logo.toString("base64")}`;
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 64,
          background: "#0E1A15",
          border: "2px solid #C9A04A",
        }}
      >
        <img src={src} width={420} height={420} alt="" />
        <div style={{ display: "flex", flexDirection: "column", color: "#F5EEE0" }}>
          <div style={{ fontSize: 96, letterSpacing: 24, color: "#E3C77E" }}>SARPECH</div>
          <div style={{ fontSize: 40, fontStyle: "italic", marginTop: 12 }}>Crowned in Heritage</div>
          <div style={{ fontSize: 22, letterSpacing: 8, marginTop: 24, color: "#C9A04A" }}>EST. 2026 · ROYAL HERITAGE WEAR</div>
        </div>
      </div>
    ),
    size,
  );
}
