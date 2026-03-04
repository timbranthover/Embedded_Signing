import { Sun, Moon, Bell, Loader2 } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useMailboxStore } from '../../store/mailboxStore'
import { SIDEBAR_DURATION, SIDEBAR_EASING } from './Layout'

interface TopBarProps {
  theme: 'light' | 'dark'
  onToggleTheme: () => void
  sidebarWidth: number
}

export function TopBar({ theme, onToggleTheme, sidebarWidth }: TopBarProps) {
  const { accessToken, user, loading, error, autoAuth } = useAuthStore()
  const pendingCount = useMailboxStore(s =>
    s.items.filter(i => i.status === 'awaiting_signature').length
  )

  return (
    <header
      className="fixed top-0 right-0 left-0 z-20 flex items-center gap-4 bg-surface/80 backdrop-blur-md border-b border-border"
      style={{
        height:      'var(--topbar-height)',
        paddingLeft:  sidebarWidth + 24,
        paddingRight: 24,
        // Transition in lockstep with the sidebar
        transition: `padding-left ${SIDEBAR_DURATION}ms ${SIDEBAR_EASING}`,
      }}
    >
      {/* Search */}
      <div className="flex items-center gap-2 flex-1 max-w-md">
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-tertiary" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input
            type="search"
            placeholder="Search documents…"
            className="w-full h-8 pl-9 pr-3 rounded bg-surface-2 border border-border text-sm text-primary placeholder:text-tertiary focus:outline-none focus:ring-1 focus:ring-accent/40 focus:border-accent/40"
          />
        </div>
      </div>

      <div className="ml-auto flex items-center gap-3">
        {/* Notifications */}
        <button className="relative p-2 rounded hover:bg-surface-2 transition-colors text-secondary hover:text-primary" aria-label="Notifications">
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

        {/* Auth status */}
        {loading && (
          <div className="flex items-center gap-1.5 h-7 px-3 rounded bg-surface-2 text-secondary text-xs">
            <Loader2 size={12} className="animate-spin" />
            <span>Connecting…</span>
          </div>
        )}

        {!loading && error && (
          <button
            onClick={() => autoAuth()}
            title={error}
            className="flex items-center gap-1.5 h-7 px-3 rounded bg-red-500/10 text-red-400 text-xs border border-red-500/20 hover:bg-red-500/20 transition-colors"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
            Auth error — retry
          </button>
        )}

        {!loading && !error && accessToken && (
          <div className="flex items-center gap-2 h-7 px-3 rounded bg-success-bg text-success text-xs font-semibold border border-success/20">
            <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            {user?.name ?? 'Connected'}
          </div>
        )}
      </div>
    </header>
  )
}
