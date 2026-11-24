import { router } from "expo-router";
import { ScrollView, StyleSheet, View, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { DESIGN_LOOKS } from "@sarpech/core/designer";
import { DesignArt } from "@/components/DesignArt";
import { StitchingEmblem } from "@/components/Emblem";
import { RulerIcon, SearchIcon } from "@/components/Icons";
import { Body, Loader, Rise } from "@/components/layout";
import { ProductCard } from "@/components/ProductCard";
import { Btn, GoldRule, Notice, T, Tap } from "@/components/ui";
import { C, F, shadow } from "@/lib/theme";
import { useCatalog } from "@/state/catalog";
import { usePersonal } from "@/state/personal";

export default function Home() {
  const { data, status, refreshing, refresh } = useCatalog();
  const { fit } = usePersonal();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  if (!data) return status === "offline" ? <Offline onRetry={refresh} /> : <Loader />;
  const best = data.products.filter((p) => p.tags.includes("bestseller")).slice(0, 10);
  const wedding = data.products.filter((p) => p.tags.includes("wedding-edit")).slice(0, 4);
  const cardW = Math.min(180, (width - 16 * 2 - 12) / 2);

  return (
    <Body refreshing={refreshing} onRefresh={refresh} style={{ backgroundColor: C.white }}>
      {/* Hero */}
      <View style={[s.hero, { paddingTop: insets.top + 12 }]}>
        <View style={s.heroTop}>
          <View style={{ width: 44 }} />
          <T style={s.wordmark}>SARPECH</T>
          <Tap onPress={() => router.push({ pathname: "/shop", params: { focus: "search" } })} accessibilityRole="button" accessibilityLabel="Search" style={s.searchBtn}>
            <SearchIcon color={C.ivory} />
          </Tap>
        </View>
        {data.settings.announcement ? <T style={s.announce}>{data.settings.announcement}</T> : null}
        <View style={s.heroFrame}>
          <StitchingEmblem size={96} />
          <T style={s.heroTitle}>Crowned in Heritage</T>
          <T v="small" style={{ color: "rgba(245,238,224,0.8)", textAlign: "center", marginTop: 6 }}>
            Royal Indian menswear, cut to your measure.
          </T>
          <View style={{ flexDirection: "row", gap: 10, marginTop: 18 }}>
            <Btn kind="gold" onPress={() => router.push("/shop")} style={{ flex: 1 }}>
              Shop the collection
            </Btn>
          </View>
        </View>
      </View>

      {status === "offline" && (
        <View style={{ padding: 16, paddingBottom: 0 }}>
          <Notice>You&apos;re offline — showing the last saved collection.</Notice>
        </View>
      )}

      {/* Categories */}
      <Rise style={s.section}>
        <T v="eyebrow">Shop by category</T>
        <GoldRule />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingTop: 14 }}>
          {data.categories.map((c) => (
            <Tap key={c.slug} onPress={() => router.push({ pathname: "/shop", params: { category: c.slug } })} accessibilityRole="button" style={s.cat}>
              <T v="label" style={{ fontSize: 10 }}>
                {c.name}
              </T>
            </Tap>
          ))}
        </ScrollView>
      </Rise>

      {/* Design Studio */}
      <Rise i={1} style={{ paddingHorizontal: 16 }}>
        <Tap onPress={() => router.push("/studio")} accessibilityRole="button" accessibilityLabel="Open the Design Studio" style={s.studio}>
          <View style={{ flex: 1, paddingRight: 8 }}>
            <T v="eyebrow" style={{ color: C.goldLight }}>
              New · Design Studio
            </T>
            <T style={{ fontFamily: F.display, fontSize: 20, letterSpacing: 2, color: C.ivory, marginTop: 6 }}>DESIGN YOUR OWN</T>
            <T v="small" style={{ color: "rgba(245,238,224,0.8)", marginTop: 6 }}>
              Shirts, polos, kurtas and sherwanis — your colours, weaves and zari, made to order.
            </T>
            <T v="label" style={{ color: C.goldLight, marginTop: 12 }}>
              Start designing →
            </T>
          </View>
          <View style={s.studioArt}>
            <DesignArt spec={DESIGN_LOOKS[1].spec} width={104} height={132} />
          </View>
        </Tap>
      </Rise>

      {/* Bestsellers */}
      {best.length > 0 && (
        <Rise i={2} style={s.section}>
          <View style={s.rowHead}>
            <View>
              <T v="eyebrow">Most loved</T>
              <T v="title" style={{ marginTop: 4 }}>
                Bestsellers
              </T>
            </View>
            <Tap onPress={() => router.push("/shop")} accessibilityRole="link">
              <T v="label" style={{ color: C.goldDark }}>
                View all
              </T>
            </Tap>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 12, paddingVertical: 12, paddingRight: 16 }}>
            {best.map((p) => (
              <ProductCard key={p.slug} product={p} width={cardW} />
            ))}
          </ScrollView>
        </Rise>
      )}

      {/* Royal Fit */}
      <Rise i={3} style={{ paddingHorizontal: 16 }}>
        <Tap onPress={() => router.push("/royal-fit")} accessibilityRole="button" style={s.fit}>
          <RulerIcon color={C.goldDark} size={26} />
          <View style={{ flex: 1 }}>
            <T v="title">{fit ? "Your Royal Fit" : "Find your Royal Fit"}</T>
            <T v="small">{fit ? "Saved — every piece shows your size." : "A 20-second camera Fit Check or a tape — then every piece shows your size."}</T>
          </View>
        </Tap>
      </Rise>

      {/* Wedding Edit */}
      {wedding.length > 0 && (
        <Rise i={4} style={s.section}>
          <T v="eyebrow">The Wedding Edit</T>
          <T v="title" style={{ marginTop: 4 }}>
            For the baraat, the pheras and the reception
          </T>
          <View style={s.grid}>
            {wedding.map((p) => (
              <ProductCard key={p.slug} product={p} width={(width - 16 * 2 - 12) / 2} />
            ))}
          </View>
        </Rise>
      )}
    </Body>
  );
}

