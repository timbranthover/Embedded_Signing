# Embedded DocuSign Signing — Technical Demo

**Live demo:** https://timbranthover.github.io/Embedded_Signing/

This is a proof-of-concept built to demonstrate that **embedded DocuSign signing** — where the entire signing experience lives inside your own application, with no redirect to docusign.com — is achievable and not particularly complex to implement.

The surrounding UI (the wealth management dashboard, the mailbox, the charts) is scaffolding. The actual subject of the demo is the signing flow, specifically:

- A document sent from within the app
- The DocuSign signing UI rendered **inside a panel in your own app** — not a popup, not a redirect
- Real-time event handling when signing completes
- No "go to DocuSign" — the user never leaves your interface

---

## What embedded signing actually means

DocuSign offers two ways to present the signing experience to a user:

**Standard (redirect):** You create an envelope and get back a URL. You redirect the user to `app.docusign.com`. They sign, DocuSign redirects them back. The user leaves your application entirely.

**Embedded:** You create an envelope, mark the recipient as *embedded* by setting a `clientUserId`, then request a short-lived **Recipient View URL** from DocuSign. You load that URL in an `<iframe>` inside your own app. The signing UI — DocuSign's full UI, unchanged — renders within your interface. When signing is complete, DocuSign redirects within the iframe to a URL you control, which you use to detect completion.

The user never sees `docusign.com`. They never leave your app.

---

## The signing flow, step by step

```
User clicks "Send template"
        │
        ▼
1. POST /accounts/{id}/envelopes
   Body: { templateId, templateRoles: [{ roleName, name, email, clientUserId: "1000" }], status: "sent" }
   → DocuSign returns envelopeId

        │
        ▼
2. Envelope appears in the document list (status: "Awaiting your signature")
   User opens it, clicks "Sign now"

        │
        ▼
3. POST /accounts/{id}/envelopes/{envelopeId}/views/recipient
   Body: { clientUserId: "1000", email, userName, returnUrl, authenticationMethod: "none" }
   → DocuSign returns a one-time signing URL (expires in ~5 minutes)

        │
        ▼
4. The app loads that URL as the src of an <iframe>
   DocuSign's signing UI renders inside the iframe
   The user fills in and signs the document

        │
        ▼
5. DocuSign redirects the iframe to our returnUrl:
   /docusign/return.html?event=signing_complete (or cancel, decline, etc.)

        │
        ▼
6. return.html reads the event and calls:
   window.parent.postMessage({ type: 'docusign_event', event: 'signing_complete' }, '*')

        │
        ▼
7. The parent app receives the postMessage, closes the signing panel,
   updates envelope status to "Completed", shows a toast notification
```

The critical insight is **step 6**: DocuSign doesn't natively postMessage back to the parent frame. The `returnUrl` trick bridges this gap — we host a tiny static HTML page that does nothing except read the event from the URL and relay it upward via `postMessage`.

---

## Why `clientUserId` matters

Setting `clientUserId` on a recipient is what makes signing embedded. It tells DocuSign: *"this signer will be authenticated by your application, not by DocuSign."*

The value (`"1000"` here) is arbitrary — it's your internal identifier for the signer. The only rule: **it must be identical** in both the envelope creation call and the recipient view call. If they don't match, DocuSign returns an error.

If you omit `clientUserId`, the signer gets a standard email and signs via docusign.com — embedding becomes impossible after the fact.

---

## Authentication: why JWT Grant, not OAuth

**OAuth / PKCE** works like "Sign in with Google" — it pops up DocuSign's login page and the user grants access. This makes sense when the *user* has a DocuSign account and is acting as themselves.

**JWT Grant** is server-to-server. Your backend signs a JWT with a private RSA key, sends it to DocuSign, and gets back an access token. DocuSign calls this *impersonation* — your integration acts on behalf of a named DocuSign user, no browser login required.

For a financial firm use case — where the firm holds the DocuSign account and clients just need to sign — JWT Grant is the right model:

- No user needs a DocuSign account
- No OAuth popup
- The experience is completely seamless from the user's perspective
- The integration key and private key live on your server, never in the browser

**One-time setup required:** The impersonated user must grant consent once via a specific URL. After that, JWT Grant works silently on every request.

---

## Why a Cloudflare Worker (the CORS problem)

DocuSign's REST API (`na3.docusign.net`, `na4.docusign.net`, etc.) does not send `Access-Control-Allow-Origin` headers. This is intentional — their API is designed for server-to-server communication, not direct browser calls.

If you try to call the DocuSign REST API directly from JavaScript in a browser, you get a CORS error and the request is blocked before it even leaves the browser.

The solution is a proxy:

```
Browser  ──CORS OK──▶  Cloudflare Worker  ──no CORS needed──▶  DocuSign REST API
```

