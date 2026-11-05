import { ApiError, errorMessage, readBody } from "./errors";
export { ApiError };
type Options = Omit<RequestInit, "body"> & { json?: unknown };

export async function api<T>(
  path: string,
  { json, headers, ...init }: Options = {},
): Promise<T> {
  const response = await fetch(`/api${path}`, {
    ...init,
    headers: {
      ...(json !== undefined ? { "Content-Type": "application/json" } : {}),
      ...headers,
    },
    body: json !== undefined ? JSON.stringify(json) : undefined,
    cache: "no-store",
  });
  const body = await readBody(response);
  if (!response.ok)
    throw new ApiError(response.status, errorMessage(body, response.status));
  return body as T;
}

export function loginUrl(
  next = window.location.pathname + window.location.search,
) {
  return `/login?next=${encodeURIComponent(next)}`;
}
