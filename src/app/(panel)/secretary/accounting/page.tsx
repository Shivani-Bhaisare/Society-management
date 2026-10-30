'use client'

import { useEffect, useState } from 'react' // NEW
import { AnimatePresence, motion, type Variants } from 'framer-motion'
import {
  Plus, ChevronDown, Download, TrendingUp, TrendingDown, Wallet, Receipt,
  CheckCircle2, X,
} from 'lucide-react'
import { Card, Badge } from '@/Components/ui'
import AddTransactionModal from '@/Components/AddTransactionModal' // NEW

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

// Animated wrapper around Card: keeps the card filling the full grid cell height
const cellClass = 'h-full [&>*]:h-full'

/* ---------- Data (replace with API later) ---------- */

// Top summary cards
const stats = [
  { label: 'Total Income', value: '₹ 12.50 L', sub: '↑ 12% vs last month', subC: 'text-emerald-400', icon: TrendingUp, c: '#00C2B8' },
  { label: 'Total Expense', value: '₹ 7.80 L', sub: '↑ 8% vs last month', subC: 'text-red-400', icon: TrendingDown, c: '#EF4444' },
  { label: 'Net Balance', value: '₹ 4.70 L', sub: '↑ 15% vs last month', subC: 'text-emerald-400', icon: Wallet, c: '#3B82F6' },
  { label: 'Pending Bills', value: '₹ 1.20 L', sub: '18 bills pending', subC: 'text-orange-400', icon: Receipt, c: '#F59E0B' },
]

// Income vs expense chart data (heights are in % of chart height)
const chart = [
  { m: 'Jan', inc: 70, exp: 45 },
  { m: 'Feb', inc: 85, exp: 55 },
  { m: 'Mar', inc: 60, exp: 40 },
  { m: 'Apr', inc: 90, exp: 60 },
  { m: 'May', inc: 75, exp: 50 },
  { m: 'Jun', inc: 95, exp: 62 },
] as const

// Y-axis labels for the bar chart
const yAxis = ['₹10L', '₹8L', '₹6L', '₹4L', '₹2L', '0'] as const

// Expense breakdown (percent values drive the donut)
const breakdown = [
  ['Security', 35, '#00C2B8'],
  ['Staff', 25, '#3B82F6'],
  ['Electricity', 15, '#F59E0B'],
  ['Maintenance', 15, '#EF4444'],
  ['Other', 10, '#8B5CF6'],
] as const

// Recent transactions table
const txns = [
  { d: '07 Oct 2026', t: 'Maintenance', c: 'Income', a: '₹ 45,000', ty: 'Credit', tyt: 'green' },
  { d: '06 Oct 2026', t: 'Lift AMC', c: 'Maintenance', a: '₹ 18,000', ty: 'Debit', tyt: 'red' },
  { d: '05 Oct 2026', t: 'Security Salary', c: 'Staff', a: '₹ 85,000', ty: 'Debit', tyt: 'red' },
  { d: '04 Oct 2026', t: 'Hall Booking', c: 'Income', a: '₹ 8,000', ty: 'Credit', tyt: 'green' },
] as const

// One transaction row
type Txn = (typeof txns)[number]

// Which popup is open (null = none)
type ModalState =
  | { type: 'view'; txn: Txn }
  | { type: 'all' }
  | null

// Shared table header / cell styles (same as dashboard)
const th = 'bg-white/[0.04] px-2 py-2 font-medium first:rounded-l-md last:rounded-r-md'
const td = 'border-t border-[#272D39] px-2 py-2.5'

// Build the conic-gradient string for the donut chart
const donut = (() => {
  let acc = 0
  return breakdown
    .map(([, v, c]) => {
      const from = acc
      acc += v
      return `${c} ${from}% ${acc}%`
    })
    .join(', ')
})()

/* ---------- Helpers ---------- */

// "₹ 45,000" -> 45000
const amountOf = (a: string) => Number(a.replace(/[^\d]/g, '')) || 0

// 45000 -> "₹ 45,000" (Indian digit grouping)
const fmtAmount = (n: number) => `₹ ${n.toLocaleString('en-IN')}`

