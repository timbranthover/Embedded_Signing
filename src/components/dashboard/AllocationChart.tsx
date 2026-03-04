import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts'
import { Card, CardHeader, CardTitle } from '../ui/Card'

const allocations = [
  { name: 'US Equity',     pct: 42.8, target: 40.0, value: 1_218_692, color: 'var(--color-navy)'   },
  { name: 'International', pct: 18.4, target: 20.0, value:   523_927, color: 'var(--color-accent)' },
  { name: 'Fixed Income',  pct: 22.1, target: 25.0, value:   629_282, color: '#6B8CAE'              },
  { name: 'Alternatives',  pct: 10.2, target: 10.0, value:   290_438, color: '#9B7E5A'              },
  { name: 'Cash',          pct:  6.5, target:  5.0, value:   185_083, color: 'var(--color-border)'  },
]

const fmtUSD = (v: number) =>
  '$' + (v >= 1_000_000 ? (v / 1_000_000).toFixed(2) + 'M' : Math.round(v / 1_000) + 'k')

function CustomTooltip({
  active, payload,
}: {
  active?: boolean
  payload?: Array<{ payload: typeof allocations[0] }>
}) {
  if (!active || !payload?.length) return null
  const d = payload[0].payload
  const diff = d.pct - d.target
  return (
    <div className="bg-surface border border-border rounded-lg px-3 py-2 shadow-card-hover text-xs">
      <p className="font-semibold text-primary mb-1">{d.name}</p>
      <p className="text-secondary tabular-nums">{fmtUSD(d.value)} · {d.pct}%</p>
      <p className={`tabular-nums mt-0.5 ${Math.abs(diff) < 0.5 ? 'text-tertiary' : diff > 0 ? 'text-success' : 'text-secondary'}`}>
        Target {d.target}% ({diff > 0 ? '+' : ''}{diff.toFixed(1)}% drift)
      </p>
    </div>
  )
}

export function AllocationChart() {
  const totalValue = allocations.reduce((s, a) => s + a.value, 0)

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Asset Allocation</CardTitle>
        <span className="text-xs text-secondary">Current</span>
      </CardHeader>

      {/* Donut + legend */}
      <div className="flex items-center gap-3">
        <div className="shrink-0">
          <ResponsiveContainer width={120} height={120}>
            <PieChart>
              <Pie
                data={allocations}
                cx="50%"
                cy="50%"
                innerRadius={36}
                outerRadius={56}
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

        {/* Legend: name + pct + $ value */}
        <div className="flex-1 space-y-1.5">
          {allocations.map(a => (
            <div key={a.name} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-2 h-2 rounded-sm shrink-0" style={{ background: a.color }} />
                <span className="text-xs text-secondary truncate">{a.name}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-2xs text-tertiary tabular-nums">{fmtUSD(a.value)}</span>
                <span className="text-xs font-semibold tabular-nums text-primary w-9 text-right">
                  {a.pct}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Target vs Actual section */}
      <div className="mt-4 pt-3 border-t border-border">
        <p className="text-2xs text-tertiary uppercase tracking-wide font-semibold mb-2.5">
          Current vs Target
        </p>
        <div className="space-y-2">
          {allocations.map(a => {
            const diff = +(a.pct - a.target).toFixed(1)
            const driftColor =
              Math.abs(diff) < 0.5 ? 'text-tertiary'
              : diff > 0           ? 'text-success'
              :                      'text-secondary'
            return (
              <div key={a.name} className="flex items-center gap-2">
                <span className="text-2xs text-secondary w-[72px] shrink-0 truncate">{a.name}</span>
                {/* Bar — scaled so 50% allocation fills the bar */}
                <div className="flex-1 h-1.5 bg-surface-2 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full opacity-75 transition-all duration-500"
                    style={{ width: `${Math.min(a.pct * 2, 100)}%`, background: a.color }}
                  />
                </div>
                <span className={`text-2xs tabular-nums font-medium w-10 text-right ${driftColor}`}>
                  {diff > 0 ? `+${diff}%` : `${diff}%`}
                </span>
              </div>
            )
          })}
        </div>

        {/* Footer: total AUM + rebalancing status */}
        <div className="mt-3 pt-2.5 border-t border-border flex items-center justify-between">
          <div>
            <p className="text-2xs text-tertiary">Total AUM</p>
            <p className="text-xs font-semibold tabular-nums text-primary">{fmtUSD(totalValue)}</p>
          </div>
          <div className="text-right">
            <p className="text-2xs text-tertiary">Last rebalanced</p>
            <p className="text-xs text-secondary">Jan 15, 2025</p>
          </div>
        </div>
      </div>
    </Card>
  )
}
