import { router } from "expo-router";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, View } from "react-native";
import { StitchingEmblem } from "@/components/Emblem";
import { Body, TopBar } from "@/components/layout";
import { Btn, Field, Notice, T, Tap } from "@/components/ui";
import { ApiError } from "@/lib/api";
import { C } from "@/lib/theme";
import { useAccount } from "@/state/account";

export default function Login() {
  const { signIn } = useAccount();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const submit = async () => {
    setError(null);
    setBusy(true);
    try {
      await signIn(email.trim(), password);
      router.back();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Couldn't sign in.");
    } finally {
      setBusy(false);
    }
  };
  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.white }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <TopBar close title="Sign in" />
      <Body contentStyle={{ padding: 20 }}>
        <View style={{ alignItems: "center", marginBottom: 18 }}>
          <StitchingEmblem size={72} loop={false} />
          <T v="display" style={{ marginTop: 12, fontSize: 22 }}>
            Welcome back
          </T>
        </View>
        {error && <Notice tone="error">{error}</Notice>}
        <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" textContentType="username" />
        <Field label="Password" value={password} onChangeText={setPassword} secureTextEntry={!show} autoComplete="current-password" textContentType="password" onSubmitEditing={submit} returnKeyType="go" />
        <Tap onPress={() => setShow((x) => !x)} style={{ alignSelf: "flex-end", marginTop: -8, marginBottom: 12, padding: 6 }} accessibilityRole="button">
          <T v="label" style={{ fontSize: 9.5, color: C.inkSoft }}>
            {show ? "Hide password" : "Show password"}
          </T>
        </Tap>
        <Btn onPress={submit} loading={busy}>
          Sign in
        </Btn>
        <Btn kind="ghost" onPress={() => router.replace("/forgot")} style={{ marginTop: 6 }}>
          Forgot password?
        </Btn>
        <Btn kind="outline" onPress={() => router.replace("/register")} style={{ marginTop: 6 }}>
          Create an account
        </Btn>
      </Body>
    </KeyboardAvoidingView>
  );
}