// Today's date as "YYYY-MM-DD" (used in the file name)
const todayStr = () => {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

// Download the given transactions as a CSV file (opens in Excel)
const downloadCsv = (rows: readonly Txn[]) => {
  // Wrap every value in quotes and escape quotes inside it
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`
  const header = ['Date', 'Description', 'Category', 'Amount', 'Type']
  const lines = rows.map((x) => [x.d, x.t, x.c, x.a, x.ty].map(esc).join(','))
  const csv = [header.map(esc).join(','), ...lines].join('\r\n')

  // The BOM at the start makes Excel show the ₹ sign correctly
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `accounting-transactions-${todayStr()}.csv`
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

/* ---------- Shared popup parts ---------- */

// Popup shell: dark overlay + panel + header + close button (Esc and outside click also close it)
function Modal({
  title,
  sub,
  onClose,
  width = 'max-w-md',
  children,
}: {
  title: string
  sub?: string
  onClose: () => void
  width?: string
  children: React.ReactNode
}) {
  // Close on Esc + lock page scroll while the popup is open
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
      className="fixed inset-0 z-70 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.96 }}
        transition={{ duration: 0.3, ease: EASE }}
        className={`flex max-h-[90vh] w-full ${width} flex-col rounded-xl border border-[#272D39] bg-[#10131A] p-5 text-white shadow-2xl`}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-base font-bold">{title}</h2>
            {sub && <p className="truncate text-[11px] text-slate-400">{sub}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="cursor-pointer rounded-md p-1.5 text-slate-400 hover:bg-white/5 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Content (scrolls when long) */}
        <div className="mt-4 min-h-0 flex-1 overflow-y-auto">{children}</div>
      </motion.div>
    </motion.div>
  )
}

// Single Close button used at the bottom of the popups
function CloseRow({ onClose }: { onClose: () => void }) {
  return (
    <div className="mt-4 flex justify-end">
      <button
        type="button"
        onClick={onClose}
        className="cursor-pointer rounded-lg border border-[#272D39] px-4 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/5 active:scale-95"
      >
        Close
      </button>
    </div>
  )
}

// One detail row (label on the left, value on the right)
function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-[#272D39] py-2 text-[11px] first:border-t-0">
      <span className="shrink-0 text-slate-400">{label}</span>
      <span className="text-right font-medium text-slate-200">{value}</span>
    </div>
  )
}

/* ---------- View Details popup ---------- */

function ViewTxnModal({ txn, onClose }: { txn: Txn; onClose: () => void }) {
  return (
    <Modal title="Transaction Details" sub={txn.t} onClose={onClose} width="max-w-sm">
      {/* Type */}
      <div className="flex items-center justify-between rounded-lg border border-[#272D39] bg-white/3 px-3 py-2">
        <span className="text-[11px] text-slate-400">Type</span>
        <Badge tone={txn.tyt}>{txn.ty}</Badge>
      </div>

      {/* Details */}
      <div className="mt-2 rounded-lg border border-[#272D39] bg-white/3 px-3">
        <DetailRow label="Description" value={txn.t} />
        <DetailRow label="Category" value={txn.c} />
        <DetailRow label="Date" value={txn.d} />
        <DetailRow label="Amount" value={txn.a} />
      </div>

      <CloseRow onClose={onClose} />
    </Modal>
  )
}

/* ---------- View All popup ---------- */

function AllTxnsModal({
  items,
  onClose,
  onView,
}: {
  items: readonly Txn[]
  onClose: () => void
  onView: (t: Txn) => void
}) {
  // Totals shown at the top of the popup
  const credit = items.filter((x) => x.ty === 'Credit').reduce((s, x) => s + amountOf(x.a), 0)
  const debit = items.filter((x) => x.ty === 'Debit').reduce((s, x) => s + amountOf(x.a), 0)

  return (
    <Modal title="All Transactions" sub={`${items.length} transactions`} onClose={onClose} width="max-w-3xl">
      {/* Totals */}
      <div className="mb-3 grid grid-cols-2 gap-2">
        <div className="flex items-center justify-between rounded-lg border border-[#272D39] bg-white/3 px-3 py-2">
          <span className="text-[11px] text-slate-400">Total Credit</span>
          <span className="text-xs font-semibold text-emerald-400">{fmtAmount(credit)}</span>
        </div>
        <div className="flex items-center justify-between rounded-lg border border-[#272D39] bg-white/3 px-3 py-2">
          <span className="text-[11px] text-slate-400">Total Debit</span>
          <span className="text-xs font-semibold text-red-400">{fmtAmount(debit)}</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-left text-[11px]">
          <thead className="text-slate-400">
            <tr>
              <th className={th}>Date</th>
              <th className={th}>Description</th>
              <th className={th}>Category</th>
              <th className={th}>Amount</th>
              <th className={th}>Type</th>
              <th className={th} />
            </tr>
          </thead>
          <tbody>
            {items.map((x) => (
              <tr key={`${x.d}-${x.t}`}>
                <td className={`${td} text-slate-400`}>{x.d}</td>
                <td className={`${td} font-medium`}>{x.t}</td>
                <td className={`${td} text-slate-400`}>{x.c}</td>
                <td className={`${td} font-medium`}>{x.a}</td>
                <td className={td}><Badge tone={x.tyt}>{x.ty}</Badge></td>
                <td className={td}>
                  {/* View: opens the transaction details popup */}
                  <button
                    type="button"
                    onClick={() => onView(x)}
                    className="cursor-pointer rounded-md border border-[#272D39] px-2.5 py-1 text-[10px] text-slate-300 hover:bg-white/5"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}

            {/* Empty state */}
            {items.length === 0 && (
              <tr>
                <td colSpan={6} className={`${td} py-8 text-center text-slate-500`}>
                  No transactions found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <CloseRow onClose={onClose} />
    </Modal>
  )
}

/* ---------- Page ---------- */
export default function AccountingPage() {
  // NEW: controls the Add Transaction drawer
  const [openTxn, setOpenTxn] = useState(false)

  // Popup that is open (null = closed)
  const [modal, setModal] = useState<ModalState>(null)
  const close = () => setModal(null)

  // Small success message after an action
  const [toast, setToast] = useState('')

  // Hide the success message after 3 seconds
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 3000)
    return () => clearTimeout(t)
  }, [toast])

  // Export: download the transactions as a CSV file (replace with an API / server export later)
  const handleExport = () => {
    if (txns.length === 0) {
      setToast('No transactions to export')
      return
    }
    downloadCsv(txns)
    setToast(`${txns.length} transactions exported`)
  }

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
          <h1 className="text-xl font-bold sm:text-2xl">Accounting</h1>
          <p className="text-xs text-slate-400">Track income, expenses and overall financial health</p>
        </motion.div>
        {/* Primary button: gradient #6C63FF -> #4DA3FF (NEW: opens the drawer) */}
        <motion.div variants={item}>
          <button
            type="button"
            onClick={() => setOpenTxn(true)}
            className="flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-linear-to-r from-[#6C63FF] to-[#4DA3FF] px-4 py-2.5 text-xs font-semibold text-white transition hover:opacity-90 active:scale-95"
          >
            <Plus className="h-3.5 w-3.5" /> Add Transaction
          </button>
        </motion.div>
      </motion.div>

      {/* Filters bar */}
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
        className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center"
      >
        {/* Period select */}
        <motion.div variants={item} className="relative">
          <select className="w-full appearance-none rounded-lg border border-[#272D39] bg-[#10131A] py-2 pl-3 pr-8 text-xs text-slate-300 focus:outline-none sm:w-40">
            <option>This Month</option>
            <option>Last Month</option>
            <option>This Quarter</option>
            <option>This Year</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        </motion.div>

        {/* Financial year select */}
        <motion.div variants={item} className="relative">
          <select className="w-full appearance-none rounded-lg border border-[#272D39] bg-[#10131A] py-2 pl-3 pr-8 text-xs text-slate-300 focus:outline-none sm:w-40">
            <option>FY 2026-27</option>
            <option>FY 2025-26</option>
            <option>FY 2024-25</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        </motion.div>

        {/* Export: downloads the transactions as a CSV file */}
        <motion.button
          variants={item}
          type="button"
          onClick={handleExport}
          className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-[#272D39] bg-[#10131A] px-3 py-2 text-xs text-slate-300 hover:bg-white/5"
        >
          <Download className="h-4 w-4" /> Export
        </motion.button>
      </motion.div>

      {/* Stat cards (same card size as Dashboard cards) */}
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
        className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 lg:grid-cols-4"
      >
        {stats.map(({ label, value, sub, subC, icon: Icon, c }) => (
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
            <p className={`mt-1 truncate text-[10px] ${subC}`}>{sub}</p>
            <span className="absolute inset-x-0 bottom-0 h-[3px]" style={{ background: c }} />
          </motion.div>
        ))}
      </motion.div>

      {/* Charts: Income vs Expense + Expense Breakdown */}
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
        className="grid grid-cols-1 gap-4 xl:grid-cols-3"
      >
        <motion.div variants={item} className="xl:col-span-2">
          <Card
            title="Income vs Expense" sub="Last 6 months"
            action={
              <div className="flex items-center gap-3 text-[10px] text-slate-400">
                <span className="flex items-center gap-1">
                  <i className="h-2 w-2 rounded-sm bg-[#00C2B8]" /> Income
                </span>
                <span className="flex items-center gap-1">
                  <i className="h-2 w-2 rounded-sm bg-[#3B82F6]" /> Expense
                </span>
              </div>
            }
          >
            <div className="flex gap-2">
              {/* Y-axis labels */}
              <div className="flex h-44 flex-col justify-between pb-0.5 text-[9px] text-slate-500">
                {yAxis.map((y) => <span key={y}>{y}</span>)}
              </div>

              {/* Bars (pure CSS) */}
              <div className="flex h-44 flex-1 items-end justify-around gap-2 border-b border-[#272D39]">
                {chart.map(({ m, inc, exp }) => (
                  <div key={m} className="flex h-full flex-1 items-end justify-center gap-1">
                    <div className="w-full max-w-[14px] rounded-t-sm bg-[#00C2B8]" style={{ height: `${inc}%` }} />
                    <div className="w-full max-w-[14px] rounded-t-sm bg-[#3B82F6]" style={{ height: `${exp}%` }} />
                  </div>
                ))}
              </div>
            </div>

            {/* X-axis labels */}
            <div className="ml-8 mt-2 flex justify-around text-[10px] text-slate-400">
              {chart.map(({ m }) => <span key={m} className="flex-1 text-center">{m}</span>)}
            </div>
          </Card>
        </motion.div>

        <motion.div variants={item} className={cellClass}>
          <Card title="Expense Breakdown" sub="Current month">
            <div className="flex flex-col items-center gap-4 min-[480px]:flex-row xl:flex-col 2xl:flex-row">
              {/* Donut (conic-gradient) */}
              <div
                className="relative h-32 w-32 shrink-0 rounded-full"
                style={{ background: `conic-gradient(${donut})` }}
              >
                {/* Inner hole */}
                <div className="absolute inset-4 flex flex-col items-center justify-center rounded-full bg-[#10131A]">
                  <span className="text-sm font-bold">₹ 7.80</span>
                  <span className="text-[9px] text-slate-400">Lakh</span>
                </div>
              </div>

              {/* Legend */}
              <ul className="flex w-full flex-col gap-1.5">
                {breakdown.map(([n, v, c]) => (
                  <li key={n} className="flex items-center gap-2 text-[11px]">
                    <i className="h-2 w-2 shrink-0 rounded-full" style={{ background: c }} />
                    <span className="flex-1 text-slate-300">{n}</span>
                    <span className="text-slate-400">{v}%</span>
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        </motion.div>
      </motion.div>

      {/* Recent transactions */}
      <motion.div
        variants={item}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
      >
        <Card
          title="Recent Transactions" sub="Latest income and expense entries"
          action={
            // View All: opens the all transactions popup
            <button
              type="button"
              onClick={() => setModal({ type: 'all' })}
              className="cursor-pointer text-[11px] text-[#A29CFF] hover:underline"
            >
              View All
            </button>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-[11px]">
              <thead className="text-slate-400">
                <tr>
                  <th className={th}>Date</th>
                  <th className={th}>Description</th>
                  <th className={th}>Category</th>
                  <th className={th}>Amount</th>
                  <th className={th}>Type</th>
                  <th className={th} />
                </tr>
              </thead>
              <tbody>
                {txns.map((x) => (
                  <tr key={`${x.d}-${x.t}`}>
                    <td className={`${td} text-slate-400`}>{x.d}</td>
                    <td className={`${td} font-medium`}>{x.t}</td>
                    <td className={`${td} text-slate-400`}>{x.c}</td>
                    <td className={`${td} font-medium`}>{x.a}</td>
                    <td className={td}><Badge tone={x.tyt}>{x.ty}</Badge></td>
                    <td className={td}>
                      {/* View: opens the transaction details popup */}
                      <button
                        type="button"
                        aria-label={`View details of ${x.t}`}
                        onClick={() => setModal({ type: 'view', txn: x })}
                        className="cursor-pointer rounded-md border border-[#272D39] px-2.5 py-1 text-[10px] text-slate-300 hover:bg-white/5"
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </motion.div>

      {/* NEW: Add Transaction drawer */}
      <AddTransactionModal
        open={openTxn}
        onClose={() => setOpenTxn(false)}
        onSave={(data) => {
          console.log('New transaction:', data) // TODO: add the API call here
        }}
      />

      {/* Popups */}
      <AnimatePresence>
        {modal?.type === 'view' && (
          <ViewTxnModal
            key={`view-${modal.txn.d}-${modal.txn.t}`}
            txn={modal.txn}
            onClose={close}
          />
        )}

        {modal?.type === 'all' && (
          <AllTxnsModal
            key="all-txns"
            items={txns}
            onClose={close}
            onView={(t) => setModal({ type: 'view', txn: t })}
          />
        )}
      </AnimatePresence>

      {/* Success message */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="fixed right-4 top-20 z-80 flex max-w-[90vw] items-center gap-2 rounded-lg border border-emerald-500/30 bg-[#10131A] px-4 py-3 text-xs text-emerald-400 shadow-xl"
          >
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}