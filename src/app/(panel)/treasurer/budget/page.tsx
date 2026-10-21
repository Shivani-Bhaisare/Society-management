'use client'

import { useMemo, useState } from 'react'
import { AnimatePresence, motion, type Variants } from 'framer-motion'
import {
  Wallet, TrendingUp, PiggyBank, Gauge, Plus, ArrowUpRight, ArrowDownRight,
  Sparkles, type LucideIcon,
} from 'lucide-react'
import { Card } from '@/Components/ui'
import AddBudgetModal, { type BudgetPayload } from '@/Components/AddBudgetModal' // CHANGED: adjust the path to your folder

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

// Button gradient colours (same as the gradient buttons), used for the chart bars
const PURPLE = '#6C63FF'
const SKY = '#4DA3FF'

// Solid bar gradient (bottom -> top), same look as the gradient buttons
const BAR_GRAD = `linear-gradient(to top, ${PURPLE}, ${SKY})`

// Light version of the same gradient (used for the planned bars)
const BAR_GRAD_LIGHT = `linear-gradient(to top, ${PURPLE}40, ${SKY}40)`

/* ---------- Data (replace with API data later) ---------- */

type Range = 'q1' | 'q2' | 'q3' | 'q4' | 'year'

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const monthsFull = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]

// Planned budget for every month
const planned = [380000, 380000, 390000, 400000, 400000, 410000, 410000, 420000, 420000, 430000, 430000, 430000]

// Actual spend per month (0 = month has not happened yet)
const actual = [310000, 345000, 298000, 372000, 331000, 396000, 358000, 384000, 341000, 210000, 0, 0]

// Range filter buttons: which months each range shows
const ranges: { k: Range; l: string; from: number; to: number }[] = [
  { k: 'q1', l: 'Q1', from: 0, to: 3 },
  { k: 'q2', l: 'Q2', from: 3, to: 6 },
  { k: 'q3', l: 'Q3', from: 6, to: 9 },
  { k: 'q4', l: 'Q4', from: 9, to: 12 },
  { k: 'year', l: 'Year', from: 0, to: 12 },
]

type Dept = {
  name: string
  budget: number // yearly budget
  spent: number // spent so far
  change: number // % change vs last month (positive = spend went up)
}

const initialDepts: Dept[] = [
  { name: 'Marketing', budget: 1000000, spent: 820000, change: 10.7 },
  { name: 'HR & People', budget: 800000, spent: 430000, change: -1.8 },
  { name: 'Operations', budget: 900000, spent: 540000, change: -4.2 },
  { name: 'IT & Engineering', budget: 1000000, spent: 910000, change: 6.5 },
  { name: 'Sales', budget: 600000, spent: 380000, change: 10.1 },
  { name: 'Legal & Compliance', budget: 600000, spent: 265000, change: -12.5 },
]

// Months that already have actual data (used for the monthly average in the simulator)
const MONTHS_ELAPSED = 10

/* ---------- Shared styles (same as the Income page) ---------- */

// Gradient action button (same style as the Accounting "Add Transaction" button)
const gradBtn =
  'flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-linear-to-r from-[#6C63FF] to-[#4DA3FF] px-4 py-2.5 text-xs font-semibold text-white transition hover:opacity-90 active:scale-95'

// Format a number as Indian rupees
const money = (n: number) => `₹ ${Math.round(n).toLocaleString('en-IN')}`

// Short number for chart axis labels (1.2L, 50K ...)
const short = (n: number) =>
  n >= 100000 ? `${+(n / 100000).toFixed(1)}L` : n >= 1000 ? `${+(n / 1000).toFixed(0)}K` : String(n)

// Sum helper
const sum = (list: number[]) => list.reduce((s, n) => s + n, 0)

// Bar colour depends on how much of the budget is used
const usedColor = (p: number) => (p >= 90 ? RED : p >= 75 ? ORANGE : BLUE)

// Round the chart top to a clean number and build the Y axis ticks
function niceScale(max: number) {
  if (max <= 0) return { top: 4, ticks: [4, 3, 2, 1, 0] }
  const rough = max / 5
  const pow = Math.pow(10, Math.floor(Math.log10(rough)))
  const step = [1, 2, 5, 10].map((m) => m * pow).find((s) => s >= rough) ?? pow * 10
  const n = Math.ceil(max / step)
  const top = +(step * n).toFixed(2)
  const ticks = Array.from({ length: n + 1 }, (_, i) => +(step * (n - i)).toFixed(2))
  return { top, ticks }
}

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

