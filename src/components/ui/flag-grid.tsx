import * as React from "react"

import { Checkbox } from "@/components/ui/checkbox"
import { SectionLabel } from "@/components/ui/section-label"

type FlagGridItem = {
  key: string
  label: string
  checked: boolean
  onToggle: () => void
  disabled?: boolean
}

function FlagGrid({ title, items }: { title?: string; items: FlagGridItem[] }) {
  return (
    <div>
      {title && <SectionLabel>{title}</SectionLabel>}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 pt-2">
        {items.map((item) => (
          <label key={item.key} className="flex h-8 items-center gap-2">
            <Checkbox
              checked={item.checked}
              onCheckedChange={item.onToggle}
              disabled={item.disabled}
            />
            <span className="text-sm text-foreground">{item.label}</span>
          </label>
        ))}
      </div>
    </div>
  )
}

export { FlagGrid }
export type { FlagGridItem }

