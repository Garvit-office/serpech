"use client";

import { useState, type InputHTMLAttributes, type ReactNode } from "react";
import { useFormStatus } from "react-dom";

/* ───────────── Text field ───────────── */

export function AuthField({
  id,
  label,
  error,
  hint,
  aside,
  className = "",
  ...input
}: InputHTMLAttributes<HTMLInputElement> & { id: string; label: string; error?: string; hint?: ReactNode; aside?: ReactNode }) {
  const describedBy = [hint ? `${id}-hint` : null, error ? `${id}-err` : null].filter(Boolean).join(" ") || undefined;
  return (
    <div className={className}>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="field-label mb-0">
          {label}
        </label>
        {aside}
      </div>
      <input
        id={id}
        {...input}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className="field min-h-[3.25rem] px-4 text-[1.1rem] transition-colors hover:border-brand-green/60 aria-[invalid=true]:border-ruby"
      />
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1.5 text-sm text-ink-soft">
          {hint}
        </p>
      )}
      <FieldError id={`${id}-err`} error={error} />
    </div>
  );
}

function FieldError({ id, error }: { id: string; error?: string }) {
  if (!error) return null;
  return (
    <p id={id} className="mt-1.5 flex items-center gap-1.5 text-sm text-ruby">
      <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.5">
        <circle cx="8" cy="8" r="6.5" />
        <path d="M8 4.5v4M8 11v.5" strokeLinecap="round" />
      </svg>
      {error}
    </p>
  );
}

/* ───────────── Password field ───────────── */

/** 0–4: length, letters+digits, mixed case, symbol, length ≥ 12. */
export function passwordScore(pw: string) {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 8) s++;
  if (/[A-Za-z]/.test(pw) && /\d/.test(pw)) s++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
  if (/[^A-Za-z0-9]/.test(pw) || pw.length >= 12) s++;
  return pw.length < 8 ? Math.min(s, 1) : s;
}

const STRENGTH = ["Too short", "Weak", "Fair", "Strong", "Royal"];

export function PasswordField({
  id,
  label = "Password",
  error,
  autoComplete = "current-password",
  meter = false,
  aside,
  name = "password",
  autoFocus,
}: {
  id: string;
  label?: string;
  error?: string;
  autoComplete?: string;
  meter?: boolean;
  aside?: ReactNode;
  name?: string;
  autoFocus?: boolean;
}) {
  const [show, setShow] = useState(false);
  const [caps, setCaps] = useState(false);
  const [value, setValue] = useState("");
  const score = passwordScore(value);
  const describedBy = [meter ? `${id}-rules` : null, caps ? `${id}-caps` : null, error ? `${id}-err` : null].filter(Boolean).join(" ") || undefined;
  const checkCaps = (e: React.KeyboardEvent<HTMLInputElement>) => setCaps(e.getModifierState?.("CapsLock") ?? false);

  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between gap-3">
        <label htmlFor={id} className="field-label mb-0">
          {label}
        </label>
        {aside}
      </div>
      <div className="relative">
        <input
          id={id}
          name={name}
          type={show ? "text" : "password"}
          autoComplete={autoComplete}
          required
          autoFocus={autoFocus}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={checkCaps}
          onKeyUp={checkCaps}
          onBlur={() => setCaps(false)}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy}
          className="field min-h-[3.25rem] px-4 pr-24 text-[1.1rem] transition-colors hover:border-brand-green/60 aria-[invalid=true]:border-ruby"
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          aria-pressed={show}
          aria-controls={id}
          aria-label={show ? "Hide password" : "Show password"}
          className="absolute inset-y-1.5 right-1.5 inline-flex items-center gap-1.5 px-3 font-display text-[0.6rem] uppercase tracking-[0.18em] text-ink-soft transition-colors hover:text-brand-green"
        >
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round">
            <path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z" />
            <circle cx="12" cy="12" r="3" />
            {show && <path d="M4 20L20 4" />}
          </svg>
          {show ? "Hide" : "Show"}
        </button>
      </div>
      {caps && (
        <p id={`${id}-caps`} role="status" className="mt-1.5 flex items-center gap-1.5 text-sm text-brand-green">
          <span aria-hidden className="grid size-4 place-items-center border border-gold-dark text-[0.6rem] font-semibold">
            ⇪
          </span>
          Caps Lock is on
        </p>
      )}
      {meter && (
        <div id={`${id}-rules`} className="mt-2.5">
          <div className="flex gap-1" aria-hidden>
            {[1, 2, 3, 4].map((i) => (
              <span
                key={i}
                className={`h-1 flex-1 transition-colors duration-300 ${
                  i <= score ? (score <= 1 ? "bg-ruby" : score === 2 ? "bg-gold-dark" : "bg-brand-green") : "bg-mist"
                }`}
              />
            ))}
          </div>
          <p className="mt-1.5 flex justify-between text-sm text-ink-soft">
            <span>At least 8 characters, with a letter and a number.</span>
            {value && <span className="font-semibold text-brand-green">{STRENGTH[score]}</span>}
          </p>
        </div>
      )}
      <FieldError id={`${id}-err`} error={error} />
    </div>
  );
}

