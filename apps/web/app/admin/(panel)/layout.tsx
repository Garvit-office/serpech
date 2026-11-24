import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { BrandLoader } from "@sarpech/brand/BrandLoader";
import { requireAdmin } from "@sarpech/backend/auth";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · SARPECH Admin" },
  robots: { index: false, follow: false },
};

/** Auth gate: every panel page renders inside this, after the session is verified. */
async function Gate({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  return (
    <div className="flex min-h-dvh flex-col bg-[#F7F6F2] lg:flex-row">
      <AdminSidebar admin={admin} />
      <main id="admin-main" className="min-w-0 flex-1 px-4 py-6 sm:px-6 lg:px-10 lg:py-8">
        {children}
      </main>
    </div>
  );
}

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<BrandLoader label="Opening the atelier" className="min-h-dvh bg-[#F7F6F2]" />}>
      <Gate>{children}</Gate>
    </Suspense>
  );
}
