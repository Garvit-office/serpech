import type { Metadata } from "next";
import Link from "next/link";
import { ForgotForm } from "@/components/account/AuthForms";
import { AuthShell } from "@/components/auth/AuthShell";

export const metadata: Metadata = { title: "Forgot password", robots: { index: false, follow: false } };

export default function ForgotPage() {
  return (
    <AuthShell
      eyebrow="The Royal Court"
      motto="A new key"
      title="Forgot password"
      intro="Enter the email on your account and we'll send a link to set a new password. It works once and expires in one hour."
      footer={
        <>
          Remembered it?{" "}
          <Link href="/account/login" className="underline decoration-gold underline-offset-4">
            Sign in
          </Link>
        </>
      }
    >
      <ForgotForm devHint={process.env.NODE_ENV !== "production"} />
    </AuthShell>
  );
}
