import { Cinzel_400Regular, Cinzel_500Medium, Cinzel_600SemiBold, useFonts } from "@expo-google-fonts/cinzel";
import { CormorantGaramond_400Regular, CormorantGaramond_400Regular_Italic, CormorantGaramond_500Medium, CormorantGaramond_600SemiBold } from "@expo-google-fonts/cormorant-garamond";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useState } from "react";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { BrandSplash } from "@/components/layout";
import { C } from "@/lib/theme";
import { AccountProvider } from "@/state/account";
import { CartProvider } from "@/state/cart";
import { CatalogProvider } from "@/state/catalog";
import { PersonalProvider } from "@/state/personal";

// Keep the native splash (green with the gold emblem) up until the fonts are ready.
void SplashScreen.preventAutoHideAsync();
SplashScreen.setOptions({ duration: 300, fade: true });

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Cinzel_400Regular,
    Cinzel_500Medium,
    Cinzel_600SemiBold,
    CormorantGaramond_400Regular,
    CormorantGaramond_400Regular_Italic,
    CormorantGaramond_500Medium,
    CormorantGaramond_600SemiBold,
  });
  const [splashDone, setSplashDone] = useState(false);
  const done = useCallback(() => setSplashDone(true), []);

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hide();
  }, [fontsLoaded]);

  if (!fontsLoaded) return null;

  return (
    <SafeAreaProvider>
      <CatalogProvider>
        <AccountProvider>
          <PersonalProvider>
            <CartProvider>
              <StatusBar style="light" />
              <View style={{ flex: 1, backgroundColor: C.green }}>
                <Stack screenOptions={{ headerShown: false, animation: "slide_from_right", contentStyle: { backgroundColor: C.white } }}>
                  <Stack.Screen name="(tabs)" />
                  <Stack.Screen name="product/[slug]" />
                  <Stack.Screen name="checkout" options={{ animation: "slide_from_bottom" }} />
                  <Stack.Screen name="pay" options={{ presentation: "fullScreenModal", animation: "slide_from_bottom" }} />
                  <Stack.Screen name="login" options={{ presentation: "modal" }} />
                  <Stack.Screen name="register" options={{ presentation: "modal" }} />
                  <Stack.Screen name="forgot" options={{ presentation: "modal" }} />
                  <Stack.Screen name="royal-fit" options={{ presentation: "fullScreenModal", animation: "slide_from_bottom" }} />
                  <Stack.Screen name="thanks" options={{ gestureEnabled: false, animation: "fade" }} />
                  <Stack.Screen name="order/[id]" />
                  <Stack.Screen name="wishlist" />
                  <Stack.Screen name="addresses" />
                </Stack>
                {!splashDone && <BrandSplash onDone={done} />}
              </View>
            </CartProvider>
          </PersonalProvider>
        </AccountProvider>
      </CatalogProvider>
    </SafeAreaProvider>
  );
}
