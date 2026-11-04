import Link from "next/link";

import { getCurrentUser } from "@/lib/api/server";

import AccountMenu from "./account-menu";
import Logo from "./logo";

export default async function SiteHeader() {
  const user = await getCurrentUser().catch(() => null);
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-cream/92 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-295 items-center justify-between gap-4 px-[5%] py-4 xl:px-0">
        <Logo />
        <nav className="flex items-center gap-1 sm:gap-3">
          <Link href="/#search" className="btn btn-ghost hidden sm:inline-flex">
            Search flights
          </Link>
          {user && (
            <Link href="/trips" className="btn btn-ghost hidden sm:inline-flex">
              My trips
            </Link>
          )}
          {user?.is_admin && (
            <Link href="/admin" className="btn btn-ghost hidden md:inline-flex">
              Admin
            </Link>
          )}
          <AccountMenu user={user} />
        </nav>
      </div>
    </header>
  );
}
