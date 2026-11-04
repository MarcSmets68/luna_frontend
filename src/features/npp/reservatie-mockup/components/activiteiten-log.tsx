import type { LogEntry } from "../types";

export function ActiviteitenLog({ log }: { log: LogEntry[] }) {
  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-border bg-card p-4">
      <h2 className="font-heading text-sm font-semibold text-foreground">
        Activiteitenlog
      </h2>
      {log.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nog geen activiteit.</p>
      ) : (
        <ul className="flex max-h-56 flex-col gap-1.5 overflow-y-auto text-sm">
          {[...log]
            .reverse()
            .map((entry) => (
              <li key={entry.id} className="text-muted-foreground">
                <span className="font-mono text-xs">{entry.timestamp}</span>{" "}
                &middot; <span className="font-medium text-foreground">{entry.wie}</span>{" "}
                &middot; {entry.wat}
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}
