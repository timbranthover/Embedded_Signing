import React, { useEffect, useRef, useState } from 'react'
import { X, PenLine, CheckCircle2, Download, ArrowLeft, Clock, User, FileText, Hash } from 'lucide-react'
import { useMailboxStore } from '../../store/mailboxStore'
import { useAuthStore } from '../../store/authStore'
import { downloadSignedDocument } from '../../lib/docusign'
import { Button } from '../ui/Button'
import type { MailboxItem, DSUser } from '../../types'

// ── Sub-components ─────────────────────────────────────────────────────────

function DetailRow({
  icon, label, value, mono = false,
}: {
  icon:  React.ReactNode
  label: string
  value: string
  mono?: boolean
}) {
  return (
    <div className="flex items-center gap-2.5 px-4 py-2.5">
      <span className="text-tertiary shrink-0 w-3 flex items-center">{icon}</span>
      <span className="text-2xs text-secondary w-14 shrink-0">{label}</span>
      <span className={[
        'text-xs text-primary font-medium flex-1 text-right truncate',
        mono ? 'font-mono tracking-wide' : '',
      ].join(' ')}>
        {value}
      </span>
    </div>
  )
}

interface CompletionScreenProps {
  completedAt:     Date
  item:            MailboxItem | undefined
  user:            DSUser | null
  canDownload:     boolean
  loadingDownload: boolean
  onClose:         () => void
  onDownload:      () => void
}

