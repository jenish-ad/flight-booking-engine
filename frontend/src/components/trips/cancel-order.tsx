"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useSecondsLeft } from "@/components/booking/expiry-countdown";
import Notice from "@/components/ui/notice";
import { api, ApiError, loginUrl } from "@/lib/api/client";
import { formatMoney, instant } from "@/lib/format";
import type { OrderCancellation } from "@/lib/types";

const REFUND_TO: Record<string, string> = {
  balance: "the Voyage account balance",
  original_form_of_payment: "the original payment method",
  voucher: "an airline voucher",
  airline_credits: "airline credit",
  arc_bsp_cash: "the original payment method",
};

export default function CancelOrder({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [quote, setQuote] = useState<OrderCancellation | null>(null);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function run<T>(request: () => Promise<T>) {
    setPending(true);
    setError("");
    try {
      return await request();
    } catch (caught) {
      if (caught instanceof ApiError && caught.status === 401) router.replace(loginUrl());
      setError(caught instanceof Error ? caught.message : "Something went wrong.");
      return null;
    } finally {
      setPending(false);
    }
  }

  async function requestQuote() {
    const result = await run(() => api<OrderCancellation>(`/orders/${orderId}/cancellations`, { method: "POST" }));
    if (result) setQuote(result);
  }

  async function confirm() {
    if (!quote) return;
    const result = await run(() =>
      api<OrderCancellation>(`/orders/${orderId}/cancellations/${quote.id}/confirm`, { method: "POST" }),
    );
    if (result) {
      setQuote(null);
      router.refresh();
    }
  }

  const secondsLeft = useSecondsLeft(quote?.expires_at);
  const expired = secondsLeft === 0;

  return (
    <section className="panel grid gap-4 p-6">
      <div className="grid gap-1">
        <h2 className="font-serif text-2xl">Cancel this trip</h2>
        <p className="text-sm text-slate">
          See what the airline will refund first. Nothing is cancelled until you confirm.
        </p>
      </div>

      {error && <Notice tone="error">{error}</Notice>}

      {quote ? (
        <div className="grid gap-4 rounded-xl border border-[#e3b8ac] bg-danger-soft p-4">
          <p className="text-sm">
            {quote.refund_amount !== null && quote.refund_currency ? (
              <>
                Refund: <strong className="tabular-nums">{formatMoney(quote.refund_amount, quote.refund_currency)}</strong>
                {quote.refund_to && ` to ${REFUND_TO[quote.refund_to] ?? quote.refund_to.replace(/_/g, " ")}`}.
              </>
            ) : (
              "The airline hasn't said how much it will refund."
            )}{" "}
            {expired ? "This quote has expired." : `Confirm before ${instant(quote.expires_at, { timeStyle: "short" })}.`}
          </p>
          <div className="flex flex-wrap gap-3">
            {expired ? (
              <button type="button" className="btn btn-secondary" disabled={pending} onClick={requestQuote}>
                Get a new quote
              </button>
            ) : (
              <button type="button" className="btn btn-danger" disabled={pending} onClick={confirm}>
                {pending ? "Cancelling…" : "Cancel trip"}
              </button>
            )}
            <button type="button" className="btn btn-ghost" disabled={pending} onClick={() => setQuote(null)}>
              Keep my booking
            </button>
          </div>
        </div>
      ) : (
        <button type="button" className="btn btn-secondary justify-self-start" disabled={pending} onClick={requestQuote}>
          {pending ? "Asking the airline…" : "See refund amount"}
        </button>
      )}
    </section>
  );
}
