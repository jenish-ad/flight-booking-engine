"use client";

import { useCallback, useSyncExternalStore } from "react";

import { addMoney } from "../format";
import type { OrderPassenger, PriceConfirmResponse } from "../types";

export interface SelectedSeat {
  serviceId: string;
  designator: string;
  amount: string;
  currency: string;
}

export interface BookingDraft {
  offerId: string;
  priced: PriceConfirmResponse | null;
  seats: Record<string, Record<string, SelectedSeat>>;
  seatsReviewed: boolean;
  passengers: OrderPassenger[];
}

const PREFIX = "voyage:booking:";
const listeners = new Set<() => void>();
const parsed = new Map<string, { raw: string | null; value: BookingDraft | null }>();

function key(offerId: string) {
  return PREFIX + offerId;
}

function read(offerId: string): BookingDraft | null {
  let raw: string | null = null;
  try {
    raw = window.sessionStorage.getItem(key(offerId));
  } catch {
    raw = null;
  }
  const cached = parsed.get(offerId);
  if (cached && cached.raw === raw) return cached.value;
  let value: BookingDraft | null = null;
  if (raw) {
    try {
      value = JSON.parse(raw) as BookingDraft;
    } catch {
      value = null;
    }
  }
  parsed.set(offerId, { raw, value });
  return value;
}

function emptyDraft(offerId: string): BookingDraft {
  return { offerId, priced: null, seats: {}, seatsReviewed: false, passengers: [] };
}

export function writeDraft(offerId: string, update: (draft: BookingDraft) => BookingDraft) {
  const next = update(read(offerId) ?? emptyDraft(offerId));
  try {
    window.sessionStorage.setItem(key(offerId), JSON.stringify(next));
  } catch {
    parsed.set(offerId, { raw: JSON.stringify(next), value: next });
  }
  listeners.forEach((listener) => listener());
}

export function clearDraft(offerId: string) {
  try {
    window.sessionStorage.removeItem(key(offerId));
  } catch {}
  parsed.delete(offerId);
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (event: StorageEvent) => {
    if (event.key?.startsWith(PREFIX)) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

export function useBookingDraft(offerId: string) {
  const draft = useSyncExternalStore(
    subscribe,
    () => read(offerId),
    () => undefined,
  );
  const update = useCallback((fn: (draft: BookingDraft) => BookingDraft) => writeDraft(offerId, fn), [offerId]);
  return [draft, update] as const;
}

export function selectedSeatList(draft: BookingDraft) {
  return Object.entries(draft.seats).flatMap(([segmentId, byPassenger]) =>
    Object.entries(byPassenger).map(([passengerId, seat]) => ({ segmentId, passengerId, ...seat })),
  );
}

export function seatsTotal(draft: BookingDraft) {
  return addMoney(...selectedSeatList(draft).map((seat) => seat.amount));
}
