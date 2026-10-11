import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function Spinner({ size = 'md', className }: SpinnerProps) {
  const sizeClass = {
    sm: 'h-4 w-4 border-2',
    md: 'h-6 w-6 border-2',
    lg: 'h-10 w-10 border-[3px]',
  }[size]

  return (
    <div
      className={cn(
        'animate-spin rounded-full border-charcoal-200 border-t-emerald-600',
        sizeClass,
        className
      )}
      role="status"
      aria-label="Loading"
    />
  )
}

interface LoadingOverlayProps {
  message?: string
}

export function LoadingOverlay({ message = 'Loading…' }: LoadingOverlayProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-charcoal-500">
      <Spinner size="lg" />
      <p className="text-sm">{message}</p>
    </div>
  )
}

interface PageLoadingProps {
  message?: string
}

export function PageLoading({ message }: PageLoadingProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-charcoal-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-emerald-600 flex items-center justify-center">
          <span className="text-white text-2xl font-bold">P</span>
        </div>
        <div className="flex flex-col items-center gap-2">
          <Spinner size="lg" />
          <p className="text-charcoal-500 text-sm">{message ?? 'ParkSense is loading…'}</p>
        </div>
      </div>
    </div>
  )
}

interface SkeletonProps {
  className?: string
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn('animate-pulse rounded bg-charcoal-200', className)}
      aria-hidden="true"
    />
  )
}

interface CardSkeletonProps {
  rows?: number
}

export function CardSkeleton({ rows = 3 }: CardSkeletonProps) {
  return (
    <div className="card p-4 space-y-3">
      <Skeleton className="h-4 w-2/3" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-3 w-full" />
      ))}
    </div>
  )
}

interface ErrorMessageProps {
  title?: string
  message: string
  onRetry?: () => void
  className?: string
}

export function ErrorMessage({ title = 'Something went wrong', message, onRetry, className }: ErrorMessageProps) {
  return (
    <div
      className={cn('rounded-xl border border-red-200 bg-red-50 p-4', className)}
      role="alert"
    >
      <p className="text-sm font-semibold text-red-800">{title}</p>
      <p className="text-sm text-red-700 mt-1">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="mt-3 text-sm font-medium text-red-700 underline hover:text-red-900"
        >
          Try again
        </button>
      )}
    </div>
  )
}

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 text-center px-4', className)}>
      {icon && (
        <div className="mb-4 text-charcoal-300">{icon}</div>
      )}
      <h3 className="text-base font-semibold text-charcoal-700">{title}</h3>
      {description && (
        <p className="mt-1 text-sm text-charcoal-500 max-w-xs text-balance">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

interface AlertBannerProps {
  type: 'info' | 'success' | 'warning' | 'error'
  message: string
  onDismiss?: () => void
  className?: string
}

export function AlertBanner({ type, message, onDismiss, className }: AlertBannerProps) {
  const styles = {
    info: 'bg-blue-50 border-blue-200 text-blue-800',
    success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    warning: 'bg-amber-50 border-amber-200 text-amber-800',
    error: 'bg-red-50 border-red-200 text-red-800',
  }[type]

  return (
    <div className={cn('flex items-center gap-3 rounded-lg border px-4 py-3 text-sm', styles, className)} role="alert">
      <span className="flex-1">{message}</span>
      {onDismiss && (
        <button
          onClick={onDismiss}
          className="shrink-0 font-medium underline opacity-70 hover:opacity-100"
          aria-label="Dismiss"
        >
          ×
        </button>
      )}
    </div>
  )
}
