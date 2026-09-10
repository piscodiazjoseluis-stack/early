import { cva, type VariantProps } from 'class-variance-authority'
import type { HTMLAttributes } from 'react'

import { cn } from '@/lib/utils'

const badgeVariants = cva(
  'inline-flex min-h-7 items-center gap-1.5 rounded-lg px-2.5 text-xs font-extrabold',
  {
    variants: {
      tone: {
        info: 'bg-info-soft text-electric-blue',
        success: 'bg-success-soft text-success',
        warning: 'bg-warning-soft text-[#ad6a00]',
        danger: 'bg-danger-soft text-danger',
        neutral: 'bg-background text-muted-foreground',
      },
    },
    defaultVariants: { tone: 'neutral' },
  },
)

type BadgeProps = HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>

export function Badge({ className, tone, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />
}
