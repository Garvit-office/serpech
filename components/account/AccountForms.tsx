"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState, useTransition, type FormEvent } from "react";
import {
  changePasswordAction,
  deleteAccountAction,
  deleteAddressAction,
  saveAddressAction,
  signOutAction,
  updateProfileAction,
  type AuthState,
} from "@/app/actions/account";
import { AuthCheckbox, AuthField, FormAlert, PasswordField, SubmitButton } from "@/components/auth/fields";
import { useAccount } from "@/lib/store/account";
import type { Address } from "@/lib/types";
import { INDIAN_STATES } from "./shared";

/* ───────────── Profile ───────────── */

export function ProfileForm({ name, email, phone, marketing }: { name: string; email: string; phone: string; marketing: boolean }) {
  const router = useRouter();
  const account = useAccount();
  const [state, action] = useActionState(updateProfileAction, null);
  const fe = state?.fieldErrors ?? {};

  useEffect(() => {
    if (!state?.ok) return;
    router.refresh();
    void account.refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once per successful save
  }, [state]);

  return (
    <form action={action} noValidate className="grid max-w-lg gap-5">
      {state?.error && (
        <FormAlert tone="error" nonce={state}>
          {state.error}
        </FormAlert>
      )}
      {state?.ok && <FormAlert tone="success">{state.message}</FormAlert>}
      <AuthField id="profile-name" name="name" label="Full name" autoComplete="name" required defaultValue={state?.values?.name ?? name} error={fe.name} />
      <AuthField id="profile-email" label="Email" type="email" value={email} readOnly disabled hint="Your email is your sign-in and can't be changed here. Contact us if it needs updating." />
      <AuthField id="profile-phone" name="phone" type="tel" label="Mobile" autoComplete="tel" defaultValue={state?.values?.phone ?? phone} error={fe.phone} />
      <AuthCheckbox id="profile-marketing" name="marketing" defaultChecked={marketing}>
        Send me new collections and private previews
      </AuthCheckbox>
      <div className="max-w-xs">
        <SubmitButton pendingLabel="Saving…">Save details</SubmitButton>
      </div>
    </form>
  );
}

/* ───────────── Password ───────────── */

export function PasswordForm() {
  const [formKey, setFormKey] = useState(0);
  const [state, action] = useActionState(async (prev: AuthState, form: FormData) => {
    const res = await changePasswordAction(prev, form);
    if (res?.ok) setFormKey((k) => k + 1); // clear the fields
    return res;
  }, null);
  const fe = state?.fieldErrors ?? {};
  return (
    <form key={formKey} action={action} noValidate className="grid max-w-lg gap-5">
      {state?.error && (
        <FormAlert tone="error" nonce={state}>
          {state.error}
        </FormAlert>
      )}
      {state?.ok && <FormAlert tone="success">{state.message}</FormAlert>}
      <PasswordField id="pw-current" name="current" label="Current password" autoComplete="current-password" error={fe.current} />
      <PasswordField id="pw-new" label="New password" autoComplete="new-password" meter error={fe.password} />
      <PasswordField id="pw-confirm" name="confirm" label="Confirm new password" autoComplete="new-password" error={fe.confirm} />
      <div className="max-w-xs">
        <SubmitButton pendingLabel="Saving…">Change password</SubmitButton>
      </div>
    </form>
  );
}

/* ───────────── Sign out / delete ───────────── */

export function SignOutButton({ className = "btn-outline min-h-11 px-6" }: { className?: string }) {
  return (
    <form action={signOutAction}>
      <button type="submit" className={className}>
        Sign out
      </button>
    </form>
  );
}

export function DeleteAccountForm() {
  const [state, action] = useActionState(deleteAccountAction, null);
  return (
    <details className="group border border-ruby/30 bg-ruby/[0.03]">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-5 py-4 text-lg text-ruby">
        Delete my account
        <span aria-hidden className="font-display text-sm transition-transform group-open:rotate-45">
          +
        </span>
      </summary>
      <form action={action} noValidate className="grid max-w-lg gap-5 px-5 pb-5">
        <p className="text-base text-ink-soft">
          This permanently deletes your profile, saved addresses, wishlist and Royal Fit. Orders you&apos;ve placed are kept for our records and
          warranty, but are no longer linked to an account. This can&apos;t be undone.
        </p>
        {state?.error && (
          <FormAlert tone="error" nonce={state}>
            {state.error}
          </FormAlert>
        )}
        <PasswordField id="delete-password" label="Confirm with your password" error={state?.error ? " " : undefined} />
        <button type="submit" className="min-h-12 border border-ruby bg-ruby px-6 font-display text-[0.72rem] uppercase tracking-[0.2em] text-white transition-opacity hover:opacity-90">
          Permanently delete account
        </button>
      </form>
    </details>
  );
}

/* ───────────── Address book ───────────── */

const EMPTY: Address = { id: "", label: "Home", firstName: "", lastName: "", phone: "", line1: "", line2: "", city: "", state: "", pin: "", isDefault: false };

