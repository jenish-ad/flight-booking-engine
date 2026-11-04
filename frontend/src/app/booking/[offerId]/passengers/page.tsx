import type { Metadata } from "next";

import PassengerStep from "@/components/booking/passenger-step";

export const metadata: Metadata = { title: "Voyage | Travellers" };

export default async function Page({ params }: PageProps<"/booking/[offerId]/passengers">) {
  const { offerId } = await params;
  return <PassengerStep offerId={offerId} />;
}
