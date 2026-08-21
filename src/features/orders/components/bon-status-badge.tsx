import { Badge } from "@/components/ui/badge";

/**
 * Statusbadge voor een bon, gebaseerd op `stempel`. Bewuste ontwerpkeuze:
 * "V" en "B" worden allebei getoond als "In verwerking" - er is in de UI
 * geen onderscheid tussen deze twee stempels.
 */
export function BonStatusBadge({ stempel }: { stempel: string }) {
  if (stempel === "O") {
    return <Badge variant="secondary">Open</Badge>;
  }

  if (stempel === "V" || stempel === "B") {
    return <Badge variant="outline">In verwerking</Badge>;
  }

  return <Badge variant="outline">{stempel || "Onbekend"}</Badge>;
} 
