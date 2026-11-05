import type { Metadata } from "next";
import Link from "next/link";

import Footer from "@/components/layout/footer";
import SiteHeader from "@/components/layout/site-header";
import OrderError from "@/components/trips/order-error";
import Ticket from "@/components/trips/ticket";
import { backend } from "@/lib/api/server";
import type { OrderResponse } from "@/lib/types";

export const metadata: Metadata = { title: "Voyage | Booking confirmed" };

export default async function ConfirmationPage({ params }: PageProps<"/booking/confirmation/[orderId]">) {
  const { orderId } = await params;
  let order: OrderResponse | null = null;
  let failure: unknown = null;
  try {
    order = await backend<OrderResponse>(`/orders/${encodeURIComponent(orderId)}`);
  } catch (error) {
    failure = error;
  }

  return (
    <>
      <SiteHeader />
      <main className="page mx-auto grid max-w-3xl content-start gap-8">
        {order ? (
          <>
            <div className="grid gap-2">
              <h1 className="page-title">You&apos;re booked</h1>
              <p className="text-slate">
                The airline has confirmed your seats. Keep the booking reference handy for check-in.
              </p>
            </div>
            <Ticket order={order} />
            <div className="flex flex-wrap gap-3">
              <Link href={`/trips/${order.id}`} className="btn btn-primary">
                Manage this trip
              </Link>
              <Link href="/#search" className="btn btn-secondary">
                Book another flight
              </Link>
            </div>
          </>
        ) : (
          <OrderError error={failure} path={`/booking/confirmation/${orderId}`} />
        )}
      </main>
      <Footer />
    </>
  );
}
