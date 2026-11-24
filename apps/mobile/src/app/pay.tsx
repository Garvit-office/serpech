import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { View } from "react-native";
import { WebView, type WebViewMessageEvent } from "react-native-webview";
import { Loader, TopBar } from "@/components/layout";
import { Btn, Notice } from "@/components/ui";
import { ApiError, api } from "@/lib/api";
import { API_URL } from "@/lib/config";
import { C } from "@/lib/theme";
import { openAppLinks, parseMessage } from "@/lib/webview";
import { useCart } from "@/state/cart";

/**
 * Razorpay Checkout in a secure WebView (Razorpay's standard web checkout —
 * UPI, cards, net banking, wallets). The result is verified by the server
 * (/checkout/confirm); the Razorpay webhook confirms it too if the app closes.
 */
export default function Pay() {
  const p = useLocalSearchParams<{ orderId: string; total: string; keyId: string; rzpOrderId: string; amount: string; currency: string; name: string; email: string; phone: string }>();
  const cart = useCart();
  const [error, setError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [attempt, setAttempt] = useState(0);

  const options = {
    key: p.keyId,
    amount: Number(p.amount),
    currency: p.currency,
    order_id: p.rzpOrderId,
    name: "SARPECH",
    description: `Order ${p.orderId}`,
    prefill: { name: p.name, email: p.email, contact: p.phone },
    notes: { order_id: p.orderId },
    theme: { color: "#0E1A15" },
  };
  const html = `<!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><style>body{margin:0;background:#0E1A15}</style></head><body>
<script src="https://checkout.razorpay.com/v1/checkout.js"></script>
<script>
  var post = function (m) { window.ReactNativeWebView.postMessage(JSON.stringify(m)); };
  var o = ${JSON.stringify(options)};
  o.handler = function (r) { post({ type: "success", r: r }); };
  o.modal = { ondismiss: function () { post({ type: "dismiss" }); } };
  try { var rzp = new Razorpay(o); rzp.on("payment.failed", function (e) { post({ type: "failed", d: (e.error && e.error.description) || "" }); }); rzp.open(); }
  catch (e) { post({ type: "error" }); }
</script></body></html>`;

  const onMessage = async (e: WebViewMessageEvent) => {
    const m = parseMessage<{ type: string; r?: { razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }; d?: string }>(e.nativeEvent.data);
    if (!m) return;
    if (m.type === "success" && m.r) {
      setVerifying(true);
      try {
        await api("/checkout/confirm", { body: { orderId: p.orderId, razorpayOrderId: m.r.razorpay_order_id, paymentId: m.r.razorpay_payment_id, signature: m.r.razorpay_signature } });
        cart.clear();
        router.replace({ pathname: "/thanks", params: { orderId: p.orderId, total: p.total, paid: "1", email: p.email } });
      } catch (err) {
        setVerifying(false);
        setError(err instanceof ApiError ? err.message : "We couldn't confirm the payment.");
      }
    } else if (m.type === "dismiss") setError(`Payment wasn't completed. Order ${p.orderId} is held for 60 minutes — you can try again.`);
    else if (m.type === "failed") setError(`Payment failed${m.d ? `: ${m.d}` : ""}. You can try again.`);
    else setError("The payment window couldn't load. Check your connection and try again.");
  };

  if (verifying) return <Loader label="Confirming your payment" />;
  return (
    <View style={{ flex: 1, backgroundColor: C.green }}>
      <TopBar close title="Secure payment" />
      {error ? (
        <View style={{ padding: 16, backgroundColor: C.white, flex: 1 }}>
          <Notice tone="error">{error}</Notice>
          <Btn
            onPress={() => {
              setError(null);
              setAttempt((n) => n + 1);
            }}
          >
            Try again
          </Btn>
        </View>
      ) : (
        <WebView
          key={attempt}
          originWhitelist={["*"]}
          source={{ html, baseUrl: API_URL }}
          onMessage={onMessage}
          onShouldStartLoadWithRequest={openAppLinks}
          javaScriptEnabled
          style={{ flex: 1, backgroundColor: C.green }}
        />
      )}
    </View>
  );
}
