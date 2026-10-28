'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { motion, type Variants } from 'framer-motion'
import {
  Wallet, Receipt, TrendingUp, AlertCircle,
  ArrowUp, ArrowDown, CalendarDays, ChevronDown,
} from 'lucide-react'
import { Card } from '@/Components/ui'

/* ---------- Animation ---------- */

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]
const VIEWPORT = { once: false, amount: 0.15 }

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
}

const item: Variants = {
  hidden: { opacity: 0, y: 30, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.7, ease: EASE } },
}

/* ---------- Colours (hex, so they always render) ---------- */

const RED = '#EF4444'
const GREEN = '#10B981'
const BLUE = '#3B82F6'
const ORANGE = '#F59E0B'
const PURPLE = '#8B5CF6'

/* ---------- Data (replace with API data later) ---------- */

// Logged-in user name (replace with real user data later)
const USER_NAME = 'Rahul'

// Income vs Expenses chart scale (values in Lakh)
const CHART_MAX = 8
const chartTicks = [8, 6, 4, 2, 0]

// Data for each financial year. When the period changes, everything on the page uses this data.
const periodData = {
  'Apr 2025 - Mar 2026': {
    income: '₹ 8,45,000', incomePct: '12%',
    expenses: '₹ 5,32,000', expensesPct: '8%',
    surplus: '₹ 3,13,000', surplusPct: '15%',
    receivables: '₹ 2,48,000', overdue: '12 Flats Overdue',
    totalExpenses: '₹ 5.32L',
    chart: [
      { m: 'Apr', inc: 5.2, exp: 3.4 },
      { m: 'May', inc: 6.1, exp: 4.0 },
      { m: 'Jun', inc: 5.8, exp: 3.9 },
      { m: 'Jul', inc: 6.6, exp: 4.4 },
      { m: 'Aug', inc: 6.0, exp: 4.1 },
      { m: 'Sep', inc: 7.0, exp: 4.6 },
      { m: 'Oct', inc: 6.4, exp: 4.2 },
      { m: 'Nov', inc: 7.2, exp: 4.8 },
      { m: 'Dec', inc: 6.8, exp: 4.5 },
      { m: 'Jan', inc: 7.5, exp: 5.0 },
      { m: 'Feb', inc: 7.1, exp: 4.7 },
      { m: 'Mar', inc: 7.8, exp: 5.3 },
    ],
    breakdown: [
      { l: 'Security', pct: 28, c: BLUE },
      { l: 'Housekeeping', pct: 20, c: PURPLE },
      { l: 'Lift Maintenance', pct: 15, c: GREEN },
      { l: 'Electricity', pct: 12, c: ORANGE },
      { l: 'Others', pct: 25, c: '#F97316' },
    ],
  },
  'Apr 2024 - Mar 2025': {
    income: '₹ 7,62,000', incomePct: '9%',
    expenses: '₹ 4,95,000', expensesPct: '6%',
    surplus: '₹ 2,67,000', surplusPct: '11%',
    receivables: '₹ 1,95,000', overdue: '9 Flats Overdue',
    totalExpenses: '₹ 4.95L',
    chart: [
      { m: 'Apr', inc: 4.6, exp: 3.1 },
      { m: 'May', inc: 5.4, exp: 3.6 },
      { m: 'Jun', inc: 5.1, exp: 3.5 },
      { m: 'Jul', inc: 5.9, exp: 4.0 },
      { m: 'Aug', inc: 5.5, exp: 3.8 },
      { m: 'Sep', inc: 6.3, exp: 4.2 },
      { m: 'Oct', inc: 5.8, exp: 3.9 },
      { m: 'Nov', inc: 6.5, exp: 4.4 },
      { m: 'Dec', inc: 6.1, exp: 4.1 },
      { m: 'Jan', inc: 6.8, exp: 4.6 },
      { m: 'Feb', inc: 6.4, exp: 4.3 },
      { m: 'Mar', inc: 7.0, exp: 4.8 },
    ],
    breakdown: [
      { l: 'Security', pct: 30, c: BLUE },
      { l: 'Housekeeping', pct: 18, c: PURPLE },
      { l: 'Lift Maintenance', pct: 14, c: GREEN },
      { l: 'Electricity', pct: 13, c: ORANGE },
      { l: 'Others', pct: 25, c: '#F97316' },
    ],
  },
  'Apr 2023 - Mar 2024': {
    income: '₹ 6,98,000', incomePct: '7%',
    expenses: '₹ 4,64,000', expensesPct: '5%',
    surplus: '₹ 2,34,000', surplusPct: '9%',
    receivables: '₹ 1,62,000', overdue: '7 Flats Overdue',
    totalExpenses: '₹ 4.64L',
    chart: [
      { m: 'Apr', inc: 4.1, exp: 2.9 },
      { m: 'May', inc: 4.8, exp: 3.3 },
      { m: 'Jun', inc: 4.6, exp: 3.2 },
      { m: 'Jul', inc: 5.3, exp: 3.7 },
      { m: 'Aug', inc: 5.0, exp: 3.5 },
      { m: 'Sep', inc: 5.7, exp: 3.9 },
      { m: 'Oct', inc: 5.3, exp: 3.6 },
      { m: 'Nov', inc: 5.9, exp: 4.0 },
      { m: 'Dec', inc: 5.6, exp: 3.8 },
      { m: 'Jan', inc: 6.2, exp: 4.2 },
      { m: 'Feb', inc: 5.9, exp: 4.0 },
      { m: 'Mar', inc: 6.5, exp: 4.4 },
    ],
    breakdown: [
      { l: 'Security', pct: 32, c: BLUE },
      { l: 'Housekeeping', pct: 17, c: PURPLE },
      { l: 'Lift Maintenance', pct: 13, c: GREEN },
      { l: 'Electricity', pct: 14, c: ORANGE },
      { l: 'Others', pct: 24, c: '#F97316' },
    ],
  },
}