function CompletionScreen({
  completedAt, item, user, canDownload, loadingDownload, onClose, onDownload,
}: CompletionScreenProps) {

  const fmtDate = (d: Date) =>
    d.toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    })

  const fmtTime = (d: Date) =>
    d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZoneName: 'short' })

  return (
    <div className="flex-1 overflow-y-auto bg-surface-2">
      <div className="flex flex-col items-center justify-center min-h-full px-6 py-10">

        {/* Animated checkmark */}
        <div
          className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mb-6 shrink-0"
          style={{ animation: 'completion-pop 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) both' }}
        >
          <CheckCircle2 size={42} className="text-success" strokeWidth={1.5} />
        </div>

        {/* Headline */}
        <div
          className="text-center mb-7"
          style={{ animation: 'completion-fade-up 0.4s ease 0.15s both' }}
        >
          <h2 className="font-display text-xl font-semibold text-primary mb-1.5">
            Document Signed
          </h2>
          <p className="text-sm text-secondary max-w-[260px] leading-relaxed">
            Your signature has been securely recorded by DocuSign.
          </p>
        </div>

        {/* Details card */}
        <div
          className="w-full max-w-sm bg-surface border border-border rounded-xl overflow-hidden mb-5"
          style={{ animation: 'completion-fade-up 0.4s ease 0.25s both' }}
        >
          {/* Document name strip */}
          <div className="flex items-start gap-2.5 px-4 py-3 bg-accent/5 border-b border-border">
            <FileText size={13} className="text-accent shrink-0 mt-px" />
            <p className="text-xs font-semibold text-primary leading-snug line-clamp-2">
              {item?.subject ?? 'Signed Document'}
            </p>
          </div>

          {/* Rows */}
          <div className="divide-y divide-border">
            <DetailRow
              icon={<User size={12} />}
              label="Signed by"
              value={user?.name ?? user?.email ?? 'You'}
            />
            <DetailRow
              icon={<Clock size={12} />}
              label="Date"
              value={fmtDate(completedAt)}
            />
            <DetailRow
              icon={<span className="block w-3 h-3" />}
              label="Time"
              value={fmtTime(completedAt)}
            />
            {item?.envelopeId && (
              <DetailRow
                icon={<Hash size={12} />}
                label="Reference"
                value={item.envelopeId.slice(0, 8).toUpperCase()}
                mono
              />
            )}
          </div>
        </div>

        {/* What happens next */}
        <div
          className="w-full max-w-sm mb-7"
          style={{ animation: 'completion-fade-up 0.4s ease 0.35s both' }}
        >
          <p className="text-2xs font-semibold text-tertiary uppercase tracking-wider mb-3">
            What happens next
          </p>
          <ul className="space-y-3">
            {[
              'A certified copy will be emailed to your address on file.',
              'Your advisor has been notified and will countersign where required.',
              'This document is securely archived in your document portal.',
            ].map((text, i) => (
              <li key={i} className="flex items-start gap-2.5 text-xs text-secondary leading-relaxed">
                <span className="mt-0.5 w-4 h-4 rounded-full bg-success/10 flex items-center justify-center shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-success" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        {/* CTAs */}
        <div
          className="w-full max-w-sm flex flex-col gap-2"
          style={{ animation: 'completion-fade-up 0.4s ease 0.45s both' }}
        >
          <Button
            variant="accent"
            size="sm"
            className="w-full"
            onClick={onClose}
            icon={<ArrowLeft size={13} />}
          >
            Return to Documents
          </Button>

          {canDownload && (
            <Button
              variant="secondary"
              size="sm"
              className="w-full"
              loading={loadingDownload}
              onClick={onDownload}
              icon={<Download size={13} />}
            >
              Download Signed PDF
            </Button>
          )}
        </div>

      </div>
    </div>
  )
}

// ── Main panel ─────────────────────────────────────────────────────────────

export function SigningPanel() {
  const { signingUrl, signingItemId, closeSigning, updateStatus, addToast, items } = useMailboxStore()
  const { accessToken, accountId, baseUri, user } = useAuthStore()
  const iframeRef = useRef<HTMLIFrameElement>(null)

  const [completedAt,      setCompletedAt]      = useState<Date | null>(null)
  const [loadingDownload,  setLoadingDownload]  = useState(false)

  const signingItem = items.find(i => i.id === signingItemId)

  // Reset completion state whenever a fresh signing session opens
  useEffect(() => {
    if (signingUrl) setCompletedAt(null)
  }, [signingUrl])

  // Listen for postMessage from /docusign/return.html
  useEffect(() => {
    if (!signingUrl) return

    function handleMessage(event: MessageEvent) {
      if (event.data?.type !== 'docusign_return') return
      const { event: dsEvent } = event.data as { type: string; event: string }

      if (dsEvent === 'signing_complete') {
        if (signingItemId) updateStatus(signingItemId, 'completed')
        // Show the completion screen — no toast, no closeSigning()
        setCompletedAt(new Date())

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

  const handleDownload = async () => {
    if (!accessToken || !accountId || !baseUri || !signingItem?.envelopeId) return
    try {
      setLoadingDownload(true)
      const acct = user?.accounts.find(a => a.is_default) ?? user?.accounts[0]
      await downloadSignedDocument(
        accessToken,
        accountId,
        acct?.base_uri ?? baseUri,
        signingItem.envelopeId,
      )
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      addToast({ type: 'error', title: 'Download failed', message: msg })
    } finally {
      setLoadingDownload(false)
    }
  }

  // ── Empty state ──────────────────────────────────────────────────────────
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

  // ── Active signing session ───────────────────────────────────────────────
  return (
    <div className="h-full flex flex-col">

      {/* Header — updates label on completion */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0 bg-surface">
        <div className="flex items-center gap-2">
          {completedAt ? (
            <>
              <span className="w-2 h-2 rounded-full bg-success" />
              <span className="text-sm font-semibold text-primary">Signing Complete</span>
            </>
          ) : (
            <>
              <PenLine size={14} className="text-accent" />
              <span className="text-sm font-semibold text-primary">DocuSign</span>
            </>
          )}
        </div>
        <button
          onClick={closeSigning}
          className="p-1.5 rounded hover:bg-surface-2 text-secondary hover:text-primary transition-colors"
          aria-label="Close signing panel"
        >
          <X size={16} />
        </button>
      </div>

      {/* iframe OR completion screen */}
      {completedAt ? (
        <CompletionScreen
          completedAt={completedAt}
          item={signingItem}
          user={user}
          canDownload={!!signingItem?.envelopeId && !!accessToken}
          loadingDownload={loadingDownload}
          onClose={closeSigning}
          onDownload={handleDownload}
        />
      ) : (
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
      )}

    </div>
  )
}
