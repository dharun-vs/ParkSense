import React from 'react'
import { cn } from '@/lib/utils'

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'emerald' | 'charcoal' | 'red' | 'blue' | 'amber' | 'outline'
  size?: 'sm' | 'md'
  icon?: React.ReactNode
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'emerald',
  size = 'md',
  icon,
  children,
  ...props
}) => {
  const variantClasses = {
    emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
    charcoal: 'bg-charcoal-100 text-charcoal-700 border-charcoal-200',
    red: 'bg-red-50 text-red-700 border-red-200/60',
    blue: 'bg-blue-50 text-blue-700 border-blue-200/60',
    amber: 'bg-amber-50 text-amber-700 border-amber-200/60',
    outline: 'bg-transparent text-charcoal-600 border-charcoal-300',
  }

  const sizeClasses = {
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center font-medium rounded-full border',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {icon && <span className="shrink-0">{icon}</span>}
      {children}
    </span>
  )
}
