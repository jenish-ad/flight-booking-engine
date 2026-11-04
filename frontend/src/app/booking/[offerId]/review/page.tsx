import type { Metadata } from "next";

import ReviewStep from "@/components/booking/review-step";

export const metadata: Metadata = { title: "Voyage | Review booking" };

export default async function Page({ params }: PageProps<"/booking/[offerId]/review">) {
  const { offerId } = await params;
  return <ReviewStep offerId={offerId} />;
}
