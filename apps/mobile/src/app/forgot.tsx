import { useState } from "react";
import { View } from "react-native";
import { Body, TopBar } from "@/components/layout";
import { Btn, Field, Notice, T } from "@/components/ui";
import { ApiError, api } from "@/lib/api";
import { C } from "@/lib/theme";

export default function Forgot() {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <View style={{ flex: 1, backgroundColor: C.white }}>
      <TopBar close title="Forgot password" />
      <Body contentStyle={{ padding: 20 }}>
        <T v="small" style={{ marginBottom: 16 }}>
          Enter your email and we&apos;ll send a link to set a new password. It works once and expires in an hour.
        </T>
        {done ? (
          <Notice tone="success">{done}</Notice>
        ) : (
          <>
            {error && <Notice tone="error">{error}</Notice>}
            <Field label="Email" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoComplete="email" />
            <Btn
              loading={busy}
              onPress={async () => {
                setBusy(true);
                setError(null);
                try {
                  setDone((await api<{ message: string }>("/auth/forgot", { body: { email }, auth: false })).message);
                } catch (e) {
                  setError(e instanceof ApiError ? e.message : "Couldn't send the link.");
                } finally {
                  setBusy(false);
                }
              }}
            >
              Send reset link
            </Btn>
          </>
        )}
      </Body>
    </View>
  );
}
