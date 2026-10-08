import type { HTMLAttributes, ReactNode } from 'react'

import { cn } from '@/lib/utils'

export function Card({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <section
      className={cn(
        'enterprise-surface bg-surface rounded-[20px]',
        className,
      )}
      {...props}
    />
  )
}

export function CardHeader({
  title,
  description,
  icon,
  action,
}: {
  title: string
  description?: string
  icon?: ReactNode
  action?: ReactNode
}) {
  return (
    <header className="flex items-start justify-between gap-4">
      <div className="flex min-w-0 items-start gap-3">
        {icon ? (
          <span className="bg-info-soft text-electric-blue mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl">
            {icon}
          </span>
        ) : null}
        <div>
          <h2 className="text-primary text-[15px] leading-6 font-extrabold sm:text-base">
            {title}
          </h2>
          {description ? (
            <p className="text-muted-foreground mt-0.5 text-xs">{description}</p>
          ) : null}
        </div>
      </div>
      {action}
    </header>
  )
}
