import type { Metadata } from "next";
import Link from "next/link";

import AdminError from "@/components/admin/admin-error";
import StatusBadge from "@/components/ui/status-badge";
import { backend } from "@/lib/api/server";
import { formatMoney, instant } from "@/lib/format";
import type { AdminOrderList, AdminStats } from "@/lib/types";

export const metadata: Metadata = { title: "Voyage admin | Overview" };

export default async function AdminOverview() {
  let stats: AdminStats;
  let recent: AdminOrderList;
  try {
    [stats, recent] = await Promise.all([
      backend<AdminStats>("/admin/stats"),
      backend<AdminOrderList>("/admin/orders?limit=5"),
    ]);
  } catch (error) {
    return <AdminError error={error} />;
  }

  const figures = [
    { label: "Users", value: stats.users },
    { label: "Orders", value: stats.orders },
    { label: "Confirmed", value: stats.confirmed_orders },
    { label: "Cancelled", value: stats.cancelled_orders },
  ];

  return (
    <>
      <h1 className="page-title">Overview</h1>

      <dl className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-line bg-line lg:grid-cols-4">
        {figures.map((figure) => (
          <div key={figure.label} className="bg-paper p-5">
            <dt className="text-sm text-slate">{figure.label}</dt>
            <dd className="font-serif text-4xl tabular-nums">{figure.value}</dd>
          </div>
        ))}
      </dl>

      <section className="grid gap-3">
        <h2 className="font-serif text-2xl">Value of confirmed bookings</h2>
        {stats.booked_value.length ? (
          <ul className="flex flex-wrap gap-3">
            {stats.booked_value.map((entry) => (
              <li key={entry.currency} className="panel px-5 py-3 font-semibold tabular-nums">
                {formatMoney(entry.amount, entry.currency)}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate">No confirmed bookings yet.</p>
        )}
      </section>

      <section className="grid gap-3">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="font-serif text-2xl">Latest orders</h2>
          <Link href="/admin/orders" className="text-link">All orders</Link>
        </div>
        {recent.orders.length ? (
          <ul className="panel divide-y divide-line">
            {recent.orders.map((order) => (
              <li key={order.id}>
                <Link href={`/admin/orders/${order.id}`} className="grid grid-cols-[1fr_auto] items-center gap-4 px-5 py-4 hover:bg-mist sm:grid-cols-[120px_1fr_auto_auto]">
                  <span className="font-semibold tracking-wide">{order.booking_reference}</span>
                  <span className="hidden truncate text-sm text-slate sm:block">{order.user_email ?? "Deleted user"}</span>
                  <span className="hidden text-sm text-slate sm:block">{instant(order.created_at, { dateStyle: "medium" })}</span>
                  <StatusBadge status={order.status} />
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-slate">No orders yet.</p>
        )}
      </section>
    </>
  );
}
