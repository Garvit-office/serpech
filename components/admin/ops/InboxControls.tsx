"use client";

import { useState, useTransition } from "react";
import { deleteSubscriber, updateFittingStatus } from "@/app/admin/(panel)/inbox/actions";

export function FittingStatusSelect({ id, status, label }: { id: string; status: string; label: string }) {
  const [value, setValue] = useState(status);
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <div>
      <label htmlFor={`fit-${id}`} className="sr-only">
        Status for {label}
      </label>
      <select
        id={`fit-${id}`}
        value={value}
        disabled={pending}
        onChange={(e) => {
          const next = e.target.value;
          const prev = value;
          setValue(next);
          setError(null);
          start(async () => {
            const r = await updateFittingStatus(id, next);
            if (!r.ok) {
              setValue(prev);
              setError(r.error);
            }
          });
        }}
        className="field min-h-10 min-w-[9.5rem] py-1.5 capitalize"
      >
        {["new", "contacted", "booked", "closed"].map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      <span aria-live="polite" className="block text-sm text-ink-soft">
        {pending ? "Saving…" : error ? <span className="text-ruby">{error}</span> : null}
      </span>
    </div>
  );
}

export function RemoveSubscriberButton({ email }: { email: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!window.confirm(`Remove ${email} from the newsletter list?`)) return;
        start(async () => {
          await deleteSubscriber(email);
        });
      }}
      className="link-thread text-sm text-ruby disabled:opacity-50"
      aria-label={`Remove ${email}`}
    >
      {pending ? "Removing…" : "Remove"}
    </button>
  );
}
