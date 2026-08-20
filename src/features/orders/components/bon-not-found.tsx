export function BonNotFound({ bonnr }: { bonnr: string | number }) {
  return (
    <div>
      <div className="mb-1.5 text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
        Orders &amp; Productie
      </div>
      <div className="mb-6 flex items-baseline justify-between">
        <h1 className="text-[26px] font-bold text-foreground">Order niet gevonden</h1>
      </div>
      <p className="text-sm text-muted-foreground">
        Order {bonnr} bestaat niet of is verwijderd.
      </p>
    </div>
  );
}
