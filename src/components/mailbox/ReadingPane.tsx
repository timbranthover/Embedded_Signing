import { PenLine, AlertCircle, Download } from 'lucide-react'
import { useMailboxStore } from '../../store/mailboxStore'
import { useAuthStore } from '../../store/authStore'
import { StatusBadge } from '../ui/Badge'
import { Button } from '../ui/Button'
import { createRecipientView, downloadSignedDocument } from '../../lib/docusign'
import { useState } from 'react'

export function ReadingPane() {
  const { items, selectedId, openSigning, addToast } = useMailboxStore()
  const { accessToken, accountId, baseUri, user } = useAuthStore()
  const [loadingSign,     setLoadingSign]     = useState(false)
  const [loadingDownload, setLoadingDownload] = useState(false)

  const item = items.find(i => i.id === selectedId)

  if (!item) {
    return (
      <div className="flex-1 flex items-center justify-center text-secondary">
        <div className="text-center">
          <p className="text-sm font-medium">Select a document to read</p>
          <p className="text-xs text-tertiary mt-1">Click any item in the list</p>
        </div>
      </div>
    )
  }

  const canSign     = item.status === 'awaiting_signature' && item.isReal && item.envelopeId
  const canDownload = item.status === 'completed'          && item.isReal && item.envelopeId

  const handleSign = async () => {
    if (!accessToken || !accountId || !baseUri || !item.envelopeId) return
    if (!user) return
    try {
      setLoadingSign(true)
      const defaultAccount = user.accounts.find(a => a.is_default) ?? user.accounts[0]
      const signerName  = user.name || user.email
      const signerEmail = user.email

      const url = await createRecipientView(
        accessToken,
        accountId,
        defaultAccount.base_uri,
        item.envelopeId,
        signerName,
        signerEmail
      )
      openSigning(item.id, url)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      addToast({ type: 'error', title: 'Could not open signing', message: msg })
    } finally {
      setLoadingSign(false)
    }
  }

  const handleDownload = async () => {
    if (!accessToken || !accountId || !baseUri || !item.envelopeId) return
    try {
      setLoadingDownload(true)
      await downloadSignedDocument(accessToken, accountId, baseUri, item.envelopeId)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      addToast({ type: 'error', title: 'Download failed', message: msg })
    } finally {
      setLoadingDownload(false)
    }
  }

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    })

  return (
    <div className="flex flex-col h-full overflow-y-auto">
      {/* Header */}
      <div className="px-6 py-5 border-b border-border shrink-0">
        {/* Subject — full width, never competes with badge */}
        <h2 className="font-display font-semibold text-lg text-primary leading-snug mb-2 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2] overflow-hidden">
          {item.subject}
        </h2>

        {/* Badge on its own row — no balloon-stretching */}
        <div className="mb-3">
          <StatusBadge status={item.status} />
        </div>

        {/* Metadata — wraps naturally on narrow panes, no orphaned separators */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-secondary">
          <span>From: <strong className="text-primary">{item.from}</strong></span>
          <span>{formatDate(item.date)}</span>
          {item.envelopeId && (
            <span className="font-mono truncate max-w-[140px]" title={item.envelopeId}>
              env: {item.envelopeId.slice(0, 8)}…
            </span>
          )}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 px-6 py-5">
        <div className="prose prose-sm max-w-none">
          {item.body.split('\n\n').map((paragraph, i) => (
            <p key={i} className="text-sm text-primary leading-relaxed mb-3 last:mb-0">
              {paragraph}
            </p>
          ))}
        </div>

        {/* Mock document placeholder for seeded items */}
        {!item.isReal && (
          <div className="mt-6 border border-border rounded-lg p-8 text-center bg-surface-2">
            <div className="w-12 h-16 mx-auto mb-3 rounded-sm border-2 border-border bg-surface flex items-center justify-center">
              <span className="text-2xs font-mono text-tertiary">PDF</span>
            </div>
            <p className="text-xs text-secondary">Document preview (mock)</p>
          </div>
        )}
      </div>

      {/* Sign CTA */}
      {item.status === 'awaiting_signature' && (
        <div className="px-6 py-4 border-t border-border bg-warning-bg/50 shrink-0">
          {canSign ? (
            <div className="flex items-center gap-3">
              <PenLine size={16} className="text-warning shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-primary">Your signature is required</p>
                <p className="text-xs text-secondary">Complete this document to proceed.</p>
              </div>
              <Button
                variant="accent"
                size="sm"
                loading={loadingSign}
                icon={<PenLine size={13} />}
                onClick={handleSign}
              >
                Sign now
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <AlertCircle size={16} className="text-warning shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium text-primary">Signature required</p>
                <p className="text-xs text-secondary">
                  {item.isReal
                    ? 'Connect DocuSign to sign this document.'
                    : 'This is a mock item. Send a real envelope from the toolbar to sign live.'}
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Download CTA — shown for completed real envelopes */}
      {item.status === 'completed' && (
        <div className="px-6 py-4 border-t border-border bg-success-bg/30 shrink-0">
          {canDownload ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-success/10 shrink-0">
                <Download size={15} className="text-success" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-primary">Document signed &amp; complete</p>
                <p className="text-xs text-secondary">Download a certified PDF copy for your records.</p>
              </div>
              <Button
                variant="accent"
                size="sm"
                loading={loadingDownload}
                icon={<Download size={13} />}
                onClick={handleDownload}
              >
                Download PDF
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-success/10 shrink-0">
                <Download size={15} className="text-success" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-primary">Document completed</p>
                <p className="text-xs text-secondary">This is a mock item — no PDF to download.</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
