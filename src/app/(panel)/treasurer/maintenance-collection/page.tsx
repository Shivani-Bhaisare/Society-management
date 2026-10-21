'use client'

import { useState } from 'react'
import { motion, type Variants } from 'framer-motion'
import {
  Wallet, CheckCircle2, Clock, AlertTriangle, Download,
  Smartphone, CreditCard, Landmark, Banknote, FileText, ArrowUp, ArrowDown,
} from 'lucide-react'
import { Card } from '@/Components/ui'

/* ---------- Animation (same as other dashboards) ---------- */

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

// Top summary cards
const stats = [
  { label: 'Total Expected', value: '₹ 12,45,000', sub: 'Apr 2025 billing', pct: '', icon: Wallet, c: BLUE },
  { label: 'Total Collected', value: '₹ 10,82,000', sub: 'of expected', pct: '87%', up: true, good: true, icon: CheckCircle2, c: GREEN },
  { label: 'Pending', value: '₹ 1,03,000', sub: 'of expected', pct: '8%', up: true, good: false, icon: Clock, c: ORANGE },
  { label: 'Overdue', value: '₹ 60,000', sub: 'of expected', pct: '5%', up: true, good: false, icon: AlertTriangle, c: RED },
]

// Tabs
const tabs = ['Collection Summary', 'Flat-wise Payments', 'Receipts', 'Collection History'] as const
type Tab = (typeof tabs)[number]

// Collection summary chart (values in Lakh)
const CH_MAX = 20
const chTicks = [20, 15, 10, 5, 0]
const chart = [
  { m: 'Jan', exp: 12, col: 10.5, pen: 1.5 },
  { m: 'Feb', exp: 12.2, col: 11, pen: 1.2 },
  { m: 'Mar', exp: 12.4, col: 10.8, pen: 1.6 },
  { m: 'Apr', exp: 12.45, col: 10.82, pen: 1.03 },
]
const legend = [
  { l: 'Expected', c: BLUE },
  { l: 'Collected', c: GREEN },
  { l: 'Pending', c: ORANGE },
]

// Payment methods
const methods = [
  { l: 'UPI', pct: 42, i: Smartphone, c: BLUE },
  { l: 'Online Card', pct: 20, i: CreditCard, c: PURPLE },
  { l: 'Net Banking', pct: 15, i: Landmark, c: '#00C2B8' },
  { l: 'Cash', pct: 8, i: Banknote, c: ORANGE },
  { l: 'Cheque', pct: 7, i: FileText, c: '#94A3B8' },
]

// Recent collections
const recent = [
  { d: '28 Apr 2025', f: 'A-101', p: 'Maintenance', a: '₹ 5,000', m: 'UPI', s: 'Paid' },
  { d: '27 Apr 2025', f: 'B-204', p: 'Maintenance', a: '₹ 2,000', m: 'Card', s: 'Paid' },
  { d: '22 Apr 2025', f: 'C-301', p: 'Maintenance', a: '₹ 1,500', m: 'Net Banking', s: 'Paid' },
]

// Flat-wise payments
const flatwise = [
  { f: 'A-101', o: 'Rahul Mehta', b: '₹ 5,000', p: '₹ 5,000', due: '₹ 0', s: 'Paid' },
  { f: 'A-203', o: 'Karan Singh', b: '₹ 5,000', p: '₹ 5,000', due: '₹ 0', s: 'Paid' },
  { f: 'B-204', o: 'Neha Verma', b: '₹ 5,000', p: '₹ 2,000', due: '₹ 3,000', s: 'Partial' },
  { f: 'C-301', o: 'Amit Shah', b: '₹ 5,000', p: '₹ 1,500', due: '₹ 3,500', s: 'Partial' },
  { f: 'D-402', o: 'Priya Nair', b: '₹ 5,000', p: '₹ 0', due: '₹ 5,000', s: 'Overdue' },
]

// Receipts
const receipts = [
  { n: 'RCP-1024', d: '28 Apr 2025', f: 'A-101', a: '₹ 5,000', m: 'UPI' },
  { n: 'RCP-1023', d: '27 Apr 2025', f: 'B-204', a: '₹ 2,000', m: 'Card' },
  { n: 'RCP-1022', d: '22 Apr 2025', f: 'C-301', a: '₹ 1,500', m: 'Net Banking' },
  { n: 'RCP-1021', d: '20 Apr 2025', f: 'A-203', a: '₹ 5,000', m: 'Cash' },
]

// Collection history
const history = [
  { m: 'Jan 2025', e: '₹ 12,00,000', c: '₹ 10,50,000', p: '₹ 1,50,000', eff: 88 },
  { m: 'Feb 2025', e: '₹ 12,20,000', c: '₹ 11,00,000', p: '₹ 1,20,000', eff: 90 },
  { m: 'Mar 2025', e: '₹ 12,40,000', c: '₹ 10,80,000', p: '₹ 1,60,000', eff: 87 },
  { m: 'Apr 2025', e: '₹ 12,45,000', c: '₹ 10,82,000', p: '₹ 1,63,000', eff: 87 },
]

