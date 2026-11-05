import { notFound, redirect } from "next/navigation";

import AdminNav from "@/components/admin/admin-nav";
import Footer from "@/components/layout/footer";
import SiteHeader from "@/components/layout/site-header";
import { getCurrentUser } from "@/lib/api/server";

// Keep non-admins off these pages. The backend enforces access through AdminUser.
export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const user = await getCurrentUser().catch(() => null);
  if (!user) redirect("/login?next=/admin");
  if (!user.is_admin) notFound();

  return (
    <>
      <SiteHeader />
      <main className="page grid content-start gap-8 md:grid-cols-[180px_minmax(0,1fr)]">
        <AdminNav />
        <div className="grid min-w-0 content-start gap-8">{children}</div>
      </main>
      <Footer />
    </>
  );
}
