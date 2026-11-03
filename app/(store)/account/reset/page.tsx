import type { Metadata } from "next";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { ResetForm } from "@/components/account/AuthForms";
import { AuthShell } from "@/components/auth/AuthShell";
import { FormAlert } from "@/components/auth/fields";
import { resetTokenValid } from "@/lib/server/customers";

export const metadata: Metadata = { title: "Set a new password", robots: { index: false, follow: false } };

export default function ResetPage(props: PageProps<"/account/reset">) {
  return (
    <AuthShell eyebrow="The Royal Court" motto="A new key" title="Set a new password" intro="Choose a new password. Other devices will be signed out.">
      <Suspense fallback={<div className="h-64" aria-busy="true" />}>
        <ResetContent {...props} />
      </Suspense>
    </AuthShell>
  );
}

async function ResetContent(props: PageProps<"/account/reset">) {
  const raw = (await props.searchParams).token;
  const token = typeof raw === "string" ? raw.slice(0, 100) : "";
  await connection(); // token validity depends on the current time
  if (!token || !resetTokenValid(token)) {
    return (
      <>
        <FormAlert tone="error">This reset link has expired or was already used.</FormAlert>
        <Link href="/account/forgot" className="btn-royal min-h-[3.4rem] w-full">
          Request a new link
        </Link>
      </>
    );
  }
  return <ResetForm token={token} />;
}
