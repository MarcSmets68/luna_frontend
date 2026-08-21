"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createOfferte } from "@/lib/api-client";
import {
  EMPTY_OFFERTE_FORM,
  OfferteFormFields,
  buildOffertePayload,
  type OfferteFormFieldErrors,
  type OfferteFormValues,
} from "./offerte-form-fields";

/**
 * Header-only create form - offertelijnen require an existing offnr, so
 * lines are only editable from `OfferteEditPage` after the offerte itself
 * has been created. On success this navigates straight into edit mode for
 * the newly created (server-allocated) offnr/versie 1.
 */
export function OfferteCreatePage() {
  const router = useRouter();
  const [form, setForm] = useState<OfferteFormValues>(EMPTY_OFFERTE_FORM);
  const [errors, setErrors] = useState<OfferteFormFieldErrors>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setField = <K extends keyof OfferteFormValues>(key: K, value: OfferteFormValues[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  async function handleSave() {
    const result = buildOffertePayload(form);
    if (result.errors) {
      setErrors(result.errors);
      return;
    }
    setErrors({});

    setSaving(true);
    setError(null);
    try {
      // No offnr/versie in the payload on purpose - the server
      // auto-allocates both (dual-mode create, see backend-coder's
      // parallel contract change).
      const created = await createOfferte(result.payload);
      router.push(`/offertes/${created.offnr}/1/bewerken`);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Er ging iets mis bij het aanmaken van de offerte."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <Link
        href="/offertes/alle"
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "mb-3 -ml-2.5")}
      >
        <ArrowLeft />
        Terug naar overzicht
      </Link>
      <div className="mb-1.5 text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
        Offertes
      </div>
      <div className="mb-6 flex items-baseline justify-between">
        <h1 className="text-[26px] font-bold text-foreground">Nieuwe offerte</h1>
      </div>

      <Card className="mb-6">
        <CardContent>
          <OfferteFormFields form={form} onChange={setField} errors={errors} />

          {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

          <div className="mt-6 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/offertes/alle")}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleSave} disabled={saving}>
              {saving ? "Bezig..." : "Save"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
