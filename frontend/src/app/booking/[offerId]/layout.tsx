import BookingSteps from "@/components/booking/booking-steps";
import BookingSummary from "@/components/booking/booking-summary";
import Footer from "@/components/layout/footer";
import SiteHeader from "@/components/layout/site-header";

export default async function BookingLayout({ children, params }: LayoutProps<"/booking/[offerId]">) {
  const { offerId } = await params;
  return (
    <>
      <SiteHeader />
      <main className="page grid content-start gap-8">
        <BookingSteps offerId={offerId} />
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
          <div className="min-w-0">{children}</div>
          <BookingSummary offerId={offerId} />
        </div>
      </main>
      <Footer />
    </>
  );
}
