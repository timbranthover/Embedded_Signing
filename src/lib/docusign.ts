import type { DSUser, DSTokenResponse } from '../types'

const CLIENT_ID   = import.meta.env.VITE_DS_CLIENT_ID   ?? '5474e846-98a1-47b7-b9bd-b7f31c3fad9c'
const AUTH_BASE   = import.meta.env.VITE_DS_AUTH_BASE   ?? 'https://account-d.docusign.com'
const SCOPES      = import.meta.env.VITE_DS_SCOPES      ?? 'signature openid profile email'
const TEMPLATE_ID = import.meta.env.VITE_DS_TEMPLATE_ID ?? 'd880d558-b959-4cc8-a4c1-2aff259c829f'
const ROLE_NAME   = import.meta.env.VITE_DS_TEMPLATE_ROLE_NAME ?? 'Signer'
const CLIENT_USER_ID = import.meta.env.VITE_DS_CLIENT_USER_ID ?? '1000'

const API_MODE    = (import.meta.env.VITE_DS_API_MODE ?? 'direct') as 'direct' | 'worker'
const WORKER_URL  = (import.meta.env.VITE_DS_WORKER_URL ?? '').replace(/\/$/, '')

export { CLIENT_ID, AUTH_BASE, SCOPES, TEMPLATE_ID, ROLE_NAME, CLIENT_USER_ID, API_MODE, WORKER_URL }

// ─── JWT auto-authentication (no popup, no button) ───────────────────────

export async function autoAuthenticate(): Promise<{ access_token: string; user: DSUser }> {
  if (!WORKER_URL) throw new Error('VITE_DS_WORKER_URL is not configured')
  const resp = await fetch(`${WORKER_URL}/auth/auto-token`, {
    method: 'GET',
    headers: { Accept: 'application/json' },
  })
  if (!resp.ok) {
    const text = await resp.text()
    throw new Error(`Auto-auth failed (${resp.status}): ${text}`)
  }
  return resp.json() as Promise<{ access_token: string; user: DSUser }>
}

// ─── OAuth helpers ────────────────────────────────────────────────────────

export function getRedirectUri(): string {
  return window.location.origin + import.meta.env.BASE_URL + 'oauth/callback.html'
}

export function getReturnUrl(): string {
  return window.location.origin + import.meta.env.BASE_URL + 'docusign/return.html'
}

export function buildAuthUrl(challenge: string, state: string): string {
  const params = new URLSearchParams({
    response_type: 'code',
    scope: SCOPES,
    client_id: CLIENT_ID,
    redirect_uri: getRedirectUri(),
    code_challenge: challenge,
    code_challenge_method: 'S256',
    state,
  })
  return `${AUTH_BASE}/oauth/auth?${params.toString()}`
}

export async function exchangeCodeForToken(
  code: string,
  verifier: string
): Promise<DSTokenResponse> {
  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    client_id: CLIENT_ID,
    redirect_uri: getRedirectUri(),
    code_verifier: verifier,
  })

  // DocuSign's auth server (account-d.docusign.com) never sends CORS headers
  // to browser requests on /oauth/token — this is a hard platform limitation.
  // Route through the Worker if a Worker URL is configured; fall back to direct
  // (which will fail with CORS in a browser but works in dev tools / curl).
  const tokenUrl = WORKER_URL
    ? `${WORKER_URL}/oauth/token`
    : `${AUTH_BASE}/oauth/token`

  // Basic auth with clientId only (no secret — PKCE replaces the secret)
  const credentials = btoa(`${CLIENT_ID}:`)

  const resp = await fetch(tokenUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': `Basic ${credentials}`,
    },
    body: body.toString(),
  })

  if (!resp.ok) {
    const text = await resp.text()
    throw new Error(`Token exchange failed (${resp.status}): ${text}`)
  }

  return resp.json() as Promise<DSTokenResponse>
}

export async function fetchUserInfo(accessToken: string): Promise<DSUser> {
  const resp = await fetch(`${AUTH_BASE}/oauth/userinfo`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!resp.ok) throw new Error(`UserInfo failed (${resp.status})`)
  return resp.json() as Promise<DSUser>
}

// ─── DocuSign REST API ────────────────────────────────────────────────────

