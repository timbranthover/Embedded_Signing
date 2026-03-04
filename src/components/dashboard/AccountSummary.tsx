import { useState } from 'react'
import { TrendingUp, TrendingDown, Eye, EyeOff } from 'lucide-react'
import { Card } from '../ui/Card'

const metrics = [
  {
    label: 'Total Portfolio Value',
    value: '$2,847,431.22',
    change: '+$14,892.40',
    changePct: '+0.52%',
    up: true,
    note: 'As of market close',
    primary: true,
  },
  {
    label: 'YTD Return',
    value: '+8.34%',
    change: '+$219,262.19',
    changePct: '',
    up: true,
    note: 'Inception Jan 1, 2025',
  },
  {
    label: 'Benchmark (S&P 500)',
    value: '+7.12%',
    change: 'Alpha +1.22%',
    changePct: '',
    up: true,
    note: 'YTD return',
  },
  {
    label: 'Unrealized P&L',
    value: '+$312,431.18',
    change: '+$8,241.33',
    changePct: 'today',
    up: true,
    note: 'Across all positions',
  },
  {
    label: 'Cash & Equivalents',
    value: '$184,211.08',
    change: '6.47%',
    changePct: 'of portfolio',
    up: null,
    note: 'VMFXX 4.98% yield',
  },
]

/**
 * Replace every digit character with a bullet.
 * "$2,847,431.22" → "$•,•••,•••.••"
 * Same number of characters, punctuation preserved.
 */
function maskDigits(s: string): string {
  return s.replace(/\d/g, '•')
}

export function AccountSummary() {
  const [visible, setVisible] = useState(true)

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
      {metrics.map((m) => (
        <Card key={m.label} className={m.primary ? 'xl:col-span-1' : ''}>
          <p className="text-xs text-secondary font-medium uppercase tracking-wide mb-2">{m.label}</p>

          {/* Value row ── eye button inline for primary card */}
          <div className="flex items-baseline gap-2">
            {m.primary ? (
              /**
               * Zero-shift masking trick:
               *   - The real value is always rendered and always takes up its full width.
               *   - When masked, it becomes invisible (color: transparent) — layout unchanged.
               *   - A dot string is positioned absolutely on top of that same space.
               *   - Because the dots live in position:absolute they never affect layout.
               */
              <span className="relative inline-block">
                {/* Layout anchor — always present, never changes size */}
                <span
                  className={`font-display tabular-nums font-semibold text-2xl transition-colors duration-150 ${
                    visible ? 'text-primary' : 'text-transparent select-none'
                  }`}
                  aria-hidden={!visible}
                >
                  {m.value}
                </span>

                {/* Masked overlay — only rendered when hidden */}
                {!visible && (
                  <span
                    className="absolute inset-0 font-display font-semibold text-2xl text-primary pointer-events-none"
                    aria-label="Portfolio value hidden"
                  >
                    {maskDigits(m.value)}
                  </span>
                )}
              </span>
            ) : (
              <p className={`font-display tabular-nums font-semibold text-primary text-xl`}>
                {m.value}
              </p>
            )}

            {m.primary && (
              <button
                onClick={() => setVisible(v => !v)}
                className="mb-0.5 p-0.5 rounded text-tertiary hover:text-secondary transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-accent/40"
                aria-label={visible ? 'Hide portfolio value' : 'Show portfolio value'}
              >
                {visible
                  ? <Eye    size={14} strokeWidth={1.75} />
                  : <EyeOff size={14} strokeWidth={1.75} />
                }
              </button>
            )}
          </div>

          {/* Change row */}
          <div className="flex items-center gap-1.5 mt-1.5">
            {m.up !== null && (
              m.up
                ? <TrendingUp   size={13} className="text-success" />
                : <TrendingDown size={13} className="text-danger"  />
            )}
            <span
              className={`text-xs font-medium tabular-nums ${
                m.up === true  ? 'text-success'   :
                m.up === false ? 'text-danger'     : 'text-secondary'
              }`}
            >
              {m.primary && !visible ? maskDigits(m.change) : m.change}
            </span>
            {m.changePct && !(m.primary && !visible) && (
              <span className="text-xs text-tertiary">{m.changePct}</span>
            )}
          </div>

          <p className="text-2xs text-tertiary mt-1.5">{m.note}</p>
        </Card>
      ))}
    </div>
  )
}
