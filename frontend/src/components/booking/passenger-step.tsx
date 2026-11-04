"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import Field from "@/components/ui/field";
import Notice from "@/components/ui/notice";
import { useBookingDraft, type BookingDraft } from "@/lib/booking/draft";
import type { Gender, OrderPassenger, Title } from "@/lib/types";

import StepGate from "./step-gate";

const TITLES: { value: Title; label: string }[] = [
  { value: "mr", label: "Mr" },
  { value: "ms", label: "Ms" },
  { value: "mrs", label: "Mrs" },
  { value: "miss", label: "Miss" },
  { value: "dr", label: "Dr" },
];

type Errors = Partial<Record<keyof OrderPassenger, string>>;

const PHONE = /^\+[1-9]\d{6,14}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalisePhone(value: string) {
  // Accept "+977 980-123 4567" and send "+9779801234567".
  const trimmed = value.trim();
  return (trimmed.startsWith("+") ? "+" : "") + trimmed.replace(/\D/g, "");
}

function validate(passenger: OrderPassenger, today: string): Errors {
  const errors: Errors = {};
  if (!passenger.given_name.trim()) errors.given_name = "Enter the first name shown on the passport or ID.";
  if (!passenger.family_name.trim()) errors.family_name = "Enter the last name shown on the passport or ID.";
  if (!passenger.born_on) errors.born_on = "Enter a date of birth.";
  else if (passenger.born_on >= today) errors.born_on = "Date of birth must be in the past.";
  if (!EMAIL.test(passenger.email)) errors.email = "Enter an email address like name@example.com.";
  if (!PHONE.test(normalisePhone(passenger.phone_number)))
    errors.phone_number = "Use international format with the country code, like +977 9801234567.";
  return errors;
}

function blank(id: string): OrderPassenger {
  return { id, title: "mr", gender: "m", given_name: "", family_name: "", born_on: "", email: "", phone_number: "" };
}

