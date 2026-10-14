export const OMZET_CAVEAT =
  "Omzet betreft enkel NOMALED.*-artikelen uit de analyselijst, netto na korting, zonder openstaande orders. Productie = artikelen met groepnr \u2260 0; los = groepnr = 0. Hoeveelheden volgen een andere indeling (LED/niet-LED).";

export function CaveatFootnote() {
  return (
    <p data-testid="omzet-caveat" className="mt-2 text-[12px] text-muted-foreground">
      {OMZET_CAVEAT}
    </p>
  );
}
