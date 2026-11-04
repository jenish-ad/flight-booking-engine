import Link from "next/link";

import Footer from "@/components/layout/footer";
import Logo from "@/components/layout/logo";

export default function NotFound() {
  return (
    <>
      {/* Plain header: reading the session here would make every page dynamic. */}
      <header className="mx-auto w-full max-w-295 px-[5%] py-5 xl:px-0">
        <Logo />
      </header>
      <main className="page grid content-center justify-items-start gap-5">
        <p className="font-serif text-7xl text-clay">404</p>
        <h1 className="page-title">This page isn&apos;t on the flight plan</h1>
        <p className="max-w-prose text-slate">The link may be old, or the booking may belong to another account.</p>
        <div className="flex flex-wrap gap-3">
          <Link href="/#search" className="btn btn-primary">Search flights</Link>
          <Link href="/trips" className="btn btn-secondary">My trips</Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
