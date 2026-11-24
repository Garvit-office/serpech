import { useEffect } from "react";
import { View } from "react-native";
import Animated, { Easing, useAnimatedProps, useAnimatedStyle, useSharedValue, withDelay, withRepeat, withSequence, withTiming, type SharedValue } from "react-native-reanimated";
import Svg, { Circle, Defs, Ellipse, G, LinearGradient, Path, Stop } from "react-native-svg";
import { CENTRE_STROKES, CENTRE_STROKE_SCALE, FINIAL_PATH, GOLD, GREEN, IVORY, MIRRORED_STROKES, PEARLS, RING, RUBY, RUBY_GLINT, RUBY_PATH, mirrored } from "@sarpech/brand/emblem-geometry";

/**
 * The official SARPECH emblem for the app — drawn from the same geometry as the
 * website's <SarpechEmblem/> (packages/brand). `progress` (0→1) stitches the
 * gold lines in, for the splash and loaders.
 */
const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const DASH = 320;
const RING_LEN = 2 * Math.PI * RING.r;

export function Emblem({ size = 64, tone = "gold", progress }: { size?: number; tone?: "gold" | "green" | "ivory"; progress?: SharedValue<number> }) {
  const paint = tone === "gold" ? "url(#embGold)" : tone === "green" ? GREEN : IVORY;
  const strokeProps = useAnimatedProps(() => ({ strokeDashoffset: progress ? DASH * (1 - progress.value) : 0 }));
  const ringProps = useAnimatedProps(() => ({ strokeDashoffset: progress ? RING_LEN * (1 - progress.value) : 0 }));
  const dash = progress ? { strokeDasharray: [DASH, DASH] } : {};
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      <Defs>
        <LinearGradient id="embGold" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={GOLD.light} />
          <Stop offset="0.5" stopColor={GOLD.mid} />
          <Stop offset="1" stopColor={GOLD.dark} />
        </LinearGradient>
      </Defs>
      <AnimatedCircle cx="100" cy="100" r={RING.r} fill="none" stroke={paint} strokeWidth={1} strokeDasharray={progress ? [RING_LEN, RING_LEN] : undefined} animatedProps={ringProps} />
      <Circle cx="100" cy="100" r={RING.inner} fill="none" stroke={paint} strokeWidth={0.4} strokeDasharray={[0.5, 2.5]} strokeLinecap="round" />
      <Path d={FINIAL_PATH} fill={paint} />
      <G fill="none" stroke={paint} strokeLinecap="round" strokeLinejoin="round">
        {CENTRE_STROKES.map((d, i) => (
          <AnimatedPath key={d} d={d} strokeWidth={1.5 * CENTRE_STROKE_SCALE[i]} {...dash} animatedProps={strokeProps} />
        ))}
        {MIRRORED_STROKES.map((d) => (
          <AnimatedPath key={d} d={d} strokeWidth={1.5} {...dash} animatedProps={strokeProps} />
        ))}
        <G transform="translate(200 0) scale(-1 1)">
          {MIRRORED_STROKES.map((d) => (
            <AnimatedPath key={d} d={d} strokeWidth={1.5} {...dash} animatedProps={strokeProps} />
          ))}
        </G>
      </G>
      <Path d={RUBY_PATH} fill={RUBY} stroke={paint} strokeWidth={1} />
      <Ellipse {...RUBY_GLINT} fill="#fff" opacity={0.45} />
      <G fill={paint}>
        {mirrored(PEARLS).map(([x, y, r]) => (
          <Circle key={`${x}-${y}`} cx={x} cy={y} r={r} />
        ))}
      </G>
    </Svg>
  );
}

/** Emblem that stitches itself in, then breathes — the app's loading state. */
export function StitchingEmblem({ size = 96, tone = "gold", loop = true }: { size?: number; tone?: "gold" | "green" | "ivory"; loop?: boolean }) {
  const p = useSharedValue(0);
  const breathe = useSharedValue(1);
  useEffect(() => {
    p.set(withTiming(1, { duration: 1500, easing: Easing.bezier(0.45, 0.05, 0.25, 1) }));
    if (loop) breathe.set(withDelay(1400, withRepeat(withSequence(withTiming(1.035, { duration: 1300 }), withTiming(1, { duration: 1300 })), -1)));
  }, [p, breathe, loop]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: breathe.value }] }));
  return (
    <Animated.View style={style}>
      <View>
        <Emblem size={size} tone={tone} progress={p} />
      </View>
    </Animated.View>
  );
}
