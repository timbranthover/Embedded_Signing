import React from 'react'

interface CardProps {
  children: React.ReactNode
  className?: string
  priority?: boolean   // pinned/priority style for items needing attention
  hoverable?: boolean
  padding?: 'none' | 'sm' | 'md' | 'lg'
  onClick?: () => void
}

const paddingClasses = {
  none: '',
  sm:   'p-4',
  md:   'p-5',
  lg:   'p-6',
}

export function Card({
  children,
  className = '',
  priority = false,
  hoverable = false,
  padding = 'md',
  onClick,
}: CardProps) {
  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick() } : undefined}
      onClick={onClick}
      className={[
        'rounded-lg bg-surface border',
        priority ? 'border-accent/40 dark:border-border shadow-sm dark:shadow-none' : 'border-border',
        hoverable || onClick ? 'cursor-pointer transition-shadow duration-150 hover:shadow-card-hover' : 'shadow-card',
        padding !== 'none' ? paddingClasses[padding] : '',
        className,
      ].join(' ')}
    >
      {priority && (
        <div className="h-0.5 -mt-[1px] -mx-[1px] mb-4 rounded-t-lg bg-accent/60 dark:hidden" />
      )}
      {children}
    </div>
  )
}

export function CardHeader({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex items-center justify-between mb-4 ${className}`}>
      {children}
    </div>
  )
}

export function CardTitle({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <h3 className={`text-sm font-semibold text-primary tracking-tight ${className}`}>
      {children}
    </h3>
  )
}
