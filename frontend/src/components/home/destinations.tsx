import destinations from "../../../data/destination.json";

const fadeEdges = "pointer-events-none absolute inset-0 -z-1 mask-[linear-gradient(to_bottom,transparent,#000_22%,#000_78%,transparent)]";

export default function Destinations() {
  return (
    <section
      id="destinations"
      className="relative isolate bg-[linear-gradient(to_bottom,#faf9f6,#faf9f600_160px),radial-gradient(ellipse_at_100%_40%,#e4ece650,transparent_60%)] px-[6%] pt-6 pb-20"
    >
      {/* Decorative stripes and colour washes */}
      <div className={`${fadeEdges} bg-[repeating-linear-gradient(135deg,transparent_0_62px,#405f4f38_62px_63px,transparent_63px_69px,#405f4f20_69px_70px,transparent_70px_128px)]`} aria-hidden="true" />
      <div className={`${fadeEdges} bg-[radial-gradient(ellipse_at_8%_30%,#d9c5a650,transparent_48%),radial-gradient(ellipse_at_92%_75%,#a6bfae55,transparent_50%)]`} aria-hidden="true" />

      <p className="text-xs font-semibold text-sage uppercase">Destinations</p>
      <h2 className="mt-2.5 mb-7.5 font-serif text-[42px] leading-[1.1]">Find flights by destination.</h2>

      <div className="grid gap-5.5 sm:grid-cols-2 lg:grid-cols-4">
        {destinations.map((destination, index) => (
          <DestinationCard key={destination.city} number={index + 1} {...destination} />
        ))}
      </div>
    </section>
  );
}

type DestinationCardProps = (typeof destinations)[number] & { number: number };

function DestinationCard({ number, city, country, mood, detail, colors }: DestinationCardProps) {
  return (
    <article className="group overflow-clip rounded-[20px] border border-ink/6 bg-white shadow-[0_8px_28px_#243b4908] transition-[transform,box-shadow] duration-350 ease-in-out focus-within:shadow-[0_20px_40px_#243b491c] hover:shadow-[0_20px_40px_#243b491c] motion-safe:focus-within:-translate-y-[7px] motion-safe:hover:-translate-y-[7px] motion-reduce:transition-none">
      <div className={`relative h-45 overflow-hidden ${colors}`} aria-hidden="true">
        <span className="absolute top-4.5 left-4.5 text-[11px] font-medium tabular-nums">{String(number).padStart(2, "0")}</span>
        <svg className="size-full transition-transform duration-650 ease-out-expo motion-safe:group-hover:scale-[1.06] motion-reduce:transition-none" viewBox="0 0 300 180" preserveAspectRatio="xMidYMid slice">
          <circle cx="220" cy="55" r="32" fill="currentColor" opacity="0.45" />
          <path d="M0 145 Q80 45 160 145 T340 120 V180 H0Z" fill="currentColor" opacity="0.2" />
          <path d="M0 170 Q100 90 210 165 T340 145 V180 H0Z" fill="currentColor" opacity="0.35" />
        </svg>
        <span className="absolute bottom-4 left-4.5 rounded-[20px] bg-white/86 px-2.5 py-1.5 font-serif text-[11px] italic">{mood}</span>
      </div>
      <div className="p-5.5">
        <p className="text-[9px] font-semibold text-[#65716d] uppercase">{country}</p>
        <h3 className="my-3 font-serif text-[34px] leading-[1.1]">{city}</h3>
        <p className="min-h-16 text-sm leading-[1.6] text-slate">{detail}</p>
        <a className="text-link" href="#search">
          Find flights <span aria-hidden="true">&#8599;</span>
        </a>
      </div>
    </article>
  );
}
