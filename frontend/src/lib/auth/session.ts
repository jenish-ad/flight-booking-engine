import { DEFAULT_SESSION_SECONDS, SESSION_COOKIE } from "../config";

export function tokenLifetime(token: string): number {
  try {
    const payload = JSON.parse(
      Buffer.from(token.split(".")[1], "base64url").toString("utf8"),
    );
    const seconds = Math.floor(payload.exp - Date.now() / 1000);
    return Number.isFinite(seconds) && seconds > 0
      ? seconds
      : DEFAULT_SESSION_SECONDS;
  } catch {
    return DEFAULT_SESSION_SECONDS;
  }
}

export function isHttps(request: Request) {
  const forwarded = request.headers
    .get("x-forwarded-proto")
    ?.split(",")[0]
    ?.trim();
  return (
    (forwarded ?? new URL(request.url).protocol.replace(":", "")) === "https"
  );
}

export function sessionCookie(token: string, secure: boolean) {
  return {
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: "lax" as const,
    secure,
    path: "/",
    maxAge: tokenLifetime(token),
  };
}
