'use client'

import { useState } from 'react'
import { motion, type Variants } from 'framer-motion'
import {
  Wallet, TrendingDown, PiggyBank, Landmark, Download,
  FileText, ArrowUp, ArrowDown,
} from 'lucide-react'
import { Card } from '@/Components/ui'

/* ---------- Animation (same as other dashboards) ---------- */

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
const PURPLE = '#8B5CF6'
const TEAL = '#00C2B8'

/* ---------- Helpers ---------- */

// Format a number as Indian rupees
const money = (n: number) => `₹ ${n.toLocaleString('en-IN')}`
// Sum all values of a list
const total = (rows: { cur: number }[]) => rows.reduce((s, r) => s + r.cur, 0)
const totalPrev = (rows: { prev: number }[]) => rows.reduce((s, r) => s + r.prev, 0)

/* ---------- Data (replace with API data later) ---------- */

// Top summary cards
const stats = [
  { label: 'Total Income', value: '₹ 10,82,000', sub: 'vs last period', pct: '6%', up: true, good: true, icon: Wallet, c: GREEN },
  { label: 'Total Expenses', value: '₹ 7,45,000', sub: 'vs last period', pct: '3%', up: true, good: false, icon: TrendingDown, c: RED },
  { label: 'Net Surplus', value: '₹ 3,37,000', sub: 'vs last period', pct: '12%', up: true, good: true, icon: PiggyBank, c: BLUE },
  { label: 'Cash Balance', value: '₹ 9,87,000', sub: 'bank + cash', pct: '', up: true, good: true, icon: Landmark, c: ORANGE },
]

// Tabs
const tabs = ['Overview', 'Income Statement', 'Balance Sheet', 'Cash Flow'] as const
type Tab = (typeof tabs)[number]

// Overview chart: income vs expenses (values in Lakh)
const CH_MAX = 12
const chTicks = [12, 9, 6, 3, 0]
const chart = [
  { m: 'Nov', inc: 10.2, exp: 7.1 },
  { m: 'Dec', inc: 10.5, exp: 7.4 },
  { m: 'Jan', inc: 10.8, exp: 7.2 },
  { m: 'Feb', inc: 11, exp: 7.6 },
  { m: 'Mar', inc: 10.9, exp: 7.3 },
  { m: 'Apr', inc: 10.82, exp: 7.45 },
]
const legend = [
  { l: 'Income', c: GREEN },
  { l: 'Expenses', c: RED },
]

// Expense breakdown (percentage of total expenses)
const breakdown = [
  { l: 'Staff Salaries', pct: 32, c: BLUE },
  { l: 'Repairs', pct: 25, c: PURPLE },
  { l: 'Utilities', pct: 21, c: TEAL },
  { l: 'Security', pct: 12, c: ORANGE },
  { l: 'Administration', pct: 10, c: '#94A3B8' },
]

// Downloadable reports
const reports = [
  { n: 'Income Statement', p: 'Apr 2025', g: '30 Apr 2025', t: 'PDF' },
  { n: 'Balance Sheet', p: 'Apr 2025', g: '30 Apr 2025', t: 'PDF' },
  { n: 'Cash Flow Statement', p: 'Q1 FY 25', g: '28 Apr 2025', t: 'XLSX' },
  { n: 'Expense Report', p: 'Mar 2025', g: '02 Apr 2025', t: 'PDF' },
]

// Income statement lines: cur = this period, prev = last period
const incomeRows = [
  { name: 'Maintenance Charges', cur: 960000, prev: 910000 },
  { name: 'Parking Income', cur: 48000, prev: 46000 },
  { name: 'Late Fees', cur: 24000, prev: 28000 },
  { name: 'Other Income', cur: 50000, prev: 40000 },
]
const expenseRows = [
  { name: 'Staff Salaries', cur: 240000, prev: 236000 },
  { name: 'Repairs & Maintenance', cur: 185000, prev: 172000 },
  { name: 'Utilities', cur: 160000, prev: 158000 },
  { name: 'Security', cur: 90000, prev: 90000 },
  { name: 'Administration', cur: 70000, prev: 66000 },
]

