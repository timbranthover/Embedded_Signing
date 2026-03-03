import { useState } from 'react'
import { Link2 } from 'lucide-react'
import { Button } from '../ui/Button'
import { useAuthStore } from '../../store/authStore'
import { generatePKCE, generateState } from '../../lib/pkce'
import { buildAuthUrl, exchangeCodeForToken, fetchUserInfo } from '../../lib/docusign'
import { storage } from '../../lib/storage'

export function ConnectButton() {
  const { setAuth, setLoading, setError, loading } = useAuthStore()
  const [connecting, setConnecting] = useState(false)

  const handleConnect = async () => {
    try {
      setConnecting(true)
      setError(null)

      const { verifier, challenge } = await generatePKCE()
      const state = generateState()

      // Persist for the callback
      storage.set('pkce_verifier', verifier)
      storage.set('pkce_state', state)

      const authUrl = buildAuthUrl(challenge, state)

      // Open popup
      const popup = window.open(
        authUrl,
        'docusign_oauth',
        'width=500,height=700,toolbar=0,menubar=0,location=0,status=0,scrollbars=1,resizable=1'
      )
      if (!popup) {
        throw new Error('Could not open popup. Please allow popups for this site.')
      }

      // Wait for postMessage from callback.html
      const code = await new Promise<string>((resolve, reject) => {
        const timeout = setTimeout(() => reject(new Error('OAuth timed out')), 120_000)

        function handler(event: MessageEvent) {
          // Validate origin loosely — callback is same origin
          if (event.data?.type !== 'docusign_oauth_code') return
          clearTimeout(timeout)
          window.removeEventListener('message', handler)

          const returnedState = event.data.state
          const savedState   = storage.get<string>('pkce_state')
          if (returnedState && savedState && returnedState !== savedState) {
            reject(new Error('OAuth state mismatch'))
            return
          }
          if (event.data.error) {
            reject(new Error(event.data.error))
            return
          }
          resolve(event.data.code)
        }

        window.addEventListener('message', handler)
      })

      setLoading(true)

      // Exchange code for token
      const savedVerifier = storage.get<string>('pkce_verifier')!
      const tokenResp = await exchangeCodeForToken(code, savedVerifier)

      // Fetch user info
      const user = await fetchUserInfo(tokenResp.access_token)

      storage.remove('pkce_verifier')
      storage.remove('pkce_state')

      setAuth(tokenResp.access_token, user)
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      setError(msg)
      console.error('[ConnectButton]', err)
    } finally {
      setConnecting(false)
    }
  }

  return (
    <Button
      variant="accent"
      size="sm"
      loading={connecting || loading}
      icon={<Link2 size={13} />}
      onClick={handleConnect}
    >
      Connect DocuSign
    </Button>
  )
}
