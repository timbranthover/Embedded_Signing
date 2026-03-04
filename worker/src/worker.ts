/**
 * Arbor Wealth — DocuSign CORS + JWT Proxy Worker
 *
 * Routes:
 *   GET  /auth/auto-token  → JWT Grant: signs JWT with RSA key, exchanges for DS token, returns token + user info
 *   ANY  /docusign/*       → {X-DocuSign-Base-Uri}/restapi/v2.1/{rest_of_path}
 *
 * CF Worker secrets (set via `wrangler secret put`):
 *   DS_PRIVATE_KEY   — RSA-2048 private key PEM
 *   DS_USER_ID       — DocuSign user GUID (sub claim)
 *
 * CF Worker vars (wrangler.toml [vars]):
 *   DS_CLIENT_ID     — Integration key
 *   DS_AUTH_BASE     — https://account-d.docusign.com
 */

interface Env {
  DS_PRIVATE_KEY: string
  DS_USER_ID: string
  DS_CLIENT_ID: string
  DS_AUTH_BASE: string
}

const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'https://timbranthover.github.io',
]

const ALLOWED_BASE_URI_PATTERN = /^https:\/\/[a-z0-9-]+\.docusign\.net$/i

function corsHeaders(origin: string): Record<string, string> {
  return {
    'Access-Control-Allow-Origin':  origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Authorization, Content-Type, Accept, X-DocuSign-Base-Uri',
    'Access-Control-Max-Age':       '86400',
    'Vary':                         'Origin',
  }
}

function jsonError(msg: string, status: number, origin: string): Response {
  return new Response(JSON.stringify({ error: msg }), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
  })
}

// ── JWT helpers ──────────────────────────────────────────────────────────────

function pemToArrayBuffer(pem: string): ArrayBuffer {
  const b64 = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, '')
    .replace(/-----END PRIVATE KEY-----/, '')
    .replace(/\s/g, '')
  const binary = atob(b64)
  const buffer = new ArrayBuffer(binary.length)
  const view = new Uint8Array(buffer)
  for (let i = 0; i < binary.length; i++) view[i] = binary.charCodeAt(i)
  return buffer
}

function b64url(str: string): string {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

function arrayBufferToB64url(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i])
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

async function buildJWT(env: Env): Promise<string> {
  const now = Math.floor(Date.now() / 1000)
  const aud = new URL(env.DS_AUTH_BASE).hostname // e.g. account-d.docusign.com

  const header  = b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))
  const payload = b64url(JSON.stringify({
    iss:   env.DS_CLIENT_ID,
    sub:   env.DS_USER_ID,
    aud,
    iat:   now,
    exp:   now + 3600,
    scope: 'signature impersonation',
  }))

  const signingInput = `${header}.${payload}`

  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    pemToArrayBuffer(env.DS_PRIVATE_KEY),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  )

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    privateKey,
    new TextEncoder().encode(signingInput),
  )

  return `${signingInput}.${arrayBufferToB64url(signature)}`
}

// ── Main fetch handler ───────────────────────────────────────────────────────

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const origin  = request.headers.get('Origin') ?? ''
    const allowed = ALLOWED_ORIGINS.includes(origin)

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(allowed ? origin : ALLOWED_ORIGINS[0]),
      })
    }

    if (!allowed) {
      return jsonError(`Origin "${origin}" not allowed`, 403, ALLOWED_ORIGINS[0])
    }

    const url  = new URL(request.url)
    const path = url.pathname

    // ── Route: /auth/auto-token — JWT Grant (server-to-server, no CORS issues) ─
    if (path === '/auth/auto-token') {
      try {
        if (!env.DS_PRIVATE_KEY || !env.DS_USER_ID) {
          return jsonError('Worker secrets DS_PRIVATE_KEY and DS_USER_ID are not configured', 500, origin)
        }

        // 1. Build + sign JWT
        const jwt = await buildJWT(env)

        // 2. Exchange JWT assertion for access token (pure server-to-server — no Origin needed)
        const tokenResp = await fetch(`${env.DS_AUTH_BASE}/oauth/token`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body:    `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
        })

        const tokenData = await tokenResp.json() as Record<string, unknown>
        console.log('[/auth/auto-token] DS token response:', tokenResp.status, JSON.stringify(tokenData))

        if (!tokenResp.ok) {
          return new Response(JSON.stringify(tokenData), {
            status: tokenResp.status,
            headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
          })
        }

        // 3. Fetch user info (name, email, accounts, baseUri)
        const userResp = await fetch(`${env.DS_AUTH_BASE}/oauth/userinfo`, {
          headers: { 'Authorization': `Bearer ${tokenData.access_token}` },
        })
        const userData = await userResp.json() as Record<string, unknown>

        return new Response(JSON.stringify({
          access_token: tokenData.access_token,
          token_type:   tokenData.token_type,
          expires_in:   tokenData.expires_in,
          user:         userData,  // DSUser shape: { sub, name, email, accounts[] }
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json', ...corsHeaders(origin) },
        })
      } catch (err) {
        console.error('[/auth/auto-token] Error:', String(err))
        return jsonError(`JWT auth failed: ${String(err)}`, 500, origin)
      }
    }

    // ── Route: /docusign/* — proxy to DocuSign REST API ─────────────────────
    if (path.startsWith('/docusign/')) {
      const baseUri = request.headers.get('X-DocuSign-Base-Uri') ?? ''
      if (!ALLOWED_BASE_URI_PATTERN.test(baseUri)) {
        return jsonError(
          `Missing or invalid X-DocuSign-Base-Uri header. Expected *.docusign.net, got "${baseUri}"`,
          400, origin,
        )
      }

      const restPath   = path.slice('/docusign'.length)
      const targetPath = restPath.startsWith('/v2.1') ? `/restapi${restPath}` : `/restapi/v2.1${restPath}`
      const targetUrl  = `${baseUri}${targetPath}${url.search}`

      const proxyHeaders = new Headers()
      const auth   = request.headers.get('Authorization')
      const ct     = request.headers.get('Content-Type')
      const accept = request.headers.get('Accept')
      if (auth)   proxyHeaders.set('Authorization', auth)
      if (ct)     proxyHeaders.set('Content-Type',  ct)
      // Forward the caller's Accept header so PDF downloads work (application/pdf)
      proxyHeaders.set('Accept',     accept ?? 'application/json')
      proxyHeaders.set('User-Agent', 'ArborWealth-CFWorker/1.0')

      const hasBody = !['GET', 'HEAD'].includes(request.method)

      let dsResponse: Response
      try {
        dsResponse = await fetch(targetUrl, {
          method:  request.method,
          headers: proxyHeaders,
          body:    hasBody ? await request.arrayBuffer() : undefined,
        })
      } catch (err) {
        return jsonError(`Upstream fetch failed: ${String(err)}`, 502, origin)
      }

      const respHeaders = new Headers(dsResponse.headers)
      for (const [k, v] of Object.entries(corsHeaders(origin))) respHeaders.set(k, v)
      respHeaders.delete('X-Frame-Options')

      return new Response(dsResponse.body, { status: dsResponse.status, headers: respHeaders })
    }

    return jsonError('Not found. Valid routes: /auth/auto-token, /docusign/*', 404, origin)
  },
}
