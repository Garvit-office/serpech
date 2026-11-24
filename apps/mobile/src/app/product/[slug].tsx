import { router, useLocalSearchParams } from "expo-router";
import { haptic } from "@/lib/haptics";
import { useMemo, useState } from "react";
import { ScrollView, StyleSheet, View, useWindowDimensions } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { LOW_STOCK, allSizesSoldOut, completeTheLook, stockLeft } from "@sarpech/core/catalog";
import { FIT_STYLES, MTM_SIZE, madeToMeasureAvailable, recommendSize, toSnapshot } from "@sarpech/core/fit";
import { formatINR } from "@sarpech/core/format";
import { HeartIcon } from "@/components/Icons";
import { Body, Loader, Rise, TopBar } from "@/components/layout";
import { ProductArt } from "@/components/ProductArt";
import { ProductCard } from "@/components/ProductCard";
import { Stepper } from "@/components/Stepper";
import { Btn, Chip, Hairline, Price, T, Tap } from "@/components/ui";
import { C } from "@/lib/theme";
import { useCart } from "@/state/cart";
import { useCatalog } from "@/state/catalog";
import { usePersonal } from "@/state/personal";

export default function ProductScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { data, getProduct } = useCatalog();
  const product = getProduct(slug);
  const cart = useCart();
  const { fit, isWished, toggleWish } = usePersonal();
  const { width } = useWindowDimensions();
  const [color, setColor] = useState<string | null>(null);
  const [size, setSize] = useState<string | null>(null);
  const [qty, setQty] = useState(1);
  const [photo, setPhoto] = useState(0);
  const [added, setAdded] = useState(false);
  const [needSize, setNeedSize] = useState(false);
  const look = useMemo(() => (product && data ? completeTheLook(data.products, product, 4) : []), [product, data]);

  if (!data) return <Loader />;
  if (!product) {
    return (
      <View style={{ flex: 1 }}>
        <TopBar back title="Not found" />
        <T style={{ padding: 24 }}>This piece is no longer available.</T>
      </View>
    );
  }

  const colorName = color ?? product.colors[0].name;
  const chosen = product.colors.find((c) => c.name === colorName);
  const photos = (chosen?.images?.length ? chosen.images : product.images) ?? [];
  const mtmOK = madeToMeasureAvailable(product);
  const advice = fit ? recommendSize(product, fit) : null;
  const isMtm = size === MTM_SIZE;
  const left = size && !isMtm ? stockLeft(product, size) : null;
  const soldOut = allSizesSoldOut(product) && !mtmOK;
  const unit = (product.salePrice ?? product.price) + (isMtm ? data.settings.madeToMeasureFee : 0);
  const wished = isWished(product.slug);

  const add = (thenCheckout: boolean) => {
    if (!size) {
      setNeedSize(true);
      haptic.warning();
      return;
    }
    if (isMtm && !fit) return router.push("/royal-fit");
    cart.add({ productId: product.id, slug: product.slug, size, color: colorName, qty, ...(isMtm && fit ? { fit: toSnapshot(fit) } : {}) });
    haptic.success();
    if (thenCheckout) return router.push("/checkout");
    setAdded(true);
    setTimeout(() => setAdded(false), 2600);
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.white }}>
      <TopBar
        back
        title={data.categories.find((c) => c.slug === product.category)?.name}
        right={
          <Tap onPress={() => toggleWish(product.slug)} haptic accessibilityLabel={wished ? "Remove from wishlist" : "Save to wishlist"} style={{ width: 44, height: 44, alignItems: "center", justifyContent: "center" }}>
            <HeartIcon color={wished ? C.goldLight : C.ivory} filled={wished} />
          </Tap>
        }
      />
      <Body>
        <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false} onMomentumScrollEnd={(e) => setPhoto(Math.round(e.nativeEvent.contentOffset.x / width))}>
          {(photos.length ? photos : [null]).map((_, i) => (
            <ProductArt key={i} product={product} colorName={colorName} index={i} style={{ width, height: width * 1.15 }} />
          ))}
        </ScrollView>
        {photos.length > 1 && (
          <View style={s.dots}>
            {photos.map((_, i) => (
              <View key={i} style={[s.dot, i === photo && { backgroundColor: C.gold, width: 16 }]} />
            ))}
          </View>
        )}

        <View style={{ padding: 16 }}>
          <Rise>
            <T v="display" style={{ fontSize: 21, lineHeight: 30 }}>
              {product.name}
            </T>
            <Price value={product.salePrice ?? product.price} was={product.salePrice ? product.price : undefined} style={{ marginTop: 8, fontSize: 17 }} />
            {product.saleLabel && <T style={{ color: C.ruby, marginTop: 2 }}>{product.saleLabel}</T>}
            <T v="small" style={{ marginTop: 10 }}>
              {product.fabric}
            </T>
          </Rise>

          <Hairline style={{ marginVertical: 18 }} />
          <T v="label">Colour · {colorName}</T>
          <View style={s.row}>
            {product.colors.map((c) => (
              <Tap key={c.name} onPress={() => setColor(c.name)} accessibilityLabel={c.name} accessibilityState={{ selected: c.name === colorName }} style={[s.swatchRing, c.name === colorName && { borderColor: C.green }]}>
                <View style={[s.swatch, { backgroundColor: c.hex }]} />
              </Tap>
            ))}
          </View>

          <T v="label" style={{ marginTop: 18 }}>
            Size{size ? ` · ${isMtm ? "Made to measure" : size}` : ""}
          </T>
          <View style={s.row}>
            {product.sizes.map((sz) => {
              const out = stockLeft(product, sz) === 0;
              const yours = advice?.size === sz;
              return (
                <Chip
                  key={sz}
                  on={size === sz}
                  onPress={() => {
                    if (out) return;
                    setSize(sz);
                    setNeedSize(false);
                    setQty(1);
                  }}
                  style={[out && { opacity: 0.4 }, yours && size !== sz && { borderColor: C.gold, borderWidth: 2 }]}
                >
                  <T v="label" style={[{ fontSize: 10.5 }, size === sz && { color: C.ivory }, out && { textDecorationLine: "line-through" }]}>
                    {sz}
                  </T>
                </Chip>
              );
            })}
            {mtmOK && (
              <Chip
                on={isMtm}
                onPress={() => {
                  setNeedSize(false);
                  if (!fit) router.push("/royal-fit");
                  else setSize(MTM_SIZE);
                }}
              >
                {`Made to measure +${formatINR(data.settings.madeToMeasureFee)}`}
              </Chip>
            )}
          </View>
          {needSize && <T style={{ color: C.ruby, marginTop: 6 }}>Please choose a size.</T>}
          {left !== null && left > 0 && left <= LOW_STOCK && <T style={{ color: C.ruby, marginTop: 6 }}>Only {left} left in size {size}.</T>}
          {soldOut && <T style={{ color: C.ruby, marginTop: 6 }}>Sold out in every size.</T>}

          <Tap onPress={() => router.push("/royal-fit")} style={s.fitBox} accessibilityRole="button">
            <T v="label" style={{ fontSize: 10 }}>
              {advice ? `Your Royal Fit${advice.size ? `: ${advice.size}` : ""}` : "Find your Royal Fit"}
            </T>
            <T v="small">
              {advice && fit
                ? `${FIT_STYLES.find((f) => f.value === fit.preferences.fit)?.label} fit · ${advice.reason}`
                : "Measure with your camera or a tape — then every piece shows your size."}
            </T>
          </Tap>

          <View style={{ flexDirection: "row", alignItems: "center", gap: 14, marginTop: 18 }}>
            <Stepper value={qty} onChange={setQty} max={left === null ? 10 : Math.max(1, Math.min(10, left))} />
            <T v="price" style={{ flex: 1, textAlign: "right", fontSize: 17 }}>
              {formatINR(unit * qty)}
            </T>
          </View>
          <View style={{ gap: 10, marginTop: 16 }}>
            <Btn onPress={() => add(false)} disabled={soldOut}>
              {soldOut ? "Sold out" : "Add to bag"}
            </Btn>
            <Btn kind="outline" onPress={() => add(true)} disabled={soldOut}>
              Buy now
            </Btn>
          </View>
          {added && (
            <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(250)} style={s.toast}>
              <T style={{ color: C.success }}>Added to your bag.</T>
              <Tap onPress={() => router.push("/bag")} accessibilityRole="link">
                <T v="label" style={{ color: C.success }}>
                  View bag →
                </T>
              </Tap>
            </Animated.View>
          )}

          <Hairline style={{ marginVertical: 22 }} />
          <T v="title">Details</T>
          <T style={{ marginTop: 8 }}>{product.description}</T>
          {product.details.map((d) => (
            <T key={d} v="small" style={{ marginTop: 6 }}>
              ◆ {d}
            </T>
          ))}
          {product.care.length > 0 && (
            <>
              <T v="title" style={{ marginTop: 20 }}>
                Care
              </T>
              {product.care.map((d) => (
                <T key={d} v="small" style={{ marginTop: 6 }}>
                  ◆ {d}
                </T>
              ))}
            </>
          )}
        </View>

        {look.length > 0 && (
          <View style={{ paddingLeft: 16, marginTop: 8 }}>
            <T v="eyebrow">Complete the look</T>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingVertical: 12, paddingRight: 16 }}>
              {look.map((p) => (
                <ProductCard key={p.slug} product={p} width={160} />
              ))}
            </ScrollView>
          </View>
        )}
      </Body>
    </View>
  );
}

const s = StyleSheet.create({
  dots: { flexDirection: "row", justifyContent: "center", gap: 6, marginTop: 10 },
  dot: { height: 6, width: 6, borderRadius: 3, backgroundColor: C.mist },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 10 },
  swatchRing: { width: 46, height: 46, borderRadius: 23, borderWidth: 1.5, borderColor: "transparent", alignItems: "center", justifyContent: "center" },
  swatch: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, borderColor: "rgba(14,26,21,0.18)" },
  fitBox: { marginTop: 16, borderWidth: 1, borderColor: "rgba(201,160,74,0.5)", backgroundColor: C.pearl, padding: 12, gap: 4 },
  toast: { marginTop: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: C.successBg, borderWidth: 1, borderColor: "rgba(31,91,69,0.35)", padding: 12 },
});
