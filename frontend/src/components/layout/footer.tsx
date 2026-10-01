import Logo from "./logo";

export default function Footer() {
  return (
    <footer className="flex flex-col items-center justify-between gap-2.5 border-t border-ink/12 px-[6%] py-7.5 text-center text-xs text-slate sm:flex-row sm:gap-6 sm:text-left">
      <Logo />
      <p>A simpler way to book flights.</p>
      <a href="#search">Search flights &#8599;</a>
    </footer>
  );
}
