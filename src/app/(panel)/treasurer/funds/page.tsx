'use client'

import { useState } from 'react'
import { motion, type Variants } from 'framer-motion'
import {
  Wallet, CalendarDays, TrendingUp, CalendarClock, Pencil, BarChart3, CheckCircle2,
  type LucideIcon,
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

// Chart colours are the same as the Dashboard charts
const TEAL = '#00C2B8' // Dashboard teal (target line, health ring)
const PURPLE = '#8B5CF6' // Dashboard purple (expenses line)

/* ---------- Data (replace with API / Redux data later) ---------- */

type Stat = {
  label: string
  value: string
  sub: string
  subColor: string
  color: string
  icon: LucideIcon
}

// Top summary cards
// Line + icon colours are the same as the Payments page cards: Green, Red, Blue, Orange
const stats: Stat[] = [
  { label: 'Current Balance', value: '₹ 4,87,500', sub: '+5.2%', subColor: TEAL, color: GREEN, icon: Wallet },
  { label: 'Monthly Contribution', value: '₹ 4,500', sub: 'Recommended: ₹ 2,489', subColor: '#94A3B8', color: RED, icon: CalendarDays },
  { label: 'Fully Funded %', value: '78%', sub: '+3% from last year', subColor: TEAL, color: BLUE, icon: TrendingUp },
  { label: 'Next Major Expense', value: '2026', sub: 'Roof - ₹ 1,25,000', subColor: '#94A3B8', color: ORANGE, icon: CalendarClock },
]

// Rows shown under the health ring
const healthRows: { l: string; v: string; c?: string }[] = [
  { l: 'Current Balance', v: '₹ 4,87,500' },
  { l: 'Target Balance', v: '₹ 6,25,000' },
  { l: 'Funding Gap', v: '₹ 1,37,500', c: ORANGE },
  { l: 'Projected 5 Yr Expenses', v: '₹ 3,50,000', c: RED },
  { l: 'Projected 5 Yr Funds', v: '₹ 7,57,500' },
]

// 10 year forecast data
const forecast = [
  { year: '2025', projected: 560000, target: 630000, expenses: 0 },
  { year: '2026', projected: 500000, target: 650000, expenses: 130000 },
  { year: '2027', projected: 480000, target: 670000, expenses: 210000 },
  { year: '2028', projected: 455000, target: 690000, expenses: 305000 },
  { year: '2029', projected: 460000, target: 710000, expenses: 350000 },
  { year: '2030', projected: 540000, target: 730000, expenses: 350000 },
  { year: '2031', projected: 610000, target: 750000, expenses: 350000 },
  { year: '2032', projected: 690000, target: 775000, expenses: 350000 },
  { year: '2033', projected: 760000, target: 800000, expenses: 350000 },
  { year: '2034', projected: 830000, target: 830000, expenses: 350000 },
]

// Chart lines (same colours are used in the legend, lines, dots and tooltip)
// Blue / Teal / Purple = same colours as the Dashboard charts
type SeriesKey = 'projected' | 'target' | 'expenses'
const series: { k: SeriesKey; l: string; c: string }[] = [
  { k: 'projected', l: 'Projected Balance', c: BLUE },
  { k: 'target', l: 'Target Balance', c: TEAL },
  { k: 'expenses', l: 'Cumulative Expenses', c: PURPLE },
]

/* ---------- Chart maths ---------- */

const TOP = 1000000 // top of the Y axis
const TICKS = [1000000, 750000, 500000, 250000, 0] // Y axis labels (top to bottom)
const N = forecast.length

// X position (%) of a point: centred in its own column so labels line up
const xPct = (i: number) => ((i + 0.5) / N) * 100
// Y position (%) of a value (0 = top, 100 = bottom)
const yPct = (v: number) => 100 - (v / TOP) * 100

// Build a smooth SVG path (cubic curves) through all points of one series
function smoothPath(key: SeriesKey) {
  return forecast
    .map((d, i) => {
      const x = xPct(i)
      const y = yPct(d[key])
      if (i === 0) return `M ${x} ${y}`
      const px = xPct(i - 1)
      const py = yPct(forecast[i - 1][key])
      const mid = (px + x) / 2
      return `C ${mid} ${py} ${mid} ${y} ${x} ${y}`
    })
    .join(' ')
}

// Format Y axis labels: 250000 -> ₹250k
const tickLabel = (t: number) => (t === 0 ? '0' : `₹${t / 1000}k`)

// Format a number as Indian rupees
const money = (n: number) => `₹ ${n.toLocaleString('en-IN')}`

/* ---------- Page ---------- */
export default function FundsPage() {
  // Health ring value (0 - 100)
  const healthPct = 100

  // Index of the chart column the mouse is over (null = none)
  const [hover, setHover] = useState<number | null>(null)

  // Pre-built paths
  const projectedPath = smoothPath('projected')
  const targetPath = smoothPath('target')
  const expensesPath = smoothPath('expenses')
  // Area under the target line (soft gradient fill)
  const areaPath = `${targetPath} L ${xPct(N - 1)} 100 L ${xPct(0)} 100 Z`

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-350 flex-col gap-4">
      {/* ---------- Header ---------- */}
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
        className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between"
      >
        <motion.div variants={item} className="min-w-0">
          <h1 className="text-xl font-bold sm:text-2xl">Reserve Fund</h1>
          <p className="text-xs text-slate-400">
            Real-time insights and AI-powered forecasts for your reserve fund health
          </p>
        </motion.div>

        {/* Edit button */}
        <motion.button
          variants={item}
          type="button"
          className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg border border-[#272D39] bg-[#10131A] px-4 py-2.5 text-xs font-semibold text-slate-200 transition hover:bg-white/5 active:scale-95 md:w-auto"
        >
          <Pencil className="h-3.5 w-3.5" /> Edit Data
        </motion.button>
      </motion.div>

      {/* ---------- Stat cards ---------- */}
      {/* 1 column on mobile, 2 on small screens, 4 on extra-large screens */}
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
        className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 xl:grid-cols-4"
      >
        {stats.map(({ label: l, value, sub, subColor, color, icon: Icon }) => (
          <motion.div
            key={l}
            variants={item}
            className="relative min-w-0 overflow-hidden rounded-xl border border-[#272D39] bg-[#10131A] p-4"
          >
            <div className="flex items-center justify-between gap-2">
              <span className="truncate text-[11px] text-slate-400">{l}</span>
              {/* Icon box uses the same tinted background + colour as the Payments cards */}
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                style={{ background: `${color}26`, color }}
              >
                <Icon className="h-4 w-4" />
              </span>
            </div>
            <p className="mt-3 truncate text-xl font-bold min-[480px]:text-2xl">{value}</p>
            <p className="mt-1 truncate text-[10px]" style={{ color: subColor }}>{sub}</p>
            {/* Coloured line at the bottom of the card (same as the Payments cards) */}
            <span className="absolute inset-x-0 bottom-0 h-0.75" style={{ background: color }} />
          </motion.div>
        ))}
      </motion.div>

      {/* ---------- Main grid: health column + forecast column ---------- */}
      {/* 1 column on mobile / tablet, 3 columns (1 + 2) on extra-large screens */}
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
        className="grid grid-cols-1 gap-4 xl:grid-cols-3"
      >
        {/* ---------- Reserve health ---------- */}
        <motion.div variants={item} className="min-w-0">
          <Card title="Reserve Health" sub="Overall funding status">
            <div className="flex flex-col items-center gap-4">
              {/* Animated ring */}
              <div className="relative aspect-square w-full max-w-40">
                <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                  {/* Background ring */}
                  <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="9" />
                  {/* Progress ring: draws itself from 0 to the health value */}
                  <motion.circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    stroke={TEAL}
                    strokeWidth="9"
                    strokeLinecap="round"
                    initial={{ pathLength: 0 }}
                    whileInView={{ pathLength: healthPct / 100 }}
                    viewport={VIEWPORT}
                    transition={{ duration: 1.4, ease: EASE }}
                  />
                </svg>
                {/* Text in the middle of the ring */}
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
                  <CheckCircle2 className="h-5 w-5" style={{ color: TEAL }} />
                  <span className="text-xl font-bold">{healthPct}%</span>
                  <span className="text-[10px]" style={{ color: TEAL }}>Healthy</span>
                </div>
              </div>

              <p className="text-[10px] text-slate-400">Your reserve fund is on track</p>

              {/* Detail rows */}
              <div className="flex w-full flex-col">
                {healthRows.map((r) => (
                  <div
                    key={r.l}
                    className="flex items-center justify-between gap-2 border-t border-[#272D39] py-2.5 text-[11px]"
                  >
                    <span className="min-w-0 truncate text-slate-400">{r.l}</span>
                    <span className="shrink-0 font-semibold" style={r.c ? { color: r.c } : undefined}>
                      {r.v}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </motion.div>

        {/* ---------- 10 year forecast chart ---------- */}
        <motion.div variants={item} className="min-w-0 xl:col-span-2">
          <Card
            title="10-Year Forecast with Expenses"
            sub="Projected balance vs target and cumulative expenses"
            action={
              // Legend (wraps onto several lines on small screens)
              <span className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1 text-[10px] text-slate-400">
                {series.map(({ l, c }) => (
                  <span key={l} className="flex items-center gap-1">
                    <i className="h-0.5 w-3 rounded-full" style={{ background: c }} /> {l}
                  </span>
                ))}
              </span>
            }
          >
            <div className="flex gap-2">
              {/* Y axis labels */}
              <div className="flex h-52 shrink-0 flex-col justify-between text-[10px] text-slate-500 sm:h-72">
                {TICKS.map((t) => (
                  <span key={t} className="leading-none">{tickLabel(t)}</span>
                ))}
              </div>

              {/* Plot (scrolls sideways on very small screens) */}
              <div className="thin-scroll min-w-0 flex-1 overflow-x-auto overflow-y-hidden pb-1">
                <div style={{ minWidth: 340 }}>
                  <div
                    className="relative h-52 border-b border-l border-[#272D39] sm:h-72"
                    onMouseLeave={() => setHover(null)}
                  >
                    {/* Horizontal grid lines */}
                    {TICKS.slice(0, -1).map((t) => (
                      <span
                        key={t}
                        className="absolute inset-x-0 border-t border-dashed border-[#272D39]"
                        style={{ top: `${yPct(t)}%` }}
                      />
                    ))}

                    {/* Lines + area (stretches to fill the plot on every screen size) */}
                    <svg
                      className="absolute inset-0 h-full w-full"
                      viewBox="0 0 100 100"
                      preserveAspectRatio="none"
                    >
                      <defs>
                        {/* Soft gradient under the target line */}
                        <linearGradient id="fundsArea" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={TEAL} stopOpacity="0.35" />
                          <stop offset="100%" stopColor={BLUE} stopOpacity="0.03" />
                        </linearGradient>
                      </defs>

                      {/* Area fades in */}
                      <motion.path
                        d={areaPath}
                        fill="url(#fundsArea)"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1.2, ease: EASE }}
                      />
                      {/* Dashed target line fades in */}
                      <motion.path
                        d={targetPath}
                        fill="none"
                        stroke={TEAL}
                        strokeWidth="2"
                        strokeDasharray="4 4"
                        vectorEffect="non-scaling-stroke"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 1, ease: EASE }}
                      />
                      {/* Projected balance line draws itself */}
                      <motion.path
                        d={projectedPath}
                        fill="none"
                        stroke={BLUE}
                        strokeWidth="2"
                        vectorEffect="non-scaling-stroke"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1.6, ease: EASE }}
                      />
                      {/* Cumulative expenses line draws itself */}
                      <motion.path
                        d={expensesPath}
                        fill="none"
                        stroke={PURPLE}
                        strokeWidth="2"
                        vectorEffect="non-scaling-stroke"
                        initial={{ pathLength: 0 }}
                        animate={{ pathLength: 1 }}
                        transition={{ duration: 1.8, ease: EASE }}
                      />
                    </svg>

                    {/* Dots on the expenses line (HTML, so they stay perfectly round) */}
                    {forecast.map((d, i) => (
                      <motion.span
                        key={d.year}
                        className="absolute h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 bg-[#10131A]"
                        style={{ left: `${xPct(i)}%`, top: `${yPct(d.expenses)}%`, borderColor: PURPLE }}
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.8 + i * 0.1, duration: 0.4, ease: EASE }}
                      />
                    ))}

                    {/* Hover: vertical guide line */}
                    {hover !== null && (
                      <span
                        className="pointer-events-none absolute inset-y-0 w-px bg-white/15"
                        style={{ left: `${xPct(hover)}%` }}
                      />
                    )}

                    {/* Hover: tooltip (flips to the left on the right half of the chart) */}
                    {hover !== null && (
                      <div
                        className="pointer-events-none absolute top-2 z-10 min-w-36 rounded-lg border border-[#272D39] bg-[#10131A] p-2.5 text-[10px] shadow-lg"
                        style={{
                          left: `${xPct(hover)}%`,
                          transform: hover >= N / 2 ? 'translateX(calc(-100% - 8px))' : 'translateX(8px)',
                        }}
                      >
                        <p className="mb-1.5 font-semibold text-slate-200">{forecast[hover].year}</p>
                        {series.map(({ k, l, c }) => (
                          <div key={k} className="flex items-center justify-between gap-3 py-0.5">
                            <span className="flex items-center gap-1.5 text-slate-400">
                              <i className="h-1.5 w-1.5 rounded-full" style={{ background: c }} /> {l}
                            </span>
                            <span className="font-semibold" style={{ color: c }}>
                              {money(forecast[hover][k])}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Invisible hover columns (one per year) */}
                    <div className="absolute inset-0 flex">
                      {forecast.map((d, i) => (
                        <div
                          key={d.year}
                          className="h-full flex-1"
                          onMouseEnter={() => setHover(i)}
                          onTouchStart={() => setHover(i)}
                        />
                      ))}
                    </div>
                  </div>

                  {/* X axis labels */}
                  <div className="mt-1.5 flex">
                    {forecast.map((d) => (
                      <div key={d.year} className="flex min-w-0 flex-1 justify-center">
                        <span className="whitespace-nowrap text-[9px] text-slate-400 sm:text-[10px]">
                          {d.year}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Small footer note under the chart */}
            <p className="mt-3 flex items-center gap-1.5 text-[10px] text-slate-500">
              <BarChart3 className="h-3 w-3" /> Hover over a year to see the exact values
            </p>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  )
}