/** `?next=` value that is safe to redirect to after sign-in (same site, never admin); "" otherwise. */
export function safeNextParam(raw: string | string[] | undefined): string {
  const n = typeof raw === "string" ? raw : "";
  return n.startsWith("/") && !n.startsWith("//") && !n.startsWith("/admin") && !n.startsWith("/account/login") ? n.slice(0, 300) : "";
}
