import { type ReactNode, useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: ReactNode
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export function Modal({ isOpen, onClose, title, children, className, size = 'md' }: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isOpen) return

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }

    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const sizeClass = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-2xl',
  }[size]

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-charcoal-900/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={dialogRef}
        className={cn(
          'relative w-full bg-white rounded-2xl shadow-xl border border-charcoal-200 animate-slide-in',
          sizeClass,
          className
        )}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-charcoal-100">
          <h2 id="modal-title" className="text-base font-semibold text-charcoal-900">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="btn-ghost btn-sm rounded-lg p-1.5 -mr-1"
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-4">{children}</div>
      </div>
    </div>
  )
}

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: () => void
  title: string
  message: string
  confirmLabel?: string
  isDanger?: boolean
  isLoading?: boolean
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  isDanger = false,
  isLoading = false,
}: ConfirmDialogProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <p className="text-sm text-charcoal-600 mb-6">{message}</p>
      <div className="flex gap-3 justify-end">
        <button onClick={onClose} className="btn-secondary btn" disabled={isLoading}>
          Cancel
        </button>
        <button
          onClick={onConfirm}
          className={isDanger ? 'btn-danger btn' : 'btn-primary btn'}
          disabled={isLoading}
        >
          {isLoading ? 'Processing…' : confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
