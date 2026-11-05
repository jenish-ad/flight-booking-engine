import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import Notice from "@/components/ui/notice";
import { ApiError } from "@/lib/api/errors";

export default function OrderError({ error, path }: { error: unknown; path: string }) {
  if (error instanceof ApiError && error.status === 401) redirect(`/login?next=${encodeURIComponent(path)}`);
  if (error instanceof ApiError && (error.status === 404 || error.status === 422)) notFound();
  return (
    <Notice tone="error" title="We couldn't load this booking" action={<Link href="/trips" className="btn btn-secondary">My trips</Link>}>
      {error instanceof Error ? error.message : "Try again in a moment."}
    </Notice>
  );
}
