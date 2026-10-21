'use client'

import { useMemo, useState } from 'react'
import { motion, type Variants } from 'framer-motion'
import {
  FileText, CheckCircle2, Clock, AlertTriangle, Plus,
  Search, Eye, ChevronLeft, ChevronRight,
} from 'lucide-react'
import { Card } from '@/Components/ui'
import AddBillModal, { type BillPayload } from '@/Components/AddBillModal' // adjust the path to your folder

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

/* ---------- Data (replace with API data later) ---------- */

// Top summary cards
const stats = [
  { label: 'Total Bills', value: '₹ 5,60,000', sub: 'Apr 2025', pct: '', pc: BLUE, icon: FileText, c: BLUE },
  { label: 'Paid', value: '₹ 4,12,000', sub: 'of total bills', pct: '74%', pc: GREEN, icon: CheckCircle2, c: GREEN },
  { label: 'Pending', value: '₹ 1,48,000', sub: 'of total bills', pct: '26%', pc: ORANGE, icon: Clock, c: ORANGE },
  { label: 'Overdue', value: '₹ 80,000', sub: 'of total bills', pct: '14%', pc: RED, icon: AlertTriangle, c: RED },
]

// Tabs -> which bill kind each one shows
const tabs = [
  { l: 'All Bills', k: 'All' },
  { l: 'Maintenance Bills', k: 'Maintenance' },
  { l: 'Vendor Invoices', k: 'Vendor' },
  { l: 'Credit / Debit Notes', k: 'Note' },
] as const
type TabLabel = (typeof tabs)[number]['l']

type Bill = {
  d: string
  n: string
  p: string
  v: string
  a: string
  due: string
  s: 'Paid' | 'Pending' | 'Overdue'
  k: 'Maintenance' | 'Vendor' | 'Note'
}

const bills: Bill[] = [
  { d: '28 Apr 2025', n: 'MB-001', p: 'Maintenance', v: 'Alpha Security', a: '₹ 3,20,000', due: '30 Apr 2025', s: 'Paid', k: 'Maintenance' },
  { d: '27 Apr 2025', n: 'VI-002', p: 'Lift AMC', v: 'Schindler', a: '₹ 1,35,000', due: '05 May 2025', s: 'Pending', k: 'Vendor' },
  { d: '24 Apr 2025', n: 'VI-003', p: 'Electricity', v: 'Adani Power', a: '₹ 85,000', due: '10 May 2025', s: 'Pending', k: 'Vendor' },
  { d: '23 Apr 2025', n: 'VI-004', p: 'Water Charges', v: 'Jal Board', a: '₹ 45,000', due: '12 May 2025', s: 'Paid', k: 'Vendor' },
  { d: '21 Apr 2025', n: 'MB-005', p: 'Maintenance', v: 'Tower A Residents', a: '₹ 1,10,000', due: '25 Apr 2025', s: 'Overdue', k: 'Maintenance' },
  { d: '20 Apr 2025', n: 'VI-006', p: 'Housekeeping', v: 'CleanCo', a: '₹ 85,000', due: '28 Apr 2025', s: 'Overdue', k: 'Vendor' },
  { d: '18 Apr 2025', n: 'CN-001', p: 'Credit Note', v: 'Schindler', a: '₹ 12,000', due: '—', s: 'Paid', k: 'Note' },
  { d: '16 Apr 2025', n: 'MB-007', p: 'Maintenance', v: 'Tower B Residents', a: '₹ 95,000', due: '22 Apr 2025', s: 'Paid', k: 'Maintenance' },
  { d: '14 Apr 2025', n: 'DN-002', p: 'Debit Note', v: 'Adani Power', a: '₹ 8,500', due: '—', s: 'Pending', k: 'Note' },
  { d: '12 Apr 2025', n: 'VI-008', p: 'Repairs', v: 'BuildMart', a: '₹ 65,000', due: '20 Apr 2025', s: 'Paid', k: 'Vendor' },
]

