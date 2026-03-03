import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from 'lucide-react'
import { useMailboxStore } from '../../store/mailboxStore'
import type { Toast as ToastType } from '../../types'

const icons = {
  success: <CheckCircle2 size={16} className="text-success shrink-0" />,
  error:   <AlertCircle  size={16} className="text-danger shrink-0" />,
  info:    <Info         size={16} className="text-accent shrink-0" />,
  warning: <AlertTriangle size={16} className="text-warning shrink-0" />,
}

function ToastItem({ toast }: { toast: ToastType }) {
  const removeToast = useMailboxStore(s => s.removeToast)
  return (
    <div
      className="toast-enter flex items-start gap-3 bg-surface border border-border rounded-lg px-4 py-3 shadow-card-hover min-w-[280px] max-w-sm"
      role="alert"
      aria-live="polite"
    >
      {icons[toast.type]}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-primary">{toast.title}</p>
        {toast.message && <p className="text-xs text-secondary mt-0.5">{toast.message}</p>}
      </div>
      <button
        onClick={() => removeToast(toast.id)}
        className="shrink-0 p-0.5 rounded text-tertiary hover:text-secondary transition-colors"
        aria-label="Dismiss"
      >
        <X size={14} />
      </button>
    </div>
  )
}

export function ToastContainer() {
  const toasts = useMailboxStore(s => s.toasts)
  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className="pointer-events-auto">
          <ToastItem toast={t} />
        </div>
      ))}
    </div>
  )
}
