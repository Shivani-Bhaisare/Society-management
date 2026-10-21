'use client'

import Link from 'next/link'
import { motion, type Variants } from 'framer-motion'
import {
  Wallet, Receipt, Users, Landmark, Plus, Minus, IndianRupee, FileText, BarChart3,
  ArrowUp, ArrowDown, Zap, ShieldCheck, Car,
  Building2, Wrench, AlertTriangle,
} from 'lucide-react'
import { Card, LinkBtn } from '@/Components/ui'

/* ---------- Animation (same as Secretary dashboard) ---------- */

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

/* ---------- Data (replace with API data later) ---------- */

// Top summary cards. up = arrow direction, good = green (true) or red (false)
const stats = [
  { label: 'Total Collection', value: '₹ 12,45,000', pct: '8%', up: true, good: true, icon: Wallet, c: '#00C2B8' },
  { label: 'Total Expenses', value: '₹ 8,32,000', pct: '5%', up: false, good: true, icon: Receipt, c: RED },
  { label: 'Outstanding Dues', value: '₹ 3,18,000', pct: '12%', up: true, good: false, icon: Users, c: ORANGE },
  { label: 'Bank Balance', value: '₹ 28,75,320', pct: '6%', up: true, good: true, icon: Landmark, c: BLUE },
]

// Income vs Expenses (values in Lakh)
const IE_MAX = 20
const ieTicks = [20, 15, 10, 5, 0]
const incomeExpense = [
  { m: 'Jan', inc: 10, exp: 8 },
  { m: 'Feb', inc: 13.5, exp: 10.8 },
  { m: 'Mar', inc: 15, exp: 12 },
  { m: 'Apr', inc: 16, exp: 13.8 },
]

// Income breakdown (pct values add up to 100)
const breakdown = [
  { l: 'Maintenance', pct: 52, amt: '₹ 6,45,000', c: '#3B82F6' },
  { l: 'Parking Charges', pct: 12, amt: '₹ 1,45,000', c: '#00C2B8' },
  { l: 'Clubhouse Charges', pct: 10, amt: '₹ 1,20,000', c: '#F59E0B' },
  { l: 'Water Charges', pct: 8, amt: '₹ 1,00,000', c: '#8B5CF6' },
  { l: 'Electricity Charges', pct: 7, amt: '₹ 85,000', c: '#EC4899' },
  { l: 'Other Income', pct: 11, amt: '₹ 1,35,000', c: '#F97316' },
]

// Quick action tiles
const quick = [
  { l: 'Add Income', i: Plus, c: '#00C2B8', href: '/treasurer/income' },
  { l: 'Add Expense', i: Minus, c: RED, href: '/treasurer/expenses' },
  { l: 'Vendor Payment', i: IndianRupee, c: BLUE, href: '/treasurer/vendors' },
  { l: 'Create Bill', i: FileText, c: '#8B5CF6', href: '/treasurer/bills' },
  { l: 'Reconcile Bank', i: Landmark, c: '#00C2B8', href: '/treasurer/bank' },
  { l: 'Generate Report', i: BarChart3, c: ORANGE, href: '/treasurer/reports' },
]

// Recent transactions
const transactions = [
  { d: '28 Apr 2025', t: 'Maintenance Charges (A-101)', type: 'Income', amt: '₹ 5,000', s: 'Received', i: Building2, c: BLUE },
  { d: '27 Apr 2025', t: 'Electricity Bill (Tower B)', type: 'Expense', amt: '₹ 45,000', s: 'Paid', i: Zap, c: RED },
  { d: '26 Apr 2025', t: 'Security Services', type: 'Expense', amt: '₹ 80,000', s: 'Paid', i: ShieldCheck, c: BLUE },
  { d: '25 Apr 2025', t: 'Parking Charges (B-201)', type: 'Income', amt: '₹ 3,000', s: 'Received', i: Car, c: '#00C2B8' },
  { d: '24 Apr 2025', t: 'Vendor Payment (Housekeeping)', type: 'Expense', amt: '₹ 25,000', s: 'Paid', i: Users, c: '#8B5CF6' },
  { d: '22 Apr 2025', t: 'Clubhouse Charges', type: 'Income', amt: '₹ 15,000', s: 'Received', i: Building2, c: ORANGE },
] as const

