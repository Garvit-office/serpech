import type { Metadata } from "next";
import { Suspense } from "react";
import { PageSkeleton } from "@/components/admin/ops/Skeleton";
import { count, dateLong } from "@/components/admin/ops/format";
import { PruneForm, SettingsForm } from "@/components/admin/ops/SettingsForms";
import { AdminHeader, Badge, Card } from "@/components/admin/ui";
import { SESSION_TTL_SECONDS } from "@sarpech/backend/auth-token";
import { eventStats } from "@sarpech/backend/activity";
import { requireAdmin } from "@sarpech/backend/auth";
import { readSettings } from "@sarpech/backend/settings";

export const metadata: Metadata = { title: "Settings" };

function EnvRow({ name, set, note }: { name: string; set: boolean; note: string }) {
  return (
    <li className="flex items-start justify-between gap-3 py-2.5">
      <span>
        <code className="font-display text-xs tracking-[0.08em]">{name}</code>
        <span className="block text-sm text-ink-soft">{note}</span>
      </span>
      <Badge tone={set ? "green" : "gold"}>{set ? "Set" : "Not set"}</Badge>
    </li>
  );
}

export default function SettingsPage() {
  return (
    <Suspense fallback={<PageSkeleton title="Settings" />}>
      <SettingsPageContent />
    </Suspense>
  );
}

async function SettingsPageContent() {
  const admin = await requireAdmin();
  const settings = readSettings();
  const stats = eventStats();
  const prod = process.env.NODE_ENV === "production";
  const env = {
    email: !!process.env.ADMIN_EMAIL,
    password: !!process.env.ADMIN_PASSWORD,
    secret: (process.env.ADMIN_SECRET?.length ?? 0) >= 32,
  };
  const usingDefaults = !env.email || !env.password || !env.secret;

  return (
    <>
      <AdminHeader title="Settings" description="Store-wide settings. Changes apply to the storefront immediately." />
      <div className="grid gap-6 xl:grid-cols-[1.3fr_1fr] [&>*]:min-w-0">
        <Card title="Store">
          <SettingsForm settings={settings} />
        </Card>
        <div className="space-y-6">
          <Card title="Account">
            <p className="text-base">
              Signed in as <strong className="font-semibold">{admin}</strong>. Sessions last {SESSION_TTL_SECONDS / 3600} hours.
            </p>
            <p className="mt-3 text-base text-ink-soft">
              Admin credentials are not stored in the database. They come from environment variables on the server; change them there
              and restart to rotate the password. Changing <code>ADMIN_SECRET</code> signs everyone out.
            </p>
            <ul className="mt-3 divide-y divide-mist">
              <EnvRow name="ADMIN_EMAIL" set={env.email} note="Sign-in email" />
              <EnvRow name="ADMIN_PASSWORD" set={env.password} note="Sign-in password" />
              <EnvRow name="ADMIN_SECRET" set={env.secret} note="32+ random characters used to sign sessions" />
            </ul>
            {usingDefaults && (
              <p className="mt-3 border border-gold/60 bg-[#FBF6E6] px-3 py-2 text-sm">
                {prod
                  ? "Sign-in is disabled in production until all three variables are set."
                  : "Development defaults are in use. Set all three before deploying — production refuses to sign anyone in without them."}
              </p>
            )}
          </Card>
          <Card title="Activity data">
            <p className="text-base">
              {count(stats.n)} storefront events stored{stats.oldest ? `, the oldest from ${dateLong(stats.oldest)}` : ""}. Orders, customers and the
              admin change log are never deleted here.
            </p>
            <div className="mt-4">
              <PruneForm />
            </div>
          </Card>
        </div>
      </div>
    </>
  );
}
