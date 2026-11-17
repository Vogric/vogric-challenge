import type { HTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.08em]',
  {
    variants: {
      variant: {
        neutral: 'border-border bg-muted text-foreground/70',
        primary: 'border-primary bg-primary text-primary-foreground',
        success: 'border-emerald-600/20 bg-emerald-600/10 text-emerald-700 dark:text-emerald-400',
        warning: 'border-amber-600/20 bg-amber-500/10 text-amber-700 dark:text-amber-400',
        danger: 'border-destructive/20 bg-destructive/10 text-destructive',
        outline: 'border-border bg-transparent text-foreground/70',
      },
    },
    defaultVariants: { variant: 'neutral' },
  }
)

export interface BadgeProps
  extends HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { badgeVariants }
