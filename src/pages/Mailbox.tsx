import { useEffect, useRef } from 'react'
import { Filter } from 'lucide-react'
import { MessageList } from '../components/mailbox/MessageList'
import { ReadingPane } from '../components/mailbox/ReadingPane'
import { SigningPanel } from '../components/mailbox/SigningPanel'
import { SendTemplateButton } from '../components/mailbox/SendTemplateButton'
import { useMailboxStore } from '../store/mailboxStore'

export function Mailbox() {
  const { items, selectedId, signingUrl } = useMailboxStore()
  const unreadCount = items.filter(i => !i.read).length
  const toolbarRef = useRef<HTMLDivElement>(null)

  // Auto-select first item on mount if nothing selected
  useEffect(() => {
    if (!selectedId && items.length > 0) {
      useMailboxStore.getState().selectItem(items[0].id)
    }
  }, [])

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

      {/* Three-panel mailbox */}
      <div
        className="bg-surface border border-border rounded-xl overflow-hidden"
        style={{ height: 'calc(100vh - var(--topbar-height) - 140px)', minHeight: 480 }}
      >
        <div className="flex h-full">
          {/* Message list — left column */}
          <div className="w-72 shrink-0 border-r border-border flex flex-col">
            <div className="px-4 py-3 border-b border-border bg-surface-2">
              <h2 className="text-xs font-semibold text-secondary uppercase tracking-wide">Inbox</h2>
            </div>
            <div className="flex-1 overflow-y-auto">
              <MessageList />
            </div>
          </div>

          {/* Reading pane — middle */}
          <div
            className={[
              'flex flex-col border-r border-border overflow-hidden',
              signingUrl ? 'flex-1' : 'flex-[2]',
            ].join(' ')}
          >
            <ReadingPane />
          </div>

          {/* Signing panel — right */}
          {signingUrl && (
            <div className="flex-[2] flex flex-col min-w-0 overflow-hidden">
              <SigningPanel />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
