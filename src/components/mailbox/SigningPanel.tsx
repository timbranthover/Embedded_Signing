import { useEffect, useRef } from 'react'
import { X, PenLine } from 'lucide-react'
import { useMailboxStore } from '../../store/mailboxStore'

export function SigningPanel() {
  const { signingUrl, signingItemId, closeSigning, updateStatus, addToast } = useMailboxStore()
  const iframeRef = useRef<HTMLIFrameElement>(null)

  // Listen for postMessage from /docusign/return.html
  useEffect(() => {
    if (!signingUrl) return

    function handleMessage(event: MessageEvent) {
      if (event.data?.type !== 'docusign_return') return
      const { event: dsEvent } = event.data as { type: string; event: string }

      if (dsEvent === 'signing_complete') {
        if (signingItemId) updateStatus(signingItemId, 'completed')
        closeSigning()
        addToast({
          type: 'success',
          title: 'Document signed',
          message: 'Your signature has been recorded successfully.',
        })
      } else if (dsEvent === 'cancel') {
        closeSigning()
        addToast({ type: 'info', title: 'Signing cancelled' })
      } else if (dsEvent === 'decline') {
        if (signingItemId) updateStatus(signingItemId, 'declined')
        closeSigning()
        addToast({ type: 'warning', title: 'Document declined' })
      } else if (dsEvent === 'session_timeout' || dsEvent === 'ttl_expired') {
        closeSigning()
        addToast({ type: 'error', title: 'Session expired', message: 'Please try signing again.' })
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [signingUrl, signingItemId, closeSigning, updateStatus, addToast])

  if (!signingUrl) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-secondary gap-3 p-6">
        <div className="w-12 h-12 rounded-xl bg-surface-2 border border-border flex items-center justify-center">
          <PenLine size={20} className="text-tertiary" />
        </div>
        <div className="text-center">
          <p className="text-sm font-medium text-secondary">Signing panel</p>
          <p className="text-xs text-tertiary mt-1">Select a pending document and click "Sign now"</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0 bg-surface">
        <div className="flex items-center gap-2">
          <PenLine size={14} className="text-accent" />
          <span className="text-sm font-semibold text-primary">DocuSign</span>
        </div>
        <button
          onClick={closeSigning}
          className="p-1.5 rounded hover:bg-surface-2 text-secondary hover:text-primary transition-colors"
          aria-label="Close signing panel"
        >
          <X size={16} />
        </button>
      </div>

      {/* iframe */}
      <div className="flex-1 relative bg-surface-2">
        <iframe
          ref={iframeRef}
          src={signingUrl}
          className="signing-iframe absolute inset-0"
          title="DocuSign document signing"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-top-navigation"
          allow="camera; microphone"
        />
      </div>
    </div>
  )
}
