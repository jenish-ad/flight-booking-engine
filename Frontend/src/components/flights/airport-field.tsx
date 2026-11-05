"use client";

import { useEffect, useId, useRef, useState } from "react";

import type { Place, PlaceSearchResponse } from "@/lib/types";

interface Option {
  code: string;
  title: string;
  detail: string;
  nested: boolean;
}

function toOptions(places: Place[]): Option[] {
  return places.flatMap((place) => {
    const own: Option = {
      code: place.iata_code,
      title: place.type === "city" ? `${place.name} (all airports)` : place.name,
      detail: [place.city_name, place.iata_country_code].filter(Boolean).join(", "),
      nested: false,
    };
    const airports = place.type === "city"
      ? place.airports.map((airport) => ({
        code: airport.iata_code,
        title: airport.name,
        detail: place.name,
        nested: true,
      }))
      : [];
    return [own, ...airports];
  });
}

const CODE = /^[A-Za-z]{3}$/;

export default function AirportField({
  label,
  name,
  defaultCode = "",
  className = "search-field",
  inputClassName = "search-input",
  dropUp = false,
}: {
  label: string;
  name: string;
  defaultCode?: string;
  className?: string;
  inputClassName?: string;
  dropUp?: boolean;
}) {
  const listId = useId();
  const input = useRef<HTMLInputElement>(null);
  const [text, setText] = useState(defaultCode);
  const [code, setCode] = useState(defaultCode.toUpperCase());
  const [options, setOptions] = useState<Option[]>([]);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const query = text.trim();
    if (!open || query.length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/places?query=${encodeURIComponent(query)}`, { signal: controller.signal });
        if (!response.ok) throw new Error();
        const body = (await response.json()) as PlaceSearchResponse;
        setOptions(toOptions(body.places).slice(0, 8));
        setActive(-1);
      } catch {
        if (!controller.signal.aborted) setOptions([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 220);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [text, open]);

  useEffect(() => {
    input.current?.setCustomValidity(CODE.test(code) ? "" : "Pick an airport from the list or type its 3-letter code.");
  }, [code]);

  function choose(option: Option) {
    setText(`${option.title.replace(" (all airports)", "")} (${option.code})`);
    setCode(option.code);
    setOpen(false);
  }

  function onChange(value: string) {
    setText(value);
    setOpen(true);
    setCode(CODE.test(value.trim()) ? value.trim().toUpperCase() : "");
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || !options.length) return;
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const step = event.key === "ArrowDown" ? 1 : -1;
      setActive((index) => (index + step + options.length) % options.length);
    } else if (event.key === "Enter" && active >= 0) {
      event.preventDefault();
      choose(options[active]);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  const showList = open && text.trim().length >= 2 && (options.length > 0 || loading);

  return (
    <label className={`${className} relative`}>
      {label}
      <input
        ref={input}
        className={inputClassName}
        value={text}
        placeholder="City or airport"
        autoComplete="off"
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
        required
        onChange={(event) => onChange(event.target.value)}
        onFocus={() => text.trim().length >= 2 && setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 120)}
        onKeyDown={onKeyDown}
      />
      <input type="hidden" name={name} value={code} />
      {showList && (
        <ul
          id={listId}
          role="listbox"
          className={`absolute left-0 z-30 grid ${dropUp ? "bottom-full mb-1" : "top-full mt-1"} max-h-80 w-[max(100%,320px)] overflow-y-auto rounded-xl border border-line bg-paper p-1.5 text-left shadow-[0_18px_40px_-20px_#243b4973]`}
        >
          {loading && !options.length && <li className="px-3 py-2.5 text-sm font-normal text-slate">Searching…</li>}
          {options.map((option, index) => (
            <li
              key={`${option.code}-${index}`}
              id={`${listId}-${index}`}
              role="option"
              aria-selected={index === active}
              onMouseDown={(event) => {
                event.preventDefault();
                choose(option);
              }}
              onMouseEnter={() => setActive(index)}
              className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg py-2.5 pr-3 ${option.nested ? "pl-7" : "pl-3"} ${index === active ? "bg-mist" : ""}`}
            >
              <span className="grid min-w-0">
                <span className="truncate text-sm font-semibold text-ink">{option.title}</span>
                {option.detail && <span className="truncate text-xs font-normal text-slate">{option.detail}</span>}
              </span>
              <span className="shrink-0 rounded-md bg-cream px-2 py-1 text-xs font-bold tracking-wide text-forest">{option.code}</span>
            </li>
          ))}
        </ul>
      )}
    </label>
  );
}
