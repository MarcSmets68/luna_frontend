import type { EffectiefStatus } from "../types";

export const EFFECTIEF_STATUS: Record<
  EffectiefStatus,
  { label: string; className: string }
> = {
  niet_effectief: {
    label: "Niet gepickt",
    className: "bg-muted text-muted-foreground",
  },
  gedeeltelijk_effectief: {
    label: "Gedeeltelijk",
    className: "bg-warning-bg text-warning-fg",
  },
  geen_effectief: {
    label: "Geen effectief",
    className: "bg-destructive/10 text-destructive",
  },
  volledig_effectief: {
    label: "Volledig",
    className: "bg-success-bg text-success-fg",
  },
};

export function getEffectiefStatus(status: EffectiefStatus) {
  return EFFECTIEF_STATUS[status];
}
