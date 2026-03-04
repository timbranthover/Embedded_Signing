import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Inbox,
  TrendingUp,
  Shield,
  Settings,
  LogOut,
  ChevronLeft,
  Landmark,
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useMailboxStore } from '../../store/mailboxStore'
import { SIDEBAR_EXPANDED, SIDEBAR_COLLAPSED, SIDEBAR_DURATION, SIDEBAR_EASING } from './Layout'

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

// ── Shared transition strings ────────────────────────────────────────────────

const T_MAIN  = `${SIDEBAR_DURATION}ms ${SIDEBAR_EASING}`   // width, padding, gap
const T_LABEL = `opacity 120ms ease, max-width ${SIDEBAR_DURATION}ms ${SIDEBAR_EASING}`

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Nav item label — stays in DOM, fades + collapses so the sidebar width can animate */
function NavLabel({ collapsed, children }: { collapsed: boolean; children: React.ReactNode }) {
  return (
    <span
      className="truncate flex-1 whitespace-nowrap"
      aria-hidden={collapsed}
      style={{
        overflow:   'hidden',
        opacity:    collapsed ? 0 : 1,
        maxWidth:   collapsed ? 0 : 160,
        transition: T_LABEL,
      }}
    >
      {children}
    </span>
  )
}

/** Shared padding/gap style applied to every nav row so icons slide to centre */
function navRowStyle(collapsed: boolean): React.CSSProperties {
  return {
    // 20px left/right padding centres a 16px icon in the 56px collapsed rail;
    // 12px is the default .sidebar-nav-item padding.
    paddingLeft:  collapsed ? 20 : 12,
    paddingRight: collapsed ? 20 : 12,
    gap:          collapsed ? 0 : 10,
    transition:   `padding-left ${T_MAIN}, padding-right ${T_MAIN}, gap ${T_MAIN}`,
  }
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { user, logout } = useAuthStore()
  const navigate          = useNavigate()
  const pendingCount      = useMailboxStore(s =>
    s.items.filter(i => i.status === 'awaiting_signature').length
  )

  const navItems = [
    { to: '/',        label: 'Dashboard',  icon: <LayoutDashboard size={16} /> },
    { to: '/mailbox', label: 'Documents',  icon: <Inbox size={16} />, badge: pendingCount },
    { to: '/mailbox', label: 'Portfolio',  icon: <TrendingUp size={16} />, disabled: true },
    { to: '/mailbox', label: 'Compliance', icon: <Shield size={16} />,    disabled: true },
    { to: '/mailbox', label: 'Settings',   icon: <Settings size={16} />,  disabled: true },
  ]

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <aside
      className="fixed left-0 top-0 bottom-0 z-30 flex flex-col bg-sidebar border-r border-border overflow-hidden"
      style={{
        width:      collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED,
        transition: `width ${T_MAIN}`,
      }}
    >
      {/* ── Logo ─────────────────────────────────────────────────────── */}
      <div
        className="flex items-center border-b border-border shrink-0"
        style={{
          height:      'var(--topbar-height)',
          paddingLeft:  collapsed ? 14 : 20,
          paddingRight: collapsed ? 14 : 20,
          gap:          collapsed ? 0 : 12,
          transition:  `padding-left ${T_MAIN}, padding-right ${T_MAIN}, gap ${T_MAIN}`,
        }}
      >
        {/* Icon — fixed size, never moves */}
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-navy shrink-0">
          <Landmark size={16} className="text-accent" />
        </div>

        {/* Wordmark — fades + collapses width */}
        <div
          style={{
            overflow:   'hidden',
            opacity:    collapsed ? 0 : 1,
            maxWidth:   collapsed ? 0 : 160,
            transition: T_LABEL,
            whiteSpace: 'nowrap',
          }}
        >
          <p className="font-display font-semibold text-base text-primary leading-none">Arbor</p>
          <p className="text-2xs text-secondary font-medium tracking-widest uppercase leading-none mt-0.5">Wealth</p>
        </div>
      </div>

      {/* ── Nav ──────────────────────────────────────────────────────── */}
      <nav className="flex-1 px-2 py-4 overflow-y-auto space-y-0.5">
        {navItems.map((item, i) =>
          item.disabled ? (
            <div
              key={i}
              className="sidebar-nav-item opacity-40 cursor-not-allowed"
              style={navRowStyle(collapsed)}
              title={collapsed ? item.label : undefined}
            >
              <span className="shrink-0">{item.icon}</span>
              <NavLabel collapsed={collapsed}>{item.label}</NavLabel>
            </div>
          ) : (
            <NavLink
              key={i}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                ['sidebar-nav-item relative', isActive ? 'active' : ''].join(' ')
              }
              style={navRowStyle(collapsed)}
              title={collapsed ? item.label : undefined}
            >
              <span className="shrink-0">{item.icon}</span>

              <NavLabel collapsed={collapsed}>{item.label}</NavLabel>

              {/* Badge — full pill when expanded, tiny dot when collapsed */}
              {item.badge != null && item.badge > 0 && (
                <>
                  {/* Expanded pill */}
                  <span
                    className="ml-auto min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-accent text-white text-2xs font-bold overflow-hidden whitespace-nowrap"
                    style={{
                      opacity:    collapsed ? 0 : 1,
                      maxWidth:   collapsed ? 0 : 36,
                      transition: T_LABEL,
                    }}
                  >
                    {item.badge}
                  </span>

                  {/* Collapsed dot */}
                  <span
                    className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-accent"
                    style={{
                      opacity:    collapsed ? 1 : 0,
                      transition: `opacity 120ms ease`,
                    }}
                  />
                </>
              )}
            </NavLink>
          )
        )}
      </nav>

      {/* ── Footer ───────────────────────────────────────────────────── */}
      <div className="border-t border-border px-2 py-3 space-y-0.5">
        {/* User row */}
        {user && (
          <div
            className="flex items-center rounded-lg"
            style={{
              paddingLeft:  collapsed ? 10 : 12,
              paddingRight: collapsed ? 10 : 12,
              paddingTop:   8,
              paddingBottom: 8,
              gap:          collapsed ? 0 : 10,
              transition:   `padding-left ${T_MAIN}, padding-right ${T_MAIN}, gap ${T_MAIN}`,
            }}
          >
            <div className="w-7 h-7 rounded-full bg-navy flex items-center justify-center shrink-0">
              <span className="text-white text-2xs font-bold">
                {user.name?.[0]?.toUpperCase() ?? user.email?.[0]?.toUpperCase() ?? '?'}
              </span>
            </div>
            <div
              style={{
                overflow:   'hidden',
                opacity:    collapsed ? 0 : 1,
                maxWidth:   collapsed ? 0 : 180,
                transition: T_LABEL,
                whiteSpace: 'nowrap',
                minWidth:   0,
              }}
            >
              <p className="text-xs font-medium text-primary truncate">{user.name}</p>
              <p className="text-2xs text-secondary truncate">{user.email}</p>
            </div>
          </div>
        )}

        {/* Sign out */}
        <button
          onClick={handleLogout}
          className="sidebar-nav-item w-full text-left"
          style={navRowStyle(collapsed)}
          title={collapsed ? 'Sign out' : undefined}
        >
          <LogOut size={15} className="shrink-0" />
          <NavLabel collapsed={collapsed}>Sign out</NavLabel>
        </button>
      </div>

      {/* ── Collapse toggle ───────────────────────────────────────────── */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-surface border border-border rounded-full flex items-center justify-center shadow-card text-secondary hover:text-primary hover:shadow-card-hover transition-shadow z-10"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {/* Single icon that rotates — no snap */}
        <ChevronLeft
          size={12}
          style={{
            transform:  collapsed ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: `transform ${T_MAIN}`,
          }}
        />
      </button>
    </aside>
  )
}