function Offline({ onRetry }: { onRetry: () => void }) {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 32, backgroundColor: C.white }}>
      <StitchingEmblem size={80} loop={false} />
      <T v="title" style={{ marginTop: 18 }}>
        Can&apos;t reach SARPECH
      </T>
      <T v="small" style={{ textAlign: "center", marginTop: 6 }}>
        Check your connection, then try again.
      </T>
      <Btn onPress={onRetry} style={{ marginTop: 20, alignSelf: "stretch" }}>
        Try again
      </Btn>
    </View>
  );
}

const s = StyleSheet.create({
  hero: { backgroundColor: C.green, paddingHorizontal: 16, paddingBottom: 24 },
  heroTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  wordmark: { fontFamily: F.display, fontSize: 18, letterSpacing: 7, color: C.ivory },
  searchBtn: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  announce: { fontFamily: F.display, fontSize: 9, letterSpacing: 2, color: C.goldLight, textAlign: "center", textTransform: "uppercase", marginTop: 4 },
  heroFrame: { marginTop: 16, borderWidth: 1, borderColor: "rgba(201,160,74,0.45)", padding: 20, alignItems: "center" },
  heroTitle: { fontFamily: F.serifItalic, fontSize: 28, color: C.ivory, marginTop: 14 },
  section: { paddingHorizontal: 16, paddingTop: 26 },
  cat: { borderWidth: 1, borderColor: "rgba(201,160,74,0.6)", paddingHorizontal: 14, paddingVertical: 11, backgroundColor: C.pearl },
  studio: { marginTop: 26, backgroundColor: C.green2, padding: 18, flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "rgba(201,160,74,0.5)" },
  studioArt: { width: 116, height: 140, backgroundColor: "rgba(250,248,243,0.95)", alignItems: "center", justifyContent: "center" },
  rowHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  fit: { marginTop: 26, flexDirection: "row", gap: 14, alignItems: "center", borderWidth: 1, borderColor: "rgba(201,160,74,0.5)", backgroundColor: C.pearl, padding: 16, ...shadow, shadowOpacity: 0.05 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 14 },
});
