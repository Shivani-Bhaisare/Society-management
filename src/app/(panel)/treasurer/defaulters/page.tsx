'use client'

import { useMemo, useState } from 'react'
import { motion, type Variants } from 'framer-motion'
import {
  Wallet, AlertTriangle, Building2, BadgeCheck, Search, Download,
  ChevronLeft, ChevronRight, type LucideIcon,
} from 'lucide-react'
import { Card } from '@/Components/ui'

/* ---------- Animation (same as the Income page) ---------- */

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]
const VIEWPORT = { once: false, amount: 0.15 }

// Parent variant: staggers the children one after another
const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
}

// Child variant: fade in, slide up and scale slightly
const item: Variants = {
  hidden: { opacity: 0, y: 30, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.7, ease: EASE } },
}

/* ---------- Colours (hex, so they always render) ---------- */

const RED = '#EF4444'
const GREEN = '#10B981'
const BLUE = '#3B82F6'
const ORANGE = '#F59E0B'
const SLATE = '#94A3B8'

/* ---------- Data (replace with API data later) ---------- */

type Occupant = 'Owner' | 'Tenant' | 'Vacant'

// Occupant badge colours
const occupantColor: Record<Occupant, string> = {
  Owner: BLUE,
  Tenant: ORANGE,
  Vacant: SLATE,
}

type Due = {
  id: number
  tower: string
  unit: string
  owner: string
  tenant: string
  occupant: Occupant
  penalty: number // accumulated penalty
  ledger: number // ledger dues
  total: number // penalty + ledger
  recovered: number // amount already collected
  month: string // billing month, YYYY-MM
  days: number // days overdue
}

const towers = ['Alpha', 'Aston', 'BOM Tower 1', 'Green Heights']
const owners = ['Krittika Thakur', 'Shridhar Sharma', 'Amit Mandal', 'Priya Nair', 'Rohit Verma', 'Sneha Patil', 'Imran Khan']
const tenants = ['Pramod Sharma', 'Neha Gupta', 'Karan Singh']
const monthKeys = ['2026-07', '2026-08', '2026-09', '2026-10']
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// "2026-07" -> "Jul 2026"
const monthLabel = (k: string) => `${MONTH_NAMES[+k.slice(5, 7) - 1]} ${k.slice(0, 4)}`

// Build fixed sample rows (no random values, so server and client always match)
const ledgerSet = [684.4, 15684.4, 0, 74687.4, 1520.5, 4200, 684.4]
const penaltySet = [141.6, 0, 141.6, 382.2, 141.6, 0, 88.4]
const daysSet = [12, 95, 0, 140, 45, 72, 28]
const occupantSet: Occupant[] = ['Owner', 'Vacant', 'Tenant']

const initialDues: Due[] = Array.from({ length: 30 }, (_, i) => {
  const tower = towers[i % towers.length]
  const occupant = occupantSet[i % 3]
  const ledger = ledgerSet[i % 7]
  const penalty = penaltySet[i % 7]
  return {
    id: i + 1,
    tower,
    unit: `${tower}-${101 + i * 3}`,
    owner: occupant === 'Vacant' ? '' : owners[i % owners.length],
    tenant: occupant === 'Tenant' ? tenants[i % tenants.length] : '',
    occupant,
    penalty,
    ledger,
    total: Math.round((ledger + penalty) * 100) / 100,
    recovered: 500 + (i % 4) * 750,
    month: monthKeys[i % monthKeys.length],
    days: daysSet[i % 7],
  }
})

type RangeKey = 'all' | 'low' | 'mid' | 'high'
type DaysKey = 'all' | '0-30' | '31-60' | '61-90' | '90+'

// Outstanding range filter options
const ranges: { v: RangeKey; l: string; test: (n: number) => boolean }[] = [
  { v: 'all', l: 'All Ranges', test: () => true },
  { v: 'low', l: 'Up to ₹ 1,000', test: (n) => n <= 1000 },
  { v: 'mid', l: '₹ 1,000 - ₹ 10,000', test: (n) => n > 1000 && n <= 10000 },
  { v: 'high', l: 'Above ₹ 10,000', test: (n) => n > 10000 },
]

// Days overdue filter options
const dayRanges: { v: DaysKey; l: string; test: (n: number) => boolean }[] = [
  { v: 'all', l: 'All Days', test: () => true },
  { v: '0-30', l: '0 - 30 days', test: (n) => n <= 30 },
  { v: '31-60', l: '31 - 60 days', test: (n) => n > 30 && n <= 60 },
  { v: '61-90', l: '61 - 90 days', test: (n) => n > 60 && n <= 90 },
  { v: '90+', l: 'Above 90 days', test: (n) => n > 90 },
]

// A flat is a defaulter when its dues are more than 60 days old
const DEFAULTER_DAYS = 60

