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

import type { DashboardModel } from "../../lib/dashboard-types";

/** Standard hint for sections that need the per-dealer list. */
export function perDealerNoticeText(m: DashboardModel): string {
  return m.perDealerHint === "geenSoort"
    ? "Kies een klantsoort en vink 'Afzonderlijke lijst per dealer' aan om dealers te vergelijken."
    : "Vink 'Afzonderlijke lijst per dealer' aan om dealers te vergelijken.";
}
