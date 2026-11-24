import type { Metadata } from "next";
import { DesignStudio } from "@/components/design/DesignStudio";
import { PageHeader } from "@/components/layout/PageHeader";

export const metadata: Metadata = {
  title: "Design Studio",
  description: "Design your own shirt, polo, kurta or sherwani — choose the fabric, pattern, collar, sleeves, buttons and zari, see it drawn live, and have it made to order by the SARPECH atelier.",
};

export default function DesignStudioPage() {
  return (
    <>
      <PageHeader
        tone="green"
        eyebrow="Design Studio"
        title="Design Your Own"
        intro="Choose a shirt, polo, kurta or sherwani. Pick the colours, the weave and the finishing touches. We cut and stitch it for you."
      />
      <DesignStudio />
    </>
  );
}
