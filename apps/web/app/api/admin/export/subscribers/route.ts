import { currentAdmin } from "@sarpech/backend/auth";
import { listSubscribers } from "@sarpech/backend/inbox";
import { csv } from "../csv";

export async function GET() {
  if (!(await currentAdmin())) return new Response("Unauthorized", { status: 401 });
  const body = csv(
    ["Email", "Subscribed (UTC)"],
    listSubscribers().map((s) => [s.email, s.createdAt]),
  );
  return new Response(body, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="sarpech-subscribers-${new Date().toISOString().slice(0, 10)}.csv"`,
      "cache-control": "no-store",
    },
  });
}
