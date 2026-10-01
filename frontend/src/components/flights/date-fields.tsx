"use client";

import { useState, useSyncExternalStore } from "react";

// Today's date as YYYY-MM-DD in the user's time zone.
function localDate() {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${today.getFullYear()}-${month}-${day}`;
}

const subscribe = () => () => {};

export default function DateFields() {
  // Read on the client only: the home page is prerendered, so a server value would be the build date.
  const today = useSyncExternalStore(subscribe, localDate, () => undefined);
  const [departure, setDeparture] = useState("");
  const [returnDate, setReturnDate] = useState("");

  function changeDeparture(date: string) {
    setDeparture(date);
    if (returnDate && returnDate < date) setReturnDate("");
  }

  return (
    <>
      <label className="search-field">
        Depart
        <input
          className="search-input"
          type="date"
          name="departure"
          required
          min={today}
          value={departure}
          onChange={(event) => changeDeparture(event.target.value)}
        />
      </label>
      <label className="search-field">
        Return
        <input
          className="search-input"
          type="date"
          name="return"
          min={departure || today}
          value={returnDate}
          onChange={(event) => setReturnDate(event.target.value)}
        />
      </label>
    </>
  );
}
