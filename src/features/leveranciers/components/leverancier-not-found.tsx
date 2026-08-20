export function LeverancierNotFound({ levnr }: { levnr: string | number }) {
  return (
    <div>
      <div className="mb-1.5 text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
        Leveranciers
      </div>
      <div className="mb-6 flex items-baseline justify-between">
        <h1 className="text-[26px] font-bold text-foreground">Leverancier niet gevonden</h1>
      </div>
      <p className="text-sm text-muted-foreground">
        Leverancier {levnr} bestaat niet of is verwijderd.
      </p>
    </div>
  );
}
