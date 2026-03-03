# Arbor Wealth — Embedded Signing Portal

A premium brokerage portal demo with DocuSign embedded signing.

**Live:** https://timbranthover.github.io/Embedded_Signing/

---

## Quick start (local)

```bash
git clone https://github.com/timbranthover/Embedded_Signing.git
cd Embedded_Signing
npm install

# Configure environment
cp .env.example .env
# Edit .env — at minimum, set VITE_DS_TEMPLATE_ROLE_NAME (see below)

npm run dev
# → http://localhost:5173
```

---

## DocuSign app configuration (required before OAuth works)

### 1. Find your integration key

Your integration key is already baked into the app:
`e3b57567-c8d9-4a8c-9afa-a9c17d6c0e6c`

### 2. Add OAuth redirect URIs

In [DocuSign Admin](https://admindemo.docusign.com) → API and Keys → click your integration key → Edit:

Under **Redirect URIs**, add **both**:
```
http://localhost:5173/oauth/callback.html
https://timbranthover.github.io/Embedded_Signing/oauth/callback.html
```

### 3. Add CORS origins (direct mode only)

Under **Allowed HTTP Origins**, add **both**:
```
http://localhost:5173
https://timbranthover.github.io
```

Skip this step if you use worker mode instead.

### 4. Find the template role name

In DocuSign → **Templates** → open template `d880d558-b959-4cc8-a4c1-2aff259c829f` → **Edit** → **Recipients**.

Find the **Role Name** column (e.g. `signer`, `Signer`, `Client`). Copy it exactly.

Set in `.env`:
```env
VITE_DS_TEMPLATE_ROLE_NAME=signer   # ← replace with your exact value
```

### 5. Verify scopes

The app requests: `signature cors openid profile email`

Ensure your integration key allows the `cors` scope (required for browser-direct API calls).

---

## Deploy to GitHub Pages

```bash
npm run build     # builds to dist/
npm run deploy    # pushes dist/ to gh-pages branch via gh-pages
```

The site will be live at:
`https://timbranthover.github.io/Embedded_Signing/`

> **Note:** Vite sets `base: '/Embedded_Signing/'` in production automatically.

---

## Direct mode vs Worker mode

### Direct mode (`VITE_DS_API_MODE=direct`)

The browser calls DocuSign APIs directly. Requires:
- CORS origins registered in DocuSign admin
- `cors` scope granted in OAuth

**Use this first.** It's simpler.

### Worker mode (`VITE_DS_API_MODE=worker`)

A Cloudflare Worker proxies all DocuSign REST calls. Use this if you see CORS errors in direct mode.

```env
VITE_DS_API_MODE=worker
VITE_DS_WORKER_URL=https://your-worker.workers.dev
```

See `worker/README.md` for deployment steps.

---

## The signing flow

1. Click **Connect DocuSign** in the top bar → OAuth popup opens → authorizes
2. Go to **Documents** → click **Send template** → enter your name/email → **Send**
3. The new envelope appears in the document list with status *Awaiting your signature*
4. Open it → click **Sign now** → DocuSign signing UI loads in the right panel
5. Complete signing → status flips to *Completed* + confirmation toast

---

## Troubleshooting

### CORS error on token exchange or API call
- Make sure CORS origins are registered in DocuSign admin
- Try switching to worker mode (`VITE_DS_API_MODE=worker`)

### `TEMPLATE_RECIPIENTS_NOT_ALLOWED` or role mismatch
- The `VITE_DS_TEMPLATE_ROLE_NAME` must exactly match the role name in the template
- Check for case sensitivity (`signer` ≠ `Signer`)

### `clientUserId` mismatch on recipient view
- The `clientUserId` in the envelope creation and recipient view requests must match exactly
- Default is `1000`; change `VITE_DS_CLIENT_USER_ID` in both places if needed

### Popup blocked
- Allow popups for `localhost:5173` or `timbranthover.github.io` in your browser

### returnUrl mismatch
- The return URL is computed from `window.location.origin + BASE_URL + 'docusign/return.html'`
- In production: `https://timbranthover.github.io/Embedded_Signing/docusign/return.html`
- This must match what DocuSign can reach (it must be publicly accessible)

### `/mailbox` returns 404 on GitHub Pages
- The `public/404.html` redirect handles this — ensure it was deployed
- It redirects `https://timbranthover.github.io/Embedded_Signing/mailbox` → `/?p=/mailbox` → app decodes and renders `/mailbox`

---

## Architecture

```
src/
  lib/
    pkce.ts          PKCE code_verifier / code_challenge generation
    docusign.ts      DocuSign API client (envelope, recipient view, userinfo)
    storage.ts       sessionStorage helpers
  store/
    authStore.ts     Zustand: access token, user, accountId, baseUri
    mailboxStore.ts  Zustand: mailbox items, toasts, signing state
  components/
    ui/              Button, Card, Badge, Modal, Sheet, Toast, Skeleton
    layout/          Sidebar, TopBar, Layout
    dashboard/       AccountSummary, PerformanceChart, AllocationChart, PositionsTable, DocumentsCard
    mailbox/         MessageList, ReadingPane, SigningPanel, SendTemplateButton
    docusign/        ConnectButton, SetupPanel
  pages/
    Dashboard.tsx
    Mailbox.tsx
public/
  404.html           GitHub Pages SPA redirect
  oauth/callback.html   OAuth PKCE redirect target
  docusign/return.html  DocuSign signing return target
worker/
  src/worker.ts      Cloudflare Worker CORS proxy
```

---

## Environment variables

| Variable | Default | Description |
|---|---|---|
| `VITE_DS_CLIENT_ID` | `e3b57567-…` | DocuSign integration key |
| `VITE_DS_AUTH_BASE` | `https://account-d.docusign.com` | OAuth server base |
| `VITE_DS_SCOPES` | `signature cors openid profile email` | OAuth scopes |
| `VITE_DS_TEMPLATE_ID` | `d880d558-…` | Template to use |
| `VITE_DS_TEMPLATE_ROLE_NAME` | `signer` | **Must match template** |
| `VITE_DS_CLIENT_USER_ID` | `1000` | Embedded signing user ID |
| `VITE_DS_API_MODE` | `direct` | `direct` or `worker` |
| `VITE_DS_WORKER_URL` | — | Worker URL (worker mode only) |
