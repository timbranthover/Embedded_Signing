import { create } from 'zustand'
import { localStore } from '../lib/storage'
import type { MailboxItem, Toast, EnvelopeStatus } from '../types'

// ─── Persistence helpers ───────────────────────────────────────────────────

const REAL_ITEMS_KEY = 'real_envelopes'

/** Save only real (non-seed) items to localStorage */
function persistRealItems(items: MailboxItem[]) {
  const real = items.filter(i => i.isReal)
  localStore.set(REAL_ITEMS_KEY, real)
}

/** Load previously-saved real items (returns [] on first run) */
function loadRealItems(): MailboxItem[] {
  return localStore.get<MailboxItem[]>(REAL_ITEMS_KEY) ?? []
}

// ─── Seeded mock items ─────────────────────────────────────────────────────

const seedItems: MailboxItem[] = [
  {
    id: 'seed-1',
    envelopeId: null,
    subject: 'Investment Advisory Agreement — Renewal 2025',
    from: 'Arbor Wealth Compliance',
    preview: 'Your annual advisory agreement is due for renewal. Please review and sign.',
    body: `Dear Client,\n\nYour Investment Advisory Agreement is due for its annual renewal. This agreement governs the terms of our relationship and must be signed to continue receiving advisory services.\n\nPlease review all terms carefully before signing. If you have questions, contact your advisor.`,
    date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    status: 'awaiting_signature',
    isReal: false,
    read: false,
  },
  {
    id: 'seed-2',
    envelopeId: null,
    subject: 'Discretionary Portfolio Mandate — Q1 2025 Update',
    from: 'Arbor Wealth Operations',
    preview: 'Updated mandate terms reflecting the new ESG screening criteria require your signature.',
    body: `Dear Client,\n\nAs communicated in January, we have updated our discretionary portfolio mandate to incorporate enhanced ESG screening criteria aligned with SFDR Article 8 requirements.\n\nYour electronic signature is required to authorize the mandate update. This does not change your investment objectives or fee schedule.`,
    date: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
    status: 'awaiting_signature',
    isReal: false,
    read: false,
  },
  {
    id: 'seed-3',
    envelopeId: null,
    subject: 'Account Opening — Beneficiary Designation',
    from: 'Arbor Wealth Compliance',
    preview: 'Beneficiary designation form for your trust account has been completed.',
    body: `Dear Client,\n\nThank you for submitting your beneficiary designation form. This is a confirmation that the form has been received and processed.\n\nYour designated beneficiaries have been recorded in our system. No further action is required.`,
    date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'completed',
    isReal: false,
    read: true,
  },
  {
    id: 'seed-4',
    envelopeId: null,
    subject: 'Annual Fee Schedule Disclosure — FY2025',
    from: 'Arbor Wealth Finance',
    preview: 'Your annual fee disclosure document for fiscal year 2025 is attached.',
    body: `Dear Client,\n\nAs required by SEC regulations, we are providing your annual fee schedule disclosure for fiscal year 2025.\n\nThis document outlines all fees, compensation, and conflicts of interest associated with our advisory services. Please retain for your records.`,
    date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'sent',
    isReal: false,
    read: true,
  },
  {
    id: 'seed-5',
    envelopeId: null,
    subject: 'Form ADV Part 2A — Annual Delivery',
    from: 'Arbor Wealth Compliance',
    preview: 'Your annual Form ADV Part 2A brochure delivery is enclosed.',
    body: `Dear Client,\n\nPursuant to Rule 204-3 of the Investment Advisers Act of 1940, we are delivering our annual Form ADV Part 2A brochure. This brochure provides information about our qualifications, business practices, and advisory services.\n\nYou may request a copy at any time.`,
    date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'completed',
    isReal: false,
    read: true,
  },
  {
    id: 'seed-6',
    envelopeId: null,
    subject: 'Tax Lot Election — 2024 Wash Sale Notice',
    from: 'Arbor Wealth Tax',
    preview: 'Notice regarding wash sale adjustments to your 2024 tax reporting.',
    body: `Dear Client,\n\nThis notice concerns potential wash sale rule adjustments identified in your account for the 2024 tax year. Certain transactions may require adjustments to your cost basis reporting.\n\nPlease review the attached schedule and consult your tax advisor. No action is required on your part at this time.`,
    date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'expired',
    isReal: false,
    read: true,
  },
]

/** Real (persisted) items first, then seeds — real items are always more recent */
function buildInitialItems(): MailboxItem[] {
  const real = loadRealItems()
  const realIds = new Set(real.map(i => i.id))
  return [...real, ...seedItems.filter(i => !realIds.has(i.id))]
}

// ─── Store ─────────────────────────────────────────────────────────────────

interface MailboxStore {
  items: MailboxItem[]
  selectedId: string | null
  signingUrl: string | null
  signingItemId: string | null
  sendingEnvelope: boolean
  sendError: string | null
  toasts: Toast[]

  selectItem: (id: string) => void
  addItem: (item: MailboxItem) => void
  updateStatus: (id: string, status: EnvelopeStatus) => void
  updateEnvelopeId: (id: string, envelopeId: string) => void
  openSigning: (id: string, url: string) => void
  closeSigning: () => void
  markRead: (id: string) => void
  setSendingEnvelope: (v: boolean) => void
  setSendError: (e: string | null) => void
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
}

export const useMailboxStore = create<MailboxStore>((set, get) => ({
  items: buildInitialItems(),
  selectedId: null,
  signingUrl: null,
  signingItemId: null,
  sendingEnvelope: false,
  sendError: null,
  toasts: [],

  selectItem: (id) => {
    set({ selectedId: id, signingUrl: null, signingItemId: null })
    get().markRead(id)
  },

  addItem: (item) =>
    set(s => {
      const next = [item, ...s.items]
      persistRealItems(next)
      return { items: next, selectedId: item.id }
    }),

  updateStatus: (id, status) =>
    set(s => {
      const next = s.items.map(i => i.id === id ? { ...i, status } : i)
      persistRealItems(next)
      return { items: next }
    }),

  updateEnvelopeId: (id, envelopeId) =>
    set(s => {
      const next = s.items.map(i => i.id === id ? { ...i, envelopeId } : i)
      persistRealItems(next)
      return { items: next }
    }),

  openSigning: (id, url) =>
    set({ signingUrl: url, signingItemId: id }),

  closeSigning: () =>
    set({ signingUrl: null, signingItemId: null }),

  markRead: (id) =>
    set(s => {
      const next = s.items.map(i => i.id === id ? { ...i, read: true } : i)
      persistRealItems(next)
      return { items: next }
    }),

  setSendingEnvelope: (sendingEnvelope) => set({ sendingEnvelope }),

  setSendError: (sendError) => set({ sendError }),

  addToast: (toast) => {
    const id = Math.random().toString(36).slice(2)
    set(s => ({ toasts: [...s.toasts, { ...toast, id }] }))
    setTimeout(() => get().removeToast(id), 4500)
  },

  removeToast: (id) =>
    set(s => ({ toasts: s.toasts.filter(t => t.id !== id) })),
}))
