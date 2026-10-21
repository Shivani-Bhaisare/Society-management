'use client'

import { useState } from 'react'
import { motion, type Variants } from 'framer-motion'
import {
  Receipt, CheckCircle2, Clock, AlertTriangle, Plus, Check, X,
} from 'lucide-react'
import { Card } from '@/Components/ui'
import AddExpenseModal, { type ExpensePayload } from '@/Components/AddExpenseModal' // adjust the path to your folder

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
const ORANGE = '#F59E0B'
const BLUE = '#3B82F6' // Used for the Total Expenses card (separate from Overdue)

/* ---------- Data (replace with API data later) ---------- */

// Top summary cards
const stats = [
  { label: 'Total Expenses', value: '₹ 8,32,000', sub: 'Apr 2025', pct: '', pc: BLUE, icon: Receipt, c: BLUE },
  { label: 'Paid', value: '₹ 6,80,000', sub: 'of total expenses', pct: '82%', pc: GREEN, icon: CheckCircle2, c: GREEN },
  { label: 'Pending', value: '₹ 1,52,000', sub: 'of total expenses', pct: '18%', pc: ORANGE, icon: Clock, c: ORANGE },
  { label: 'Overdue', value: '₹ 85,000', sub: 'of total expenses', pct: '10%', pc: RED, icon: AlertTriangle, c: RED },
]

// Tabs
const tabs = ['Expense Entry', 'Vendor Payments', 'Bills & Invoices', 'Expense Approval'] as const
type Tab = (typeof tabs)[number]

// Expense by category (pct adds up to 100)
const categories = [
  { l: 'Security Services', pct: 24, c: '#3B82F6' },
  { l: 'Housekeeping', pct: 19, c: '#00C2B8' },
  { l: 'Electricity', pct: 12, c: '#F59E0B' },
  { l: 'Lift AMC', pct: 10, c: '#8B5CF6' },
  { l: 'Repairs', pct: 5, c: '#EC4899' },
  { l: 'Others', pct: 30, c: '#F97316' },
]

// Recent expenses
const recent = [
  { d: '28 Apr 2025', cat: 'Security Services', v: 'Alpha Security', a: '₹ 3,20,000', s: 'Paid' },
  { d: '27 Apr 2025', cat: 'Electricity', v: 'Adani Power', a: '₹ 1,45,000', s: 'Paid' },
  { d: '26 Apr 2025', cat: 'Housekeeping', v: 'CleanCo', a: '₹ 85,000', s: 'Pending' },
  { d: '25 Apr 2025', cat: 'Lift AMC', v: 'Schindler', a: '₹ 1,20,000', s: 'Paid' },
  { d: '24 Apr 2025', cat: 'Repairs', v: 'BuildMart', a: '₹ 75,000', s: 'Paid' },
]

// Vendor payments
const vendorPayments = [
  { v: 'Alpha Security', cat: 'Security', d: '30 Apr 2025', a: '₹ 3,20,000', mode: 'Net Banking', s: 'Paid' },
  { v: 'Adani Power', cat: 'Electricity', d: '27 Apr 2025', a: '₹ 1,45,000', mode: 'UPI', s: 'Paid' },
  { v: 'CleanCo', cat: 'Housekeeping', d: '10 May 2025', a: '₹ 85,000', mode: '—', s: 'Pending' },
  { v: 'Schindler', cat: 'Lift AMC', d: '25 Apr 2025', a: '₹ 1,20,000', mode: 'Cheque', s: 'Paid' },
]

// Bills & invoices
const bills = [
  { n: 'MB-001', p: 'Maintenance', v: 'Alpha Security', a: '₹ 3,20,000', due: '30 Apr 2025', s: 'Paid' },
  { n: 'VI-002', p: 'Lift AMC', v: 'Schindler', a: '₹ 1,20,000', due: '05 May 2025', s: 'Paid' },
  { n: 'VI-003', p: 'Electricity', v: 'Adani Power', a: '₹ 85,000', due: '10 May 2025', s: 'Pending' },
  { n: 'VI-004', p: 'Housekeeping', v: 'CleanCo', a: '₹ 85,000', due: '12 May 2025', s: 'Overdue' },
]

// Expense approval queue
const approvalsInit = [
  { id: 'EXP-301', t: 'Garden Maintenance', by: 'Secretary', a: '₹ 18,000', s: 'Pending' },
  { id: 'EXP-302', t: 'Generator Repair', by: 'Facility Manager', a: '₹ 42,000', s: 'Pending' },
  { id: 'EXP-303', t: 'Clubhouse Painting', by: 'Secretary', a: '₹ 65,000', s: 'Approved' },
  { id: 'EXP-304', t: 'CCTV Upgrade', by: 'Security Head', a: '₹ 1,10,000', s: 'Rejected' },
]

