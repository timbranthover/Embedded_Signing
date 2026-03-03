import React from 'react'
import { Clock, CheckCircle2, Send, AlertCircle, XCircle } from 'lucide-react'
import type { EnvelopeStatus } from '../../types'

interface BadgeProps {
  status: EnvelopeStatus
  className?: string
}

const config: Record<EnvelopeStatus, { label: string; icon: React.ReactNode; className: string }> = {
  awaiting_signature: {
    label: 'Awaiting your signature',
    icon: <Clock size={11} strokeWidth={2.5} />,
    className: 'badge-pending',
  },
  sent: {
    label: 'Sent',
    icon: <Send size={11} strokeWidth={2.5} />,
    className: 'badge-sent',
  },
  completed: {
    label: 'Completed',
    icon: <CheckCircle2 size={11} strokeWidth={2.5} />,
    className: 'badge-completed',
  },
  expired: {
    label: 'Expired',
    icon: <AlertCircle size={11} strokeWidth={2.5} />,
    className: 'badge-expired',
  },
  declined: {
    label: 'Declined',
    icon: <XCircle size={11} strokeWidth={2.5} />,
    className: 'badge-expired',
  },
}

export function StatusBadge({ status, className = '' }: BadgeProps) {
  const { label, icon, className: cls } = config[status]
  return (
    <span
      className={[
        'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-semibold tracking-wide',
        cls,
        className,
      ].join(' ')}
    >
      {icon}
      {label}
    </span>
  )
}

interface SimpleBadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'accent' | 'success' | 'danger' | 'navy'
  className?: string
}

const simpleVariants: Record<string, string> = {
  default: 'bg-surface-2 text-secondary border border-border',
  accent:  'bg-accent-muted text-accent',
  success: 'bg-success-bg text-success',
  danger:  'bg-danger-bg text-danger',
  navy:    'bg-navy text-white',
}

export function Badge({ children, variant = 'default', className = '' }: SimpleBadgeProps) {
  return (
    <span
      className={[
        'inline-flex items-center px-2 py-0.5 rounded text-2xs font-semibold',
        simpleVariants[variant],
        className,
      ].join(' ')}
    >
      {children}
    </span>
  )
}
