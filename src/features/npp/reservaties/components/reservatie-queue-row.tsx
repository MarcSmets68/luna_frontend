import Link from "next/link";
import { cn } from "@/lib/utils";
import type { NppReservatieQueueItem } from "../types";

/** "YYYY-MM-DD[...]" -> "DD/MM/YYYY" (string-based); null -> en dash. */
function formatDate(iso: string | null): string {
  if (!iso) return "\u2013";
  const [y, m, d] = iso.slice(0, 10).split("-");
  return y && m && d ? `${d}/${m}/${y}` : iso;
}

const badgeBase = "rounded-full px-3 py-1 text-xs font-medium";

function Badge({
  className,
  children,
}: {
  className: string;
  children: React.ReactNode;
}) {
  return <span className={cn(badgeBase, className)}>{children}</span>;
}

/**
 * One queue row. Live rows link to the bon detail; deleted rows
 * (`verwijderd`) are plain, non-navigable and show the delete reason.
 */
export function ReservatieQueueRow({
  item,
  productie = false,
}: {
  item: NppReservatieQueueItem;
  productie?: boolean;
}) {
  const href =
    `/npp/reservaties/${item.bonnr}` +
    (item.groepnr > 0 ? `?groepnr=${item.groepnr}` : "");
  const lockId = item.lockId.trim();
  const meta = [item.plaatsingWijze, item.transport, item.stempel]
    .map((v) => v.trim())
    .filter(Boolean)
    .join(" \u00b7 ");

  const content = (
    <>
      <div className="flex min-w-0 flex-col gap-0.5">
        <span
          className={cn(
            "text-base font-medium text-foreground",
            item.verwijderd && "line-through",
          )}
        >
          Bon {item.bonnr}
          {productie && <> &middot; LVB {item.groepnr}</>}
        </span>
        <span className="text-sm text-muted-foreground">{item.naam}</span>
        <span className="text-xs text-muted-foreground">
          Datum: {formatDate(item.datum)} &middot; Lev:{" "}
          {formatDate(item.levDatum)}
        </span>
        {meta && <span className="text-xs text-muted-foreground">{meta}</span>}
        {lockId && (
          <span className="text-xs text-muted-foreground">
            Vergrendeld door {lockId}
          </span>
        )}
        {item.verwijderd && item.deleteOpm && (
          <span className="text-xs text-muted-foreground">
            {item.deleteOpm}
          </span>
        )}
      </div>
      <div className="flex shrink-0 flex-wrap justify-end gap-2">
        {item.dringend && (
          <Badge className="bg-destructive/10 text-destructive">Dringend</Badge>
        )}
        {item.swNomaled && (
          <Badge className="bg-muted text-foreground">In de min</Badge>
        )}
        {item.swProductie && (
          <Badge className="bg-warning-bg text-warning-fg">
            Productie niet mogelijk
          </Badge>
        )}
        {item.swReservatie && (
          <Badge className="bg-success-bg text-success-fg">Reservatie</Badge>
        )}
        {item.verwijderd && (
          <Badge className="bg-muted text-muted-foreground">Verwijderd</Badge>
        )}
      </div>
    </>
  );

  const rowClass =
    "flex min-h-11 w-full items-center justify-between gap-4 rounded-2xl border border-border bg-card px-4 py-3";

  if (item.verwijderd) {
    return <div className={cn(rowClass, "opacity-60")}>{content}</div>;
  }

  return (
    <Link
      href={href}
      className={cn(
        rowClass,
        "transition-colors hover:bg-accent hover:text-accent-foreground active:translate-y-px",
        "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
      )}
    >
      {content}
    </Link>
  );
}