// Shared table header / cell styles
const th = 'whitespace-nowrap bg-white/4 px-2 py-2 font-medium first:rounded-l-md last:rounded-r-md'
const td = 'border-t border-[#272D39] px-2 py-2.5'

// min-w-0 stops wide tables from stretching the grid / page on small screens
const cellClass = 'h-full min-w-0 [&>*]:h-full'

// Table wrapper: horizontal scroll only inside the card, never a vertical scrollbar
const tableWrap = 'thin-scroll w-full overflow-x-auto overflow-y-hidden'

// Status -> colour
const statusColor: Record<string, string> = {
  Paid: GREEN,
  Approved: GREEN,
  Pending: ORANGE,
  Overdue: RED,
  Rejected: RED,
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
export default function ExpensesPage() {
  const [tab, setTab] = useState<Tab>('Expense Entry')
  const [approvals, setApprovals] = useState(approvalsInit)
  // Controls the Add Expense drawer (open / closed)
  const [addOpen, setAddOpen] = useState(false)

  // Approve / reject an expense in the approval queue
  const decide = (id: string, s: 'Approved' | 'Rejected') =>
    setApprovals((list) => list.map((x) => (x.id === id ? { ...x, s } : x)))

  // Called when the drawer form is saved (as a draft or as a submitted expense)
  const handleSaveExpense = (data: ExpensePayload) => {
    // TODO: call the API here, then refresh the expense list / stat cards
    console.log('Expense saved:', data)
  }

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
          <h1 className="text-xl font-bold sm:text-2xl">Expenses</h1>
          <p className="text-xs text-slate-400">Track all expenses, vendor payments and approval status.</p>
        </motion.div>

        {/* Mobile: full-width button. 480px+: auto width */}
        <motion.div
          variants={item}
          className="flex w-full flex-col gap-2 min-[480px]:w-auto min-[480px]:flex-row min-[480px]:items-center"
        >
          {/* Add Expense: same style as Accounting "Add Transaction" button, opens the drawer */}
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-linear-to-r from-[#6C63FF] to-[#4DA3FF] px-4 py-2.5 text-xs font-semibold text-white transition hover:opacity-90 active:scale-95 min-[480px]:w-auto"
          >
            <Plus className="h-3.5 w-3.5" /> Add Expense
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

      {/* Stat cards (same grid as Bills & Invoices: 4 columns, so the cards are the same size) */}
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
        className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 xl:grid-cols-4"
      >
        {stats.map(({ label, value, sub, pct, pc, icon: Icon, c }) => (
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
              {pct && <Pill c={pc}>{pct}</Pill>}
              {sub}
            </p>
            <span className="absolute inset-x-0 bottom-0 h-[3px]" style={{ background: c }} />
          </motion.div>
        ))}
      </motion.div>

      {/* Tab content */}
      <motion.div
        key={tab}
        variants={container}
        initial="hidden"
        animate="show"
        className="flex min-w-0 flex-col gap-4"
      >
        {/* ---------- Expense Entry ---------- */}
        {tab === 'Expense Entry' && (
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
            {/* Expense by category (donut) */}
            <motion.div variants={item} className={cellClass}>
              <Card title="Expense by Category" sub="Where the money went">
                <div className="flex flex-col items-center gap-4">
                  <Donut segments={categories.map(({ pct, c }) => ({ pct, c }))} size={160} stroke={18}>
                    <span className="text-base font-bold">₹ 8,32,000</span>
                    <span className="text-[10px] text-slate-400">Total Expenses</span>
                  </Donut>
                  <div className="flex w-full flex-col gap-2.5">
                    {categories.map(({ l, pct, c }) => (
                      <div key={l} className="flex items-center gap-2 text-[11px]">
                        <i className="h-2 w-2 shrink-0 rounded-full" style={{ background: c }} />
                        <span className="min-w-0 flex-1 truncate">{l}</span>
                        <span className="shrink-0 font-semibold text-slate-300">{pct}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </motion.div>

            {/* Recent expenses */}
            <motion.div variants={item} className={`${cellClass} xl:col-span-2`}>
              <Card
                title="Recent Expenses" sub="Latest 5 entries"
                action={<button type="button" className="text-[11px] text-[#A29CFF] hover:underline">View All</button>}
              >
                <div className={tableWrap}>
                  <table className="w-full min-w-130 text-left text-[11px]">
                    <thead className="text-slate-400">
                      <tr>
                        <th className={th}>Date</th>
                        <th className={th}>Category</th>
                        <th className={th}>Vendor</th>
                        <th className={th}>Amount</th>
                        <th className={th}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recent.map((r) => (
                        <tr key={r.d + r.v}>
                          <td className={`${td} whitespace-nowrap text-slate-400`}>{r.d}</td>
                          <td className={`${td} whitespace-nowrap font-medium`}>{r.cat}</td>
                          <td className={`${td} whitespace-nowrap`}>{r.v}</td>
                          <td className={`${td} whitespace-nowrap font-medium`}>{r.a}</td>
                          <td className={td}><Pill c={statusColor[r.s]}>{r.s}</Pill></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </motion.div>
          </div>
        )}

        {/* ---------- Vendor Payments ---------- */}
        {tab === 'Vendor Payments' && (
          <motion.div variants={item} className="min-w-0">
            <Card title="Vendor Payments" sub="Payments made to vendors">
              <div className={tableWrap}>
                <table className="w-full min-w-140 text-left text-[11px]">
                  <thead className="text-slate-400">
                    <tr>
                      <th className={th}>Vendor</th>
                      <th className={th}>Category</th>
                      <th className={th}>Payment Date</th>
                      <th className={th}>Amount</th>
                      <th className={th}>Mode</th>
                      <th className={th}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vendorPayments.map((r) => (
                      <tr key={r.v}>
                        <td className={`${td} whitespace-nowrap font-medium`}>{r.v}</td>
                        <td className={`${td} whitespace-nowrap text-slate-400`}>{r.cat}</td>
                        <td className={`${td} whitespace-nowrap text-slate-400`}>{r.d}</td>
                        <td className={`${td} whitespace-nowrap font-medium`}>{r.a}</td>
                        <td className={`${td} whitespace-nowrap`}>{r.mode}</td>
                        <td className={td}><Pill c={statusColor[r.s]}>{r.s}</Pill></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </motion.div>
        )}

        {/* ---------- Bills & Invoices ---------- */}
        {tab === 'Bills & Invoices' && (
          <motion.div variants={item} className="min-w-0">
            <Card title="Bills & Invoices" sub="Vendor bills and their due dates">
              <div className={tableWrap}>
                <table className="w-full min-w-140 text-left text-[11px]">
                  <thead className="text-slate-400">
                    <tr>
                      <th className={th}>Bill No.</th>
                      <th className={th}>Particulars</th>
                      <th className={th}>Vendor</th>
                      <th className={th}>Amount</th>
                      <th className={th}>Due Date</th>
                      <th className={th}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bills.map((r) => (
                      <tr key={r.n}>
                        <td className={`${td} whitespace-nowrap font-medium`}>{r.n}</td>
                        <td className={`${td} whitespace-nowrap`}>{r.p}</td>
                        <td className={`${td} whitespace-nowrap text-slate-400`}>{r.v}</td>
                        <td className={`${td} whitespace-nowrap font-medium`}>{r.a}</td>
                        <td className={`${td} whitespace-nowrap text-slate-400`}>{r.due}</td>
                        <td className={td}><Pill c={statusColor[r.s]}>{r.s}</Pill></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </motion.div>
        )}

        {/* ---------- Expense Approval ---------- */}
        {tab === 'Expense Approval' && (
          <motion.div variants={item} className="min-w-0">
            <Card title="Expense Approval" sub="Requests waiting for your decision">
              <div className={tableWrap}>
                <table className="w-full min-w-140 text-left text-[11px]">
                  <thead className="text-slate-400">
                    <tr>
                      <th className={th}>ID</th>
                      <th className={th}>Expense</th>
                      <th className={th}>Requested By</th>
                      <th className={th}>Amount</th>
                      <th className={th}>Status</th>
                      <th className={th}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {approvals.map((r) => (
                      <tr key={r.id}>
                        <td className={`${td} whitespace-nowrap text-slate-400`}>{r.id}</td>
                        <td className={`${td} whitespace-nowrap font-medium`}>{r.t}</td>
                        <td className={`${td} whitespace-nowrap`}>{r.by}</td>
                        <td className={`${td} whitespace-nowrap font-medium`}>{r.a}</td>
                        <td className={td}><Pill c={statusColor[r.s]}>{r.s}</Pill></td>
                        <td className={td}>
                          {r.s === 'Pending' ? (
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => decide(r.id, 'Approved')}
                                className="flex items-center gap-1 rounded-md px-2.5 py-1 text-[10px] font-semibold hover:opacity-80"
                                style={{ background: `${GREEN}26`, color: GREEN }}
                              >
                                <Check className="h-3 w-3" /> Approve
                              </button>
                              <button
                                type="button"
                                onClick={() => decide(r.id, 'Rejected')}
                                className="flex items-center gap-1 rounded-md px-2.5 py-1 text-[10px] font-semibold hover:opacity-80"
                                style={{ background: `${RED}26`, color: RED }}
                              >
                                <X className="h-3 w-3" /> Reject
                              </button>
                            </div>
                          ) : (
                            <span className="text-slate-500">—</span>
                          )}
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

      {/* Add Expense drawer (opens from the "Add Expense" button) */}
      <AddExpenseModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSave={handleSaveExpense}
      />
    </div>
  )
}