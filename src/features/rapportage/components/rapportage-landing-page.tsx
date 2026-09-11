import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

// Statische lijst van beschikbare reports - vandaag enkel Verkoop FUR,
// future-proof zodat hier later meer report-kaarten bijkomen zonder
// herontwerp (zie docs/architecture/verkoop-fur-ontwerp.md, Frontend §
// Route/pagina's).
const REPORTS = [
  {
    key: "verkoop-fur",
    label: "Verkoop FUR",
    description: "Overzicht van dealers met NOMALED.FUR-orders in de laatste 12 maanden.",
    href: "/rapportage/verkoop-fur",
  },
];

export function RapportageLandingPage() {
  return (
    <div>
      <div className="mb-1.5 text-[11px] font-semibold tracking-[0.08em] text-muted-foreground uppercase">
        Rapportage
      </div>
      <div className="mb-6 flex items-baseline justify-between">
        <h1 className="text-[26px] font-bold text-foreground">Rapportage</h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {REPORTS.map((report) => (
          <Link key={report.key} href={report.href}>
            <Card className="h-full transition-shadow hover:shadow-md">
              <CardContent className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-[15px] font-semibold text-foreground">
                    {report.label}
                  </div>
                  <p className="mt-1 text-[13px] text-muted-foreground">
                    {report.description}
                  </p>
                </div>
                <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
