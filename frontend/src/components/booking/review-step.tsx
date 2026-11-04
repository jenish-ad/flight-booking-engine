"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import SliceSummary from "@/components/flights/slice-summary";
import Notice from "@/components/ui/notice";
import { api, ApiError, loginUrl } from "@/lib/api/client";
import { clearDraft, seatsTotal, selectedSeatList, useBookingDraft, type BookingDraft } from "@/lib/booking/draft";
import { addMoney, airportCode, calendarDate, formatMoney } from "@/lib/format";
import type { CreateOrderRequest, OrderResponse } from "@/lib/types";

import { passengerLabels } from "./seat-step";
import StepGate from "./step-gate";

function Review({ draft, offerId }: { draft: BookingDraft; offerId: string }) {
  const router = useRouter();
  const [error, setError] = useState<{ message: string; seats: boolean } | null>(null);
  const [booking, setBooking] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const priced = draft.priced!;
  const offer = priced.offer;
  const labels = passengerLabels(draft);
  const seats = selectedSeatList(draft);
  const segments = offer.slices.flatMap((slice) => slice.segments);
  const total = addMoney(offer.total_amount, seatsTotal(draft));

  async function book() {
    setBooking(true);
    setError(null);
    const order: CreateOrderRequest = {
      offer_id: offerId,
      passengers: draft.passengers,
      amount: offer.total_amount,
      currency: offer.total_currency,
      services: seats.map((seat) => seat.serviceId),
    };
    try {
      const created = await api<OrderResponse>("/orders", { method: "POST", json: order });
      clearDraft(offerId);
      router.replace(`/booking/confirmation/${created.id}`);
    } catch (caught) {
      setBooking(false);
      if (caught instanceof ApiError && caught.status === 401) {
        router.replace(loginUrl());
        return;
      }
      const message = caught instanceof Error ? caught.message : "Booking failed.";
      setError({ message, seats: /seat/i.test(message) });
    }
  }

  return (
    <div className="grid gap-6">
      <div className="grid gap-2">
        <h1 className="page-title">Review and book</h1>
        <p className="text-slate">Check every detail. Names can&apos;t be changed after booking.</p>
      </div>

      <section className="panel grid gap-5 p-5 sm:p-6">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="font-serif text-xl">Flight</h2>
          <Link href={`/booking/${offerId}`} className="text-link">Details</Link>
        </div>
        {offer.slices.map((slice) => (
          <div key={slice.id} className="grid gap-2">
            <p className="text-sm text-slate">
              {calendarDate(slice.departing_at.slice(0, 10))}, {offer.airline.name}
            </p>
            <SliceSummary slice={slice} />
          </div>
        ))}
      </section>

      <section className="panel grid gap-4 p-5 sm:p-6">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="font-serif text-xl">Travellers and seats</h2>
          <Link href={`/booking/${offerId}/passengers`} className="text-link">Edit travellers</Link>
        </div>
        <ul className="grid gap-3">
          {draft.passengers.map((passenger, index) => (
            <li key={passenger.id} className="grid gap-1 rounded-xl bg-cream px-4 py-3 text-sm sm:grid-cols-[1fr_auto] sm:items-center">
              <div>
                <p className="font-semibold">
                  {passenger.title.charAt(0).toUpperCase() + passenger.title.slice(1)}. {labels[index].label}
                </p>
                <p className="text-slate">
                  Born {calendarDate(passenger.born_on)} · {passenger.email} · {passenger.phone_number}
                </p>
              </div>
              <p className="text-slate sm:text-right">
                {segments.map((segment) => {
                  const seat = draft.seats[segment.id]?.[passenger.id];
                  return (
                    <span key={segment.id} className="block">
                      {segments.length > 1 && `${airportCode(segment.origin)}–${airportCode(segment.destination)}: `}
                      {seat ? <span className="font-semibold text-ink">Seat {seat.designator}</span> : "Seat at check-in"}
                    </span>
                  );
                })}
              </p>
            </li>
          ))}
        </ul>
        <Link href={`/booking/${offerId}/seats`} className="text-link justify-self-start">Change seats</Link>
      </section>

      {priced.price_changed && (
        <Notice tone="warning" title="You're booking at the updated fare">
          {formatMoney(offer.total_amount, offer.total_currency)} instead of {formatMoney(priced.previous_amount, priced.previous_currency)}.
        </Notice>
      )}

      {error && (
        <Notice
          tone="error"
          title="The booking didn't go through"
          action={
            error.seats ? (
              <Link href={`/booking/${offerId}/seats`} className="btn btn-secondary">Choose seats again</Link>
            ) : /price|offer/i.test(error.message) ? (
              <Link href={`/booking/${offerId}`} className="btn btn-secondary">Re-check fare</Link>
            ) : undefined
          }
        >
          {error.message} Nothing has been charged.
        </Notice>
      )}

      <section className="panel grid gap-4 p-5 sm:p-6">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="font-serif text-xl">Total to pay</h2>
          <p className="font-serif text-3xl tabular-nums">{formatMoney(total, offer.total_currency)}</p>
        </div>
        <label className="flex cursor-pointer items-start gap-2.5 text-sm">
          <input type="checkbox" className="mt-0.5 size-4 accent-forest" checked={agreed} onChange={(event) => setAgreed(event.target.checked)} />
          <span>
            The traveller names match their passports or IDs, and I accept the airline&apos;s fare rules.
          </span>
        </label>
        <button type="button" className="btn btn-primary w-full sm:w-auto sm:justify-self-end" disabled={!agreed || booking} onClick={book}>
          {booking ? "Booking with the airline…" : `Book for ${formatMoney(total, offer.total_currency)}`}
        </button>
      </section>
    </div>
  );
}

export default function ReviewStep({ offerId }: { offerId: string }) {
  const [draft] = useBookingDraft(offerId);
  return (
    <StepGate draft={draft} offerId={offerId} needsPassengers>
      {(ready) =>
        ready.seatsReviewed ? (
          <Review draft={ready} offerId={offerId} />
        ) : (
          <Notice tone="warning" title="Choose seats or skip them first" action={<Link href={`/booking/${offerId}/seats`} className="btn btn-secondary">Go to seats</Link>} />
        )
      }
    </StepGate>
  );
}
