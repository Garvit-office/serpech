import { router } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, View } from "react-native";
import { Body, TopBar } from "@/components/layout";
import { Btn, Field, Notice, T, Tap } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { C } from "@/lib/theme";
import { useAccount } from "@/state/account";

export default function Register() {
  const { signUp } = useAccount();
  const [f, setF] = useState({ name: "", email: "", phone: "", password: "" });
  const [marketing, setMarketing] = useState(false);
  const [terms, setTerms] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (v: string) => setF((x) => ({ ...x, [k]: v }));
  const submit = async () => {
    setError(null);
    setBusy(true);
    try {
      await signUp({ ...f, marketing, terms });
      router.back();
    } catch (e) {
      if (e instanceof ApiError) {
        setError(e.message);
        setErrors(e.fieldErrors);
      } else setError("Couldn't create your account.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.white }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <TopBar close title="Create account" />
      <Body contentStyle={{ padding: 20 }}>
        <T v="small" style={{ marginBottom: 16 }}>
          Track every order, keep your wishlist and Royal Fit on every device, and check out faster.
        </T>
        {error && <Notice tone="error">{error}</Notice>}
        <Field label="Full name" value={f.name} onChangeText={set("name")} autoComplete="name" error={errors.name} />
        <Field label="Email" value={f.email} onChangeText={set("email")} keyboardType="email-address" autoCapitalize="none" autoComplete="email" error={errors.email} />
        <Field label="Mobile (optional)" value={f.phone} onChangeText={set("phone")} keyboardType="phone-pad" error={errors.phone} />
        <Field label="Create a password" value={f.password} onChangeText={set("password")} secureTextEntry autoComplete="new-password" textContentType="newPassword" error={errors.password} hint="At least 8 characters, with a letter and a number." />
        <Check on={marketing} onPress={() => setMarketing((x) => !x)}>
          Send me new collections and private previews
        </Check>
        <Check on={terms} onPress={() => setTerms((x) => !x)}>
          I agree to the terms of sale and privacy policy
        </Check>
        {errors.terms && <T style={{ color: C.ruby, marginBottom: 8 }}>{errors.terms}</T>}
        <Btn onPress={submit} loading={busy} style={{ marginTop: 8 }}>
          Create account
        </Btn>
        <Btn kind="ghost" onPress={() => router.replace("/login")} style={{ marginTop: 6 }}>
          Already have an account? Sign in
        </Btn>
      </Body>
    </KeyboardAvoidingView>
  );
}

function Check({ on, onPress, children }: { on: boolean; onPress: () => void; children: string }) {
  return (
    <Tap onPress={onPress} accessibilityRole="checkbox" accessibilityState={{ checked: on }} style={{ flexDirection: "row", alignItems: "center", gap: 10, minHeight: 44, marginBottom: 4 }}>
      <View style={{ width: 20, height: 20, borderWidth: 1.5, borderColor: C.green, backgroundColor: on ? C.green : "transparent" }} />
      <T style={{ flex: 1 }}>{children}</T>
    </Tap>
  );
}
