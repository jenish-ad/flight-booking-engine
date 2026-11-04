import type { Metadata } from "next";

import SeatStep from "@/components/booking/seat-step";

export const metadata: Metadata = { title: "Voyage | Choose seats" };

export default async function Page({ params }: PageProps<"/booking/[offerId]/seats">) {
  const { offerId } = await params;
  return <SeatStep offerId={offerId} />;
}
