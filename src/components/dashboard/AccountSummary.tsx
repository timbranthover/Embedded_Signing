import { TrendingUp, TrendingDown } from 'lucide-react'
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
    label: 'Cash & Equivalents',
    value: '$184,211.08',
    change: '6.47%',
    changePct: 'of portfolio',
    up: null,
    note: 'VMFXX 4.98% yield',
  },
]

export function AccountSummary() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {metrics.map((m) => (
        <Card key={m.label} className={m.primary ? 'xl:col-span-1' : ''}>
          <p className="text-xs text-secondary font-medium uppercase tracking-wide mb-2">{m.label}</p>
          <p className={`font-display tabular-nums font-semibold ${m.primary ? 'text-2xl' : 'text-xl'} text-primary`}>
            {m.value}
          </p>
          <div className="flex items-center gap-1.5 mt-1.5">
            {m.up !== null && (
              m.up
                ? <TrendingUp size={13} className="text-success" />
                : <TrendingDown size={13} className="text-danger" />
            )}
            <span className={`text-xs font-medium tabular-nums ${m.up === true ? 'text-success' : m.up === false ? 'text-danger' : 'text-secondary'}`}>
              {m.change}
            </span>
            {m.changePct && <span className="text-xs text-tertiary">{m.changePct}</span>}
          </div>
          <p className="text-2xs text-tertiary mt-1.5">{m.note}</p>
        </Card>
      ))}
    </div>
  )
}
