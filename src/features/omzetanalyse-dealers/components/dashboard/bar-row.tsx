"use client";

import type { ReactNode } from "react";

/**
 * Name + track/fill bar + value row (like the reference page's .mv-r).
 * Renders a <button> when clickable, a <div> otherwise (safe inside an
 * outer toggle button).
 */
export function BarRow({
  name,
  value,
  max,
  color,
  badge,
  sub,
  onClick,
}: {
  name: ReactNode;
  /** bar fill amount (absolute); max scales the bar */
  value: number;
  max: number;
  color: string;
  badge?: ReactNode;
  /** right-aligned value label */
  sub?: ReactNode;
  onClick?: () => void;
}) {
  const width = `${Math.max(2, (Math.abs(value) / Math.max(1, max)) * 100)}%`;
  const inner = (
    <>
      <span className="truncate text-[13px] font-medium text-foreground">
        {name}
        {badge}
      </span>
      <span className="h-2 overflow-hidden bg-muted">
        <span className="block h-full" style={{ width, background: color }} />
      </span>
      <span className="min-w-20 text-right text-[13px] whitespace-nowrap text-muted-foreground tabular-nums">
        {sub}
      </span>
    </>
  );
  const cls =
    "grid w-full grid-cols-[minmax(0,1.1fr)_minmax(0,1.5fr)_auto] items-center gap-2.5 px-1 py-1.5 text-left outline-none";
  if (!onClick) return <div className={cls}>{inner}</div>;
  return (
    <button
      type="button"
      onClick={onClick}
      className={`${cls} cursor-pointer hover:bg-muted/50 focus-visible:ring-2 focus-visible:ring-ring/50`}
    >
      {inner}
    </button>
  );
}
