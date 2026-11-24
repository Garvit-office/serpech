import { randomBytes } from "node:crypto";
import { writeFile } from "node:fs/promises";
import { join } from "node:path";
import { NextResponse } from "next/server";
import { currentAdmin } from "@sarpech/backend/auth";
import { UPLOAD_DIR } from "@sarpech/backend/db";
import { audit } from "@sarpech/backend/activity";

const MAX_BYTES = 8 * 1024 * 1024;

/** Detect the real image type from magic bytes (never trust the filename or MIME header). */
function sniff(b: Uint8Array): ".jpg" | ".png" | ".webp" | ".avif" | null {
  if (b.length < 12) return null;
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return ".jpg";
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return ".png";
  const ascii = (s: number, e: number) => String.fromCharCode(...b.slice(s, e));
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return ".webp";
  if (ascii(4, 8) === "ftyp" && /avif|avis/.test(ascii(8, 12))) return ".avif";
  return null;
}

/** Admin image upload: multipart field "files" (one or many). Returns { files: [{ url }] }. */
export async function POST(req: Request) {
  const admin = await currentAdmin();
  if (!admin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Expected multipart form data." }, { status: 400 });
  }
  const files = form.getAll("files").filter((f): f is File => f instanceof File);
  if (!files.length) return NextResponse.json({ error: "No files received." }, { status: 400 });
  if (files.length > 12) return NextResponse.json({ error: "Upload at most 12 images at a time." }, { status: 400 });

  const out: { url: string; name: string }[] = [];
  for (const file of files) {
    if (file.size > MAX_BYTES) return NextResponse.json({ error: `${file.name} is larger than 8 MB.` }, { status: 413 });
    const bytes = new Uint8Array(await file.arrayBuffer());
    const ext = sniff(bytes);
    if (!ext) return NextResponse.json({ error: `${file.name} isn't a JPG, PNG, WebP or AVIF image.` }, { status: 415 });
    const name = `${randomBytes(12).toString("hex")}${ext}`;
    await writeFile(join(UPLOAD_DIR, name), bytes);
    out.push({ url: `/media/${name}`, name: file.name });
  }
  audit(admin, "upload", "media", null, `Uploaded ${out.length} image${out.length === 1 ? "" : "s"}`);
  return NextResponse.json({ files: out });
}
