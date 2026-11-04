type ValidationIssue = { loc?: (string | number)[]; msg?: string };

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

function describeIssue(issue: ValidationIssue) {
  const field = issue.loc?.filter((part) => part !== "body").join(" › ");
  const message = (issue.msg ?? "Invalid value").replace(/^Value error, /, "");
  return field ? `${field}: ${message}` : message;
}

export function errorMessage(body: unknown, status: number): string {
  const detail = (body as { detail?: unknown } | null)?.detail;
  if (typeof detail === "string" && detail) return detail;
  if (Array.isArray(detail) && detail.length)
    return detail.map(describeIssue).join("\n");
  if (status === 401)
    return "Your session has ended. Sign in again to continue.";
  if (status >= 500)
    return "The booking service is not responding. Try again in a moment.";
  return `Request failed (${status}).`;
}

export async function readBody(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { detail: text };
  }
}
