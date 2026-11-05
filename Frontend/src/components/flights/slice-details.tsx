import { airportCode, formatDuration, minutesBetween, wallDate, wallTime } from "@/lib/format";
import type { FlightSlice } from "@/lib/types";

export default function SliceDetails({ slice }: { slice: FlightSlice }) {
  return (
    <ol className="grid gap-0">
      {slice.segments.map((segment, index) => {
        const next = slice.segments[index + 1];
        const operatedBy =
          segment.operating_carrier.name !== segment.marketing_carrier.name ? segment.operating_carrier.name : null;
        return (
          <li key={segment.id} className="grid gap-0">
            <div className="grid grid-cols-[14px_1fr] gap-x-4">
              <span className="mt-1.5 size-3.5 rounded-full border-2 border-forest bg-paper" aria-hidden="true" />
              <p className="text-sm">
                <span className="font-semibold tabular-nums">{wallTime(segment.departing_at)}</span>{" "}
                <span className="text-slate">{wallDate(segment.departing_at)}</span>
                <span className="block text-ink">
                  {segment.origin.name} ({airportCode(segment.origin)})
                </span>
              </p>

              <span className="mx-auto my-1 w-px bg-line" aria-hidden="true" />
              <p className="py-3 text-xs text-slate">
                {segment.marketing_carrier.name} {segment.marketing_carrier.iata_code}
                {segment.flight_number} ·{" "}
                {formatDuration(
                  minutesBetween(segment.departing_at, segment.origin.time_zone, segment.arriving_at, segment.destination.time_zone),
                )}
                {operatedBy && <span className="block">Operated by {operatedBy}</span>}
              </p>

              <span className="mt-1.5 size-3.5 rounded-full bg-forest" aria-hidden="true" />
              <p className="text-sm">
                <span className="font-semibold tabular-nums">{wallTime(segment.arriving_at)}</span>{" "}
                <span className="text-slate">{wallDate(segment.arriving_at)}</span>
                <span className="block text-ink">
                  {segment.destination.name} ({airportCode(segment.destination)})
                </span>
              </p>
            </div>

            {next && (
              <p className="my-3 ml-7.5 rounded-lg bg-warn-soft px-3 py-2 text-xs font-medium text-[#6b4a12]">
                {formatDuration(
                  minutesBetween(segment.arriving_at, segment.destination.time_zone, next.departing_at, next.origin.time_zone),
                )}{" "}
                layover in {segment.destination.name}
                {airportCode(segment.destination) !== airportCode(next.origin) && ` — change to ${next.origin.name}`}
              </p>
            )}
          </li>
        );
      })}
    </ol>
  );
}
