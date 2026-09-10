import type { HTMLAttributes, ReactNode } from 'react'

import { cn } from '@/lib/utils'

export function Card({ className, ...props }: HTMLAttributes<HTMLElement>) {
  return (
    <section
      className={cn(
        'border-border bg-surface hover:border-electric-blue/25 hover:shadow-soft rounded-[18px] border shadow-[0_3px_14px_rgb(6_27_69/5%)] transition-[transform,border-color,box-shadow] duration-200 hover:-translate-y-0.5',
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
        {icon ? <span className="text-electric-blue mt-0.5 shrink-0">{icon}</span> : null}
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
