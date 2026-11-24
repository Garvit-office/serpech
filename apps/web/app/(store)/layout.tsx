import { Splash } from "@sarpech/brand/Splash";
import { RoyalFitWizard } from "@/components/fit/RoyalFitWizard";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";
import { PageViewTracker } from "@/components/layout/PageViewTracker";
import { getAllProducts, getStoreSettings } from "@sarpech/backend/catalog";
import { AccountProvider } from "@/lib/store/account";
import { CartProvider } from "@/lib/store/cart";
import { CatalogProvider } from "@/lib/store/catalog";
import { FitProvider } from "@/lib/store/fit";
import { WishlistProvider } from "@/lib/store/wishlist";

export default async function StoreLayout({ children }: LayoutProps<"/">) {
  const [products, settings] = await Promise.all([getAllProducts(), getStoreSettings()]);
  return (
    <CatalogProvider products={products} settings={settings}>
      <CartProvider>
        <WishlistProvider>
          <FitProvider>
            <AccountProvider>
              <Splash />
              <Header />
              <main id="main" className="flex-1">
                {children}
              </main>
              <Footer />
              <PageViewTracker />
              <RoyalFitWizard />
            </AccountProvider>
          </FitProvider>
        </WishlistProvider>
      </CartProvider>
    </CatalogProvider>
  );
}
