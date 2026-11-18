import { AppShell } from "@/components/layout/app-shell";
import { Card, CardContent } from "@/components/ui/card";

export default function OfferteLoading() {
  return (
    <AppShell>
      <h1 className="mb-6 text-[26px] font-bold text-foreground">Offerte</h1>
      <Card>
        <CardContent>
          <p role="status" className="text-sm text-muted-foreground">Offerte wordt geladen...</p>
        </CardContent>
      </Card>
    </AppShell>
  );
}
