import Link from "next/link";

export default function Logo({ tone = "ink" }: { tone?: "ink" | "light" }) {
  return (
    <Link href="/" className={`font-serif text-[32px] leading-none font-semibold after:text-clay after:content-['.'] ${tone === "light" ? "text-cream" : "text-ink"}`}>
      Voyage
    </Link>
  );
}
