"use client";

import { useRouter } from "next/navigation";
import { useId, useState, useTransition } from "react";
import { generateCodeAction, saveCouponAction } from "@/app/admin/(panel)/coupons/actions";
import { categories } from "@sarpech/core/categories";
import { formatINR } from "@sarpech/core/format";
import type { CouponInput } from "@sarpech/backend/coupons";
import type { CategorySlug } from "@sarpech/core/types";
import { isoToLocalInput, localInputToIso } from "./status";

export function CouponForm({ initial, id }: { initial: CouponInput; id?: string }) {
  const router = useRouter();
  const uid = useId();
  const f = (k: string) => `${uid}-cp-${k}`;
  const [c, setC] = useState({
    ...initial,
    value: String(initial.value || ""),
    minOrder: String(initial.minOrder || ""),
    maxUses: initial.maxUses === null ? "" : String(initial.maxUses),
    startsAt: isoToLocalInput(initial.startsAt),
    endsAt: isoToLocalInput(initial.endsAt),
    categories: initial.categories ?? [],
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [generating, startGen] = useTransition();

  const set = <K extends keyof typeof c>(k: K, v: (typeof c)[K]) => setC((prev) => ({ ...prev, [k]: v }));
  const err = (k: string) => (errors[k] ? <p className="mt-1 text-sm text-ruby">{errors[k]}</p> : null);

  const value = Number(c.value) || 0;
  const min = Number(c.minOrder) || 0;
  const summary =
    value > 0
      ? `${c.type === "percent" ? `${value}% off` : `${formatINR(value)} off`} ${c.categories.length ? `${c.categories.length === 1 ? "one category" : `${c.categories.length} categories`}` : "the order"}${min ? ` over ${formatINR(min)}` : ""}${c.maxUses ? ` · first ${c.maxUses} uses` : ""}`
      : "Set a value to preview.";

  const submit = () => {
    setFormError(null);
    start(async () => {
      const res = await saveCouponAction(
        {
          code: c.code,
          description: c.description,
          type: c.type,
          value,
          minOrder: min,
          maxUses: c.maxUses === "" ? null : Number(c.maxUses),
          categories: c.categories.length ? c.categories : null,
          startsAt: localInputToIso(c.startsAt),
          endsAt: localInputToIso(c.endsAt),
          active: c.active,
        },
        id,
      );
      if (!res.ok) {
        setErrors(res.fieldErrors ?? {});
        setFormError(res.error);
        return;
      }
      router.push(`/admin/coupons?saved=${id ? "updated" : "created"}`);
      router.refresh();
    });
  };

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="grid gap-6 lg:grid-cols-[1fr_20rem]"
    >
      <section className="border border-mist bg-white p-5 shadow-card">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor={f("code")} className="field-label">
              Code
            </label>
            <div className="flex gap-2">
              <input
                id={f("code")}
                className="field font-mono uppercase tracking-[0.12em]"
                value={c.code}
                onChange={(e) => set("code", e.target.value.toUpperCase().replace(/\s/g, ""))}
                aria-invalid={!!errors.code}
                maxLength={24}
                placeholder="FESTIVE15"
              />
              <button
                type="button"
                disabled={generating}
                className="btn-outline min-h-12 shrink-0 px-4 py-1.5"
                onClick={() => startGen(async () => set("code", await generateCodeAction()))}
              >
                {generating ? "…" : "Generate"}
              </button>
            </div>
            {err("code")}
          </div>
          <div className="sm:col-span-2">
            <label htmlFor={f("desc")} className="field-label">
              Description (shown to the customer when applied)
            </label>
            <input id={f("desc")} className="field" value={c.description} maxLength={140} onChange={(e) => set("description", e.target.value)} placeholder="Festive season — 15% off" />
          </div>
          <fieldset className="sm:col-span-2">
            <legend className="field-label">Discount type</legend>
            <div className="flex gap-6">
              {(
                [
                  ["percent", "Percentage"],
                  ["fixed", "Fixed amount (₹)"],
                ] as const
              ).map(([v, l]) => (
                <label key={v} className="flex items-center gap-2 text-[1.05rem]">
                  <input type="radio" name="type" checked={c.type === v} onChange={() => set("type", v)} className="size-4 accent-brand-green" />
                  {l}
                </label>
              ))}
            </div>
          </fieldset>
          <div>
            <label htmlFor={f("value")} className="field-label">
              {c.type === "percent" ? "Percent off" : "Amount off (₹)"}
            </label>
            <input id={f("value")} className="field" inputMode="decimal" value={c.value} onChange={(e) => set("value", e.target.value.replace(/[^\d.]/g, ""))} aria-invalid={!!errors.value} />
            {err("value")}
          </div>
          <div>
            <label htmlFor={f("min")} className="field-label">
              Minimum order (₹)
            </label>
            <input id={f("min")} className="field" inputMode="numeric" value={c.minOrder} onChange={(e) => set("minOrder", e.target.value.replace(/\D/g, ""))} placeholder="0" />
          </div>
          <div>
            <label htmlFor={f("max")} className="field-label">
              Usage limit
            </label>
            <input id={f("max")} className="field" inputMode="numeric" value={c.maxUses} onChange={(e) => set("maxUses", e.target.value.replace(/\D/g, ""))} placeholder="Unlimited" aria-invalid={!!errors.maxUses} />
            {err("maxUses")}
          </div>
          <div className="hidden sm:block" />
          <div>
            <label htmlFor={f("start")} className="field-label">
              Starts (optional)
            </label>
            <input id={f("start")} className="field" type="datetime-local" value={c.startsAt} onChange={(e) => set("startsAt", e.target.value)} />
            {err("startsAt")}
          </div>
          <div>
            <label htmlFor={f("end")} className="field-label">
              Ends (optional)
            </label>
            <input id={f("end")} className="field" type="datetime-local" value={c.endsAt} onChange={(e) => set("endsAt", e.target.value)} aria-invalid={!!errors.endsAt} />
            {err("endsAt")}
          </div>
          <fieldset className="sm:col-span-2">
            <legend className="field-label">Limit to categories (optional)</legend>
            <div className="grid gap-1 sm:grid-cols-3">
              {categories.map((cat) => (
                <label key={cat.slug} className="flex items-center gap-2 text-[1.02rem]">
                  <input
                    type="checkbox"
                    checked={c.categories.includes(cat.slug)}
                    onChange={() =>
                      set(
                        "categories",
                        c.categories.includes(cat.slug) ? c.categories.filter((x) => x !== cat.slug) : [...c.categories, cat.slug as CategorySlug],
                      )
                    }
                    className="size-4 accent-brand-green"
                  />
                  {cat.name}
                </label>
              ))}
            </div>
            <p className="mt-1 text-sm text-ink-soft">Leave all unticked to discount the whole order.</p>
          </fieldset>
          <label className="flex items-center gap-3 text-[1.05rem] sm:col-span-2">
            <input type="checkbox" checked={c.active} onChange={(e) => set("active", e.target.checked)} className="size-4 accent-brand-green" />
            Active
          </label>
        </div>
      </section>
      <aside className="grid content-start gap-4">
        <section className="border border-gold/50 bg-pearl p-5" aria-live="polite">
          <p className="eyebrow text-[0.62rem] text-ink-soft">Summary</p>
          <p className="mt-2 font-mono text-xl tracking-[0.12em]">{c.code || "CODE"}</p>
          <p className="mt-1 text-lg">{summary}</p>
          <p className="mt-3 text-sm text-ink-soft">Coupons apply after sale prices. Shipping is not discounted.</p>
        </section>
        {formError && (
          <p role="alert" className="text-base text-ruby">
            {formError}
          </p>
        )}
        <div className="flex gap-2">
          <button type="button" onClick={() => router.push("/admin/coupons")} className="btn-outline min-h-10 flex-1 px-4 py-1.5">
            Cancel
          </button>
          <button type="submit" disabled={pending} className="btn-royal min-h-10 flex-1 px-4 py-1.5">
            {pending ? "Saving…" : id ? "Save" : "Create coupon"}
          </button>
        </div>
      </aside>
    </form>
  );
}
