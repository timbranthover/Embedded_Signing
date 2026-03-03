export type EnvelopeStatus = 'awaiting_signature' | 'sent' | 'completed' | 'expired' | 'declined'

export interface MailboxItem {
  id: string
  envelopeId: string | null       // null = seeded mock
  subject: string
  from: string
  preview: string
  body: string
  date: string                     // ISO string
  status: EnvelopeStatus
  isReal: boolean                  // false = seeded mock, true = real DocuSign envelope
  signingUrl?: string              // ephemeral — fetch on demand
  read: boolean
}

export interface DSUser {
  sub: string
  email: string
  name: string
  accounts: Array<{
    account_id: string
    account_name: string
    base_uri: string
    is_default: boolean
  }>
}

export interface DSTokenResponse {
  access_token: string
  token_type: string
  refresh_token?: string
  expires_in: number
  scope: string
}

export interface AuthState {
  accessToken: string | null
  user: DSUser | null
  accountId: string | null
  baseUri: string | null
  loading: boolean
  error: string | null
}

export interface Toast {
  id: string
  type: 'success' | 'error' | 'info' | 'warning'
  title: string
  message?: string
}

export type SortDir = 'asc' | 'desc'

export interface Position {
  ticker: string
  name: string
  sector: string
  shares: number
  price: number
  value: number
  dayChange: number
  dayChangePct: number
}
