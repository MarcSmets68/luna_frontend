"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { formatBedrag } from "@/lib/format";
import { deleteOfferte, updateOfferte, type OfferteItem, type OfflijnItem } from "@/lib/api-client";
import {
  OfferteFormFields,
  buildOffertePayload,
  offerteToFormValues,
  type OfferteFormFieldErrors,
  type OfferteFormValues,
} from "./offerte-form-fields";
import { OfferteLijnenEditor } from "./offerte-lijnen-editor";

export function OfferteEditPage({
  offerte,
  lijnen,
}: {
  offerte: OfferteItem;
  lijnen: OfflijnItem[];
}) {
  const router = useRouter();
  const [form, setForm] = useState<OfferteFormValues>(offerteToFormValues(offerte));
  const [errors, setErrors] = useState<OfferteFormFieldErrors>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verloren, setVerloren] = useState(offerte.verloren);
  const [lines, setLines] = useState<OfflijnItem[]>(lijnen);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const setField = <K extends keyof OfferteFormValues>(key: K, value: OfferteFormValues[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  // Plain article lines only - kolomtitel/infolijn carry no amount and
  // subtotaal lines are themselves a (client-computed) sum of preceding
  // lines, so including them here would double-count. Deliberately no
  // btw total - that's explicitly deferred per the Fase 1 design.
  const totaal = lines
    .filter((line) => !line.kolomtitel && !line.infolijn && !line.subtotaal)
    .reduce((sum, line) => sum + line.bedrag, 0);

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
      // `verloren` is deliberately never sent from the edit form - per the
      // Fase 1 design, saving any other field auto-clears it server-side.
      const updated = await updateOfferte(offerte.offnr, offerte.versie, result.payload);
      setVerloren(updated.verloren);
    } catch (e) {
      setError(
        e instanceof Error ? e.message : "Er ging iets mis bij het opslaan van de offerte."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    setDeleting(true);
    setDeleteError(null);
    try {
      await deleteOfferte(offerte.offnr, offerte.versie);
      router.push("/offertes/alle");
    } catch (e) {
      setDeleteError(
        e instanceof Error ? e.message : "Er ging iets mis bij het verwijderen van de offerte."
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div>
      <Link
        href={`/offertes/${offerte.offnr}/${offerte.versie}`}
        className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "mb-3 -ml-2.5")}
      >
        <ArrowLeft />
        Terug naar offerte
      </Link>
      <div className="mb-1.5 text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
        Offertes
      </div>
      <div className="mb-6 flex items-baseline justify-between">
        <h1 className="text-[26px] font-bold text-foreground">
          Offerte {offerte.offnr}/{offerte.versie} bewerken
        </h1>
        <div className="text-[13px] text-[#5e5e5e]">
          Totaal lijnen:{" "}
          <span className="font-semibold" data-testid="offerte-totaal">
            {formatBedrag(totaal)}
          </span>
        </div>
      </div>

      <Card className="mb-6">
        <CardContent>
          <OfferteFormFields form={form} onChange={setField} errors={errors} verloren={verloren} />

          {error && <p className="mt-4 text-sm text-destructive">{error}</p>}

          <div className="mt-6 flex items-center justify-between gap-2">
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Offerte verwijderen</AlertDialogTitle>
                  <AlertDialogDescription>
                    Offerte {offerte.offnr}/{offerte.versie} verwijderen? Dit verwijdert ook alle
                    lijnen en kan niet ongedaan worden gemaakt.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                {deleteError && <p className="text-sm text-destructive">{deleteError}</p>}
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={deleting}>Annuleren</AlertDialogCancel>
                  <AlertDialogAction
                    variant="destructive"
                    onClick={handleDelete}
                    disabled={deleting}
                  >
                    {deleting ? "Bezig..." : "Verwijderen"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button
              type="button"
              variant="destructive"
              onClick={() => setDeleteDialogOpen(true)}
              disabled={saving}
            >
              Offerte verwijderen
            </Button>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => router.push(`/offertes/${offerte.offnr}/${offerte.versie}`)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button type="button" onClick={handleSave} disabled={saving}>
                {saving ? "Bezig..." : "Save"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <OfferteLijnenEditor
        offnr={offerte.offnr}
        versie={offerte.versie}
        lines={lines}
        onLinesChange={setLines}
      />
    </div>
  );
}