type Period = keyof typeof periodData

// Financial year options for the date range selector
const periods = Object.keys(periodData) as Period[]

// Builds the top summary cards from the selected period's data.
// up = arrow direction, good = green (true) or red (false), note = text after the trend
function buildStats(d: (typeof periodData)[Period]) {
  return [
    { label: 'Total Income', value: d.income, pct: d.incomePct, up: true, good: true, note: 'vs last month', icon: Wallet, c: BLUE },
    { label: 'Total Expenses', value: d.expenses, pct: d.expensesPct, up: true, good: false, note: 'vs last month', icon: Receipt, c: ORANGE },
    { label: 'Net Surplus', value: d.surplus, pct: d.surplusPct, up: true, good: true, note: 'vs last month', icon: TrendingUp, c: GREEN },
    { label: 'Outstanding Receivables', value: d.receivables, pct: '', up: false, good: false, note: d.overdue, icon: AlertCircle, c: RED },
  ]
}

/* ---------- Small helpers ---------- */

// Returns greeting text based on the current hour
function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good Morning'
  if (h < 17) return 'Good Afternoon'
  return 'Good Evening'
}

// Up / down trend chip (green = good, red = bad)
function Trend({ pct, up, good }: { pct: string; up: boolean; good: boolean }) {
  if (!pct) return null
  const Arrow = up ? ArrowUp : ArrowDown
  return (
    <span
      className="inline-flex items-center gap-0.5 font-semibold"
      style={{ color: good ? '#34D399' : '#F87171' }}
    >
      <Arrow className="h-3 w-3" /> {pct}
    </span>
  )
}

