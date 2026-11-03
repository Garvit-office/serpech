import type { Metadata } from "next";
import { Suspense } from "react";
import { AdminLoading } from "@/components/admin/catalog/Loading";
import Link from "next/link";
import { RowAction, SavedNotice } from "@/components/admin/catalog/buttons";
import { FilterBar, FilterSelect } from "@/components/admin/catalog/FilterBar";
import { AdminHeader, Badge, Card, EmptyState, LinkButton, Table, formatDate, td, th } from "@/components/admin/ui";
import { ProductImage } from "@/components/shop/ProductImage";
import { categories } from "@/data/categories";
import { LOW_STOCK, allSizesSoldOut, stockLeft } from "@/lib/catalog-shared";
import { formatINR } from "@/lib/format";
import { requireAdmin } from "@/lib/server/auth";
import { listProducts } from "@/lib/server/products";
import { applySales, liveSales } from "@/lib/server/sales";
import { deleteProductAction, duplicateProductAction, toggleProductStatusAction } from "./actions";

export const metadata: Metadata = { title: "Products" };

const SAVED: Record<string, string> = { created: "Product created.", updated: "Product saved. The store is updated." };

async function ProductsPageContent(props: PageProps<"/admin/products">) {
  await requireAdmin();
  const sp = await props.searchParams;
  const q = typeof sp.q === "string" ? sp.q.trim() : "";
  const cat = typeof sp.category === "string" ? sp.category : "";
  const status = typeof sp.status === "string" ? sp.status : "";
  const saved = typeof sp.saved === "string" ? SAVED[sp.saved] : undefined;

  const sales = liveSales();
  const all = listProducts({ includeDrafts: true });
  const rows = all
    .filter((p) => !cat || p.category === cat)
    .filter((p) => !status || p.status === status)
    .filter((p) => !q || `${p.name} ${p.slug} ${p.id} ${p.fabric}`.toLowerCase().includes(q.toLowerCase()))
    .map((p) => applySales(p, sales));
  const catName = (slug: string) => categories.find((c) => c.slug === slug)?.name ?? slug;
  const drafts = all.filter((p) => p.status === "draft").length;

  return (
    <>
      <AdminHeader
        title="Products"
        description={`${all.length} products · ${all.length - drafts} active · ${drafts} draft`}
        actions={<LinkButton href="/admin/products/new">Add product</LinkButton>}
      />
      {saved && <SavedNotice message={saved} />}
      <Card padded={false}>
        <FilterBar q={q} placeholder="Name, URL, ID or fabric" resetHref="/admin/products">
          <FilterSelect name="category" label="Category" value={cat} options={categories.map((c) => ({ value: c.slug, label: c.name }))} />
          <FilterSelect
            name="status"
            label="Status"
            value={status}
            options={[
              { value: "active", label: "Active" },
              { value: "draft", label: "Draft" },
            ]}
          />
        </FilterBar>
        {rows.length === 0 ? (
          <EmptyState title="No products match.">
            <Link href="/admin/products" className="underline underline-offset-4">
              Clear filters
            </Link>
          </EmptyState>
        ) : (
          <Table label="Products">
            <thead>
              <tr>
                <th className={th}>Product</th>
                <th className={th}>Category</th>
                <th className={`${th} text-right`}>Price</th>
                <th className={th}>Stock</th>
                <th className={th}>Status</th>
                <th className={th}>Updated</th>
                <th className={`${th} relative`}>
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id} className="hover:bg-pearl/60">
                  <td className={td}>
                    <div className="flex items-center gap-3">
                      <span className="block h-14 w-12 shrink-0 overflow-hidden bg-pearl">
                        <ProductImage product={p} sizes="48px" />
                      </span>
                      <span className="min-w-0">
                        <Link href={`/admin/products/${p.id}`} className="font-display text-[0.74rem] uppercase tracking-[0.12em] hover:underline">
                          {p.name}
                        </Link>
                        <span className="block text-sm text-ink-soft">
                          {p.id} · {p.colors.length} colour{p.colors.length === 1 ? "" : "s"} · {p.images?.length ?? 0} photo{p.images?.length === 1 ? "" : "s"}
                        </span>
                      </span>
                    </div>
                  </td>
                  <td className={td}>{catName(p.category)}</td>
                  <td className={`${td} whitespace-nowrap text-right`}>
                    {p.salePrice ? (
                      <>
                        <span className="text-ruby">{formatINR(p.salePrice)}</span>
                        <s className="ml-1.5 text-sm text-ink-soft">{formatINR(p.price)}</s>
                        <span className="mt-0.5 block">
                          <Badge tone="ruby">{p.saleLabel}</Badge>
                        </span>
                      </>
                    ) : (
                      formatINR(p.price)
                    )}
                  </td>
                  <td className={`${td} whitespace-nowrap`}>
                    <StockCell product={p} />
                  </td>
                  <td className={td}>
                    <Badge tone={p.status === "active" ? "green" : "grey"}>{p.status}</Badge>
                  </td>
                  <td className={`${td} whitespace-nowrap text-ink-soft`}>{formatDate(p.updatedAt)}</td>
                  <td className={td}>
                    <div className="flex flex-wrap justify-end gap-x-3 gap-y-1">
                      <Link href={`/admin/products/${p.id}`} className="text-[0.95rem] underline decoration-gold/60 underline-offset-4 hover:decoration-gold">
                        Edit
                      </Link>
                      {p.status === "active" && (
                        <Link href={`/product/${p.slug}`} target="_blank" className="text-[0.95rem] underline decoration-gold/60 underline-offset-4 hover:decoration-gold">
                          View ↗
                        </Link>
                      )}
                      <RowAction action={duplicateProductAction.bind(null, p.id)} label={`Duplicate ${p.name}`}>
                        Duplicate
                      </RowAction>
                      <RowAction action={toggleProductStatusAction.bind(null, p.id)} label={`${p.status === "active" ? "Unpublish" : "Publish"} ${p.name}`}>
                        {p.status === "active" ? "Unpublish" : "Publish"}
                      </RowAction>
                      <RowAction action={deleteProductAction.bind(null, p.id)} confirm={`Delete “${p.name}”? This cannot be undone.`} tone="danger" label={`Delete ${p.name}`}>
                        Delete
                      </RowAction>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>
    </>
  );
}

export default function ProductsPage(props: PageProps<"/admin/products">) {
  return (
    <Suspense fallback={<AdminLoading />}>
      <ProductsPageContent {...props} />
    </Suspense>
  );
}

function StockCell({ product: p }: { product: { sizes: string[]; stock?: Record<string, number> } }) {
  if (!p.stock) return <span className="text-ink-soft">Not tracked</span>;
  const tracked = p.sizes.filter((s) => stockLeft(p, s) !== null);
  const units = tracked.reduce((n, s) => n + (stockLeft(p, s) ?? 0), 0);
  const out = tracked.filter((s) => stockLeft(p, s) === 0);
  const low = tracked.filter((s) => (stockLeft(p, s) ?? 0) > 0 && (stockLeft(p, s) ?? 0) <= LOW_STOCK);
  return (
    <span title={tracked.map((s) => `${s}: ${stockLeft(p, s)}`).join(" · ")}>
      {units} unit{units === 1 ? "" : "s"}
      <span className="mt-0.5 flex flex-wrap gap-1">
        {allSizesSoldOut(p) ? (
          <Badge tone="ruby">Sold out</Badge>
        ) : (
          <>
            {out.length > 0 && <Badge tone="ruby">{out.length} size{out.length === 1 ? "" : "s"} out</Badge>}
            {low.length > 0 && <Badge tone="gold">{low.length} low</Badge>}
          </>
        )}
      </span>
    </span>
  );
}
