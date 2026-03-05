import { useEffect, useRef, useState } from 'react'
import { Filter } from 'lucide-react'
import { MessageList } from '../components/mailbox/MessageList'
import { ReadingPane } from '../components/mailbox/ReadingPane'
import { SigningPanel } from '../components/mailbox/SigningPanel'
import { SendTemplateButton } from '../components/mailbox/SendTemplateButton'
import { useMailboxStore } from '../store/mailboxStore'
import { useIsMobile } from '../hooks/useIsMobile'

type MobilePanel = 'list' | 'reading' | 'signing'

export function Mailbox() {
  const { items, selectedId, signingUrl } = useMailboxStore()
  const unreadCount = items.filter(i => !i.read).length
  const toolbarRef = useRef<HTMLDivElement>(null)
  const isMobile = useIsMobile()
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>('list')

  // Auto-select first item on mount — desktop only
  useEffect(() => {
    if (!isMobile && !selectedId && items.length > 0) {
      useMailboxStore.getState().selectItem(items[0].id)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // When signingUrl is opened, switch to signing panel
  useEffect(() => {
    if (isMobile && signingUrl) {
      setMobilePanel('signing')
    }
  }, [isMobile, signingUrl])

  // When signing is closed, return to reading pane
  useEffect(() => {
    if (isMobile && !signingUrl) {
      setMobilePanel(prev => prev === 'signing' ? 'reading' : prev)
    }
  }, [isMobile, signingUrl])

  return (
    <div className="space-y-4">
      {/* Page header + toolbar */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-semibold text-primary">Documents</h1>
          <p className="text-sm text-secondary mt-0.5">
            {items.length} documents
            {unreadCount > 0 && ` · ${unreadCount} unread`}
          </p>
        </div>
        <div className="flex items-center gap-2" ref={toolbarRef}>
          <button className="flex items-center gap-1.5 h-8 px-3 rounded border border-border bg-surface text-xs text-secondary hover:text-primary hover:bg-surface-2 transition-colors">
            <Filter size={12} />
            Filter
          </button>
          <div className="relative">
            <SendTemplateButton />
          </div>
        </div>
      </div>

      {/* Three-panel mailbox (single-panel on mobile) */}
      <div
        className="bg-surface border border-border rounded-xl overflow-hidden"
        style={{
          height: isMobile
            ? 'calc(100dvh - var(--topbar-height) - 100px)'
            : 'calc(100vh - var(--topbar-height) - 140px)',
          minHeight: isMobile ? 400 : 480,
        }}
      >
        <div className="flex h-full">

          {/* Message list — left column */}
          <div
            className={[
              'border-r border-border flex flex-col',
              isMobile
                ? (mobilePanel === 'list' ? 'flex-1' : 'hidden')
                : 'w-72 shrink-0',
            ].join(' ')}
          >
            <div className="px-4 py-3 border-b border-border bg-surface-2">
              <h2 className="text-xs font-semibold text-secondary uppercase tracking-wide">Inbox</h2>
            </div>
            <div className="flex-1 overflow-y-auto">
              <MessageList
                onSelect={isMobile ? () => setMobilePanel('reading') : undefined}
              />
            </div>
          </div>

          {/* Reading pane — middle */}
          <div
            className={[
              'flex flex-col overflow-hidden',
              // Only show border-r when signing panel is also visible (desktop)
              !isMobile && signingUrl ? 'border-r border-border' : '',
              isMobile
                ? (mobilePanel === 'reading' ? 'flex-1' : 'hidden')
                : (signingUrl ? 'flex-1' : 'flex-[2]'),
            ].join(' ')}
          >
            <ReadingPane
              onMobileBack={isMobile ? () => setMobilePanel('list') : undefined}
            />
          </div>

          {/* Signing panel — right */}
          {signingUrl && (
            <div
              className={[
                'flex flex-col min-w-0 overflow-hidden',
                isMobile
                  ? (mobilePanel === 'signing' ? 'flex-1' : 'hidden')
                  : 'flex-[2]',
              ].join(' ')}
            >
              <SigningPanel />
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
