import { router } from "expo-router";
import { StyleSheet, View } from "react-native";
import { allSizesSoldOut } from "@sarpech/core/catalog";
import type { Product } from "@sarpech/core/types";
import { C, shadow } from "@/lib/theme";
import { usePersonal } from "@/state/personal";
import { HeartIcon } from "./Icons";
import { ProductArt } from "./ProductArt";
import { Price, T, Tap } from "./ui";

export function ProductCard({ product, width }: { product: Product; width: number }) {
  const { isWished, toggleWish } = usePersonal();
  const wished = isWished(product.slug);
  const soldOut = allSizesSoldOut(product);
  const badge = soldOut ? "Sold out" : product.salePrice ? product.saleLabel ?? "Sale" : product.tags[0] === "bestseller" ? "Bestseller" : product.tags[0] === "new" ? "New" : null;
  return (
    <Tap onPress={() => router.push({ pathname: "/product/[slug]", params: { slug: product.slug } })} accessibilityRole="button" accessibilityLabel={product.name} style={[s.card, { width }]}>
      <ProductArt product={product} style={{ width, height: width * 1.2 }} />
      {badge && (
        <View style={[s.badge, product.salePrice && !soldOut ? { backgroundColor: C.ruby } : soldOut ? { backgroundColor: C.green } : null]}>
          <T style={[s.badgeText, product.salePrice || soldOut ? { color: C.white } : null]}>{badge}</T>
        </View>
      )}
      <Tap onPress={() => toggleWish(product.slug)} haptic accessibilityRole="button" accessibilityLabel={wished ? `Remove ${product.name} from wishlist` : `Save ${product.name} to wishlist`} style={s.heart}>
        <HeartIcon color={wished ? C.ruby : C.green} filled={wished} size={20} />
      </Tap>
      <View style={{ padding: 10 }}>
        <T v="label" numberOfLines={2} style={{ fontSize: 10, lineHeight: 15 }}>
          {product.name}
        </T>
        <Price value={product.salePrice ?? product.price} was={product.salePrice ? product.price : undefined} style={{ marginTop: 4, fontSize: 13 }} />
      </View>
    </Tap>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: C.white, ...shadow },
  badge: { position: "absolute", left: 8, top: 8, backgroundColor: "rgba(255,255,255,0.92)", paddingHorizontal: 6, paddingVertical: 2 },
  badgeText: { fontFamily: "Cinzel_500Medium", fontSize: 8.5, letterSpacing: 1.6, textTransform: "uppercase", color: C.green },
  heart: { position: "absolute", right: 6, top: 6, width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.9)", alignItems: "center", justifyContent: "center" },
});
