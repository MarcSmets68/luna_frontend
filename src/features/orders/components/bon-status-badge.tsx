import { Badge } from "@/components/ui/badge";
import { getStempelLabel } from "../lib/bon-stempel";

export function BonStatusBadge({ stempel }: { stempel: string }) {
  const label = getStempelLabel(stempel);
  switch (stempel) {
    case "O":
      return (
        <Badge variant="secondary" data-stempel={stempel}>
          {label}
        </Badge>
      );
    case "V":
      return (
        <Badge className="bg-info-bg text-info-fg" data-stempel={stempel}>
          {label}
        </Badge>
      );
    case "B":
      return (
        <Badge className="bg-warning-bg text-warning-fg" data-stempel={stempel}>
          {label}
        </Badge>
      );
    case "D":
      return (
        <Badge className="bg-success-bg text-success-fg" data-stempel={stempel}>
          {label}
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" data-stempel={stempel}>
          {label}
        </Badge>
      );
  }
}
