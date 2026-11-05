import type { Metadata } from "next";
import { Suspense } from "react";

import OfferList from "@/components/flights/offer-list";
import FlightSearchForm from "@/components/flights/flight-search-form";
import Footer from "@/components/layout/footer";
import SiteHeader from "@/components/layout/site-header";
import EmptyState from "@/components/ui/empty-state";
import Notice from "@/components/ui/notice";
import Spinner from "@/components/ui/spinner";
import { ApiError } from "@/lib/api/errors";
import { backend } from "@/lib/api/server";
import { CABIN_LABELS, cabinLabel, calendarDate } from "@/lib/format";
import type { CabinClass, FlightSearchRequest, FlightSearchResponse } from "@/lib/types";

export const metadata: Metadata = { title: "Voyage | Flight results" };

const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value) ?? "";

function parseSearch(params: Record<string, string | string[] | undefined>) {
  const origin = one(params.from).trim().toUpperCase();
  const destination = one(params.to).trim().toUpperCase();
  const departure_date = one(params.departure);
  const adults = Math.min(9, Math.max(1, Number.parseInt(one(params.adults) || one(params.travelers) || "1", 10) || 1));
  const cabin = one(params.cabin) as CabinClass;
  const cabin_class: CabinClass = cabin in CABIN_LABELS ? cabin : "economy";

  const problems: string[] = [];
  if (!/^[A-Z]{3}$/.test(origin)) problems.push("Choose where you're flying from.");
  if (!/^[A-Z]{3}$/.test(destination)) problems.push("Choose where you're flying to.");
  if (origin && origin === destination) problems.push("Origin and destination must be different airports.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(departure_date)) problems.push("Pick a departure date.");

  const request: FlightSearchRequest = { origin, destination, departure_date, adults, cabin_class };
  return { request, problems };
}

async function Results({ request }: { request: FlightSearchRequest }) {
  let result: FlightSearchResponse;
  try {
    result = await backend<FlightSearchResponse>("/flights/search", { method: "POST", json: request, auth: false });
  } catch (error) {
    const message = error instanceof ApiError ? error.message : "Search failed.";
    return <Notice tone="error" title="We couldn't search flights">{message}</Notice>;
  }

  if (!result.offers.length) {
    return (
      <EmptyState title="No flights on this date">
        Airlines aren&apos;t selling seats for {request.origin} to {request.destination} on {calendarDate(request.departure_date)}
        {request.cabin_class !== "economy" && ` in ${cabinLabel(request.cabin_class).toLowerCase()}`}. Try another date,
        a nearby airport or a different cabin.
      </EmptyState>
    );
  }
  return <OfferList offers={result.offers} />;
}

export default async function FlightsPage({ searchParams }: PageProps<"/flights">) {
  const { request, problems } = parseSearch(await searchParams);
  const defaults = {
    from: request.origin,
    to: request.destination,
    departure: request.departure_date,
    adults: request.adults,
    cabin: request.cabin_class,
  };

  return (
    <>
      <SiteHeader />
      <main className="page grid content-start gap-8">
        <div className="grid gap-2">
          <h1 className="page-title">
            {request.origin && request.destination ? `${request.origin} to ${request.destination}` : "Search flights"}
          </h1>
          {!problems.length && (
            <p className="text-slate">
              {calendarDate(request.departure_date)}, {request.adults} {request.adults === 1 ? "adult" : "adults"},{" "}
              {cabinLabel(request.cabin_class).toLowerCase()}. One way.
            </p>
          )}
        </div>

        <FlightSearchForm variant="inline" defaults={defaults} />

        {problems.length ? (
          <Notice tone="warning" title="Finish your search">
            {problems.join("\n")}
          </Notice>
        ) : (
          <Suspense
            key={JSON.stringify(request)}
            fallback={
              <div className="panel grid place-items-center px-6 py-16">
                <Spinner label="Asking airlines for prices…" />
              </div>
            }
          >
            <Results request={request} />
          </Suspense>
        )}
      </main>
      <Footer />
    </>
  );
}
