import { useState } from 'react'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts'
import { Eye, EyeOff } from 'lucide-react'
import { Card, CardHeader, CardTitle } from '../ui/Card'

// ── Deterministic seeded RNG ──────────────────────────────────────────────────

function seededRng(seed: number) {
  let s = (seed ^ 0xdeadbeef) >>> 0
  return () => {
    s = (Math.imul(1664525, s) + 1013904223) >>> 0
    return s / 0x100000000
  }
}

// ── Waypoint-driven series (mean-revert toward piecewise-linear path) ─────────
// Waypoints define the "shape" of the chart: peaks, crashes, recoveries.
// The random walk adds texture without straying far from the intended path.

function genWaypoints(
  n: number,
  waypoints: number[],
  vol: number,
  seed: number,
): number[] {
  const rng  = seededRng(seed)
  const segs = waypoints.length - 1
  let v      = waypoints[0]
  const out: number[] = []

  for (let i = 0; i < n; i++) {
    const t      = i / Math.max(n - 1, 1)
    const seg    = Math.min(Math.floor(t * segs), segs - 1)
    const segT   = t * segs - seg
    // Piecewise-linear target at this step
    const target = waypoints[seg] + (waypoints[seg + 1] - waypoints[seg]) * segT
    // Mean-revert toward target, add noise
    v += (target - v) * 0.28 + (rng() - 0.5) * vol * 2
    out.push(Math.round(v))
  }
  out[n - 1] = waypoints[waypoints.length - 1]   // pin end exactly
  return out
}

// ── Sparse X labels — exactly one label per intended tick, no duplicates ──────
// Only the positions in `labels` array are non-empty; all others are ''.
// Used with XAxis interval={0} so recharts shows every tick but only labelled ones render text.

function sparseLabels(n: number, labels: string[]): string[] {
  const result = new Array<string>(n).fill('')
  const k = labels.length
  if (k === 0) return result
  if (k === 1) { result[0] = labels[0]; return result }
  for (let j = 0; j < k; j++) {
    result[Math.round(j * (n - 1) / (k - 1))] = labels[j]
  }
  return result
}

// ── Range definitions ─────────────────────────────────────────────────────────

type RangeKey = '1W' | '1M' | '6M' | 'YTD' | '1YR' | '5YR'

interface DataPoint { t: string; portfolio: number; benchmark: number }

interface RangeCfg {
  pts:       number
  pWP:       number[]    // portfolio waypoints
  bWP:       number[]    // benchmark waypoints
  pVol:      number
  bVol:      number
  xLabels:   string[]    // labels placed at evenly-spaced positions
  subtitle:  string
}

