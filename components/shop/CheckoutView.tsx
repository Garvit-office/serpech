"use client";

import Link from "next/link";
import { useEffect, useState, useTransition, type FormEvent, type ReactNode } from "react";
import { checkCoupon, confirmPayment, paymentMode, placeOrder as placeOrderAction, type PaymentRequest } from "@/app/actions/store";
import { SarpechEmblem } from "@/components/brand/SarpechEmblem";
import { SectionDivider } from "@/components/ornaments/SectionDivider";
import { CheckIcon } from "@/components/ui/icons";
import { formatINR } from "@/lib/format";
import { useAccount } from "@/lib/store/account";
import { useCart } from "@/lib/store/cart";
import { useCatalog } from "@/lib/store/catalog";
import { sessionId, track } from "@/lib/track";
import { OrderSummary } from "./OrderSummary";

type Step = 1 | 2 | 3;

interface Address {
  email: string;
  phone: string;
  firstName: string;
  lastName: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  pin: string;
}

/* ───────────── Razorpay Checkout (loaded only when paying) ───────────── */

interface RazorpaySuccess {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}
interface RazorpayInstance {
  open(): void;
  on(event: "payment.failed", cb: (r: { error?: { description?: string } }) => void): void;
}
declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => RazorpayInstance;
  }
}

let razorpayScript: Promise<boolean> | null = null;
function loadRazorpay() {
  if (typeof window !== "undefined" && window.Razorpay) return Promise.resolve(true);
  razorpayScript ??= new Promise<boolean>((resolve) => {
    const s = document.createElement("script");
    s.src = "https://checkout.razorpay.com/v1/checkout.js";
    s.async = true;
    s.onload = () => resolve(true);
    s.onerror = () => {
      razorpayScript = null;
      resolve(false);
    };
    document.body.appendChild(s);
  });
  return razorpayScript;
}

const EMPTY: Address = { email: "", phone: "", firstName: "", lastName: "", line1: "", line2: "", city: "", state: "", pin: "" };

const STATES = ["Delhi", "Gujarat", "Haryana", "Karnataka", "Maharashtra", "Punjab", "Rajasthan", "Tamil Nadu", "Telangana", "Uttar Pradesh", "West Bengal", "Other"];

const VALIDATE: Partial<Record<keyof Address, (v: string) => string | null>> = {
  email: (v) => (/^\S+@\S+\.\S+$/.test(v) ? null : "Enter a valid email address."),
  phone: (v) => (/^(\+91[\s-]?)?[6-9]\d{9}$/.test(v.replace(/\s/g, "")) ? null : "Enter a 10-digit Indian mobile number."),
  firstName: (v) => (v.trim() ? null : "Required."),
  lastName: (v) => (v.trim() ? null : "Required."),
  line1: (v) => (v.trim() ? null : "Required."),
  city: (v) => (v.trim() ? null : "Required."),
  state: (v) => (v ? null : "Choose a state."),
  pin: (v) => (/^\d{6}$/.test(v) ? null : "Enter a 6-digit PIN code."),
};

