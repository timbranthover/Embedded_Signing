import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import { Card, CardHeader, CardTitle } from '../ui/Card'

const data = [
  { month: 'Sep', portfolio: 2420, benchmark: 2390 },
  { month: 'Oct', portfolio: 2510, benchmark: 2455 },
  { month: 'Nov', portfolio: 2480, benchmark: 2490 },
  { month: 'Dec', portfolio: 2620, benchmark: 2530 },
  { month: 'Jan', portfolio: 2710, benchmark: 2600 },
  { month: 'Feb', portfolio: 2780, benchmark: 2660 },
  { month: 'Mar', portfolio: 2847, benchmark: 2705 },
]

const fmt = (v: number) => `$${(v).toLocaleString()}k`

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{value: number; name: string; color: string}>; label?: string }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-surface border border-border rounded-lg px-3 py-2.5 shadow-card-hover text-xs">
      <p className="font-semibold text-secondary mb-1.5">{label}</p>
      {payload.map(p => (
        <div key={p.name} className="flex items-center gap-2 justify-between">
          <span className="flex items-center gap-1.5" style={{ color: p.color }}>
            <span className="w-1.5 h-1.5 rounded-full" style={{ background: p.color }} />
            {p.name === 'portfolio' ? 'Portfolio' : 'S&P 500'}
          </span>
          <span className="font-semibold tabular-nums text-primary ml-3">{fmt(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

export function PerformanceChart() {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Portfolio Performance</CardTitle>
        <span className="text-xs text-secondary">6-month trailing</span>
      </CardHeader>
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 4, right: 4, bottom: 0, left: -8 }}>
          <defs>
            <linearGradient id="grad-portfolio" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-navy)" stopOpacity={0.18} />
              <stop offset="95%" stopColor="var(--color-navy)" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="grad-benchmark" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="var(--color-accent)" stopOpacity={0.12} />
              <stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="month" tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }} axisLine={false} tickLine={false} />
          <YAxis tickFormatter={fmt} tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }} axisLine={false} tickLine={false} width={52} />
          <Tooltip content={<CustomTooltip />} />
          <Area
            type="monotone"
            dataKey="portfolio"
            stroke="var(--color-navy)"
            strokeWidth={2}
            fill="url(#grad-portfolio)"
            dot={false}
            activeDot={{ r: 4, fill: 'var(--color-navy)', stroke: 'var(--color-surface)', strokeWidth: 2 }}
          />
          <Area
            type="monotone"
            dataKey="benchmark"
            stroke="var(--color-accent)"
            strokeWidth={1.5}
            strokeDasharray="4 3"
            fill="url(#grad-benchmark)"
            dot={false}
            activeDot={{ r: 3, fill: 'var(--color-accent)' }}
          />
        </AreaChart>
      </ResponsiveContainer>
      <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border">
        <div className="flex items-center gap-1.5 text-xs text-secondary">
          <span className="w-3 h-0.5 bg-navy rounded-full" />
          Portfolio
        </div>
        <div className="flex items-center gap-1.5 text-xs text-secondary">
          <span className="w-3 h-0.5 border-t-2 border-dashed border-accent" />
          S&P 500
        </div>
      </div>
    </Card>
  )
}
