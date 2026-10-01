import Link from "next/link";

export default function Logo() {
  return (
    <Link href="/" className="font-serif text-[32px] leading-none font-semibold text-ink after:text-clay after:content-['.']">
      Voyage
    </Link>
  );
}
