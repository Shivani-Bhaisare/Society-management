'use client'

import { useMemo, useState } from 'react'
import { motion, type Variants } from 'framer-motion'
import {
  Wallet, FileText, Clock, CheckCircle2, XCircle, Plus, Search,
  Pencil, Send, Trash2, ChevronLeft, ChevronRight, type LucideIcon,
} from 'lucide-react'
import { Card } from '@/Components/ui'
import AddExpenseModal, { type ExpensePayload } from '@/Components/AddExpenseModal' // ADDED: adjust the path to your folder

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
const SLATE = '#94A3B8'

/* ---------- Data (replace with API data later) ---------- */

type Status = 'draft' | 'pending' | 'approved' | 'rejected'
type Filter = 'all' | Status

// Status list (label + colour + icon used in the cards and the badges)
const statuses: { k: Status; l: string; c: string; i: LucideIcon }[] = [
  { k: 'draft', l: 'Draft', c: SLATE, i: FileText },
  { k: 'pending', l: 'Pending', c: ORANGE, i: Clock },
  { k: 'approved', l: 'Approved', c: GREEN, i: CheckCircle2 },
  { k: 'rejected', l: 'Rejected', c: RED, i: XCircle },
]

type Report = { name: string; date: string }

type Expense = {
  id: number
  status: Status
  date: string // YYYY-MM-DD
  merchant: string
  note: string
  category: string
  amount: number // stored in paise (9.58 rupees = 958)
  report: Report | null
}

// Fixed sample rows (no random values, so server and client always match)
const initialExpenses: Expense[] = [
  { id: 1, status: 'draft', date: '2026-04-26', merchant: 'ALBETOS', note: '', category: 'Recruitment Expenses', amount: 958, report: { name: 'April 2026', date: '2026-04-26' } },
  { id: 2, status: 'draft', date: '2026-04-10', merchant: 'POP TATES KORUK HALL', note: 'Client meeting', category: 'Meals & Entertainment', amount: 52300, report: { name: 'April 2026', date: '2026-04-26' } },
  { id: 3, status: 'draft', date: '2026-04-09', merchant: 'GENERAL POOR’S TAVERN', note: '', category: 'Travel', amount: 1070, report: { name: 'April 2026', date: '2026-04-26' } },
  { id: 4, status: 'pending', date: '2026-03-19', merchant: 'FALMOUTH RAW BAR', note: '', category: 'Travel', amount: 23519, report: { name: 'Expense Report - 4/27/2026', date: '2026-04-27' } },
  { id: 5, status: 'pending', date: '2026-03-14', merchant: 'CITY POWER BOARD', note: 'Tower B', category: 'Utilities', amount: 45000, report: { name: 'Expense Report - 4/27/2026', date: '2026-04-27' } },
  { id: 6, status: 'pending', date: '2026-03-02', merchant: 'OFFICE MART', note: 'Stationery', category: 'Office Supplies', amount: 6200, report: { name: 'Expense Report - 4/27/2026', date: '2026-04-27' } },
  { id: 7, status: 'draft', date: '2026-02-21', merchant: 'LIFT CARE SERVICES', note: 'AMC', category: 'Maintenance', amount: 14500, report: null },
  { id: 8, status: 'rejected', date: '2026-02-11', merchant: 'QUICK BITES CAFE', note: 'No bill attached', category: 'Meals & Entertainment', amount: 3400, report: { name: 'February 2026', date: '2026-02-28' } },
  { id: 9, status: 'approved', date: '2026-01-30', merchant: 'SAFE GUARD SECURITY', note: '', category: 'Maintenance', amount: 80000, report: { name: 'January 2026', date: '2026-01-31' } },
]

const PAGE_SIZE = 6

/* ---------- Shared styles (same as the Income page) ---------- */

// Table header / cell styles
const th = 'whitespace-nowrap bg-white/4 px-2 py-2 font-medium first:rounded-l-md last:rounded-r-md'
const td = 'border-t border-[#272D39] px-2 py-2.5'

// Table wrapper: horizontal scroll only inside the card, never a vertical scrollbar
const tableWrap = 'thin-scroll w-full overflow-x-auto overflow-y-hidden'

// Shared input / select style
const field =
  'w-full min-w-0 rounded-lg border border-[#272D39] bg-[#10131A] px-3 py-2 text-xs text-slate-200 outline-none placeholder:text-slate-500 focus:border-[#8B85FF] scheme-dark'

