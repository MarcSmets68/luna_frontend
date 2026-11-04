import { cn } from "@/lib/utils";
import type { LijnStatus, OnderdeelStatus } from "../types";

const LIJN_LABELS: Record<LijnStatus, string> = {
  te_reserveren: "Te reserveren",
  bezig: "Bezig",
  wacht_op_materiaal: "Wacht op materiaal",
  gereed: "Gereed",
  afgerond: "Afgerond",
};

const LIJN_CLASSES: Record<LijnStatus, string> = {
  te_reserveren: "bg-muted text-foreground",
  bezig: "bg-warning-bg text-warning-fg",
  wacht_op_materiaal: "bg-destructive/10 text-destructive",
  gereed: "bg-success-bg text-success-fg",
  afgerond: "bg-success-bg text-success-fg",
};

const ONDERDEEL_LABELS: Record<OnderdeelStatus, string> = {
  te_scannen: "Te scannen",
  gereserveerd: "Gereserveerd",
  open: "Open",
  wacht_op_materiaal: "Wacht op materiaal",
  gecorrigeerd: "Gecorrigeerd",
};

const ONDERDEEL_CLASSES: Record<OnderdeelStatus, string> = {
  te_scannen: "bg-muted text-foreground",
  gereserveerd: "bg-success-bg text-success-fg",
  open: "bg-warning-bg text-warning-fg",
  wacht_op_materiaal: "bg-destructive/10 text-destructive",
  gecorrigeerd: "bg-accent text-accent-foreground",
};

export function LijnStatusBadge({ status }: { status: LijnStatus }) {
  return (
    <span
      className={cn(
        "rounded-full px-3 py-1 text-xs font-medium",
        LIJN_CLASSES[status],
      )}
    >
      {LIJN_LABELS[status]}
    </span>
  );
}

export function OnderdeelStatusBadge({ status }: { status: OnderdeelStatus }) {
  return (
    <span
      className={cn(
        "rounded-full px-2.5 py-0.5 text-xs font-medium",
        ONDERDEEL_CLASSES[status],
      )}
    >
      {ONDERDEEL_LABELS[status]}
    </span>
  );
}
