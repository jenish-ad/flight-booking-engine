import type { Metadata } from "next";
import Link from "next/link";

import CancelOrder from "@/components/trips/cancel-order";
import OrderError from "@/components/trips/order-error";
import Ticket from "@/components/trips/ticket";
import { backend } from "@/lib/api/server";
import type { OrderResponse } from "@/lib/types";

export const metadata: Metadata = { title: "Voyage | Trip details" };

export default async function TripPage({ params }: PageProps<"/trips/[orderId]">) {
  const { orderId } = await params;
  let order: OrderResponse;
  try {
    order = await backend<OrderResponse>(`/orders/${encodeURIComponent(orderId)}`);
  } catch (error) {
    return <OrderError error={error} path={`/trips/${orderId}`} />;
  }

  return (
    <div className="mx-auto grid w-full max-w-3xl gap-8">
      <Link href="/trips" className="text-link">
        All trips
      </Link>
      <Ticket order={order} />
      {!order.cancelled_at && <CancelOrder orderId={order.id} />}
    </div>
  );
}
