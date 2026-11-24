import Link from "next/link";
import { SarpechEmblem } from "@sarpech/brand/SarpechEmblem";
import { SectionDivider } from "@sarpech/brand/ornaments/SectionDivider";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <SarpechEmblem tone="green" ruby={false} className="mx-auto h-24 w-24 opacity-70" />
      <h1 className="mt-6 text-2xl sm:text-3xl">This chamber is empty</h1>
      <p className="mt-3 text-xl text-ink-soft">The page you seek is not in the palace.</p>
      <SectionDivider size="sm" className="mt-8" />
      <Link href="/" className="btn-royal mt-8">
        Return Home
      </Link>
    </div>
  );
}
