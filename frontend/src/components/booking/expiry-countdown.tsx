"use client";

import { useEffect, useState } from "react";

export function useSecondsLeft(expiresAt: string | null | undefined) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!expiresAt) return;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [expiresAt]);
  if (!expiresAt) return null;
  return Math.max(0, Math.floor((Date.parse(expiresAt) - now) / 1000));
}

export default function ExpiryCountdown({ expiresAt }: { expiresAt: string }) {
  const seconds = useSecondsLeft(expiresAt);
  if (seconds === null) return null;
  if (seconds === 0) return <p className="text-sm font-semibold text-danger">This fare has expired.</p>;
  const minutes = Math.floor(seconds / 60);
  const label = minutes >= 60 ? `${Math.floor(minutes / 60)}h ${minutes % 60}m` : `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
  return (
    <p className={`text-sm ${seconds < 300 ? "font-semibold text-clay" : "text-slate"}`}>
      Fare held for <span className="tabular-nums">{label}</span>
    </p>
  );
}
