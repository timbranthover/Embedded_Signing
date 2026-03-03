import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  Inbox,
  TrendingUp,
  Shield,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Landmark,
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useMailboxStore } from '../../store/mailboxStore'

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const pendingCount = useMailboxStore(s =>
    s.items.filter(i => i.status === 'awaiting_signature').length
  )

  const navItems = [
    { to: '/',        label: 'Dashboard',  icon: <LayoutDashboard size={16} /> },
    { to: '/mailbox', label: 'Documents',  icon: <Inbox size={16} />, badge: pendingCount },
    { to: '/mailbox', label: 'Portfolio',  icon: <TrendingUp size={16} />, disabled: true },
    { to: '/mailbox', label: 'Compliance', icon: <Shield size={16} />, disabled: true },
    { to: '/mailbox', label: 'Settings',   icon: <Settings size={16} />, disabled: true },
  ]

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <aside
      className="fixed left-0 top-0 bottom-0 z-30 flex flex-col bg-sidebar border-r border-border transition-all duration-200"
      style={{ width: collapsed ? 56 : 'var(--sidebar-width)' }}
    >
      {/* Logo */}
      <div
        className={[
          'flex items-center border-b border-border shrink-0',
          collapsed ? 'px-3 py-4 justify-center' : 'px-5 py-4 gap-3',
        ].join(' ')}
        style={{ height: 'var(--topbar-height)' }}
      >
        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-navy shrink-0">
          <Landmark size={16} className="text-accent" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <p className="font-display font-semibold text-base text-primary leading-none">Arbor</p>
            <p className="text-2xs text-secondary font-medium tracking-widest uppercase leading-none mt-0.5">Wealth</p>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 px-2 py-4 overflow-y-auto space-y-0.5">
        {navItems.map((item, i) => (
          item.disabled ? (
            <div
              key={i}
              className={[
                'sidebar-nav-item opacity-40 cursor-not-allowed',
                collapsed ? 'justify-center px-0' : '',
              ].join(' ')}
              title={collapsed ? item.label : undefined}
            >
              <span className="shrink-0">{item.icon}</span>
              {!collapsed && <span className="truncate">{item.label}</span>}
            </div>
          ) : (
            <NavLink
              key={i}
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) =>
                ['sidebar-nav-item', isActive ? 'active' : '', collapsed ? 'justify-center px-0' : ''].join(' ')
              }
              title={collapsed ? item.label : undefined}
            >
              <span className="shrink-0">{item.icon}</span>
              {!collapsed && <span className="truncate flex-1">{item.label}</span>}
              {!collapsed && item.badge && item.badge > 0 ? (
                <span className="ml-auto min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-accent text-white text-2xs font-bold">
                  {item.badge}
                </span>
              ) : null}
              {collapsed && item.badge && item.badge > 0 ? (
                <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-accent" />
              ) : null}
            </NavLink>
          )
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-border px-2 py-3 space-y-0.5">
        {user && (
          <div className={[
            'flex items-center gap-2.5 px-3 py-2 rounded-lg',
            collapsed ? 'justify-center' : '',
          ].join(' ')}>
            <div className="w-7 h-7 rounded-full bg-navy flex items-center justify-center shrink-0">
              <span className="text-white text-2xs font-bold">
                {user.name?.[0]?.toUpperCase() ?? user.email?.[0]?.toUpperCase() ?? '?'}
              </span>
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-primary truncate">{user.name}</p>
                <p className="text-2xs text-secondary truncate">{user.email}</p>
              </div>
            )}
          </div>
        )}
        <button
          onClick={handleLogout}
          className={[
            'sidebar-nav-item w-full text-left',
            collapsed ? 'justify-center px-0' : '',
          ].join(' ')}
          title={collapsed ? 'Sign out' : undefined}
        >
          <LogOut size={15} className="shrink-0" />
          {!collapsed && <span>Sign out</span>}
        </button>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={onToggle}
        className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-surface border border-border rounded-full flex items-center justify-center shadow-card text-secondary hover:text-primary hover:shadow-card-hover transition-all z-10"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </aside>
  )
}
