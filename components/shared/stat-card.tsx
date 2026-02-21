import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import type { LucideIcon } from 'lucide-react'

interface StatCardProps {
  title: string
  value: string | number
  description?: string
  icon?: LucideIcon
  trend?: {
    value: number
    label: string
  }
  variant?: 'default' | 'success' | 'warning' | 'destructive'
  className?: string
}

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  trend,
  variant = 'default',
  className,
}: StatCardProps) {
  const iconContainerStyles = {
    default: 'bg-blue-50 dark:bg-blue-900/20',
    success: 'bg-emerald-50 dark:bg-emerald-900/20',
    warning: 'bg-amber-50 dark:bg-amber-900/20',
    destructive: 'bg-rose-50 dark:bg-rose-900/20',
  }

  const iconStyles = {
    default: 'text-blue-500',
    success: 'text-emerald-500 dark:text-emerald-400',
    warning: 'text-amber-500 dark:text-amber-400',
    destructive: 'text-rose-500 dark:text-rose-400',
  }

  return (
    <div className={cn("rounded-xl border bg-card p-4", className)}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        {Icon && (
          <div className={cn("flex h-8 w-8 items-center justify-center rounded-full", iconContainerStyles[variant])}>
            <Icon className={cn("h-4 w-4", iconStyles[variant])} />
          </div>
        )}
      </div>
      <div className="flex items-baseline gap-2">
        <p className="text-2xl font-bold tracking-tight">{value}</p>
        {trend && (
          <span className={cn("text-xs font-medium", trend.value >= 0 ? "text-emerald-600" : "text-rose-600")}>
            {trend.value >= 0 ? '+' : ''}{trend.value}% {trend.label}
          </span>
        )}
      </div>
      {description && (
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  )
}
