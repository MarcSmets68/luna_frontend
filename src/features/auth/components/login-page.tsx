"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { login } from "@/lib/api-client";
import { saveSession } from "../session";
import { redirectIfAuthenticated } from "../require-session";
import { LoginForm, type LoginFormValues } from "./login-form";

const DASHBOARD_PATH = "/";

/**
 * Orchestrates the /login screen: form state lives in LoginForm, this
 * component owns the submit call + session write + redirect (server state
 * vs local UI state split per
 * docs/architecture/login-auth-ontwerp.md §4.3).
 */
export function LoginPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Already logged in with a valid session? Skip the login screen
  // entirely - §4.5 (reverse use of require-session.ts).
  useEffect(() => {
    redirectIfAuthenticated(router, DASHBOARD_PATH);
  }, [router]);

  async function handleSubmit(values: LoginFormValues) {
    setIsSubmitting(true);
    setServerError(null);
    try {
      const result = await login(values);
      saveSession(result);
      router.push(DASHBOARD_PATH);
    } catch (e) {
      setServerError(
        e instanceof Error ? e.message : "Inloggen is mislukt. Probeer het opnieuw."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardContent>
          <div className="mb-6 text-center">
            <h1 className="text-[26px] font-bold text-foreground">Nomaled ERP &amp; CRM</h1>
            <p className="mt-1 text-sm text-muted-foreground">Log in om verder te gaan</p>
          </div>
          <LoginForm
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            serverError={serverError}
          />
        </CardContent>
      </Card>
    </div>
  );
}
