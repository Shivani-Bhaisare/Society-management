'use client'

import { useId, useMemo, useState } from 'react'
import { motion, type Variants } from 'framer-motion'
import {
  Wallet, Hourglass, MessageSquareWarning, CalendarCheck,
  TrendingUp, TrendingDown, FileText, Download,
} from 'lucide-react'
import { Card } from '@/Components/ui'

/* ---------- Animation ---------- */

// Smooth "expo-out" curve: starts fast, settles softly
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]

// Replays every time a section enters the screen (set once: true to play only once)
const VIEWPORT = { once: false, amount: 0.15 }

// Container: children appear one after another
const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
}

// Each child fades in while moving up and scaling slightly
const item: Variants = {
  hidden: { opacity: 0, y: 30, scale: 0.97 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.7, ease: EASE },
  },
}

/* ---------- Data (replace with API later) ---------- */
const ranges = ['Today', '7 Days', '30 Days', 'Custom'] as const
type Range = (typeof ranges)[number]

type Dataset = {
  // order: Maintenance Collection, Pending Dues, Complaints, Facility Bookings
  cards: { value: number; change: string; up: boolean; good: boolean }[]
  /* trendY values are in lakh */
  trendX: string[]
  trendY: number[]
  expenseTotal: number // in lakh
  expenses: { label: string; v: number; c: string }[]
  complaintSplit: { label: string; v: number; c: string }[]
  usage: { label: string; v: number }[]
}

// Card meta (icon, color, label). "money" = show with ₹
const statMeta = [
  { label: 'Maintenance Collection', icon: Wallet, c: '#10B981', money: true },
  { label: 'Pending Dues', icon: Hourglass, c: '#F59E0B', money: true },
  { label: 'Complaints', icon: MessageSquareWarning, c: '#EF4444', money: false },
  { label: 'Facility Bookings', icon: CalendarCheck, c: '#3B82F6', money: false },
]

const EXP_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6']
const makeExpenses = (v: number[]) =>
  ['Maintenance', 'Utilities', 'Staff Salary', 'Other'].map((label, i) => ({
    label,
    v: v[i],
    c: EXP_COLORS[i],
  }))

const makeSplit = (resolved: number, progress: number, open: number) => [
  { label: 'Resolved', v: resolved, c: '#10B981' },
  { label: 'In Progress', v: progress, c: '#F59E0B' },
  { label: 'Open', v: open, c: '#EF4444' },
]

const makeUsage = (v: number[]) =>
  ['Pool', 'Gym', 'Club', 'Hall'].map((label, i) => ({ label, v: v[i] }))

const DATA: Record<Exclude<Range, 'Custom'>, Dataset> = {
  Today: {
    cards: [
      { value: 18500, change: '4%', up: true, good: true },
      { value: 42000, change: '1%', up: true, good: false },
      { value: 3, change: '2%', up: false, good: false },
      { value: 7, change: '6%', up: true, good: true },
    ],
    trendX: ['9AM', '11AM', '1PM', '3PM', '5PM', '7PM', '9PM'],
    trendY: [0.02, 0.04, 0.07, 0.09, 0.12, 0.16, 0.185],
    expenseTotal: 0.2,
    expenses: makeExpenses([35, 30, 20, 15]),
    complaintSplit: makeSplit(2, 1, 0),
    usage: makeUsage([60, 75, 20, 10]),
  },
  '7 Days': {
    cards: [
      { value: 112000, change: '7%', up: true, good: true },
      { value: 98000, change: '2%', up: true, good: false },
      { value: 11, change: '5%', up: false, good: false },
      { value: 29, change: '11%', up: true, good: true },
    ],
    trendX: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    trendY: [0.1, 0.25, 0.4, 0.58, 0.78, 0.95, 1.12],
    expenseTotal: 1.1,
    expenses: makeExpenses([40, 28, 17, 15]),
    complaintSplit: makeSplit(8, 2, 1),
    usage: makeUsage([72, 70, 35, 25]),
  },
  '30 Days': {
    cards: [
      { value: 485000, change: '12%', up: true, good: true },
      { value: 173000, change: '1%', up: true, good: false },
      { value: 24, change: '8%', up: false, good: false },
      { value: 86, change: '19%', up: true, good: true },
    ],
    trendX: ['1', '5', '10', '15', '20', '25', '30'],
    trendY: [1.2, 1.8, 2.2, 2.8, 3.3, 4.2, 4.8],
    expenseTotal: 4.8,
    expenses: makeExpenses([42, 28, 15, 15]),
    complaintSplit: makeSplit(18, 4, 2),
    usage: makeUsage([80, 65, 40, 30]),
  },
}

