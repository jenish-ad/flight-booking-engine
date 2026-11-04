import "server-only";
import { cookies } from "next/headers";
import { cache } from "react";

import { BACKEND_URL, SESSION_COOKIE } from "../config";
import type { User } from "../types";
import { ApiError, errorMessage, readBody } from "./errors";

type Options = Omit<RequestInit, "body"> & { json?: unknown; auth?: boolean };

export async function backend<T>(
  path: string,
  { json, auth = true, headers, ...init }: Options = {},
): Promise<T> {
  const token = auth ? (await cookies()).get(SESSION_COOKIE)?.value : undefined;
  let response: Response;
  try {
    response = await fetch(`${BACKEND_URL}${path}`, {
      ...init,
      headers: {
        Accept: "application/json",
        ...(json !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: json !== undefined ? JSON.stringify(json) : undefined,
      cache: "no-store",
    });
  } catch {
    throw new ApiError(
      503,
      "The booking service is not reachable. Check that the backend is running.",
    );
  }
  const body = await readBody(response);
  if (!response.ok)
    throw new ApiError(response.status, errorMessage(body, response.status));
  return body as T;
}

export const getCurrentUser = cache(async (): Promise<User | null> => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    return await backend<User>("/users/me");
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) return null;
    throw error;
  }
});
