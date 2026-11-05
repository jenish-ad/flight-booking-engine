import { ApiError } from "@/lib/api/errors";
import { logIn } from "@/lib/auth/login";
import { isHttps } from "@/lib/auth/session";

export async function POST(request: Request) {
  const { email, password } = (await request.json().catch(() => ({}))) as { email?: string; password?: string };
  if (!email || !password) {
    return Response.json({ detail: "Enter your email and password." }, { status: 422 });
  }
  try {
    await logIn(email.trim(), password, isHttps(request));
    return Response.json({ ok: true });
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 500;
    const detail = error instanceof Error ? error.message : "Sign-in failed.";
    return Response.json({ detail }, { status });
  }
}
