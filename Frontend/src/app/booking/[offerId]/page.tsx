import type { Metadata } from "next";

import OfferStep from "@/components/booking/offer-step";

export const metadata: Metadata = { title: "Voyage | Confirm fare" };

const one = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value);

export default async function OfferPage({ params, searchParams }: PageProps<"/booking/[offerId]">) {
  const [{ offerId }, query] = await Promise.all([params, searchParams]);
  return <OfferStep offerId={offerId} expectedAmount={one(query.amount)} expectedCurrency={one(query.currency)} />;
}
