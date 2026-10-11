import React from 'react'
import { cn } from '@/lib/utils'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean
}

export const Card: React.FC<CardProps> = ({ className, hoverable = false, children, ...props }) => {
  return (
    <div
      className={cn(
        'bg-white rounded-xl border border-charcoal-200/80 shadow-sm overflow-hidden transition-all duration-200',
        hoverable && 'hover:shadow-md hover:border-charcoal-300',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export const CardHeader: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => {
  return (
    <div className={cn('px-6 py-4 border-b border-charcoal-100 flex items-center justify-between', className)} {...props}>
      {children}
    </div>
  )
}

export const CardTitle: React.FC<React.HTMLAttributes<HTMLHeadingElement>> = ({ className, children, ...props }) => {
  return (
    <h3 className={cn('font-semibold text-charcoal-900 text-base', className)} {...props}>
      {children}
    </h3>
  )
}

export const CardDescription: React.FC<React.HTMLAttributes<HTMLParagraphElement>> = ({ className, children, ...props }) => {
  return (
    <p className={cn('text-xs text-charcoal-500 mt-0.5', className)} {...props}>
      {children}
    </p>
  )
}

export const CardContent: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => {
  return (
    <div className={cn('px-6 py-4', className)} {...props}>
      {children}
    </div>
  )
}

export const CardFooter: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => {
  return (
    <div className={cn('px-6 py-3 bg-charcoal-50/50 border-t border-charcoal-100 flex items-center justify-end gap-3', className)} {...props}>
      {children}
    </div>
  )
}
