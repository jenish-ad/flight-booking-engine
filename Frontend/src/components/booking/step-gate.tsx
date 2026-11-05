"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import Spinner from "@/components/ui/spinner";
import Notice from "@/components/ui/notice";
import type { BookingDraft } from "@/lib/booking/draft";

import { useSecondsLeft } from "./expiry-countdown";

export default function StepGate({
  draft,
  offerId,
  needsPassengers = false,
  children,
}: {
  draft: BookingDraft | null | undefined;
  offerId: string;
  needsPassengers?: boolean;
  children: (draft: BookingDraft) => ReactNode;
}) {
  const seconds = useSecondsLeft(draft?.priced?.offer.expires_at);

  if (draft === undefined) return <Spinner label="Loading your booking" />;

  if (!draft?.priced) {
    return (
      <Notice
        tone="warning"
        title="Confirm the fare first"
        action={
          <Link href={`/booking/${offerId}`} className="btn btn-secondary">
            Go to step 1
          </Link>
        }
      >
        This booking hasn&apos;t been priced in this browser tab yet.
      </Notice>
    );
  }

  if (seconds === 0) {
    return (
      <Notice
        tone="error"
        title="This fare has expired"
        action={
          <Link href="/#search" className="btn btn-primary">
            Search again
          </Link>
        }
      >
        Airlines only hold a fare for a short time. Search again to get a fresh price.
      </Notice>
    );
  }

  if (needsPassengers && draft.passengers.length !== draft.priced.offer.passengers.length) {
    return (
      <Notice
        tone="warning"
        title="Add traveller details first"
        action={
          <Link href={`/booking/${offerId}/passengers`} className="btn btn-secondary">
            Add travellers
          </Link>
        }
      >
        Seats are assigned per traveller, so we need their names before you choose.
      </Notice>
    );
  }

  return <>{children(draft)}</>;
}
