import { router } from "expo-router";
import { StyleSheet, View } from "react-native";
import Animated, { FadeOut, LinearTransition } from "react-native-reanimated";
import { designSummary } from "@sarpech/core/designer";
import { formatINR } from "@sarpech/core/format";
import { StitchingEmblem } from "@/components/Emblem";
import { Body, TopBar } from "@/components/layout";
import { ProductArt } from "@/components/ProductArt";
import { Stepper } from "@/components/Stepper";
import { Btn, Hairline, T, Tap } from "@/components/ui";
import { C } from "@/lib/theme";
import { useCart } from "@/state/cart";
import { useCatalog } from "@/state/catalog";

export default function Bag() {
  const cart = useCart();
  const { data } = useCatalog();
  const threshold = data?.settings.freeShippingThreshold ?? 0;
  const toFree = threshold - cart.subtotal;

  if (!cart.items.length) {
    return (
      <View style={{ flex: 1, backgroundColor: C.white }}>
        <TopBar title="Your bag" />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32 }}>
          <StitchingEmblem size={84} loop={false} />
          <T v="title" style={{ marginTop: 18 }}>
            Your bag is empty
          </T>
          <T v="small" style={{ textAlign: "center", marginTop: 6 }}>
            Find a piece you love — or design your own in the Studio.
          </T>
          <Btn onPress={() => router.push("/shop")} style={{ alignSelf: "stretch", marginTop: 22 }}>
            Shop the collection
          </Btn>
          <Btn kind="outline" onPress={() => router.push("/studio")} style={{ alignSelf: "stretch", marginTop: 10 }}>
            Open the Design Studio
          </Btn>
        </View>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: C.white }}>
      <TopBar title={`Your bag · ${cart.count}`} />
      <Body contentStyle={{ padding: 16 }}>
        {threshold > 0 && (
          <T v="small" style={{ textAlign: "center", marginBottom: 12 }}>
            {toFree > 0 ? `Add ${formatINR(toFree)} more for complimentary shipping.` : "You've unlocked complimentary insured shipping."}
          </T>
        )}
        {cart.items.map((i) => (
          <Animated.View key={i.key} layout={LinearTransition} exiting={FadeOut.duration(200)} style={s.line}>
            <Tap onPress={() => (i.design ? router.push("/studio") : router.push({ pathname: "/product/[slug]", params: { slug: i.slug } }))} accessibilityLabel={i.product.name}>
              <ProductArt product={i.product} colorName={i.color} style={{ width: 92, height: 112 }} />
            </Tap>
            <View style={{ flex: 1 }}>
              <T v="label" style={{ fontSize: 10.5, lineHeight: 16 }} numberOfLines={2}>
                {i.product.name}
              </T>
              <T v="small" numberOfLines={2} style={{ marginTop: 2 }}>
                {i.design ? designSummary(i.design) : i.color} · {i.fit ? "Made to measure" : `Size ${i.size}`}
              </T>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
                <Stepper value={i.qty} onChange={(n) => cart.setQty(i.key, n)} />
                <T v="price">{formatINR(i.lineTotal)}</T>
              </View>
              <Tap onPress={() => cart.remove(i.key)} accessibilityRole="button" accessibilityLabel={`Remove ${i.product.name}`} style={{ alignSelf: "flex-start", paddingVertical: 8 }}>
                <T v="label" style={{ fontSize: 9.5, color: C.inkSoft }}>
                  Remove
                </T>
              </Tap>
            </View>
          </Animated.View>
        ))}
        <Hairline style={{ marginVertical: 16 }} />
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <T>Subtotal</T>
          <T v="price" style={{ fontSize: 17 }}>
            {formatINR(cart.subtotal)}
          </T>
        </View>
        <T v="small" style={{ marginTop: 4 }}>
          Shipping and any coupon are worked out at checkout.
        </T>
        <Btn onPress={() => router.push("/checkout")} style={{ marginTop: 18 }}>
          Checkout
        </Btn>
      </Body>
    </View>
  );
}

const s = StyleSheet.create({
  line: { flexDirection: "row", gap: 12, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.mist },
});
