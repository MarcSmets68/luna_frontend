import * as React from "react"

import { SectionLabel } from "@/components/ui/section-label"

function FieldGroup({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div>
      <SectionLabel>{title}</SectionLabel>
      <div className="flex flex-col gap-2">{children}</div>
    </div>
  )
}

export { FieldGroup }