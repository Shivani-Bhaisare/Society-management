'use client'

import { Fragment, useMemo, useState } from 'react'
import { AnimatePresence, motion, type Variants } from 'framer-motion'
import {
  Wallet, ArrowUpRight, Landmark, AlertCircle, CheckCircle2,
  ChevronLeft, ChevronRight, Search, Download, Link2, type LucideIcon,
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
const PURPLE = '#8B85FF'

/* ---------- Data (replace with API data later) ---------- */

type ChannelKey = 'upi' | 'card' | 'netbanking' | 'cash'
type YN = 'all' | 'yes' | 'no'

// Payment channels (label + colour used in the badge)
const channels: { k: ChannelKey; l: string; c: string }[] = [
  { k: 'upi', l: 'UPI', c: BLUE },
  { k: 'card', l: 'Card', c: PURPLE },
  { k: 'netbanking', l: 'Net Banking', c: ORANGE },
  { k: 'cash', l: 'Cash', c: GREEN },
]

type Tx = {
  id: string // transaction id
  txnDate: string // YYYY-MM-DD
  settleDate: string // YYYY-MM-DD
  payoutDate: string // YYYY-MM-DD or '' when not paid out yet
  amount: number // amount charged
  receipt: number // amount received (0 until settled)
  payout: number // amount paid out (0 until paid out)
  channel: ChannelKey
  settled: boolean
  paidOut: boolean
  reconciled: boolean
}

// Add days to an ISO date (YYYY-MM-DD)
const addDays = (iso: string, n: number) => new Date(Date.parse(iso) + n * 86400000).toISOString().slice(0, 10)

// Build fixed sample rows (no random values, so server and client always match)
const sampleTx: Tx[] = Array.from({ length: 26 }, (_, i) => {
  const txnDate = addDays('2026-10-01', i % 14)
  const settled = i % 5 !== 4
  const paidOut = settled && i % 4 !== 3
  const amount = 1500 + ((i * 3700) % 21000)
  return {
    id: `N27422214${3783287 + i * 137}`,
    txnDate,
    settleDate: addDays(txnDate, 1),
    payoutDate: paidOut ? addDays(txnDate, 2) : '',
    amount,
    receipt: settled ? amount : 0,
    payout: paidOut ? amount : 0,
    channel: channels[i % channels.length].k,
    settled,
    paidOut,
    reconciled: paidOut && i % 2 === 0,
  }
})

const PAGE_SIZE = 8

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

// Small square icon button (pagination arrows)
const iconBtn =
  'flex h-7 w-7 items-center justify-center rounded-md border border-[#272D39] bg-[#10131A] text-slate-300 transition-colors hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-[#10131A]'

// Format a number as Indian rupees
const money = (n: number) => `₹ ${n.toLocaleString('en-IN')}`

// Show an amount, or a dash when it is zero
const moneyOrDash = (n: number) => (n > 0 ? money(n) : '—')

// YYYY-MM-DD -> DD-MM-YYYY (dash when empty)
const fmtDate = (iso: string) => (iso ? iso.split('-').reverse().join('-') : '—')

// Does a boolean value match a yes / no / all filter?
const matchYN = (v: YN, b: boolean) => v === 'all' || (v === 'yes') === b

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

// Labelled select used in the filter card
function Select({
  title, value, onChange, options,
}: {
  title: string
  value: string
  onChange: (v: string) => void
  options: { v: string; l: string }[]
}) {
  return (
    <div className="min-w-0">
      <label className={label}>{title}</label>
      <select value={value} onChange={(e) => onChange(e.target.value)} className={field}>
        {options.map((o) => (
          <option key={o.v} value={o.v} className="bg-[#10131A]">{o.l}</option>
        ))}
      </select>
    </div>
  )
}

// Options for the yes / no filters
const ynOptions = (all: string) => [
  { v: 'all', l: all },
  { v: 'yes', l: 'Yes' },
  { v: 'no', l: 'No' },
]

/* ---------- Page ---------- */
export default function BankTransactionsPage() {
  const [txs, setTxs] = useState<Tx[]>(sampleTx)

  // Filter state
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [channel, setChannel] = useState<'all' | ChannelKey>('all')
  const [reconciled, setReconciled] = useState<YN>('all')
  const [settled, setSettled] = useState<YN>('all')
  const [paidOut, setPaidOut] = useState<YN>('all')
  const [query, setQuery] = useState('')

  // Table state
  const [page, setPage] = useState(1)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [open, setOpen] = useState<string | null>(null) // id of the expanded row

  // Run a filter update and jump back to the first page
  const setFilter = (fn: () => void) => {
    fn()
    setPage(1)
  }

  const resetFilters = () => {
    setFrom('')
    setTo('')
    setChannel('all')
    setReconciled('all')
    setSettled('all')
    setPaidOut('all')
    setQuery('')
    setPage(1)
  }

  // Rows after all filters, newest transaction first
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return txs
      .filter(
        (t) =>
          (!from || t.txnDate >= from) &&
          (!to || t.txnDate <= to) &&
          (channel === 'all' || t.channel === channel) &&
          matchYN(reconciled, t.reconciled) &&
          matchYN(settled, t.settled) &&
          matchYN(paidOut, t.paidOut) &&
          (!q || t.id.toLowerCase().includes(q)),
      )
      .sort((a, b) => b.txnDate.localeCompare(a.txnDate) || a.id.localeCompare(b.id))
  }, [txs, from, to, channel, reconciled, settled, paidOut, query])

  // Summary numbers (based on the filtered rows)
  const totalReceived = filtered.reduce((s, t) => s + t.receipt, 0)
  const totalPaid = filtered.reduce((s, t) => s + t.payout, 0)
  const bankBalance = totalReceived - totalPaid
  const unreconciled = filtered.filter((t) => !t.reconciled).length

  const cards: { l: string; v: string; sub: string; c: string; i: LucideIcon }[] = [
    { l: 'Total Received', v: money(totalReceived), sub: `${filtered.filter((t) => t.settled).length} settled`, c: GREEN, i: Wallet },
    { l: 'Total Paid', v: money(totalPaid), sub: `${filtered.filter((t) => t.paidOut).length} paid out`, c: RED, i: ArrowUpRight },
    { l: 'Bank Balance', v: money(bankBalance), sub: 'Received minus paid', c: BLUE, i: Landmark },
    { l: 'Unreconciled', v: String(unreconciled), sub: 'Transactions to match', c: ORANGE, i: AlertCircle },
  ]

  // Pagination
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const cur = Math.min(page, pages)
  const rows = filtered.slice((cur - 1) * PAGE_SIZE, cur * PAGE_SIZE)

  // Selection helpers
  const allOnPage = rows.length > 0 && rows.every((r) => selected.has(r.id))
  const toggleAll = () =>
    setSelected((prev) => {
      const n = new Set(prev)
      if (allOnPage) rows.forEach((r) => n.delete(r.id))
      else rows.forEach((r) => n.add(r.id))
      return n
    })
  const toggleOne = (id: string) =>
    setSelected((prev) => {
      const n = new Set(prev)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })

  // Mark all selected rows as reconciled
  const match = () => {
    setTxs((list) => list.map((t) => (selected.has(t.id) ? { ...t, reconciled: true } : t)))
    setSelected(new Set())
  }

  // Download the filtered rows as a CSV file
  const exportCsv = () => {
    const data = [
      ['Transaction ID', 'Transaction Date', 'Settlement Date', 'Payout Date', 'Amount', 'Receipt Amount', 'Payout Amount', 'Channel', 'Reconciled'],
      ...filtered.map((t) => [
        t.id, t.txnDate, t.settleDate, t.payoutDate, t.amount, t.receipt, t.payout,
        channels.find((c) => c.k === t.channel)?.l ?? '', t.reconciled ? 'Yes' : 'No',
      ]),
    ]
    const csv = data.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
    const a = document.createElement('a')
    a.href = url
    a.download = 'bank-transactions.csv'
    a.click()
    URL.revokeObjectURL(url)
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
          <h1 className="text-xl font-bold sm:text-2xl">Payments &amp; Bank Transactions</h1>
          <p className="text-xs text-slate-400">Match society payments with bank transactions</p>
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
            {/* Coloured line at the bottom of the card */}
            <span className="absolute inset-x-0 bottom-0 h-0.75" style={{ background: c }} />
          </motion.div>
        ))}
      </motion.div>

      {/* ---------- Filters ---------- */}
      <motion.div variants={item} initial="hidden" whileInView="show" viewport={VIEWPORT} className="min-w-0">
        <Card
          title="Filter" sub="Narrow down the transactions"
          action={
            <div className="flex items-center gap-3">
              <button type="button" onClick={resetFilters} className="text-[11px] text-[#A29CFF] hover:underline">
                Reset
              </button>
              <button
                type="button"
                onClick={exportCsv}
                aria-label="Export CSV"
                className={iconBtn}
              >
                <Download className="h-3.5 w-3.5" />
              </button>
            </div>
          }
        >
          {/* 1 column on mobile, 2 on small, 3 on large, 4 on extra-large screens */}
          <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
            <Select
              title="Channel"
              value={channel}
              onChange={(v) => setFilter(() => setChannel(v as 'all' | ChannelKey))}
              options={[{ v: 'all', l: 'All Channels' }, ...channels.map((c) => ({ v: c.k, l: c.l }))]}
            />
            <Select
              title="Reconciled"
              value={reconciled}
              onChange={(v) => setFilter(() => setReconciled(v as YN))}
              options={ynOptions('All')}
            />
            <Select
              title="Settled"
              value={settled}
              onChange={(v) => setFilter(() => setSettled(v as YN))}
              options={ynOptions('All')}
            />
            <Select
              title="Paid Out"
              value={paidOut}
              onChange={(v) => setFilter(() => setPaidOut(v as YN))}
              options={ynOptions('All')}
            />
            {/* Search by transaction id */}
            <div className="min-w-0 min-[480px]:col-span-2">
              <label className={label}><Search className="h-3 w-3" /> Search</label>
              <input
                type="text"
                value={query}
                onChange={(e) => setFilter(() => setQuery(e.target.value))}
                placeholder="Search by Txn ID"
                className={field}
              />
            </div>
          </div>
        </Card>
      </motion.div>

      {/* ---------- Transactions table ---------- */}
      <motion.div variants={item} initial="hidden" whileInView="show" viewport={VIEWPORT} className="min-w-0">
        <Card
          title="Bank Transactions"
          sub={`${filtered.length} ${filtered.length === 1 ? 'transaction' : 'transactions'} found`}
        >
          {/* Toolbar: pagination on the left, Match button on the right (stacks on mobile) */}
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

            <button
              type="button"
              onClick={match}
              disabled={selected.size === 0}
              className={`${gradBtn} w-full min-[480px]:w-auto`}
            >
              <Link2 className="h-3.5 w-3.5" /> Match{selected.size > 0 ? ` (${selected.size})` : ''}
            </button>
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
                  <th className={`${th} w-6`} />
                  <th className={th}>Reconciled</th>
                  <th className={th}>Transaction ID</th>
                  <th className={th}>Transaction Date</th>
                  <th className={th}>Settlement Date</th>
                  <th className={th}>Payout Date</th>
                  <th className={th}>Amount</th>
                  <th className={th}>Receipt Amount</th>
                  <th className={th}>Payout Amount</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 && (
                  <tr>
                    <td colSpan={10} className={`${td} py-8 text-center text-slate-500`}>
                      No transactions match your filters.
                    </td>
                  </tr>
                )}

                {rows.map((t, idx) => {
                  const isSel = selected.has(t.id)
                  const isOpen = open === t.id
                  const ch = channels.find((c) => c.k === t.channel)!
                  return (
                    <Fragment key={t.id}>
                      {/* Main row (fades in one after another) */}
                      <motion.tr
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, ease: EASE, delay: idx * 0.04 }}
                        className={`transition-colors hover:bg-white/3 ${isSel ? 'bg-[#8B85FF]/10' : ''}`}
                      >
                        <td className={td}>
                          <input
                            type="checkbox"
                            checked={isSel}
                            onChange={() => toggleOne(t.id)}
                            aria-label={`Select ${t.id}`}
                            className="h-3.5 w-3.5 cursor-pointer accent-[#8B85FF]"
                          />
                        </td>
                        <td className={td}>
                          {/* Expand / collapse button */}
                          <button
                            type="button"
                            onClick={() => setOpen(isOpen ? null : t.id)}
                            aria-label={isOpen ? 'Hide details' : 'Show details'}
                            aria-expanded={isOpen}
                            className="flex h-5 w-5 items-center justify-center rounded text-slate-400 hover:bg-white/5"
                          >
                            <ChevronRight className={`h-3.5 w-3.5 transition-transform duration-300 ${isOpen ? 'rotate-90' : ''}`} />
                          </button>
                        </td>
                        <td className={td}>
                          {t.reconciled ? (
                            <CheckCircle2 className="h-4 w-4" style={{ color: GREEN }} aria-label="Reconciled" />
                          ) : (
                            <AlertCircle className="h-4 w-4" style={{ color: ORANGE }} aria-label="Not reconciled" />
                          )}
                        </td>
                        <td className={`${td} whitespace-nowrap font-medium`}>{t.id}</td>
                        <td className={`${td} whitespace-nowrap text-slate-400`}>{fmtDate(t.txnDate)}</td>
                        <td className={`${td} whitespace-nowrap text-slate-400`}>{fmtDate(t.settleDate)}</td>
                        <td className={`${td} whitespace-nowrap text-slate-400`}>{fmtDate(t.payoutDate)}</td>
                        <td className={`${td} whitespace-nowrap font-medium`}>{money(t.amount)}</td>
                        <td className={`${td} whitespace-nowrap font-medium`}>{moneyOrDash(t.receipt)}</td>
                        <td className={`${td} whitespace-nowrap font-medium`}>{moneyOrDash(t.payout)}</td>
                      </motion.tr>

                      {/* Details row (slides open under the main row) */}
                      <AnimatePresence initial={false}>
                        {isOpen && (
                          <tr>
                            <td colSpan={10} className="p-0">
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.35, ease: EASE }}
                                className="overflow-hidden"
                              >
                                <div className="m-2 grid grid-cols-2 gap-3 rounded-lg border border-[#272D39] bg-white/3 p-3 sm:grid-cols-4">
                                  <div className="min-w-0">
                                    <p className="text-[10px] text-slate-400">Channel</p>
                                    <div className="mt-1"><Pill c={ch.c}>{ch.l}</Pill></div>
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-[10px] text-slate-400">Settlement</p>
                                    <div className="mt-1">
                                      <Pill c={t.settled ? GREEN : ORANGE}>{t.settled ? 'Settled' : 'Pending'}</Pill>
                                    </div>
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-[10px] text-slate-400">Payout</p>
                                    <div className="mt-1">
                                      <Pill c={t.paidOut ? GREEN : ORANGE}>{t.paidOut ? 'Paid out' : 'Not paid'}</Pill>
                                    </div>
                                  </div>
                                  <div className="min-w-0">
                                    <p className="text-[10px] text-slate-400">Difference (Amount − Receipt)</p>
                                    <p className="mt-1 truncate text-[11px] font-semibold">{money(t.amount - t.receipt)}</p>
                                  </div>
                                </div>
                              </motion.div>
                            </td>
                          </tr>
                        )}
                      </AnimatePresence>
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </motion.div>
    </div>
  )
}