const reportList = ['Payment Report', 'Expense Report', 'Complaint Report', 'Staff Report', 'Vendor Report']

/* ---------- Helpers ---------- */
const inr = (n: number) => '₹' + n.toLocaleString('en-IN')

const fmtLakh = (l: number) =>
  l < 1 ? inr(Math.round(l * 100000)) : `₹${l.toFixed(1)}L`

const toISO = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

const parseISO = (s: string) => new Date(`${s}T00:00:00`)

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// Builds data for any custom date range (scaled from the 30 days data)
function buildCustom(from: string, to: string): Dataset {
  const base = DATA['30 Days']
  const f = parseISO(from)
  const t = parseISO(to)
  const days = Math.max(1, Math.round((t.getTime() - f.getTime()) / 86400000) + 1)

  if (days === 1) return DATA.Today

  const k = days / 30
  const collection = Math.round(base.cards[0].value * k)
  const pending = Math.round(base.cards[1].value * Math.min(Math.max(k, 0.25), 1.5))
  const complaints = Math.max(1, Math.round(base.cards[2].value * k))
  const bookings = Math.max(1, Math.round(base.cards[3].value * k))

  const resolved = Math.round(complaints * 0.75)
  const progress = Math.round(complaints * 0.17)
  const open = Math.max(0, complaints - resolved - progress)

  const trendX = base.trendX.map((_, i) => {
    const d = new Date(f)
    d.setDate(f.getDate() + Math.round((i * (days - 1)) / (base.trendX.length - 1)))
    return `${d.getDate()} ${MONTHS[d.getMonth()]}`
  })
  const trendY = base.trendY.map((v) => (v / 4.8) * (collection / 100000))

  return {
    cards: [
      { ...base.cards[0], value: collection },
      { ...base.cards[1], value: pending },
      { ...base.cards[2], value: complaints },
      { ...base.cards[3], value: bookings },
    ],
    trendX,
    trendY,
    expenseTotal: base.expenseTotal * k,
    expenses: base.expenses,
    complaintSplit: makeSplit(resolved, progress, open),
    usage: base.usage,
  }
}

// Picks a clean axis step so the chart always looks good
function niceStep(maxY: number) {
  const steps = [0.05, 0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500]
  return steps.find((s) => s * 3 >= maxY * 1.05) ?? 1000
}

