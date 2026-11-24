import type { Metadata } from "next";
import { Suspense } from "react";
import { FitEmbed } from "./FitEmbed";

export const metadata: Metadata = { title: "Fit Check", robots: { index: false, follow: false } };

/**
 * Camera Fit Check for the SARPECH mobile app. The app opens this page in a
 * WebView (?height=&weight=&build=); the same MediaPipe engine as the website
 * measures in the phone's browser engine — no image leaves the device — and the
 * reading is posted back to the app. Not linked from the store.
 */
export default function FitEmbedPage() {
  return (
    <main className="min-h-dvh bg-brand-green text-ivory">
      <Suspense fallback={null}>
        <FitEmbed />
      </Suspense>
    </main>
  );
}
