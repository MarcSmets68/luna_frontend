import Link from "next/link";

export function OfferteNotFound({
  offnr,
  versie,
}: {
  offnr: string | number;
  versie: string | number;
}) {
  return (
    <div>
      <div className="mb-1.5 text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
        Offertes
      </div>
      <div className="mb-6 flex items-baseline justify-between">
        <h1 className="text-[26px] font-bold text-foreground">Offerte niet gevonden</h1>
      </div>
      <p className="text-sm text-muted-foreground">
        Offerte {offnr}/{versie} bestaat niet of is verwijderd.
      </p>
      <Link href="/offertes/alle" className="mt-4 inline-block text-sm underline">
        Terug naar overzicht
      </Link>
    </div>
  );
}
