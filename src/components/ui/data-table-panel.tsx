import * as React from "react"

import { Card, CardContent } from "@/components/ui/card"
import { SectionLabel } from "@/components/ui/section-label"

type DataTablePanelProps = {
  title: string
  action?: React.ReactNode
  footer?: React.ReactNode
  children: React.ReactNode
}

function DataTablePanel({ title, action, footer, children }: DataTablePanelProps) {
  return (
    <Card>
      <CardContent>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="flex-1">
            <SectionLabel>{title}</SectionLabel>
          </h2>
          {action}
        </div>
        {children}
        {footer}
      </CardContent>
    </Card>
  )
}

export { DataTablePanel }
export type { DataTablePanelProps }

