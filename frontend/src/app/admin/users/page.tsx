import type { Metadata } from "next";

import AdminError from "@/components/admin/admin-error";
import SearchBar from "@/components/admin/search-bar";
import Pagination, { pageFrom } from "@/components/ui/pagination";
import { backend } from "@/lib/api/server";
import type { AdminUserList } from "@/lib/types";

export const metadata: Metadata = { title: "Voyage admin | Users" };

const PAGE_SIZE = 25;
const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

export default async function AdminUsers({ searchParams }: PageProps<"/admin/users">) {
  const params = await searchParams;
  const page = pageFrom(params.page);
  const q = one(params.q)?.trim() || undefined;
  const query = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String((page - 1) * PAGE_SIZE) });
  if (q) query.set("q", q);

  let list: AdminUserList;
  try {
    list = await backend<AdminUserList>(`/admin/users?${query}`);
  } catch (error) {
    return <AdminError error={error} />;
  }

  return (
    <>
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <h1 className="page-title">Users</h1>
        <p className="text-sm text-slate">{list.total} total</p>
      </div>
      <SearchBar action="/admin/users" placeholder="Search by email" defaultQuery={q} />

      {list.users.length ? (
        <div className="panel overflow-x-auto">
          <table className="w-full min-w-130 text-left text-sm">
            <thead className="border-b border-line text-xs text-slate">
              <tr>
                <th className="px-5 py-3 font-semibold">Email</th>
                <th className="px-5 py-3 font-semibold">Role</th>
                <th className="px-5 py-3 text-right font-semibold">Orders</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {list.users.map((user) => (
                <tr key={user.id}>
                  <td className="max-w-80 truncate px-5 py-3.5 font-medium">{user.email}</td>
                  <td className="px-5 py-3.5">
                    {user.is_admin ? (
                      <span className="rounded-full bg-forest px-2.5 py-1 text-xs font-semibold text-cream">Admin</span>
                    ) : (
                      <span className="text-slate">Customer</span>
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-right tabular-nums">
                    {user.order_count ? (
                      <a href={`/admin/orders?q=${encodeURIComponent(user.email)}`} className="font-semibold text-forest underline-offset-4 hover:underline">
                        {user.order_count}
                      </a>
                    ) : (
                      0
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="panel px-6 py-8 text-sm text-slate">No users match this search.</p>
      )}

      <Pagination page={page} pageSize={PAGE_SIZE} total={list.total} basePath="/admin/users" query={{ q }} />
    </>
  );
}
