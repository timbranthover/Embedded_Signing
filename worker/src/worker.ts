/**
 * Arbor Wealth — DocuSign CORS Proxy Worker
 *
 * Solves two separate CORS problems:
 *   1. account-d.docusign.com/oauth/token  — auth server never sends CORS headers to browsers
 *   2. demo.docusign.net REST API           — needs CORS headers unless origins are registered
 *
 * Routes (all require Origin to be in ALLOWED_ORIGINS):
 *   POST /oauth/token    → https://account-d.docusign.com/oauth/token
 *   ANY  /docusign/*     → {X-DocuSign-Base-Uri}/restapi/v2.1/{rest_of_path}
 */

const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'https://timbranthover.github.io',
]

const ALLOWED_BASE_URI_PATTERN = /^https:\/\/[a-z0-9-]+\.docusign\.net$/i
const DS_AUTH_BASE = 'https://account-d.docusign.com'

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

export default {
  async fetch(request: Request): Promise<Response> {
    const origin = request.headers.get('Origin') ?? ''
    const allowed = ALLOWED_ORIGINS.includes(origin)

    // ── CORS preflight ──────────────────────────────────────────────────────
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

    // ── Route: /oauth/token  (proxy to DocuSign auth server) ───────────────
    // account-d.docusign.com never adds CORS headers to /oauth/token —
    // this is a hard DocuSign limitation for browser-only apps.
    // We proxy the call here and add our own CORS headers on the response.
    if (path === '/oauth/token') {
      if (request.method !== 'POST') {
        return jsonError('Method not allowed', 405, origin)
      }

      const targetUrl = `${DS_AUTH_BASE}/oauth/token`
      const proxyHeaders = new Headers()

      const ct   = request.headers.get('Content-Type')
      const auth = request.headers.get('Authorization')
      if (ct)   proxyHeaders.set('Content-Type',  ct)
      if (auth) proxyHeaders.set('Authorization', auth)
      proxyHeaders.set('Accept', 'application/json')
      // DocuSign requires Origin to be present in the token exchange request.
      // Cloudflare Workers (unlike browsers) can set Origin on outgoing fetches.
      proxyHeaders.set('Origin', origin)

      let dsResponse: Response
      try {
        dsResponse = await fetch(targetUrl, {
          method:  'POST',
          headers: proxyHeaders,
          body:    await request.text(),
        })
      } catch (err) {
        return jsonError(`Upstream fetch failed: ${String(err)}`, 502, origin)
      }

      const respHeaders = new Headers(dsResponse.headers)
      for (const [k, v] of Object.entries(corsHeaders(origin))) {
        respHeaders.set(k, v)
      }

      return new Response(dsResponse.body, {
        status:  dsResponse.status,
        headers: respHeaders,
      })
    }

    // ── Route: /docusign/*  (proxy to DocuSign REST API) ───────────────────
    if (path.startsWith('/docusign/')) {
      const baseUri = request.headers.get('X-DocuSign-Base-Uri') ?? ''
      if (!ALLOWED_BASE_URI_PATTERN.test(baseUri)) {
        return jsonError(
          `Missing or invalid X-DocuSign-Base-Uri header. Expected *.docusign.net, got "${baseUri}"`,
          400, origin
        )
      }

      // Strip /docusign prefix; ensure /v2.1 is present
      const restPath   = path.slice('/docusign'.length)
      const targetPath = restPath.startsWith('/v2.1')
        ? `/restapi${restPath}`
        : `/restapi/v2.1${restPath}`
      const targetUrl  = `${baseUri}${targetPath}${url.search}`

      const proxyHeaders = new Headers()
      const auth = request.headers.get('Authorization')
      const ct   = request.headers.get('Content-Type')
      if (auth) proxyHeaders.set('Authorization', auth)
      if (ct)   proxyHeaders.set('Content-Type',  ct)
      proxyHeaders.set('Accept',     'application/json')
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
      for (const [k, v] of Object.entries(corsHeaders(origin))) {
        respHeaders.set(k, v)
      }
      respHeaders.delete('X-Frame-Options')

      return new Response(dsResponse.body, {
        status:  dsResponse.status,
        headers: respHeaders,
      })
    }

    return jsonError('Not found. Valid routes: /oauth/token, /docusign/*', 404, origin)
  },
}
