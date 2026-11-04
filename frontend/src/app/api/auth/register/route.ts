import { ApiError, errorMessage, readBody } from "@/lib/api/errors";
import { logIn } from "@/lib/auth/login";
import { isHttps } from "@/lib/auth/session";
import { BACKEND_URL } from "@/lib/config";

export async function POST(request: Request) {
  const { email, password } = (await request.json().catch(() => ({}))) as { email?: string; password?: string };
  if (!email || !password) {
    return Response.json({ detail: "Enter an email and a password." }, { status: 422 });
  }

  let response: Response;
  try {
    response = await fetch(`${BACKEND_URL}/register/`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: email.trim(), password }),
      cache: "no-store",
    });
  } catch {
    return Response.json({ detail: "The booking service is not reachable." }, { status: 503 });
  }
  if (!response.ok) {
    const body = await readBody(response);
    return Response.json({ detail: errorMessage(body, response.status) }, { status: response.status });
  }

  try {
    await logIn(email.trim(), password, isHttps(request));
  } catch (error) {
    const status = error instanceof ApiError ? error.status : 500;
    return Response.json({ detail: "Account created. Sign in to continue." }, { status });
  }
  return Response.json({ ok: true }, { status: 201 });
}
