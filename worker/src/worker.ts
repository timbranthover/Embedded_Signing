/**
 * Arbor Wealth — DocuSign CORS Proxy Worker
 *
 * Forwards DocuSign REST API calls from the browser with correct CORS headers.
 * The browser sends its own Bearer token; this worker never stores credentials.
 *
 * Routes:
 *   /docusign/*  →  {base_uri}/restapi/{rest_of_path}
 *
 * Required header from browser:
 *   X-DocuSign-Base-Uri: https://demo.docusign.net  (or similar *.docusign.net)
 */

const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'https://timbranthover.github.io',
]

const ALLOWED_BASE_URI_PATTERN = /^https:\/\/[a-z0-9-]+\.docusign\.net$/i

const CORS_HEADERS = (origin: string) => ({
  'Access-Control-Allow-Origin':  origin,
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type, Accept, X-DocuSign-Base-Uri',
  'Access-Control-Max-Age':       '86400',
  'Vary':                         'Origin',
})

export default {
  async fetch(request: Request): Promise<Response> {
    const origin = request.headers.get('Origin') ?? ''
    const isAllowedOrigin = ALLOWED_ORIGINS.includes(origin)

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: CORS_HEADERS(isAllowedOrigin ? origin : ALLOWED_ORIGINS[0]),
      })
    }

    if (!isAllowedOrigin) {
      return new Response(JSON.stringify({ error: 'Origin not allowed' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const url = new URL(request.url)
    const path = url.pathname  // e.g. /docusign/v2.1/accounts/xxx/envelopes

    // Only handle /docusign/* paths
    if (!path.startsWith('/docusign/')) {
      return new Response(JSON.stringify({ error: 'Not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json', ...CORS_HEADERS(origin) },
      })
    }

    // Validate base URI from header
    const baseUri = request.headers.get('X-DocuSign-Base-Uri') ?? ''
    if (!ALLOWED_BASE_URI_PATTERN.test(baseUri)) {
      return new Response(
        JSON.stringify({ error: `Invalid or missing X-DocuSign-Base-Uri header. Got: "${baseUri}". Expected *.docusign.net` }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json', ...CORS_HEADERS(origin) },
        }
      )
    }

    // Strip /docusign prefix and reconstruct target URL
    // /docusign/accounts/xxx/envelopes → {baseUri}/restapi/v2.1/accounts/xxx/envelopes
    const restPath = path.slice('/docusign'.length)  // e.g. /v2.1/accounts/xxx/envelopes or /accounts/xxx/envelopes

    // Ensure we have /v2.1 prefix
    const targetPath = restPath.startsWith('/v2.1') ? restPath : `/restapi/v2.1${restPath}`
    const targetUrl  = `${baseUri}${targetPath}${url.search}`

    // Forward the request
    const proxyHeaders = new Headers()
    // Copy relevant headers
    const authorization = request.headers.get('Authorization')
    if (authorization) proxyHeaders.set('Authorization', authorization)
    const contentType = request.headers.get('Content-Type')
    if (contentType) proxyHeaders.set('Content-Type', contentType)
    proxyHeaders.set('Accept', 'application/json')
    proxyHeaders.set('User-Agent', 'ArborWealth-CFWorker/1.0')

    const body = ['GET', 'HEAD'].includes(request.method) ? undefined : await request.arrayBuffer()

    let dsResponse: Response
    try {
      dsResponse = await fetch(targetUrl, {
        method:  request.method,
        headers: proxyHeaders,
        body,
      })
    } catch (err) {
      return new Response(
        JSON.stringify({ error: 'Failed to reach DocuSign', detail: String(err) }),
        {
          status: 502,
          headers: { 'Content-Type': 'application/json', ...CORS_HEADERS(origin) },
        }
      )
    }

    // Return response with CORS headers added
    const respHeaders = new Headers(dsResponse.headers)
    const cors = CORS_HEADERS(origin)
    for (const [k, v] of Object.entries(cors)) {
      respHeaders.set(k, v)
    }
    // Remove security headers that might conflict
    respHeaders.delete('X-Frame-Options')

    return new Response(dsResponse.body, {
      status:  dsResponse.status,
      headers: respHeaders,
    })
  },
}