const PAGE_SIZE = 8

/* ---------- Shared styles (same as the Income page) ---------- */

// Table header / cell styles
const th = 'whitespace-nowrap bg-white/4 px-2 py-2 font-medium first:rounded-l-md last:rounded-r-md'
const td = 'border-t border-[#272D39] px-2 py-2.5'

// Table wrapper: horizontal scroll only inside the card, never a vertical scrollbar
const tableWrap = 'thin-scroll w-full overflow-x-auto overflow-y-hidden'

// Shared input / select style
const field =
  'w-full min-w-0 rounded-lg border border-[#272D39] bg-[#10131A] px-3 py-2 text-xs text-slate-200 outline-none placeholder:text-slate-500 focus:border-[#8B85FF] scheme-dark'

// Small uppercase form label
const label = 'mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400'

// Gradient action button (same style as the Accounting "Add Transaction" button)
const gradBtn =
  'flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-linear-to-r from-[#6C63FF] to-[#4DA3FF] px-4 py-2.5 text-xs font-semibold text-white transition hover:opacity-90 active:scale-95'

// Outlined secondary button
const ghostBtn =
  'flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-[#272D39] bg-[#10131A] px-4 py-2.5 text-xs font-semibold text-slate-300 transition-colors hover:bg-white/5 active:scale-95'

// Small square icon button (pagination arrows)
const iconBtn =
  'flex h-7 w-7 items-center justify-center rounded-md border border-[#272D39] bg-[#10131A] text-slate-300 transition-colors hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-[#10131A]'

// Format a number as Indian rupees
const money = (n: number) => `₹ ${n.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`

// Sum helper
const sum = (list: number[]) => list.reduce((s, n) => s + n, 0)

// Days overdue colour: green = on time, orange = late, red = very late
const dayColor = (d: number) => (d === 0 ? GREEN : d > DEFAULTER_DAYS ? RED : ORANGE)

/* ---------- Small helpers ---------- */

// Coloured pill / badge (inline colours, no dependency on Badge tones)
function Pill({ c, children }: { c: string; children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold"
      style={{ background: `${c}26`, color: c }}
    >
      {children}
    </span>
  )
}

// Labelled select used in the filter card
function Select({
  title, value, onChange, options,
}: {
  title: string
  value: string
  onChange: (v: string) => void
  options: { v: string; l: string }[]
}) {
  return (
    <div className="min-w-0">
      <label className={label}>{title}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={field}>
        {options.map((o) => (
          <option key={o.v} value={o.v} className="bg-[#10131A]">{o.l}</option>
        ))}
      </select>
    </div>
  )
}

