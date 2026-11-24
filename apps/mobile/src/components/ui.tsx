import { forwardRef, type ReactNode } from "react";
import { haptic as feel } from "@/lib/haptics";
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View, type PressableProps, type StyleProp, type TextInputInstance, type TextInputProps, type TextProps, type TextStyle, type ViewStyle } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from "react-native-reanimated";
import { formatINR } from "@sarpech/core/format";
import { C, F } from "@/lib/theme";

/* ───────────── Text ───────────── */

type Variant = "display" | "title" | "eyebrow" | "body" | "small" | "label" | "italic" | "price";

const TEXT: Record<Variant, TextStyle> = {
  display: { fontFamily: F.display, fontSize: 26, letterSpacing: 3, textTransform: "uppercase", color: C.green },
  title: { fontFamily: F.display, fontSize: 13, letterSpacing: 2.2, textTransform: "uppercase", color: C.green },
  eyebrow: { fontFamily: F.display, fontSize: 10.5, letterSpacing: 2.6, textTransform: "uppercase", color: C.goldDark },
  body: { fontFamily: F.serif, fontSize: 18, lineHeight: 25, color: C.green },
  small: { fontFamily: F.serif, fontSize: 15.5, lineHeight: 21, color: C.inkSoft },
  label: { fontFamily: F.display, fontSize: 10.5, letterSpacing: 2, textTransform: "uppercase", color: C.green },
  italic: { fontFamily: F.serifItalic, fontSize: 19, color: C.green },
  price: { fontFamily: F.display, fontSize: 15, letterSpacing: 0.6, color: C.green },
};

export function T({ v = "body", style, ...rest }: TextProps & { v?: Variant }) {
  return <Text {...rest} style={[TEXT[v], style]} />;
}

export function Price({ value, was, style }: { value: number; was?: number; style?: StyleProp<TextStyle> }) {
  return (
    <Text style={[TEXT.price, style]}>
      {formatINR(value)}
      {was && was > value ? <Text style={{ color: C.inkSoft, textDecorationLine: "line-through", fontSize: 13 }}>{`  ${formatINR(was)}`}</Text> : null}
    </Text>
  );
}

/* ───────────── Press feedback ───────────── */

/** Pressable that gives a little under the finger (spring scale) — used by every tappable surface. */
export function Tap({ children, style, haptic = false, onPress, disabled, ...rest }: PressableProps & { children: ReactNode; style?: StyleProp<ViewStyle>; haptic?: boolean }) {
  const s = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  // Sizing in the parent's layout (flex, alignSelf, width) must apply to the outer pressable, or flex rows can't share space.
  const flat = StyleSheet.flatten(style) ?? {};
  const outer: ViewStyle = { flex: flat.flex, flexGrow: flat.flexGrow, flexShrink: flat.flexShrink, flexBasis: flat.flexBasis, alignSelf: flat.alignSelf, width: flat.width };
  return (
    <Pressable
      {...rest}
      style={outer}
      disabled={disabled}
      onPressIn={() => s.set(withSpring(0.97, { damping: 18, stiffness: 400 }))}
      onPressOut={() => s.set(withSpring(1, { damping: 14, stiffness: 300 }))}
      onPress={(e) => {
        if (haptic) feel.tap();
        onPress?.(e);
      }}
    >
      <Animated.View style={[anim, style, disabled ? { opacity: 0.5 } : null]}>{children}</Animated.View>
    </Pressable>
  );
}

export function Btn({
  children,
  onPress,
  kind = "royal",
  loading = false,
  disabled,
  style,
  accessibilityLabel,
}: {
  children: ReactNode;
  onPress?: () => void;
  kind?: "royal" | "gold" | "outline" | "ghost";
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
}) {
  const box = { royal: s.royal, gold: s.gold, outline: s.outline, ghost: s.ghost }[kind];
  const color = kind === "royal" ? C.ivory : C.green;
  return (
    <Tap onPress={onPress} disabled={disabled || loading} haptic accessibilityRole="button" accessibilityLabel={accessibilityLabel} style={[s.btn, box, style]}>
      {kind === "royal" && <View pointerEvents="none" style={s.royalInner} />}
      {loading ? <ActivityIndicator color={color} /> : typeof children === "string" ? <Text style={[s.btnText, { color }]}>{children}</Text> : children}
    </Tap>
  );
}

