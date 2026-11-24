import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SectionDivider } from "@sarpech/brand/ornaments/SectionDivider";
import { ProductCard } from "@/components/shop/ProductCard";
import { ProductDetail } from "@/components/shop/ProductDetail";
import { effectivePrice, getAllProducts, getCategory, getCompleteTheLook, getProduct } from "@sarpech/backend/catalog";
import { SITE } from "@sarpech/core/format";

export async function generateStaticParams() {
  return (await getAllProducts()).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata(props: PageProps<"/product/[slug]">): Promise<Metadata> {
  const { slug } = await props.params;
  const p = await getProduct(slug);
  if (!p) return {};
  return {
    title: p.name,
    description: `${p.description} ${p.fabric}.`,
    alternates: { canonical: `/product/${p.slug}` },
    openGraph: {
      title: `${p.name} · ${SITE.name}`,
      description: p.description,
      ...(p.images?.length ? { images: [{ url: p.images[0], alt: p.name }] } : {}),
    },
  };
}

// Resolve the product before streaming so unknown slugs get a real 404 status.
// Known products are prerendered (generateStaticParams), so this costs nothing for them.
export const instant = false;

export default async function ProductPage(props: PageProps<"/product/[slug]">) {
  const { slug } = await props.params;
  const product = await getProduct(slug);
  if (!product) notFound();
  const category = getCategory(product.category)!;
  const look = await getCompleteTheLook(product);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    sku: product.id,
    description: product.description,
    brand: { "@type": "Brand", name: SITE.name },
    material: product.fabric,
    color: product.colors.map((c) => c.name).join(", "),
    ...(product.images?.length ? { image: product.images.map((i) => `${SITE.url}${i}`) } : {}),
    offers: {
      "@type": "Offer",
      priceCurrency: "INR",
      price: effectivePrice(product),
      availability: "https://schema.org/InStock",
      url: `${SITE.url}/product/${product.slug}`,
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <div className="mx-auto max-w-7xl px-4 pb-20 pt-6 sm:px-6 lg:px-8">
        <nav aria-label="Breadcrumb" className="mb-6">
          <ol className="flex flex-wrap items-center gap-2 text-base text-ink-soft">
            <li>
              <Link href="/" className="link-thread">
                Home
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li>
              <Link href={`/shop/${category.slug}`} className="link-thread">
                {category.name}
              </Link>
            </li>
            <li aria-hidden>/</li>
            <li aria-current="page" className="text-brand-green">
              {product.name}
            </li>
          </ol>
        </nav>

        <ProductDetail product={product} categoryName={category.name} />

        {look.length > 0 && (
          <section aria-labelledby="look-title" className="mt-24">
            <div className="text-center">
              <p className="eyebrow text-ink-soft">Styled by the Atelier</p>
              <h2 id="look-title" className="mt-3 text-2xl sm:text-3xl">
                Complete the Look
              </h2>
              <SectionDivider size="sm" className="mt-6" />
            </div>
            <ul className="mt-10 grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 lg:grid-cols-4">
              {look.map((p) => (
                <li key={p.id}>
                  <ProductCard product={p} />
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </>
  );
}
