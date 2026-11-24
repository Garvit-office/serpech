import { router, useLocalSearchParams } from "expo-router";
import { View } from "react-native";
import { formatINR } from "@sarpech/core/format";
import { StitchingEmblem } from "@/components/Emblem";
import { Btn, T } from "@/components/ui";
import { C } from "@/lib/theme";
import { useAccount } from "@/state/account";

export default function Thanks() {
  const { orderId, total, paid, email } = useLocalSearchParams<{ orderId: string; total: string; paid: string; email: string }>();
  const { customer } = useAccount();
  return (
    <View style={{ flex: 1, backgroundColor: C.white, alignItems: "center", justifyContent: "center", padding: 28 }}>
      <StitchingEmblem size={130} loop={false} />
      <T v="display" style={{ marginTop: 22 }}>
        Thank you
      </T>
      <T style={{ textAlign: "center", marginTop: 10 }}>
        {paid === "1" ? `Payment received. Order ${orderId} for ${formatINR(Number(total))} is confirmed.` : `Order ${orderId} for ${formatINR(Number(total))} is confirmed. Our team will contact you to arrange payment.`}
      </T>
      <T v="small" style={{ textAlign: "center", marginTop: 6 }}>
        A confirmation email is on its way to {email}.
      </T>
      {customer && (
        <Btn kind="outline" onPress={() => router.replace({ pathname: "/order/[id]", params: { id: orderId } })} style={{ alignSelf: "stretch", marginTop: 24 }}>
          View your order
        </Btn>
      )}
      <Btn onPress={() => router.replace("/")} style={{ alignSelf: "stretch", marginTop: 10 }}>
        Continue shopping
      </Btn>
    </View>
  );
}
