"use client";

import { seatsTotal, selectedSeatList, useBookingDraft } from "@/lib/booking/draft";
import { addMoney, airportCode, formatMoney, wallDate, wallTime } from "@/lib/format";

import ExpiryCountdown from "./expiry-countdown";

export default function BookingSummary({ offerId }: { offerId: string }) {
  const [draft] = useBookingDraft(offerId);
  const offer = draft?.priced?.offer;

  if (!offer) {
    return (
      <aside className="panel hidden p-6 text-sm text-slate lg:block">
        Your trip summary appears here once the fare is confirmed.
      </aside>
    );
  }

  const seats = selectedSeatList(draft);
  const seatAmount = seatsTotal(draft);
  const currency = offer.total_currency;

  return (
    <aside className="panel grid content-start gap-5 p-6 lg:sticky lg:top-24">
      <div className="grid gap-1">
        <h2 className="font-serif text-2xl">Your trip</h2>
        <ExpiryCountdown expiresAt={offer.expires_at} />
      </div>

      {offer.slices.map((slice) => (
        <div key={slice.id} className="grid gap-1 text-sm">
          <p className="font-semibold">
            {airportCode(slice.origin)} to {airportCode(slice.destination)}
          </p>
          <p className="text-slate">
            {wallDate(slice.departing_at)}, {wallTime(slice.departing_at)} to {wallTime(slice.arriving_at)}
          </p>
          <p className="text-slate">{offer.airline.name}</p>
        </div>
      ))}

      <dl className="grid gap-2 border-t border-dashed border-line-dashed pt-4 text-sm">
        <div className="flex justify-between gap-4">
          <dt className="text-slate">
            Fare, {offer.passengers.length} {offer.passengers.length === 1 ? "adult" : "adults"}
          </dt>
          <dd className="tabular-nums">{formatMoney(offer.total_amount, currency)}</dd>
        </div>
        {seats.length > 0 && (
          <div className="flex justify-between gap-4">
            <dt className="text-slate">
              {seats.length} {seats.length === 1 ? "seat" : "seats"}
            </dt>
            <dd className="tabular-nums">{Number(seatAmount) ? formatMoney(seatAmount, currency) : "Free"}</dd>
          </div>
        )}
        <div className="flex justify-between gap-4 border-t border-line pt-3 text-base font-semibold">
          <dt>Total</dt>
          <dd className="tabular-nums">{formatMoney(addMoney(offer.total_amount, seatAmount), currency)}</dd>
        </div>
      </dl>
    </aside>
  );
}
