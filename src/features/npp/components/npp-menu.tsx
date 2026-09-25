"use client";

// First visual draft of the NPP (production/warehouse floor) home menu -
// see PRD §4.1 for the touch-UI principles this follows (large tiles,
// minimal info, one task per screen) and docs/legacy-codebase-guide.md
// §7-8 for the legacy NPP screens each tile stands in for.
//
// Deliberately no functionality yet: tiles don't navigate anywhere and
// the department switch is local, unpersisted UI state. This exists
// purely to validate the touch layout before the real design/build
// goes through the analyst -> architect -> frontend-coder pipeline.

import { useState } from "react";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ScanLine,
  PackagePlus,
  Factory,
  ClipboardCheck,
  CalendarDays,
  BookmarkCheck,
  Puzzle,
  Boxes,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Department = "nomaled" | "sikta";

const DEPARTMENTS: { id: Department; label: string }[] = [
  { id: "nomaled", label: "Nomaled Lijnverlichting" },
  { id: "sikta", label: "Sikta" },
];

type Tile = {
  label: string;
  icon: LucideIcon;
  /** Only relevant/shown for this department, when set. */
  department?: Department;
  /** When set, the tile navigates there (next/link) instead of being inert. */
  href?: string;
};

const TILES: Tile[] = [
  { label: "Scannen / verifiëren", icon: ScanLine },
  { label: "Stockbeweging boeken", icon: PackagePlus },
  { label: "Productie starten / afsluiten", icon: Factory },
  { label: "Kwaliteitscontrole", icon: ClipboardCheck },
  { label: "Planning raadplegen", icon: CalendarDays },
  { label: "Reservaties raadplegen", icon: BookmarkCheck },
  { label: "Sikta-assemblage", icon: Puzzle, department: "sikta" },
  { label: "Boxoverzicht", icon: Boxes, href: "/npp/boxoverzicht" },
];

export function NppMenu() {
  const [department, setDepartment] = useState<Department>("nomaled");

  const tiles = TILES.filter((tile) => !tile.department || tile.department === department);

  return (
    <div className="flex h-full w-full flex-col gap-6 p-6 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-xl font-semibold text-foreground">NPP</h1>
          <p className="text-sm text-muted-foreground">Kies een taak om te starten</p>
        </div>

        <div
          role="tablist"
          aria-label="Afdeling"
          className="flex rounded-lg border border-border bg-card p-1"
        >
          {DEPARTMENTS.map((dept) => (
            <button
              key={dept.id}
              type="button"
              role="tab"
              aria-selected={department === dept.id}
              onClick={() => setDepartment(dept.id)}
              className={cn(
                "min-h-11 rounded-md px-4 text-sm font-medium transition-colors",
                department === dept.id
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              {dept.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid flex-1 grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {tiles.map((tile) => (
          <NppTile key={tile.label} label={tile.label} icon={tile.icon} href={tile.href} />
        ))}
      </div>
    </div>
  );
}

const tileClassName = cn(
  "flex min-h-36 flex-col items-center justify-center gap-3 rounded-2xl border border-border bg-card p-4 text-center",
  "transition-colors select-none hover:bg-accent hover:text-accent-foreground active:translate-y-px",
  "focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
);

function NppTile({
  label,
  icon: Icon,
  href,
}: {
  label: string;
  icon: LucideIcon;
  href?: string;
}) {
  const content = (
    <>
      <Icon className="size-10 text-primary-600" strokeWidth={1.75} />
      <span className="text-[15px] leading-snug font-medium text-foreground">{label}</span>
    </>
  );

  if (href) {
    return (
      <Link href={href} className={tileClassName}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" className={tileClassName}>
      {content}
    </button>
  );
}
