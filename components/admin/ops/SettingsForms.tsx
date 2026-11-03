"use client";

import { useActionState, useState, useTransition } from "react";
import { pruneActivity, saveSettings } from "@/app/admin/(panel)/settings/actions";
import type { StoreSettings } from "@/lib/types";

const FIELDS: { key: keyof StoreSettings; label: string; hint: string; money?: boolean }[] = [
  { key: "announcement", label: "Announcement bar", hint: "Shown in the thin bar above the header on every page." },
  { key: "freeShippingThreshold", label: "Free shipping above (₹)", hint: "Order value (after coupons) that unlocks complimentary standard shipping.", money: true },
  { key: "standardShipping", label: "Standard shipping fee (₹)", hint: "Charged below the free-shipping threshold.", money: true },
  { key: "expressShipping", label: "Express shipping fee (₹)", hint: "Always charged for express delivery.", money: true },
  { key: "madeToMeasureFee", label: "Made-to-measure fee (₹)", hint: "Added per piece when a customer orders with their Royal Fit measurements.", money: true },
  { key: "madeToMeasureDays", label: "Made-to-measure extra days", hint: "Shown to customers as extra tailoring time before dispatch.", money: true },
];

export function SettingsForm({ settings }: { settings: StoreSettings }) {
  const [state, action, pending] = useActionState(saveSettings, null);
  const err = state && !state.ok ? state.fieldErrors ?? {} : {};
  const value = (k: keyof StoreSettings) => state?.values?.[k] ?? String(settings[k]);
  return (
    <form action={action} noValidate className="grid gap-5">
      {FIELDS.map((f) => (
        <div key={f.key}>
          <label htmlFor={`set-${f.key}`} className="field-label">
            {f.label}
          </label>
          <input
            id={`set-${f.key}`}
            name={f.key}
            // key re-mounts the input with the submitted value after React resets the form
            key={`${f.key}-${value(f.key)}`}
            defaultValue={value(f.key)}
            inputMode={f.money ? "numeric" : undefined}
            maxLength={f.money ? 9 : 120}
            aria-invalid={!!err[f.key]}
            aria-describedby={`set-${f.key}-hint${err[f.key] ? ` set-${f.key}-err` : ""}`}
            className="field"
          />
          <p id={`set-${f.key}-hint`} className="mt-1 text-sm text-ink-soft">
            {f.hint}
          </p>
          {err[f.key] && (
            <p id={`set-${f.key}-err`} className="mt-1 text-sm text-ruby">
              {err[f.key]}
            </p>
          )}
        </div>
      ))}
      <div className="flex flex-wrap items-center gap-3">
        <button type="submit" disabled={pending} className="btn-royal">
          {pending ? "Saving…" : "Save settings"}
        </button>
        {state && (
          <p role={state.ok ? "status" : "alert"} className={`text-base ${state.ok ? "text-[#1F5B45]" : "text-ruby"}`}>
            {state.ok ? state.message : state.error}
          </p>
        )}
      </div>
    </form>
  );
}

export function PruneForm() {
  const [days, setDays] = useState("180");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!window.confirm(`Permanently delete storefront activity older than ${days} days? Orders are not affected.`)) return;
        start(async () => {
          const r = await pruneActivity(Number(days));
          setMsg(r.ok ? { ok: true, text: r.message ?? "Done." } : { ok: false, text: r.error });
        });
      }}
      className="flex flex-wrap items-end gap-3"
    >
      <div>
        <label htmlFor="prune-days" className="field-label">
          Keep the last
        </label>
        <select id="prune-days" value={days} onChange={(e) => setDays(e.target.value)} className="field min-h-11 py-1.5">
          {["30", "90", "180", "365", "730"].map((d) => (
            <option key={d} value={d}>
              {d} days
            </option>
          ))}
        </select>
      </div>
      <button type="submit" disabled={pending} className="btn-outline min-h-11 px-5 py-2">
        {pending ? "Deleting…" : "Delete older activity"}
      </button>
      {msg && (
        <p role={msg.ok ? "status" : "alert"} className={`w-full text-base ${msg.ok ? "text-[#1F5B45]" : "text-ruby"}`}>
          {msg.text}
        </p>
      )}
    </form>
  );
}
