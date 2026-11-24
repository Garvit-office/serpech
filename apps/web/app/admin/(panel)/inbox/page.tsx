import type { Metadata } from "next";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/admin/ops/Skeleton";
import { LinkTabs } from "@/components/admin/ops/blocks";
import { count, dateLong, timeAgo } from "@/components/admin/ops/format";
import { FittingStatusSelect, RemoveSubscriberButton } from "@/components/admin/ops/InboxControls";
import { AdminHeader, Badge, Card, EmptyState, Table, td, th } from "@/components/admin/ui";
import { requireAdmin } from "@sarpech/backend/auth";
import { listFittings, listSubscribers } from "@sarpech/backend/inbox";
import type { FittingStatus } from "@sarpech/core/types";

export const metadata: Metadata = { title: "Inbox" };

const TONE: Record<FittingStatus, "gold" | "blue" | "green" | "grey"> = { new: "gold", contacted: "blue", booked: "green", closed: "grey" };

function whatsapp(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return null;
  return `https://wa.me/${digits.length === 10 ? `91${digits}` : digits}`;
}

function requestedDate(d?: string) {
  if (!d || !/^\d{4}-\d{2}-\d{2}$/.test(d)) return d || "—";
  return new Date(`${d}T00:00:00Z`).toLocaleDateString("en-IN", { timeZone: "UTC", weekday: "short", day: "numeric", month: "short", year: "numeric" });
}

export default function InboxPage(props: PageProps<"/admin/inbox">) {
  return (
    <Suspense fallback={<PageSkeleton title="Inbox" />}>
      <InboxPageContent {...props} />
    </Suspense>
  );
}

async function InboxPageContent(props: PageProps<"/admin/inbox">) {
  await requireAdmin();
  const sp = await props.searchParams;
  const tab = sp.tab === "subscribers" ? "subscribers" : "fittings";
  const statusFilter = (["new", "contacted", "booked", "closed"] as const).find((s) => s === sp.status);
  const fittings = listFittings();
  const subscribers = listSubscribers();
  const newCount = fittings.filter((f) => f.status === "new").length;
  const shown = statusFilter ? fittings.filter((f) => f.status === statusFilter) : fittings;

  return (
    <>
      <AdminHeader
        title="Inbox"
        description="Fitting requests from the Contact page and newsletter sign-ups."
        actions={
          tab === "subscribers" && subscribers.length > 0 ? (
            <a href="/api/admin/export/subscribers" className="btn-outline min-h-10 px-5 py-2" download>
              Export CSV
            </a>
          ) : undefined
        }
      />
      <div className="mb-4">
        <LinkTabs
          label="Inbox section"
          items={[
            {
              href: "/admin/inbox",
              label: (
                <>
                  Fitting requests
                  {newCount > 0 && <span className="rounded-full bg-ruby px-1.5 text-[0.6rem] leading-4 text-white">{newCount} new</span>}
                </>
              ),
              active: tab === "fittings",
            },
            { href: "/admin/inbox?tab=subscribers", label: `Subscribers · ${count(subscribers.length)}`, active: tab === "subscribers" },
          ]}
        />
      </div>

      {tab === "fittings" ? (
        <>
          {fittings.length > 0 && (
            <div className="mb-4">
              <LinkTabs
                label="Filter by status"
                items={[
                  { href: "/admin/inbox", label: `All · ${fittings.length}`, active: !statusFilter },
                  ...(["new", "contacted", "booked", "closed"] as const).map((s) => ({
                    href: `/admin/inbox?status=${s}`,
                    label: `${s} · ${fittings.filter((f) => f.status === s).length}`,
                    active: s === statusFilter,
                  })),
                ]}
              />
            </div>
          )}
          {shown.length ? (
            <ul className="grid gap-4 lg:grid-cols-2 [&>*]:min-w-0">
              {shown.map((f) => {
                const d = f.data;
                const wa = d.phone ? whatsapp(d.phone) : null;
                return (
                  <li key={f.id}>
                    <Card>
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="flex flex-wrap items-center gap-2">
                            <span className="font-display text-sm tracking-[0.12em]">{d.name || "Unnamed"}</span>
                            <Badge tone={TONE[f.status]}>{f.status}</Badge>
                          </p>
                          <p className="mt-0.5 text-sm text-ink-soft">
                            Received {timeAgo(f.createdAt)} · {dateLong(f.createdAt)}
                          </p>
                        </div>
                        <FittingStatusSelect id={f.id} status={f.status} label={d.name || d.email || "request"} />
                      </div>
                      <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-2 text-base sm:grid-cols-2 [&>*]:min-w-0">
                        <div>
                          <dt className="eyebrow text-[0.6rem] text-ink-soft">Atelier</dt>
                          <dd>{d.atelier || "—"}</dd>
                        </div>
                        <div>
                          <dt className="eyebrow text-[0.6rem] text-ink-soft">Preferred date</dt>
                          <dd>{requestedDate(d.date)}</dd>
                        </div>
                        <div>
                          <dt className="eyebrow text-[0.6rem] text-ink-soft">Occasion</dt>
                          <dd>{d.occasion || "—"}</dd>
                        </div>
                        <div>
                          <dt className="eyebrow text-[0.6rem] text-ink-soft">Contact</dt>
                          <dd className="break-words">
                            {d.email || "—"}
                            {d.phone && <span className="block">{d.phone}</span>}
                          </dd>
                        </div>
                      </dl>
                      {d.message && <p className="mt-3 whitespace-pre-wrap border-l-2 border-gold pl-3 text-base italic">{d.message}</p>}
                      <p className="mt-4 flex flex-wrap gap-2">
                        {d.phone && (
                          <a href={`tel:${d.phone.replace(/\s/g, "")}`} className="btn-outline min-h-9 px-3 py-1">
                            Call
                          </a>
                        )}
                        {wa && (
                          <a href={wa} target="_blank" rel="noopener noreferrer" className="btn-outline min-h-9 px-3 py-1">
                            WhatsApp
                          </a>
                        )}
                        {d.email && (
                          <a
                            href={`mailto:${d.email}?subject=${encodeURIComponent("Your SARPECH fitting")}`}
                            className="btn-outline min-h-9 px-3 py-1"
                          >
                            Email
                          </a>
                        )}
                      </p>
                    </Card>
                  </li>
                );
              })}
            </ul>
          ) : (
            <Card>
              <EmptyState title={statusFilter ? `No ${statusFilter} requests` : "No fitting requests yet"}>Requests from the Book a Fitting form appear here.</EmptyState>
            </Card>
          )}
        </>
      ) : (
        <Card padded={false}>
          {subscribers.length ? (
            <Table label="Newsletter subscribers">
              <thead>
                <tr>
                  <th className={th}>Email</th>
                  <th className={th}>Subscribed</th>
                  <th className={th}>
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {subscribers.map((s) => (
                  <tr key={s.email} className="hover:bg-pearl">
                    <td className={td}>
                      <a href={`mailto:${s.email}`} className="hover:underline">
                        {s.email}
                      </a>
                    </td>
                    <td className={`${td} text-ink-soft`}>{dateLong(s.createdAt)}</td>
                    <td className={`${td} text-right`}>
                      <RemoveSubscriberButton email={s.email} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          ) : (
            <EmptyState title="No subscribers yet">Sign-ups from the home page newsletter form appear here.</EmptyState>
          )}
        </Card>
      )}
    </>
  );
}
