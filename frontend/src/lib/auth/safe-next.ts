// Only allow redirects back into this site, never to another origin.
export function safeNext(next: string | string[] | null | undefined, fallback = "/") {
  const value = Array.isArray(next) ? next[0] : next;
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback;
  return value;
}
