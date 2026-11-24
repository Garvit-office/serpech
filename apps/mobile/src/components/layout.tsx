import { router } from "expo-router";
import { useEffect, type ReactNode, type RefObject } from "react";
import { RefreshControl, ScrollView, StyleSheet, View, type ScrollViewInstance, type ScrollViewProps, type StyleProp, type ViewStyle } from "react-native";
import Animated, { Easing, FadeInDown, useAnimatedStyle, useSharedValue, withDelay, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { C, F } from "@/lib/theme";
import { BackIcon, CloseIcon } from "./Icons";
import { StitchingEmblem } from "./Emblem";
import { T, Tap } from "./ui";

/** Green top bar matching the website header. */
export function TopBar({ title, back = false, close = false, right }: { title?: string; back?: boolean; close?: boolean; right?: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[s.bar, { paddingTop: insets.top + 6 }]}>
      <View style={s.side}>
        {(back || close) && (
          <Tap onPress={() => (router.canGoBack() ? router.back() : router.replace("/"))} accessibilityRole="button" accessibilityLabel={close ? "Close" : "Back"} style={s.iconBtn}>
            {close ? <CloseIcon color={C.ivory} /> : <BackIcon color={C.ivory} />}
          </Tap>
        )}
      </View>
      <T v="title" numberOfLines={1} style={s.title} accessibilityRole="header">
        {title ?? "SARPECH"}
      </T>
      <View style={[s.side, { alignItems: "flex-end" }]}>{right}</View>
    </View>
  );
}

/** Scrolling screen body with optional pull-to-refresh. */
export function Body({ children, refreshing, onRefresh, style, contentStyle, scrollRef, ...rest }: ScrollViewProps & { children: ReactNode; refreshing?: boolean; onRefresh?: () => void; contentStyle?: StyleProp<ViewStyle>; scrollRef?: RefObject<ScrollViewInstance | null> }) {
  return (
    <ScrollView
      ref={scrollRef}
      {...rest}
      style={[{ flex: 1, backgroundColor: C.white }, style]}
      contentContainerStyle={[{ paddingBottom: 40 }, contentStyle]}
      keyboardShouldPersistTaps="handled"
      refreshControl={onRefresh ? <RefreshControl refreshing={!!refreshing} onRefresh={onRefresh} tintColor={C.gold} /> : undefined}
    >
      {children}
    </ScrollView>
  );
}

/** Gentle entrance for list items and sections (staggered by index). */
export function Rise({ i = 0, children, style }: { i?: number; children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <Animated.View entering={FadeInDown.duration(420).delay(Math.min(i, 8) * 55).easing(Easing.bezier(0.2, 0.7, 0.2, 1))} style={style}>
      {children}
    </Animated.View>
  );
}

/** Branded loading state. */
export function Loader({ label = "Loading" }: { label?: string }) {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", paddingVertical: 80, backgroundColor: C.white }} accessibilityLabel={`${label}…`}>
      <StitchingEmblem size={92} />
      <T v="title" style={{ marginTop: 18, letterSpacing: 6 }}>
        SARPECH
      </T>
    </View>
  );
}

/** Opening splash: the emblem stitches in, the wordmark rises, then everything fades into the app. */
export function BrandSplash({ onDone }: { onDone: () => void }) {
  const fade = useSharedValue(1);
  const word = useSharedValue(0);
  useEffect(() => {
    word.set(withDelay(500, withTiming(1, { duration: 700 })));
    fade.set(withDelay(1900, withTiming(0, { duration: 550, easing: Easing.bezier(0.4, 0, 0.2, 1) })));
    const t = setTimeout(onDone, 2500);
    return () => clearTimeout(t);
  }, [fade, word, onDone]);
  const wrap = useAnimatedStyle(() => ({ opacity: fade.value }));
  const wordStyle = useAnimatedStyle(() => ({ opacity: word.value, transform: [{ translateY: (1 - word.value) * 10 }] }));
  return (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, s.splash, wrap]} accessibilityLabel="Opening SARPECH">
      <StitchingEmblem size={150} loop={false} />
      <Animated.View style={[{ alignItems: "center", marginTop: 22 }, wordStyle]}>
        <T style={{ fontFamily: F.display, fontSize: 28, letterSpacing: 9, color: C.gold }}>SARPECH</T>
        <T v="italic" style={{ color: "rgba(245,238,224,0.82)", marginTop: 6 }}>
          Crowned in Heritage
        </T>
      </Animated.View>
    </Animated.View>
  );
}

const s = StyleSheet.create({
  bar: { backgroundColor: C.green, flexDirection: "row", alignItems: "center", paddingHorizontal: 8, paddingBottom: 10, borderBottomWidth: 1, borderBottomColor: "rgba(201,160,74,0.3)" },
  side: { width: 64, flexDirection: "row", alignItems: "center" },
  title: { flex: 1, textAlign: "center", color: C.ivory, letterSpacing: 4 },
  iconBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  splash: { backgroundColor: C.green, alignItems: "center", justifyContent: "center", zIndex: 100 },
});
