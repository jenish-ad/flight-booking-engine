import SliceDetails from "@/components/flights/slice-details";
import StatusBadge from "@/components/ui/status-badge";
import { airportCode, formatMoney, instant, wallDate, wallTime } from "@/lib/format";
import type { OrderResponse } from "@/lib/types";

export default function Ticket({ order }: { order: OrderResponse }) {
  const first = order.slices[0];
  const last = order.slices[order.slices.length - 1];
  const status = order.cancelled_at ? "cancelled" : "confirmed";

  return (
    <article className="panel overflow-hidden shadow-[0_24px_50px_-34px_#243b4980]">
      <div className="grid gap-6 p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs text-slate">Booking reference</p>
            <p className="font-serif text-4xl tracking-[0.08em] sm:text-5xl">{order.booking_reference}</p>
          </div>
          <StatusBadge status={status} />
        </div>

        {first && last && (
          <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-4">
            <div>
              <p className="font-serif text-5xl leading-none sm:text-6xl">{airportCode(first.origin)}</p>
              <p className="mt-2 text-sm text-slate">{first.origin.name}</p>
              <p className="text-sm font-semibold">
                {wallDate(first.departing_at)}, {wallTime(first.departing_at)}
              </p>
            </div>
            <span className="pb-10 text-2xl text-clay" aria-hidden="true">
              ✈︎
            </span>
            <div className="text-right">
              <p className="font-serif text-5xl leading-none sm:text-6xl">{airportCode(last.destination)}</p>
              <p className="mt-2 text-sm text-slate">{last.destination.name}</p>
              <p className="text-sm font-semibold">
                {wallDate(last.arriving_at)}, {wallTime(last.arriving_at)}
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="relative h-5" aria-hidden="true">
        <span className="absolute top-0 -left-2.5 size-5 rounded-full border border-line bg-cream" />
        <span className="ticket-perforation absolute inset-x-4 top-0 h-5" />
        <span className="absolute top-0 -right-2.5 size-5 rounded-full border border-line bg-cream" />
      </div>

      <div className="grid gap-6 p-6 sm:p-8">
        {order.slices.map((slice) => (
          <SliceDetails key={slice.id} slice={slice} />
        ))}
        <dl className="grid gap-4 border-t border-dashed border-line-dashed pt-5 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-slate">Total paid</dt>
            <dd className="font-semibold tabular-nums">{formatMoney(order.total_amount, order.total_currency)}</dd>
          </div>
          <div>
            <dt className="text-slate">Booked</dt>
            <dd className="font-semibold">{instant(order.created_at)}</dd>
          </div>
          {order.cancelled_at && (
            <div>
              <dt className="text-slate">Cancelled</dt>
              <dd className="font-semibold">{instant(order.cancelled_at)}</dd>
            </div>
          )}
        </dl>
      </div>
    </article>
  );
}
