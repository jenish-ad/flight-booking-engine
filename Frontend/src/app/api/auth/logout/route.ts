import { cookies } from "next/headers";

import { SESSION_COOKIE } from "@/lib/config";

// The backend has no token revocation, so signing out means forgetting the token here.
export async function POST() {
  (await cookies()).delete(SESSION_COOKIE);
  return Response.json({ ok: true });
}
