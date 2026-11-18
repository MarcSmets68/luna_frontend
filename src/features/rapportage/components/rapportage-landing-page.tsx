import Link from "next/link";
import { BarChart3, ChevronRight, Users } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";

// Statische lijst van beschikbare reports - Verkoop FUR en Omzetanalyse dealers,
// future-proof zodat hier later meer report-kaarten bijkomen zonder
// herontwerp (zie docs/architecture/verkoop-fur-ontwerp.md, Frontend §
// Route/pagina's).
const REPORTS = [
  {
    key: "verkoop-fur",
    label: "Verkoop FUR",
    description: "Overzicht van dealers met NOMALED.FUR-orders in de laatste 12 maanden.",
    href: "/rapportage/verkoop-fur",
    icon: BarChart3,
  },
  {
    key: "omzetanalyse-dealers",
    label: "Omzetanalyse dealers",
    description: "Omzet en aantallen per artikelcategorie voor dealers, met jaarvergelijking of periode.",
    href: "/rapportage/omzetanalyse-dealers",
    icon: Users,
  },
];

export function RapportageLandingPage() {
  return (
    <div>
      <PageHeader section="Rapportage" title="Rapportage" />

      <div className="grid max-w-5xl gap-5 lg:grid-cols-2">
        {REPORTS.map((report) => (
          <Link key={report.key} href={report.href} className="group rounded-xl">
            <Card className="h-full transition-colors group-hover:border-primary/40 group-hover:bg-accent/30">
              <CardContent className="flex flex-col gap-5">
                <div className="flex items-center justify-between">
                  <span className="flex size-11 items-center justify-center rounded-xl bg-accent text-primary-600">
                    <report.icon aria-hidden="true" className="size-5" strokeWidth={1.7} />
                  </span>
                  <ChevronRight aria-hidden="true" className="size-4 text-muted-foreground transition-transform group-hover:translate-x-1" />
                </div>
                <div>
                  <div className="text-base font-semibold tracking-tight text-foreground">
                    {report.label}
                  </div>
                  <p className="mt-2 max-w-sm text-[13px] leading-relaxed text-muted-foreground">
                    {report.description}
                  </p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