The Worker runs at the edge, receives requests from the browser (with proper CORS headers), forwards them to DocuSign with the authorization header intact, and returns the response. Since the Worker-to-DocuSign call is server-to-server, CORS is irrelevant.

The Worker also handles JWT signing: the RSA private key never touches the browser. The browser asks the Worker for a token, the Worker signs the JWT with the private key and exchanges it with DocuSign, then returns the access token.

```
Browser  ──GET /auth/auto-token──▶  Worker
                                       │── builds + signs JWT with private key
                                       │── POST DocuSign /oauth/token
                                       │── GET DocuSign /oauth/userinfo
                                    ◀──── returns { access_token, user }
```

---

## Architecture overview

```
src/lib/docusign.ts        All DocuSign API calls — createEnvelope(), createRecipientView(),
                           downloadSignedDocument(), autoAuthenticate()

src/store/authStore.ts     Zustand store — holds access token, user, accountId, baseUri.
                           Handles JWT Grant via autoAuth(), session restore with expiry check.

src/store/mailboxStore.ts  Zustand store — envelope list, signing state, toasts.
                           Real envelopes persisted to localStorage so they survive refresh.

src/components/mailbox/
  SendTemplateButton.tsx   Creates the envelope via DocuSign API, adds it to the mailbox
  ReadingPane.tsx          Shows envelope details; opens the signing panel; download CTA
  SigningPanel.tsx         Renders the <iframe>, listens for postMessage from return.html

public/
  oauth/callback.html      Receives the OAuth redirect, postMessages the code back to opener
  docusign/return.html     Receives the signing redirect, postMessages the event to parent frame

worker/src/worker.ts       Cloudflare Worker — JWT Grant auth + DocuSign REST proxy
```

---

## The iframe and postMessage in detail

`SigningPanel.tsx` renders:
```html
<iframe src="{recipientViewUrl}" />
```

When DocuSign finishes, it redirects the iframe's location to:
```
https://your-app.com/docusign/return.html?event=signing_complete
```

`return.html` is a static HTML file (no framework, ~10 lines) that runs:
```javascript
const event = new URLSearchParams(window.location.search).get('event')
window.parent.postMessage({ type: 'docusign_event', event }, '*')
```

`SigningPanel.tsx` has a `window.addEventListener('message', ...)` that catches this, checks the event type, and updates application state accordingly.

**Why a static HTML file instead of a React route?** Because the iframe navigates to the returnUrl by changing its own `src`. React Router won't intercept that navigation — it's a full page load inside the iframe. A static HTML file is simpler and more reliable.

---

## Key technical constraints

| Constraint | Detail |
|---|---|
| Recipient view URL is single-use | Requesting a new one invalidates the previous. If the user closes and reopens, a new URL is fetched. |
| Recipient view URL expires | Typically ~5 minutes. The URL must be loaded into the iframe quickly. |
| `clientUserId` must match exactly | Between `createEnvelope` and `createRecipientView`. Case-sensitive. |
| Embedded signer must be set at envelope creation | You cannot convert a standard signer to embedded after the fact. |
| JWT Grant access tokens expire after 1 hour | The app detects expiry (via stored `expiresAt`) and re-authenticates silently on page load. |
| DocuSign demo environment | This demo uses `account-d.docusign.com`. Production uses `account.docusign.com`. |

---

## What a production implementation would look like

This demo handles everything in the browser + a thin Cloudflare Worker. In a real UBS implementation:

- The Worker becomes your **backend service** (Node/Java/.NET — whatever your stack is)
- JWT Grant token management happens entirely server-side
- The backend exposes an authenticated endpoint that your frontend calls to create envelopes and fetch recipient view URLs
- The browser never holds an access token — it holds a session cookie to your own backend
- The DocuSign account is the firm's production account, with proper user management and audit trails
- The iframe approach is identical — the signing UX in this demo is exactly what production looks like

The core flow (create envelope → get recipient view URL → iframe → postMessage on complete) does not change.

---

## Running locally

```bash
git clone https://github.com/timbranthover/Embedded_Signing.git
cd Embedded_Signing
npm install
npm run dev   # → http://localhost:5173
```

The `.env` file is pre-configured for the demo DocuSign account. The Cloudflare Worker is already deployed. The live demo requires no setup to observe — just open it, go to **Documents**, click **Send template**, and sign.

---

## Deploying

```bash
npm run build    # builds to dist/
npm run deploy   # pushes dist/ to gh-pages branch
```

The Worker lives in `worker/` and is deployed separately via Wrangler (`wrangler deploy`). Its secrets (`DS_PRIVATE_KEY`, `DS_USER_ID`) are set via `wrangler secret put` and never appear in source code.
