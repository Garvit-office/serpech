import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, View, type ScrollViewInstance, type TextInputInstance } from "react-native";
import { formatINR } from "@sarpech/core/format";
import type { OrderCustomer } from "@sarpech/core/types";
import { Body, TopBar } from "@/components/layout";
import { Btn, Chip, Field, Hairline, Notice, T } from "@/components/ui";
import { ApiError, api } from "@/lib/api";
import { KEYS, readJson, writeJson } from "@/lib/storage";
import { C } from "@/lib/theme";
import { useAccount } from "@/state/account";
import { useCart } from "@/state/cart";
import { useCatalog } from "@/state/catalog";

const EMPTY: OrderCustomer = { email: "", phone: "", firstName: "", lastName: "", line1: "", line2: "", city: "", state: "", pin: "" };
const STATES = ["Delhi", "Gujarat", "Haryana", "Karnataka", "Maharashtra", "Punjab", "Rajasthan", "Tamil Nadu", "Telangana", "Uttar Pradesh", "West Bengal", "Other"];

function validate(a: OrderCustomer) {
  const e: Partial<Record<keyof OrderCustomer, string>> = {};
  if (!/^\S+@\S+\.\S+$/.test(a.email)) e.email = "Enter a valid email address.";
  if (!/^(\+91[\s-]?)?[6-9]\d{9}$/.test(a.phone.replace(/\s/g, ""))) e.phone = "Enter a 10-digit Indian mobile number.";
  if (!a.firstName.trim()) e.firstName = "Required.";
  if (!a.lastName.trim()) e.lastName = "Required.";
  if (!a.line1.trim()) e.line1 = "Required.";
  if (!a.city.trim()) e.city = "Required.";
  if (!a.state) e.state = "Choose a state.";
  if (!/^\d{6}$/.test(a.pin)) e.pin = "Enter a 6-digit PIN code.";
  return e;
}

