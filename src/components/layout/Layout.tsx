import React, { useState } from 'react'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { ToastContainer } from '../ui/Toast'

interface LayoutProps {
  children: React.ReactNode
  theme: 'light' | 'dark'
  onToggleTheme: () => void
}

export function Layout({ children, theme, onToggleTheme }: LayoutProps) {
  const [collapsed, setCollapsed] = useState(false)
  const sidebarWidth = collapsed ? 56 : 240

  return (
    <div className="min-h-screen bg-bg">
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />

      {/* Offset top bar and main for sidebar */}
      <style>{`:root { --sidebar-current-width: ${sidebarWidth}px; }`}</style>

      <TopBar theme={theme} onToggleTheme={onToggleTheme} />

      <main
        className="transition-all duration-200"
        style={{
          paddingLeft: sidebarWidth,
          paddingTop: 'var(--topbar-height)',
          minHeight: '100vh',
        }}
      >
        <div className="p-6 max-w-[1600px] mx-auto">{children}</div>
      </main>

      <ToastContainer />
    </div>
  )
}
