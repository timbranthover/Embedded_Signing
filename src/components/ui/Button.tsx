import React from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'accent'
type Size    = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  icon?: React.ReactNode
  iconRight?: boolean
}

const variantClasses: Record<Variant, string> = {
  primary:   'bg-navy text-white hover:opacity-90 border border-navy',
  secondary: 'bg-surface text-primary border border-border hover:bg-surface-2',
  ghost:     'bg-transparent text-secondary hover:bg-surface-2 hover:text-primary border border-transparent',
  danger:    'bg-danger-bg text-danger border border-danger/20 hover:opacity-90',
  accent:    'bg-accent text-white hover:opacity-90 border border-accent',
}

const sizeClasses: Record<Size, string> = {
  sm:  'h-7  px-3  text-xs  gap-1.5',
  md:  'h-9  px-4  text-sm  gap-2',
  lg:  'h-11 px-6  text-base gap-2.5',
}

export function Button({
  variant = 'secondary',
  size = 'md',
  loading = false,
  icon,
  iconRight = false,
  disabled,
  children,
  className = '',
  ...props
}: ButtonProps) {
  const isDisabled = disabled || loading

  return (
    <button
      disabled={isDisabled}
      className={[
        'inline-flex items-center justify-center rounded font-medium',
        'transition-all duration-150',
        'focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2',
        'disabled:opacity-50 disabled:cursor-not-allowed',
        variantClasses[variant],
        sizeClasses[size],
        className,
      ].join(' ')}
      {...props}
    >
      {loading ? (
        <span className="inline-block w-3.5 h-3.5 border-2 border-current border-r-transparent rounded-full animate-spin" />
      ) : icon && !iconRight ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      {children && <span>{children}</span>}
      {!loading && icon && iconRight && <span className="shrink-0">{icon}</span>}
    </button>
  )
}