const PAGE_SIZE = 4
const typeOptions = ['All Types', ...Array.from(new Set(bills.map((b) => b.p)))]
const statusOptions = ['All Status', 'Paid', 'Pending', 'Overdue']

// Status -> colour
const statusColor: Record<string, string> = {
  Paid: GREEN,
  Pending: ORANGE,
  Overdue: RED,
}

// Shared table header / cell styles
const th = 'whitespace-nowrap bg-white/[0.04] px-2 py-2 font-medium first:rounded-l-md last:rounded-r-md'
const td = 'border-t border-[#272D39] px-2 py-2.5'

// Table wrapper: horizontal scroll only inside the card, never a vertical scrollbar
const tableWrap = 'thin-scroll w-full overflow-x-auto overflow-y-hidden'

// Shared dropdown / input style
const field =
  'rounded-lg border border-[#272D39] bg-[#10131A] px-3 py-2 text-xs text-slate-200 outline-none focus:border-[#8B85FF]'

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
export default function BillsInvoicesPage() {
  const [tab, setTab] = useState<TabLabel>('All Bills')
  const [query, setQuery] = useState('')
  const [type, setType] = useState('All Types')
  const [status, setStatus] = useState('All Status')
  const [page, setPage] = useState(1)
  // Controls the Add Bill drawer (open / closed)
  const [addOpen, setAddOpen] = useState(false)

  // Apply tab + search + dropdown filters
  const filtered = useMemo(() => {
    const kind = tabs.find((t) => t.l === tab)?.k ?? 'All'
    const q = query.trim().toLowerCase()
    return bills.filter((b) => {
      if (kind !== 'All' && b.k !== kind) return false
      if (type !== 'All Types' && b.p !== type) return false
      if (status !== 'All Status' && b.s !== status) return false
      if (q && !`${b.n} ${b.p} ${b.v}`.toLowerCase().includes(q)) return false
      return true
    })
  }, [tab, query, type, status])

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const current = Math.min(page, pages)
  const rows = filtered.slice((current - 1) * PAGE_SIZE, current * PAGE_SIZE)

  // Any filter change goes back to page 1
  const reset = <T,>(set: (v: T) => void) => (v: T) => {
    set(v)
    setPage(1)
  }

  // Called when the drawer form is saved (as a draft or as a submitted bill)
  const handleSaveBill = (data: BillPayload) => {
    // TODO: call the API here, then refresh the bills list / stat cards
    console.log('Bill saved:', data)
  }

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
          <h1 className="text-xl font-bold sm:text-2xl">Bills &amp; Invoices</h1>
          <p className="text-xs text-slate-400">Manage all bills, invoices and payment status.</p>
        </motion.div>

        {/* Mobile: full-width button. 480px+: auto width */}
        <motion.div
          variants={item}
          className="flex w-full flex-col gap-2 min-[480px]:w-auto min-[480px]:flex-row min-[480px]:items-center"
        >
          {/* Add Bill: same style as Accounting "Add Transaction" button, opens the drawer */}
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-linear-to-r from-[#6C63FF] to-[#4DA3FF] px-4 py-2.5 text-xs font-semibold text-white transition hover:opacity-90 active:scale-95 min-[480px]:w-auto"
          >
            <Plus className="h-3.5 w-3.5" /> Add Bill
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
          {tabs.map(({ l }) => {
            const active = l === tab
            return (
              <button
                key={l}
                type="button"
                onClick={() => reset(setTab)(l)}
                className={`shrink-0 whitespace-nowrap border-b-2 px-3 py-2.5 text-xs font-semibold transition-colors sm:px-4 ${
                  active
                    ? 'border-[#8B85FF] text-[#A29CFF]'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                {l}
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

      {/* Bills table */}
      <motion.div variants={item} initial="hidden" whileInView="show" viewport={VIEWPORT} className="min-w-0">
        <Card title={tab} sub={`${filtered.length} ${filtered.length === 1 ? 'record' : 'records'} found`}>
          {/* Filters: stacked on mobile, one row on 480px+ */}
          <div className="mb-4 flex flex-col gap-2 min-[480px]:flex-row">
            <div className="relative min-w-0 flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
              <input
                type="text"
                value={query}
                onChange={(e) => reset(setQuery)(e.target.value)}
                placeholder="Search bills..."
                className={`${field} w-full pl-9 placeholder:text-slate-500`}
              />
            </div>
            <select
              value={type}
              onChange={(e) => reset(setType)(e.target.value)}
              className={`${field} w-full min-[480px]:w-auto`}
            >
              {typeOptions.map((o) => (
                <option key={o} value={o} className="bg-[#10131A]">{o}</option>
              ))}
            </select>
            <select
              value={status}
              onChange={(e) => reset(setStatus)(e.target.value)}
              className={`${field} w-full min-[480px]:w-auto`}
            >
              {statusOptions.map((o) => (
                <option key={o} value={o} className="bg-[#10131A]">{o}</option>
              ))}
            </select>
          </div>

          <div className={tableWrap}>
            <table className="w-full min-w-[720px] text-left text-[11px]">
              <thead className="text-slate-400">
                <tr>
                  <th className={th}>Date</th>
                  <th className={th}>Bill No.</th>
                  <th className={th}>Particulars</th>
                  <th className={th}>Vendor</th>
                  <th className={th}>Amount</th>
                  <th className={th}>Due Date</th>
                  <th className={th}>Status</th>
                  <th className={th}>Action</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={8} className={`${td} py-8 text-center text-slate-500`}>
                      No bills match your filters.
                    </td>
                  </tr>
                )}
                {rows.map((b) => (
                  <tr key={b.n}>
                    <td className={`${td} whitespace-nowrap text-slate-400`}>{b.d}</td>
                    <td className={`${td} whitespace-nowrap font-medium`}>{b.n}</td>
                    <td className={`${td} whitespace-nowrap`}>{b.p}</td>
                    <td className={`${td} whitespace-nowrap text-slate-400`}>{b.v}</td>
                    <td className={`${td} whitespace-nowrap font-medium`}>{b.a}</td>
                    <td className={`${td} whitespace-nowrap text-slate-400`}>{b.due}</td>
                    <td className={td}><Pill c={statusColor[b.s]}>{b.s}</Pill></td>
                    <td className={td}>
                      <button
                        type="button"
                        aria-label={`View ${b.n}`}
                        className="flex h-6 w-6 items-center justify-center rounded-md border border-[#272D39] text-slate-300 hover:bg-white/5"
                      >
                        <Eye className="h-3 w-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
            <div className="flex flex-wrap items-center justify-center gap-1">
              <button
                type="button"
                disabled={current === 1}
                onClick={() => setPage(current - 1)}
                aria-label="Previous page"
                className="flex h-7 w-7 items-center justify-center rounded-md border border-[#272D39] text-slate-300 hover:bg-white/5 disabled:opacity-40"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              {Array.from({ length: pages }, (_, i) => i + 1).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPage(p)}
                  className={`flex h-7 min-w-7 items-center justify-center rounded-md px-2 text-[11px] font-semibold ${
                    p === current
                      ? 'bg-[#6D5DF6] text-white'
                      : 'border border-[#272D39] text-slate-300 hover:bg-white/5'
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                type="button"
                disabled={current === pages}
                onClick={() => setPage(current + 1)}
                aria-label="Next page"
                className="flex h-7 w-7 items-center justify-center rounded-md border border-[#272D39] text-slate-300 hover:bg-white/5 disabled:opacity-40"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
            <button
              type="button"
              onClick={() => {
                setQuery('')
                setType('All Types')
                setStatus('All Status')
                setPage(1)
              }}
              className="text-[11px] text-[#A29CFF] hover:underline"
            >
              View All
            </button>
          </div>
        </Card>
      </motion.div>

      {/* Add Bill drawer (opens from the "Add Bill" button) */}
      <AddBillModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSave={handleSaveBill}
      />
    </div>
  )
}