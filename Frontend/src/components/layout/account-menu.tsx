"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import type { User } from "@/lib/types";

export default function AccountMenu({ user }: { user: User | null }) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const menu = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const close = (event: MouseEvent | KeyboardEvent) => {
      if (event instanceof KeyboardEvent ? event.key === "Escape" : !menu.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", close);
    document.addEventListener("keydown", close);
    return () => {
      document.removeEventListener("mousedown", close);
      document.removeEventListener("keydown", close);
    };
  }, [open]);

  if (!user) {
    return (
      <Link href={`/login?next=${encodeURIComponent(pathname)}`} className="btn btn-secondary px-4 py-2">
        Sign in
      </Link>
    );
  }

  async function signOut() {
    setSigningOut(true);
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/");
    router.refresh();
  }

  return (
    <div ref={menu} className="relative">
      <button
        type="button"
        className="btn btn-secondary max-w-50 px-4 py-2"
        aria-expanded={open}
        aria-haspopup="menu"
        onClick={() => setOpen((value) => !value)}
      >
        <span className="truncate">{user.email}</span>
      </button>
      {open && (
        <div role="menu" className="panel absolute right-0 z-40 mt-2 grid w-56 gap-0.5 p-1.5 shadow-[0_18px_40px_-20px_#243b4973]">
          <Link role="menuitem" href="/trips" className="rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-mist" onClick={() => setOpen(false)}>
            My trips
          </Link>
          {user.is_admin && (
            <Link role="menuitem" href="/admin" className="rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-mist" onClick={() => setOpen(false)}>
              Admin
            </Link>
          )}
          <button
            role="menuitem"
            type="button"
            disabled={signingOut}
            onClick={signOut}
            className="cursor-pointer rounded-lg px-3 py-2.5 text-left text-sm font-medium text-danger hover:bg-danger-soft disabled:opacity-60"
          >
            {signingOut ? "Signing out…" : "Sign out"}
          </button>
        </div>
      )}
    </div>
  );
}
