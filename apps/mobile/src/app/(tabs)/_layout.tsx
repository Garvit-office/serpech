import { Tabs } from "expo-router";
import { BagIcon, HomeIcon, ShopIcon, StudioIcon, UserIcon } from "@/components/Icons";
import { C, F } from "@/lib/theme";
import { useCart } from "@/state/cart";

export default function TabsLayout() {
  const { count } = useCart();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: C.goldLight,
        tabBarInactiveTintColor: "rgba(245,238,224,0.62)",
        tabBarStyle: { backgroundColor: C.green, borderTopColor: "rgba(201,160,74,0.35)" },
        tabBarLabelStyle: { fontFamily: F.display, fontSize: 9, letterSpacing: 1.2, textTransform: "uppercase" },
        tabBarBadgeStyle: { backgroundColor: C.ruby, color: C.white, fontSize: 10 },
      }}
    >
      <Tabs.Screen name="index" options={{ title: "Home", tabBarIcon: ({ color }) => <HomeIcon color={color} /> }} />
      <Tabs.Screen name="shop" options={{ title: "Shop", tabBarIcon: ({ color }) => <ShopIcon color={color} /> }} />
      <Tabs.Screen name="studio" options={{ title: "Studio", tabBarIcon: ({ color }) => <StudioIcon color={color} /> }} />
      <Tabs.Screen name="bag" options={{ title: "Bag", tabBarBadge: count || undefined, tabBarIcon: ({ color }) => <BagIcon color={color} /> }} />
      <Tabs.Screen name="account" options={{ title: "Account", tabBarIcon: ({ color }) => <UserIcon color={color} /> }} />
    </Tabs>
  );
}
