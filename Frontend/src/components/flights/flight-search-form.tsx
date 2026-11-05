import { CABIN_LABELS } from "@/lib/format";

import AirportField from "./airport-field";
import DateFields from "./date-fields";

export interface SearchDefaults {
  from?: string;
  to?: string;
  departure?: string;
  adults?: number;
  cabin?: string;
}

const corners = "[&>label:first-child]:rounded-tl-2xl max-md:[&>label:nth-child(2)]:rounded-tr-2xl ";

const hero =
  corners + "absolute inset-x-[5%] bottom-5 z-4 grid grid-cols-2 rounded-2xl border border-line bg-paper shadow-[0_18px_40px_-26px_#243b4973] sm:inset-x-[6%] sm:bottom-10.5 md:grid-cols-[1.2fr_1.2fr_1fr_1fr_0.9fr_auto] max-md:[&>label:nth-child(even)]:border-l max-md:[&>label:nth-child(n+3)]:border-t md:[&>label+label]:border-l";

const inline =
  corners + "relative grid grid-cols-2 rounded-2xl border border-line bg-paper md:grid-cols-[1.2fr_1.2fr_1fr_1fr_0.9fr_auto] max-md:[&>label:nth-child(even)]:border-l max-md:[&>label:nth-child(n+3)]:border-t md:[&>label+label]:border-l";

export default function FlightSearchForm({
  variant = "hero",
  defaults = {},
}: {
  variant?: "hero" | "inline";
  defaults?: SearchDefaults;
}) {
  return (
    <form
      id={variant === "hero" ? "search" : undefined}
      data-motion={variant === "hero" ? "search" : undefined}
      action="/flights"
      className={variant === "hero" ? hero : inline}
    >
      <AirportField label="From" name="from" defaultCode={defaults.from} dropUp={variant === "hero"} />
      <AirportField label="To" name="to" defaultCode={defaults.to} dropUp={variant === "hero"} />

      <DateFields defaultValue={defaults.departure} />

      <label className="search-field search-select-field">
        Cabin
        <select className="search-input search-select" name="cabin" defaultValue={defaults.cabin ?? "economy"}>
          {Object.entries(CABIN_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </select>
      </label>

      <label className="search-field search-select-field">
        Travelers
        <select className="search-input search-select" name="adults" defaultValue={String(defaults.adults ?? 1)}>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((count) => (
            <option key={count} value={count}>
              {count} {count === 1 ? "adult" : "adults"}
            </option>
          ))}
        </select>
      </label>

      <button
        type="submit"
        className="group col-span-full flex cursor-pointer items-center justify-center gap-2.5 rounded-b-2xl border-t border-dashed border-line-dashed bg-forest p-4 text-sm font-semibold whitespace-nowrap text-cream transition-colors duration-250 hover:bg-forest-dark focus-visible:outline-2 focus-visible:-outline-offset-6 focus-visible:outline-cream md:col-span-1 md:rounded-l-none md:rounded-r-2xl md:border-t-0 md:border-l md:px-7.5 md:py-0 motion-reduce:transition-none"
      >
        Search flights
        <span className="transition-transform duration-250 group-hover:translate-x-1 motion-reduce:transition-none" aria-hidden="true">
          &rarr;
        </span>
      </button>
    </form>
  );
}