/* ---------- Small pieces ---------- */
function Donut({
  segments,
  children,
  track = false,
}: {
  segments: { v: number; c: string }[]
  children: React.ReactNode
  track?: boolean
}) {
  const R = 42
  const C = 2 * Math.PI * R

  const offsets = segments.reduce<number[]>((arr, _s, i) => {
    arr.push(i === 0 ? 0 : arr[i - 1] + (C * segments[i - 1].v) / 100)
    return arr
  }, [])

  return (
    <div className="relative aspect-square w-full max-w-[120px] shrink-0">
      <svg viewBox="0 0 100 100" className="h-full w-full">
        {track && <circle cx="50" cy="50" r={R} fill="none" stroke="#272D39" strokeWidth="12" />}
        {segments.map((s, i) => {
          const len = (C * s.v) / 100
          return (
            <circle
              key={i}
              cx="50"
              cy="50"
              r={R}
              fill="none"
              stroke={s.c}
              strokeWidth="12"
              strokeDasharray={`${len} ${C - len}`}
              strokeDashoffset={-offsets[i]}
              transform="rotate(-90 50 50)"
            />
          )
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {children}
      </div>
    </div>
  )
}

function Legend({
  items,
  suffix = '',
}: {
  items: { label: string; v: number; c: string }[]
  suffix?: string
}) {
  return (
    <ul className="flex w-full flex-col gap-2 text-[11px]">
      {items.map((e) => (
        <li key={e.label} className="flex items-center justify-between gap-2">
          <span className="flex items-center gap-2 text-slate-300">
            <i className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: e.c }} />
            {e.label}
          </span>
          <span className="text-slate-400">
            {e.v}
            {suffix}
          </span>
        </li>
      ))}
    </ul>
  )
}

function TrendChart({ xLabels, yValues }: { xLabels: string[]; yValues: number[] }) {
  const gid = useId().replace(/:/g, '')
  const W = 400, H = 160
  const L = 30, R = 10, T = 8, B = 20

  const step = niceStep(Math.max(...yValues))
  const max = step * 3
  const grid = [0, step, step * 2, step * 3]

  const pts = yValues.map((v, i) => {
    const x = L + (i * (W - L - R)) / (yValues.length - 1)
    const y = T + (1 - v / max) * (H - T - B)
    return [x, y]
  })
  const line = pts.map(([x, y]) => `${x},${y}`).join(' ')
  const area = `${L},${H - B} ${line} ${W - R},${H - B}`

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-label="Maintenance collection trend">
      <defs>
        <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#6C63FF" stopOpacity="0.45" />
          <stop offset="100%" stopColor="#6C63FF" stopOpacity="0" />
        </linearGradient>
      </defs>

      {grid.map((g) => {
        const y = T + (1 - g / max) * (H - T - B)
        return (
          <g key={g}>
            <line x1={L} x2={W - R} y1={y} y2={y} stroke="#272D39" strokeDasharray="3 4" />
            <text x={L - 5} y={y + 3} textAnchor="end" fontSize="9" fill="#94A3B8">{Number(g.toFixed(2))}L</text>
          </g>
        )
      })}

      <polygon points={area} fill={`url(#${gid})`} />
      <polyline points={line} fill="none" stroke="#6C63FF" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="2.5" fill="#10131A" stroke="#6C63FF" strokeWidth="1.5" />
      ))}
      {pts.map(([x], i) => (
        <text key={i} x={x} y={H - 5} textAnchor="middle" fontSize="9" fill="#94A3B8">{xLabels[i]}</text>
      ))}
    </svg>
  )
}

