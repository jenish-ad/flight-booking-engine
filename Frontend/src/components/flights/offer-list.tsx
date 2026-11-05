"use client";

import { useMemo, useState } from "react";

import { sliceMinutes, toUtcMs } from "@/lib/format";
import type { FlightOffer } from "@/lib/types";

import OfferCard from "./offer-card";

type Sort = "price" | "duration" | "departure";
type Stops = "any" | "direct" | "one";

const totalMinutes = (offer: FlightOffer) => offer.slices.reduce((sum, slice) => sum + sliceMinutes(slice), 0);
const maxStops = (offer: FlightOffer) => Math.max(...offer.slices.map((slice) => slice.stops));
const departs = (offer: FlightOffer) => toUtcMs(offer.slices[0].departing_at, offer.slices[0].origin.time_zone);

const sorters: Record<Sort, (a: FlightOffer, b: FlightOffer) => number> = {
  price: (a, b) => Number(a.total_amount) - Number(b.total_amount),
  duration: (a, b) => totalMinutes(a) - totalMinutes(b),
  departure: (a, b) => departs(a) - departs(b),
};

function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <fieldset className="grid gap-1.5">
      <legend className="mb-1.5 text-xs font-semibold text-slate">{label}</legend>
      <div className="flex flex-wrap gap-1 rounded-xl border border-line bg-paper p-1">
        {options.map((option) => (
          <label
            key={option.value}
            className={`cursor-pointer rounded-lg px-3 py-1.5 text-[13px] font-semibold transition-colors has-focus-visible:outline-2 has-focus-visible:outline-forest motion-reduce:transition-none ${
              value === option.value ? "bg-forest text-cream" : "text-ink hover:bg-mist"
            }`}
          >
            <input
              type="radio"
              className="sr-only"
              checked={value === option.value}
              onChange={() => onChange(option.value)}
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export default function OfferList({ offers }: { offers: FlightOffer[] }) {
  const [sort, setSort] = useState<Sort>("price");
  const [stops, setStops] = useState<Stops>("any");
  const [airline, setAirline] = useState("all");

  const airlines = useMemo(() => [...new Set(offers.map((offer) => offer.airline.name))].sort(), [offers]);
  const cheapestId = useMemo(() => [...offers].sort(sorters.price)[0]?.id, [offers]);
  const hasDirect = offers.some((offer) => maxStops(offer) === 0);

  const visible = useMemo(
    () =>
      offers
        .filter((offer) => stops === "any" || maxStops(offer) <= (stops === "direct" ? 0 : 1))
        .filter((offer) => airline === "all" || offer.airline.name === airline)
        .sort(sorters[sort]),
    [offers, sort, stops, airline],
  );

  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-end gap-4">
        <Segmented
          label="Sort by"
          value={sort}
          onChange={setSort}
          options={[
            { value: "price", label: "Price" },
            { value: "duration", label: "Duration" },
            { value: "departure", label: "Departure" },
          ]}
        />
        <Segmented
          label="Stops"
          value={stops}
          onChange={setStops}
          options={[
            { value: "any", label: "Any" },
            ...(hasDirect ? [{ value: "direct" as const, label: "Direct" }] : []),
            { value: "one", label: "Up to 1" },
          ]}
        />
        {airlines.length > 1 && (
          <label className="grid gap-1.5 text-xs font-semibold text-slate">
            Airline
            <select className="field-input h-10.5 w-auto pr-8" value={airline} onChange={(event) => setAirline(event.target.value)}>
              <option value="all">All airlines</option>
              {airlines.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </label>
        )}
        <p className="ml-auto text-sm text-slate" aria-live="polite">
          {visible.length} of {offers.length} {offers.length === 1 ? "flight" : "flights"}
        </p>
      </div>

      {visible.length ? (
        <div className="grid gap-4">
          {visible.map((offer) => (
            <OfferCard key={offer.id} offer={offer} cheapest={offer.id === cheapestId && offers.length > 1} />
          ))}
        </div>
      ) : (
        <p className="panel px-6 py-8 text-sm text-slate">
          No flights match these filters.{" "}
          <button type="button" className="text-link cursor-pointer underline" onClick={() => { setStops("any"); setAirline("all"); }}>
            Clear filters
          </button>
        </p>
      )}
    </div>
  );
}