// Upcoming payments
const upcoming = [
  { v: 'Security Services', d: '05 May 2025', a: '₹ 3,20,000', s: 'Pending', c: ORANGE },
  { v: 'Lift AMC', d: '10 May 2025', a: '₹ 1,45,000', s: 'Pending', c: ORANGE },
  { v: 'Electricity Bill', d: '15 May 2025', a: '₹ 95,000', s: 'Upcoming', c: BLUE },
] as const

// Top expenses
const topExpenses = [
  { l: 'Security Services', a: '₹ 3,20,000', pct: 38, i: ShieldCheck, c: '#3B82F6' },
  { l: 'Electricity', a: '₹ 2,10,000', pct: 25, i: Zap, c: '#00C2B8' },
  { l: 'Housekeeping', a: '₹ 1,45,000', pct: 17, i: Users, c: '#F59E0B' },
  { l: 'Lift AMC', a: '₹ 1,20,000', pct: 14, i: Building2, c: '#8B5CF6' },
  { l: 'Repairs & Maintenance', a: '₹ 95,000', pct: 6, i: Wrench, c: '#EC4899' },
]

// Financial summary
const summary = [
  { l: 'Total Income', v: '₹ 12,45,000', pct: '8%', up: true, good: true },
  { l: 'Total Expenses', v: '₹ 8,32,000', pct: '5%', up: false, good: true },
  { l: 'Net Surplus', v: '₹ 4,13,000', pct: '12%', up: true, good: true },
  { l: 'Outstanding Dues', v: '₹ 3,18,000', pct: '12%', up: true, good: false },
]

// Budget
const BUDGET_USED = 68

// Shared table header / cell styles
const th = 'bg-white/[0.04] px-2 py-2 font-medium first:rounded-l-md last:rounded-r-md'
const td = 'border-t border-[#272D39] px-2 py-2.5'

const cellClass = 'h-full [&>*]:h-full'

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

