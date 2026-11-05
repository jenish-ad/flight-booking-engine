import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import EmptyState from "@/components/ui/empty-state";
import Notice from "@/components/ui/notice";
import Pagination, { pageFrom } from "@/components/ui/pagination";
import StatusBadge from "@/components/ui/status-badge";
import { ApiError } from "@/lib/api/errors";
import { backend } from "@/lib/api/server";
import { formatMoney, instant } from "@/lib/format";
import type { OrderList } from "@/lib/types";

export const metadata: Metadata = { title: "Voyage | My trips" };

const PAGE_SIZE = 20;

export default async function TripsPage({ searchParams }: PageProps<"/trips">) {
  const page = pageFrom((await searchParams).page);
  let list: OrderList;
  try {
    list = await backend<OrderList>(`/orders?limit=${PAGE_SIZE}&offset=${(page - 1) * PAGE_SIZE}`);
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) redirect("/login?next=/trips");
    const missingEndpoint = error instanceof ApiError && error.status === 405;
    return (
      <>
        <h1 className="page-title">My trips</h1>
        <Notice tone="error" title="Trips couldn't be loaded">
          {missingEndpoint
            ? "The backend has no GET /orders route yet. Apply the backend patch that adds it."
            : error instanceof Error
              ? error.message
              : "Try again in a moment."}
        </Notice>
      </>
    );
  }

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="page-title">My trips</h1>
        <Link href="/#search" className="btn btn-primary">
          Book a flight
        </Link>
      </div>

      {list.orders.length === 0 ? (
        <EmptyState title="No trips yet" action={<Link href="/#search" className="btn btn-primary">Search flights</Link>}>
          Flights you book appear here, with the booking reference and the option to cancel.
        </EmptyState>
      ) : (
        <ul className="grid gap-3">
          {list.orders.map((order) => (
            <li key={order.id}>
              <Link
                href={`/trips/${order.id}`}
                className="panel grid grid-cols-[1fr_auto] items-center gap-4 p-5 transition-colors hover:bg-mist motion-reduce:transition-none sm:grid-cols-[1fr_auto_auto] sm:gap-8"
              >
                <div>
                  <p className="font-serif text-2xl tracking-[0.06em]">{order.booking_reference}</p>
                  <p className="text-sm text-slate">Booked {instant(order.created_at)}</p>
                </div>
                <p className="hidden font-semibold tabular-nums sm:block">{formatMoney(order.total_amount, order.total_currency)}</p>
                <StatusBadge status={order.status} />
              </Link>
            </li>
          ))}
        </ul>
      )}

      <Pagination page={page} pageSize={PAGE_SIZE} total={list.total} basePath="/trips" />
    </>
  );
}
