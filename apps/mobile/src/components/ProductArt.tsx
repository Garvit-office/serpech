import { Image } from "expo-image";
import { useState } from "react";
import { StyleSheet, View, type ImageStyle, type StyleProp, type ViewStyle } from "react-native";
import type { Product } from "@sarpech/core/types";
import { siteUrl } from "@/lib/config";
import { C } from "@/lib/theme";
import { DesignArt } from "./DesignArt";
import { Emblem } from "./Emblem";

/** Product imagery: photography when the product has it, the design drawing for Studio pieces, else a branded placeholder. */
export function ProductArt({ product, colorName, index = 0, style }: { product: Product; colorName?: string; index?: number; style?: StyleProp<ViewStyle> }) {
  const color = product.colors.find((c) => c.name === colorName) ?? product.colors[0];
  const photos = color?.images?.length ? color.images : (product.images ?? []);
  if (product.design) {
    return (
      <View style={[s.box, style]}>
        <DesignFill product={product} />
      </View>
    );
  }
  if (photos[index]) {
    return <Image source={{ uri: siteUrl(photos[index]) }} style={[s.box, style] as StyleProp<ImageStyle>} contentFit="cover" transition={250} accessibilityLabel={product.name} />;
  }
  return (
    <View style={[s.box, s.placeholder, style]} accessibilityLabel={`${product.name} — image coming soon`}>
      <View style={s.frame} />
      <View style={[s.swatch, { backgroundColor: color?.hex ?? C.ivory }]} />
      <Emblem size={34} tone="gold" />
    </View>
  );
}

/** Fits the 300×380 drawing inside whatever box it's given. */
function DesignFill({ product }: { product: Product }) {
  const [box, setBox] = useState<{ w: number; h: number } | null>(null);
  const scale = box ? Math.min((box.w - 8) / 300, (box.h - 8) / 380) : 0;
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }} onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
      {box && scale > 0 ? <DesignArt spec={product.design!} width={300 * scale} height={380 * scale} /> : null}
    </View>
  );
}

const s = StyleSheet.create({
  box: { backgroundColor: C.pearl, overflow: "hidden" },
  placeholder: { alignItems: "center", justifyContent: "center", gap: 10 },
  frame: { position: "absolute", top: 8, left: 8, right: 8, bottom: 8, borderWidth: 1, borderColor: "rgba(201,160,74,0.3)" },
  swatch: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, borderColor: "rgba(14,26,21,0.15)" },
});
