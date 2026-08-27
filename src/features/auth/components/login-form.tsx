"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export type LoginFormValues = { kode: string; password: string };

type FieldErrors = { kode?: string; password?: string };

type LoginFormProps = {
  /** Called only once client-side validation passes. */
  onSubmit: (values: LoginFormValues) => void;
  /** Disables the submit button and inputs, prevents double-submit. */
  isSubmitting: boolean;
  /**
   * Generic server-side error (401/403/400), rendered above the fields.
   * Exact texts come from the backend contract - see
   * docs/architecture/login-auth-ontwerp.md §1.7.
   */
  serverError: string | null;
};

export function LoginForm({ onSubmit, isSubmitting, serverError }: LoginFormProps) {
  const [kode, setKode] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isSubmitting) return;

    const errors: FieldErrors = {};
    if (!kode.trim()) errors.kode = "Gebruikerskode is verplicht";
    if (!password.trim()) errors.password = "Wachtwoord is verplicht";
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) return;

    onSubmit({ kode: kode.trim(), password });
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {serverError && (
        <p
          role="alert"
          className="mb-4 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {serverError}
        </p>
      )}

      <div className="mb-4">
        <label className="text-[11px] font-semibold tracking-[0.04em] text-muted-foreground uppercase">
          Gebruikerskode
          <Input
            type="text"
            value={kode}
            onChange={(e) => setKode(e.target.value)}
            className="mt-1 font-normal normal-case"
            aria-invalid={Boolean(fieldErrors.kode)}
            disabled={isSubmitting}
            autoComplete="username"
          />
        </label>
        {fieldErrors.kode && (
          <p className="mt-1 text-sm text-destructive">{fieldErrors.kode}</p>
        )}
      </div>

      <div className="mb-6">
        <label className="text-[11px] font-semibold tracking-[0.04em] text-muted-foreground uppercase">
          Wachtwoord
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 font-normal normal-case"
            aria-invalid={Boolean(fieldErrors.password)}
            disabled={isSubmitting}
            autoComplete="current-password"
          />
        </label>
        {fieldErrors.password && (
          <p className="mt-1 text-sm text-destructive">{fieldErrors.password}</p>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Bezig met inloggen..." : "Inloggen"}
      </Button>
    </form>
  );
}
