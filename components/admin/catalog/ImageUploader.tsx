"use client";

import Image from "next/image";
import { useId, useRef, useState } from "react";

/**
 * Image list editor: drag-and-drop / multi-select upload to /api/admin/upload,
 * thumbnails, keyboard-accessible reorder and remove. First image = card image.
 */
export function ImageUploader({ value, onChange, label = "Images", compact = false }: { value: string[]; onChange: (v: string[]) => void; label?: string; compact?: boolean }) {
  const inputId = useId();
  const input = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [drag, setDrag] = useState(false);

  async function upload(list: FileList | File[]) {
    const files = [...list];
    if (!files.length) return;
    setBusy(true);
    setError(null);
    try {
      const fd = new FormData();
      files.forEach((f) => fd.append("files", f));
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const json = (await res.json().catch(() => ({}))) as { files?: { url: string }[]; error?: string };
      if (!res.ok || !json.files) throw new Error(json.error ?? "Upload failed.");
      onChange([...value, ...json.files.map((f) => f.url)]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(false);
      if (input.current) input.current.value = "";
    }
  }

  const move = (i: number, d: -1 | 1) => {
    const j = i + d;
    if (j < 0 || j >= value.length) return;
    const next = [...value];
    [next[i], next[j]] = [next[j], next[i]];
    onChange(next);
  };

  return (
    <div>
      {!compact && <p className="field-label">{label}</p>}
      {value.length > 0 && (
        <ol className={`mb-3 grid gap-3 ${compact ? "grid-cols-3 sm:grid-cols-4" : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"}`} aria-label={`${label} (first is the main image)`}>
          {value.map((src, i) => (
            <li key={src} className="border border-mist bg-pearl">
              <div className="relative aspect-[5/6]">
                <Image src={src} alt={`${label} ${i + 1}`} fill sizes="160px" className="object-cover" />
                {i === 0 && !compact && (
                  <span className="absolute left-1.5 top-1.5 bg-brand-green px-1.5 py-0.5 font-display text-[0.55rem] tracking-[0.14em] text-ivory">MAIN</span>
                )}
              </div>
              <div className="flex items-center justify-between gap-1 px-1.5 py-1 text-sm">
                <span className="flex gap-1">
                  <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move image ${i + 1} earlier`} className="grid size-8 place-items-center border border-mist disabled:opacity-30">
                    ←
                  </button>
                  <button type="button" onClick={() => move(i, 1)} disabled={i === value.length - 1} aria-label={`Move image ${i + 1} later`} className="grid size-8 place-items-center border border-mist disabled:opacity-30">
                    →
                  </button>
                </span>
                <button type="button" onClick={() => onChange(value.filter((_, k) => k !== i))} aria-label={`Remove image ${i + 1}`} className="px-1 text-ruby underline underline-offset-2">
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ol>
      )}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          void upload(e.dataTransfer.files);
        }}
        className={`flex flex-col items-center justify-center gap-2 border border-dashed px-4 text-center transition ${compact ? "py-3" : "py-8"} ${
          drag ? "border-brand-green bg-pearl" : "border-gold/70"
        }`}
      >
        <p className="text-base text-ink-soft">{busy ? "Uploading…" : compact ? "Drop images or" : "Drag and drop JPG, PNG, WebP or AVIF (max 8 MB each), or"}</p>
        <label htmlFor={inputId} className="btn-outline min-h-9 cursor-pointer px-4 py-1.5">
          Choose files
        </label>
        <input
          ref={input}
          id={inputId}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/avif"
          multiple
          className="sr-only"
          onChange={(e) => e.target.files && void upload(e.target.files)}
          disabled={busy}
        />
      </div>
      {error && (
        <p role="alert" className="mt-2 text-base text-ruby">
          {error}
        </p>
      )}
    </div>
  );
}
