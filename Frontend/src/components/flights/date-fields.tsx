"use client";

import { useSyncExternalStore } from "react";

function localDate() {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${today.getFullYear()}-${month}-${day}`;
}

const subscribe = () => () => {};

export default function DateFields({
  defaultValue = "",
  className = "search-field",
  inputClassName = "search-input",
}: {
  defaultValue?: string;
  className?: string;
  inputClassName?: string;
}) {
  const today = useSyncExternalStore(subscribe, localDate, () => undefined);

  return (
    <label className={className}>
      Depart
      <input className={inputClassName} type="date" name="departure" required min={today} defaultValue={defaultValue} />
    </label>
  );
}
