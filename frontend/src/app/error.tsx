"use client";

import Link from "next/link";
import { useEffect } from "react";

export default function ErrorPage({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="page grid content-center justify-items-start gap-5">
      <h1 className="page-title">Something went wrong on this page</h1>
      <p className="max-w-prose text-slate">
        Nothing was booked or cancelled. Try again, and if it keeps happening, check that the backend is running.
        {error.digest && <span className="block text-xs">Reference: {error.digest}</span>}
      </p>
      <div className="flex flex-wrap gap-3">
        <button type="button" className="btn btn-primary" onClick={() => retry()}>Try again</button>
        <Link href="/" className="btn btn-secondary">Go home</Link>
      </div>
    </main>
  );
}
