"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import Notice from "@/components/ui/notice";
import Spinner from "@/components/ui/spinner";
import { api, ApiError, loginUrl } from "@/lib/api/client";
import { useBookingDraft, type BookingDraft, type SelectedSeat } from "@/lib/booking/draft";
import { airportCode, formatMoney } from "@/lib/format";
import type { SeatMapsResponse } from "@/lib/types";

import SeatMap, { type SeatPassenger } from "./seat-map";
import StepGate from "./step-gate";

type Load = { status: "loading" } | { status: "ready"; data: SeatMapsResponse } | { status: "error"; message: string };

export function passengerLabels(draft: BookingDraft): SeatPassenger[] {
  return draft.passengers.map((passenger, index) => {
    const name = `${passenger.given_name} ${passenger.family_name}`.trim();
    return {
      id: passenger.id,
      label: name || `Adult ${index + 1}`,
      initials: name ? `${passenger.given_name[0] ?? ""}${passenger.family_name[0] ?? ""}`.toUpperCase() : String(index + 1),
    };
  });
}

function SeatPicker({ draft, offerId }: { draft: BookingDraft; offerId: string }) {
  const router = useRouter();
  const [, updateDraft] = useBookingDraft(offerId);
  const [load, setLoad] = useState<Load>({ status: "loading" });
  const offer = draft.priced!.offer;
  const passengers = useMemo(() => passengerLabels(draft), [draft]);
  const [activePassenger, setActivePassenger] = useState(passengers[0]?.id ?? "");

  const segments = useMemo(() => offer.slices.flatMap((slice) => slice.segments), [offer]);
  const [segmentId, setSegmentId] = useState(segments[0]?.id ?? "");

  useEffect(() => {
    let active = true;
    api<SeatMapsResponse>(`/offers/${offerId}/seat-maps`)
      .then((data) => active && setLoad({ status: "ready", data }))
      .catch((error: unknown) => {
        if (!active) return;
        if (error instanceof ApiError && error.status === 401) router.replace(loginUrl());
        else setLoad({ status: "error", message: error instanceof Error ? error.message : "Seat maps failed to load." });
      });
    return () => {
      active = false;
    };
  }, [offerId, router]);

  function select(passengerId: string, seat: SelectedSeat | null) {
    updateDraft((current) => {
      const forSegment = { ...(current.seats[segmentId] ?? {}) };
      if (seat) forSegment[passengerId] = seat;
      else delete forSegment[passengerId];
      return { ...current, seats: { ...current.seats, [segmentId]: forSegment } };
    });
    if (seat) {
      const taken = { ...(draft.seats[segmentId] ?? {}), [passengerId]: seat };
      const next = passengers.find((passenger) => !taken[passenger.id]);
      if (next) setActivePassenger(next.id);
    }
  }

  function finish(clearSeats: boolean) {
    updateDraft((current) => ({ ...current, seats: clearSeats ? {} : current.seats, seatsReviewed: true }));
    router.push(`/booking/${offerId}/review`);
  }

  const header = (
    <div className="grid gap-2">
      <h1 className="page-title">Choose seats</h1>
      <p className="text-slate">Optional. Skip this and the airline assigns seats at check-in.</p>
    </div>
  );

  if (load.status === "loading") {
    return (
      <div className="grid gap-6">
        {header}
        <div className="panel grid place-items-center px-6 py-16">
          <Spinner label="Loading the cabin layout…" />
        </div>
      </div>
    );
  }

  if (load.status === "error" || !load.data.seat_maps.length) {
    return (
      <div className="grid gap-6">
        {header}
        {load.status === "error" ? (
          <Notice tone="error" title="Seat maps didn't load">
            {load.message} You can still book; the airline will assign seats.
          </Notice>
        ) : (
          <Notice title="Seat selection isn't offered for this flight">
            {offer.airline.name} assigns seats at check-in for this fare.
          </Notice>
        )}
        <div className="flex justify-end">
          <button type="button" className="btn btn-primary" onClick={() => finish(true)}>
            Continue to review
          </button>
        </div>
      </div>
    );
  }

  const mapsBySegment = Object.fromEntries(load.data.seat_maps.map((map) => [map.segment_id, map]));
  const seatMap = mapsBySegment[segmentId];
  const selections = draft.seats[segmentId] ?? {};

  return (
    <div className="grid gap-6">
      {header}

      {segments.length > 1 && (
        <div role="tablist" aria-label="Flights" className="flex flex-wrap gap-2">
          {segments.map((segment) => {
            const picked = Object.keys(draft.seats[segment.id] ?? {}).length;
            return (
              <button
                key={segment.id}
                role="tab"
                type="button"
                aria-selected={segment.id === segmentId}
                onClick={() => setSegmentId(segment.id)}
                className={`btn px-4 py-2.5 ${segment.id === segmentId ? "btn-primary" : "btn-secondary"}`}
              >
                {airportCode(segment.origin)} to {airportCode(segment.destination)}
                <span className="text-xs font-medium opacity-75">
                  {mapsBySegment[segment.id] ? `${picked}/${passengers.length}` : "no map"}
                </span>
              </button>
            );
          })}
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-[220px_minmax(0,1fr)]">
        <fieldset className="grid content-start gap-2">
          <legend className="mb-2 text-sm font-semibold">Choosing for</legend>
          {passengers.map((passenger) => {
            const seat = selections[passenger.id];
            return (
              <label
                key={passenger.id}
                className={`flex cursor-pointer items-center justify-between gap-3 rounded-xl border px-3.5 py-3 text-sm has-focus-visible:outline-2 has-focus-visible:outline-forest ${
                  activePassenger === passenger.id ? "border-forest bg-ok-soft" : "border-line bg-paper hover:bg-mist"
                }`}
              >
                <input
                  type="radio"
                  name="seat-passenger"
                  className="sr-only"
                  checked={activePassenger === passenger.id}
                  onChange={() => setActivePassenger(passenger.id)}
                />
                <span className="truncate font-semibold">{passenger.label}</span>
                <span className="shrink-0 text-xs text-slate">
                  {seat ? (
                    <>
                      <span className="font-bold text-forest">{seat.designator}</span>{" "}
                      {Number(seat.amount) ? formatMoney(seat.amount, seat.currency) : "free"}
                    </>
                  ) : (
                    "No seat"
                  )}
                </span>
              </label>
            );
          })}
          {selections[activePassenger] && (
            <button type="button" className="text-link mt-1 cursor-pointer justify-self-start" onClick={() => select(activePassenger, null)}>
              Remove {selections[activePassenger].designator}
            </button>
          )}
        </fieldset>

        <div className="panel min-w-0 py-6">
          {seatMap ? (
            <SeatMap
              seatMap={seatMap}
              passengers={passengers}
              activePassengerId={activePassenger}
              selections={selections}
              onSelect={select}
            />
          ) : (
            <p className="px-6 text-sm text-slate">The airline doesn&apos;t offer seat selection on this flight.</p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <button type="button" className="text-link cursor-pointer" onClick={() => finish(true)}>
          Skip seat selection
        </button>
        <button type="button" className="btn btn-primary" onClick={() => finish(false)}>
          Continue to review
        </button>
      </div>
    </div>
  );
}

export default function SeatStep({ offerId }: { offerId: string }) {
  const [draft] = useBookingDraft(offerId);
  return (
    <StepGate draft={draft} offerId={offerId} needsPassengers>
      {(ready) => <SeatPicker draft={ready} offerId={offerId} />}
    </StepGate>
  );
}
