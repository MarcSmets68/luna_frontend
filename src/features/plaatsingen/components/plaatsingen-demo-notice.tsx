import { Info } from "lucide-react";

export function PlaatsingenDemoNotice() {
  return (
    <div role="note" className="mb-6 flex items-start gap-3 rounded-xl border border-warning-fg/25 bg-warning-bg p-4 text-sm text-warning-fg">
      <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <div>
        <p className="font-semibold">Demo — voorbeeldgegevens</p>
        <p>Plaatsingen is nog niet gekoppeld aan de backend. Dit zijn geen echte plaatsingen; je kunt ze alleen bekijken.</p>
      </div>
    </div>
  );
}
