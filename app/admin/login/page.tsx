import type { Metadata } from "next";
import { Suspense } from "react";
import { SarpechEmblem } from "@/components/brand/SarpechEmblem";
import { Jaali } from "@/components/ornaments/Jaali";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Admin sign in", robots: { index: false, follow: false } };

export default function AdminLoginPage() {
  return (
    <main className="on-dark relative grid min-h-dvh place-items-center overflow-hidden bg-brand-green px-4 py-12 text-ivory">
      <Jaali opacity={0.06} />
      <div className="relative w-full max-w-sm">
        <div className="text-center">
          <SarpechEmblem tone="gold" className="mx-auto h-20 w-20" />
          <h1 className="mt-4 text-xl tracking-[0.3em] text-ivory">SARPECH</h1>
          <p className="eyebrow mt-1 text-gold-light">Atelier Admin</p>
        </div>
        <div className="mt-8 border border-gold/40 bg-white p-6 text-brand-green shadow-lift sm:p-8">
          <Suspense>
            <LoginForm />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
