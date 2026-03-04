import { create } from 'zustand'
import { storage } from '../lib/storage'
import { autoAuthenticate } from '../lib/docusign'
import type { DSUser } from '../types'

interface AuthStore {
  accessToken: string | null
  user: DSUser | null
  accountId: string | null
  baseUri: string | null
  loading: boolean
  error: string | null
  setAuth: (token: string, user: DSUser) => void
  setLoading: (v: boolean) => void
  setError: (e: string | null) => void
  logout: () => void
  restore: () => boolean
  autoAuth: () => Promise<void>
}

export const useAuthStore = create<AuthStore>((set) => ({
  accessToken: null,
  user: null,
  accountId: null,
  baseUri: null,
  loading: false,
  error: null,

  setAuth: (token, user) => {
    const defaultAccount = user.accounts.find(a => a.is_default) ?? user.accounts[0]
    const state = {
      accessToken: token,
      user,
      accountId: defaultAccount?.account_id ?? null,
      baseUri: defaultAccount?.base_uri ?? null,
      loading: false,
      error: null,
    }
    storage.set('token', token)
    storage.set('user', user)
    storage.set('expiresAt', Date.now() + 3500 * 1000) // 58 min — 2 min buffer before DS expiry
    set(state)
  },

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error, loading: false }),

  logout: () => {
    storage.clear()
    set({ accessToken: null, user: null, accountId: null, baseUri: null, error: null })
  },

  restore: () => {
    const token     = storage.get<string>('token')
    const user      = storage.get<DSUser>('user')
    const expiresAt = storage.get<number>('expiresAt') ?? 0
    // Treat token as absent if it has expired or will expire within the next 60 s
    if (token && user && expiresAt > Date.now() + 60_000) {
      const defaultAccount = user.accounts.find(a => a.is_default) ?? user.accounts[0]
      set({
        accessToken: token,
        user,
        accountId: defaultAccount?.account_id ?? null,
        baseUri: defaultAccount?.base_uri ?? null,
      })
      return true
    }
    return false
  },

  autoAuth: async () => {
    set({ loading: true, error: null })
    try {
      const { access_token, user } = await autoAuthenticate()
      const defaultAccount = user.accounts.find(a => a.is_default) ?? user.accounts[0]
      storage.set('token', access_token)
      storage.set('user', user)
      storage.set('expiresAt', Date.now() + 3500 * 1000)
      set({
        accessToken: access_token,
        user,
        accountId: defaultAccount?.account_id ?? null,
        baseUri: defaultAccount?.base_uri ?? null,
        loading: false,
        error: null,
      })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error('[autoAuth]', err)
      set({ loading: false, error: msg })
    }
  },
}))
