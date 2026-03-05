import React, { useState } from 'react'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { ToastContainer } from '../ui/Toast'
import { SIDEBAR_EXPANDED, SIDEBAR_COLLAPSED, SIDEBAR_DURATION, SIDEBAR_EASING } from './sidebarConfig'
import { useIsMobile } from '../../hooks/useIsMobile'

interface LayoutProps {
  children: React.ReactNode
  theme: 'light' | 'dark'
  onToggleTheme: () => void
}

export function Layout({ children, theme, onToggleTheme }: LayoutProps) {
  const isMobile = useIsMobile()

  const [collapsed, setCollapsed] = useState<boolean>(() => {
    // Persist collapsed state across page loads
    return localStorage.getItem('arbor_sidebar_collapsed') === 'true'
  })

  // Mobile drawer open/close
  const [mobileOpen, setMobileOpen] = useState(false)

  // On mobile the main content is never indented — sidebar overlays as a drawer
  const sidebarWidth = isMobile ? 0 : (collapsed ? SIDEBAR_COLLAPSED : SIDEBAR_EXPANDED)

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

      {/* Mobile overlay — sits above topbar, below drawer */}
      {isMobile && mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-[35]"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <Sidebar
        collapsed={collapsed}
        onToggle={handleToggle}
        isMobile={isMobile}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      {/* TopBar and main both receive sidebarWidth as a direct px value so
          their padding-left can be CSS-transitioned in perfect sync with the sidebar */}
      <TopBar
        theme={theme}
        onToggleTheme={onToggleTheme}
        sidebarWidth={sidebarWidth}
        isMobile={isMobile}
        onOpenMobile={() => setMobileOpen(true)}
      />

      <main
        style={{
          paddingLeft: sidebarWidth,
          paddingTop: 'var(--topbar-height)',
          minHeight: '100vh',
          // Only animate padding on desktop; on mobile there's no padding to animate
          transition: isMobile ? undefined : transition,
        }}
      >
        <div className="p-6 max-w-[1600px] mx-auto">{children}</div>
      </main>

      <ToastContainer />
    </div>
  )
}