/* ---------- Page ---------- */
export default function ReportsPage() {
  const [range, setRange] = useState<Range>('30 Days')

  // Custom range (default: last 30 days)
  const [from, setFrom] = useState(() => {
    const d = new Date()
    d.setDate(d.getDate() - 29)
    return toISO(d)
  })
  const [to, setTo] = useState(() => toISO(new Date()))

  const onFrom = (v: string) => {
    if (!v) return
    setFrom(v)
    if (v > to) setTo(v)
  }
  const onTo = (v: string) => {
    if (!v) return
    setTo(v)
    if (v < from) setFrom(v)
  }

  // Data for the selected range
  const d = useMemo<Dataset>(
    () => (range === 'Custom' ? buildCustom(from, to) : DATA[range]),
    [range, from, to],
  )

  const resolvedPct = Math.round(
    (d.complaintSplit[0].v / Math.max(1, d.complaintSplit.reduce((a, s) => a + s.v, 0))) * 100,
  )

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-4">
      {/* Header */}
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
        className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
      >
        <motion.div variants={item}>
          <h1 className="text-xl font-bold sm:text-2xl">Reports &amp; Analytics</h1>
          <p className="text-xs text-slate-400">Insights for better decision making</p>
        </motion.div>

        {/* Range tabs: active state uses gradient #6C63FF -> #4DA3FF */}
        <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 sm:mx-0 sm:px-0">
          {ranges.map((r) => (
            <motion.button
              key={r}
              variants={item}
              type="button"
              onClick={() => setRange(r)}
              className={`shrink-0 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
                range === r
                  ? 'border-transparent bg-gradient-to-r from-[#6C63FF] to-[#4DA3FF] text-white'
                  : 'border-[#272D39] bg-[#10131A] text-slate-300 hover:bg-white/5'
              }`}
            >
              {r}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* Custom date range (only visible when "Custom" is selected) */}
      {range === 'Custom' && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: EASE }}
          className="flex flex-wrap items-center gap-3 rounded-xl border border-[#272D39] bg-[#10131A] p-3"
        >
          <label className="flex items-center gap-2 text-xs text-slate-300">
            From
            <input
              type="date"
              value={from}
              max={toISO(new Date())}
              onChange={(e) => onFrom(e.target.value)}
              className="rounded-lg border border-[#272D39] bg-[#0B0E14] px-2 py-1.5 text-xs text-slate-200 outline-none focus:border-[#6C63FF] [color-scheme:dark]"
            />
          </label>
          <label className="flex items-center gap-2 text-xs text-slate-300">
            To
            <input
              type="date"
              value={to}
              min={from}
              max={toISO(new Date())}
              onChange={(e) => onTo(e.target.value)}
              className="rounded-lg border border-[#272D39] bg-[#0B0E14] px-2 py-1.5 text-xs text-slate-200 outline-none focus:border-[#6C63FF] [color-scheme:dark]"
            />
          </label>
        </motion.div>
      )}

      {/* Stat cards (same card size as Dashboard cards) */}
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
        className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 lg:grid-cols-4"
      >
        {statMeta.map(({ label, icon: Icon, c, money }, i) => {
          const { value, change, up, good } = d.cards[i]
          return (
            <motion.div
              key={label}
              variants={item}
              className="relative overflow-hidden rounded-xl border border-[#272D39] bg-[#10131A] p-4"
            >
              <div className="flex items-center gap-2">
                <span
                  className="flex h-8 w-8 items-center justify-center rounded-lg"
                  style={{ background: `${c}26`, color: c }}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <span className="truncate text-xs font-semibold">{label}</span>
              </div>
              <p className="mt-3 text-2xl font-bold">{money ? inr(value) : value}</p>
              <p
                className={`mt-1 flex items-center gap-1 truncate text-[10px] ${
                  good ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                {change} vs last period
              </p>
              <span className="absolute inset-x-0 bottom-0 h-[3px]" style={{ background: c }} />
            </motion.div>
          )
        })}
      </motion.div>

      {/* Charts: 2 per row */}
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
        className="grid grid-cols-1 gap-4 md:grid-cols-2"
      >
        <motion.div variants={item} className="min-w-0 [&>*]:h-full">
          <Card title="Maintenance Collection Trend" sub="Collection over the selected period">
            <TrendChart xLabels={d.trendX} yValues={d.trendY} />
          </Card>
        </motion.div>

        <motion.div variants={item} className="min-w-0 [&>*]:h-full">
          <Card title="Expense Breakdown" sub="Where the money goes">
            <div className="flex flex-col items-center gap-4 sm:flex-row">
              <Donut segments={d.expenses}>
                <span className="text-sm font-bold">{fmtLakh(d.expenseTotal)}</span>
              </Donut>
              <Legend items={d.expenses} suffix="%" />
            </div>
          </Card>
        </motion.div>

        <motion.div variants={item} className="min-w-0 [&>*]:h-full">
          <Card title="Complaint Resolution" sub="Help desk performance">
            <div className="flex flex-col items-center gap-4 sm:flex-row">
              <Donut segments={[{ v: resolvedPct, c: '#10B981' }]} track>
                <span className="text-base font-bold">{resolvedPct}%</span>
                <span className="text-[10px] text-slate-400">Resolved</span>
              </Donut>
              <Legend items={d.complaintSplit} />
            </div>
          </Card>
        </motion.div>

        <motion.div variants={item} className="min-w-0 [&>*]:h-full">
          <Card title="Facility Usage" sub="Most used amenities">
            <div className="flex h-36 items-end justify-between gap-3 border-b border-[#272D39] px-1">
              {d.usage.map((u) => (
                <div key={u.label} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                  <span className="text-[10px] text-slate-400">{u.v}%</span>
                  <div
                    className="w-full max-w-[32px] rounded-t-md bg-gradient-to-t from-[#4F46E5] to-[#6C63FF] transition-all duration-500"
                    style={{ height: `${u.v}%` }}
                  />
                </div>
              ))}
            </div>
            <div className="mt-2 flex justify-between gap-3 px-1 text-[10px] text-slate-400">
              {d.usage.map((u) => (
                <span key={u.label} className="flex-1 text-center">{u.label}</span>
              ))}
            </div>
          </Card>
        </motion.div>
      </motion.div>

      {/* Reports (same card style as dashboard) */}
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
      >
        <motion.div variants={item}>
          <Card title="Reports" sub="Download society reports">
            <div className="grid grid-cols-1 gap-2 min-[480px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
              {reportList.map((r) => (
                <button
                  key={r}
                  type="button"
                  className="flex items-center gap-3 rounded-lg border border-[#272D39] bg-white/[0.03] px-3 py-2 text-left hover:bg-white/5"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#6C63FF]/15 text-[#8B85FF]">
                    <FileText className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-xs font-semibold">{r}</span>
                  <Download className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                </button>
              ))}
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  )
}