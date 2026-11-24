"use client";

import { useSearchParams } from "next/navigation";
import { useActionState } from "react";
import { AuthCheckbox, AuthField, FormAlert, PasswordField, SubmitButton } from "@/components/auth/fields";
import { loginAction } from "./actions";

export function LoginForm() {
  const next = useSearchParams().get("next") ?? "/admin";
  const [state, action] = useActionState(loginAction, null);
  return (
    <form action={action} noValidate className="grid gap-5">
      {state?.error && (
        <FormAlert tone="error" nonce={state}>
          {state.error}
        </FormAlert>
      )}
      <input type="hidden" name="next" value={next} />
      <AuthField
        id="email"
        name="email"
        type="email"
        label="Email"
        autoComplete="username"
        required
        defaultValue={state?.email}
        key={state?.email}
        autoFocus={!state?.email}
      />
      <PasswordField id="password" autoFocus={!!state?.email} />
      <AuthCheckbox id="remember" name="remember">
        Keep me signed in on this device
      </AuthCheckbox>
      <SubmitButton pendingLabel="Signing in…">Enter the atelier</SubmitButton>
    </form>
  );
}
