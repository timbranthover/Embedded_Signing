import React, { useEffect } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
}

const sizeClasses = {
  sm:   'max-w-sm',
  md:   'max-w-lg',
  lg:   'max-w-2xl',
  xl:   'max-w-4xl',
  full: 'max-w-[96vw] w-[96vw]',
}

export function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden
      />
      {/* Panel */}
      <div
        className={[
          'relative w-full bg-surface rounded-xl border border-border shadow-modal',
          'flex flex-col max-h-[90vh]',
          sizeClasses[size],
        ].join(' ')}
      >
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
            <h2 className="font-display font-semibold text-lg text-primary">{title}</h2>
            <button
              onClick={onClose}
              className="p-1 rounded text-secondary hover:text-primary hover:bg-surface-2 transition-colors"
              aria-label="Close"
            >
              <X size={18} />
            </button>
          </div>
        )}
        {!title && (
          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-10 p-1.5 rounded-full bg-surface-2 text-secondary hover:text-primary transition-colors"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        )}
        <div className="overflow-auto flex-1">{children}</div>
      </div>
    </div>
  )
}

// Side sheet variant for signing on mobile / expanded views
interface SheetProps {
  open: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  side?: 'right' | 'bottom'
}

export function Sheet({ open, onClose, title, children, side = 'right' }: SheetProps) {
  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  return (
    <div
      className={[
        'fixed inset-0 z-50',
        open ? 'pointer-events-auto' : 'pointer-events-none',
      ].join(' ')}
    >
      <div
        className={[
          'absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-200',
          open ? 'opacity-100' : 'opacity-0',
        ].join(' ')}
        onClick={onClose}
      />
      <div
        className={[
          'absolute bg-surface border-border shadow-modal flex flex-col',
          'transition-transform duration-200',
          side === 'right'
            ? 'right-0 top-0 bottom-0 w-full max-w-2xl border-l ' + (open ? 'translate-x-0' : 'translate-x-full')
            : 'left-0 right-0 bottom-0 h-[90vh] border-t rounded-t-2xl ' + (open ? 'translate-y-0' : 'translate-y-full'),
        ].join(' ')}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          {title && <h2 className="font-display font-semibold text-lg text-primary">{title}</h2>}
          <button
            onClick={onClose}
            className="ml-auto p-1.5 rounded text-secondary hover:text-primary hover:bg-surface-2 transition-colors"
            aria-label="Close"
          >
            <X size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-auto">{children}</div>
      </div>
    </div>
  )
}