export function Chip({ on, onPress, children, style }: { on: boolean; onPress: () => void; children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <Tap onPress={onPress} accessibilityRole="button" accessibilityState={{ selected: on }} style={[s.chip, on ? s.chipOn : null, style]}>
      {typeof children === "string" ? <Text style={[s.chipText, on ? { color: C.ivory } : null]}>{children}</Text> : children}
    </Tap>
  );
}

/* ───────────── Fields ───────────── */

export const Field = forwardRef<TextInputInstance, TextInputProps & { label: string; error?: string; hint?: string }>(function Field({ label, error, hint, style, ...rest }, ref) {
  const focus = useSharedValue(0);
  const ring = useAnimatedStyle(() => ({ borderColor: focus.value ? C.green : error ? C.ruby : "#B9B4A6", borderWidth: focus.value ? 1.5 : 1 }));
  return (
    <View style={{ marginBottom: 16 }}>
      <T v="label" style={{ marginBottom: 6 }}>
        {label}
      </T>
      <Animated.View style={[s.field, ring]}>
        <TextInput
          ref={ref}
          placeholderTextColor="#6B746F"
          accessibilityLabel={label}
          testID={`field:${label}`}
          {...rest}
          onFocus={(e) => {
            focus.set(withTiming(1, { duration: 150 }));
            rest.onFocus?.(e);
          }}
          onBlur={(e) => {
            focus.set(withTiming(0, { duration: 150 }));
            rest.onBlur?.(e);
          }}
          style={[s.input, style]}
        />
      </Animated.View>
      {error ? <T style={{ color: C.ruby, fontSize: 15, marginTop: 4 }}>{error}</T> : hint ? <T v="small" style={{ marginTop: 4 }}>{hint}</T> : null}
    </View>
  );
});

export function Notice({ tone = "info", children }: { tone?: "info" | "error" | "success"; children: ReactNode }) {
  const st = { info: { backgroundColor: C.pearl, borderColor: "rgba(201,160,74,0.6)" }, error: { backgroundColor: C.errorBg, borderColor: "rgba(163,22,43,0.4)" }, success: { backgroundColor: C.successBg, borderColor: "rgba(31,91,69,0.4)" } }[tone];
  return (
    <View accessibilityRole={tone === "error" ? "alert" : "text"} style={[s.notice, st]}>
      <T style={{ color: tone === "error" ? C.ruby : tone === "success" ? C.success : C.green, fontSize: 16.5 }}>{children}</T>
    </View>
  );
}

export function Hairline({ style }: { style?: StyleProp<ViewStyle> }) {
  return <View style={[{ height: StyleSheet.hairlineWidth, backgroundColor: C.mist }, style]} />;
}

export function GoldRule({ style }: { style?: StyleProp<ViewStyle> }) {
  return <View style={[{ height: 1, width: 56, backgroundColor: C.gold, marginTop: 10 }, style]} />;
}

const s = StyleSheet.create({
  btn: { minHeight: 52, paddingHorizontal: 24, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 8 },
  royal: { backgroundColor: C.green },
  royalInner: { position: "absolute", top: 4, left: 4, right: 4, bottom: 4, borderWidth: 1, borderColor: C.gold },
  gold: { backgroundColor: C.gold },
  outline: { borderWidth: 1, borderColor: C.green },
  ghost: {},
  btnText: { fontFamily: F.display, fontSize: 12, letterSpacing: 2.6, textTransform: "uppercase" },
  chip: { minHeight: 42, paddingHorizontal: 14, borderWidth: 1, borderColor: "rgba(14,26,21,0.3)", alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 6, backgroundColor: C.white },
  chipOn: { backgroundColor: C.green, borderColor: C.green },
  chipText: { fontFamily: F.display, fontSize: 10.5, letterSpacing: 1.6, textTransform: "uppercase", color: C.green },
  field: { backgroundColor: C.white },
  input: { minHeight: 50, paddingHorizontal: 14, fontFamily: F.serif, fontSize: 18, color: C.green },
  notice: { borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 16 },
});
