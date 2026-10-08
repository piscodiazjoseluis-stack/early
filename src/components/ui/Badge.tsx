import { cva, type VariantProps } from 'class-variance-authority'
import type { HTMLAttributes } from 'react'

import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex min-h-7 items-center gap-1.5 rounded-full border border-transparent px-2.5 text-[11px] font-extrabold tracking-[0.01em]',
  {
    variants: {
      tone: {
        info: 'border-electric-blue/10 bg-info-soft text-electric-blue',
        success: 'border-success/10 bg-success-soft text-success',
        warning: 'border-warning/10 bg-warning-soft text-[#ad6a00]',
        danger: 'border-danger/10 bg-danger-soft text-danger',
        neutral: 'border-border bg-background text-muted-foreground',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
)

type BadgeProps = HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />
}
