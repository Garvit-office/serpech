"use client";

import { useId, useState, useTransition } from "react";
import { subscribe } from "@/app/actions/store";
import { sessionId } from "@/lib/track";

export function NewsletterForm() {
  const id = useId();
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "error" | "done">("idle");
  const [pending, start] = useTransition();

  if (state === "done") {
    return (
      <p role="status" className="mt-6 text-xl text-ivory">
        Welcome to the court. Your first letter arrives soon — with 10% off your first order.
      </p>
    );
  }

  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        if (!/^\S+@\S+\.\S+$/.test(email)) return setState("error");
        start(async () => {
          const res = await subscribe(email, sessionId());
          setState(res.ok ? "done" : "error");
        });
      }}
      className="relative mx-auto mt-6 flex max-w-lg flex-col gap-3 sm:flex-row"
    >
      <label htmlFor={id} className="sr-only">
        Email address
      </label>
      <input
        id={id}
        type="email"
        autoComplete="email"
        value={email}
        onChange={(e) => {
          setEmail(e.target.value);
          if (state === "error") setState("idle");
        }}
        placeholder="Your email address"
        aria-invalid={state === "error"}
        aria-describedby={state === "error" ? `${id}-err` : undefined}
        className="field flex-1 border-gold/60 bg-brand-green-2 text-ivory placeholder:text-ivory/60 focus:border-gold"
      />
      <button type="submit" disabled={pending} className="btn-royal btn-royal-gold shrink-0">
        {pending ? "…" : "Subscribe"}
      </button>
      {state === "error" && (
        <p id={`${id}-err`} role="alert" className="text-base text-gold-light sm:absolute sm:left-0 sm:top-full sm:mt-2">
          Please enter a valid email address.
        </p>
      )}
    </form>
  );
}
