export const BON_STEMPEL_LABELS: Record<string, string> = {
  O: "Open",
  V: "In verwerking",
  B: "Besteld",
  D: "Afgeleverd",
};

export function getStempelLabel(stempel: string): string {
  return Object.hasOwn(BON_STEMPEL_LABELS, stempel) ? BON_STEMPEL_LABELS[stempel] : (stempel || "Onbekend");
}

const BON_TYPE_LABELS: Record<string, string> = {
  ORDERBEVESTIGING: "Orderbevestiging",
  HERSTELLING: "Herstelling",
};

export function getBonTypeLabel(type: string): string {
  return Object.hasOwn(BON_TYPE_LABELS, type) ? BON_TYPE_LABELS[type] : (type ? `${type} (typecode)` : "Onbekend");
}

export function kanAnnuleren(stempel: string): boolean {
  return stempel === "V" || stempel === "B";
}

export function annuleerBlokkade(stempel: string): string | null {
  if (kanAnnuleren(stempel)) return null;
  if (stempel === "O") return "Deze order is open en kan niet geannuleerd worden.";
  if (stempel === "D")
    return "Deze order is afgeleverd en kan niet meer geannuleerd worden.";
  return "Deze order kan niet geannuleerd worden.";
}
