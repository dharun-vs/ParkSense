import React from 'react'
import { cn } from '@/lib/utils'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helperText?: string
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, leftIcon, rightIcon, id, ...props }, ref) => {
    const inputId = id || props.name || Math.random().toString(36).substring(2, 9)

    return (
      <div className="w-full space-y-1.5 text-left">
        {label && (
          <label htmlFor={inputId} className="block text-sm font-medium text-charcoal-700">
            {label}
          </label>
        )}
        <div className="relative rounded-lg shadow-sm">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-charcoal-400">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              'w-full px-3 py-2 text-sm border rounded-lg bg-white text-charcoal-900 placeholder-charcoal-400 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:bg-charcoal-50 disabled:text-charcoal-500 disabled:cursor-not-allowed',
              leftIcon && 'pl-10',
              rightIcon && 'pr-10',
              error ? 'border-red-400 focus:ring-red-500' : 'border-charcoal-300',
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-charcoal-400">
              {rightIcon}
            </div>
          )}
        </div>
        {error ? (
          <p className="text-xs text-red-600 font-medium">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-charcoal-500">{helperText}</p>
        ) : null}
      </div>
    )
  }
)
Input.displayName = 'Input'
