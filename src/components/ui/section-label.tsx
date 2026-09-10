import * as React from "react"

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground border-b border-border pb-1.5">
      {children}
    </div>
  )
}

export { SectionLabel }