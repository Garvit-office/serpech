import { View } from "react-native";
import { C } from "@/lib/theme";
import { T, Tap } from "./ui";

export function Stepper({ value, onChange, min = 1, max = 10 }: { value: number; onChange: (n: number) => void; min?: number; max?: number }) {
  return (
    <View accessibilityRole="adjustable" accessibilityLabel="Quantity" accessibilityValue={{ now: value, min, max }} style={{ flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "rgba(14,26,21,0.4)", alignSelf: "flex-start" }}>
      <Tap onPress={() => onChange(Math.max(min, value - 1))} disabled={value <= min} accessibilityLabel="Decrease quantity" style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}>
        <T style={{ fontSize: 22, color: C.green }}>−</T>
      </Tap>
      <T style={{ minWidth: 28, textAlign: "center" }}>{value}</T>
      <Tap onPress={() => onChange(Math.min(max, value + 1))} disabled={value >= max} accessibilityLabel="Increase quantity" style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}>
        <T style={{ fontSize: 22, color: C.green }}>+</T>
      </Tap>
    </View>
  );
}