export function CheckoutView() {
  const cart = useCart();
  const [step, setStep] = useState<Step>(1);
  const [addr, setAddr] = useState<Address>(EMPTY);
  const { customer } = useAccount();
  const [prefilledFor, setPrefilledFor] = useState<string | null>(null);
  // Prefill once from the signed-in account (default address), without overwriting typing.
  useEffect(() => {
    if (!customer || prefilledFor === customer.id) return;
    const d = customer.addresses.find((a) => a.isDefault) ?? customer.addresses[0];
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time prefill when the session resolves
    setPrefilledFor(customer.id);
    setAddr((cur) => {
      const untouched = Object.values(cur).every((v) => !v);
      if (!untouched) return cur.email ? cur : { ...cur, email: customer.email };
      const [first, ...rest] = customer.name.split(" ");
      return d
        ? { email: customer.email, phone: d.phone || customer.phone, firstName: d.firstName, lastName: d.lastName, line1: d.line1, line2: d.line2, city: d.city, state: d.state, pin: d.pin }
        : { ...EMPTY, email: customer.email, phone: customer.phone, firstName: first ?? "", lastName: rest.join(" ") };
    });
  }, [customer, prefilledFor]);
  const [errors, setErrors] = useState<Partial<Record<keyof Address, string>>>({});
  const [method, setMethod] = useState<"standard" | "express">("standard");
  const [placed, setPlaced] = useState<{ id: string; total: number; paid: boolean } | null>(null);
  const [mode, setMode] = useState<"razorpay" | "none" | null>(null);
  const [awaiting, setAwaiting] = useState<{ id: string; total: number; payment: PaymentRequest } | null>(null);
  useEffect(() => {
    void paymentMode().then(setMode);
  }, []);
  const { settings } = useCatalog();
  const [coupon, setCoupon] = useState<{ code: string; discount: number; description: string } | null>(null);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [placing, startPlacing] = useTransition();

  useEffect(() => {
    track("checkout_start", { items: cart.count, subtotal: cart.subtotal });
    // once per visit to checkout
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const lines = cart.items.map(({ slug, size, color, qty, fit }) => ({ slug, size, color, qty, fit }));
  const discount = coupon?.discount ?? 0;
  const afterDiscount = cart.subtotal - discount;
  const standard = afterDiscount >= settings.freeShippingThreshold ? 0 : settings.standardShipping;
  const shipping = method === "express" ? settings.expressShipping : standard;

  if (placed) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <SarpechEmblem tone="gold" className="mx-auto h-28 w-28" />
        <h1 className="mt-6 text-2xl sm:text-3xl">Thank you</h1>
        <p className="mt-3 text-xl">
          {placed.paid ? (
            <>
              Payment received. Order <strong>{placed.id}</strong> for {formatINR(placed.total)} is confirmed.
            </>
          ) : (
            <>
              Order <strong>{placed.id}</strong> for {formatINR(placed.total)} is confirmed. Online payment isn&apos;t switched on yet, so nothing
              was charged. Our team will contact you to arrange payment.
            </>
          )}
        </p>
        <p className="mt-2 text-lg text-ink-soft">A confirmation email is on its way to {addr.email}.</p>
        {customer && (
          <Link href={`/account/orders/${encodeURIComponent(placed.id)}`} className="link-thread mt-3 inline-block text-lg">
            View your order
          </Link>
        )}
        <SectionDivider className="mt-8" size="sm" />
        <Link href="/shop" className="btn-royal mt-8">
          Continue Shopping
        </Link>
      </div>
    );
  }

  if (cart.ready && cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="text-2xl">Checkout</h1>
        <p className="mt-4 text-xl text-ink-soft">Your bag is empty.</p>
        <Link href="/shop" className="btn-royal mt-8">
          Shop the Collection
        </Link>
      </div>
    );
  }

  const submitAddress = (e: FormEvent) => {
    e.preventDefault();
    const next: typeof errors = {};
    (Object.keys(VALIDATE) as (keyof Address)[]).forEach((k) => {
      const msg = VALIDATE[k]!(addr[k]);
      if (msg) next[k] = msg;
    });
    setErrors(next);
    const first = Object.keys(next)[0];
    if (first) {
      document.getElementById(`co-${first}`)?.focus();
      return;
    }
    setStep(2);
  };

  const finish = (id: string, total: number, paid: boolean) => {
    cart.clear();
    setAwaiting(null);
    setPlaced({ id, total, paid });
    window.scrollTo({ top: 0 });
  };

  /** Open Razorpay for an order the server has already created and priced. */
  const pay = async (o: { id: string; total: number; payment: PaymentRequest }) => {
    setOrderError(null);
    if (!(await loadRazorpay()) || !window.Razorpay) {
      setOrderError("The payment window couldn't load. Check your connection and press Pay again.");
      return;
    }
    const rzp = new window.Razorpay({
      key: o.payment.keyId,
      amount: o.payment.amount,
      currency: o.payment.currency,
      order_id: o.payment.razorpayOrderId,
      name: "SARPECH",
      description: `Order ${o.id}`,
      prefill: { name: `${addr.firstName} ${addr.lastName}`.trim(), email: addr.email, contact: addr.phone },
      notes: { order_id: o.id },
      theme: { color: "#0E1A15" },
      handler: (r: RazorpaySuccess) => {
        startPlacing(async () => {
          const res = await confirmPayment({ orderId: o.id, razorpayOrderId: r.razorpay_order_id, paymentId: r.razorpay_payment_id, signature: r.razorpay_signature });
          if (res.ok) finish(o.id, o.total, true);
          else setOrderError(res.message ?? "We couldn't confirm your payment.");
        });
      },
      modal: {
        ondismiss: () => setOrderError(`Payment wasn't completed. Order ${o.id} is held for you for 60 minutes. Press Pay to try again.`),
      },
    });
    rzp.on("payment.failed", (r) => setOrderError(`Payment failed${r.error?.description ? `: ${r.error.description}` : ""}. You can try again.`));
    rzp.open();
  };

  const placeOrder = () => {
    setOrderError(null);
    if (awaiting) {
      void pay(awaiting);
      return;
    }
    startPlacing(async () => {
      const res = await placeOrderAction({
        lines,
        customer: addr,
        shippingMethod: method,
        couponCode: coupon?.code ?? null,
        sessionId: sessionId(),
      });
      if (!res.ok) {
        setOrderError(res.message);
        return;
      }
      if (res.payment) {
        const o = { id: res.orderId, total: res.total, payment: res.payment };
        setAwaiting(o);
        void pay(o);
        return;
      }
      finish(res.orderId, res.total, false);
    });
  };

  const field = (k: keyof Address, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <Field id={`co-${k}`} label={label} error={errors[k]}>
      <input
        id={`co-${k}`}
        value={addr[k]}
        onChange={(e) => setAddr({ ...addr, [k]: e.target.value })}
        aria-invalid={!!errors[k]}
        aria-describedby={errors[k] ? `co-${k}-err` : undefined}
        className="field"
        {...props}
      />
    </Field>
  );

  return (
    <div className="mx-auto max-w-6xl px-4 pb-24 pt-10 sm:px-6 lg:px-8">
      <h1 className="text-center text-2xl sm:text-3xl">Checkout</h1>
      <ol className="mx-auto mt-8 flex max-w-xl items-center justify-between gap-2" aria-label="Checkout steps">
        {["Address", "Shipping", "Payment"].map((label, i) => {
          const n = (i + 1) as Step;
          const done = step > n;
          const current = step === n;
          return (
            <li key={label} className="flex flex-1 items-center gap-2" aria-current={current ? "step" : undefined}>
              <span
                className={`grid size-8 shrink-0 place-items-center rounded-full border font-display text-xs ${
                  done || current ? "border-brand-green bg-brand-green text-ivory" : "border-mist text-ink-soft"
                }`}
              >
                {done ? <CheckIcon /> : n}
              </span>
              <span className={`eyebrow ${current ? "" : "text-ink-soft"}`}>{label}</span>
              {i < 2 && <span aria-hidden className="mx-1 h-px flex-1 bg-gold/50" />}
            </li>
          );
        })}
      </ol>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_22rem]">
        <div>
          {/* Step 1 */}
          <Panel title="1 · Contact & Address" open={step === 1} done={step > 1} onEdit={() => setStep(1)}
            summary={`${addr.firstName} ${addr.lastName}, ${addr.line1}, ${addr.city} ${addr.pin}`}>
            {customer ? (
              <p className="mb-5 flex flex-wrap items-center justify-between gap-2 border border-gold/50 bg-pearl px-4 py-3 text-base">
                <span>
                  Checking out as <strong className="font-semibold">{customer.name}</strong> · {customer.email}
                </span>
                {customer.addresses.length > 1 && (
                  <label className="flex items-center gap-2">
                    <span className="sr-only">Use a saved address</span>
                    <select
                      className="field min-h-9 py-1 text-base"
                      defaultValue=""
                      onChange={(e) => {
                        const a = customer.addresses.find((x) => x.id === e.target.value);
                        if (a) setAddr({ email: customer.email, phone: a.phone || customer.phone, firstName: a.firstName, lastName: a.lastName, line1: a.line1, line2: a.line2, city: a.city, state: a.state, pin: a.pin });
                      }}
                    >
                      <option value="" disabled>
                        Use a saved address…
                      </option>
                      {customer.addresses.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.label} · {a.line1}, {a.city}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
              </p>
            ) : (
              <p className="mb-5 border border-mist px-4 py-3 text-base">
                Have an account?{" "}
                <Link href="/account/login?next=/checkout" className="underline decoration-gold underline-offset-4">
                  Sign in
                </Link>{" "}
                for faster checkout and order tracking — or continue as a guest.
              </p>
            )}
            <form noValidate onSubmit={submitAddress} className="grid gap-4 sm:grid-cols-2">
              {field("email", "Email", { type: "email", autoComplete: "email" })}
              {field("phone", "Mobile", { type: "tel", autoComplete: "tel", inputMode: "tel" })}
              {field("firstName", "First name", { autoComplete: "given-name" })}
              {field("lastName", "Last name", { autoComplete: "family-name" })}
              <div className="sm:col-span-2">{field("line1", "Address", { autoComplete: "address-line1" })}</div>
              <div className="sm:col-span-2">{field("line2", "Apartment, landmark (optional)", { autoComplete: "address-line2" })}</div>
              {field("city", "City", { autoComplete: "address-level2" })}
              <Field id="co-state" label="State" error={errors.state}>
                <select
                  id="co-state"
                  value={addr.state}
                  onChange={(e) => setAddr({ ...addr, state: e.target.value })}
                  aria-invalid={!!errors.state}
                  aria-describedby={errors.state ? "co-state-err" : undefined}
                  className="field"
                  autoComplete="address-level1"
                >
                  <option value="">Select…</option>
                  {STATES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
              </Field>
              {field("pin", "PIN code", { inputMode: "numeric", autoComplete: "postal-code", maxLength: 6 })}
              <div className="sm:col-span-2">
                <button type="submit" className="btn-royal w-full sm:w-auto">
                  Continue to Shipping
                </button>
              </div>
            </form>
          </Panel>

          {/* Step 2 */}
          <Panel title="2 · Shipping" open={step === 2} done={step > 2} onEdit={() => setStep(2)}
            summary={method === "express" ? "Express · 1–2 days" : "Standard · 3–7 days"}>
            <fieldset>
              <legend className="sr-only">Shipping method</legend>
              <div className="grid gap-3">
                {[
                  { v: "standard" as const, t: "Standard, insured", d: "3–7 business days", p: standard },
                  { v: "express" as const, t: "Express, insured", d: "1–2 business days in metro cities", p: settings.expressShipping },
                ].map((o) => (
                  <label
                    key={o.v}
                    className={`flex cursor-pointer items-center gap-4 border p-4 transition ${method === o.v ? "border-brand-green bg-pearl" : "border-mist"}`}
                  >
                    <input type="radio" name="ship" checked={method === o.v} onChange={() => setMethod(o.v)} className="size-4 accent-brand-green" />
                    <span className="flex-1">
                      <span className="block font-display text-xs uppercase tracking-[0.18em]">{o.t}</span>
                      <span className="text-base text-ink-soft">{o.d}</span>
                    </span>
                    <span className="text-lg">{o.p === 0 ? "Complimentary" : formatINR(o.p)}</span>
                  </label>
                ))}
              </div>
            </fieldset>
            <button type="button" onClick={() => setStep(3)} className="btn-royal mt-6 w-full sm:w-auto">
              Continue to Payment
            </button>
          </Panel>

          {/* Step 3 */}
          <Panel title="3 · Payment" open={step === 3} done={false} onEdit={() => setStep(3)} summary="">
            <div className="relative border border-dashed border-gold p-6 text-center">
              <p className="eyebrow text-ink-soft">Secure payment</p>
              {mode === "none" ? (
                <>
                  <p className="mt-2 text-xl">Pay on confirmation</p>
                  <p className="mt-1 text-base text-ink-soft">
                    Online payment isn&apos;t switched on yet. Place your order and our team will contact you to arrange payment.
                  </p>
                </>
              ) : (
                <>
                  <p className="mt-2 text-xl">Pay securely with Razorpay</p>
                  <p className="mt-1 text-base text-ink-soft">UPI · Cards · Net banking · Wallets · EMI</p>
                </>
              )}
            </div>
            {orderError && (
              <p role="alert" className="mt-4 border border-ruby/40 bg-ruby/5 px-4 py-3 text-base text-ruby">
                {orderError}
              </p>
            )}
            <button type="button" onClick={placeOrder} disabled={placing} className="btn-royal mt-6 w-full">
              {placing
                ? mode === "razorpay"
                  ? "Please wait…"
                  : "Placing order…"
                : `${mode === "razorpay" ? "Pay" : "Place Order"} · ${formatINR(awaiting?.total ?? afterDiscount + shipping)}`}
            </button>
          </Panel>
        </div>

        <aside aria-label="Order summary" className="lg:sticky lg:top-32 lg:self-start">
          <OrderSummary showItems shippingOverride={shipping} discount={discount} couponCode={coupon?.code}>
            <CouponField
              applied={coupon}
              onApply={async (code) => {
                const res = await checkCoupon(code, lines, sessionId());
                if (res.ok) setCoupon({ code: res.code, discount: res.discount, description: res.description });
                return res.ok ? null : res.message;
              }}
              onRemove={() => setCoupon(null)}
            />
          </OrderSummary>
        </aside>
      </div>
    </div>
  );
}

function Panel({
  title,
  open,
  done,
  onEdit,
  summary,
  children,
}: {
  title: string;
  open: boolean;
  done: boolean;
  onEdit: () => void;
  summary: string;
  children: ReactNode;
}) {
  return (
    <section className="border-b border-mist py-6 first:pt-0">
      <div className="flex items-baseline justify-between">
        <h2 className={`font-display text-sm tracking-[0.2em] ${open || done ? "" : "text-ink-soft"}`}>{title}</h2>
        {done && (
          <button type="button" onClick={onEdit} className="link-thread text-base">
            Edit
          </button>
        )}
      </div>
      {done && !open && <p className="mt-2 text-lg text-ink-soft">{summary}</p>}
      {open && <div className="mt-5">{children}</div>}
    </section>
  );
}

function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: ReactNode }) {
  return (
    <div>
      <label htmlFor={id} className="field-label">
        {label}
      </label>
      {children}
      {error && (
        <p id={`${id}-err`} className="mt-1 text-base text-ruby">
          {error}
        </p>
      )}
    </div>
  );
}