const CFG: Record<RangeKey, RangeCfg> = {
  // ── 1W: Quiet week with intraday texture ──
  '1W': {
    pts: 40,
    pWP:  [2831, 2836, 2842, 2839, 2847],
    bWP:  [2831, 2826, 2818, 2822, 2822],
    pVol: 5, bVol: 8,
    xLabels:  ['Mon 2/24', 'Tue 2/25', 'Wed 2/26', 'Thu 2/27', 'Fri 2/28'],
    subtitle: 'Feb 24 – Mar 3, 2025',
  },
  // ── 1M: Feb 2025 selloff — S&P -4%, portfolio resilient ──
  '1M': {
    pts: 24,
    pWP:  [2803, 2822, 2815, 2830, 2847],
    bWP:  [2803, 2790, 2755, 2705, 2671],
    pVol: 12, bVol: 20,
    xLabels:  ['Feb 3', 'Feb 10', 'Feb 17', 'Feb 24', 'Mar 3'],
    subtitle: 'Feb 3 – Mar 3, 2025',
  },
  // ── 6M: Portfolio surges; S&P hits ATH then pulls back ──
  '6M': {
    pts: 92,
    pWP:  [2503, 2560, 2645, 2730, 2690, 2768, 2847],
    bWP:  [2503, 2592, 2670, 2760, 2710, 2638, 2558],
    pVol: 22, bVol: 30,
    xLabels:  ['Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar'],
    subtitle: 'Sep 2024 – Mar 2025',
  },
  // ── YTD: Portfolio +8.5%; S&P down ~2% (tariffs, tech rotation) ──
  'YTD': {
    pts: 44,
    pWP:  [2624, 2668, 2710, 2760, 2720, 2782, 2812, 2847],
    bWP:  [2624, 2675, 2705, 2648, 2590, 2555, 2565, 2573],
    pVol: 15, bVol: 22,
    xLabels:  ['Jan 1', 'Jan 15', 'Feb 1', 'Feb 15', 'Mar 1'],
    subtitle: 'Jan 1 – Mar 3, 2025',
  },
  // ── 1YR: Both up; portfolio +29.6%, S&P +25%; 2025 pullback visible ──
  '1YR': {
    pts: 52,
    pWP:  [2197, 2268, 2355, 2430, 2372, 2468, 2558, 2648, 2726, 2784, 2808, 2831, 2847],
    bWP:  [2197, 2285, 2378, 2462, 2388, 2510, 2618, 2730, 2840, 2912, 2930, 2855, 2748],
    pVol: 28, bVol: 40,
    xLabels:  ["Mar '24", "May '24", "Jul '24", "Sep '24", "Nov '24", "Jan '25", "Mar '25"],
    subtitle: 'Mar 2024 – Mar 2025',
  },
  // ── 5YR: COVID crash bottom → bull → 2022 bear (-18%) → 2023 recovery → 2024 ATH ──
  '5YR': {
    pts: 65,
    pWP:  [1421, 1810, 2120, 2370, 2200, 1980, 2150, 2440, 2660, 2780, 2847],
    bWP:  [1421, 1940, 2360, 2720, 2540, 2080, 2260, 2680, 3050, 3380, 3380],
    pVol: 60, bVol: 90,
    xLabels:  ['2020', '2021', '2022', '2023', '2024', '2025'],
    subtitle: 'Mar 2020 – Mar 2025',
  },
}

function buildData(key: RangeKey): DataPoint[] {
  const c    = CFG[key]
  const seed = key.split('').reduce((a, ch) => a * 31 + ch.charCodeAt(0), 0)
  const pVals = genWaypoints(c.pts, c.pWP, c.pVol, seed)
  const bVals = genWaypoints(c.pts, c.bWP, c.bVol, seed + 7919)
  const tVals = sparseLabels(c.pts, c.xLabels)
  return Array.from({ length: c.pts }, (_, i) => ({
    t:         tVals[i],
    portfolio: pVals[i],
    benchmark: bVals[i],
  }))
}

// Build once at module load — pure + deterministic
const ALL_DATA = (Object.keys(CFG) as RangeKey[]).reduce(
  (acc, k) => { acc[k] = buildData(k); return acc },
  {} as Record<RangeKey, DataPoint[]>,
)

// ── Formatters ────────────────────────────────────────────────────────────────

const fmtY   = (v: number) => `$${(v / 1000).toFixed(2)}M`
const fmtTip = (v: number) => `$${(v / 1000).toFixed(2)}M`

// ── Custom tooltip ────────────────────────────────────────────────────────────

interface TooltipProps {
  active?:   boolean
  payload?:  Array<{ value: number; name: string; color: string }>
  label?:    string
  showBench: boolean
}