function apiBase(baseUri: string): string {
  // Use Worker whenever a URL is configured (handles REST API CORS too)
  if (WORKER_URL) {
    return WORKER_URL + '/docusign'
  }
  return `${baseUri}/restapi/v2.1`
}

async function dsRequest(
  method: string,
  url: string,
  accessToken: string,
  body?: unknown,
  baseUri?: string
): Promise<Response> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  }
  // Pass base_uri header so the Worker knows where to forward the request
  if (WORKER_URL && baseUri) {
    headers['X-DocuSign-Base-Uri'] = baseUri
  }

  return fetch(url, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  })
}

export async function createEnvelope(
  accessToken: string,
  accountId: string,
  baseUri: string,
  signerName: string,
  signerEmail: string
): Promise<string> {
  const base = apiBase(baseUri)
  const url = `${base}/accounts/${accountId}/envelopes`

  const payload = {
    templateId: TEMPLATE_ID,
    templateRoles: [
      {
        roleName: ROLE_NAME,
        name: signerName,
        email: signerEmail,
        clientUserId: CLIENT_USER_ID,
      },
    ],
    status: 'sent',
  }

  const resp = await dsRequest('POST', url, accessToken, payload, baseUri)

  if (!resp.ok) {
    const text = await resp.text()
    // Try to parse error for role name hints
    let parsed: { errorCode?: string; message?: string } = {}
    try { parsed = JSON.parse(text) } catch { /* ignore */ }
    const err = new Error(`Envelope creation failed (${resp.status}): ${parsed.message ?? text}`) as Error & { dsErrorCode?: string; dsBody?: string }
    err.dsErrorCode = parsed.errorCode
    err.dsBody = text
    throw err
  }

  const data = (await resp.json()) as { envelopeId: string }
  return data.envelopeId
}

export async function createRecipientView(
  accessToken: string,
  accountId: string,
  baseUri: string,
  envelopeId: string,
  signerName: string,
  signerEmail: string
): Promise<string> {
  const base = apiBase(baseUri)
  const url = `${base}/accounts/${accountId}/envelopes/${envelopeId}/views/recipient`

  const returnUrl = getReturnUrl()

  const payload = {
    authenticationMethod: 'none',
    clientUserId: CLIENT_USER_ID,
    email: signerEmail,
    userName: signerName,
    returnUrl,
  }

  const resp = await dsRequest('POST', url, accessToken, payload, baseUri)

  if (!resp.ok) {
    const text = await resp.text()
    throw new Error(`Recipient view failed (${resp.status}): ${text}`)
  }

  const data = (await resp.json()) as { url: string }
  return data.url
}

export async function getEnvelopeStatus(
  accessToken: string,
  accountId: string,
  baseUri: string,
  envelopeId: string
): Promise<string> {
  const base = apiBase(baseUri)
  const url = `${base}/accounts/${accountId}/envelopes/${envelopeId}`

  const resp = await dsRequest('GET', url, accessToken, undefined, baseUri)
  if (!resp.ok) throw new Error(`Get envelope failed (${resp.status})`)

  const data = (await resp.json()) as { status: string }
  return data.status
}

export async function downloadSignedDocument(
  accessToken: string,
  accountId: string,
  baseUri: string,
  envelopeId: string,
  filename = `signed-document-${envelopeId.slice(0, 8)}.pdf`
): Promise<void> {
  const base = apiBase(baseUri)
  const url  = `${base}/accounts/${accountId}/envelopes/${envelopeId}/documents/combined`

  // Build headers manually so we can set Accept: application/pdf
  const headers: Record<string, string> = {
    Authorization: `Bearer ${accessToken}`,
    Accept: 'application/pdf',
  }
  if (WORKER_URL && baseUri) {
    headers['X-DocuSign-Base-Uri'] = baseUri
  }

  const resp = await fetch(url, { method: 'GET', headers })

  if (!resp.ok) {
    const text = await resp.text()
    throw new Error(`Document download failed (${resp.status}): ${text}`)
  }

  // Trigger browser save-as dialog
  const blob      = await resp.blob()
  const objectUrl = URL.createObjectURL(blob)
  const anchor    = document.createElement('a')
  anchor.href     = objectUrl
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(objectUrl)
}
