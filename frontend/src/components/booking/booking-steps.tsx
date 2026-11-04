"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useBookingDraft } from "@/lib/booking/draft";

const steps = [
  { slug: "", label: "Flight" },
  { slug: "passengers", label: "Travellers" },
  { slug: "seats", label: "Seats" },
  { slug: "review", label: "Review" },
];

export default function BookingSteps({ offerId }: { offerId: string }) {
  const pathname = usePathname();
  const [draft] = useBookingDraft(offerId);
  const current = Math.max(0, steps.findIndex((step) => step.slug && pathname.endsWith(`/${step.slug}`)));

  const done = [Boolean(draft?.priced), Boolean(draft?.passengers.length), Boolean(draft?.seatsReviewed)];
  const reachable = (index: number) => done.slice(0, index).every(Boolean);

  return (
    <nav aria-label="Booking steps">
      <ol className="grid grid-cols-4 gap-1.5">
        {steps.map((step, index) => {
          const state = index === current ? "current" : index < current || done[index] ? "done" : "todo";
          const content = (
            <>
              <span
                className={`h-1 rounded-full ${state === "todo" ? "bg-line" : state === "current" ? "bg-clay" : "bg-forest"}`}
                aria-hidden="true"
              />
              <span className={`text-xs font-semibold sm:text-sm ${state === "todo" ? "text-slate" : "text-ink"}`}>
                <span className="text-slate tabular-nums">{index + 1}</span> {step.label}
              </span>
            </>
          );
          return (
            <li key={step.label}>
              {index !== current && reachable(index) ? (
                <Link href={`/booking/${offerId}${step.slug ? `/${step.slug}` : ""}`} className="grid gap-2 rounded-md hover:opacity-80">
                  {content}
                </Link>
              ) : (
                <span className="grid gap-2" aria-current={index === current ? "step" : undefined}>
                  {content}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
