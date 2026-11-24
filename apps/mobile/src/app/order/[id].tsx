import { useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { designProduct, designSummary } from "@sarpech/core/designer";
import { formatINR } from "@sarpech/core/format";
import type { Order } from "@sarpech/core/types";
import { Body, Loader, TopBar } from "@/components/layout";
import { ProductArt } from "@/components/ProductArt";
import { Hairline, Notice, T } from "@/components/ui";
import { ApiError, api } from "@/lib/api";
import { C } from "@/lib/theme";
import { useCatalog } from "@/state/catalog";
import { STATUS_LABEL } from "@/lib/orders";

const STEPS = ["placed", "processing", "shipped", "delivered"] as const;
const STEP_OF: Record<string, number> = { placed: 0, paid: 0, processing: 1, shipped: 2, delivered: 3 };

export default function OrderScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getProduct } = useCatalog();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    api<{ order: Order }>(`/orders/${encodeURIComponent(id)}`)
      .then((r) => setOrder(r.order))
      .catch((e) => setError(e instanceof ApiError ? e.message : "Couldn't load this order."));
  }, [id]);

  if (error)
    return (
      <View style={{ flex: 1, backgroundColor: C.white }}>
        <TopBar back title="Order" />
        <View style={{ padding: 16 }}>
          <Notice tone="error">{error}</Notice>
        </View>
      </View>
    );
  if (!order) return <Loader label="Loading your order" />;
  const step = STEP_OF[order.status];
  const a = order.customer;
  return (
    <View style={{ flex: 1, backgroundColor: C.white }}>
      <TopBar back title={order.id} />
      <Body contentStyle={{ padding: 16 }}>
        <T v="eyebrow">{STATUS_LABEL[order.status]}</T>
        <T v="small">Placed {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" })}</T>
        {step !== undefined && (
          <View style={{ flexDirection: "row", gap: 6, marginTop: 14 }} accessibilityLabel={`Progress: ${STATUS_LABEL[order.status]}`}>
            {STEPS.map((s2, i) => (
              <View key={s2} style={{ flex: 1 }}>
                <View style={{ height: 3, backgroundColor: i <= step ? C.gold : C.mist }} />
                <T v="label" style={{ fontSize: 8, marginTop: 6, color: i <= step ? C.green : C.inkSoft }}>
                  {["Placed", "Prepared", "Shipped", "Delivered"][i]}
                </T>
              </View>
            ))}
          </View>
        )}
        <Hairline style={{ marginVertical: 16 }} />
        {order.items.map((i, n) => {
          const p = i.design ? designProduct(i.design) : getProduct(i.slug);
          return (
            <View key={`${i.slug}-${n}`} style={s.line}>
              {p ? <ProductArt product={p} colorName={i.color} style={{ width: 70, height: 86 }} /> : <View style={{ width: 70, height: 86, backgroundColor: C.pearl }} />}
              <View style={{ flex: 1 }}>
                <T v="label" style={{ fontSize: 10 }}>
                  {i.name}
                </T>
                <T v="small">
                  {i.design ? designSummary(i.design) : i.color} · {i.size} · qty {i.qty}
                </T>
              </View>
              <T v="price">{formatINR(i.unitPrice * i.qty)}</T>
            </View>
          );
        })}
        {(
          [
            ["Subtotal", formatINR(order.subtotal)],
            ...(order.discount ? [[`Coupon ${order.couponCode}`, `−${formatINR(order.discount)}`]] : []),
            ["Shipping", order.shipping ? formatINR(order.shipping) : "Complimentary"],
            ["Total", formatINR(order.total)],
          ] as [string, string][]
        ).map(([k, v]) => (
          <View key={k} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 }}>
            <T v={k === "Total" ? "title" : "body"}>{k}</T>
            <T v={k === "Total" ? "price" : "body"}>{v}</T>
          </View>
        ))}
        <Hairline style={{ marginVertical: 16 }} />
        <T v="title">Delivering to</T>
        <T style={{ marginTop: 6 }}>
          {a.firstName} {a.lastName}
          {"\n"}
          {a.line1}
          {a.line2 ? `\n${a.line2}` : ""}
          {"\n"}
          {a.city}, {a.state} {a.pin}
        </T>
      </Body>
    </View>
  );
}

const s = StyleSheet.create({ line: { flexDirection: "row", gap: 12, alignItems: "center", paddingVertical: 10 } });
