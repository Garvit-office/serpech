import type { Metadata } from "next";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/admin/ops/Skeleton";
import Link from "next/link";
import { LinkTabs } from "@/components/admin/ops/blocks";
import { EVENT_LABEL, EVENT_TONE, describeEvent, visitorLabel } from "@/components/admin/ops/describe";
import { count, dateLong, dateTime } from "@/components/admin/ops/format";
import { productNamer } from "@/components/admin/ops/names";
import { AdminHeader, Badge, Card, EmptyState, Pagination, Table, td, th } from "@/components/admin/ui";
import { TRACK_TYPES, auditEntities, listAudit, listEvents } from "@/lib/server/activity";
import { requireAdmin } from "@/lib/server/auth";
import type { TrackEventType } from "@/lib/types";

export const metadata: Metadata = { title: "Activity" };

const PAGE_SIZE = 50;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const str = (v: string | string[] | undefined) => (typeof v === "string" ? v : undefined);

/** IST calendar date → UTC ISO instant at IST midnight. */
const istMidnight = (d: string, plusDays = 0) => new Date(Date.parse(`${d}T00:00:00+05:30`) + plusDays * 864e5).toISOString();

export default function ActivityPage(props: PageProps<"/admin/activity">) {
  return (
    <Suspense fallback={<PageSkeleton title="Activity" />}>
      <ActivityPageContent {...props} />
    </Suspense>
  );
}

async function ActivityPageContent(props: PageProps<"/admin/activity">) {
  await requireAdmin();
  const sp = await props.searchParams;
  const tab = str(sp.tab) === "admin" ? "admin" : "store";
  const page = Math.max(1, Number.parseInt(str(sp.page) ?? "1", 10) || 1);

  return (
    <>
      <AdminHeader title="Activity" description="Everything visitors do on the store, and every change made in the admin." />
      <div className="mb-4">
        <LinkTabs
          label="Activity source"
          items={[
            { href: "/admin/activity", label: "Store activity", active: tab === "store" },
            { href: "/admin/activity?tab=admin", label: "Admin changes", active: tab === "admin" },
          ]}
        />
      </div>
      {tab === "store" ? <StoreActivity sp={sp} page={page} /> : <AdminActivity entity={str(sp.entity)} page={page} />}
    </>
  );
}

