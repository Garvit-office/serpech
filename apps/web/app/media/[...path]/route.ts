import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import { UPLOAD_DIR } from "@sarpech/backend/db";

const TYPES: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".avif": "image/avif",
};

/**
 * Serves product images uploaded through the admin (storage/uploads).
 * Files added after build aren't served from /public, hence this route.
 */
export async function GET(_req: Request, ctx: RouteContext<"/media/[...path]">) {
  const { path } = await ctx.params;
  const rel = normalize(path.join("/"));
  if (rel.startsWith("..") || rel.includes("\0")) return new Response("Not found", { status: 404 });
  const type = TYPES[extname(rel).toLowerCase()];
  if (!type) return new Response("Not found", { status: 404 });
  const file = join(UPLOAD_DIR, rel);
  try {
    const [buf, info] = await Promise.all([readFile(file), stat(file)]);
    return new Response(new Uint8Array(buf), {
      headers: {
        "content-type": type,
        "content-length": String(info.size),
        // uploads are content-addressed (random names), so they never change
        "cache-control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