/* ---------- Page ---------- */
export default function DuesReportPage() {
  // Filter state
  const [tower, setTower] = useState('all')
  const [unit, setUnit] = useState('')
  const [month, setMonth] = useState('all')
  const [range, setRange] = useState<RangeKey>('all')
  const [days, setDays] = useState<DaysKey>('all')
  const [occupant, setOccupant] = useState<'all' | Occupant>('all')

  // Table state
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Set<number>>(new Set())

  // Run a filter update and jump back to the first page
  const setFilter = (fn: () => void) => {
    fn()
    setPage(1)
  }

  const resetFilters = () => {
    setTower('all')
    setUnit('')
    setMonth('all')
    setRange('all')
    setDays('all')
    setOccupant('all')
    setPage(1)
  }

  // Rows after all filters, highest dues first
  const filtered = useMemo(() => {
    const q = unit.trim().toLowerCase()
    const inRange = ranges.find((r) => r.v === range)!.test
    const inDays = dayRanges.find((r) => r.v === days)!.test
    return initialDues
      .filter(
        (d) =>
          (tower === 'all' || d.tower === tower) &&
          (month === 'all' || d.month === month) &&
          (occupant === 'all' || d.occupant === occupant) &&
          (!q || d.unit.toLowerCase().includes(q)) &&
          inRange(d.total) &&
          inDays(d.days),
      )
      .sort((a, b) => b.total - a.total)
  }, [tower, unit, month, range, days, occupant])

  // Summary numbers (based on the filtered rows)
  const totalOutstanding = sum(filtered.map((d) => d.total))
  const overdueAmount = sum(filtered.filter((d) => d.days > 0).map((d) => d.total))
  const defaulters = filtered.filter((d) => d.days > DEFAULTER_DAYS).length
  const recovered = sum(filtered.map((d) => d.recovered))

  // Line + icon colours are the same as the Payments page cards
  const cards: { l: string; v: string; sub: string; c: string; i: LucideIcon }[] = [
    { l: 'Total Outstanding', v: money(totalOutstanding), sub: `${filtered.length} flats with dues`, c: BLUE, i: Wallet },
    { l: 'Overdue Amount', v: money(overdueAmount), sub: 'Past the due date', c: RED, i: AlertTriangle },
    { l: 'Defaulter Flats', v: String(defaulters), sub: `Overdue more than ${DEFAULTER_DAYS} days`, c: ORANGE, i: Building2 },
    { l: 'Collections Recovered', v: money(recovered), sub: 'Collected so far', c: GREEN, i: BadgeCheck },
  ]

  // Pagination
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const cur = Math.min(page, pages)
  const rows = filtered.slice((cur - 1) * PAGE_SIZE, cur * PAGE_SIZE)

  // Selection helpers
  const allOnPage = rows.length > 0 && rows.every((r) => selected.has(r.id))
  const toggleAll = () =>
    setSelected((prev) => {
      const n = new Set(prev)
      if (allOnPage) rows.forEach((r) => n.delete(r.id))
      else rows.forEach((r) => n.add(r.id))
      return n
    })
  const toggleOne = (id: number) =>
    setSelected((prev) => {
      const n = new Set(prev)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })

  // Download the selected rows (or all filtered rows) as a CSV file
  const exportCsv = () => {
    const list = selected.size > 0 ? filtered.filter((d) => selected.has(d.id)) : filtered
    const data = [
      ['Unit', 'Owner Name', 'Tenant Name', 'Occupant', 'Accumulated Penalty', 'Ledger Dues', 'Total Dues', 'Days Overdue'],
      ...list.map((d) => [d.unit, d.owner, d.tenant, d.occupant, d.penalty, d.ledger, d.total, d.days]),
    ]
    const csv = data.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
    const a = document.createElement('a')
    a.href = url
    a.download = 'dues-report.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-350 flex-col gap-4">
      {/* ---------- Header ---------- */}
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
        className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between"
      >
        <motion.div variants={item} className="min-w-0">
          <h1 className="text-xl font-bold sm:text-2xl">Dues Report</h1>
          <p className="text-xs text-slate-400">Track outstanding dues, penalties and recoveries</p>
        </motion.div>

        {/* Report buttons: 2 per row on mobile, one row on larger screens (display only for now) */}
        <motion.div variants={item} className="grid grid-cols-2 gap-2 lg:flex">
          {['Manage Dues', 'MIS Report', 'Collection Report', 'Dues Ageing Report'].map((t) => (
            <button key={t} type="button" className={ghostBtn}>
              {t}
            </button>
          ))}
        </motion.div>
      </motion.div>

      {/* ---------- Summary cards ---------- */}
      {/* Same size as the Funds page cards: 1 column on mobile, 2 on small screens, 4 on extra-large screens */}
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
        className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 xl:grid-cols-4"
      >
        {cards.map(({ l, v, sub, c, i: Icon }) => (
          <motion.div
            key={l}
            variants={item}
            className="relative min-w-0 overflow-hidden rounded-xl border border-[#272D39] bg-[#10131A] p-4"
          >
            <div className="flex items-center gap-2">
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                style={{ background: `${c}26`, color: c }}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span className="truncate text-xs font-semibold">{l}</span>
            </div>
            <p className="mt-3 truncate text-xl font-bold min-[480px]:text-2xl">{v}</p>
            <p className="mt-1 truncate text-[10px] text-slate-400">{sub}</p>
            {/* Coloured line at the bottom of the card */}
            <span className="absolute inset-x-0 bottom-0 h-0.75" style={{ background: c }} />
          </motion.div>
        ))}
      </motion.div>

      {/* ---------- Filters ---------- */}
      <motion.div variants={item} initial="hidden" whileInView="show" viewport={VIEWPORT} className="min-w-0">
        <Card
          title="Filter" sub="Narrow down the dues report"
          action={
            <button type="button" onClick={resetFilters} className="text-[11px] text-[#A29CFF] hover:underline">
              Reset
            </button>
          }
        >
          {/* 1 column on mobile, 2 on small, 3 on large, 6 on extra-large screens */}
          <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
            <Select
              title="Building / Wing"
              value={tower}
              onChange={(v) => setFilter(() => setTower(v))}
              options={[{ v: 'all', l: 'All Buildings' }, ...towers.map((t) => ({ v: t, l: t }))]}
            />
            <div className="min-w-0">
              <label className={label}><Search className="h-3 w-3" /> Flat Number</label>
              <input
                type="text"
                value={unit}
                onChange={(e) => setFilter(() => setUnit(e.target.value))}
                placeholder="Search unit"
                className={field}
              />
            </div>
            <Select
              title="Billing Month"
              value={month}
              onChange={(v) => setFilter(() => setMonth(v))}
              options={[{ v: 'all', l: 'All Months' }, ...monthKeys.map((m) => ({ v: m, l: monthLabel(m) }))]}
            />
            <Select
              title="Outstanding Range"
              value={range}
              onChange={(v) => setFilter(() => setRange(v as RangeKey))}
              options={ranges.map((r) => ({ v: r.v, l: r.l }))}
            />
            <Select
              title="Days Overdue"
              value={days}
              onChange={(v) => setFilter(() => setDays(v as DaysKey))}
              options={dayRanges.map((r) => ({ v: r.v, l: r.l }))}
            />
            <Select
              title="Occupant Type"
              value={occupant}
              onChange={(v) => setFilter(() => setOccupant(v as 'all' | Occupant))}
              options={[
                { v: 'all', l: 'All Occupants' },
                { v: 'Owner', l: 'Owner' },
                { v: 'Tenant', l: 'Tenant' },
                { v: 'Vacant', l: 'Vacant' },
              ]}
            />
          </div>
        </Card>
      </motion.div>

      {/* ---------- Dues table ---------- */}
      <motion.div variants={item} initial="hidden" whileInView="show" viewport={VIEWPORT} className="min-w-0">
        <Card
          title="Dues Report"
          sub={`${filtered.length} ${filtered.length === 1 ? 'result' : 'results'} found`}
        >
          {/* Toolbar: pagination on the left, download on the right (stacks on mobile) */}
          <div className="mb-3 flex flex-col gap-3 min-[480px]:flex-row min-[480px]:items-center min-[480px]:justify-between">
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span>Page {cur} of {pages}</span>
              <button
                type="button"
                onClick={() => setPage(cur - 1)}
                disabled={cur <= 1}
                aria-label="Previous page"
                className={iconBtn}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setPage(cur + 1)}
                disabled={cur >= pages}
                aria-label="Next page"
                className={iconBtn}
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <button type="button" onClick={exportCsv} className={`${gradBtn} w-full min-[480px]:w-auto`}>
              <Download className="h-3.5 w-3.5" /> Download Report{selected.size > 0 ? ` (${selected.size})` : ''}
            </button>
          </div>

          {/* Table scrolls sideways inside the card on small screens */}
          <div className={tableWrap}>
            <table className="w-full min-w-215 text-left text-[11px]">
              <thead className="text-slate-400">
                <tr>
                  <th className={`${th} w-8`}>
                    <input
                      type="checkbox"
                      checked={allOnPage}
                      onChange={toggleAll}
                      aria-label="Select all rows on this page"
                      className="h-3.5 w-3.5 cursor-pointer accent-[#8B85FF]"
                    />
                  </th>
                  <th className={th}>Unit</th>
                  <th className={th}>Owner Name</th>
                  <th className={th}>Tenant Name</th>
                  <th className={th}>Occupant</th>
                  <th className={`${th} text-right`}>Accumulated Penalty</th>
                  <th className={`${th} text-right`}>Ledger Dues</th>
                  <th className={`${th} text-right`}>Total Dues</th>
                  <th className={th}>Days Overdue</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={9} className={`${td} py-8 text-center text-slate-500`}>
                      No dues match your filters.
                    </td>
                  </tr>
                )}

                {rows.map((d, idx) => {
                  const isSel = selected.has(d.id)
                  return (
                    // Rows fade in one after another
                    <motion.tr
                      key={d.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, ease: EASE, delay: idx * 0.04 }}
                      className={`transition-colors hover:bg-white/3 ${isSel ? 'bg-[#8B85FF]/10' : ''}`}
                    >
                      <td className={td}>
                        <input
                          type="checkbox"
                          checked={isSel}
                          onChange={() => toggleOne(d.id)}
                          aria-label={`Select ${d.unit}`}
                          className="h-3.5 w-3.5 cursor-pointer accent-[#8B85FF]"
                        />
                      </td>
                      <td className={`${td} whitespace-nowrap font-medium text-[#A29CFF] underline`}>{d.unit}</td>
                      <td className={`${td} whitespace-nowrap`}>{d.owner || <span className="text-slate-500">—</span>}</td>
                      <td className={`${td} whitespace-nowrap`}>{d.tenant || <span className="text-slate-500">—</span>}</td>
                      <td className={td}><Pill c={occupantColor[d.occupant]}>{d.occupant}</Pill></td>
                      <td className={`${td} whitespace-nowrap text-right text-slate-400`}>{money(d.penalty)}</td>
                      <td className={`${td} whitespace-nowrap text-right text-slate-400`}>{money(d.ledger)}</td>
                      <td className={`${td} whitespace-nowrap text-right font-bold`}>{money(d.total)}</td>
                      <td className={td}>
                        <Pill c={dayColor(d.days)}>{d.days === 0 ? 'On time' : `${d.days} days`}</Pill>
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </motion.div>
    </div>
  )
}