"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

// The home page is prerendered, so it asks who is signed in after it loads.
export default function NavAccountLink({ className }: { className: string }) {
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    let active = true;
    fetch("/api/auth/session", { cache: "no-store" })
      .then((response) => response.json())
      .then((body: { user: unknown }) => active && setSignedIn(Boolean(body.user)))
      .catch(() => active && setSignedIn(false));
    return () => {
      active = false;
    };
  }, []);

  if (signedIn === null) return null;
  return (
    <Link href={signedIn ? "/trips" : "/login"} className={className}>
      {signedIn ? "My trips" : "Sign in"}
    </Link>
  );
}