// Balance sheet
const assets = [
  { name: 'Cash in Hand', cur: 45000 },
  { name: 'Bank Balance', cur: 942000 },
  { name: 'Maintenance Receivable', cur: 163000 },
  { name: 'Fixed Assets (Equipment)', cur: 850000 },
]
const liabilities = [
  { name: 'Sinking Fund', cur: 600000 },
  { name: 'Repair Fund', cur: 420000 },
  { name: 'Advance Received', cur: 85000 },
  { name: 'Payables', cur: 120000 },
]

// Cash flow by month
const cfMonths = ['Feb 2025', 'Mar 2025', 'Apr 2025']
const cfRows = [
  { name: 'Cash from Collections', v: [1100000, 1090000, 1082000] },
  { name: 'Cash Paid to Vendors', v: [-420000, -390000, -410000] },
  { name: 'Cash Paid for Salaries', v: [-236000, -240000, -240000] },
  { name: 'Other Payments', v: [-95000, -88000, -95000] },
]

// Shared table header / cell styles
const th = 'whitespace-nowrap bg-white/4 px-2 py-2 font-medium first:rounded-l-md last:rounded-r-md'
const td = 'border-t border-[#272D39] px-2 py-2.5'

// min-w-0 stops wide tables from stretching the grid / page on small screens
const cellClass = 'h-full min-w-0 [&>*]:h-full'

// Table wrapper: horizontal scroll only inside the card, never a vertical scrollbar
const tableWrap = 'thin-scroll w-full overflow-x-auto overflow-y-hidden'

// Chart height: smaller on phones, taller on bigger screens (Y axis + plot must match)
const CHART_H = 'h-40 sm:h-48'

// Gradient action button (same style as the other pages)
const gradBtn =
  'flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-linear-to-r from-[#6C63FF] to-[#4DA3FF] px-4 py-2.5 text-xs font-semibold text-white transition hover:opacity-90 active:scale-95'

/* ---------- Small helpers ---------- */

// Change vs previous period, green when it is good, red when it is bad
function Change({ cur, prev, goodWhenUp }: { cur: number; prev: number; goodWhenUp: boolean }) {
  const diff = prev ? ((cur - prev) / prev) * 100 : 0
  const good = goodWhenUp ? diff >= 0 : diff <= 0
  const Arrow = diff >= 0 ? ArrowUp : ArrowDown
  return (
    <span className="inline-flex items-center gap-0.5 font-semibold" style={{ color: good ? '#34D399' : '#F87171' }}>
      <Arrow className="h-3 w-3" /> {Math.abs(diff).toFixed(1)}%
    </span>
  )
}

