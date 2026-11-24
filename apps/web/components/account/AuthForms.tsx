"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestResetAction, resetPasswordAction, signInAction, signUpAction } from "@/app/actions/account";
import { AuthCheckbox, AuthField, FormAlert, PasswordField, SubmitButton } from "@/components/auth/fields";

/* Customer sign-in, sign-up and password-reset forms. All validation is repeated on the server. */

export function LoginForm({ next }: { next: string }) {
  const [state, action] = useActionState(signInAction, null);
  return (
    <form action={action} noValidate className="grid gap-5">
      {state?.error && (
        <FormAlert tone="error" nonce={state}>
          {state.error}
        </FormAlert>
      )}
      <input type="hidden" name="next" value={next} />
      <AuthField
        id="login-email"
        name="email"
        type="email"
        label="Email"
        autoComplete="username"
        required
        defaultValue={state?.values?.email}
        key={`email-${state?.values?.email ?? ""}`}
        autoFocus={!state?.values?.email}
      />
      <PasswordField
        id="login-password"
        autoFocus={!!state?.values?.email}
        aside={
          <Link href="/account/forgot" className="link-thread text-sm text-ink-soft hover:text-brand-green">
            Forgot password?
          </Link>
        }
      />
      <AuthCheckbox id="login-remember" name="remember" defaultChecked>
        Keep me signed in on this device
      </AuthCheckbox>
      <SubmitButton pendingLabel="Signing in…">Sign in</SubmitButton>
    </form>
  );
}

export function RegisterForm({ next }: { next: string }) {
  const [state, action] = useActionState(signUpAction, null);
  const fe = state?.fieldErrors ?? {};
  const v = state?.values ?? {};
  return (
    <form action={action} noValidate className="grid gap-5">
      {state?.error && (
        <FormAlert tone="error" nonce={state}>
          {state.error}
        </FormAlert>
      )}
      <input type="hidden" name="next" value={next} />
      <AuthField id="reg-name" name="name" label="Full name" autoComplete="name" required defaultValue={v.name} key={`n-${v.name ?? ""}`} error={fe.name} autoFocus />
      <AuthField id="reg-email" name="email" type="email" label="Email" autoComplete="email" required defaultValue={v.email} key={`e-${v.email ?? ""}`} error={fe.email} />
      <AuthField
        id="reg-phone"
        name="phone"
        type="tel"
        label="Mobile (optional)"
        autoComplete="tel"
        inputMode="tel"
        defaultValue={v.phone}
        key={`p-${v.phone ?? ""}`}
        error={fe.phone}
        hint="For delivery updates and fitting appointments."
      />
      <PasswordField id="reg-password" label="Create a password" autoComplete="new-password" meter error={fe.password} />
      <div className="grid gap-3">
        <AuthCheckbox id="reg-marketing" name="marketing">
          Send me new collections and private previews
        </AuthCheckbox>
        <AuthCheckbox id="reg-terms" name="terms" error={fe.terms}>
          I agree to the{" "}
          <Link href="/shipping-returns" className="underline decoration-gold underline-offset-4">
            terms of sale
          </Link>{" "}
          and privacy policy
        </AuthCheckbox>
      </div>
      <SubmitButton pendingLabel="Creating your account…">Create account</SubmitButton>
    </form>
  );
}

export function ForgotForm({ devHint }: { devHint: boolean }) {
  const [state, action] = useActionState(requestResetAction, null);
  if (state?.ok) {
    return (
      <div>
        <FormAlert tone="success">{state.message}</FormAlert>
        {devHint && (
          <FormAlert tone="info">
            Email isn&apos;t connected yet. In development the reset link is printed in the server console (the terminal running <code>npm run dev</code>).
          </FormAlert>
        )}
        <Link href="/account/login" className="btn-outline w-full">
          Back to sign in
        </Link>
      </div>
    );
  }
  return (
    <form action={action} noValidate className="grid gap-5">
      {state?.error && (
        <FormAlert tone="error" nonce={state}>
          {state.error}
        </FormAlert>
      )}
      <AuthField id="forgot-email" name="email" type="email" label="Email" autoComplete="email" required defaultValue={state?.values?.email} autoFocus />
      <SubmitButton pendingLabel="Sending…">Send reset link</SubmitButton>
    </form>
  );
}

export function ResetForm({ token }: { token: string }) {
  const [state, action] = useActionState(resetPasswordAction, null);
  const fe = state?.fieldErrors ?? {};
  return (
    <form action={action} noValidate className="grid gap-5">
      {state?.error && (
        <FormAlert tone="error" nonce={state}>
          {state.error}
          {!state.fieldErrors && (
            <>
              {" "}
              <Link href="/account/forgot" className="underline">
                Request a new link
              </Link>
            </>
          )}
        </FormAlert>
      )}
      <input type="hidden" name="token" value={token} />
      <PasswordField id="reset-password" label="New password" autoComplete="new-password" meter error={fe.password} autoFocus />
      <PasswordField id="reset-confirm" name="confirm" label="Confirm new password" autoComplete="new-password" error={fe.confirm} />
      <SubmitButton pendingLabel="Saving…">Set new password</SubmitButton>
    </form>
  );
}
