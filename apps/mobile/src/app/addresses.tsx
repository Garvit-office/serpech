import { useState } from "react";
import { Alert, StyleSheet, View } from "react-native";
import type { Address } from "@sarpech/core/types";
import { Body, TopBar } from "@/components/layout";
import { Btn, Chip, Field, Notice, T, Tap } from "@/components/ui";
import { ApiError, api } from "@/lib/api";
import { C } from "@/lib/theme";
import { useAccount } from "@/state/account";

const STATES = ["Delhi", "Gujarat", "Haryana", "Karnataka", "Maharashtra", "Punjab", "Rajasthan", "Tamil Nadu", "Telangana", "Uttar Pradesh", "West Bengal", "Other"];
const EMPTY: Partial<Address> = { label: "Home", firstName: "", lastName: "", phone: "", line1: "", line2: "", city: "", state: "", pin: "", isDefault: false };

export default function Addresses() {
  const { customer, setAddresses } = useAccount();
  const [editing, setEditing] = useState<Partial<Address> | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  if (!customer) return null;
  const list = customer.addresses;
  const set = (k: keyof Address) => (v: string) => setEditing((a) => ({ ...a, [k]: v }));

  const save = async () => {
    setBusy(true);
    try {
      const r = await api<{ addresses: Address[] }>("/me/addresses", { body: editing });
      setAddresses(r.addresses);
      setEditing(null);
      setErrors({});
    } catch (e) {
      if (e instanceof ApiError) setErrors(e.fieldErrors);
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.white }}>
      <TopBar back title="Addresses" />
      <Body contentStyle={{ padding: 16 }}>
        {editing ? (
          <>
            {Object.keys(errors).length > 0 && <Notice tone="error">Please check the highlighted fields.</Notice>}
            <Field label="Label" value={editing.label} onChangeText={set("label")} />
            <Field label="First name" value={editing.firstName} onChangeText={set("firstName")} error={errors.firstName} />
            <Field label="Last name" value={editing.lastName} onChangeText={set("lastName")} />
            <Field label="Mobile" value={editing.phone} onChangeText={set("phone")} keyboardType="phone-pad" error={errors.phone} />
            <Field label="Address" value={editing.line1} onChangeText={set("line1")} error={errors.line1} />
            <Field label="Apartment, landmark (optional)" value={editing.line2} onChangeText={set("line2")} />
            <Field label="City" value={editing.city} onChangeText={set("city")} error={errors.city} />
            <Field label="PIN code" value={editing.pin} onChangeText={set("pin")} keyboardType="number-pad" maxLength={6} error={errors.pin} />
            <T v="label" style={{ marginBottom: 8 }}>
              State
            </T>
            <View style={s.wrap}>
              {STATES.map((x) => (
                <Chip key={x} on={editing.state === x} onPress={() => set("state")(x)} style={{ minHeight: 36, paddingHorizontal: 10 }}>
                  {x}
                </Chip>
              ))}
            </View>
            {errors.state && <T style={{ color: C.ruby, marginTop: 4 }}>{errors.state}</T>}
            <Btn onPress={save} loading={busy} style={{ marginTop: 18 }}>
              Save address
            </Btn>
            <Btn kind="ghost" onPress={() => setEditing(null)} style={{ marginTop: 6 }}>
              Cancel
            </Btn>
          </>
        ) : (
          <>
            {list.length === 0 && <T v="small">No saved addresses yet — your first order&apos;s address is saved automatically.</T>}
            {list.map((a) => (
              <View key={a.id} style={[s.card, a.isDefault && { borderColor: C.gold }]}>
                <T v="label">
                  {a.label}
                  {a.isDefault ? " · default" : ""}
                </T>
                <T style={{ marginTop: 4 }}>
                  {a.firstName} {a.lastName}
                  {"\n"}
                  {a.line1}
                  {"\n"}
                  {a.city}, {a.state} {a.pin}
                </T>
                <View style={{ flexDirection: "row", gap: 18, marginTop: 8 }}>
                  <Tap onPress={() => setEditing(a)} accessibilityRole="button">
                    <T v="label" style={{ fontSize: 9.5 }}>
                      Edit
                    </T>
                  </Tap>
                  <Tap
                    onPress={() =>
                      Alert.alert("Remove this address?", a.label, [
                        { text: "Cancel", style: "cancel" },
                        { text: "Remove", style: "destructive", onPress: async () => setAddresses((await api<{ addresses: Address[] }>(`/me/addresses/${encodeURIComponent(a.id)}`, { method: "DELETE" })).addresses) },
                      ])
                    }
                    accessibilityRole="button"
                  >
                    <T v="label" style={{ fontSize: 9.5, color: C.ruby }}>
                      Remove
                    </T>
                  </Tap>
                </View>
              </View>
            ))}
            <Btn kind="outline" onPress={() => setEditing({ ...EMPTY, isDefault: list.length === 0 })} style={{ marginTop: 12 }}>
              + Add an address
            </Btn>
          </>
        )}
      </Body>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  card: { borderWidth: 1, borderColor: C.mist, padding: 14, marginBottom: 10 },
});
