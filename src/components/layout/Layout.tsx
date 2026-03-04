import React, { useState } from 'react'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { ToastContainer } from '../ui/Toast'

interface LayoutProps {
  children: React.ReactNode
  theme: 'light' | 'dark'
  onToggleTheme: () => void
}

export const SIDEBAR_EXPANDED  = 240
export const SIDEBAR_COLLAPSED = 56
export const SIDEBAR_DURATION  = 280  // ms — shared by sidebar, topbar, main
export const SIDEBAR_EASING    = 'cubic-bezier(0.4, 0, 0.2, 1)'  // Material standard

export function Layout({ children, theme, onToggleTheme }: LayoutProps) {
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    // Persist collapsed state across page loads
    return localStorage.getItem('arbor_sidebar_collapsed') === 'true'
  })

  const sidebarWidth = collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED

  const handleToggle = () => {
    setCollapsed(c => {
      const next = !c
      localStorage.setItem('arbor_sidebar_collapsed', String(next))
      return next
    })
  }

  const transition = `padding-left ${SIDEBAR_DURATION}ms ${SIDEBAR_EASING}`

  return (
    <div className="min-h-screen bg-bg">
      <Sidebar collapsed={collapsed} onToggle={handleToggle} />

      {/* TopBar and main both receive sidebarWidth as a direct px value so
          their padding-left can be CSS-transitioned in perfect sync with the sidebar */}
      <TopBar
        theme={theme}
        onToggleTheme={onToggleTheme}
        sidebarWidth={sidebarWidth}
      />

      <main
        style={{
          paddingLeft: sidebarWidth,
          paddingTop: 'var(--topbar-height)',
          minHeight: '100vh',
          transition,
        }}
      >
        <div className="p-6 max-w-[1600px] mx-auto">{children}</div>
      </main>

      <ToastContainer />
    </div>
  )
}
