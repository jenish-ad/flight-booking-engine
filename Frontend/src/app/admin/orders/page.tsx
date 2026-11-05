import type { Metadata } from "next";
import Link from "next/link";

import AdminError from "@/components/admin/admin-error";
import SearchBar from "@/components/admin/search-bar";
import Pagination, { pageFrom } from "@/components/ui/pagination";
import StatusBadge from "@/components/ui/status-badge";
import { backend } from "@/lib/api/server";
import { formatMoney, instant } from "@/lib/format";
import type { AdminOrderList } from "@/lib/types";

export const metadata: Metadata = { title: "Voyage admin | Orders" };

const PAGE_SIZE = 25;
const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

export default async function AdminOrders({ searchParams }: PageProps<"/admin/orders">) {
  const params = await searchParams;
  const page = pageFrom(params.page);
  const q = one(params.q)?.trim() || undefined;
  const status = ["confirmed", "cancelled"].includes(one(params.status) ?? "") ? one(params.status) : undefined;

  const query = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String((page - 1) * PAGE_SIZE) });
  if (q) query.set("q", q);
  if (status) query.set("status", status);

  let list: AdminOrderList;
  try {
    list = await backend<AdminOrderList>(`/admin/orders?${query}`);
  } catch (error) {
    return <AdminError error={error} />;
  }

  return (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <h1 className="page-title">Orders</h1>
        <p className="text-sm text-slate">{list.total} total</p>
      </div>
      <SearchBar action="/admin/orders" placeholder="Booking reference, order id or email" defaultQuery={q} status={{ value: status }} />

      {list.orders.length ? (
        <div className="panel overflow-x-auto">
          <table className="w-full min-w-170 text-left text-sm">
            <thead className="border-b border-line text-xs text-slate">
              <tr>
                <th className="px-5 py-3 font-semibold">Reference</th>
                <th className="px-5 py-3 font-semibold">Customer</th>
                <th className="px-5 py-3 font-semibold">Booked</th>
                <th className="px-5 py-3 text-right font-semibold">Total</th>
                <th className="px-5 py-3 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {list.orders.map((order) => (
                <tr key={order.id} className="hover:bg-mist">
                  <td className="px-5 py-3.5">
                    <Link href={`/admin/orders/${order.id}`} className="font-semibold tracking-wide text-forest underline-offset-4 hover:underline">
                      {order.booking_reference}
                    </Link>
                  </td>
                  <td className="max-w-56 truncate px-5 py-3.5">{order.user_email ?? <span className="text-slate">Deleted user</span>}</td>
                  <td className="px-5 py-3.5 text-slate">{instant(order.created_at)}</td>
                  <td className="px-5 py-3.5 text-right tabular-nums">{formatMoney(order.total_amount, order.total_currency)}</td>
                  <td className="px-5 py-3.5"><StatusBadge status={order.status} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="panel px-6 py-8 text-sm text-slate">No orders match this search.</p>
      )}

      <Pagination page={page} pageSize={PAGE_SIZE} total={list.total} basePath="/admin/orders" query={{ q, status }} />
    </>
  );
}
