"use client";

import Link from "next/link";
import { useState } from "react";

import Field from "@/components/ui/field";
import Notice from "@/components/ui/notice";

const MIN_PASSWORD = 8;

export default function AuthForm({ mode, next }: { mode: "login" | "register"; next: string }) {
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const isRegister = mode === "register";

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "").trim().toLowerCase();
    const password = String(form.get("password") ?? "");

    if (isRegister && password !== form.get("confirm")) {
      setError("The two passwords don't match.");
      return;
    }

    setPending(true);
    setError("");
    const response = await fetch(isRegister ? "/api/auth/register" : "/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    }).catch(() => null);

    if (!response?.ok) {
      const body = await response?.json().catch(() => null);
      setError(body?.detail ?? "The booking service is not reachable. Try again in a moment.");
      setPending(false);
      return;
    }
    // Reload the page so server components pick up the new session cookie.
    window.location.assign(next);
  }

  const otherHref = `${isRegister ? "/login" : "/register"}${next !== "/" ? `?next=${encodeURIComponent(next)}` : ""}`;

  return (
    <form onSubmit={submit} className="grid gap-5">
      <div className="grid gap-2">
        <h1 className="font-serif text-4xl leading-tight">{isRegister ? "Create your account" : "Sign in"}</h1>
        <p className="text-sm text-slate">
          {isRegister ? "You need an account to hold a price, choose seats and book." : "Sign in to book flights and manage your trips."}
        </p>
      </div>

      {error && <Notice tone="error">{error}</Notice>}

      <Field label="Email">
        <input className="field-input" type="email" name="email" autoComplete="email" required autoFocus />
      </Field>
      <Field label="Password" hint={isRegister ? `At least ${MIN_PASSWORD} characters.` : undefined}>
        <input
          className="field-input"
          type="password"
          name="password"
          autoComplete={isRegister ? "new-password" : "current-password"}
          minLength={isRegister ? MIN_PASSWORD : undefined}
          required
        />
      </Field>
      {isRegister && (
        <Field label="Confirm password">
          <input className="field-input" type="password" name="confirm" autoComplete="new-password" required />
        </Field>
      )}

      <button type="submit" className="btn btn-primary w-full" disabled={pending}>
        {pending ? (isRegister ? "Creating account…" : "Signing in…") : isRegister ? "Create account" : "Sign in"}
      </button>

      <p className="text-sm text-slate">
        {isRegister ? "Already have an account? " : "New to Voyage? "}
        <Link href={otherHref} className="font-semibold text-forest underline underline-offset-4">
          {isRegister ? "Sign in" : "Create an account"}
        </Link>
      </p>
    </form>
  );
}
