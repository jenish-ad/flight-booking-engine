"use client";

import { Fragment, useState } from "react";

import type { SelectedSeat } from "@/lib/booking/draft";
import { cabinLabel, formatMoney } from "@/lib/format";
import type { SeatMap as SeatMapData, SeatMapCabin, SeatMapElement, SeatService } from "@/lib/types";

export interface SeatPassenger {
  id: string;
  label: string;
  initials: string;
}

interface Props {
  seatMap: SeatMapData;
  passengers: SeatPassenger[];
  activePassengerId: string;
  selections: Record<string, SelectedSeat>;
  onSelect: (passengerId: string, seat: SelectedSeat | null) => void;
}

const FACILITY_LABELS: Record<string, { short: string; name: string }> = {
  lavatory: { short: "WC", name: "Lavatory" },
  galley: { short: "G", name: "Galley" },
  closet: { short: "C", name: "Closet" },
  stairs: { short: "S", name: "Stairs" },
  bassinet: { short: "B", name: "Bassinet position" },
};

const rowNumber = (designator: string | null) => designator?.match(/^\d+/)?.[0] ?? "";
const columnLetter = (designator: string | null) => designator?.replace(/^\d+/, "") ?? "";

function columnHeaders(cabin: SeatMapCabin) {
  const widest = cabin.rows.reduce(
    (best, row) => (row.sections.flat().filter((element) => element.type === "seat").length > best.count
      ? { row, count: row.sections.flat().filter((element) => element.type === "seat").length }
      : best),
    { row: cabin.rows[0], count: -1 },
  ).row;
  return widest?.sections.map((section) =>
    section.map((element) => ({
      letter: element.type === "seat" ? columnLetter(element.designator) : "",
      narrow: element.type === "exit_row",
    })),
  );
}

function seatPrice(service: SeatService) {
  return Number(service.total_amount) ? formatMoney(service.total_amount, service.total_currency) : "Free";
}

