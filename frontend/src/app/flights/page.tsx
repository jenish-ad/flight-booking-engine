import Link from "next/link";
import Footer from "../../components/layout/footer";
import Logo from "../../components/layout/logo";

export const metadata = { title: "Voyage | Flight results" };

// Placeholder until the page is wired to the backend flight search.
export default async function FlightsPage({ searchParams }: PageProps<"/flights">) {
  const { from, to, departure } = await searchParams;

  return (
    <>
      <header className="px-[6%] py-6">
        <Logo />
      </header>
      <main className="flex-1 px-[6%] py-10">
        <h1 className="font-serif text-[42px] leading-[1.1]">
          {from && to ? `${String(from).toUpperCase()} → ${String(to).toUpperCase()}` : "Flight results"}
        </h1>
        {departure && <p className="mt-2 text-slate">Departing {departure}</p>}
        <p className="mt-6 text-slate">Flight results are coming soon.</p>
        <Link className="text-link mt-6 inline-block" href="/#search">
          &larr; Change search
        </Link>
      </main> 
      <Footer />
    </>
  );
}
