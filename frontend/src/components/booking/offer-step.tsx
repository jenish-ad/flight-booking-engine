"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import SliceDetails from "@/components/flights/slice-details";
import Notice from "@/components/ui/notice";
import Spinner from "@/components/ui/spinner";
import { api, ApiError, loginUrl } from "@/lib/api/client";
import { useBookingDraft } from "@/lib/booking/draft";
import { airportCode, formatMoney, instant } from "@/lib/format";
import type { PriceConfirmResponse } from "@/lib/types";

type State =
  | { status: "loading" }
  | { status: "ready"; priced: PriceConfirmResponse }
  | { status: "expired" }
  | { status: "error"; message: string };

export default function OfferStep({
  offerId,
  expectedAmount,
  expectedCurrency,
}: {
  offerId: string;
  expectedAmount?: string;
  expectedCurrency?: string;
}) {
  const router = useRouter();
  const [draft, updateDraft] = useBookingDraft(offerId);
  const [state, setState] = useState<State>({ status: "loading" });
  const started = useRef(false);

  // When returning to this step, use the last confirmed price as the fallback.
  const amount = expectedAmount ?? draft?.priced?.offer.total_amount;
  const currency = expectedCurrency ?? draft?.priced?.offer.total_currency;
  const missing = draft !== undefined && (!amount || !currency);

  useEffect(() => {
    // Wait for the saved draft before checking the price, and only start once.
    if (draft === undefined || missing || started.current) return;
    started.current = true;

    api<PriceConfirmResponse>(`/offers/${offerId}/price`, {
      method: "POST",
      json: { expected_amount: amount, expected_currency: currency },
    })
      .then((priced) => {
        updateDraft((current) => ({ ...current, priced }));
        setState({ status: "ready", priced });
      })
      .catch((error: unknown) => {
        if (error instanceof ApiError && error.status === 401) {
          router.replace(loginUrl());
        } else if (error instanceof ApiError && error.status === 410) {
          setState({ status: "expired" });
        } else {
          setState({ status: "error", message: error instanceof Error ? error.message : "Pricing failed." });
        }
      });
  }, [draft, missing, amount, currency, offerId, updateDraft, router]);

  if (missing) {
    return (
      <Notice tone="warning" title="Start from your search results" action={<Link href="/#search" className="btn btn-primary">Search flights</Link>}>
        Choose a flight from the results so we know which fare you saw.
      </Notice>
    );
  }

  if (state.status === "loading") {
    return (
      <div className="panel grid place-items-center px-6 py-16">
        <Spinner label="Checking the latest fare with the airline…" />
      </div>
    );
  }

  if (state.status === "expired") {
    return (
      <Notice tone="error" title="This fare is no longer available" action={<Link href="/#search" className="btn btn-primary">Search again</Link>}>
        The airline released it. Search again to see current prices.
      </Notice>
    );
  }

  if (state.status === "error") {
    return <Notice tone="error" title="We couldn't confirm this fare">{state.message}</Notice>;
  }

  const { priced } = state;
  const { offer } = priced;

  return (
    <div className="grid gap-6">
      <div className="grid gap-2">
        <h1 className="page-title">
          {offer.slices.map((slice) => `${airportCode(slice.origin)} to ${airportCode(slice.destination)}`).join(", ")}
        </h1>
        <p className="text-slate">{offer.airline.name}</p>
      </div>

      {priced.price_changed ? (
        <Notice tone="warning" title="The fare has changed">
          It was {formatMoney(priced.previous_amount, priced.previous_currency)} when you searched and is now{" "}
          <strong>{formatMoney(offer.total_amount, offer.total_currency)}</strong>. Continue only if the new price works for you.
        </Notice>
      ) : (
        <Notice tone="success" title={`Fare confirmed at ${formatMoney(offer.total_amount, offer.total_currency)}`}>
          {priced.price_guaranteed_until
            ? `The airline guarantees this price until ${instant(priced.price_guaranteed_until)}.`
            : "Book before the timer runs out to keep this price."}
        </Notice>
      )}

      {priced.passenger_identity_documents_required && (
        <Notice tone="warning" title="This airline asks for passport details">
          Voyage can&apos;t collect passport details yet, so the airline may reject this booking. Pick another flight if you can.
        </Notice>
      )}

      <section className="panel grid gap-6 p-6">
        {offer.slices.map((slice) => (
          <SliceDetails key={slice.id} slice={slice} />
        ))}
      </section>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link href="/#search" className="text-link">
          Change flight
        </Link>
        <Link href={`/booking/${offerId}/passengers`} className="btn btn-primary">
          Continue to travellers
        </Link>
      </div>
    </div>
  );
}
