import type { CabinClass, FlightSlice } from "./types";

const WALL = /^(\d{4})-(\d\d)-(\d\d)T(\d\d):(\d\d)/;

function wallParts(iso: string) {
  const match = WALL.exec(iso);
  if (!match) return null;
  const [, year, month, day, hour, minute] = match.map(Number);
  return { year, month, day, hour, minute };
}

export function formatMoney(amount: string | number, currency: string) {
  const value = typeof amount === "string" ? Number(amount) : amount;
  try {
    return new Intl.NumberFormat("en", {
      style: "currency",
      currency,
      maximumFractionDigits: 2,
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

export function addMoney(...amounts: (string | number)[]) {
  const total = amounts.reduce<number>(
    (sum, amount) => sum + Math.round(Number(amount) * 1000),
    0,
  );
  return (total / 1000).toFixed(2);
}

export function wallTime(iso: string) {
  const parts = wallParts(iso);
  if (!parts) return "";
  return new Intl.DateTimeFormat("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "UTC",
  }).format(Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute));
}

export function wallDate(
  iso: string,
  options: Intl.DateTimeFormatOptions = {
    weekday: "short",
    day: "numeric",
    month: "short",
  },
) {
  const parts = wallParts(iso);
  if (!parts) return "";
  return new Intl.DateTimeFormat("en-GB", {
    ...options,
    timeZone: "UTC",
  }).format(Date.UTC(parts.year, parts.month - 1, parts.day));
}

export function calendarDate(value: string) {
  return wallDate(`${value}T00:00`, {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function instant(
  iso: string,
  options: Intl.DateTimeFormatOptions = {
    dateStyle: "medium",
    timeStyle: "short",
  },
) {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? iso
    : new Intl.DateTimeFormat("en-GB", options).format(date);
}

function zoneOffsetMs(timeZone: string, utcMs: number) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(utcMs);
  const get = (type: string) =>
    Number(parts.find((part) => part.type === type)?.value);
  return (
    Date.UTC(
      get("year"),
      get("month") - 1,
      get("day"),
      get("hour"),
      get("minute"),
      get("second"),
    ) - utcMs
  );
}

export function toUtcMs(iso: string, timeZone?: string | null) {
  if (/[zZ]|[+-]\d{2}:?\d{2}$/.test(iso)) return Date.parse(iso);
  const parts = wallParts(iso);
  if (!parts) return Date.parse(iso);
  const asUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute);
  if (!timeZone) return asUtc;
  try {
    const first = asUtc - zoneOffsetMs(timeZone, asUtc);
    return asUtc - zoneOffsetMs(timeZone, first);
  } catch {
    return asUtc;
  }
}

export function minutesBetween(
  start: string,
  startZone: string | null | undefined,
  end: string,
  endZone: string | null | undefined,
) {
  return Math.max(
    0,
    Math.round((toUtcMs(end, endZone) - toUtcMs(start, startZone)) / 60000),
  );
}

export function sliceMinutes(slice: FlightSlice) {
  return minutesBetween(
    slice.departing_at,
    slice.origin.time_zone,
    slice.arriving_at,
    slice.destination.time_zone,
  );
}

export function formatDuration(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (!hours) return `${minutes}m`;
  return `${hours}h ${String(minutes).padStart(2, "0")}m`;
}


export function dayShift(departing: string, arriving: string) {
  const a = wallParts(departing);
  const b = wallParts(arriving);
  if (!a || !b) return 0;
  return Math.round(
    (Date.UTC(b.year, b.month - 1, b.day) - Date.UTC(a.year, a.month - 1, a.day)) / 86400000,
  );
}

export function stopsLabel(stops: number) {
  if (stops === 0) return "Direct";
  return stops === 1 ? "1 stop" : `${stops} stops`;
}

export const CABIN_LABELS: Record<CabinClass, string> = {
  economy: "Economy",
  premium_economy: "Premium economy",
  business: "Business",
  first: "First",
};

export function cabinLabel(value: string) {
  return CABIN_LABELS[value as CabinClass] ?? value.replace(/_/g, " ");
}

export function airportCode(airport: { iata_code: string | null }) {
  return airport.iata_code ?? "—";
}
