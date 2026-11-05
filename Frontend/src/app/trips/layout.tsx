import Footer from "@/components/layout/footer";
import SiteHeader from "@/components/layout/site-header";

export default function TripsLayout({ children }: LayoutProps<"/trips">) {
  return (
    <>
      <SiteHeader />
      <main className="page grid content-start gap-8">{children}</main>
      <Footer />
    </>
  );
}
