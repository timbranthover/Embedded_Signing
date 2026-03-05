import { useState } from 'react'
import { Send, AlertTriangle } from 'lucide-react'
import { Button } from '../ui/Button'
import { Modal } from '../ui/Modal'
import { SetupPanel } from '../docusign/SetupPanel'
import { useAuthStore } from '../../store/authStore'
import { useMailboxStore } from '../../store/mailboxStore'
import { createEnvelope } from '../../lib/docusign'
import type { MailboxItem } from '../../types'

export function SendTemplateButton() {
  const { accessToken, user, accountId, baseUri } = useAuthStore()
  const { addItem, addToast, setSendError } = useMailboxStore()
  const [loading, setLoading] = useState(false)
  const [error, setError]   = useState<string | null>(null)
  const [showSetup, setShowSetup] = useState(false)

  // Email override input state
  const [showEmailInput, setShowEmailInput] = useState(false)
  const [emailOverride, setEmailOverride] = useState('')
  const [nameOverride, setNameOverride] = useState('')

  const handleSend = async () => {
    if (!accessToken || !accountId || !baseUri || !user) {
      addToast({ type: 'error', title: 'Not connected', message: 'Connect DocuSign first.' })
      return
    }

    const defaultAccount = user.accounts.find(a => a.is_default) ?? user.accounts[0]
    const signerEmail = emailOverride.trim() || user.email
    const signerName  = nameOverride.trim()  || user.name || user.email

    try {
      setLoading(true)
      setError(null)

      const envelopeId = await createEnvelope(
        accessToken,
        accountId,
        defaultAccount.base_uri,
        signerName,
        signerEmail
      )

      const item: MailboxItem = {
        id: `env-${envelopeId}`,
        envelopeId,
        subject: 'Document Signature Request',
        from: 'Arbor Wealth via DocuSign',
        preview: 'A new document requires your signature. Click to sign.',
        body: `Dear ${signerName},\n\nA document has been prepared for your signature. Please review the contents carefully before signing.\n\nThis document was sent via DocuSign from your Arbor Wealth portal.\n\nSigned: ${signerName} (${signerEmail})\nEnvelope ID: ${envelopeId}`,
        date: new Date().toISOString(),
        status: 'awaiting_signature',
        isReal: true,
        read: false,
      }

      addItem(item)
      setShowEmailInput(false)
      setEmailOverride('')
      setNameOverride('')

      addToast({
        type: 'success',
        title: 'Envelope sent',
        message: `Sent to ${signerEmail}. Open the item to sign.`,
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(msg)
      setSendError(msg)
      setShowSetup(true)
      addToast({ type: 'error', title: 'Envelope creation failed', message: msg.slice(0, 80) })
    } finally {
      setLoading(false)
    }
  }

  if (!accessToken) {
    return (
      <Button variant="ghost" size="sm" disabled icon={<Send size={13} />}>
        Send template
      </Button>
    )
  }

  return (
    <>
      <div className="flex items-center gap-2">
        <Button
          variant="accent"
          size="sm"
          loading={loading}
          icon={<Send size={13} />}
          onClick={() => setShowEmailInput(v => !v)}
        >
          Send template
        </Button>
        {error && (
          <button
            onClick={() => setShowSetup(true)}
            className="flex items-center gap-1 text-xs text-danger hover:underline"
          >
            <AlertTriangle size={12} />
            Setup required
          </button>
        )}
      </div>

      {/* Email override popover */}
      {showEmailInput && (
        <div className="absolute top-full mt-2 right-0 z-50 w-80 max-w-[calc(100vw-2rem)] bg-surface border border-border rounded-xl shadow-modal p-4 space-y-3">
          <p className="text-sm font-semibold text-primary">Send to</p>
          <div className="space-y-2">
            <div>
              <label className="text-xs text-secondary mb-1 block">Name</label>
              <input
                type="text"
                value={nameOverride}
                onChange={e => setNameOverride(e.target.value)}
                placeholder={user?.name || 'Your name'}
                className="w-full h-8 px-3 rounded bg-surface-2 border border-border text-sm text-primary placeholder:text-tertiary focus:outline-none focus:ring-1 focus:ring-accent/40"
              />
            </div>
            <div>
              <label className="text-xs text-secondary mb-1 block">Email</label>
              <input
                type="email"
                value={emailOverride}
                onChange={e => setEmailOverride(e.target.value)}
                placeholder={user?.email || 'your@email.com'}
                className="w-full h-8 px-3 rounded bg-surface-2 border border-border text-sm text-primary placeholder:text-tertiary focus:outline-none focus:ring-1 focus:ring-accent/40"
              />
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <Button variant="accent" size="sm" loading={loading} onClick={handleSend} className="flex-1">
              Send
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setShowEmailInput(false)}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Setup panel modal */}
      <Modal open={showSetup} onClose={() => setShowSetup(false)} title="DocuSign Configuration" size="lg">
        <div className="p-6">
          <SetupPanel error={error} onDismiss={() => setShowSetup(false)} />
        </div>
      </Modal>
    </>
  )
}
