import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { PageLoader } from "@sarpech/brand/BrandLoader";
import { AddressBook, DeleteAccountForm, PasswordForm, ProfileForm, SignOutButton } from "@/components/account/AccountForms";
import { OrderList } from "@/components/account/OrderList";
import { ACCOUNT_TABS, AccountNav, Notice, Panel, orderDate, type AccountTab } from "@/components/account/shared";
import { SavedProfile, StartFitButton } from "@/components/fit/RoyalFitPageClient";
import { getAllProducts } from "@sarpech/backend/catalog";
import { formatINR } from "@sarpech/core/format";
import { requireCustomer } from "@sarpech/backend/customer-auth";
import { listOrdersForCustomer } from "@sarpech/backend/orders";

export const metadata: Metadata = { title: "My account", robots: { index: false, follow: false } };

export default function AccountPage(props: PageProps<"/account">) {
  return (
    <Suspense fallback={<PageLoader label="Opening your account" />}>
      <AccountContent {...props} />
    </Suspense>
  );
}

async function AccountContent(props: PageProps<"/account">) {
  const sp = await props.searchParams;
  const tab: AccountTab = ACCOUNT_TABS.some((t) => t.key === sp.tab) ? (sp.tab as AccountTab) : "overview";
  const c = await requireCustomer(tab === "overview" ? "/account" : `/account?tab=${tab}`);
  const [orders, products] = await Promise.all([Promise.resolve(listOrdersForCustomer(c.id, c.email)), getAllProducts()]);
  const bySlug = new Map(products.map((p) => [p.slug, p]));
  const live = orders.filter((o) => o.status !== "cancelled" && o.status !== "refunded");
  const spend = live.reduce((s, o) => s + o.total, 0);
  const firstName = c.name.split(" ")[0] || c.name;
  const defaultAddress = c.addresses.find((a) => a.isDefault) ?? c.addresses[0];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
      <header className="flex flex-col gap-4 border-b border-mist pb-8 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="eyebrow text-gold-dark">My account</p>
          <h1 className="mt-2 text-2xl tracking-[0.12em] sm:text-4xl">Namaste, {firstName}</h1>
          <p className="mt-2 text-lg text-ink-soft">
            {c.email} · member since {orderDate(c.createdAt)}
          </p>
        </div>
        <SignOutButton />
      </header>

      <div className="mt-6 grid gap-3">
        {sp.welcome === "1" && <Notice tone="green">Welcome to SARPECH, {firstName}. Your account is ready, and your wishlist and Royal Fit from this device are now saved to it.</Notice>}
        {sp.reset === "1" && <Notice tone="green">Your password has been changed and other devices have been signed out.</Notice>}
      </div>

      <div className="mt-8 grid grid-cols-[minmax(0,1fr)] gap-8 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-12">
        <AccountNav active={tab} />
        <div className="min-w-0 space-y-6">
          {tab === "overview" && (
            <>
              <div className="grid gap-4 sm:grid-cols-3">
                <Stat label="Orders" value={String(orders.length)} />
                <Stat label="Total spent" value={formatINR(spend)} />
                <Stat label="Saved addresses" value={String(c.addresses.length)} />
              </div>
              <Panel
                title="RECENT ORDERS"
                action={
                  orders.length > 3 ? (
                    <Link href="/account?tab=orders" className="link-thread font-display text-[0.62rem] uppercase tracking-[0.2em]">
                      All orders
                    </Link>
                  ) : null
                }
              >
                {orders.length ? <OrderList orders={orders.slice(0, 3)} products={bySlug} /> : <NoOrders />}
              </Panel>
              <div className="grid gap-6 md:grid-cols-2">
                <Panel
                  title="DEFAULT ADDRESS"
                  action={
                    <Link href="/account?tab=addresses" className="link-thread font-display text-[0.62rem] uppercase tracking-[0.2em]">
                      Manage
                    </Link>
                  }
                >
                  {defaultAddress ? (
                    <address className="text-lg not-italic leading-snug">
                      {defaultAddress.firstName} {defaultAddress.lastName}
                      <br />
                      {defaultAddress.line1}
                      <br />
                      {defaultAddress.city}, {defaultAddress.state} {defaultAddress.pin}
                    </address>
                  ) : (
                    <p className="text-lg text-ink-soft">None yet. Your first order&apos;s address is saved automatically.</p>
                  )}
                </Panel>
                <Panel
                  title="ROYAL FIT"
                  action={
                    <Link href="/account?tab=royal-fit" className="link-thread font-display text-[0.62rem] uppercase tracking-[0.2em]">
                      View
                    </Link>
                  }
                >
                  <p className="text-lg text-ink-soft">
                    {c.fitProfile
                      ? `Saved ${orderDate(c.fitProfile.updatedAt)}. Every product shows your recommended size, and made-to-measure pieces use these measurements.`
                      : "Measure once with your camera or a tape, and every product shows your size."}
                  </p>
                  <StartFitButton className="btn-outline mt-4 min-h-10 px-5" />
                </Panel>
              </div>
            </>
          )}

          {tab === "orders" && <Panel title="ORDERS">{orders.length ? <OrderList orders={orders} products={bySlug} /> : <NoOrders />}</Panel>}

          {tab === "royal-fit" && (
            <>
              <p className="max-w-2xl text-lg text-ink-soft">
                Your measurements and fit preferences. They&apos;re saved to your account, so they follow you to any device you sign in on.
              </p>
              <SavedProfile />
            </>
          )}

          {tab === "addresses" && (
            <Panel title="ADDRESS BOOK">
              <AddressBook initial={c.addresses} />
            </Panel>
          )}

          {tab === "profile" && (
            <Panel title="PERSONAL DETAILS">
              <ProfileForm name={c.name} email={c.email} phone={c.phone} marketing={c.marketing} />
            </Panel>
          )}

          {tab === "security" && (
            <>
              <Panel title="CHANGE PASSWORD">
                <PasswordForm />
              </Panel>
              <Panel title="SIGN OUT">
                <p className="mb-4 text-lg text-ink-soft">Sign out of this device. Changing your password signs out every other device.</p>
                <SignOutButton />
              </Panel>
              <DeleteAccountForm />
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-mist bg-white px-5 py-4">
      <p className="eyebrow text-[0.62rem] text-ink-soft">{label}</p>
      <p className="mt-1 font-display text-2xl tracking-[0.04em]">{value}</p>
    </div>
  );
}

function NoOrders() {
  return (
    <div className="py-6 text-center">
      <p className="text-xl">No orders yet.</p>
      <Link href="/shop" className="btn-royal mt-5 inline-flex min-h-11 px-8">
        Explore the collection
      </Link>
    </div>
  );
}