function CouponField({
  applied,
  onApply,
  onRemove,
}: {
  applied: { code: string; description: string } | null;
  onApply: (code: string) => Promise<string | null>;
  onRemove: () => void;
}) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, start] = useTransition();

  if (applied) {
    return (
      <div className="mt-5 flex items-start justify-between gap-3 border border-dashed border-gold bg-pearl px-3 py-2">
        <p className="text-base">
          <span className="font-display text-xs tracking-[0.18em]">{applied.code}</span> applied
          {applied.description && <span className="block text-sm text-ink-soft">{applied.description}</span>}
        </p>
        <button type="button" onClick={onRemove} className="link-thread text-sm text-ink-soft">
          Remove
        </button>
      </div>
    );
  }

  return (
    <form
      className="mt-5"
      onSubmit={(e) => {
        e.preventDefault();
        setError(null);
        start(async () => setError(await onApply(code)));
      }}
    >
      <label htmlFor="coupon-code" className="field-label">
        Coupon code
      </label>
      <div className="flex gap-2">
        <input
          id="coupon-code"
          value={code}
          onChange={(e) => setCode(e.target.value.toUpperCase())}
          autoComplete="off"
          aria-invalid={!!error}
          aria-describedby={error ? "coupon-error" : undefined}
          className="field min-h-11 flex-1 py-1.5 uppercase"
        />
        <button type="submit" disabled={pending || !code.trim()} className="btn-outline min-h-11 px-4 py-1.5">
          {pending ? "…" : "Apply"}
        </button>
      </div>
      {error && (
        <p id="coupon-error" role="alert" className="mt-1.5 text-sm text-ruby">
          {error}
        </p>
      )}
    </form>
  );
}
