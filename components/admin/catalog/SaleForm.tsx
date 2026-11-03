"use client";

import { useRouter } from "next/navigation";
import { useId, useMemo, useState, useTransition } from "react";
import { saveSaleAction } from "@/app/admin/(panel)/sales/actions";
import { categories } from "@/data/categories";
import { formatINR } from "@/lib/format";
import type { SaleInput } from "@/lib/server/sales";
import { isoToLocalInput, localInputToIso } from "./status";

type Lite = { slug: string; name: string; category: string; price: number };

export function SaleForm({ initial, id, products }: { initial: SaleInput; id?: string; products: Lite[] }) {
  const router = useRouter();
  const uid = useId();
  const f = (k: string) => `${uid}-sale-${k}`;
  const [s, setS] = useState({ ...initial, startsAt: isoToLocalInput(initial.startsAt), endsAt: isoToLocalInput(initial.endsAt) });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const [filter, setFilter] = useState("");

  const set = <K extends keyof typeof s>(k: K, v: (typeof s)[K]) => setS((prev) => ({ ...prev, [k]: v }));
  const toggle = (v: string) => set("targets", s.targets.includes(v) ? s.targets.filter((t) => t !== v) : [...s.targets, v]);

  const affected = useMemo(
    () =>
      products.filter((p) =>
        s.scope === "all" ? true : s.scope === "categories" ? s.targets.includes(p.category) : s.targets.includes(p.slug),
      ),
    [products, s.scope, s.targets],
  );
  const example = affected[0];
  const pct = Number(s.percent) || 0;
  const visible = products.filter((p) => !filter || p.name.toLowerCase().includes(filter.toLowerCase()));

  const submit = () => {
    setFormError(null);
    start(async () => {
      const res = await saveSaleAction({ ...s, percent: pct, startsAt: localInputToIso(s.startsAt), endsAt: localInputToIso(s.endsAt) }, id);
      if (!res.ok) {
        setErrors(res.fieldErrors ?? {});
        setFormError(res.error);
        return;
      }
      router.push(`/admin/sales?saved=${id ? "updated" : "created"}`);
      router.refresh();
    });
  };

  const err = (k: string) => (errors[k] ? <p className="mt-1 text-sm text-ruby">{errors[k]}</p> : null);

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="grid gap-6 lg:grid-cols-[1fr_20rem]"
    >
      <div className="grid content-start gap-6">
        <section className="border border-mist bg-white p-5 shadow-card">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor={f("name")} className="field-label">
                Sale name (internal)
              </label>
              <input id={f("name")} className="field" value={s.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Diwali Festive Sale" aria-invalid={!!errors.name} />
              {err("name")}
            </div>
            <div>
              <label htmlFor={f("badge")} className="field-label">
                Badge on product cards
              </label>
              <input id={f("badge")} className="field" value={s.badge} maxLength={24} onChange={(e) => set("badge", e.target.value)} placeholder="Sale" />
            </div>
            <div>
              <label htmlFor={f("percent")} className="field-label">
                Discount (%)
              </label>
              <input
                id={f("percent")}
                className="field"
                type="number"
                min={1}
                max={90}
                step={1}
                value={s.percent || ""}
                onChange={(e) => set("percent", Number(e.target.value))}
                aria-invalid={!!errors.percent}
              />
              {err("percent")}
            </div>
            <div>
              <label htmlFor={f("start")} className="field-label">
                Starts (optional)
              </label>
              <input id={f("start")} className="field" type="datetime-local" value={s.startsAt} onChange={(e) => set("startsAt", e.target.value)} />
              {err("startsAt")}
            </div>
            <div>
              <label htmlFor={f("end")} className="field-label">
                Ends (optional)
              </label>
              <input id={f("end")} className="field" type="datetime-local" value={s.endsAt} onChange={(e) => set("endsAt", e.target.value)} aria-invalid={!!errors.endsAt} />
              {err("endsAt")}
            </div>
            <label className="flex items-center gap-3 text-[1.05rem] sm:col-span-2">
              <input type="checkbox" checked={s.active} onChange={(e) => set("active", e.target.checked)} className="size-4 accent-brand-green" />
              Active (uncheck to pause without deleting)
            </label>
          </div>
        </section>

        <section className="border border-mist bg-white p-5 shadow-card">
          <fieldset>
            <legend className="field-label">Applies to</legend>
            <div className="flex flex-wrap gap-4">
              {(
                [
                  ["all", "Entire store"],
                  ["categories", "Categories"],
                  ["products", "Specific products"],
                ] as const
              ).map(([v, l]) => (
                <label key={v} className="flex items-center gap-2 text-[1.05rem]">
                  <input
                    type="radio"
                    name="scope"
                    checked={s.scope === v}
                    onChange={() => setS((prev) => ({ ...prev, scope: v, targets: [] }))}
                    className="size-4 accent-brand-green"
                  />
                  {l}
                </label>
              ))}
            </div>
          </fieldset>
          {s.scope === "categories" && (
            <div className="mt-4 grid gap-1.5 sm:grid-cols-2">
              {categories.map((c) => (
                <label key={c.slug} className="flex items-center gap-3 text-[1.02rem]">
                  <input type="checkbox" checked={s.targets.includes(c.slug)} onChange={() => toggle(c.slug)} className="size-4 accent-brand-green" />
                  {c.name}
                  <span className="text-sm text-ink-soft">({products.filter((p) => p.category === c.slug).length})</span>
                </label>
              ))}
            </div>
          )}
          {s.scope === "products" && (
            <div className="mt-4">
              <label htmlFor={f("filter")} className="sr-only">
                Search products
              </label>
              <input id={f("filter")} className="field min-h-10 py-1.5" placeholder="Search products…" value={filter} onChange={(e) => setFilter(e.target.value)} />
              <div className="mt-2 max-h-72 overflow-y-auto border border-mist">
                {visible.map((p) => (
                  <label key={p.slug} className="flex items-center gap-3 border-b border-mist px-3 py-1.5 text-base last:border-b-0">
                    <input type="checkbox" checked={s.targets.includes(p.slug)} onChange={() => toggle(p.slug)} className="size-4 accent-brand-green" />
                    <span className="min-w-0 flex-1 truncate">{p.name}</span>
                    <span className="text-sm text-ink-soft">{formatINR(p.price)}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
          {err("targets")}
        </section>
      </div>

      <aside className="grid content-start gap-4">
        <section className="border border-gold/50 bg-pearl p-5" aria-live="polite">
          <p className="eyebrow text-[0.62rem] text-ink-soft">Preview</p>
          <p className="mt-2 font-display text-2xl">{affected.length}</p>
          <p className="text-base text-ink-soft">product{affected.length === 1 ? "" : "s"} affected</p>
          {example && pct > 0 && (
            <div className="mt-4 border-t border-mist pt-3">
              <p className="text-sm text-ink-soft">{example.name}</p>
              <p className="mt-1 text-lg">
                <span className="text-ruby">{formatINR(Math.round((example.price * (100 - pct)) / 100))}</span>{" "}
                <s className="text-base text-ink-soft">{formatINR(example.price)}</s>
              </p>
              <span className="mt-1 inline-block bg-ruby px-2 py-0.5 font-display text-[0.6rem] uppercase tracking-[0.2em] text-white">{s.badge || "Sale"}</span>
            </div>
          )}
          <p className="mt-4 text-sm text-ink-soft">If two sales cover a product, the bigger discount wins. Prices update in the store within a minute of the start time.</p>
        </section>
        {formError && (
          <p role="alert" className="text-base text-ruby">
            {formError}
          </p>
        )}
        <div className="flex gap-2">
          <button type="button" onClick={() => router.push("/admin/sales")} className="btn-outline min-h-10 flex-1 px-4 py-1.5">
            Cancel
          </button>
          <button type="submit" disabled={pending} className="btn-royal min-h-10 flex-1 px-4 py-1.5">
            {pending ? "Saving…" : id ? "Save" : "Create sale"}
          </button>
        </div>
      </aside>
    </form>
  );
}
