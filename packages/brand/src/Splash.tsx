import { Jaali } from "./ornaments/Jaali";
import { BrandLoader } from "./BrandLoader";

/**
 * Opening splash with the SARPECH emblem, shown on the first page view of a
 * browser session. It is part of the server HTML and fades out by itself after
 * ~2 s (CSS only), so it never waits on JavaScript and never blocks taps
 * (pointer-events: none). Repeat views in the same session skip it: the inline
 * script marks <html data-splash="seen"> before the splash is painted.
 */
const SEEN = `try{var k="sp-splash";if(sessionStorage.getItem(k))document.documentElement.dataset.splash="seen";else sessionStorage.setItem(k,"1")}catch(e){}`;

export function Splash() {
  return (
    <>
      <script dangerouslySetInnerHTML={{ __html: SEEN }} />
      <div aria-hidden className="sp-splash on-dark grid place-items-center overflow-hidden bg-brand-green text-ivory">
        <Jaali opacity={0.04} />
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_45%,rgb(31_58_46/0.95),transparent_70%)]" />
        <div className="relative">
          <BrandLoader tone="dark" label="Opening SARPECH" />
          <p className="mt-4 animate-fade-up font-serif text-lg italic text-ivory/80 [animation-delay:700ms]">Crowned in Heritage</p>
        </div>
      </div>
    </>
  );
}
