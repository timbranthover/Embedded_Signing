import { AlertTriangle, Copy, CheckCheck } from 'lucide-react'
import { useState } from 'react'
import { getRedirectUri, getReturnUrl, API_MODE, WORKER_URL, CLIENT_ID, TEMPLATE_ID } from '../../lib/docusign'

interface SetupPanelProps {
  error?: string | null
  onDismiss?: () => void
}

function CopyField({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    })
  }
  return (
    <div className="flex items-center justify-between gap-3 bg-surface-2 rounded px-3 py-2 text-sm">
      <div className="min-w-0">
        <p className="text-2xs text-secondary uppercase tracking-wide font-semibold mb-0.5">{label}</p>
        <p className="font-mono text-xs text-primary break-all">{value}</p>
      </div>
      <button
        onClick={copy}
        className="shrink-0 p-1.5 rounded hover:bg-border transition-colors text-secondary hover:text-primary"
        aria-label="Copy"
      >
        {copied ? <CheckCheck size={14} className="text-success" /> : <Copy size={14} />}
      </button>
    </div>
  )
}

export function SetupPanel({ error, onDismiss }: SetupPanelProps) {
  const redirectUri1 = 'http://localhost:5173/oauth/callback.html'
  const redirectUri2 = 'https://timbranthover.github.io/Embedded_Signing/oauth/callback.html'
  const returnUrl1 = 'http://localhost:5173/docusign/return.html'
  const returnUrl2 = 'https://timbranthover.github.io/Embedded_Signing/docusign/return.html'
  const corsOrigin1 = 'http://localhost:5173'
  const corsOrigin2 = 'https://timbranthover.github.io'

  return (
    <div className="border border-warning/30 bg-warning-bg rounded-xl p-5 space-y-5">
      <div className="flex items-start gap-3">
        <AlertTriangle size={18} className="text-warning shrink-0 mt-0.5" />
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm text-primary">DocuSign configuration required</h3>
          {error && (
            <p className="mt-1 text-xs text-danger bg-danger-bg rounded px-2 py-1 font-mono break-all">{error}</p>
          )}
        </div>
        {onDismiss && (
          <button onClick={onDismiss} className="text-secondary hover:text-primary text-xs underline">
            Dismiss
          </button>
        )}
      </div>

      <div className="space-y-4 text-sm">
        {/* 1 – Template role */}
        <section>
          <p className="font-semibold text-primary mb-2">1. Template role name</p>
          <p className="text-secondary text-xs mb-2">
            Open template <code className="bg-surface-2 px-1 rounded font-mono text-xs">{TEMPLATE_ID}</code> in DocuSign → Templates → Edit → Recipients. Copy the <strong>Role Name</strong> of the signer, then set:
          </p>
          <CopyField label="VITE_DS_TEMPLATE_ROLE_NAME" value="<your role name here>" />
          <p className="text-xs text-secondary mt-1">Common values: <code className="font-mono">signer</code>, <code className="font-mono">Signer</code>, <code className="font-mono">Client</code></p>
        </section>

        {/* 2 – Redirect URIs */}
        <section>
          <p className="font-semibold text-primary mb-2">2. OAuth Redirect URIs (DocuSign app settings)</p>
          <p className="text-xs text-secondary mb-2">
            App: <strong>Integration Key {CLIENT_ID}</strong> → Admin → API and Keys → Edit → Redirect URIs
          </p>
          <div className="space-y-1.5">
            <CopyField label="Local redirect URI" value={redirectUri1} />
            <CopyField label="Production redirect URI" value={redirectUri2} />
            <CopyField label="Current page redirect URI" value={getRedirectUri()} />
          </div>
        </section>

        {/* 3 – Return URLs */}
        <section>
          <p className="font-semibold text-primary mb-2">3. DocuSign return URLs (informational — no config needed)</p>
          <div className="space-y-1.5">
            <CopyField label="Local return URL" value={returnUrl1} />
            <CopyField label="Production return URL" value={returnUrl2} />
            <CopyField label="Current return URL" value={getReturnUrl()} />
          </div>
        </section>

        {/* 4 – CORS */}
        {API_MODE === 'direct' && (
          <section>
            <p className="font-semibold text-primary mb-2">4. CORS origins (DocuSign app settings)</p>
            <p className="text-xs text-secondary mb-2">
              Same location → Allowed HTTP origins. Add both:
            </p>
            <div className="space-y-1.5">
              <CopyField label="Local CORS origin" value={corsOrigin1} />
              <CopyField label="Production CORS origin" value={corsOrigin2} />
            </div>
          </section>
        )}

        {/* 5 – Worker mode */}
        {API_MODE === 'worker' && (
          <section>
            <p className="font-semibold text-primary mb-2">4. Worker mode configuration</p>
            <CopyField label="Worker URL" value={WORKER_URL || 'Not set — add VITE_DS_WORKER_URL to .env'} />
            <p className="text-xs text-secondary mt-1">
              See <code className="font-mono">worker/README.md</code> for deployment instructions.
            </p>
          </section>
        )}
      </div>
    </div>
  )
}