export default function SeatMap({ seatMap, passengers, activePassengerId, selections, onSelect }: Props) {
  const [focused, setFocused] = useState<SeatMapElement | null>(null);
  const holder = (designator: string | null) =>
    Object.entries(selections).find(([, seat]) => seat.designator === designator)?.[0];
  const byId = Object.fromEntries(passengers.map((passenger) => [passenger.id, passenger]));
  const active = byId[activePassengerId];

  function toggle(element: SeatMapElement, service: SeatService | undefined) {
    const heldBy = holder(element.designator);
    if (heldBy === activePassengerId) return onSelect(activePassengerId, null);
    if (!service || heldBy) return;
    onSelect(activePassengerId, {
      serviceId: service.id,
      designator: element.designator ?? "",
      amount: service.total_amount,
      currency: service.total_currency,
    });
  }

  function renderElement(element: SeatMapElement, key: string) {
    if (element.type === "seat") {
      const service = element.available_services.find((entry) => entry.passenger_id === activePassengerId);
      const heldBy = holder(element.designator);
      const mine = heldBy === activePassengerId;
      const taken = !service && !mine;
      const paid = service && Number(service.total_amount) > 0;

      let tone = "border-forest/35 bg-paper text-forest hover:border-forest hover:bg-ok-soft";
      if (paid) tone = "border-clay/60 bg-paper text-clay hover:border-clay hover:bg-warn-soft";
      if (heldBy && !mine) tone = "border-sage bg-sage text-cream";
      if (mine) tone = "border-forest bg-forest text-cream shadow-[0_4px_10px_-4px_#203b35]";
      if (taken && !heldBy) tone = "border-line bg-[repeating-linear-gradient(135deg,#ece6d8_0_3px,#f6f2e8_3px_7px)] text-transparent";

      const status = mine
        ? `selected for ${active?.label}`
        : heldBy
          ? `taken by ${byId[heldBy]?.label}`
          : service
            ? seatPrice(service)
            : "not available";

      return (
        <button
          key={key}
          type="button"
          disabled={(taken || Boolean(heldBy)) && !mine}
          aria-pressed={mine}
          aria-label={`Seat ${element.designator}, ${status}`}
          title={`${element.designator} · ${status}`}
          onClick={() => toggle(element, service)}
          onFocus={() => setFocused(element)}
          onMouseEnter={() => setFocused(element)}
          className={`grid size-7 shrink-0 cursor-pointer place-items-center rounded-t-xl rounded-b border-[1.5px] text-[10px] font-bold transition-[background-color,border-color,transform] duration-150 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-clay disabled:cursor-not-allowed sm:size-9 sm:text-[11px] motion-reduce:transition-none ${tone} ${mine ? "scale-105" : ""}`}
        >
          {heldBy ? byId[heldBy]?.initials : paid ? "•" : ""}
        </button>
      );
    }

    if (element.type === "exit_row") {
      return (
        <span key={key} className="relative -mx-0.5 h-7 w-0 shrink-0 sm:-mx-0.5 sm:h-9" title="Emergency exit">
          <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[11px] font-bold text-clay" aria-hidden="true">
            ⟷
          </span>
          <span className="sr-only">Emergency exit</span>
        </span>
      );
    }

    const facility = FACILITY_LABELS[element.type];
    if (facility) {
      return (
        <span
          key={key}
          title={facility.name}
          className="grid size-7 shrink-0 place-items-center rounded-md bg-mist text-[9px] font-bold text-slate sm:size-9 sm:text-[10px]"
        >
          {facility.short}
        </span>
      );
    }

    return <span key={key} className="size-7 shrink-0 sm:size-9" aria-hidden="true" />;
  }

  const focusedService = focused?.available_services.find((entry) => entry.passenger_id === activePassengerId);

  return (
    <div className="grid gap-4">
      <div className="overflow-x-auto pb-2">
        <div className="mx-auto w-max px-8">
          {seatMap.cabins.map((cabin, cabinIndex) => {
            const headers = columnHeaders(cabin);
            return (
              <div key={`${cabin.deck}-${cabinIndex}`} className="grid justify-items-center">
                {cabinIndex === 0 && (
                  <div className="h-20 w-full rounded-t-[50%_100%] border-x-2 border-t-2 border-line bg-paper sm:h-28" aria-hidden="true">
                    <div className="mx-auto mt-8 flex w-16 justify-between sm:mt-12">
                      <span className="h-2 w-5 -rotate-12 rounded-sm bg-line" />
                      <span className="h-2 w-5 rotate-12 rounded-sm bg-line" />
                    </div>
                  </div>
                )}
                <div className="w-full border-x-2 border-line bg-paper px-3 pb-6 sm:px-5">
                  <p className="border-t border-dashed border-line-dashed py-3 text-center text-xs font-semibold text-slate">
                    {cabinLabel(cabin.cabin_class)}
                    {seatMap.cabins.some((other) => other.deck !== cabin.deck) && `, ${cabin.deck ? "upper" : "main"} deck`}
                  </p>

                  {headers && (
                    <div className="mb-1 flex items-center gap-1 sm:gap-1.5" aria-hidden="true">
                      <span className="w-6 shrink-0" />
                      {headers.map((section, sectionIndex) => (
                        <Fragment key={sectionIndex}>
                          {sectionIndex > 0 && <span className="w-5 shrink-0 sm:w-7" />}
                          {section.map((column, index) => (
                            <span
                              key={index}
                              className={`shrink-0 text-center text-[11px] font-semibold text-slate ${column.narrow ? "-mx-0.5 w-0 sm:-mx-0.5" : "w-7 sm:w-9"}`}
                            >
                              {column.letter}
                            </span>
                          ))}
                        </Fragment>
                      ))}
                    </div>
                  )}

                  <div className="grid gap-1 sm:gap-1.5">
                    {cabin.rows.map((row, rowIndex) => {
                      const number = rowNumber(row.sections.flat().find((element) => element.designator)?.designator ?? null);
                      const overWing = cabin.wings && rowIndex >= cabin.wings.first_row_index && rowIndex <= cabin.wings.last_row_index;
                      return (
                        <div key={rowIndex} className="relative flex items-center gap-1 sm:gap-1.5">
                          {overWing && (
                            <>
                              <span className="absolute top-0 -left-[30px] h-full w-2.5 bg-line sm:-left-[34px]" aria-hidden="true" />
                              <span className="absolute top-0 -right-[30px] h-full w-2.5 bg-line sm:-right-[34px]" aria-hidden="true" />
                            </>
                          )}
                          <span className="w-6 shrink-0 text-right text-[11px] font-semibold text-slate tabular-nums">{number}</span>
                          {row.sections.map((section, sectionIndex) => (
                            <Fragment key={sectionIndex}>
                              {sectionIndex > 0 && <span className="w-5 shrink-0 sm:w-7" aria-hidden="true" />}
                              {section.map((element, index) => renderElement(element, `${rowIndex}-${sectionIndex}-${index}`))}
                            </Fragment>
                          ))}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
          <div className="h-10 w-full rounded-b-3xl border-x-2 border-b-2 border-line bg-paper" aria-hidden="true" />
        </div>
      </div>

      <p className="min-h-5 text-center text-sm text-slate" aria-live="polite">
        {focused?.designator && (
          <>
            <span className="font-semibold text-ink">Seat {focused.designator}</span>
            {focusedService ? `: ${seatPrice(focusedService)}` : holder(focused.designator) ? "" : ": not available"}
            {focused.disclosures.length > 0 && <span className="block text-xs">{focused.disclosures.join(" · ")}</span>}
          </>
        )}
      </p>

      <ul className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-slate">
        <li className="flex items-center gap-2">
          <span className="size-4 rounded-t-md rounded-b-sm border-[1.5px] border-forest/35 bg-paper" /> Free
        </li>
        <li className="flex items-center gap-2">
          <span className="size-4 rounded-t-md rounded-b-sm border-[1.5px] border-clay/60 bg-paper" /> Extra charge
        </li>
        <li className="flex items-center gap-2">
          <span className="size-4 rounded-t-md rounded-b-sm bg-forest" /> {active?.label ?? "Selected"}
        </li>
        <li className="flex items-center gap-2">
          <span className="size-4 rounded-t-md rounded-b-sm bg-sage" /> Other traveller
        </li>
        <li className="flex items-center gap-2">
          <span className="size-4 rounded-t-md rounded-b-sm border border-line bg-[repeating-linear-gradient(135deg,#ece6d8_0_2px,#f6f2e8_2px_5px)]" /> Unavailable
        </li>
      </ul>
    </div>
  );
}
