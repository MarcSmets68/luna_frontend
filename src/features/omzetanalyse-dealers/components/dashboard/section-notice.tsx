export function SectionNotice({ children }: { children: React.ReactNode }) {
  return (
    <div
      data-testid="section-notice"
      className="border border-dashed border-border bg-muted/40 px-4 py-6 text-center text-[13px] text-muted-foreground"
    >
      {children}
    </div>
  );
}

/** Standard hint for sections that need the per-dealer list. */
export function perDealerNoticeText(): string {
  return "Geen per-dealer data in deze respons.";
}
