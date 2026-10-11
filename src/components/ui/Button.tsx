import React from 'react'
import { cn } from '@/lib/utils'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    const variantClasses = {
      primary: 'bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 shadow-sm',
      secondary: 'bg-charcoal-100 text-charcoal-800 hover:bg-charcoal-200 active:bg-charcoal-300',
      danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-sm',
      ghost: 'text-charcoal-600 hover:bg-charcoal-100 hover:text-charcoal-900',
      outline: 'bg-white text-charcoal-700 border border-charcoal-300 hover:bg-charcoal-50 active:bg-charcoal-100 shadow-sm',
    }

    const sizeClasses = {
      sm: 'px-2.5 py-1.5 text-xs rounded-md gap-1.5',
      md: 'px-4 py-2 text-sm rounded-lg gap-2',
      lg: 'px-5 py-2.5 text-base rounded-xl gap-2.5',
    }

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none cursor-pointer',
          variantClasses[variant],
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {isLoading ? (
          <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : leftIcon ? (
          <span className="shrink-0">{leftIcon}</span>
        ) : null}
        <span>{children}</span>
        {!isLoading && rightIcon ? <span className="shrink-0">{rightIcon}</span> : null}
      </button>
    )
  }
)
Button.displayName = 'Button'