function StoreActivity({ sp, page }: { sp: Record<string, string | string[] | undefined>; page: number }) {
  const type = TRACK_TYPES.includes(str(sp.type) as TrackEventType) ? (str(sp.type) as TrackEventType) : undefined;
  const from = DATE.test(str(sp.from) ?? "") ? str(sp.from)! : "";
  const to = DATE.test(str(sp.to) ?? "") ? str(sp.to)! : "";
  const session = str(sp.session)?.slice(0, 64) || undefined;
  const nameOf = productNamer();

  const { total, events } = listEvents({
    type,
    sessionId: session,
    since: from ? istMidnight(from) : undefined,
    until: to ? istMidnight(to, 1) : undefined,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
    ascending: !!session, // a journey reads top-to-bottom in time order
  });

  const href = (patch: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const merged: Record<string, string | undefined> = { type, from: from || undefined, to: to || undefined, session, ...patch };
    for (const [k, v] of Object.entries(merged)) if (v) p.set(k, v);
    const s = p.toString();
    return s ? `/admin/activity?${s}` : "/admin/activity";
  };

  // journey summary for a single visitor
  const journey = session ? listEvents({ sessionId: session, limit: 1, ascending: true }) : null;
  const last = session ? listEvents({ sessionId: session, limit: 1 }).events[0] : null;
  const orders = session ? listEvents({ sessionId: session, type: "order_placed", limit: 20 }).events : [];

  return (
    <>
      {session && journey && (
        <Card title={`${visitorLabel(session)} · journey`} className="mb-4" actions={<Link href={href({ session: undefined, page: undefined })} className="link-thread text-sm">Back to all activity</Link>}>
          <dl className="grid grid-cols-2 gap-4 text-base sm:grid-cols-4">
            <div>
              <dt className="eyebrow text-[0.6rem] text-ink-soft">First seen</dt>
              <dd>{journey.events[0] ? dateLong(journey.events[0].ts) : "—"}</dd>
            </div>
            <div>
              <dt className="eyebrow text-[0.6rem] text-ink-soft">Last seen</dt>
              <dd>{last ? dateLong(last.ts) : "—"}</dd>
            </div>
            <div>
              <dt className="eyebrow text-[0.6rem] text-ink-soft">Events · device</dt>
              <dd>
                {count(journey.total)} · {last?.device ?? "unknown"}
              </dd>
            </div>
            <div>
              <dt className="eyebrow text-[0.6rem] text-ink-soft">Orders</dt>
              <dd>
                {orders.length
                  ? orders.map((o) => (
                      <Link key={o.id} href={`/admin/orders/${String(o.data?.orderId ?? "")}`} className="mr-2 underline decoration-gold underline-offset-2">
                        {String(o.data?.orderId ?? "")}
                      </Link>
                    ))
                  : "None"}
              </dd>
            </div>
          </dl>
          {journey.events[0]?.referrer && <p className="mt-3 text-sm text-ink-soft">Arrived from {journey.events[0].referrer}</p>}
        </Card>
      )}

      <form action="/admin/activity" className="mb-4 grid gap-3 border border-mist bg-white p-4 sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-end">
        {session && <input type="hidden" name="session" value={session} />}
        <div>
          <label htmlFor="act-type" className="field-label">
            Event
          </label>
          <select id="act-type" name="type" defaultValue={type ?? ""} className="field min-h-10 py-1.5">
            <option value="">All events</option>
            {TRACK_TYPES.map((t) => (
              <option key={t} value={t}>
                {EVENT_LABEL[t]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="act-from" className="field-label">
            From (IST)
          </label>
          <input id="act-from" type="date" name="from" defaultValue={from} className="field min-h-10 py-1.5" />
        </div>
        <div>
          <label htmlFor="act-to" className="field-label">
            To (IST)
          </label>
          <input id="act-to" type="date" name="to" defaultValue={to} className="field min-h-10 py-1.5" />
        </div>
        <div className="flex gap-2">
          <button type="submit" className="btn-royal min-h-10 flex-1 px-4 py-1.5">
            Filter
          </button>
          {(type || from || to) && (
            <Link href={href({ type: undefined, from: undefined, to: undefined, page: undefined })} className="btn-outline min-h-10 px-4 py-1.5">
              Reset
            </Link>
          )}
        </div>
      </form>

      <Card padded={false}>
        {events.length ? (
          <>
            <Table label="Store activity">
              <thead>
                <tr>
                  <th className={th}>Time (IST)</th>
                  <th className={th}>Event</th>
                  <th className={th}>Details</th>
                  <th className={th}>Page</th>
                  <th className={th}>Device</th>
                  {!session && <th className={th}>Visitor</th>}
                </tr>
              </thead>
              <tbody>
                {events.map((e) => (
                  <tr key={e.id} className="hover:bg-pearl">
                    <td className={`${td} whitespace-nowrap text-ink-soft`}>{dateTime(e.ts)}</td>
                    <td className={`${td} whitespace-nowrap`}>
                      <Badge tone={EVENT_TONE[e.type]}>{EVENT_LABEL[e.type]}</Badge>
                    </td>
                    <td className={td}>{describeEvent(e, nameOf, session ? "They" : "Someone")}</td>
                    <td className={`${td} max-w-56 truncate text-sm text-ink-soft`} title={e.path ?? ""}>
                      {e.path ?? "—"}
                    </td>
                    <td className={`${td} text-sm capitalize text-ink-soft`}>{e.device ?? "—"}</td>
                    {!session && (
                      <td className={td}>
                        {e.sessionId ? (
                          <Link href={href({ session: e.sessionId, page: undefined, type: undefined })} className="whitespace-nowrap text-sm underline decoration-gold underline-offset-2">
                            {visitorLabel(e.sessionId)}
                          </Link>
                        ) : (
                          "—"
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </Table>
            <Pagination page={page} pageSize={PAGE_SIZE} total={total} href={(p) => href({ page: p > 1 ? String(p) : undefined })} />
          </>
        ) : (
          <EmptyState title="No activity matches">Try a wider date range or another event type.</EmptyState>
        )}
      </Card>
    </>
  );
}

const ACTION_TONE: Record<string, "green" | "gold" | "ruby" | "grey" | "blue"> = {
  create: "green",
  update: "blue",
  delete: "ruby",
  status: "gold",
  login: "grey",
};

function AdminActivity({ entity, page }: { entity?: string; page: number }) {
  const entities = auditEntities();
  const valid = entity && entities.includes(entity) ? entity : undefined;
  const { total, entries } = listAudit({ entity: valid, limit: PAGE_SIZE, offset: (page - 1) * PAGE_SIZE });
  const href = (patch: { entity?: string; page?: string }) => {
    const p = new URLSearchParams({ tab: "admin" });
    const merged = { entity: valid, ...patch };
    if (merged.entity) p.set("entity", merged.entity);
    if (merged.page) p.set("page", merged.page);
    return `/admin/activity?${p}`;
  };
  return (
    <>
      {entities.length > 1 && (
        <div className="mb-4">
          <LinkTabs
            label="Filter by area"
            items={[
              { href: href({ entity: undefined }), label: "Everything", active: !valid },
              ...entities.map((e) => ({ href: href({ entity: e }), label: e, active: e === valid })),
            ]}
          />
        </div>
      )}
      <Card padded={false}>
        {entries.length ? (
          <>
            <Table label="Admin changes">
              <thead>
                <tr>
                  <th className={th}>Time (IST)</th>
                  <th className={th}>Admin</th>
                  <th className={th}>Action</th>
                  <th className={th}>Area</th>
                  <th className={th}>Summary</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((a) => (
                  <tr key={a.id} className="hover:bg-pearl">
                    <td className={`${td} whitespace-nowrap text-ink-soft`}>{dateTime(a.ts)}</td>
                    <td className={`${td} text-sm`}>{a.actor}</td>
                    <td className={`${td} whitespace-nowrap`}>
                      <Badge tone={ACTION_TONE[a.action] ?? "grey"}>{a.action}</Badge>
                    </td>
                    <td className={`${td} text-sm capitalize`}>{a.entity}</td>
                    <td className={td}>
                      {a.entity === "order" && a.entityId ? (
                        <Link href={`/admin/orders/${a.entityId}`} className="underline decoration-gold underline-offset-2">
                          {a.summary}
                        </Link>
                      ) : (
                        a.summary
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <Pagination page={page} pageSize={PAGE_SIZE} total={total} href={(p) => href({ page: p > 1 ? String(p) : undefined })} />
          </>
        ) : (
          <EmptyState title="No admin changes recorded yet" />
        )}
      </Card>
    </>
  );
}
