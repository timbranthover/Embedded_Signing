import { useNavigate } from 'react-router-dom'
import { PenLine, ArrowRight } from 'lucide-react'
import { Card, CardHeader, CardTitle } from '../ui/Card'
import { Button } from '../ui/Button'
import { StatusBadge } from '../ui/Badge'
import { useMailboxStore } from '../../store/mailboxStore'

export function DocumentsCard() {
  const navigate = useNavigate()
  const { items, selectItem } = useMailboxStore()
  const pending = items.filter(i => i.status === 'awaiting_signature').slice(0, 3)

  const handleOpen = (id: string) => {
    selectItem(id)
    navigate('/mailbox')
  }

  return (
    <Card priority={pending.length > 0}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <PenLine size={15} className="text-accent" />
          <CardTitle>Documents &amp; Actions</CardTitle>
        </div>
        {pending.length > 0 && (
          <span className="text-xs font-semibold text-warning bg-warning-bg px-2 py-0.5 rounded-full">
            {pending.length} pending
          </span>
        )}
      </CardHeader>

      {pending.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-secondary">No pending signatures</p>
          <Button
            variant="ghost"
            size="sm"
            className="mt-2"
            onClick={() => navigate('/mailbox')}
          >
            View all documents
          </Button>
        </div>
      ) : (
        <div className="space-y-2">
          {pending.map(item => (
            <div
              key={item.id}
              className="flex items-center gap-3 p-3 rounded-lg bg-surface-2 border border-border hover:border-accent/30 hover:shadow-card cursor-pointer transition-all"
              onClick={() => handleOpen(item.id)}
              role="button"
              tabIndex={0}
              onKeyDown={e => { if (e.key === 'Enter') handleOpen(item.id) }}
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-primary truncate">{item.subject}</p>
                <p className="text-xs text-secondary mt-0.5">{item.from}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <StatusBadge status={item.status} />
                <ArrowRight size={14} className="text-tertiary" />
              </div>
            </div>
          ))}
          <Button
            variant="ghost"
            size="sm"
            className="w-full mt-1"
            iconRight
            icon={<ArrowRight size={13} />}
            onClick={() => navigate('/mailbox')}
          >
            View all documents
          </Button>
        </div>
      )}
    </Card>
  )
}
