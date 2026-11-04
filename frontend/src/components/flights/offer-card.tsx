"use client";

import Link from "next/link";
import { useState } from "react";

import { formatMoney } from "@/lib/format";
import type { FlightOffer } from "@/lib/types";

import SliceDetails from "./slice-details";
import SliceSummary from "./slice-summary";

export function bookingHref(offer: FlightOffer) {
  // Pass along the displayed price so /price can check whether it has changed.
  const params = new URLSearchParams({ amount: offer.total_amount, currency: offer.total_currency });
  return `/booking/${offer.id}?${params}`;
}

export default function OfferCard({ offer, cheapest }: { offer: FlightOffer; cheapest: boolean }) {
  const [open, setOpen] = useState(false);
  const travellers = offer.passengers.length;
  const perPerson = Number(offer.total_amount) / travellers;

  return (
    <article className="panel overflow-hidden">
      <div className="grid gap-5 p-5 sm:p-6 md:grid-cols-[1fr_auto] md:items-center md:gap-8">
        <div className="grid gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <p className="text-sm font-semibold">{offer.airline.name}</p>
            {cheapest && <span className="rounded-full bg-ok-soft px-2.5 py-0.5 text-xs font-semibold text-forest-dark">Lowest price</span>}
          </div>
          {offer.slices.map((slice) => (
            <SliceSummary key={slice.id} slice={slice} />
          ))}
        </div>

        <div className="flex items-end justify-between gap-4 border-t border-dashed border-line-dashed pt-4 md:grid md:justify-items-end md:border-t-0 md:border-l md:pt-0 md:pl-8">
          <div className="grid md:justify-items-end">
            <span className="font-serif text-[30px] leading-none font-medium">{formatMoney(offer.total_amount, offer.total_currency)}</span>
            <span className="mt-1 text-xs text-slate">
              {travellers > 1 ? `${formatMoney(perPerson, offer.total_currency)} per adult` : "Total for 1 adult"}
            </span>
          </div>
          <Link href={bookingHref(offer)} className="btn btn-primary">
            Select
          </Link>
        </div>
      </div>

      <button
        type="button"
        className="flex w-full cursor-pointer items-center justify-between border-t border-line bg-cream/60 px-5 py-3 text-xs font-semibold text-forest hover:bg-mist sm:px-6"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        {open ? "Hide flight details" : "Flight details"}
        <span className={`transition-transform duration-200 motion-reduce:transition-none ${open ? "rotate-180" : ""}`} aria-hidden="true">
          ▾
        </span>
      </button>
      {open && (
        <div className="grid gap-6 border-t border-line px-5 py-5 sm:px-6">
          {offer.slices.map((slice) => (
            <SliceDetails key={slice.id} slice={slice} />
          ))}
        </div>
      )}
    </article>
  );
}
