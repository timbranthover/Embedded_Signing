import { Sun, Moon, Bell, Search } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useMailboxStore } from '../../store/mailboxStore'
import { ConnectButton } from '../docusign/ConnectButton'

interface TopBarProps {
  theme: 'light' | 'dark'
  onToggleTheme: () => void
}

export function TopBar({ theme, onToggleTheme }: TopBarProps) {
  const { accessToken } = useAuthStore()
  const pendingCount = useMailboxStore(s =>
    s.items.filter(i => i.status === 'awaiting_signature').length
  )

  return (
    <header
      className="fixed top-0 right-0 left-0 z-20 flex items-center gap-4 px-6 bg-surface/80 backdrop-blur-md border-b border-border"
      style={{
        height: 'var(--topbar-height)',
        paddingLeft: 'calc(var(--sidebar-current-width) + 24px)',
      }}
    >
      {/* Search */}
      <div className="flex items-center gap-2 flex-1 max-w-md">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-tertiary" />
          <input
            type="search"
            placeholder="Search documents…"
            className="w-full h-8 pl-9 pr-3 rounded bg-surface-2 border border-border text-sm text-primary placeholder:text-tertiary focus:outline-none focus:ring-1 focus:ring-accent/40 focus:border-accent/40"
          />
        </div>
      </div>

      <div className="ml-auto flex items-center gap-2">
        {/* Notifications */}
        <button className="relative p-2 rounded hover:bg-surface-2 transition-colors text-secondary hover:text-primary"
          aria-label="Notifications">
          <Bell size={16} />
          {pendingCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-accent rounded-full" />
          )}
        </button>

        {/* Theme toggle */}
        <button
          onClick={onToggleTheme}
          className="p-2 rounded hover:bg-surface-2 transition-colors text-secondary hover:text-primary"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* DocuSign connect */}
        {!accessToken && <ConnectButton />}

        {accessToken && (
          <div className="flex items-center gap-1.5 h-7 px-3 rounded bg-success-bg text-success text-xs font-semibold border border-success/20">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            DocuSign connected
          </div>
        )}
      </div>
    </header>
  )
}
