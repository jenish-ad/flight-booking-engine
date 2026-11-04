import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import AdminError from "@/components/admin/admin-error";
import Ticket from "@/components/trips/ticket";
import Notice from "@/components/ui/notice";
import StatusBadge from "@/components/ui/status-badge";
import { ApiError } from "@/lib/api/errors";
import { backend } from "@/lib/api/server";
import { formatMoney, instant } from "@/lib/format";
import type { AdminOrderDetail } from "@/lib/types";

export const metadata: Metadata = { title: "Voyage admin | Order" };

export default async function AdminOrderPage({ params }: PageProps<"/admin/orders/[orderId]">) {
  const { orderId } = await params;
  let detail: AdminOrderDetail;
  try {
    detail = await backend<AdminOrderDetail>(`/admin/orders/${encodeURIComponent(orderId)}`);
  } catch (error) {
    if (error instanceof ApiError && (error.status === 404 || error.status === 422)) notFound();
    return <AdminError error={error} />;
  }
  const { summary, order } = detail;

  return (
    <>
      <Link href="/admin/orders" className="text-link">All orders</Link>
      <div className="flex flex-wrap items-center gap-4">
        <h1 className="page-title tracking-[0.04em]">{summary.booking_reference}</h1>
        <StatusBadge status={summary.status} />
      </div>

      <dl className="panel grid gap-5 p-6 text-sm sm:grid-cols-2 lg:grid-cols-3">
        {[
          ["Customer", summary.user_email ?? "Deleted user"],
          ["Order id", summary.id],
          ["Total", formatMoney(summary.total_amount, summary.total_currency)],
          ["Booked", instant(summary.created_at)],
          ["Cancelled", summary.cancelled_at ? instant(summary.cancelled_at) : "—"],
          ["User id", summary.user_id],
        ].map(([label, value]) => (
          <div key={label} className="min-w-0">
            <dt className="text-slate">{label}</dt>
            <dd className="font-semibold break-all">{value}</dd>
          </div>
        ))}
      </dl>

      {order ? (
        <Ticket order={order} />
      ) : (
        <Notice tone="warning" title="Live itinerary unavailable">
          {detail.duffel_error ?? "Duffel didn't return this order."} The details above come from our own database.
        </Notice>
      )}
    </>
  );
}
