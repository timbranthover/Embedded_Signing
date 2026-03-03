import { useMailboxStore } from '../../store/mailboxStore'
import { StatusBadge } from '../ui/Badge'

function formatDate(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const diffMs = now.getTime() - d.getTime()
  const diffHours = diffMs / (1000 * 60 * 60)
  if (diffHours < 1) return `${Math.round(diffMs / 60000)}m ago`
  if (diffHours < 24) return `${Math.round(diffHours)}h ago`
  const diffDays = Math.round(diffHours / 24)
  if (diffDays < 7) return `${diffDays}d ago`
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function MessageList() {
  const { items, selectedId, selectItem } = useMailboxStore()

  return (
    <div className="flex flex-col overflow-y-auto h-full">
      {items.map(item => (
        <button
          key={item.id}
          onClick={() => selectItem(item.id)}
          className={[
            'w-full text-left px-4 py-3.5 border-b border-border transition-colors',
            'hover:bg-surface-2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-accent/40',
            selectedId === item.id ? 'bg-accent-muted border-l-2 border-l-accent' : '',
          ].join(' ')}
        >
          <div className="flex items-center justify-between gap-2 mb-0.5">
            <span className={`text-xs font-medium truncate ${item.read ? 'text-secondary' : 'text-primary'}`}>
              {item.from}
            </span>
            <span className="text-2xs text-tertiary shrink-0 tabular-nums">{formatDate(item.date)}</span>
          </div>
          <p className={`text-sm truncate mb-1 ${item.read ? 'text-secondary' : 'text-primary font-semibold'}`}>
            {!item.read && (
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-accent mr-1.5 -translate-y-0.5" />
            )}
            {item.subject}
          </p>
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-tertiary truncate flex-1">{item.preview}</p>
            <StatusBadge status={item.status} />
          </div>
        </button>
      ))}

      {items.length === 0 && (
        <div className="flex-1 flex items-center justify-center text-secondary text-sm py-16">
          No documents
        </div>
      )}
    </div>
  )
}
