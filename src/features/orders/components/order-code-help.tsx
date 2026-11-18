import { BON_STEMPEL_LABELS } from "../lib/bon-stempel";

export function OrderCodeHelp() {
  return (
    <details className="mb-4 rounded-xl border border-border bg-card px-4 py-3 text-sm">
      <summary className="cursor-pointer font-medium text-primary-600 focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-ring">
        Uitleg bij ordercodes
      </summary>
      <div className="mt-3 space-y-3 text-muted-foreground">
        <p>
          <strong className="text-foreground">Type</strong> is het soort document:
          ORDERBEVESTIGING is een orderbevestiging; HERSTELLING is een herstelling.
          Voor andere typecodes, zoals B, is geen omschrijving beschikbaar.
          De oorspronkelijke code blijft daarom zichtbaar.
        </p>
        <div>
          <p><strong className="text-foreground">Stempel</strong> is de orderstatus:</p>
          <ul className="mt-1 grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2">
            {Object.entries(BON_STEMPEL_LABELS).map(([code, label]) => (
              <li key={code}><span className="font-mono font-medium text-foreground">{code}</span> — {label}</li>
            ))}
          </ul>
        </div>
        <p>De typecode B heeft hier geen omschrijving. Status B wordt als Besteld weergegeven.</p>
      </div>
    </details>
  );
}