function PassengerForm({ draft, offerId }: { draft: BookingDraft; offerId: string }) {
  const router = useRouter();
  const ids = draft.priced!.offer.passengers.map((passenger) => passenger.id);
  const [passengers, setPassengers] = useState<OrderPassenger[]>(() =>
    ids.map((id) => draft.passengers.find((saved) => saved.id === id) ?? blank(id)),
  );
  const [shareContact, setShareContact] = useState(ids.length > 1);
  const [errors, setErrors] = useState<Errors[]>([]);
  const [, updateDraft] = useBookingDraft(offerId);
  const today = new Date().toISOString().slice(0, 10);

  function set(index: number, field: keyof OrderPassenger, value: string) {
    setPassengers((list) => list.map((passenger, i) => (i === index ? { ...passenger, [field]: value } : passenger)));
  }

  function submit(event: React.FormEvent) {
    event.preventDefault();
    const lead = passengers[0];
    const ready = passengers.map((passenger) => ({
      ...passenger,
      given_name: passenger.given_name.trim(),
      family_name: passenger.family_name.trim(),
      email: (shareContact ? lead.email : passenger.email).trim(),
      phone_number: normalisePhone(shareContact ? lead.phone_number : passenger.phone_number),
    }));
    const found = ready.map((passenger) => validate(passenger, today));
    setErrors(found);
    if (found.some((entry) => Object.keys(entry).length)) {
      document.querySelector<HTMLElement>("[aria-invalid=true]")?.focus();
      return;
    }
    updateDraft((current) => ({ ...current, passengers: ready }));
    router.push(`/booking/${offerId}/seats`);
  }

  return (
    <form onSubmit={submit} className="grid gap-6" noValidate>
      <div className="grid gap-2">
        <h1 className="page-title">Who&apos;s travelling?</h1>
        <p className="text-slate">Enter names exactly as they appear on each traveller&apos;s passport or ID.</p>
      </div>

      {passengers.map((passenger, index) => {
        const error = errors[index] ?? {};
        const showContact = index === 0 || !shareContact;
        return (
          <fieldset key={passenger.id} className="panel grid gap-5 p-5 sm:p-6">
            <legend className="sr-only">Adult {index + 1}</legend>
            <p className="font-serif text-xl" aria-hidden="true">
              Adult {index + 1}
              {index === 0 && ids.length > 1 && <span className="font-sans text-sm text-slate"> · lead contact</span>}
            </p>

            <div className="grid gap-4 sm:grid-cols-[110px_1fr_1fr]">
              <Field label="Title">
                <select className="field-input" value={passenger.title} onChange={(event) => set(index, "title", event.target.value)}>
                  {TITLES.map((title) => (
                    <option key={title.value} value={title.value}>
                      {title.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="First and middle names" error={error.given_name}>
                <input
                  className="field-input"
                  value={passenger.given_name}
                  autoComplete={index === 0 ? "given-name" : "off"}
                  aria-invalid={Boolean(error.given_name)}
                  onChange={(event) => set(index, "given_name", event.target.value)}
                />
              </Field>
              <Field label="Last name" error={error.family_name}>
                <input
                  className="field-input"
                  value={passenger.family_name}
                  autoComplete={index === 0 ? "family-name" : "off"}
                  aria-invalid={Boolean(error.family_name)}
                  onChange={(event) => set(index, "family_name", event.target.value)}
                />
              </Field>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Date of birth" error={error.born_on}>
                <input
                  className="field-input"
                  type="date"
                  max={today}
                  value={passenger.born_on}
                  aria-invalid={Boolean(error.born_on)}
                  onChange={(event) => set(index, "born_on", event.target.value)}
                />
              </Field>
              <fieldset className="field-label">
                <legend className="mb-1.5">Gender (as on passport)</legend>
                <div className="flex h-11 gap-2">
                  {(["f", "m"] as Gender[]).map((gender) => (
                    <label
                      key={gender}
                      className={`flex flex-1 cursor-pointer items-center justify-center rounded-xl border text-sm font-semibold has-focus-visible:outline-2 has-focus-visible:outline-forest ${
                        passenger.gender === gender ? "border-forest bg-forest text-cream" : "border-line bg-paper text-ink hover:bg-mist"
                      }`}
                    >
                      <input
                        type="radio"
                        className="sr-only"
                        name={`gender-${passenger.id}`}
                        checked={passenger.gender === gender}
                        onChange={() => set(index, "gender", gender)}
                      />
                      {gender === "f" ? "Female" : "Male"}
                    </label>
                  ))}
                </div>
              </fieldset>
            </div>

            {showContact && (
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Email" error={error.email} hint="The airline sends changes here.">
                  <input
                    className="field-input"
                    type="email"
                    value={passenger.email}
                    autoComplete={index === 0 ? "email" : "off"}
                    aria-invalid={Boolean(error.email)}
                    onChange={(event) => set(index, "email", event.target.value)}
                  />
                </Field>
                <Field label="Mobile number" error={error.phone_number} hint="Include the country code, e.g. +977.">
                  <input
                    className="field-input"
                    type="tel"
                    value={passenger.phone_number}
                    placeholder="+977 9801234567"
                    autoComplete={index === 0 ? "tel" : "off"}
                    aria-invalid={Boolean(error.phone_number)}
                    onChange={(event) => set(index, "phone_number", event.target.value)}
                  />
                </Field>
              </div>
            )}

            {index === 0 && ids.length > 1 && (
              <label className="flex cursor-pointer items-center gap-2.5 text-sm">
                <input
                  type="checkbox"
                  className="size-4 accent-forest"
                  checked={shareContact}
                  onChange={(event) => setShareContact(event.target.checked)}
                />
                Use these contact details for every traveller
              </label>
            )}
          </fieldset>
        );
      })}

      {errors.some((entry) => Object.keys(entry).length) && (
        <Notice tone="error">Some details need fixing. The fields are marked above.</Notice>
      )}

      <div className="flex justify-end">
        <button type="submit" className="btn btn-primary">
          Continue to seats
        </button>
      </div>
    </form>
  );
}

export default function PassengerStep({ offerId }: { offerId: string }) {
  const [draft] = useBookingDraft(offerId);
  return (
    <StepGate draft={draft} offerId={offerId}>
      {(ready) => <PassengerForm draft={ready} offerId={offerId} />}
    </StepGate>
  );
}