// Shared table header / cell styles
const th = 'whitespace-nowrap bg-white/[0.04] px-2 py-2 font-medium first:rounded-l-md last:rounded-r-md'
const td = 'border-t border-[#272D39] px-2 py-2.5'

// min-w-0 stops wide tables from stretching the grid / page on small screens
const cellClass = 'h-full min-w-0 [&>*]:h-full'

// Table wrapper: horizontal scroll only inside the card, never a vertical scrollbar
const tableWrap = 'thin-scroll w-full overflow-x-auto overflow-y-hidden'

// Chart height: smaller on phones, taller on bigger screens (Y axis + plot must match)
const CHART_H = 'h-40 sm:h-48'

// Status -> colour
const statusColor: Record<string, string> = {
  Paid: GREEN,
  Partial: ORANGE,
  Pending: ORANGE,
  Overdue: RED,
}

/* ---------- Small helpers ---------- */

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
export default function MaintenanceCollectionPage() {
  const [tab, setTab] = useState<Tab>('Collection Summary')

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-[1400px] flex-col gap-4">
      {/* Header */}
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
        className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between"
      >
        <motion.div variants={item} className="min-w-0">
          <h1 className="text-xl font-bold sm:text-2xl">Income &amp; Collections</h1>
          <p className="text-xs text-slate-400">Manage collections, view payment history and generate receipts.</p>
        </motion.div>

        {/* Mobile: full-width button. 480px+: auto width */}
        <motion.div
          variants={item}
          className="flex w-full flex-col gap-2 min-[480px]:w-auto min-[480px]:flex-row min-[480px]:items-center"
        >
          {/* Export: same style as Accounting "Add Transaction" button */}
          <button
            type="button"
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-linear-to-r from-[#6C63FF] to-[#4DA3FF] px-4 py-2.5 text-xs font-semibold text-white transition hover:opacity-90 active:scale-95 min-[480px]:w-auto"
          >
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
                  <span
                    className="inline-flex items-center gap-0.5 font-semibold"
                    style={{ color: good ? '#34D399' : '#F87171' }}
                  >
                    <Arrow className="h-3 w-3" /> {pct}
                  </span>
                )}
                {sub}
              </p>
              <span className="absolute inset-x-0 bottom-0 h-[3px]" style={{ background: c }} />
            </motion.div>
          )
        })}
      </motion.div>

      {/* Tab content */}
      <motion.div
        key={tab}
        variants={container}
        initial="hidden"
        animate="show"
        className="flex min-w-0 flex-col gap-4"
      >
        {/* ---------- Collection Summary ---------- */}
        {tab === 'Collection Summary' && (
          <>
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
              {/* Bar chart */}
              <motion.div variants={item} className={`${cellClass} xl:col-span-2`}>
                <Card
                  title="Collection Summary" sub="Last 4 months (in Lakh)"
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
                        {chTicks.slice(0, -1).map((t) => (
                          <span
                            key={t}
                            className="absolute inset-x-0 border-t border-dashed border-[#272D39]"
                            style={{ top: `${100 - (t / CH_MAX) * 100}%` }}
                          />
                        ))}
                        <div className="absolute inset-0 flex items-end justify-around px-1 sm:px-2">
                          {chart.map(({ m, exp, col, pen }) => (
                            <div key={m} className="flex h-full items-end gap-0.5 sm:gap-1">
                              {[
                                { v: exp, c: BLUE, d: 0 },
                                { v: col, c: GREEN, d: 0.08 },
                                { v: pen, c: ORANGE, d: 0.16 },
                              ].map(({ v, c, d }) => (
                                <motion.span
                                  key={c}
                                  initial={{ height: 0 }}
                                  animate={{ height: `${(v / CH_MAX) * 100}%` }}
                                  transition={{ duration: 0.8, ease: EASE, delay: d }}
                                  className="w-2 rounded-t-sm min-[420px]:w-3 sm:w-4"
                                  style={{ background: c }}
                                />
                              ))}
                            </div>
                          ))}
                        </div>
                      </div>
                      <div className="mt-1.5 flex justify-around px-1 text-[10px] text-slate-400 sm:px-2">
                        {chart.map(({ m }) => <span key={m}>{m}</span>)}
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>

              {/* Payment methods */}
              <motion.div variants={item} className={cellClass}>
                <Card title="Payment Methods" sub="How residents paid">
                  <div className="flex flex-col gap-3.5">
                    {methods.map(({ l, pct, i: Icon, c }) => (
                      <div key={l}>
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md" style={{ background: `${c}26`, color: c }}>
                            <Icon className="h-3.5 w-3.5" />
                          </span>
                          <span className="min-w-0 flex-1 truncate text-xs font-medium">{l}</span>
                          <span className="text-[11px] font-semibold text-slate-300">{pct}%</span>
                        </div>
                        <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.06]">
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

            {/* Recent collections */}
            <motion.div variants={item} className="min-w-0">
              <Card
                title="Recent Collections" sub="Latest payments received"
                action={
                  <button type="button" onClick={() => setTab('Collection History')} className="text-[11px] text-[#A29CFF] hover:underline">
                    View All
                  </button>
                }
              >
                <div className={tableWrap}>
                  <table className="w-full min-w-[560px] text-left text-[11px]">
                    <thead className="text-slate-400">
                      <tr>
                        <th className={th}>Date</th>
                        <th className={th}>Flat No.</th>
                        <th className={th}>Particulars</th>
                        <th className={th}>Amount</th>
                        <th className={th}>Payment Mode</th>
                        <th className={th}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recent.map((r) => (
                        <tr key={r.d + r.f}>
                          <td className={`${td} whitespace-nowrap text-slate-400`}>{r.d}</td>
                          <td className={`${td} font-medium`}>{r.f}</td>
                          <td className={td}>{r.p}</td>
                          <td className={`${td} whitespace-nowrap font-medium`}>{r.a}</td>
                          <td className={`${td} whitespace-nowrap text-slate-400`}>{r.m}</td>
                          <td className={td}><Pill c={statusColor[r.s]}>{r.s}</Pill></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </motion.div>
          </>
        )}

        {/* ---------- Flat-wise Payments ---------- */}
        {tab === 'Flat-wise Payments' && (
          <motion.div variants={item} className="min-w-0">
            <Card title="Flat-wise Payments" sub="Maintenance status for each flat">
              <div className={tableWrap}>
                <table className="w-full min-w-[560px] text-left text-[11px]">
                  <thead className="text-slate-400">
                    <tr>
                      <th className={th}>Flat No.</th>
                      <th className={th}>Owner</th>
                      <th className={th}>Billed</th>
                      <th className={th}>Paid</th>
                      <th className={th}>Due</th>
                      <th className={th}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {flatwise.map((r) => (
                      <tr key={r.f}>
                        <td className={`${td} font-medium`}>{r.f}</td>
                        <td className={`${td} whitespace-nowrap`}>{r.o}</td>
                        <td className={`${td} whitespace-nowrap text-slate-400`}>{r.b}</td>
                        <td className={`${td} whitespace-nowrap`}>{r.p}</td>
                        <td className={`${td} whitespace-nowrap font-medium`}>{r.due}</td>
                        <td className={td}><Pill c={statusColor[r.s]}>{r.s}</Pill></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </motion.div>
        )}

        {/* ---------- Receipts ---------- */}
        {tab === 'Receipts' && (
          <motion.div variants={item} className="min-w-0">
            <Card title="Receipts" sub="Generated payment receipts">
              <div className={tableWrap}>
                <table className="w-full min-w-[520px] text-left text-[11px]">
                  <thead className="text-slate-400">
                    <tr>
                      <th className={th}>Receipt No.</th>
                      <th className={th}>Date</th>
                      <th className={th}>Flat No.</th>
                      <th className={th}>Amount</th>
                      <th className={th}>Mode</th>
                      <th className={th}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {receipts.map((r) => (
                      <tr key={r.n}>
                        <td className={`${td} whitespace-nowrap font-medium`}>{r.n}</td>
                        <td className={`${td} whitespace-nowrap text-slate-400`}>{r.d}</td>
                        <td className={td}>{r.f}</td>
                        <td className={`${td} whitespace-nowrap font-medium`}>{r.a}</td>
                        <td className={`${td} whitespace-nowrap text-slate-400`}>{r.m}</td>
                        <td className={td}>
                          <button
                            type="button"
                            className="flex items-center gap-1 rounded-md border border-[#272D39] px-2.5 py-1 text-[10px] text-slate-300 hover:bg-white/5"
                          >
                            <Download className="h-3 w-3" /> PDF
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </motion.div>
        )}

        {/* ---------- Collection History ---------- */}
        {tab === 'Collection History' && (
          <motion.div variants={item} className="min-w-0">
            <Card title="Collection History" sub="Month-wise collection efficiency">
              <div className={tableWrap}>
                <table className="w-full min-w-[560px] text-left text-[11px]">
                  <thead className="text-slate-400">
                    <tr>
                      <th className={th}>Month</th>
                      <th className={th}>Expected</th>
                      <th className={th}>Collected</th>
                      <th className={th}>Pending</th>
                      <th className={th}>Efficiency</th>
                    </tr>
                  </thead>
                  <tbody>
                    {history.map((r) => (
                      <tr key={r.m}>
                        <td className={`${td} whitespace-nowrap font-medium`}>{r.m}</td>
                        <td className={`${td} whitespace-nowrap text-slate-400`}>{r.e}</td>
                        <td className={`${td} whitespace-nowrap`}>{r.c}</td>
                        <td className={`${td} whitespace-nowrap`} style={{ color: '#FBBF24' }}>{r.p}</td>
                        <td className={td}>
                          <div className="flex items-center gap-2">
                            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-white/[0.06]">
                              <div className="h-full rounded-full" style={{ width: `${r.eff}%`, background: GREEN }} />
                            </div>
                            <span className="text-slate-300">{r.eff}%</span>
                          </div>
                        </td>
                      </tr>
                    ))}
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