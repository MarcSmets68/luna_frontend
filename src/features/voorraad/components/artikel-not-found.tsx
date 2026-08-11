export function ArtikelNotFound({ artnr }: { artnr: string }) {
  return (
    <div>
      <div className="mb-1.5 text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
        Voorraad
      </div>
      <div className="mb-6 flex items-baseline justify-between">
        <h1 className="text-[26px] font-bold text-foreground">Artikel niet gevonden</h1>
      </div>
      <p className="text-sm text-muted-foreground">
        Artikel {artnr} bestaat niet of is verwijderd.
      </p>
    </div>
  );
}
