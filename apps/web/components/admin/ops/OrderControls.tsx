"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { saveOrderNotes, setOrderStatus } from "@/app/admin/(panel)/orders/actions";
import type { OrderStatus } from "@sarpech/core/types";

function Feedback({ msg }: { msg: { ok: boolean; text: string } | null }) {
  if (!msg) return null;
  return (
    <p role={msg.ok ? "status" : "alert"} className={`mt-2 text-sm ${msg.ok ? "text-[#1F5B45]" : "text-ruby"}`}>
      {msg.text}
    </p>
  );
}

export function OrderStatusForm({ id, status, statuses }: { id: string; status: OrderStatus; statuses: OrderStatus[] }) {
  const [value, setValue] = useState(status);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        setMsg(null);
        start(async () => {
          const r = await setOrderStatus(id, value);
          setMsg(r.ok ? { ok: true, text: r.message ?? "Saved." } : { ok: false, text: r.error });
          if (r.ok) router.refresh();
        });
      }}
    >
      <label htmlFor="order-status" className="field-label">
        Status
      </label>
      <div className="flex gap-2">
        <select id="order-status" value={value} onChange={(e) => setValue(e.target.value as OrderStatus)} className="field min-h-11 flex-1 capitalize">
          {statuses.map((s) => (
            <option key={s} value={s} className="capitalize">
              {s}
            </option>
          ))}
        </select>
        <button type="submit" disabled={pending || value === status} className="btn-royal min-h-11 px-5 py-2">
          {pending ? "Saving…" : "Update"}
        </button>
      </div>
      <Feedback msg={msg} />
    </form>
  );
}

export function OrderNotesForm({ id, notes }: { id: string; notes: string }) {
  const [value, setValue] = useState(notes);
  const [saved, setSaved] = useState(notes);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [pending, start] = useTransition();
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const r = await saveOrderNotes(id, value);
          if (r.ok) setSaved(value);
          setMsg(r.ok ? { ok: true, text: r.message ?? "Saved." } : { ok: false, text: r.error });
        });
      }}
    >
      <label htmlFor="order-notes" className="field-label">
        Internal notes
      </label>
      <textarea
        id="order-notes"
        rows={4}
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setMsg(null);
        }}
        placeholder="Alterations, courier tracking, call notes… (not visible to the customer)"
        className="field min-h-24 resize-y"
      />
      <div className="mt-2 flex items-center justify-between gap-3">
        <Feedback msg={msg} />
        <button type="submit" disabled={pending || value === saved} className="btn-outline ml-auto min-h-10 px-4 py-1.5">
          {pending ? "Saving…" : "Save notes"}
        </button>
      </div>
    </form>
  );
}

export function PrintButton() {
  return (
    <button type="button" onClick={() => window.print()} className="btn-outline min-h-10 px-5 py-2">
      Print packing slip
    </button>
  );
}
