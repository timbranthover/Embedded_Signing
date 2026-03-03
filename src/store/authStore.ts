import { create } from 'zustand'
import { storage } from '../lib/storage'
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
    // Persist to sessionStorage
    storage.set('token', token)
    storage.set('user', user)
    set(state)
  },

  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error, loading: false }),

  logout: () => {
    storage.clear()
    set({ accessToken: null, user: null, accountId: null, baseUri: null, error: null })
  },

  restore: () => {
    const token = storage.get<string>('token')
    const user  = storage.get<DSUser>('user')
    if (token && user) {
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
}))
