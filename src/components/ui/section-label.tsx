import * as React from "react"

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3 border-b border-border pb-2.5 text-[11px] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
      {children}
    </div>
  )
}

export { SectionLabel }