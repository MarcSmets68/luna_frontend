import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import type { OfferteItem } from "@/lib/api-client";

/**
 * Editable subset of `offerte` shared by the create and edit forms - see
 * the Fase 1 design: `verloren`/`verkocht`/`bedrag`/`btw`/`verkochtdatum`/
 * `besteldatum` are deliberately NOT editable here (verloren is shown
 * read-only in edit mode, the rest are computed/derived elsewhere).
 */
export type OfferteFormValues = {
  naam: string;
  klnr: string;
  adres: string;
  postnr: string;
  stad: string;
  munt: string;
  offgroep: string;
  soort: string;
  datum: string;
  verkoopkans: string;
  uRef: string;
  opm: string;
  passief: boolean;
};

export const EMPTY_OFFERTE_FORM: OfferteFormValues = {
  naam: "",
  klnr: "",
  adres: "",
  postnr: "",
  stad: "",
  munt: "",
  offgroep: "",
  soort: "",
  datum: "",
  verkoopkans: "",
  uRef: "",
  opm: "",
  passief: false,
};

/** yyyy-mm-dd for <input type="date"> - `offerte.datum` comes back as an
    ISO date string (or null) from the backend. */
function toDateInputValue(value: string | null): string {
  if (!value) return "";
  return value.slice(0, 10);
}

export function offerteToFormValues(offerte: OfferteItem): OfferteFormValues {
  return {
    naam: offerte.naam,
    klnr: String(offerte.klnr),
    adres: offerte.adres,
    postnr: offerte.postnr,
    stad: offerte.stad,
    munt: offerte.munt,
    offgroep: offerte.offgroep,
    soort: offerte.soort,
    datum: toDateInputValue(offerte.datum),
    verkoopkans: String(offerte.verkoopkans),
    uRef: offerte.uRef,
    opm: offerte.opm,
    passief: offerte.passief,
  };
}

export type OfferteFormFieldErrors = {
  klnr?: string;
  verkoopkans?: string;
};

/**
 * Validates + converts the free-text form state into the numeric payload
 * shape the API client expects. Returns either `{ payload }` or
 * `{ errors }` (never both) so callers can render field-level messages.
 */
export function buildOffertePayload(
  form: OfferteFormValues
):
  | {
      payload: {
        naam: string;
        klnr: number;
        adres: string;
        postnr: string;
        stad: string;
        munt: string;
        offgroep: string;
        soort: string;
        datum: string | null;
        verkoopkans: number;
        uRef: string;
        opm: string;
        passief: boolean;
      };
      errors?: undefined;
    }
  | { payload?: undefined; errors: OfferteFormFieldErrors } {
  const errors: OfferteFormFieldErrors = {};

  const klnr = Number(form.klnr);
  if (!form.klnr.trim() || !Number.isInteger(klnr) || klnr <= 0) {
    errors.klnr = "Klnr moet een geldig positief getal zijn.";
  }

  const verkoopkans = form.verkoopkans.trim() ? Number(form.verkoopkans) : 0;
  if (Number.isNaN(verkoopkans)) {
    errors.verkoopkans = "Verkoopkans moet een geldig getal zijn.";
  }

  if (Object.keys(errors).length > 0) {
    return { errors };
  }

  return {
    payload: {
      naam: form.naam,
      klnr,
      adres: form.adres,
      postnr: form.postnr,
      stad: form.stad,
      munt: form.munt,
      offgroep: form.offgroep,
      soort: form.soort,
      datum: form.datum || null,
      verkoopkans,
      uRef: form.uRef,
      opm: form.opm,
      passief: form.passief,
    },
  };
}

function TextField({
  label,
  value,
  onChange,
  type = "text",
  error,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  error?: string;
}) {
  return (
    <div>
      <label className="text-[11px] font-semibold tracking-[0.04em] text-muted-foreground uppercase">
        {label}
        <Input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="mt-1 font-normal normal-case"
        />
      </label>
      {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
    </div>
  );
}

/**
 * Shared, presentational form section for the offerte "header" fields -
 * used by both `OfferteCreatePage` and `OfferteEditPage`. `verloren`, when
 * provided (edit mode only), is rendered read-only with an explanatory
 * note: editing any other field on this form clears it server-side on
 * save (see `updateOfferte` / backend-coder's verloren auto-clear PUT
 * behavior).
 */
export function OfferteFormFields({
  form,
  onChange,
  errors,
  verloren,
}: {
  form: OfferteFormValues;
  onChange: <K extends keyof OfferteFormValues>(key: K, value: OfferteFormValues[K]) => void;
  errors?: OfferteFormFieldErrors;
  verloren?: boolean;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <TextField label="Naam" value={form.naam} onChange={(v) => onChange("naam", v)} />
      <TextField
        label="Klnr"
        value={form.klnr}
        onChange={(v) => onChange("klnr", v)}
        type="number"
        error={errors?.klnr}
      />
      <TextField label="Adres" value={form.adres} onChange={(v) => onChange("adres", v)} />
      <TextField label="Postnr" value={form.postnr} onChange={(v) => onChange("postnr", v)} />
      <TextField label="Stad" value={form.stad} onChange={(v) => onChange("stad", v)} />
      <TextField label="Munt" value={form.munt} onChange={(v) => onChange("munt", v)} />
      <TextField
        label="Offertegroep"
        value={form.offgroep}
        onChange={(v) => onChange("offgroep", v)}
      />
      <TextField label="Soort" value={form.soort} onChange={(v) => onChange("soort", v)} />
      <TextField
        label="Datum"
        value={form.datum}
        onChange={(v) => onChange("datum", v)}
        type="date"
      />
      <TextField
        label="Verkoopkans"
        value={form.verkoopkans}
        onChange={(v) => onChange("verkoopkans", v)}
        type="number"
        error={errors?.verkoopkans}
      />
      <TextField label="Uw referentie" value={form.uRef} onChange={(v) => onChange("uRef", v)} />
      <div>
        <div className="text-[11px] font-semibold tracking-[0.04em] text-muted-foreground uppercase">
          Passief
        </div>
        <label className="mt-1 flex h-8 items-center gap-2">
          <Checkbox
            checked={form.passief}
            onCheckedChange={() => onChange("passief", !form.passief)}
            aria-label="Passief"
          />
          <span className="text-sm text-foreground">{form.passief ? "Ja" : "Nee"}</span>
        </label>
      </div>
      {verloren !== undefined && (
        <div>
          <div className="text-[11px] font-semibold tracking-[0.04em] text-muted-foreground uppercase">
            Verloren
          </div>
          <div className="mt-1 flex h-8 items-center text-sm text-foreground">
            {verloren ? "Ja" : "Nee"}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Wordt automatisch uitgeschakeld zodra je een ander veld opslaat.
          </p>
        </div>
      )}
      <div className="sm:col-span-2 lg:col-span-3">
        <label className="text-[11px] font-semibold tracking-[0.04em] text-muted-foreground uppercase">
          Opmerking
          <Textarea
            value={form.opm}
            onChange={(e) => onChange("opm", e.target.value)}
            className="mt-1 font-normal normal-case"
          />
        </label>
      </div>
    </div>
  );
}
