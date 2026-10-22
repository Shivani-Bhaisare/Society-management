'use client'

import { useId, useState } from 'react'
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

const stats = [
  { label: 'Maintenance Collection', value: '₹4,85,000', change: '12%', up: true, good: true, icon: Wallet, c: '#10B981' },
  { label: 'Pending Dues', value: '₹1,73,000', change: '1%', up: true, good: false, icon: Hourglass, c: '#F59E0B' },
  { label: 'Complaints', value: '24', change: '8%', up: false, good: false, icon: MessageSquareWarning, c: '#EF4444' },
  { label: 'Facility Bookings', value: '86', change: '19%', up: true, good: true, icon: CalendarCheck, c: '#3B82F6' },
]

/* Values are in lakh: x = day of month */
const trendX = ['1', '5', '10', '15', '20', '25', '30']
const trendY = [1.2, 1.8, 2.2, 2.8, 3.3, 4.2, 4.8]

const expenses = [
  { label: 'Maintenance', v: 42, c: '#3B82F6' },
  { label: 'Utilities', v: 28, c: '#10B981' },
  { label: 'Staff Salary', v: 15, c: '#F59E0B' },
  { label: 'Other', v: 15, c: '#8B5CF6' },
]

const complaintSplit = [
  { label: 'Resolved', v: 18, c: '#10B981' },
  { label: 'In Progress', v: 4, c: '#F59E0B' },
  { label: 'Open', v: 2, c: '#EF4444' },
]

const usage = [
  { label: 'Pool', v: 80 },
  { label: 'Gym', v: 65 },
  { label: 'Club', v: 40 },
  { label: 'Hall', v: 30 },
]

const reportList = ['Payment Report', 'Expense Report', 'Complaint Report', 'Staff Report', 'Vendor Report']

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

function TrendChart() {
  const gid = useId().replace(/:/g, '')
  const W = 400, H = 160
  const L = 30, R = 10, T = 8, B = 20
  const max = 6

  const pts = trendY.map((v, i) => {
    const x = L + (i * (W - L - R)) / (trendY.length - 1)
    const y = T + (1 - v / max) * (H - T - B)
    return [x, y]
  })
  const line = pts.map(([x, y]) => `${x},${y}`).join(' ')
  const area = `${L},${H - B} ${line} ${W - R},${H - B}`
  const grid = [0, 2, 4, 6]

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
            <text x={L - 5} y={y + 3} textAnchor="end" fontSize="9" fill="#94A3B8">{g}L</text>
          </g>
        )
      })}

      <polygon points={area} fill={`url(#${gid})`} />
      <polyline points={line} fill="none" stroke="#6C63FF" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {pts.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="2.5" fill="#10131A" stroke="#6C63FF" strokeWidth="1.5" />
      ))}
      {pts.map(([x], i) => (
        <text key={i} x={x} y={H - 5} textAnchor="middle" fontSize="9" fill="#94A3B8">{trendX[i]}</text>
      ))}
    </svg>
  )
}

/* ---------- Page ---------- */
export default function ReportsPage() {
  const [range, setRange] = useState<(typeof ranges)[number]>('30 Days')

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

      {/* Stat cards (same card size as Dashboard cards) */}
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
        className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 lg:grid-cols-4"
      >
        {stats.map(({ label, value, change, up, good, icon: Icon, c }) => (
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
            <p className="mt-3 text-2xl font-bold">{value}</p>
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
        ))}
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
            <TrendChart />
          </Card>
        </motion.div>

        <motion.div variants={item} className="min-w-0 [&>*]:h-full">
          <Card title="Expense Breakdown" sub="Where the money goes">
            <div className="flex flex-col items-center gap-4 sm:flex-row">
              <Donut segments={expenses}>
                <span className="text-sm font-bold">₹4.8L</span>
              </Donut>
              <Legend items={expenses} suffix="%" />
            </div>
          </Card>
        </motion.div>

        <motion.div variants={item} className="min-w-0 [&>*]:h-full">
          <Card title="Complaint Resolution" sub="Help desk performance">
            <div className="flex flex-col items-center gap-4 sm:flex-row">
              <Donut segments={[{ v: 75, c: '#10B981' }]} track>
                <span className="text-base font-bold">75%</span>
                <span className="text-[10px] text-slate-400">Resolved</span>
              </Donut>
              <Legend items={complaintSplit} />
            </div>
          </Card>
        </motion.div>

        <motion.div variants={item} className="min-w-0 [&>*]:h-full">
          <Card title="Facility Usage" sub="Most used amenities">
            <div className="flex h-36 items-end justify-between gap-3 border-b border-[#272D39] px-1">
              {usage.map((u) => (
                <div key={u.label} className="flex h-full flex-1 flex-col items-center justify-end gap-1">
                  <span className="text-[10px] text-slate-400">{u.v}%</span>
                  <div
                    className="w-full max-w-[32px] rounded-t-md bg-gradient-to-t from-[#4F46E5] to-[#6C63FF]"
                    style={{ height: `${u.v}%` }}
                  />
                </div>
              ))}
            </div>
            <div className="mt-2 flex justify-between gap-3 px-1 text-[10px] text-slate-400">
              {usage.map((u) => (
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