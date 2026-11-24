import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { RegisterForm } from "@/components/account/AuthForms";
import { AuthShell } from "@/components/auth/AuthShell";
import { currentCustomer } from "@sarpech/backend/customer-auth";
import { safeNextParam } from "../next-param";

export const metadata: Metadata = { title: "Create an account", robots: { index: false, follow: false } };

export default function RegisterPage(props: PageProps<"/account/register">) {
  return (
    <AuthShell
      eyebrow="Join the Court"
      motto="Crowned in Heritage"
      title="Create an account"
      intro="Faster checkout and your pieces in one place."
      points={["Track every order", "Wishlist on all your devices", "Your Royal Fit, saved for made-to-measure", "Saved delivery addresses"]}
    >
      <Suspense fallback={<div className="h-[34rem]" aria-busy="true" />}>
        <RegisterContent {...props} />
      </Suspense>
    </AuthShell>
  );
}

async function RegisterContent(props: PageProps<"/account/register">) {
  const next = safeNextParam((await props.searchParams).next);
  if (await currentCustomer()) redirect(next || "/account");
  return (
    <>
      <RegisterForm next={next} />
      <p className="mt-8 border-t border-mist pt-6 text-base text-ink-soft">
        Already have an account?{" "}
        <Link href={next ? `/account/login?next=${encodeURIComponent(next)}` : "/account/login"} className="underline decoration-gold underline-offset-4">
          Sign in
        </Link>
      </p>
    </>
  );
}
