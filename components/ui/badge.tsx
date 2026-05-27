import { cn } from '@/lib/utils'

type Variant = 'default' | 'success' | 'danger' | 'warning' | 'gold'

const variants: Record<Variant, string> = {
  default: 'bg-surface-overlay text-text-muted',
  success: 'bg-success/10 text-success',
  danger:  'bg-danger/10 text-danger',
  warning: 'bg-warning/10 text-warning',
  gold:    'bg-gold/10 text-gold',
}

export function Badge({
  variant = 'default',
  className,
  children,
}: {
  variant?: Variant
  className?: string
  children: React.ReactNode
}) {
  return (
    <span className={cn(
      'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
      variants[variant],
      className
    )}>
      {children}
    </span>
  )
}
