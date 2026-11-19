"use client"

import * as React from "react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Columns3 } from "lucide-react"

type TableProps = React.ComponentProps<"table"> & { mobileLabel?: string; containerClassName?: string }

function Table({ className, mobileLabel, containerClassName, ...props }: TableProps) {
  const [expanded, setExpanded] = React.useState(false)
  const scrollRef = React.useRef<HTMLDivElement>(null)
  const id = React.useId()

  React.useEffect(() => {
    if (!mobileLabel) return
    const container = scrollRef.current
    const table = container?.querySelector("table")
    if (!container || !table) return

    const measureColumns = () => {
      const headings = Array.from(table.querySelectorAll<HTMLElement>("thead th")).filter((head) => head.offsetWidth > 0)
      const firstWidth = headings[0]?.offsetWidth ?? 0
      const lastWidth = headings.at(-1)?.offsetWidth ?? 0
      container.style.setProperty("--mobile-identity-width", `${firstWidth}px`)
      container.style.setProperty("--mobile-scroll-tail", `${Math.max(0, container.clientWidth - firstWidth - lastWidth)}px`)
    }

    measureColumns()
    if (typeof ResizeObserver === "undefined") return
    const observer = new ResizeObserver(measureColumns)
    observer.observe(container)
    observer.observe(table)
    table.querySelectorAll("thead th").forEach((head) => observer.observe(head))
    return () => observer.disconnect()
  }, [mobileLabel, expanded])

  const table = (
    <div
      ref={scrollRef}
      id={mobileLabel ? id : undefined}
      data-slot="table-container"
      data-mobile-scroll={mobileLabel ? (expanded ? "all" : "priority") : undefined}
      className={cn("relative w-full overflow-x-auto rounded-xl border border-border bg-card shadow-(--shadow-surface)", mobileLabel && "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring", containerClassName)}
      role={mobileLabel ? "region" : undefined}
      aria-label={mobileLabel ? `${mobileLabel}, horizontaal schuifbare tabel` : undefined}
      aria-describedby={mobileLabel ? `${id}-hint` : undefined}
      tabIndex={mobileLabel ? 0 : undefined}
    >
      <table
        data-slot="table"
        data-mobile-columns={mobileLabel ? (expanded ? "all" : "priority") : undefined}
        className={cn("w-full caption-bottom text-sm", className)}
        {...props}
      />
      {mobileLabel && expanded && <div aria-hidden="true" data-slot="table-scroll-tail" className="hidden" />}
    </div>
  )

  if (!mobileLabel) return table

  return (
    <div className="min-w-0">
      <div className="mb-3 flex items-center justify-between gap-3 sm:hidden">
        <p id={`${id}-hint`} className="text-xs leading-relaxed text-muted-foreground">
          {expanded ? "Schuif zijwaarts. De eerste kolom blijft zichtbaar." : "Belangrijkste kolommen. Toon alle kolommen voor meer gegevens."}
        </p>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="min-h-11 shrink-0"
          aria-expanded={expanded}
          aria-controls={id}
          aria-label={`Toon ${expanded ? "minder" : "alle"} kolommen van ${mobileLabel.toLowerCase()}`}
          onClick={() => {
            if (scrollRef.current) scrollRef.current.scrollLeft = 0
            setExpanded((value) => !value)
          }}
        >
          <Columns3 aria-hidden="true" />
          {expanded ? "Minder kolommen" : "Alle kolommen"}
        </Button>
      </div>
      {table}
    </div>
  )
}

function TableHeader({ className, ...props }: React.ComponentProps<"thead">) {
  return (
    <thead
      data-slot="table-header"
      className={cn("bg-muted/80 [&_tr]:border-b", className)}
      {...props}
    />
  )
}

function TableBody({ className, ...props }: React.ComponentProps<"tbody">) {
  return (
    <tbody
      data-slot="table-body"
      className={cn("[&_tr:last-child]:border-0", className)}
      {...props}
    />
  )
}

function TableFooter({ className, ...props }: React.ComponentProps<"tfoot">) {
  return (
    <tfoot
      data-slot="table-footer"
      className={cn(
        "border-t bg-muted/50 font-medium [&>tr]:last:border-b-0",
        className
      )}
      {...props}
    />
  )
}

function TableRow({ className, ...props }: React.ComponentProps<"tr">) {
  return (
    <tr
      data-slot="table-row"
      className={cn(
        "border-b border-border/70 transition-colors hover:bg-accent/60 focus-visible:bg-accent focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring has-aria-expanded:bg-muted data-[state=selected]:bg-accent",
        className
      )}
      {...props}
    />
  )
}

function TableHead({ className, mobileHidden, ...props }: React.ComponentProps<"th"> & { mobileHidden?: boolean }) {
  return (
    <th
      data-slot="table-head"
      data-mobile-secondary={mobileHidden ? "" : undefined}
      className={cn(
        "h-11 px-4 text-left align-middle text-[11px] font-semibold tracking-[0.06em] whitespace-nowrap text-muted-foreground uppercase [&:has([role=checkbox])]:pr-0",
        className
      )}
      {...props}
    />
  )
}

function TableCell({ className, mobileHidden, ...props }: React.ComponentProps<"td"> & { mobileHidden?: boolean }) {
  return (
    <td
      data-slot="table-cell"
      data-mobile-secondary={mobileHidden ? "" : undefined}
      className={cn(
        "px-4 py-3 align-middle whitespace-nowrap tabular-nums [&:has([role=checkbox])]:pr-0",
        className
      )}
      {...props}
    />
  )
}

function TableCaption({
  className,
  ...props
}: React.ComponentProps<"caption">) {
  return (
    <caption
      data-slot="table-caption"
      className={cn("mt-4 text-sm text-muted-foreground", className)}
      {...props}
    />
  )
}

export {
  Table,
  TableHeader,
  TableBody,
  TableFooter,
  TableHead,
  TableRow,
  TableCell,
  TableCaption,
}