/* ---------- Page ---------- */
export default function FinancialReportsPage() {
  const [tab, setTab] = useState<Tab>('Overview')

  // Calculated totals
  const incTotal = total(incomeRows)
  const incPrev = totalPrev(incomeRows)
  const expTotal = total(expenseRows)
  const expPrev = totalPrev(expenseRows)
  const assetTotal = total(assets)
  const liabTotal = total(liabilities)
  // Accumulated surplus balances the sheet (assets = liabilities + surplus)
  const surplus = assetTotal - liabTotal
  // Cash flow: net per month and the running totals
  const cfNet = cfMonths.map((_, i) => cfRows.reduce((s, r) => s + r.v[i], 0))

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-350 flex-col gap-4">
      {/* Header */}
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
        className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between"
      >
        <motion.div variants={item} className="min-w-0">
          <h1 className="text-xl font-bold sm:text-2xl">Financial Reports</h1>
          <p className="text-xs text-slate-400">View statements, track the society&apos;s finances and download reports.</p>
        </motion.div>

        {/* Mobile: full-width button. 480px+: auto width */}
        <motion.div
          variants={item}
          className="flex w-full flex-col gap-2 min-[480px]:w-auto min-[480px]:flex-row min-[480px]:items-center"
        >
          <button type="button" className={`${gradBtn} w-full min-[480px]:w-auto`}>
            <Download className="h-3.5 w-3.5" /> Export
          </button>
        </motion.div>
      </motion.div>

      {/* Tabs (no vertical scrollbar, swipe on small screens) */}
      <motion.div
        variants={item}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
        className="border-b border-[#272D39]"
      >
        <div className="no-scrollbar -mb-px flex gap-1 overflow-x-auto overflow-y-hidden">
          {tabs.map((t) => {
            const active = t === tab
            return (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`shrink-0 whitespace-nowrap border-b-2 px-3 py-2.5 text-xs font-semibold transition-colors sm:px-4 ${
                  active
                    ? 'border-[#8B85FF] text-[#A29CFF]'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                {t}
              </button>
            )
          })}
        </div>
      </motion.div>

      {/* Stat cards */}
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
        className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 xl:grid-cols-4"
      >
        {stats.map(({ label, value, sub, pct, up, good, icon: Icon, c }) => {
          const Arrow = up ? ArrowUp : ArrowDown
          return (
            <motion.div
              key={label}
              variants={item}
              className="relative min-w-0 overflow-hidden rounded-xl border border-[#272D39] bg-[#10131A] p-4"
            >
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: `${c}26`, color: c }}>
                  <Icon className="h-4 w-4" />
                </span>
                <span className="truncate text-xs font-semibold">{label}</span>
              </div>
              <p className="mt-3 truncate text-xl font-bold min-[480px]:text-2xl">{value}</p>
              <p className="mt-1 flex items-center gap-1.5 text-[10px] text-slate-400">
                {pct && (
                  <span className="inline-flex items-center gap-0.5 font-semibold" style={{ color: good ? '#34D399' : '#F87171' }}>
                    <Arrow className="h-3 w-3" /> {pct}
                  </span>
                )}
                {sub}
              </p>
              {/* Coloured line at the bottom of the card */}
              <span className="absolute inset-x-0 bottom-0 h-0.75" style={{ background: c }} />
            </motion.div>
          )
        })}
      </motion.div>

      {/* Tab content (re-animates every time the tab changes) */}
      <motion.div
        key={tab}
        variants={container}
        initial="hidden"
        animate="show"
        className="flex min-w-0 flex-col gap-4"
      >
        {/* ---------- Overview ---------- */}
        {tab === 'Overview' && (
          <>
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
              {/* Income vs expenses bar chart */}
              <motion.div variants={item} className={`${cellClass} xl:col-span-2`}>
                <Card
                  title="Income vs Expenses" sub="Last 6 months (in Lakh)"
                  action={
                    <span className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1 text-[10px] text-slate-400">
                      {legend.map(({ l, c }) => (
                        <span key={l} className="flex items-center gap-1">
                          <i className="h-2 w-2 rounded-full" style={{ background: c }} /> {l}
                        </span>
                      ))}
                    </span>
                  }
                >
                  <div className="flex gap-2">
                    {/* Y axis labels */}
                    <div className={`flex ${CHART_H} shrink-0 flex-col justify-between text-[10px] text-slate-500`}>
                      {chTicks.map((t) => (
                        <span key={t} className="leading-none">{t === 0 ? '0' : `${t}L`}</span>
                      ))}
                    </div>
                    {/* Plot */}
                    <div className="min-w-0 flex-1">
                      <div className={`relative ${CHART_H} border-b border-l border-[#272D39]`}>
                        {/* Horizontal grid lines */}
                        {chTicks.slice(0, -1).map((t) => (
                          <span
                            key={t}
                            className="absolute inset-x-0 border-t border-dashed border-[#272D39]"
                            style={{ top: `${100 - (t / CH_MAX) * 100}%` }}
                          />
                        ))}
                        {/* Two bars per month */}
                        <div className="absolute inset-0 flex items-end justify-around px-1 sm:px-2">
                          {chart.map(({ m, inc, exp }) => (
                            <div key={m} className="flex h-full items-end gap-0.5 sm:gap-1">
                              {[
                                { v: inc, c: GREEN, d: 0 },
                                { v: exp, c: RED, d: 0.08 },
                              ].map(({ v, c, d }) => (
                                <motion.span
                                  key={c}
                                  initial={{ height: 0 }}
                                  animate={{ height: `${(v / CH_MAX) * 100}%` }}
                                  transition={{ duration: 0.8, ease: EASE, delay: d }}
                                  className="w-2.5 rounded-t-sm min-[420px]:w-3.5 sm:w-5"
                                  style={{ background: c }}
                                />
                              ))}
                            </div>
                          ))}
                        </div>
                      </div>
                      {/* X axis labels */}
                      <div className="mt-1.5 flex justify-around px-1 text-[10px] text-slate-400 sm:px-2">
                        {chart.map(({ m }) => <span key={m}>{m}</span>)}
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>

              {/* Expense breakdown */}
              <motion.div variants={item} className={cellClass}>
                <Card title="Expense Breakdown" sub="Where the money went">
                  <div className="flex flex-col gap-3.5">
                    {breakdown.map(({ l, pct, c }) => (
                      <div key={l}>
                        <div className="flex items-center gap-2.5">
                          <i className="h-2 w-2 shrink-0 rounded-full" style={{ background: c }} />
                          <span className="min-w-0 flex-1 truncate text-xs font-medium">{l}</span>
                          <span className="text-[11px] font-semibold text-slate-300">{pct}%</span>
                        </div>
                        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/6">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.9, ease: EASE }}
                            className="h-full rounded-full"
                            style={{ background: c }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </motion.div>
            </div>

            {/* Downloadable reports */}
            <motion.div variants={item} className="min-w-0">
              <Card title="Available Reports" sub="Latest generated reports">
                <div className={tableWrap}>
                  <table className="w-full min-w-130 text-left text-[11px]">
                    <thead className="text-slate-400">
                      <tr>
                        <th className={th}>Report</th>
                        <th className={th}>Period</th>
                        <th className={th}>Generated</th>
                        <th className={th}>Format</th>
                        <th className={th}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reports.map((r) => (
                        <tr key={r.n}>
                          <td className={`${td} whitespace-nowrap font-medium`}>
                            <span className="flex items-center gap-2">
                              <FileText className="h-3.5 w-3.5 text-slate-400" /> {r.n}
                            </span>
                          </td>
                          <td className={`${td} whitespace-nowrap`}>{r.p}</td>
                          <td className={`${td} whitespace-nowrap text-slate-400`}>{r.g}</td>
                          <td className={td}>{r.t}</td>
                          <td className={td}>
                            <button
                              type="button"
                              className="flex items-center gap-1 rounded-md border border-[#272D39] px-2.5 py-1 text-[10px] text-slate-300 hover:bg-white/5"
                            >
                              <Download className="h-3 w-3" /> Download
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </motion.div>
          </>
        )}

        {/* ---------- Income Statement ---------- */}
        {tab === 'Income Statement' && (
          <motion.div variants={item} className="min-w-0">
            <Card title="Income Statement" sub="Income and expenses compared with the last period">
              <div className={tableWrap}>
                <table className="w-full min-w-140 text-left text-[11px]">
                  <thead className="text-slate-400">
                    <tr>
                      <th className={th}>Particulars</th>
                      <th className={`${th} text-right`}>This Period</th>
                      <th className={`${th} text-right`}>Last Period</th>
                      <th className={`${th} text-right`}>Change</th>
                    </tr>
                  </thead>
                  <tbody>
                    {/* Income rows */}
                    {incomeRows.map((r) => (
                      <tr key={r.name}>
                        <td className={`${td} whitespace-nowrap`}>{r.name}</td>
                        <td className={`${td} text-right`}>{money(r.cur)}</td>
                        <td className={`${td} text-right text-slate-400`}>{money(r.prev)}</td>
                        <td className={`${td} text-right`}><Change cur={r.cur} prev={r.prev} goodWhenUp /></td>
                      </tr>
                    ))}
                    <tr className="bg-white/4 font-bold">
                      <td className={td}>Total Income</td>
                      <td className={`${td} text-right`}>{money(incTotal)}</td>
                      <td className={`${td} text-right`}>{money(incPrev)}</td>
                      <td className={`${td} text-right`}><Change cur={incTotal} prev={incPrev} goodWhenUp /></td>
                    </tr>

                    {/* Expense rows */}
                    {expenseRows.map((r) => (
                      <tr key={r.name}>
                        <td className={`${td} whitespace-nowrap`}>{r.name}</td>
                        <td className={`${td} text-right`}>{money(r.cur)}</td>
                        <td className={`${td} text-right text-slate-400`}>{money(r.prev)}</td>
                        <td className={`${td} text-right`}><Change cur={r.cur} prev={r.prev} goodWhenUp={false} /></td>
                      </tr>
                    ))}
                    <tr className="bg-white/4 font-bold">
                      <td className={td}>Total Expenses</td>
                      <td className={`${td} text-right`}>{money(expTotal)}</td>
                      <td className={`${td} text-right`}>{money(expPrev)}</td>
                      <td className={`${td} text-right`}><Change cur={expTotal} prev={expPrev} goodWhenUp={false} /></td>
                    </tr>

                    {/* Net surplus */}
                    <tr className="bg-[#3B82F6]/20 font-bold">
                      <td className={td}>Net Surplus</td>
                      <td className={`${td} text-right`}>{money(incTotal - expTotal)}</td>
                      <td className={`${td} text-right`}>{money(incPrev - expPrev)}</td>
                      <td className={`${td} text-right`}><Change cur={incTotal - expTotal} prev={incPrev - expPrev} goodWhenUp /></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>
          </motion.div>
        )}

        {/* ---------- Balance Sheet ---------- */}
        {tab === 'Balance Sheet' && (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
            {/* Assets */}
            <motion.div variants={item} className={cellClass}>
              <Card title="Assets" sub="What the society owns">
                <div className={tableWrap}>
                  <table className="w-full min-w-65 text-left text-[11px]">
                    <tbody>
                      {assets.map((r) => (
                        <tr key={r.name}>
                          <td className={`${td} whitespace-nowrap first:border-t-0`}>{r.name}</td>
                          <td className={`${td} text-right font-medium`}>{money(r.cur)}</td>
                        </tr>
                      ))}
                      <tr className="bg-[#3B82F6]/20 font-bold">
                        <td className={td}>Total Assets</td>
                        <td className={`${td} text-right`}>{money(assetTotal)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </Card>
            </motion.div>

            {/* Liabilities and funds */}
            <motion.div variants={item} className={cellClass}>
              <Card title="Liabilities & Funds" sub="What the society owes and its reserves">
                <div className={tableWrap}>
                  <table className="w-full min-w-65 text-left text-[11px]">
                    <tbody>
                      {liabilities.map((r) => (
                        <tr key={r.name}>
                          <td className={`${td} whitespace-nowrap first:border-t-0`}>{r.name}</td>
                          <td className={`${td} text-right font-medium`}>{money(r.cur)}</td>
                        </tr>
                      ))}
                      <tr>
                        <td className={`${td} whitespace-nowrap`}>Accumulated Surplus</td>
                        <td className={`${td} text-right font-medium`}>{money(surplus)}</td>
                      </tr>
                      <tr className="bg-[#3B82F6]/20 font-bold">
                        <td className={td}>Total Liabilities & Funds</td>
                        <td className={`${td} text-right`}>{money(liabTotal + surplus)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </Card>
            </motion.div>
          </div>
        )}

        {/* ---------- Cash Flow ---------- */}
        {tab === 'Cash Flow' && (
          <motion.div variants={item} className="min-w-0">
            <Card title="Cash Flow Statement" sub="Cash in and cash out by month">
              <div className={tableWrap}>
                <table className="w-full min-w-130 text-left text-[11px]">
                  <thead className="text-slate-400">
                    <tr>
                      <th className={th}>Particulars</th>
                      {cfMonths.map((m) => (
                        <th key={m} className={`${th} text-right`}>{m}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {cfRows.map((r) => (
                      <tr key={r.name}>
                        <td className={`${td} whitespace-nowrap`}>{r.name}</td>
                        {r.v.map((x, i) => (
                          <td key={i} className={`${td} text-right`} style={{ color: x < 0 ? '#F87171' : undefined }}>
                            {x < 0 ? `(${Math.abs(x).toLocaleString('en-IN')})` : x.toLocaleString('en-IN')}
                          </td>
                        ))}
                      </tr>
                    ))}
                    {/* Net cash flow */}
                    <tr className="bg-[#3B82F6]/20 font-bold">
                      <td className={td}>Net Cash Flow</td>
                      {cfNet.map((x, i) => (
                        <td key={i} className={`${td} text-right`}>{x.toLocaleString('en-IN')}</td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </Card>
          </motion.div>
        )}
      </motion.div>
    </div>
  )
}