export function AddressBook({ initial }: { initial: Address[] }) {
  const router = useRouter();
  const [addresses, setAddresses] = useState(initial);
  const [editing, setEditing] = useState<Address | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, start] = useTransition();
  const [notice, setNotice] = useState<string | null>(null);

  const done = (list: Address[], msg: string) => {
    setAddresses(list);
    setEditing(null);
    setErrors({});
    setNotice(msg);
    router.refresh();
  };

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const raw: Partial<Address> = {
      id: editing?.id || undefined,
      label: String(f.get("label") ?? ""),
      firstName: String(f.get("firstName") ?? ""),
      lastName: String(f.get("lastName") ?? ""),
      phone: String(f.get("phone") ?? ""),
      line1: String(f.get("line1") ?? ""),
      line2: String(f.get("line2") ?? ""),
      city: String(f.get("city") ?? ""),
      state: String(f.get("state") ?? ""),
      pin: String(f.get("pin") ?? ""),
      isDefault: f.get("isDefault") === "on",
    };
    start(async () => {
      const res = await saveAddressAction(raw);
      if (res.ok) done(res.addresses, editing?.id ? "Address updated." : "Address added.");
      else setErrors(res.fieldErrors);
    });
  };

  const remove = (a: Address) => {
    if (!window.confirm(`Remove the address “${a.label}”?`)) return;
    start(async () => done((await deleteAddressAction(a.id)).addresses, "Address removed."));
  };

  const makeDefault = (a: Address) => start(async () => {
    const res = await saveAddressAction({ ...a, isDefault: true });
    if (res.ok) done(res.addresses, `“${a.label}” is now your default address.`);
  });

  if (editing) {
    const a = editing;
    return (
      <form onSubmit={submit} noValidate className="grid max-w-2xl gap-5" aria-busy={pending}>
        <h3 className="font-display text-sm tracking-[0.18em]">{a.id ? "Edit address" : "New address"}</h3>
        {Object.keys(errors).length > 0 && <FormAlert tone="error">Please check the highlighted fields.</FormAlert>}
        <div className="grid gap-5 sm:grid-cols-2">
          <AuthField id="addr-label" name="label" label="Label" defaultValue={a.label} placeholder="Home, Office…" maxLength={30} />
          <AuthField id="addr-phone" name="phone" type="tel" label="Mobile" autoComplete="tel" defaultValue={a.phone} error={errors.phone} />
          <AuthField id="addr-first" name="firstName" label="First name" autoComplete="given-name" required defaultValue={a.firstName} error={errors.firstName} />
          <AuthField id="addr-last" name="lastName" label="Last name" autoComplete="family-name" defaultValue={a.lastName} />
          <AuthField id="addr-line1" name="line1" label="Address" autoComplete="address-line1" required defaultValue={a.line1} error={errors.line1} className="sm:col-span-2" />
          <AuthField id="addr-line2" name="line2" label="Apartment, landmark (optional)" autoComplete="address-line2" defaultValue={a.line2} className="sm:col-span-2" />
          <AuthField id="addr-city" name="city" label="City" autoComplete="address-level2" required defaultValue={a.city} error={errors.city} />
          <div>
            <label htmlFor="addr-state" className="field-label">
              State
            </label>
            <select
              id="addr-state"
              name="state"
              defaultValue={a.state}
              aria-invalid={errors.state ? true : undefined}
              className="field min-h-[3.25rem] px-4 text-[1.1rem] aria-[invalid=true]:border-ruby"
            >
              <option value="">Choose…</option>
              {INDIAN_STATES.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
            {errors.state && <p className="mt-1.5 text-sm text-ruby">{errors.state}</p>}
          </div>
          <AuthField id="addr-pin" name="pin" label="PIN code" autoComplete="postal-code" inputMode="numeric" maxLength={6} required defaultValue={a.pin} error={errors.pin} />
        </div>
        <AuthCheckbox id="addr-default" name="isDefault" defaultChecked={a.isDefault}>
          Use as my default delivery address
        </AuthCheckbox>
        <div className="flex flex-wrap gap-3">
          <button type="submit" disabled={pending} className="btn-royal min-h-12 px-8">
            {pending ? "Saving…" : "Save address"}
          </button>
          <button
            type="button"
            onClick={() => {
              setEditing(null);
              setErrors({});
            }}
            className="btn-outline min-h-12 px-8"
          >
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <div>
      {notice && <FormAlert tone="success">{notice}</FormAlert>}
      {addresses.length === 0 ? (
        <div className="border border-dashed border-gold p-8 text-center">
          <p className="text-xl">No saved addresses yet.</p>
          <p className="mt-1 text-base text-ink-soft">Your first order&apos;s address is saved here automatically.</p>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2" aria-busy={pending}>
          {addresses.map((a) => (
            <li key={a.id} className={`relative flex flex-col border bg-white p-5 ${a.isDefault ? "border-gold" : "border-mist"}`}>
              <p className="flex items-center gap-2">
                <span className="font-display text-xs uppercase tracking-[0.18em]">{a.label}</span>
                {a.isDefault && <span className="bg-[#F6EDD3] px-2 py-0.5 font-display text-[0.58rem] uppercase tracking-[0.14em] text-[#6E521A]">Default</span>}
              </p>
              <address className="mt-2 flex-1 text-lg not-italic leading-snug">
                {a.firstName} {a.lastName}
                <br />
                {a.line1}
                {a.line2 && (
                  <>
                    <br />
                    {a.line2}
                  </>
                )}
                <br />
                {a.city}, {a.state} {a.pin}
                {a.phone && <span className="mt-1 block text-base text-ink-soft">{a.phone}</span>}
              </address>
              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 font-display text-[0.62rem] uppercase tracking-[0.2em]">
                <button type="button" onClick={() => { setNotice(null); setEditing(a); }} className="link-thread">
                  Edit
                </button>
                {!a.isDefault && (
                  <button type="button" onClick={() => makeDefault(a)} disabled={pending} className="link-thread">
                    Make default
                  </button>
                )}
                <button type="button" onClick={() => remove(a)} disabled={pending} className="link-thread text-ruby">
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      {addresses.length < 10 && (
        <button type="button" onClick={() => { setNotice(null); setEditing({ ...EMPTY, isDefault: addresses.length === 0 }); }} className="btn-outline mt-6 min-h-11 px-6">
          + Add an address
        </button>
      )}
    </div>
  );
}
