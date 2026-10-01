import Logo from "./logo";

const links = [
  { href: "#search", label: "Flights" },
  { href: "#destinations", label: "Destinations" },
  { href: "#about", label: "Why Voyage" },
];

const panel =
  "rounded-xl border border-white/80 bg-[linear-gradient(180deg,#fffdf8f5,#fbf7eff0)] shadow-[inset_0_1px_0_#fff,inset_0_-1px_0_#e9e1d180,0_1px_2px_#243b4910,0_14px_34px_-20px_#243b4959] backdrop-blur-lg";

export default function Navbar() {
  return (
    <nav data-motion="nav" className="fixed inset-x-0 top-4 z-50 mx-auto flex w-[95%] items-stretch">
      <div className={`${panel} flex min-w-0 flex-1 items-center justify-between gap-3 px-5 py-2.5 sm:py-[11px] sm:pr-8.5 sm:pl-6.5`}>
        <Logo />
        <div className="flex flex-wrap justify-end gap-x-3 sm:gap-x-8.5">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="relative py-1.5 text-[11px] font-medium text-[#4a5668] transition-colors duration-250 after:absolute after:inset-x-0 after:bottom-0 after:h-[1.5px] after:origin-right after:scale-x-0 after:bg-current after:transition-transform after:duration-350 after:ease-out-expo hover:text-forest hover:after:origin-left hover:after:scale-x-100 focus-visible:text-forest focus-visible:after:origin-left focus-visible:after:scale-x-100 sm:text-sm motion-reduce:transition-none motion-reduce:after:transition-none"
            >
              {link.label}
            </a>
          ))}
        </div>
      </div>

      {/* Decorative "hinge" joining the two panels */}
      <span className="relative z-1 -mx-2 hidden w-5.5 flex-col justify-center gap-[5px] *:h-[3px] *:rounded-xs *:bg-[#1c302b] sm:flex" aria-hidden="true">
        <span />
        <span className="opacity-75" />
        <span />
      </span>

      <a href="#search" className={`${panel} group hidden items-center gap-3 pr-2 pl-6 text-sm font-semibold whitespace-nowrap text-forest transition-colors duration-250 hover:bg-[#f1efe6] sm:flex motion-reduce:transition-none`}>
        Book a flight
        <span className="grid size-8 place-items-center rounded-full bg-forest text-cream transition duration-300 ease-out-expo group-hover:translate-x-[3px] group-hover:-rotate-45 group-hover:bg-forest-dark motion-reduce:transition-none" aria-hidden="true">
          &rarr;
        </span>
      </a>
    </nav>
  );
}
