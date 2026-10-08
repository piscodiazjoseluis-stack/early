import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import type { ButtonHTMLAttributes } from 'react'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-xl px-4 text-sm font-extrabold tracking-[-0.01em] transition-[background-color,border-color,color,box-shadow,transform] duration-200 focus-visible:outline-none disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 active:translate-y-px',
  {
    variants: {
      variant: {
        primary:
          'bg-gradient-to-r from-electric-blue to-[#2b82ff] text-white shadow-[0_8px_20px_rgb(23_107_255/20%)] hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgb(23_107_255/28%)] focus-visible:outline-electric-blue/30',
        secondary:
          'border-border bg-white text-primary border shadow-[0_2px_8px_rgb(7_29_73/4%)] hover:-translate-y-0.5 hover:border-electric-blue/50 hover:text-electric-blue hover:shadow-soft',
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
