import "server-only";

/**
 * Outgoing email.
 *
 * With RESEND_API_KEY and MAIL_FROM set, mail is sent through Resend
 * (https://resend.com — verify your sending domain there first). Without them,
 * messages are written to the server log so development works offline.
 * Every caller goes through here; to use another provider, change only this file.
 *
 * Sending never throws: a mail failure must not break checkout or sign-up.
 */
export async function sendMail(msg: { to: string; subject: string; text: string; html?: string }): Promise<{ delivered: boolean }> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM;
  if (!key || !from) {
    console.info(`\n[mail] (not sent: RESEND_API_KEY / MAIL_FROM not set)\n[mail] to: ${msg.to}\n[mail] subject: ${msg.subject}\n${msg.text}\n`);
    return { delivered: false };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [msg.to],
        subject: msg.subject,
        text: msg.text,
        ...(msg.html ? { html: msg.html } : {}),
        ...(process.env.MAIL_REPLY_TO ? { reply_to: process.env.MAIL_REPLY_TO } : {}),
      }),
      signal: AbortSignal.timeout(10_000),
    });
    if (!res.ok) {
      console.error(`[mail] Resend rejected "${msg.subject}" to ${msg.to}: ${res.status} ${await res.text().catch(() => "")}`);
      return { delivered: false };
    }
    return { delivered: true };
  } catch (e) {
    console.error(`[mail] failed to send "${msg.subject}" to ${msg.to}:`, e);
    return { delivered: false };
  }
}

/** Absolute site URL for links in emails. */
export function siteUrl(fallbackHost?: string | null, proto?: string | null) {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? (fallbackHost ? `${proto ?? "http"}://${fallbackHost}` : "http://localhost:3000")).replace(/\/$/, "");
}
