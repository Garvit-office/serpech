"use client";

import { useSearchParams } from "next/navigation";
import { useActionState } from "react";
import { loginAction } from "./actions";

export function LoginForm() {
  const next = useSearchParams().get("next") ?? "/admin";
  const [state, action, pending] = useActionState(loginAction, null);
  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="next" value={next} />
      <div>
        <label htmlFor="email" className="field-label">
          Email
        </label>
        <input id="email" name="email" type="email" autoComplete="username" required className="field" defaultValue={state?.email} key={state?.email} autoFocus={!state?.email} />
      </div>
      <div>
        <label htmlFor="password" className="field-label">
          Password
        </label>
        <input id="password" name="password" type="password" autoComplete="current-password" required className="field" autoFocus={!!state?.email} />
      </div>
      {state?.error && (
        <p role="alert" className="text-base text-ruby">
          {state.error}
        </p>
      )}
      <button type="submit" disabled={pending} className="btn-royal w-full">
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
