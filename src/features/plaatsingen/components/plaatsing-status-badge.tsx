import { Badge } from "@/components/ui/badge";
import type { PlaatsingItem } from "../types";

/**
 * Status pill derived from `datumAfsluiting` - `plaatsing` has no explicit
 * `stempel` field of its own (that lives on `project`), closure is purely
 * signalled by the closing date being set (see `Plaatsing.w`'s "AFSLUITEN"
 * action / `docs/legacy-codebase-guide.md` §6.3).
 */
export function PlaatsingStatusBadge({ datumAfsluiting }: { datumAfsluiting: PlaatsingItem["datumAfsluiting"] }) {
  const isAfgesloten = !!datumAfsluiting;

  return (
    <Badge
      variant={isAfgesloten ? "secondary" : "outline"}
      className="text-[10.5px] font-medium"
    >
      {isAfgesloten ? "Afgesloten" : "Open"}
    </Badge>
  );
}
