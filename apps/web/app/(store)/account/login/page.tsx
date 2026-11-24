import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { LoginForm } from "@/components/account/AuthForms";
import { AuthShell } from "@/components/auth/AuthShell";
import { OrDivider } from "@/components/auth/fields";
import { currentCustomer } from "@sarpech/backend/customer-auth";
import { safeNextParam } from "../next-param";

export const metadata: Metadata = { title: "Sign in", robots: { index: false, follow: false } };

export default function LoginPage(props: PageProps<"/account/login">) {
  return (
    <AuthShell
      eyebrow="The Royal Court"
      motto="Welcome back"
      tagline="Your orders, saved addresses, wishlist and Royal Fit, ready on every device."
      title="Sign in"
      intro="Sign in to your SARPECH account."
    >
      <Suspense fallback={<div className="h-80" aria-busy="true" />}>
        <LoginContent {...props} />
      </Suspense>
    </AuthShell>
  );
}

async function LoginContent(props: PageProps<"/account/login">) {
  const next = safeNextParam((await props.searchParams).next);
  if (await currentCustomer()) redirect(next || "/account");
  return (
    <>
      <LoginForm next={next} />
      <OrDivider>New to SARPECH?</OrDivider>
      <Link href={next ? `/account/register?next=${encodeURIComponent(next)}` : "/account/register"} className="btn-outline min-h-[3.4rem] w-full">
        Create an account
      </Link>
      {next === "/checkout" && (
        <p className="mt-5 text-center text-base text-ink-soft">
          Or{" "}
          <Link href="/checkout" className="underline decoration-gold underline-offset-4">
            continue as a guest
          </Link>
        </p>
      )}
    </>
  );
}
