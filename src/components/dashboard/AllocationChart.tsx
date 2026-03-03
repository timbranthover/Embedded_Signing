import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardHeader, CardTitle } from '../ui/Card'

const allocations = [
  { name: 'US Equity',       pct: 42.8, value: '1,218,692', color: 'var(--color-navy)' },
  { name: 'International',   pct: 18.4, value:  '523,927', color: 'var(--color-accent)' },
  { name: 'Fixed Income',    pct: 22.1, value:  '629,282', color: '#6B8CAE' },
  { name: 'Alternatives',    pct: 10.2, value:  '290,438', color: '#9B7E5A' },
  { name: 'Cash',            pct:  6.5, value:  '185,083', color: 'var(--color-border)' },
]

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{payload: typeof allocations[0]}> }) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  return (
    <div className="bg-surface border border-border rounded-lg px-3 py-2 shadow-card-hover text-xs">
      <p className="font-semibold text-primary">{d.name}</p>
      <p className="text-secondary tabular-nums">${d.value}k &nbsp;·&nbsp; {d.pct}%</p>
    </div>
  )
}

export function AllocationChart() {
  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Asset Allocation</CardTitle>
        <span className="text-xs text-secondary">Current</span>
      </CardHeader>
      <div className="flex items-center gap-4">
        <div className="shrink-0">
          <ResponsiveContainer width={140} height={140}>
            <PieChart>
              <Pie
                data={allocations}
                cx="50%"
                cy="50%"
                innerRadius={42}
                outerRadius={64}
                paddingAngle={2}
                dataKey="pct"
                strokeWidth={0}
              >
                {allocations.map((entry, i) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 space-y-2">
          {allocations.map(a => (
            <div key={a.name} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-sm shrink-0" style={{ background: a.color }} />
                <span className="text-xs text-secondary truncate">{a.name}</span>
              </div>
              <span className="text-xs font-semibold tabular-nums text-primary">{a.pct}%</span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  )
}
