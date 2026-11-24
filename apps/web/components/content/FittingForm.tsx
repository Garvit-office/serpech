"use client";

import { useId, useState, useTransition, type FormEvent } from "react";
import { requestFitting } from "@/app/actions/store";
import { sessionId } from "@/lib/track";
import { SarpechEmblem } from "@sarpech/brand/SarpechEmblem";

const ATELIERS = ["Jaipur", "Jodhpur", "New Delhi", "Virtual (video call)"];
const OCCASIONS = ["My wedding", "Wedding guest", "Reception", "Festive", "Workwear tailoring", "Something else"];

type Errors = Partial<Record<"name" | "email" | "phone" | "atelier" | "date", string>>;

function validate(data: FormData): Errors {
  const e: Errors = {};
  const name = String(data.get("name") ?? "").trim();
  const email = String(data.get("email") ?? "").trim();
  const phone = String(data.get("phone") ?? "").replace(/[\s-]/g, "");
  const date = String(data.get("date") ?? "");
  if (name.length < 2) e.name = "Please enter your full name.";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Please enter a valid email address.";
  if (!/^\+?\d{10,13}$/.test(phone)) e.phone = "Please enter a 10-digit mobile number.";
  if (!data.get("atelier")) e.atelier = "Please choose an atelier.";
  if (!date) e.date = "Please choose a preferred date.";
  else if (new Date(date) < new Date(new Date().toDateString())) e.date = "Please choose a date from today onwards.";
  return e;
}

/** Book a fitting. No backend: validates client-side and shows a confirmation. */
export function FittingForm() {
  const uid = useId();
  const [errors, setErrors] = useState<Errors>({});
  const [sent, setSent] = useState<{ name: string; atelier: string; date: string } | null>(null);
  const id = (k: string) => `${uid}-${k}`;
  const [pending, start] = useTransition();
  const [serverError, setServerError] = useState<string | null>(null);

  const onSubmit = (ev: FormEvent<HTMLFormElement>) => {
    ev.preventDefault();
    const data = new FormData(ev.currentTarget);
    const e = validate(data);
    setErrors(e);
    const first = Object.keys(e)[0];
    if (first) {
      document.getElementById(id(first))?.focus();
      return;
    }
    const fields = Object.fromEntries([...data.entries()].map(([k, v]) => [k, String(v)]));
    setServerError(null);
    start(async () => {
      const res = await requestFitting(fields, sessionId());
      if (!res.ok) {
        setServerError(res.message ?? "Something went wrong. Please try again.");
        return;
      }
      setSent({ name: String(data.get("name")), atelier: String(data.get("atelier")), date: String(data.get("date")) });
    });
  };

  if (sent) {
    const when = new Date(sent.date).toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" });
    return (
      <div role="status" className="flex flex-col items-center border border-gold/60 bg-pearl px-6 py-14 text-center">
        <SarpechEmblem tone="gold" className="h-20 w-20" />
        <h2 className="mt-5 text-xl">Your fitting is requested</h2>
        <p className="mt-3 max-w-md text-xl">
          Thank you, {sent.name.split(" ")[0]}. Our atelier team in {sent.atelier.replace(" (video call)", "")} will call
          within one working day to confirm {when}.
        </p>
        <button type="button" onClick={() => setSent(null)} className="btn-outline mt-8">
          Book another fitting
        </button>
      </div>
    );
  }

  const err = (k: keyof Errors) =>
    errors[k] ? (
      <p id={id(`${k}-err`)} className="mt-1 text-base text-ruby">
        {errors[k]}
      </p>
    ) : null;
  const aria = (k: keyof Errors) => ({
    "aria-invalid": errors[k] ? true : undefined,
    "aria-describedby": errors[k] ? id(`${k}-err`) : undefined,
  });

  return (
    <form noValidate onSubmit={onSubmit} className="grid gap-5 sm:grid-cols-2" aria-label="Book a fitting">
      <div className="sm:col-span-2">
        <label htmlFor={id("name")} className="field-label">
          Full name <span aria-hidden>*</span>
        </label>
        <input id={id("name")} name="name" autoComplete="name" required className="field" {...aria("name")} />
        {err("name")}
      </div>
      <div>
        <label htmlFor={id("email")} className="field-label">
          Email <span aria-hidden>*</span>
        </label>
        <input id={id("email")} name="email" type="email" autoComplete="email" required className="field" {...aria("email")} />
        {err("email")}
      </div>
      <div>
        <label htmlFor={id("phone")} className="field-label">
          Mobile <span aria-hidden>*</span>
        </label>
        <input id={id("phone")} name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="+91" required className="field" {...aria("phone")} />
        {err("phone")}
      </div>
      <div>
        <label htmlFor={id("atelier")} className="field-label">
          Atelier <span aria-hidden>*</span>
        </label>
        <select id={id("atelier")} name="atelier" required defaultValue="" className="field" {...aria("atelier")}>
          <option value="" disabled>
            Choose an atelier
          </option>
          {ATELIERS.map((a) => (
            <option key={a}>{a}</option>
          ))}
        </select>
        {err("atelier")}
      </div>
      <div>
        <label htmlFor={id("date")} className="field-label">
          Preferred date <span aria-hidden>*</span>
        </label>
        <input id={id("date")} name="date" type="date" required className="field" {...aria("date")} />
        {err("date")}
      </div>
      <div className="sm:col-span-2">
        <label htmlFor={id("occasion")} className="field-label">
          Occasion
        </label>
        <select id={id("occasion")} name="occasion" defaultValue={OCCASIONS[0]} className="field">
          {OCCASIONS.map((o) => (
            <option key={o}>{o}</option>
          ))}
        </select>
      </div>
      <div className="sm:col-span-2">
        <label htmlFor={id("message")} className="field-label">
          Tell us more
        </label>
        <textarea
          id={id("message")}
          name="message"
          rows={4}
          placeholder="Wedding date, pieces you have in mind, number of people in the party…"
          className="field resize-y"
        />
      </div>
      <p className="text-base text-ink-soft sm:col-span-2">
        <span aria-hidden>*</span> Required. We use your details only to arrange your appointment.
      </p>
      <div className="sm:col-span-2">
        {serverError && (
          <p role="alert" className="mb-3 text-base text-ruby">
            {serverError}
          </p>
        )}
        <button type="submit" disabled={pending} className="btn-royal w-full sm:w-auto">
          {pending ? "Sending…" : "Request Appointment"}
        </button>
      </div>
    </form>
  );
}
