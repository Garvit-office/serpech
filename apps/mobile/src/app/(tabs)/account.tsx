import { router, useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { StyleSheet, View } from "react-native";
import { designProduct } from "@sarpech/core/designer";
import { FIT_STYLES } from "@sarpech/core/fit";
import { formatINR } from "@sarpech/core/format";
import type { Order } from "@sarpech/core/types";
import { StitchingEmblem } from "@/components/Emblem";
import { HeartIcon, RulerIcon, StudioIcon } from "@/components/Icons";
import { Body, Rise, TopBar } from "@/components/layout";
import { ProductArt } from "@/components/ProductArt";
import { Btn, GoldRule, Hairline, T, Tap } from "@/components/ui";
import { api } from "@/lib/api";
import { STATUS_LABEL } from "@/lib/orders";
import { C } from "@/lib/theme";
import { useAccount } from "@/state/account";
import { useCatalog } from "@/state/catalog";
import { usePersonal } from "@/state/personal";

export default function Account() {
  const { customer, ready, signOut } = useAccount();
  const { wishlist, fit, designs } = usePersonal();
  const { getProduct } = useCatalog();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!customer) return setOrders(null);
    try {
      setOrders((await api<{ orders: Order[] }>("/orders")).orders);
    } catch {
      setOrders([]);
    }
  }, [customer]);
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  const links = (
    <View style={{ gap: 10, marginTop: 20 }}>
      <Row icon={<HeartIcon color={C.goldDark} />} title="Wishlist" sub={`${wishlist.length} saved ${wishlist.length === 1 ? "piece" : "pieces"}`} onPress={() => router.push("/wishlist")} />
      <Row icon={<RulerIcon color={C.goldDark} />} title="Royal Fit" sub={fit ? `${FIT_STYLES.find((f) => f.value === fit.preferences.fit)?.label} fit · saved` : "Measure once, see your size everywhere"} onPress={() => router.push("/royal-fit")} />
      <Row icon={<StudioIcon color={C.goldDark} />} title="Design Studio" sub={designs.length ? `${designs.length} saved ${designs.length === 1 ? "design" : "designs"}` : "Design your own piece"} onPress={() => router.push("/studio")} />
    </View>
  );

  if (!ready) return <View style={{ flex: 1, backgroundColor: C.white }} />;

  if (!customer) {
    return (
      <View style={{ flex: 1, backgroundColor: C.white }}>
        <TopBar title="Account" />
        <Body contentStyle={{ padding: 16 }}>
          <View style={{ alignItems: "center", paddingVertical: 18 }}>
            <StitchingEmblem size={90} loop={false} />
            <T v="display" style={{ marginTop: 14, fontSize: 22 }}>
              The Royal Court
            </T>
            <T v="small" style={{ textAlign: "center", marginTop: 6 }}>
              Sign in to track orders and keep your wishlist and Royal Fit on every device.
            </T>
          </View>
          <Btn onPress={() => router.push("/login")}>Sign in</Btn>
          <Btn kind="outline" onPress={() => router.push("/register")} style={{ marginTop: 10 }}>
            Create an account
          </Btn>
          {links}
        </Body>
      </View>
    );
  }

  const first = customer.name.split(" ")[0];
  return (
    <View style={{ flex: 1, backgroundColor: C.white }}>
      <TopBar title="Account" />
      <Body
        contentStyle={{ padding: 16 }}
        refreshing={refreshing}
        onRefresh={async () => {
          setRefreshing(true);
          await load();
          setRefreshing(false);
        }}
      >
        <T v="eyebrow">My account</T>
        <T v="display" style={{ marginTop: 6, fontSize: 24 }}>
          Namaste, {first}
        </T>
        <T v="small" style={{ marginTop: 4 }}>
          {customer.email}
        </T>
        <GoldRule />
        {links}
        <Row icon={<View style={{ width: 22 }} />} title="Addresses" sub={`${customer.addresses.length} saved`} onPress={() => router.push("/addresses")} />

        <T v="title" style={{ marginTop: 28 }}>
          Orders
        </T>
        <Hairline style={{ marginTop: 10 }} />
        {orders === null ? (
          <T v="small" style={{ paddingVertical: 16 }}>
            Loading your orders…
          </T>
        ) : orders.length === 0 ? (
          <View style={{ paddingVertical: 18 }}>
            <T v="small">No orders yet.</T>
          </View>
        ) : (
          orders.map((o, i) => {
            const first = o.items[0];
            const p = first ? (first.design ? designProduct(first.design) : getProduct(first.slug)) : undefined;
            return (
              <Rise key={o.id} i={i}>
                <Tap
                  onPress={() => router.push({ pathname: "/order/[id]", params: { id: o.id } })}
                  accessibilityRole="button"
                  accessibilityLabel={`Order ${o.id}, ${o.items.map((x) => x.name).join(", ")}, ${new Date(o.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}, ${STATUS_LABEL[o.status] ?? o.status}, ${formatINR(o.total)}`}
                  style={s.order}
                >
                  {p ? <ProductArt product={p} colorName={first?.color} style={{ width: 58, height: 70 }} /> : <View style={{ width: 58, height: 70, backgroundColor: C.pearl }} />}
                  <View style={{ flex: 1 }}>
                    <T v="label" style={{ fontSize: 10 }}>
                      {o.id}
                    </T>
                    <T numberOfLines={1}>{o.items.map((x) => x.name).join(", ")}</T>
                    <T v="small">
                      {new Date(o.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} · {STATUS_LABEL[o.status] ?? o.status}
                    </T>
                  </View>
                  <T v="price">{formatINR(o.total)}</T>
                </Tap>
              </Rise>
            );
          })
        )}
        <Btn kind="outline" onPress={() => void signOut()} style={{ marginTop: 28 }}>
          Sign out
        </Btn>
      </Body>
    </View>
  );
}

function Row({ icon, title, sub, onPress }: { icon: React.ReactNode; title: string; sub: string; onPress: () => void }) {
  return (
    <Tap onPress={onPress} accessibilityRole="button" accessibilityLabel={title} style={s.row}>
      {icon}
      <View style={{ flex: 1 }}>
        <T v="label">{title}</T>
        <T v="small">{sub}</T>
      </View>
      <T style={{ color: C.goldDark, fontSize: 20 }}>›</T>
    </Tap>
  );
}

const s = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 14, borderWidth: 1, borderColor: C.mist, padding: 14, backgroundColor: C.white, marginBottom: 0 },
  order: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: C.mist },
});
