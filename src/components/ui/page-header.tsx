import type { ReactNode } from "react";

/** Shared heading rhythm for list, dashboard and report entry screens. */
export function PageHeader({
  section,
  title,
  children,
}: {
  section: string;
  title: string;
  children?: ReactNode;
}) {
  return (
    <div className="mb-7">
      <div className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-primary-600">
        {section}
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-[28px] font-semibold text-foreground sm:text-[30px]">{title}</h1>
        {children && <div className="flex flex-wrap items-center gap-3 text-[13px] text-muted-foreground">{children}</div>}
      </div>
    </div>
  );
}
