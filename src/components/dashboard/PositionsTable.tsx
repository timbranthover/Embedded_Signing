import { useState } from 'react'
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { Card, CardHeader, CardTitle } from '../ui/Card'
import type { Position, SortDir } from '../../types'

const positions: Position[] = [
  { ticker: 'AAPL',  name: 'Apple Inc.',          sector: 'Technology',  shares: 1250, price: 192.45, value: 240563, dayChange: 2.34,  dayChangePct:  1.22 },
  { ticker: 'MSFT',  name: 'Microsoft Corp',       sector: 'Technology',  shares:  820, price: 418.32, value: 343022, dayChange: 5.21,  dayChangePct:  1.26 },
  { ticker: 'JPM',   name: 'JPMorgan Chase',        sector: 'Financials',  shares: 1500, price: 198.76, value: 298140, dayChange:-1.45,  dayChangePct: -0.72 },
  { ticker: 'V',     name: 'Visa Inc',              sector: 'Financials',  shares: 1100, price: 274.18, value: 301598, dayChange: 3.12,  dayChangePct:  1.15 },
  { ticker: 'NVDA',  name: 'NVIDIA Corp',           sector: 'Technology',  shares:  150, price: 678.45, value: 101768, dayChange:22.10,  dayChangePct:  3.37 },
  { ticker: 'AMZN',  name: 'Amazon.com Inc',        sector: 'Technology',  shares:  200, price: 184.72, value:  36944, dayChange: 4.88,  dayChangePct:  2.71 },
  { ticker: 'GS',    name: 'Goldman Sachs',          sector: 'Financials',  shares:  310, price: 468.92, value: 145365, dayChange: 2.30,  dayChangePct:  0.49 },
  { ticker: 'JNJ',   name: 'Johnson & Johnson',     sector: 'Healthcare',   shares:  780, price: 152.34, value: 118825, dayChange:-0.67,  dayChangePct: -0.44 },
  { ticker: 'BRK.B', name: 'Berkshire Hathaway B',  sector: 'Financials',  shares:  450, price: 378.50, value: 170325, dayChange: 1.20,  dayChangePct:  0.32 },
  { ticker: 'TLT',   name: 'iShares 20Y Bond ETF',  sector: 'Fixed Income', shares: 2000, price:  93.21, value: 186420, dayChange:-0.88,  dayChangePct: -0.94 },
]

type Col = 'ticker' | 'value' | 'dayChangePct'

export function PositionsTable() {
  const [sortCol, setSortCol] = useState<Col>('value')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const toggle = (col: Col) => {
    if (sortCol === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortCol(col); setSortDir('desc') }
  }

  const sorted = [...positions].sort((a, b) => {
    const va = a[sortCol]
    const vb = b[sortCol]
    const cmp = typeof va === 'string' ? va.localeCompare(vb as string) : (va as number) - (vb as number)
    return sortDir === 'asc' ? cmp : -cmp
  })

  const SortIcon = ({ col }: { col: Col }) => {
    if (sortCol !== col) return <ArrowUpDown size={11} className="text-tertiary" />
    return sortDir === 'asc' ? <ArrowUp size={11} /> : <ArrowDown size={11} />
  }

  const fmtCurrency = (v: number) =>
    v.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })

  return (
    <Card padding="none">
      <div className="px-5 py-4 border-b border-border">
        <CardHeader className="mb-0">
          <CardTitle>Positions</CardTitle>
          <span className="text-xs text-secondary">{positions.length} holdings</span>
        </CardHeader>
      </div>
      <div className="overflow-x-auto">
        <table className="data-table w-full">
          <thead>
            <tr>
              <th className="text-left">
                <button className="flex items-center gap-1 hover:text-primary" onClick={() => toggle('ticker')}>
                  Ticker <SortIcon col="ticker" />
                </button>
              </th>
              <th className="text-left hidden md:table-cell">Company</th>
              <th className="text-left hidden lg:table-cell">Sector</th>
              <th className="num">Shares</th>
              <th className="num">Price</th>
              <th className="num">
                <button className="flex items-center gap-1 ml-auto hover:text-primary" onClick={() => toggle('value')}>
                  Market Value <SortIcon col="value" />
                </button>
              </th>
              <th className="num">
                <button className="flex items-center gap-1 ml-auto hover:text-primary" onClick={() => toggle('dayChangePct')}>
                  Day % <SortIcon col="dayChangePct" />
                </button>
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map(p => (
              <tr key={p.ticker}>
                <td>
                  <span className="font-semibold text-primary font-mono text-xs">{p.ticker}</span>
                </td>
                <td className="hidden md:table-cell text-secondary">{p.name}</td>
                <td className="hidden lg:table-cell">
                  <span className="text-2xs font-medium text-secondary bg-surface-2 px-1.5 py-0.5 rounded">
                    {p.sector}
                  </span>
                </td>
                <td className="num tabular-nums">{p.shares.toLocaleString()}</td>
                <td className="num tabular-nums">${p.price.toFixed(2)}</td>
                <td className="num tabular-nums font-medium">{fmtCurrency(p.value)}</td>
                <td className={`num tabular-nums font-semibold ${p.dayChangePct >= 0 ? 'text-success' : 'text-danger'}`}>
                  {p.dayChangePct >= 0 ? '+' : ''}{p.dayChangePct.toFixed(2)}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  )
}