export default function Checkout() {
  const cart = useCart();
  const { data } = useCatalog();
  const { customer } = useAccount();
  const [a, setA] = useState<OrderCustomer>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof OrderCustomer, string>>>({});
  const [method, setMethod] = useState<"standard" | "express">("standard");
  const [code, setCode] = useState("");
  const [coupon, setCoupon] = useState<{ code: string; discount: number } | null>(null);
  const [couponMsg, setCouponMsg] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [placing, setPlacing] = useState(false);
  const scroller = useRef<ScrollViewInstance>(null);
  // Keyboard "Next" walks through the form in order; the last field says "Done".
  const emailRef = useRef<TextInputInstance>(null);
  const phoneRef = useRef<TextInputInstance>(null);
  const firstNameRef = useRef<TextInputInstance>(null);
  const lastNameRef = useRef<TextInputInstance>(null);
  const line1Ref = useRef<TextInputInstance>(null);
  const line2Ref = useRef<TextInputInstance>(null);
  const cityRef = useRef<TextInputInstance>(null);
  const pinRef = useRef<TextInputInstance>(null);

  // Prefill: signed-in default address, else the last address used on this phone.
  useEffect(() => {
    void (async () => {
      const d = customer?.addresses.find((x) => x.isDefault) ?? customer?.addresses[0];
      if (customer && d) return setA({ email: customer.email, phone: d.phone || customer.phone, firstName: d.firstName, lastName: d.lastName, line1: d.line1, line2: d.line2, city: d.city, state: d.state, pin: d.pin });
      const saved = await readJson<OrderCustomer | null>(KEYS.address, null);
      if (saved) setA(saved);
      else if (customer) {
        const [first, ...rest] = customer.name.split(" ");
        setA({ ...EMPTY, email: customer.email, phone: customer.phone, firstName: first ?? "", lastName: rest.join(" ") });
      }
    })();
  }, [customer]);

  if (!data) return null;
  const st = data.settings;
  const discount = coupon?.discount ?? 0;
  const after = cart.subtotal - discount;
  const shipping = method === "express" ? st.expressShipping : after >= st.freeShippingThreshold ? 0 : st.standardShipping;
  const total = after + shipping;
  const set = (k: keyof OrderCustomer) => (v: string) => setA((x) => ({ ...x, [k]: v }));

  const applyCoupon = async () => {
    setCouponMsg(null);
    try {
      const r = await api<{ code: string; discount: number }>("/checkout/coupon", { body: { code, lines: cart.lines() } });
      setCoupon({ code: r.code, discount: r.discount });
    } catch (e) {
      setCoupon(null);
      setCouponMsg(e instanceof ApiError ? e.message : "That code didn't work.");
    }
  };

  const place = async () => {
    setError(null);
    const e = validate(a);
    setErrors(e);
    if (Object.keys(e).length) {
      scroller.current?.scrollTo({ y: 0, animated: true }); // bring the highlighted fields into view
      return setError("Please check the highlighted fields.");
    }
    setPlacing(true);
    try {
      void writeJson(KEYS.address, a);
      const r = await api<{ orderId: string; total: number; payment?: { keyId: string; razorpayOrderId: string; amount: number; currency: string } }>("/checkout/order", {
        body: { lines: cart.lines(), customer: a, shippingMethod: method, couponCode: coupon?.code ?? null },
      });
      if (r.payment) {
        router.push({
          pathname: "/pay",
          params: { orderId: r.orderId, total: String(r.total), keyId: r.payment.keyId, rzpOrderId: r.payment.razorpayOrderId, amount: String(r.payment.amount), currency: r.payment.currency, name: `${a.firstName} ${a.lastName}`, email: a.email, phone: a.phone },
        });
      } else {
        cart.clear();
        router.replace({ pathname: "/thanks", params: { orderId: r.orderId, total: String(r.total), paid: "0", email: a.email } });
      }
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't place the order. Please try again.");
    } finally {
      setPlacing(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.white }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <TopBar back title="Checkout" />
      <Body scrollRef={scroller} contentStyle={{ padding: 16 }}>
        {!customer && (
          <Notice>
            Have an account?{" "}
            <T style={{ textDecorationLine: "underline" }} onPress={() => router.push("/login")}>
              Sign in
            </T>{" "}
            for faster checkout and order tracking — or continue as a guest.
          </Notice>
        )}
        <T v="title">1 · Contact & address</T>
        <View style={{ height: 12 }} />
        <Field label="Email" value={a.email} onChangeText={set("email")} ref={emailRef} returnKeyType="next" submitBehavior="submit" onSubmitEditing={() => phoneRef.current?.focus()} keyboardType="email-address" autoCapitalize="none" autoComplete="email" error={errors.email} />
        <Field label="Mobile" value={a.phone} onChangeText={set("phone")} ref={phoneRef} returnKeyType="next" submitBehavior="submit" onSubmitEditing={() => firstNameRef.current?.focus()} keyboardType="phone-pad" autoComplete="tel" error={errors.phone} />
        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Field label="First name" value={a.firstName} onChangeText={set("firstName")} ref={firstNameRef} returnKeyType="next" submitBehavior="submit" onSubmitEditing={() => lastNameRef.current?.focus()} autoComplete="given-name" error={errors.firstName} />
          </View>
          <View style={{ flex: 1 }}>
            <Field label="Last name" value={a.lastName} onChangeText={set("lastName")} ref={lastNameRef} returnKeyType="next" submitBehavior="submit" onSubmitEditing={() => line1Ref.current?.focus()} autoComplete="family-name" error={errors.lastName} />
          </View>
        </View>
        <Field label="Address" value={a.line1} onChangeText={set("line1")} ref={line1Ref} returnKeyType="next" submitBehavior="submit" onSubmitEditing={() => line2Ref.current?.focus()} autoComplete="street-address" error={errors.line1} />
        <Field label="Apartment, landmark (optional)" value={a.line2} onChangeText={set("line2")} ref={line2Ref} returnKeyType="next" submitBehavior="submit" onSubmitEditing={() => cityRef.current?.focus()} />
        <View style={{ flexDirection: "row", gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Field label="City" value={a.city} onChangeText={set("city")} ref={cityRef} returnKeyType="next" submitBehavior="submit" onSubmitEditing={() => pinRef.current?.focus()} error={errors.city} />
          </View>
          <View style={{ flex: 1 }}>
            <Field label="PIN code" value={a.pin} onChangeText={set("pin")} ref={pinRef} returnKeyType="done" keyboardType="number-pad" maxLength={6} autoComplete="postal-code" error={errors.pin} />
          </View>
        </View>
        <T v="label" style={{ marginBottom: 8 }}>
          State
        </T>
        <View style={s.wrap}>
          {STATES.map((x) => (
            <Chip key={x} on={a.state === x} onPress={() => set("state")(x)} style={{ minHeight: 36, paddingHorizontal: 10 }}>
              {x}
            </Chip>
          ))}
        </View>
        {errors.state && <T style={{ color: C.ruby, marginTop: 4 }}>{errors.state}</T>}

        <Hairline style={{ marginVertical: 20 }} />
        <T v="title">2 · Shipping</T>
        <View style={[s.wrap, { marginTop: 12 }]}>
          <Chip on={method === "standard"} onPress={() => setMethod("standard")}>
            {`Standard · ${after >= st.freeShippingThreshold ? "Free" : formatINR(st.standardShipping)}`}
          </Chip>
          <Chip on={method === "express"} onPress={() => setMethod("express")}>
            {`Express · ${formatINR(st.expressShipping)}`}
          </Chip>
        </View>

        <Hairline style={{ marginVertical: 20 }} />
        <T v="title">3 · Review & pay</T>
        <View style={{ flexDirection: "row", gap: 10, alignItems: "flex-start", marginTop: 12 }}>
          <View style={{ flex: 1 }}>
            <Field label="Coupon" value={code} onChangeText={setCode} autoCapitalize="characters" error={couponMsg ?? undefined} hint={coupon ? `${coupon.code} applied: −${formatINR(coupon.discount)}` : undefined} />
          </View>
          <Btn kind="outline" onPress={applyCoupon} disabled={!code.trim()} style={{ marginTop: 22, minHeight: 50, paddingHorizontal: 16 }}>
            Apply
          </Btn>
        </View>
        {(
          [
            ["Subtotal", formatINR(cart.subtotal)],
            ...(discount ? [[`Coupon ${coupon!.code}`, `−${formatINR(discount)}`]] : []),
            ["Shipping", shipping ? formatINR(shipping) : "Complimentary"],
          ] as [string, string][]
        ).map(([k, v]) => (
          <View key={k} style={s.sumRow}>
            <T>{k}</T>
            <T>{v}</T>
          </View>
        ))}
        <View style={[s.sumRow, { borderTopWidth: 1, borderTopColor: C.mist, paddingTop: 10, marginTop: 4 }]}>
          <T v="title">Total</T>
          <T v="price" style={{ fontSize: 18 }}>
            {formatINR(total)}
          </T>
        </View>
        <T v="small" style={{ marginTop: 8 }}>
          {data.paymentMode === "razorpay" ? "Pay securely with Razorpay: UPI, cards, net banking or wallets." : "Online payment isn't switched on yet — place your order and our team will contact you to arrange payment."}
        </T>
        {error && (
          <View style={{ marginTop: 12 }}>
            <Notice tone="error">{error}</Notice>
          </View>
        )}
        <Btn onPress={place} loading={placing} style={{ marginTop: 16 }}>
          {`${data.paymentMode === "razorpay" ? "Pay" : "Place order"} · ${formatINR(total)}`}
        </Btn>
      </Body>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  sumRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
});