// Small uppercase form label
const label = 'mb-1.5 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wide text-slate-400'

// Gradient action button (same style as the Accounting "Add Transaction" button)
const gradBtn =
  'flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-linear-to-r from-[#6C63FF] to-[#4DA3FF] px-4 py-2.5 text-xs font-semibold text-white transition hover:opacity-90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100'

// Outlined secondary button
const ghostBtn =
  'flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-[#272D39] bg-[#10131A] px-4 py-2.5 text-xs font-semibold text-slate-300 transition-colors hover:bg-white/5 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:active:scale-100'

// Small square icon button (pagination arrows)
const iconBtn =
  'flex h-7 w-7 items-center justify-center rounded-md border border-[#272D39] bg-[#10131A] text-slate-300 transition-colors hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-[#10131A]'

// Format an amount (stored in paise) as Indian rupees with 2 decimals
const money = (paise: number) =>
  `₹ ${(paise / 100).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// YYYY-MM-DD -> "Apr 26, 2026" (manual, so there is no timezone / hydration mismatch)
const fmtDate = (iso: string) => {
  const [y, m, d] = iso.split('-')
  return `${MONTHS[+m - 1]} ${+d}, ${y}`
}

// Sum helper
const sum = (list: number[]) => list.reduce((s, n) => s + n, 0)

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
export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>(initialExpenses)

  // ADDED: controls the Add Expense drawer (open / closed)
  const [addOpen, setAddOpen] = useState(false)

  // Filter state
  const [query, setQuery] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [status, setStatus] = useState<Filter>('all')

  // Table state
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Set<number>>(new Set())

  // Run a filter update and jump back to the first page
  const setFilter = (fn: () => void) => {
    fn()
    setPage(1)
  }

  const clearFilters = () => {
    setQuery('')
    setFrom('')
    setTo('')
    setStatus('all')
    setPage(1)
  }

  // Rows after the search + date filters (the status filter is applied later,
  // so the status cards always show the numbers for the current search / dates)
  const base = useMemo(() => {
    const q = query.trim().toLowerCase()
    return expenses
      .filter(
        (e) =>
          (!from || e.date >= from) &&
          (!to || e.date <= to) &&
          (!q || e.merchant.toLowerCase().includes(q) || e.category.toLowerCase().includes(q)),
      )
      .sort((a, b) => b.date.localeCompare(a.date) || b.id - a.id)
  }, [expenses, query, from, to])

  // Rows after the status filter too
  const shown = useMemo(() => (status === 'all' ? base : base.filter((e) => e.status === status)), [base, status])

  // Summary cards: count + amount per status
  const stat = (k: Status) => {
    const list = base.filter((e) => e.status === k)
    return { count: list.length, amt: sum(list.map((e) => e.amount)) }
  }

  const cards: { k: Filter; l: string; v: string; sub: string; c: string; i: LucideIcon }[] = [
    { k: 'all', l: 'Total Expenses', v: money(sum(base.map((e) => e.amount))), sub: `${base.length} ${base.length === 1 ? 'expense' : 'expenses'}`, c: BLUE, i: Wallet },
    ...statuses.map((s) => ({
      k: s.k as Filter,
      l: s.l,
      v: String(stat(s.k).count),
      sub: money(stat(s.k).amt),
      c: s.c,
      i: s.i,
    })),
  ]

  // Pagination
  const pages = Math.max(1, Math.ceil(shown.length / PAGE_SIZE))
  const cur = Math.min(page, pages)
  const rows = shown.slice((cur - 1) * PAGE_SIZE, cur * PAGE_SIZE)

  // Selection helpers
  const allOnPage = rows.length > 0 && rows.every((r) => selected.has(r.id))
  const toggleAll = () =>
    setSelected((prev) => {
      const n = new Set(prev)
      if (allOnPage) rows.forEach((r) => n.delete(r.id))
      else rows.forEach((r) => n.add(r.id))
      return n
    })
  const toggleOne = (id: number) =>
    setSelected((prev) => {
      const n = new Set(prev)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })

  const selectedDrafts = expenses.filter((e) => selected.has(e.id) && e.status === 'draft').length

  // Send the selected drafts for approval
  const submitSelected = () => {
    const today = new Date().toISOString().slice(0, 10)
    setExpenses((list) =>
      list.map((x) =>
        selected.has(x.id) && x.status === 'draft'
          ? { ...x, status: 'pending', report: { name: `Expense Report - ${fmtDate(today)}`, date: today } }
          : x,
      ),
    )
    setSelected(new Set())
  }

  // Delete the selected rows
  const deleteSelected = () => {
    setExpenses((list) => list.filter((x) => !selected.has(x.id)))
    setSelected(new Set())
  }

  // ADDED: called when the drawer form is submitted
  const handleSaveExpense = (data: ExpensePayload) => {
    // TODO: call the API here, then refresh the expenses list / summary cards
    console.log('Expense saved:', data)
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
          <h1 className="text-xl font-bold sm:text-2xl">All Expenses</h1>
          <p className="text-xs text-slate-400">Track, submit and review every expense</p>
        </motion.div>

        {/* Add expense button (opens the drawer; full width on mobile) */}
        <motion.button
          variants={item}
          type="button"
          onClick={() => setAddOpen(true)} // ADDED: open the Add Expense drawer
          className={`${gradBtn} w-full md:w-auto`}
        >
          <Plus className="h-3.5 w-3.5" /> Add Expense
        </motion.button>
      </motion.div>

      {/* ---------- Summary cards (click a card to filter by status) ---------- */}
      {/* Same look as the Funds page cards: 1 column on mobile, 2 on small screens, 4 on extra-large screens.
          The 5th card wraps onto the next row. No hover effect, no selected border. */}
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
        className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 xl:grid-cols-4"
      >
        {cards.map(({ k, l, v, sub, c, i: Icon }) => {
          const active = status === k
          return (
            <motion.button
              key={l}
              variants={item}
              type="button"
              onClick={() => setFilter(() => setStatus(active && k !== 'all' ? 'all' : k))}
              aria-pressed={active}
              className="relative min-w-0 cursor-pointer overflow-hidden rounded-xl border border-[#272D39] bg-[#10131A] p-4 text-left"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-[11px] text-slate-400">{l}</span>
                {/* Icon box uses the same tinted background + colour as the Funds cards */}
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                  style={{ background: `${c}26`, color: c }}
                >
                  <Icon className="h-4 w-4" />
                </span>
              </div>
              <p className="mt-3 truncate text-xl font-bold min-[480px]:text-2xl">{v}</p>
              <p className="mt-1 truncate text-[10px] text-slate-400">{sub}</p>
              {/* Coloured line at the bottom of the card */}
              <span className="absolute inset-x-0 bottom-0 h-0.75" style={{ background: c }} />
            </motion.button>
          )
        })}
      </motion.div>

      {/* ---------- Filters ---------- */}
      <motion.div variants={item} initial="hidden" whileInView="show" viewport={VIEWPORT} className="min-w-0">
        <Card
          title="Filter" sub="Search and narrow down the expenses"
          action={
            <button type="button" onClick={clearFilters} className="text-[11px] text-[#A29CFF] hover:underline">
              Clear Filters
            </button>
          }
        >
          {/* 1 column on mobile, 2 on small, 3 on large screens */}
          <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 lg:grid-cols-3">
            <div className="min-w-0 min-[480px]:col-span-2 lg:col-span-1">
              <label className={label}><Search className="h-3 w-3" /> Search</label>
              <input
                type="text"
                value={query}
                onChange={(e) => setFilter(() => setQuery(e.target.value))}
                placeholder="Search expenses..."
                className={field}
              />
            </div>
            <div className="min-w-0">
              <label className={label}>From</label>
              <input
                type="date"
                value={from}
                onChange={(e) => setFilter(() => setFrom(e.target.value))}
                className={field}
              />
            </div>
            <div className="min-w-0">
              <label className={label}>To</label>
              <input
                type="date"
                value={to}
                onChange={(e) => setFilter(() => setTo(e.target.value))}
                className={field}
              />
            </div>
          </div>
        </Card>
      </motion.div>

      {/* ---------- Expenses table ---------- */}
      <motion.div variants={item} initial="hidden" whileInView="show" viewport={VIEWPORT} className="min-w-0">
        <Card
          title="Expenses"
          sub={`${shown.length} ${shown.length === 1 ? 'expense' : 'expenses'} found`}
        >
          {/* Toolbar: pagination on the left, bulk actions on the right (stacks on mobile) */}
          <div className="mb-3 flex flex-col gap-3 min-[480px]:flex-row min-[480px]:items-center min-[480px]:justify-between">
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span>Page {cur} of {pages}</span>
              <button
                type="button"
                onClick={() => setPage(cur - 1)}
                disabled={cur <= 1}
                aria-label="Previous page"
                className={iconBtn}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setPage(cur + 1)}
                disabled={cur >= pages}
                aria-label="Next page"
                className={iconBtn}
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="flex flex-col gap-2 min-[480px]:flex-row">
              <button
                type="button"
                onClick={deleteSelected}
                disabled={selected.size === 0}
                className={ghostBtn}
              >
                <Trash2 className="h-3.5 w-3.5 text-red-400" /> Delete{selected.size > 0 ? ` (${selected.size})` : ''}
              </button>
              <button
                type="button"
                onClick={submitSelected}
                disabled={selectedDrafts === 0}
                className={gradBtn}
              >
                <Send className="h-3.5 w-3.5" /> Submit{selectedDrafts > 0 ? ` (${selectedDrafts})` : ''}
              </button>
            </div>
          </div>

          {/* Table scrolls sideways inside the card on small screens */}
          <div className={tableWrap}>
            <table className="w-full min-w-215 text-left text-[11px]">
              <thead className="text-slate-400">
                <tr>
                  <th className={`${th} w-8`}>
                    <input
                      type="checkbox"
                      checked={allOnPage}
                      onChange={toggleAll}
                      aria-label="Select all rows on this page"
                      className="h-3.5 w-3.5 cursor-pointer accent-[#8B85FF]"
                    />
                  </th>
                  <th className={th}>Status</th>
                  <th className={th}>Date</th>
                  <th className={th}>Merchant</th>
                  <th className={th}>Category</th>
                  <th className={`${th} text-right`}>Amount</th>
                  <th className={th}>Report</th>
                  <th className={th}>Edit</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={8} className={`${td} py-8 text-center text-slate-500`}>
                      No expenses match your filters.
                    </td>
                  </tr>
                )}

                {rows.map((e, idx) => {
                  const s = statuses.find((x) => x.k === e.status)!
                  const isSel = selected.has(e.id)
                  return (
                    // Rows fade in one after another
                    <motion.tr
                      key={e.id}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.5, ease: EASE, delay: idx * 0.04 }}
                      className={`transition-colors hover:bg-white/3 ${isSel ? 'bg-[#8B85FF]/10' : ''}`}
                    >
                      <td className={td}>
                        <input
                          type="checkbox"
                          checked={isSel}
                          onChange={() => toggleOne(e.id)}
                          aria-label={`Select ${e.merchant}`}
                          className="h-3.5 w-3.5 cursor-pointer accent-[#8B85FF]"
                        />
                      </td>
                      <td className={td}><Pill c={s.c}>{s.l}</Pill></td>
                      <td className={`${td} whitespace-nowrap text-slate-400`}>{fmtDate(e.date)}</td>
                      <td className={td}>
                        <span className="block max-w-44 truncate font-medium">{e.merchant}</span>
                        {e.note && <span className="block max-w-44 truncate text-[10px] text-slate-500">{e.note}</span>}
                      </td>
                      <td className={td}>
                        <span className="block max-w-56 truncate text-slate-300">{e.category}</span>
                      </td>
                      <td className={`${td} whitespace-nowrap text-right font-bold`}>{money(e.amount)}</td>
                      <td className={td}>
                        {e.report ? (
                          <>
                            <span className="block max-w-44 truncate font-medium">{e.report.name}</span>
                            <span className="block text-[10px] text-slate-500">{fmtDate(e.report.date)}</span>
                          </>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>
                      <td className={td}>
                        {/* Only drafts show Edit (display only for now, no form opens) */}
                        {e.status === 'draft' ? (
                          <button
                            type="button"
                            aria-label={`Edit ${e.merchant}`}
                            className="flex items-center gap-1 text-[11px] font-semibold text-[#A29CFF] hover:underline"
                          >
                            <Pencil className="h-3 w-3" /> Edit
                          </button>
                        ) : (
                          <span className="text-slate-500">—</span>
                        )}
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </motion.div>

      {/* ADDED: Add Expense drawer (opens from the "Add Expense" button) */}
      <AddExpenseModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSave={handleSaveExpense}
      />
    </div>
  )
}