function CustomTooltip({ active, payload, label, showBench }: TooltipProps) {
  if (!active || !payload?.length) return null
  // Suppress tooltip when hovering over a gap point (empty label is fine — data still exists)
  return (
    <div className="bg-surface border border-border rounded-lg px-3 py-2.5 shadow-card-hover text-xs min-w-[144px]">
      {label && <p className="font-semibold text-secondary mb-1.5">{label}</p>}
      {payload.map(p => (
        <div key={p.name} className="flex items-center justify-between gap-3">
          {/* Colored dot for series identity; label always uses text-secondary so it's
              readable in dark mode (navy #2A3F6F would be invisible on dark surface) */}
          <span className="flex items-center gap-1.5 text-secondary">
            <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: p.color }} />
            {p.name === 'portfolio' ? 'Portfolio' : 'S&amp;P 500'}
          </span>
          <span className="font-semibold tabular-nums text-primary">{fmtTip(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

const RANGE_KEYS: RangeKey[] = ['1W', '1M', '6M', 'YTD', '1YR', '5YR']

export function PerformanceChart() {
  const [range,     setRange]     = useState<RangeKey>('6M')
  const [showBench, setShowBench] = useState(true)

  const data = ALL_DATA[range]
  const cfg  = CFG[range]

  return (
    <Card className="h-full">
      {/* Header */}
      <CardHeader>
        <div>
          <CardTitle>Portfolio Performance</CardTitle>
          <p className="text-2xs text-tertiary mt-0.5">{cfg.subtitle}</p>
        </div>
        <div className="flex items-center gap-0.5">
          {RANGE_KEYS.map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={[
                'px-2 py-1 rounded text-xs font-medium transition-colors',
                r === range
                  ? 'bg-navy text-white'
                  : 'text-secondary hover:text-primary hover:bg-surface-2',
              ].join(' ')}
            >
              {r}
            </button>
          ))}
        </div>
      </CardHeader>

      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={data} margin={{ top: 6, right: 8, bottom: 0, left: 4 }}>
          <defs>
            <linearGradient id="grad-portfolio" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="var(--color-navy)"   stopOpacity={0.22} />
              <stop offset="95%" stopColor="var(--color-navy)"   stopOpacity={0}    />
            </linearGradient>
            <linearGradient id="grad-benchmark" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor="var(--color-accent)" stopOpacity={0.14} />
              <stop offset="95%" stopColor="var(--color-accent)" stopOpacity={0}    />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />

          {/* interval={0} + sparse label array = exact label placement, zero duplicates */}
          <XAxis
            dataKey="t"
            tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }}
            axisLine={false}
            tickLine={false}
            interval={0}
          />

          {/* domain auto zooms to data range — kills the $0.00M problem */}
          <YAxis
            tickFormatter={fmtY}
            tick={{ fontSize: 11, fill: 'var(--color-text-secondary)' }}
            axisLine={false}
            tickLine={false}
            width={68}
            domain={['auto', 'auto']}
            padding={{ top: 8, bottom: 8 }}
          />

          <Tooltip
            cursor={{ stroke: 'var(--color-border)', strokeWidth: 1 }}
            content={(props) => (
              <CustomTooltip
                active={props.active}
                payload={props.payload as TooltipProps['payload']}
                label={props.label as string}
                showBench={showBench}
              />
            )}
          />

          <Area
            type="monotone"
            dataKey="portfolio"
            stroke="var(--color-navy)"
            strokeWidth={2}
            fill="url(#grad-portfolio)"
            dot={false}
            activeDot={{ r: 4, fill: 'var(--color-navy)', stroke: 'var(--color-surface)', strokeWidth: 2 }}
            isAnimationActive={true}
            animationDuration={450}
          />

          {showBench && (
            <Area
              type="monotone"
              dataKey="benchmark"
              stroke="var(--color-accent)"
              strokeWidth={1.5}
              strokeDasharray="5 3"
              fill="url(#grad-benchmark)"
              dot={false}
              activeDot={{ r: 3, fill: 'var(--color-accent)' }}
              isAnimationActive={true}
              animationDuration={450}
            />
          )}
        </AreaChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="flex items-center gap-5 mt-3 pt-3 border-t border-border">
        <div className="flex items-center gap-1.5 text-xs text-secondary">
          <span className="w-4 h-0.5 rounded-full bg-navy" />
          Portfolio
        </div>
        <button
          onClick={() => setShowBench(v => !v)}
          className={[
            'flex items-center gap-1.5 text-xs rounded transition-colors select-none',
            showBench ? 'text-secondary hover:text-primary' : 'text-tertiary hover:text-secondary',
          ].join(' ')}
          aria-pressed={showBench}
          title={showBench ? 'Hide S&P 500' : 'Show S&P 500'}
        >
          <span className={[
            'w-4 border-t-[1.5px] border-dashed transition-colors',
            showBench ? 'border-accent' : 'border-tertiary',
          ].join(' ')} />
          S&amp;P 500
          {showBench
            ? <Eye    size={11} className="ml-0.5 opacity-60" />
            : <EyeOff size={11} className="ml-0.5 opacity-40" />
          }
        </button>
      </div>
    </Card>
  )
}
