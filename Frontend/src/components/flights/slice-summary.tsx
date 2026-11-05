import { airportCode, dayShift, formatDuration, sliceMinutes, stopsLabel, wallDate, wallTime } from "@/lib/format";
import type { FlightSlice } from "@/lib/types";

export default function SliceSummary({ slice, showDate = false }: { slice: FlightSlice; showDate?: boolean }) {
  const shift = dayShift(slice.departing_at, slice.arriving_at);
  const connections = slice.segments.slice(0, -1).map((segment) => airportCode(segment.destination));

  return (
    <div className="grid grid-cols-[auto_1fr_auto] items-center gap-3 sm:gap-5">
      <div className="grid">
        <span className="font-serif text-[28px] leading-none font-medium tabular-nums sm:text-[32px]">{wallTime(slice.departing_at)}</span>
        <span className="mt-1.5 text-xs font-semibold text-slate">
          {airportCode(slice.origin)}
          {showDate && <span className="font-normal"> · {wallDate(slice.departing_at)}</span>}
        </span>
      </div>

      <div className="grid min-w-0 justify-items-center gap-1.5 text-center">
        <span className="text-xs font-medium text-slate">{formatDuration(sliceMinutes(slice))}</span>
        <span className="relative flex h-3 w-full items-center" aria-hidden="true">
          <span className="h-px w-full border-t border-dashed border-sage/60" />
          {connections.length > 0 && (
            <span className="absolute inset-x-0 flex justify-evenly">
              {connections.map((code) => (
                <span key={code} className="size-2 rounded-full border-2 border-clay bg-paper" />
              ))}
            </span>
          )}
          <span className="absolute -right-0.5 size-1.5 rotate-45 border-t border-r border-sage" />
        </span>
        <span className={`text-xs font-semibold ${slice.stops ? "text-clay" : "text-forest"}`}>
          {stopsLabel(slice.stops)}
          {connections.length > 0 && <span className="font-normal text-slate"> via {connections.join(", ")}</span>}
        </span>
      </div>

      <div className="grid justify-items-end">
        <span className="font-serif text-[28px] leading-none font-medium tabular-nums sm:text-[32px]">
          {wallTime(slice.arriving_at)}
          {shift > 0 && <sup className="ml-0.5 font-sans text-[11px] font-semibold text-clay">+{shift}</sup>}
        </span>
        <span className="mt-1.5 text-xs font-semibold text-slate">{airportCode(slice.destination)}</span>
      </div>
    </div>
  );
}
