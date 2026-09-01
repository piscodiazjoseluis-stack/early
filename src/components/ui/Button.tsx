import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import type { ButtonHTMLAttributes } from 'react'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-extrabold transition-[background-color,border-color,color,box-shadow,transform] duration-200 disabled:pointer-events-none disabled:opacity-50 active:translate-y-px',
  {
    variants: {
      variant: {
        primary:
          'bg-electric-blue text-white shadow-sm hover:bg-primary hover:shadow-soft focus-visible:outline-electric-blue/30',
        secondary:
          'border-border bg-white text-primary border hover:border-electric-blue hover:text-electric-blue',
        ghost: 'text-primary hover:bg-info-soft hover:text-electric-blue',
        danger: 'bg-danger text-white hover:bg-[#bd2d3a]',
      },
      size: {
        sm: 'min-h-9 rounded-lg px-3 text-xs',
        md: 'min-h-11 px-4',
        lg: 'min-h-12 px-6',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
)

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }

export function Button({ asChild, className, size, variant, ...props }: ButtonProps) {
  const Component = asChild ? Slot : 'button'
  return <Component className={cn(buttonVariants({ size, variant }), className)} {...props} />
}
