import { getCurrentUser } from "@/lib/api/server";

export async function GET() {
  try {
    return Response.json({ user: await getCurrentUser() }, { headers: { "cache-control": "no-store" } });
  } catch {
    return Response.json({ user: null }, { headers: { "cache-control": "no-store" } });
  }
}