// Up / down trend chip (green = good, red = bad)
function Trend({ pct, up, good }: { pct: string; up: boolean; good: boolean }) {
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
  segments, size = 140, stroke = 18, children,
}: {
  segments: { pct: number; c: string }[]
  size?: number
  stroke?: number
  children?: React.ReactNode
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
export default function TreasurerDashboardPage() {
  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-4">
      {/* Greeting */}
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
        className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
      >
        <motion.div variants={item}>
          <h1 className="text-xl font-bold sm:text-2xl">Good Morning, Rahul👋</h1>
          <p className="text-xs text-slate-400">Here&apos;s your society&apos;s financial overview for this month.</p>
        </motion.div>
      </motion.div>

      {/* Stat cards */}
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
        className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 xl:grid-cols-4"
      >
        {stats.map(({ label, value, pct, up, good, icon: Icon, c }) => (
          <motion.div
            key={label}
            variants={item}
            className="relative overflow-hidden rounded-xl border border-[#272D39] bg-[#10131A] p-4"
          >
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: `${c}26`, color: c }}>
                <Icon className="h-4 w-4" />
              </span>
              <span className="truncate text-xs font-semibold">{label}</span>
            </div>
            <p className="mt-3 text-2xl font-bold">{value}</p>
            <p className="mt-1 flex items-center gap-1.5 text-[10px] text-slate-400">
              <Trend pct={pct} up={up} good={good} /> vs last month
            </p>
            <span className="absolute inset-x-0 bottom-0 h-[3px]" style={{ background: c }} />
          </motion.div>
        ))}
      </motion.div>

      {/* Income vs Expenses + Income Breakdown + Quick Actions */}
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
        className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3"
      >
        {/* Income vs Expenses (bar chart) */}
        <motion.div variants={item} className={cellClass}>
          <Card
            title="Income vs Expenses" sub="Last 4 months (in Lakh)"
            action={
              <span className="flex items-center gap-3 text-[10px] text-slate-400">
                <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-[#3B82F6]" /> Income</span>
                <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-[#8B5CF6]" /> Expenses</span>
              </span>
            }
          >
            <div className="flex gap-2">
              {/* Y axis labels */}
              <div className="flex h-44 flex-col justify-between text-[10px] text-slate-500">
                {ieTicks.map((t) => (
                  <span key={t} className="leading-none">{t === 0 ? '0' : `${t}L`}</span>
                ))}
              </div>
              {/* Plot */}
              <div className="flex-1">
                <div className="relative h-44 border-b border-l border-[#272D39]">
                  {/* Horizontal grid lines */}
                  {ieTicks.slice(0, -1).map((t) => (
                    <span
                      key={t}
                      className="absolute inset-x-0 border-t border-dashed border-[#272D39]"
                      style={{ top: `${100 - (t / IE_MAX) * 100}%` }}
                    />
                  ))}
                  {/* Bars */}
                  <div className="absolute inset-0 flex items-end justify-around px-2">
                    {incomeExpense.map(({ m, inc, exp }) => (
                      <div key={m} className="flex h-full items-end gap-1.5">
                        <motion.span
                          initial={{ height: 0 }}
                          whileInView={{ height: `${(inc / IE_MAX) * 100}%` }}
                          viewport={VIEWPORT}
                          transition={{ duration: 0.8, ease: EASE }}
                          className="w-4 rounded-t-sm bg-[#3B82F6] sm:w-5"
                        />
                        <motion.span
                          initial={{ height: 0 }}
                          whileInView={{ height: `${(exp / IE_MAX) * 100}%` }}
                          viewport={VIEWPORT}
                          transition={{ duration: 0.8, ease: EASE, delay: 0.1 }}
                          className="w-4 rounded-t-sm bg-[#8B5CF6] sm:w-5"
                        />
                      </div>
                    ))}
                  </div>
                </div>
                {/* X axis labels */}
                <div className="mt-1.5 flex justify-around px-2 text-[10px] text-slate-400">
                  {incomeExpense.map(({ m }) => <span key={m}>{m}</span>)}
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Income Breakdown (donut) */}
        <motion.div variants={item} className={cellClass}>
          <Card title="Income Breakdown" sub="Source-wise collection">
            <div className="flex flex-col items-center gap-4 min-[480px]:flex-row">
              <Donut segments={breakdown.map(({ pct, c }) => ({ pct, c }))} size={150} stroke={18}>
                <span className="text-sm font-bold">₹ 12,45,000</span>
                <span className="text-[10px] text-slate-400">Total Income</span>
              </Donut>
              <div className="flex w-full min-w-0 flex-1 flex-col gap-2.5">
                {breakdown.map(({ l, pct, amt, c }) => (
                  <div key={l} className="flex items-center gap-2 text-[11px]">
                    <i className="h-2 w-2 shrink-0 rounded-full" style={{ background: c }} />
                    <span className="min-w-0 flex-1 truncate">{l}</span>
                    <span className="w-8 shrink-0 text-right text-slate-400">{pct}%</span>
                    <span className="w-[76px] shrink-0 text-right font-semibold">{amt}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div variants={item} className={`${cellClass} md:col-span-2 2xl:col-span-1`}>
          <Card title="Quick Actions" sub="Frequent treasurer operations">
            <div className="grid grid-cols-3 gap-2">
              {quick.map(({ l, i: Icon, c, href }) => (
                <Link
                  key={l}
                  href={href}
                  className="flex flex-col items-center gap-1.5 rounded-lg border border-[#272D39] bg-white/[0.03] p-3 text-center transition-colors hover:bg-white/5"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg" style={{ background: `${c}26`, color: c }}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="text-[10px] leading-tight text-slate-300">{l}</span>
                </Link>
              ))}
            </div>
          </Card>
        </motion.div>
      </motion.div>

      {/* Recent Transactions + Budget + Upcoming Payments */}
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
        className="grid grid-cols-1 gap-4 xl:grid-cols-2 2xl:grid-cols-3"
      >
        <motion.div variants={item} className={`${cellClass} xl:col-span-2 2xl:col-span-1`}>
          <Card
            title="Recent Transactions" sub="Latest 6 entries"
            action={<Link href="/treasurer/transactions" className="text-[11px] text-[#A29CFF] hover:underline">View All</Link>}
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-[11px]">
                <thead className="text-slate-400">
                  <tr>
                    <th className={th}>Date</th>
                    <th className={th}>Particulars</th>
                    <th className={th}>Type</th>
                    <th className={th}>Amount</th>
                    <th className={th}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map(({ d, t, type, amt, s, i: Icon, c }) => (
                    <tr key={d + t}>
                      <td className={`${td} whitespace-nowrap text-slate-400`}>{d}</td>
                      <td className={td}>
                        <span className="flex items-center gap-2 font-medium">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md" style={{ background: `${c}26`, color: c }}>
                            <Icon className="h-3 w-3" />
                          </span>
                          <span className="truncate">{t}</span>
                        </span>
                      </td>
                      <td className={td}>
                        <Pill c={type === 'Income' ? GREEN : RED}>{type}</Pill>
                      </td>
                      <td className={`${td} whitespace-nowrap font-medium`}>{amt}</td>
                      <td className={td}>
                        <Pill c={s === 'Received' ? GREEN : BLUE}>{s}</Pill>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </motion.div>

        {/* Budget Utilization */}
        <motion.div variants={item} className={cellClass}>
          <Card
            title="Budget Utilization" sub="Annual budget FY 2025-26"
            action={<Link href="/treasurer/budget" className="text-[11px] text-[#A29CFF] hover:underline">View Details</Link>}
          >
            <div className="flex flex-col items-center gap-4 min-[480px]:flex-row">
              <Donut
                segments={[{ pct: BUDGET_USED, c: '#3B82F6' }, { pct: 100 - BUDGET_USED, c: '#00C2B8' }]}
                size={120}
                stroke={14}
              >
                <span className="text-xl font-bold">{BUDGET_USED}%</span>
                <span className="text-[10px] text-slate-400">Used</span>
              </Donut>
              <div className="flex w-full min-w-0 flex-1 flex-col gap-2">
                <div className="rounded-lg border border-[#272D39] bg-white/[0.03] px-3 py-2">
                  <p className="text-[10px] text-slate-400">Total Budget</p>
                  <p className="text-sm font-bold">₹ 18,00,000</p>
                </div>
                <div className="rounded-lg border border-[#272D39] bg-white/[0.03] px-3 py-2">
                  <p className="text-[10px] text-slate-400">Used Amount</p>
                  <p className="text-sm font-bold text-[#8B85FF]">₹ 12,24,000</p>
                </div>
                <div className="rounded-lg border border-[#272D39] bg-white/[0.03] px-3 py-2">
                  <p className="text-[10px] text-slate-400">Remaining</p>
                  <p className="text-sm font-bold" style={{ color: '#34D399' }}>₹ 5,76,000</p>
                </div>
              </div>
            </div>
            {/* Progress bar */}
            <div className="mt-4">
              <div className="h-2 w-full overflow-hidden rounded-full bg-white/[0.06]">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${BUDGET_USED}%` }}
                  viewport={VIEWPORT}
                  transition={{ duration: 0.9, ease: EASE }}
                  className="h-full rounded-full bg-[#3B82F6]"
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                <span className="flex items-center gap-1"><i className="h-1.5 w-1.5 rounded-full bg-[#3B82F6]" /> Used {BUDGET_USED}%</span>
                <span className="flex items-center gap-1"><i className="h-1.5 w-1.5 rounded-full bg-slate-500" /> Remaining {100 - BUDGET_USED}%</span>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Upcoming Payments */}
        <motion.div variants={item} className={cellClass}>
          <Card
            title="Upcoming Payments" sub="Vendor dues this month"
            action={<Link href="/treasurer/vendors" className="text-[11px] text-[#A29CFF] hover:underline">View All</Link>}
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[400px] text-left text-[11px]">
                <thead className="text-slate-400">
                  <tr>
                    <th className={th}>Vendor</th>
                    <th className={th}>Due Date</th>
                    <th className={th}>Amount</th>
                    <th className={th}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {upcoming.map(({ v, d, a, s, c }) => (
                    <tr key={v}>
                      <td className={`${td} font-medium`}>{v}</td>
                      <td className={`${td} whitespace-nowrap text-slate-400`}>{d}</td>
                      <td className={`${td} whitespace-nowrap`}>{a}</td>
                      <td className={td}><Pill c={c}>{s}</Pill></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </motion.div>
      </motion.div>

      {/* Top Expenses + Financial Summary */}
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
        className="grid grid-cols-1 gap-4 xl:grid-cols-2"
      >
        <motion.div variants={item} className={cellClass}>
          <Card
            title="Top Expenses" sub="Highest spending categories"
            action={<Link href="/treasurer/expenses" className="text-[11px] text-[#A29CFF] hover:underline">View All</Link>}
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[460px] text-left text-[11px]">
                <thead className="text-slate-400">
                  <tr>
                    <th className={th}>Particulars</th>
                    <th className={th}>Amount</th>
                    <th className={th}>% of Total</th>
                    <th className={`${th} w-[40%]`}><span className="sr-only">Share</span></th>
                  </tr>
                </thead>
                <tbody>
                  {topExpenses.map(({ l, a, pct, i: Icon, c }) => (
                    <tr key={l}>
                      <td className={td}>
                        <span className="flex items-center gap-2 font-medium">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md" style={{ background: `${c}26`, color: c }}>
                            <Icon className="h-3 w-3" />
                          </span>
                          {l}
                        </span>
                      </td>
                      <td className={`${td} whitespace-nowrap`}>{a}</td>
                      <td className={`${td} text-slate-400`}>{pct}%</td>
                      <td className={td}>
                        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
                          <motion.div
                            initial={{ width: 0 }}
                            whileInView={{ width: `${pct}%` }}
                            viewport={VIEWPORT}
                            transition={{ duration: 0.9, ease: EASE }}
                            className="h-full rounded-full"
                            style={{ background: c }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={item} className={cellClass}>
          <Card
            title="Financial Summary" sub="Current month overview"
            action={<Pill c={BLUE}>View Only</Pill>}
          >
            <div className="grid grid-cols-1 gap-2 min-[480px]:grid-cols-2 2xl:grid-cols-4">
              {summary.map(({ l, v, pct, up, good }) => (
                <div key={l} className="rounded-lg border border-[#272D39] bg-white/[0.03] px-3 py-3">
                  <p className="text-[10px] text-slate-400">{l}</p>
                  <p className="mt-1 text-sm font-bold">{v}</p>
                  <p className="mt-1 text-[10px]"><Trend pct={pct} up={up} good={good} /></p>
                </div>
              ))}
            </div>
            {/* Overdue accounts alert row (inline red so it always shows) */}
            <div
              className="mt-3 flex items-center justify-between rounded-lg border bg-white/[0.03] px-3 py-2"
              style={{ borderColor: 'rgba(239,68,68,0.4)' }}
            >
              <span className="flex items-center gap-2 text-xs font-semibold" style={{ color: '#F87171' }}>
                <AlertTriangle className="h-4 w-4" /> Overdue Accounts
              </span>
              <span className="text-sm font-bold" style={{ color: '#F87171' }}>18</span>
            </div>
            <div className="mt-3"><LinkBtn>View Reports →</LinkBtn></div>
          </Card>
        </motion.div>
      </motion.div>
    </div>
  )
}