// Donut chart drawn with SVG circles (no chart library needed)
function Donut({
  segments, size = 160, stroke = 18, children,
}: {
  segments: { pct: number; c: string }[]
  size?: number
  stroke?: number
  children?: ReactNode
}) {
  const r = 50 - stroke / 2 // viewBox is 100x100
  let offset = 0
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={stroke} />
        {segments.map((s, idx) => {
          const el = (
            <circle
              key={idx}
              cx="50"
              cy="50"
              r={r}
              fill="none"
              stroke={s.c}
              strokeWidth={stroke}
              pathLength={100}
              strokeDasharray={`${s.pct} ${100 - s.pct}`}
              strokeDashoffset={-offset}
              style={{ transition: 'stroke-dasharray 0.6s ease, stroke-dashoffset 0.6s ease' }}
            />
          )
          offset += s.pct
          return el
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">{children}</div>
    </div>
  )
}

/* ---------- Page ---------- */
export default function FinanceDashboardPage() {
  const [period, setPeriod] = useState<Period>(periods[0])

  // Everything below (cards, bars, donut) reads from the selected period
  const data = periodData[period]
  const stats = buildStats(data)
  const incomeExpense = data.chart
  const expenseBreakdown = data.breakdown

  // Start with a fixed text so server and browser render the same HTML,
  // then update it after mount using the real local time (avoids hydration warning)
  const [greeting, setGreeting] = useState('Good Morning')
  useEffect(() => {
    setGreeting(getGreeting())
  }, [])

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-4">
      {/* Greeting (left) + period selector (right) */}
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
        className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
      >
        <motion.div variants={item}>
          <h1 className="text-xl font-bold sm:text-2xl">{greeting}, {USER_NAME} 👋</h1>
          <p className="text-xs text-slate-400">Here&apos;s your society&apos;s financial overview for this month.</p>
        </motion.div>

        <motion.div variants={item} className="relative w-full sm:w-auto">
          <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value as Period)}
            className="w-full cursor-pointer appearance-none rounded-lg border border-[#272D39] bg-[#10131A] py-2 pl-9 pr-9 text-xs font-medium text-slate-200 outline-none focus:border-[#A29CFF]/60 sm:w-56"
          >
            {periods.map((p) => (
              <option key={p} value={p} className="bg-[#10131A]">{p}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        </motion.div>
      </motion.div>

      {/* Stat cards (same card style as Charge Heads) */}
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
        className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 lg:grid-cols-4"
      >
        {stats.map(({ label, value, pct, up, good, note, icon: Icon, c }) => (
          <motion.div
            key={label}
            variants={item}
            className="relative overflow-hidden rounded-xl border border-[#272D39] bg-[#10131A] p-4"
          >
            <div className="flex items-center gap-2">
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                style={{ background: `${c}26`, color: c }}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span className="truncate text-xs font-semibold">{label}</span>
            </div>
            <p className="mt-3 text-2xl font-bold">{value}</p>
            <p className="mt-1 flex items-center gap-1.5 text-[10px] text-slate-400">
              <Trend pct={pct} up={up} good={good} />
              {/* Red note for the overdue card, grey note for the others */}
              <span style={!pct ? { color: '#F87171', fontWeight: 600 } : undefined}>{note}</span>
            </p>
            {/* Coloured accent line at the bottom of the card */}
            <span className="absolute inset-x-0 bottom-0 h-0.75" style={{ background: c }} />
          </motion.div>
        ))}
      </motion.div>

      {/* Income vs Expenses + Expense Breakdown */}
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
        className="grid grid-cols-1 gap-4 xl:grid-cols-5"
      >
        {/* Income vs Expenses (bar chart) */}
        <motion.div variants={item} className="h-full xl:col-span-3 [&>*]:h-full">
          <Card
            title="Income vs Expenses"
            sub="Monthly comparison (in Lakh)"
            action={
              <span className="flex items-center gap-3 text-[10px] text-slate-400">
                <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full" style={{ background: BLUE }} /> Income</span>
                <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full" style={{ background: ORANGE }} /> Expenses</span>
              </span>
            }
          >
            {/* Horizontal scroll on very small screens so 12 months never get squashed */}
            <div className="overflow-x-auto pb-1">
              <div className="flex min-w-[420px] gap-2">
                {/* Y axis labels */}
                <div className="flex h-56 flex-col justify-between text-[10px] text-slate-500">
                  {chartTicks.map((t) => (
                    <span key={t} className="leading-none">{t === 0 ? '0' : `${t}L`}</span>
                  ))}
                </div>

                {/* Plot area */}
                <div className="flex-1">
                  <div className="relative h-56 border-b border-l border-[#272D39]">
                    {/* Horizontal grid lines */}
                    {chartTicks.slice(0, -1).map((t) => (
                      <span
                        key={t}
                        className="absolute inset-x-0 border-t border-dashed border-[#272D39]"
                        style={{ top: `${100 - (t / CHART_MAX) * 100}%` }}
                      />
                    ))}
                    {/* Bars (animate to the new height when the period changes) */}
                    <div className="absolute inset-0 flex items-end justify-around px-1">
                      {incomeExpense.map(({ m, inc, exp }) => (
                        <div key={m} className="flex h-full items-end gap-[3px]">
                          <motion.span
                            initial={{ height: 0 }}
                            whileInView={{ height: `${(inc / CHART_MAX) * 100}%` }}
                            viewport={VIEWPORT}
                            transition={{ duration: 0.8, ease: EASE }}
                            className="w-1.5 rounded-t-sm sm:w-2"
                            style={{ background: BLUE }}
                          />
                          <motion.span
                            initial={{ height: 0 }}
                            whileInView={{ height: `${(exp / CHART_MAX) * 100}%` }}
                            viewport={VIEWPORT}
                            transition={{ duration: 0.8, ease: EASE, delay: 0.1 }}
                            className="w-1.5 rounded-t-sm sm:w-2"
                            style={{ background: ORANGE }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* X axis labels */}
                  <div className="mt-1.5 flex justify-around px-1 text-[10px] text-slate-400">
                    {incomeExpense.map(({ m }) => <span key={m}>{m}</span>)}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Expense Breakdown (donut) */}
        <motion.div variants={item} className="h-full xl:col-span-2 [&>*]:h-full">
          <Card title="Expense Breakdown" sub="Category-wise spending">
            <div className="flex flex-col items-center gap-5 min-[480px]:flex-row xl:flex-col 2xl:flex-row">
              <Donut
                segments={expenseBreakdown.map(({ pct, c }) => ({ pct, c }))}
                size={170}
                stroke={18}
              >
                <span className="text-lg font-bold">{data.totalExpenses}</span>
                <span className="text-[10px] text-slate-400">Total Expenses</span>
              </Donut>

              {/* Legend */}
              <div className="flex w-full min-w-0 flex-1 flex-col gap-3">
                {expenseBreakdown.map(({ l, pct, c }) => (
                  <div key={l} className="flex items-center gap-2 text-xs">
                    <i className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: c }} />
                    <span className="min-w-0 flex-1 truncate text-slate-300">{l}</span>
                    <span className="shrink-0 font-semibold">{pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  )
}