import { router } from "expo-router";
import { FlatList, View, useWindowDimensions } from "react-native";
import { TopBar } from "@/components/layout";
import { ProductCard } from "@/components/ProductCard";
import { Btn, T } from "@/components/ui";
import { C } from "@/lib/theme";
import { useCatalog } from "@/state/catalog";
import { usePersonal } from "@/state/personal";

export default function Wishlist() {
  const { wishlist } = usePersonal();
  const { getProduct } = useCatalog();
  const { width } = useWindowDimensions();
  const items = wishlist.flatMap((s) => {
    const p = getProduct(s);
    return p ? [p] : [];
  });
  return (
    <View style={{ flex: 1, backgroundColor: C.white }}>
      <TopBar back title="Wishlist" />
      <FlatList
        data={items}
        keyExtractor={(p) => p.slug}
        numColumns={2}
        columnWrapperStyle={{ gap: 12, paddingHorizontal: 16 }}
        contentContainerStyle={{ gap: 12, paddingVertical: 16 }}
        renderItem={({ item }) => <ProductCard product={item} width={(width - 44) / 2} />}
        ListEmptyComponent={
          <View style={{ padding: 32, alignItems: "center" }}>
            <T v="title">Nothing set aside yet</T>
            <T v="small" style={{ textAlign: "center", marginTop: 6 }}>
              Tap the heart on any piece to keep it here.
            </T>
            <Btn onPress={() => router.push("/shop")} style={{ alignSelf: "stretch", marginTop: 18 }}>
              Explore the collection
            </Btn>
          </View>
        }
      />
    </View>
  );
}
