import { useLocalSearchParams } from "expo-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { FlatList, ScrollView, TextInput, View, useWindowDimensions, type TextInputInstance } from "react-native";
import { searchIn } from "@sarpech/core/catalog";
import { SearchIcon } from "@/components/Icons";
import { Loader, TopBar } from "@/components/layout";
import { ProductCard } from "@/components/ProductCard";
import { Chip, T } from "@/components/ui";
import { C, F } from "@/lib/theme";
import { useCatalog } from "@/state/catalog";

type Sort = "featured" | "price-asc" | "price-desc";

export default function Shop() {
  const params = useLocalSearchParams<{ category?: string; focus?: string }>();
  const { data, refreshing, refresh } = useCatalog();
  const { width } = useWindowDimensions();
  const [category, setCategory] = useState<string | null>(params.category ?? null);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<Sort>("featured");
  const search = useRef<TextInputInstance>(null);

  // A new ?category= from another screen (e.g. Home) selects that category.
  const [seenParam, setSeenParam] = useState(params.category);
  if (params.category !== seenParam) {
    setSeenParam(params.category);
    if (params.category) setCategory(params.category);
  }
  useEffect(() => {
    if (params.focus === "search") setTimeout(() => search.current?.focus(), 350);
  }, [params.focus]);

  const list = useMemo(() => {
    if (!data) return [];
    let items = q.trim() ? searchIn(data.products, q, 60) : data.products;
    if (category) items = items.filter((p) => p.category === category);
    const price = (p: (typeof items)[number]) => p.salePrice ?? p.price;
    if (sort === "price-asc") items = [...items].sort((a, b) => price(a) - price(b));
    if (sort === "price-desc") items = [...items].sort((a, b) => price(b) - price(a));
    return items;
  }, [data, q, category, sort]);

  if (!data) return <Loader />;
  const cardW = (width - 16 * 2 - 12) / 2;
  const title = category ? data.categories.find((c) => c.slug === category)?.name ?? "Shop" : "Shop All";

  return (
    <View style={{ flex: 1, backgroundColor: C.white }}>
      <TopBar title={title} />
      <FlatList
        data={list}
        keyExtractor={(p) => p.slug}
        numColumns={2}
        columnWrapperStyle={{ gap: 12, paddingHorizontal: 16 }}
        contentContainerStyle={{ gap: 12, paddingBottom: 40 }}
        refreshing={refreshing}
        onRefresh={refresh}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View style={{ paddingTop: 14 }}>
            <View style={{ marginHorizontal: 16, flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#B9B4A6", paddingHorizontal: 12 }}>
              <SearchIcon size={20} color={C.inkSoft} />
              <TextInput
                ref={search}
                value={q}
                onChangeText={setQ}
                placeholder="Search sherwanis, kurtas, colours…"
                placeholderTextColor="#6B746F"
                returnKeyType="search"
                accessibilityLabel="Search the collection"
                style={{ flex: 1, minHeight: 46, marginLeft: 8, fontFamily: F.serif, fontSize: 18, color: C.green }}
              />
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingVertical: 12 }}>
              <Chip on={!category} onPress={() => setCategory(null)}>
                All
              </Chip>
              {data.categories.map((c) => (
                <Chip key={c.slug} on={category === c.slug} onPress={() => setCategory(c.slug)}>
                  {c.name}
                </Chip>
              ))}
            </ScrollView>
            <View style={{ flexDirection: "row", gap: 8, paddingHorizontal: 16, paddingBottom: 4, alignItems: "center" }}>
              <T v="small" style={{ flex: 1 }}>
                {list.length} {list.length === 1 ? "piece" : "pieces"}
              </T>
              {(["featured", "price-asc", "price-desc"] as Sort[]).map((k) => (
                <Chip key={k} on={sort === k} onPress={() => setSort(k)} style={{ minHeight: 34, paddingHorizontal: 10 }}>
                  {k === "featured" ? "Featured" : k === "price-asc" ? "₹ ↑" : "₹ ↓"}
                </Chip>
              ))}
            </View>
          </View>
        }
        ListEmptyComponent={
          <T v="small" style={{ textAlign: "center", padding: 32 }}>
            Nothing matches yet — try another word or category.
          </T>
        }
        renderItem={({ item }) => <ProductCard product={item} width={cardW} />}
      />
    </View>
  );
}
