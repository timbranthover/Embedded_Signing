# DocuSign CORS Proxy — Cloudflare Worker

This Worker proxies DocuSign REST API calls from the browser, adding CORS headers.
Use it when direct-mode CORS is blocked (the default `VITE_DS_API_MODE=direct` may work with properly configured DocuSign CORS origins).

## When to use

- **Direct mode** works if your DocuSign integration key has CORS origins registered.
- **Worker mode** is the fallback if you see CORS errors when creating envelopes.

## Deploy

### Prerequisites
- [Cloudflare account](https://dash.cloudflare.com) (free tier works)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/): `npm install -g wrangler`

### Steps

```bash
cd worker
cp wrangler.toml.example wrangler.toml
npm install
wrangler login
wrangler deploy
```

After deploy, Wrangler will print your worker URL, e.g.:
`https://arbor-docusign-proxy.YOUR-SUBDOMAIN.workers.dev`

### Configure the app

In your `.env` (or `.env.local`):
```env
VITE_DS_API_MODE=worker
VITE_DS_WORKER_URL=https://arbor-docusign-proxy.YOUR-SUBDOMAIN.workers.dev
```

Then rebuild: `npm run build` (or restart `npm run dev`).

## How it works

The browser sends:
```
POST https://your-worker.workers.dev/docusign/accounts/{accountId}/envelopes
Authorization: Bearer <access_token>
X-DocuSign-Base-Uri: https://demo.docusign.net
```

The Worker:
1. Validates origin is in the allowlist (`localhost:5173` or `github.io`)
2. Validates `X-DocuSign-Base-Uri` matches `*.docusign.net`
3. Forwards to `https://demo.docusign.net/restapi/v2.1/accounts/{accountId}/envelopes`
4. Returns the response with CORS headers added

The Worker **never stores tokens**. The browser's Bearer token is forwarded as-is.

## Allowed origins

Edit `src/worker.ts` to add more origins if needed:
```typescript
const ALLOWED_ORIGINS = [
  'http://localhost:5173',
  'https://timbranthover.github.io',
  // Add your own domain here
]
```
