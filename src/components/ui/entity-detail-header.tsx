import * as React from "react"

import { cn } from "@/lib/utils"

type EntityDetailHeaderProps = {
  title: string
  subtitle?: string
  badges?: string[]
  dirty?: boolean
  actions?: React.ReactNode
}

function EntityDetailHeader({
  title,
  subtitle,
  badges,
  dirty,
  actions,
}: EntityDetailHeaderProps) {
  return (
    <div className="mb-6 flex items-baseline justify-between">
      <div className="flex items-baseline gap-3">
        <h1 className="text-[26px] font-bold text-foreground">{title}</h1>
        {badges && badges.length > 0 && (
          <div className="flex items-center gap-1.5">
            {badges.map((badge) => (
              <span
                key={badge}
                className={cn(
                  "inline-flex h-5 w-fit shrink-0 items-center justify-center rounded-4xl bg-muted px-2 py-0.5 text-xs font-medium whitespace-nowrap text-muted-foreground"
                )}
              >
                {badge}
              </span>
            ))}
          </div>
        )}
      </div>
      <div className="flex items-center gap-3">
        {subtitle && <div className="text-[13px] text-muted-foreground">{subtitle}</div>}
        {dirty && (
          <div className="text-[13px] text-warning-fg">Niet-bewaarde wijzigingen</div>
        )}
        {actions}
      </div>
    </div>
  )
}

export { EntityDetailHeader }
export type { EntityDetailHeaderProps }

