import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Admin sign in", robots: { index: false, follow: false } };

export default function AdminLoginPage() {
  return (
    <AuthShell
      variant="page"
      eyebrow="Atelier Admin"
      motto="Crowned in Heritage"
      tagline="Orders, pieces, customers and the day's activity, all in one quiet place."
      title="Welcome back"
      intro="Sign in to manage the SARPECH store."
      footer={
        <Link href="/" className="link-thread">
          ← Back to the store
        </Link>
      }
    >
      <Suspense fallback={<div className="h-72" aria-busy="true" />}>
        <LoginForm />
      </Suspense>
    </AuthShell>
  );
}