/* ───────────── Checkbox ───────────── */

export function AuthCheckbox({ name, children, defaultChecked, error, id }: { name: string; children: ReactNode; defaultChecked?: boolean; error?: string; id: string }) {
  return (
    <div>
      <label htmlFor={id} className="flex cursor-pointer items-start gap-3 text-[1.05rem] leading-snug">
        <input
          id={id}
          type="checkbox"
          name={name}
          defaultChecked={defaultChecked}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-err` : undefined}
          className="mt-1 size-[1.05rem] shrink-0 accent-brand-green"
        />
        <span>{children}</span>
      </label>
      <FieldError id={`${id}-err`} error={error} />
    </div>
  );
}

/* ───────────── Submit + alerts ───────────── */

export function SubmitButton({ children, pendingLabel }: { children: ReactNode; pendingLabel: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} aria-busy={pending} className="btn-royal min-h-[3.4rem] w-full text-[0.8rem]">
      {pending ? (
        <>
          <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden className="animate-spin motion-reduce:animate-none">
            <circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" strokeOpacity=".25" strokeWidth="2" />
            <path d="M21 12a9 9 0 0 0-9-9" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          {pendingLabel}
        </>
      ) : (
        children
      )}
    </button>
  );
}

/**
 * Form-level message. Errors shake gently once (keyed by `nonce` so a repeat
 * error shakes again); motion is skipped under prefers-reduced-motion.
 */
export function FormAlert({ tone, children, nonce }: { tone: "error" | "success" | "info"; children: ReactNode; nonce?: unknown }) {
  const styles = {
    error: "border-ruby/40 bg-[#FBF1F2] text-ruby",
    success: "border-[#1F5B45]/40 bg-[#EEF5F0] text-[#1F5B45]",
    info: "border-gold/60 bg-pearl text-brand-green",
  }[tone];
  return (
    <>
      <style>{`@keyframes sp-shake{0%,100%{transform:none}20%{transform:translateX(-6px)}40%{transform:translateX(5px)}60%{transform:translateX(-3px)}80%{transform:translateX(2px)}}@media (prefers-reduced-motion:no-preference){.sp-shake{animation:sp-shake .45s ease-out both}}`}</style>
      <div
        key={String(nonce ?? "")}
        role={tone === "error" ? "alert" : "status"}
        className={`mb-6 flex items-start gap-3 border px-4 py-3 text-base ${styles} ${tone === "error" ? "sp-shake" : ""}`}
      >
        <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden className="mt-0.5 shrink-0" fill="none" stroke="currentColor" strokeWidth="1.5">
          {tone === "success" ? <path d="M4 10.5l4 4 8-9" strokeLinecap="round" strokeLinejoin="round" /> : <circle cx="10" cy="10" r="8" />}
          {tone !== "success" && <path d="M10 5.5v5.5M10 13.8v.4" strokeLinecap="round" />}
        </svg>
        <div>{children}</div>
      </div>
    </>
  );
}

/** "or" divider between the form and secondary actions. */
export function OrDivider({ children = "or" }: { children?: ReactNode }) {
  return (
    <div className="my-7 flex items-center gap-4" role="presentation">
      <span className="h-px flex-1 bg-mist" />
      <span className="eyebrow text-[0.6rem] text-ink-soft">{children}</span>
      <span className="h-px flex-1 bg-mist" />
    </div>
  );
}