/* ---------- Page ---------- */
export default function BudgetsPage() {
  const [depts] = useState<Dept[]>(initialDepts)

  // CHANGED: controls the Create Budget drawer (open / closed)
  const [addOpen, setAddOpen] = useState(false)

  // Chart state
  const [range, setRange] = useState<Range>('year')
  const [hover, setHover] = useState<number | null>(null)

  // Scenario simulator state (percent values)
  const [mkInc, setMkInc] = useState(10) // marketing spend increase
  const [trDec, setTrDec] = useState(20) // travel spend decrease

  // Summary numbers
  const annual = sum(depts.map((d) => d.budget))
  const spent = sum(depts.map((d) => d.spent))
  const remaining = annual - spent
  const utilization = annual ? Math.round((spent / annual) * 100) : 0

  // Summary cards
  // Line + icon colours are the same as the Payments page cards: Green, Red, Blue, Orange
  const cards: { l: string; v: string; sub: string; c: string; i: LucideIcon }[] = [
    { l: 'Annual Budget', v: money(annual), sub: `${depts.length} departments`, c: GREEN, i: Wallet },
    { l: 'Actual Spending', v: money(spent), sub: 'Spent so far this year', c: RED, i: TrendingUp },
    { l: 'Remaining Budget', v: money(remaining), sub: 'Still available', c: BLUE, i: PiggyBank },
    { l: 'Budget Utilization', v: `${utilization}%`, sub: 'Of the annual budget', c: ORANGE, i: Gauge },
  ]

  // Chart data for the selected range (planned + actual bars)
  const chart = useMemo(() => {
    const r = ranges.find((x) => x.k === range)!
    const data = months.slice(r.from, r.to).map((m, i) => ({
      month: m,
      full: monthsFull[r.from + i],
      planned: planned[r.from + i],
      actual: actual[r.from + i],
    }))
    return { data, scale: niceScale(Math.max(...data.flatMap((d) => [d.planned, d.actual]))) }
  }, [range])

  // Scenario simulator: average monthly spend, adjusted by the two sliders
  const sim = useMemo(() => {
    const marketing = depts.find((d) => d.name === 'Marketing')
    const operations = depts.find((d) => d.name === 'Operations')
    const base = spent / MONTHS_ELAPSED
    const mkMonthly = (marketing?.spent ?? 0) / MONTHS_ELAPSED
    const trMonthly = ((operations?.spent ?? 0) / MONTHS_ELAPSED) * 0.4 // assume 40% of operations is travel
    const projected = base + (mkMonthly * mkInc) / 100 - (trMonthly * trDec) / 100
    return { base, projected, diff: base ? ((projected - base) / base) * 100 : 0 }
  }, [depts, spent, mkInc, trDec])

  // CHANGED: called when the drawer form is saved (as a draft or as a submitted budget)
  const handleSaveBudget = (data: BudgetPayload) => {
    // TODO: call the API here, then refresh the budgets list / summary cards
    console.log('Budget saved:', data)
  }

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
          <h1 className="text-xl font-bold sm:text-2xl">Budgets</h1>
          <p className="text-xs text-slate-400">Department budgets and spending limits</p>
        </motion.div>

        {/* CHANGED: Create Budget button now opens the drawer */}
        <motion.div variants={item} className="flex flex-col gap-2 min-[480px]:flex-row">
          <button type="button" onClick={() => setAddOpen(true)} className={gradBtn}>
            <Plus className="h-3.5 w-3.5" /> Create Budget
          </button>
        </motion.div>
      </motion.div>

      {/* ---------- Summary cards ---------- */}
      {/* 1 column on mobile, 2 on small screens, 4 on extra-large screens */}
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
              {/* Icon box uses the same tinted background + colour as the Payments cards */}
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
            {/* Coloured line at the bottom of the card (same as the Payments cards) */}
            <span className="absolute inset-x-0 bottom-0 h-0.75" style={{ background: c }} />
          </motion.div>
        ))}
      </motion.div>

      {/* ---------- Chart + scenario simulator ---------- */}
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
        className="grid grid-cols-1 gap-4 xl:grid-cols-3"
      >
        {/* Monthly spend overview (planned vs actual) */}
        <motion.div variants={item} className="min-w-0 xl:col-span-2">
          <Card
            title="Monthly Spend Overview" sub="Planned vs actual spend"
            action={
              // Range toggle (Q1 / Q2 / Q3 / Q4 / Year)
              <div className="flex rounded-lg border border-[#272D39] bg-[#10131A] p-0.5">
                {ranges.map((r) => (
                  <button
                    key={r.k}
                    type="button"
                    onClick={() => {
                      setRange(r.k)
                      setHover(null)
                    }}
                    className={`rounded-md px-2 py-1 text-[10px] font-semibold transition-colors ${
                      range === r.k ? 'bg-[#8B85FF]/20 text-[#A29CFF]' : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {r.l}
                  </button>
                ))}
              </div>
            }
          >
            <div className="flex gap-2">
              {/* Y axis labels */}
              <div className="flex h-44 shrink-0 flex-col justify-between text-[10px] text-slate-500 sm:h-56">
                {chart.scale.ticks.map((t) => (
                  <span key={t} className="leading-none">{short(t)}</span>
                ))}
              </div>

              {/* Plot (scrolls sideways on small screens) */}
              <div className="thin-scroll min-w-0 flex-1 overflow-x-auto overflow-y-hidden pb-1">
                <div style={{ minWidth: chart.data.length * 34 }}>
                  <div className="relative h-44 border-b border-l border-[#272D39] sm:h-56">
                    {/* Horizontal grid lines */}
                    {chart.scale.ticks.slice(0, -1).map((t) => (
                      <span
                        key={t}
                        className="absolute inset-x-0 border-t border-dashed border-[#272D39]"
                        style={{ top: `${100 - (t / chart.scale.top) * 100}%` }}
                      />
                    ))}

                    {/* Bars: one planned (light gradient) and one actual (solid gradient) per month */}
                    <div className="absolute inset-0 flex items-end">
                      {chart.data.map((d, i) => {
                        const isHover = hover === i
                        const leftSide = i < chart.data.length / 2
                        return (
                          <div
                            key={d.month}
                            onMouseEnter={() => setHover(i)}
                            onMouseLeave={() => setHover(null)}
                            onClick={() => setHover(isHover ? null : i)}
                            className={`relative flex h-full min-w-0 flex-1 cursor-pointer items-end justify-center gap-0.5 px-0.5 transition-colors ${
                              isHover ? 'bg-white/4' : ''
                            }`}
                          >
                            {/* Planned bar (light version of the button gradient) */}
                            <motion.div
                              key={`p-${range}`}
                              initial={{ height: 0 }}
                              animate={{ height: `${(d.planned / chart.scale.top) * 100}%` }}
                              transition={{ duration: 0.8, ease: EASE, delay: i * 0.03 }}
                              className="w-full max-w-3 rounded-t-sm"
                              style={{ background: BAR_GRAD_LIGHT }}
                            />
                            {/* Actual bar (button gradient, red when over plan) */}
                            <motion.div
                              key={`a-${range}`}
                              initial={{ height: 0 }}
                              animate={{ height: `${(d.actual / chart.scale.top) * 100}%` }}
                              transition={{ duration: 0.8, ease: EASE, delay: i * 0.03 + 0.08 }}
                              className="w-full max-w-3 rounded-t-sm"
                              style={{ background: d.actual > d.planned ? RED : BAR_GRAD }}
                            />

                            {/* Tooltip */}
                            <AnimatePresence>
                              {isHover && (
                                <motion.div
                                  initial={{ opacity: 0, y: 6 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  exit={{ opacity: 0, y: 6 }}
                                  transition={{ duration: 0.2 }}
                                  className={`pointer-events-none absolute top-1 z-10 w-36 rounded-lg border border-[#272D39] bg-[#0B0E14] p-2 text-[10px] shadow-lg ${
                                    leftSide ? 'left-0' : 'right-0'
                                  }`}
                                >
                                  <p className="font-semibold text-slate-200">{d.full}</p>
                                  <p className="mt-1 flex justify-between text-slate-400">
                                    <span>Actual</span><span className="font-semibold text-slate-200">{money(d.actual)}</span>
                                  </p>
                                  <p className="flex justify-between text-slate-400">
                                    <span>Planned</span><span className="font-semibold text-slate-200">{money(d.planned)}</span>
                                  </p>
                                  <p className="flex justify-between text-slate-400">
                                    <span>Variance</span>
                                    <span className="font-semibold" style={{ color: d.actual > d.planned ? RED : GREEN }}>
                                      {d.actual === 0 ? '—' : money(Math.abs(d.planned - d.actual))}
                                    </span>
                                  </p>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        )
                      })}
                    </div>
                  </div>

                  {/* X axis labels */}
                  <div className="mt-1.5 flex">
                    {chart.data.map((d) => (
                      <span key={d.month} className="min-w-0 flex-1 text-center text-[9px] text-slate-400">
                        {d.month}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Legend (uses the same gradient colours as the bars) */}
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-400">
              <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full" style={{ background: BAR_GRAD_LIGHT }} /> Planned</span>
              <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full" style={{ background: BAR_GRAD }} /> Actual</span>
              <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full" style={{ background: RED }} /> Over plan</span>
            </div>
          </Card>
        </motion.div>

        {/* Scenario simulator */}
        <motion.div
          variants={item}
          className="relative min-w-0 overflow-hidden rounded-xl border border-[#272D39] bg-linear-to-br from-[#0E7490] to-[#0891B2] p-4"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <h3 className="truncate text-sm font-bold text-white">Scenario Simulator</h3>
              <p className="truncate text-[10px] text-white/70">Total monthly spend</p>
            </div>
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/15 text-white">
              <Sparkles className="h-4 w-4" />
            </span>
          </div>

          {/* Marketing slider */}
          <div className="mt-5">
            <div className="flex items-center justify-between text-[11px] text-white/85">
              <span>Marketing spend increase</span>
              <span className="font-bold text-white">+{mkInc}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={50}
              value={mkInc}
              onChange={(e) => setMkInc(+e.target.value)}
              aria-label="Marketing spend increase"
              className="mt-2 h-1.5 w-full cursor-pointer accent-white"
            />
          </div>

          {/* Travel slider */}
          <div className="mt-4">
            <div className="flex items-center justify-between text-[11px] text-white/85">
              <span>Travel spend decrease</span>
              <span className="font-bold text-white">-{trDec}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={50}
              value={trDec}
              onChange={(e) => setTrDec(+e.target.value)}
              aria-label="Travel spend decrease"
              className="mt-2 h-1.5 w-full cursor-pointer accent-white"
            />
          </div>

          {/* Projected next month */}
          <div className="mt-5 rounded-lg bg-black/20 p-3">
            <p className="text-[10px] text-white/70">Projected next month</p>
            <div className="mt-1 flex flex-wrap items-baseline justify-between gap-x-2">
              <motion.span
                key={Math.round(sim.projected)}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, ease: EASE }}
                className="truncate text-lg font-bold text-white"
              >
                {money(sim.projected)}
              </motion.span>
              <span className="text-[10px] font-semibold" style={{ color: sim.diff > 0 ? '#FCA5A5' : '#86EFAC' }}>
                {sim.diff > 0 ? '+' : ''}{sim.diff.toFixed(1)}% vs forecast
              </span>
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* ---------- Department budget cards ---------- */}
      {/* 1 column on mobile, 2 on tablet, 3 on large screens */}
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
        className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
      >
        {depts.map((d) => {
          const pct = Math.min(100, Math.round((d.spent / d.budget) * 100))
          const c = usedColor(pct)
          const up = d.change > 0
          return (
            <motion.div
              key={d.name}
              variants={item}
              className="min-w-0 rounded-xl border border-[#272D39] bg-[#10131A] p-4"
            >
              {/* Name + percent used */}
              <div className="flex items-center justify-between gap-2">
                <span className="min-w-0 truncate text-[11px] font-semibold uppercase tracking-wide text-slate-300">
                  {d.name}
                </span>
                <Pill c={c}>{pct}% used</Pill>
              </div>

              {/* Spent amount + change vs last month */}
              <p className="mt-3 truncate text-xl font-bold min-[480px]:text-2xl">{money(d.spent)}</p>
              <p
                className="mt-1 flex items-center gap-1 text-[10px] font-semibold"
                style={{ color: up ? RED : GREEN }}
              >
                {up ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                {up ? '+' : ''}{d.change}%
                <span className="font-normal text-slate-400">vs last month</span>
              </p>

              {/* Used / budget text */}
              <div className="mt-4 flex items-center justify-between gap-2 text-[10px] text-slate-400">
                <span className="truncate">{short(d.spent)} used</span>
                <span className="truncate">{short(d.budget)}</span>
              </div>

              {/* Animated progress bar */}
              <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/6">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${pct}%` }}
                  viewport={VIEWPORT}
                  transition={{ duration: 0.9, ease: EASE }}
                  className="h-full rounded-full"
                  style={{ background: c }}
                />
              </div>
            </motion.div>
          )
        })}
      </motion.div>

      {/* CHANGED: Create Budget drawer (opens from the "Create Budget" button) */}
      <AddBudgetModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSave={handleSaveBudget}
      />
    </div>
  )
}