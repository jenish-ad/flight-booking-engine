import "server-only";

import { cookies } from "next/headers";

import { ApiError } from "../api/errors";
import { BACKEND_URL } from "../config";
import { sessionCookie } from "./session";

export async function logIn(email: string, password: string, secure: boolean) {
  let response: Response;
  try {
    response = await fetch(`${BACKEND_URL}/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ username: email, password }),
      cache: "no-store",
    });
  } catch {
    throw new ApiError(
      503,
      "The booking service is not reachable. Check that the backend is running.",
    );
  }
  if (response.status === 401)
    throw new ApiError(401, "That email and password don't match an account.");
  if (!response.ok)
    throw new ApiError(
      response.status,
      "Sign-in failed. Try again in a moment.",
    );
  const { access_token } = (await response.json()) as { access_token: string };
  (await cookies()).set(sessionCookie(access_token, secure));
}
