'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, type Variants } from 'framer-motion'
import {
  ArrowUp, ArrowDown, ArrowDownLeft, ArrowUpRight, ChevronDown, Eye, EyeOff, Scale, FileText, type LucideIcon,
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

/* ---------- Data (replace with API data later) ---------- */

type TabKey = 'ledger' | 'journal' | 'trial' | 'reports'
type BalanceType = 'general' | 'debit' | 'credit'
type Period = 'year' | 'month' | 'last'

// The 4 page tabs
const tabs: { k: TabKey; l: string }[] = [
  { k: 'ledger', l: 'General Ledger' },
  { k: 'journal', l: 'Journal Entries' },
  { k: 'trial', l: 'Trial Balance' },
  { k: 'reports', l: 'Reports' },
]

// Reference months used by the "This Month" / "Last Month" period filter
// (fixed values so the server and the client always render the same thing)
const THIS_MONTH = '2026-10'
const LAST_MONTH = '2026-09'

// Chart of accounts
const accounts = [
  { code: '16400000', desc: 'Loan' },
  { code: '41100003', desc: 'Client Deloitte' },
  { code: '44571200', desc: 'VAT collected' },
  { code: '51200000', desc: 'Bank account' },
  { code: '70700200', desc: 'Sales of goods' },
]

type Line = { account: string; desc: string; customer?: string; credit: number; debit: number }

type Doc = {
  docNo: string
  journal: string
  invoiceNo: string
  posting: string // YYYY-MM-DD
  created: string // YYYY-MM-DD
  ref: string
  currency: string
  origin: string
  lines: Line[]
}

// Accounting documents. Account totals and journal entries are calculated from these lines.
const docs: Doc[] = [
  {
    docNo: '2026-7120', journal: 'Sales', invoiceNo: 'F-10.26-208', posting: '2026-10-11', created: '2026-10-11',
    ref: 'F-10.26-208', currency: 'INR', origin: 'SYSTEM',
    lines: [
      { account: '41100003', desc: 'Client Deloitte', customer: 'DELOITTE', credit: 0, debit: 24000 },
      { account: '70700200', desc: 'Sales of goods', credit: 20000, debit: 0 },
      { account: '44571200', desc: 'VAT collected', credit: 4000, debit: 0 },
    ],
  },
  {
    docNo: '2026-7119', journal: 'Sales', invoiceNo: 'F-10.26-207', posting: '2026-10-08', created: '2026-10-08',
    ref: 'F-10.26-207', currency: 'INR', origin: 'SYSTEM',
    lines: [
      { account: '41100003', desc: 'Client Deloitte', customer: 'DELOITTE', credit: 0, debit: 66000 },
      { account: '70700200', desc: 'Sales of goods', credit: 55000, debit: 0 },
      { account: '44571200', desc: 'VAT collected', credit: 11000, debit: 0 },
    ],
  },
  {
    docNo: '2026-6102', journal: 'Bank', invoiceNo: 'B-09.26-102', posting: '2026-09-28', created: '2026-09-28',
    ref: 'B-09.26-102', currency: 'INR', origin: 'MANUAL',
    lines: [
      { account: '16400000', desc: 'Loan', credit: 0, debit: 25000 },
      { account: '51200000', desc: 'Bank account', credit: 25000, debit: 0 },
    ],
  },
  {
    docNo: '2026-6045', journal: 'Bank', invoiceNo: 'B-09.26-045', posting: '2026-09-21', created: '2026-09-21',
    ref: 'B-09.26-045', currency: 'INR', origin: 'MANUAL',
    lines: [
      { account: '16400000', desc: 'Loan', credit: 150000, debit: 0 },
      { account: '51200000', desc: 'Bank account', credit: 0, debit: 150000 },
    ],
  },
]

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

// Format a number as Indian rupees
const money = (n: number) => `₹ ${n.toLocaleString('en-IN')}`

// Show an amount, or a dash when it is zero
const moneyOrDash = (n: number) => (n > 0 ? money(n) : '—')

// YYYY-MM-DD -> DD-MM-YYYY
const fmtDate = (iso: string) => iso.split('-').reverse().join('-')

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

// Labelled custom dropdown used in the filter card
// (custom so the highlighted option is purple instead of the browser's default blue)
function Select({
  title, value, onChange, options,
}: {
  title: string
  value: string
  onChange: (v: string) => void
  options: { v: string; l: string }[]
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close on outside click or Escape
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const current = options.find((o) => o.v === value)

  return (
    <div className="min-w-0" ref={ref}>
      <label className={label}>{title}</label>
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-haspopup="listbox"
          aria-expanded={open}
          className={`${field} flex cursor-pointer items-center justify-between gap-2 text-left ${
            open ? 'border-[#8B85FF]' : ''
          }`}
        >
          <span className="truncate">{current?.l}</span>
          <ChevronDown
            className={`h-3.5 w-3.5 shrink-0 text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`}
          />
        </button>

        {open && (
          <ul
            role="listbox"
            className="absolute inset-x-0 top-full z-30 mt-1 overflow-hidden rounded-lg border border-[#272D39] bg-[#10131A] py-1 shadow-lg"
          >
            {options.map((o) => {
              const sel = o.v === value
              return (
                <li key={o.v} role="option" aria-selected={sel}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(o.v)
                      setOpen(false)
                    }}
                    className={`block w-full cursor-pointer px-3 py-2 text-left text-xs transition-colors ${
                      sel ? 'bg-[#8B85FF]/15 text-[#A29CFF]' : 'text-slate-200 hover:bg-white/5'
                    }`}
                  >
                    {o.l}
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}

// Small credit / debit bar (animates its width)
function Bar({ pct, c }: { pct: number; c: string }) {
  return (
    <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-white/6">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.8, ease: EASE }}
        className="h-full rounded-full"
        style={{ background: c }}
      />
    </div>
  )
}

/* ---------- Page ---------- */
export default function LedgerPage() {
  // Page state
  const [tab, setTab] = useState<TabKey>('ledger')
  const [balanceType, setBalanceType] = useState<BalanceType>('general')
  const [period, setPeriod] = useState<Period>('year')
  const [sortAsc, setSortAsc] = useState(true)
  const [selAcc, setSelAcc] = useState<string | null>(null) // selected account code
  const [selDoc, setSelDoc] = useState('2026-7119') // selected document number

  // Document panel state
  const [docTab, setDocTab] = useState<'document' | 'notes'>('document')
  const [notes, setNotes] = useState<Record<string, string>>({})
  const [showDoc, setShowDoc] = useState(false)

  // Documents inside the selected period
  const periodDocs = useMemo(() => {
    const prefix = period === 'month' ? THIS_MONTH : period === 'last' ? LAST_MONTH : ''
    return docs.filter((d) => d.posting.startsWith(prefix))
  }, [period])

  // Accounts with their debit / credit totals, after the balance-type filter and sorting
  const accountRows = useMemo(() => {
    const list = accounts
      .map((a) => {
        const lines = periodDocs.flatMap((d) => d.lines.filter((l) => l.account === a.code))
        const debit = sum(lines.map((l) => l.debit))
        const credit = sum(lines.map((l) => l.credit))
        return { ...a, debit, credit, balance: debit - credit, count: lines.length }
      })
      .filter((a) => a.count > 0)
      .filter((a) => balanceType === 'general' || (balanceType === 'debit' ? a.balance > 0 : a.balance < 0))
    return list.sort((a, b) => (sortAsc ? a.code.localeCompare(b.code) : b.code.localeCompare(a.code)))
  }, [periodDocs, balanceType, sortAsc])

  // Journal entries: one per account line (ledger tab) or one per document (journal tab)
  const entries = useMemo(() => {
    const list =
      tab === 'journal'
        ? periodDocs.map((d) => ({ key: d.docNo, date: d.posting, journal: d.journal, docNo: d.docNo, ref: d.ref }))
        : periodDocs.flatMap((d) =>
            d.lines
              .filter((l) => !selAcc || l.account === selAcc)
              .map((l) => ({ key: `${d.docNo}-${l.account}`, date: d.posting, journal: d.journal, docNo: d.docNo, ref: d.ref })),
          )
    return list.sort((a, b) => b.date.localeCompare(a.date))
  }, [periodDocs, selAcc, tab])

  // Totals for the trial balance and the reports tabs
  const totalDebit = sum(accountRows.map((a) => a.debit))
  const totalCredit = sum(accountRows.map((a) => a.credit))
  const maxSide = Math.max(...accountRows.flatMap((a) => [a.debit, a.credit]), 1)

  // Currently opened document
  const doc = docs.find((d) => d.docNo === selDoc) ?? docs[0]
  const docMax = Math.max(...doc.lines.flatMap((l) => [l.debit, l.credit]), 1)
  const docDebit = sum(doc.lines.map((l) => l.debit))
  const docCredit = sum(doc.lines.map((l) => l.credit))

  // Open a document in the right panel
  const openDoc = (no: string) => {
    setSelDoc(no)
    setDocTab('document')
    setShowDoc(false)
  }

  // Cards for the reports tab
  const cards: { l: string; v: string; sub: string; c: string; i: LucideIcon }[] = [
    { l: 'Total Debit', v: money(totalDebit), sub: 'All debit entries', c: BLUE, i: ArrowDownLeft },
    { l: 'Total Credit', v: money(totalCredit), sub: 'All credit entries', c: GREEN, i: ArrowUpRight },
    { l: 'Difference', v: money(Math.abs(totalDebit - totalCredit)), sub: totalDebit === totalCredit ? 'Books are balanced' : 'Books are not balanced', c: totalDebit === totalCredit ? GREEN : RED, i: Scale },
    { l: 'Documents', v: String(periodDocs.length), sub: 'In this period', c: ORANGE, i: FileText },
  ]

  // Show the document panel only on the ledger and journal tabs
  const showPanel = tab === 'ledger' || tab === 'journal'

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
          <h1 className="text-xl font-bold sm:text-2xl">Accounting &amp; Ledger</h1>
          <p className="text-xs text-slate-400">General ledger: organizing transactions for financial accuracy</p>
        </motion.div>
      </motion.div>

      {/* ---------- Page tabs (scroll sideways on small screens) ---------- */}
      <motion.div variants={item} initial="hidden" whileInView="show" viewport={VIEWPORT} className="min-w-0">
        <div className="thin-scroll flex w-full gap-1 overflow-x-auto overflow-y-hidden border-b border-[#272D39]">
          {tabs.map((t) => {
            const active = t.k === tab
            return (
              <button
                key={t.k}
                type="button"
                onClick={() => setTab(t.k)}
                className={`relative shrink-0 whitespace-nowrap px-3 py-2.5 text-xs font-semibold transition-colors ${
                  active ? 'text-[#A29CFF]' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {t.l}
                {/* Sliding underline under the active tab */}
                {active && (
                  <motion.span
                    layoutId="ledger-tab-underline"
                    transition={{ duration: 0.35, ease: EASE }}
                    className="absolute inset-x-0 -bottom-px h-0.5 bg-[#8B85FF]"
                  />
                )}
              </button>
            )
          })}
        </div>
      </motion.div>

      {/* ---------- Filters ---------- */}
      <motion.div variants={item} initial="hidden" whileInView="show" viewport={VIEWPORT} className="min-w-0">
        <Card
          title="Filter" sub="Choose the balance type and period"
          action={
            <button
              type="button"
              onClick={() => {
                setBalanceType('general')
                setPeriod('year')
                setSelAcc(null)
              }}
              className="text-[11px] text-[#A29CFF] hover:underline"
            >
              Reset
            </button>
          }
        >
          <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 lg:max-w-xl">
            <Select
              title="Balance Type"
              value={balanceType}
              onChange={(v) => setBalanceType(v as BalanceType)}
              options={[
                { v: 'general', l: 'General' },
                { v: 'debit', l: 'Debit balance' },
                { v: 'credit', l: 'Credit balance' },
              ]}
            />
            <Select
              title="Period"
              value={period}
              onChange={(v) => setPeriod(v as Period)}
              options={[
                { v: 'year', l: 'Current Year' },
                { v: 'month', l: 'This Month' },
                { v: 'last', l: 'Last Month' },
              ]}
            />
          </div>
        </Card>
      </motion.div>

      {/* ---------- Tab content (fades when the tab changes) ---------- */}
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.35, ease: EASE }}
          className={`grid min-w-0 grid-cols-1 gap-4 ${showPanel ? 'xl:grid-cols-3' : ''}`}
        >
          {/* ---------- Left side ---------- */}
          <div className={`flex min-w-0 flex-col gap-4 ${showPanel ? 'xl:col-span-2' : ''}`}>
            {/* Reports tab: summary cards + debit / credit bars */}
            {tab === 'reports' && (
              <>
                <div className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2 xl:grid-cols-4">
                  {cards.map(({ l, v, sub, c, i: Icon }, idx) => (
                    <motion.div
                      key={l}
                      initial={{ opacity: 0, y: 24 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.6, ease: EASE, delay: idx * 0.08 }}
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
                </div>

                <Card title="Debit vs Credit by Account" sub="Totals for the selected period">
                  <div className="flex flex-col gap-4">
                    {accountRows.length === 0 && (
                      <p className="py-6 text-center text-xs text-slate-500">No accounts for this filter.</p>
                    )}
                    {accountRows.map((a) => (
                      <div key={a.code} className="min-w-0">
                        <div className="flex items-center justify-between gap-2 text-[11px]">
                          <span className="min-w-0 flex-1 truncate font-medium">{a.code} · {a.desc}</span>
                          <span className="shrink-0 text-slate-400">{money(a.debit)} / {money(a.credit)}</span>
                        </div>
                        <Bar pct={(a.debit / maxSide) * 100} c={BLUE} />
                        <Bar pct={(a.credit / maxSide) * 100} c={GREEN} />
                      </div>
                    ))}
                    {/* Legend */}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-slate-400">
                      <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full" style={{ background: BLUE }} /> Debit</span>
                      <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full" style={{ background: GREEN }} /> Credit</span>
                    </div>
                  </div>
                </Card>
              </>
            )}

            {/* Trial balance tab: every account with debit, credit and totals */}
            {tab === 'trial' && (
              <Card
                title="Trial Balance" sub="Debit and credit totals per account"
                action={<Pill c={totalDebit === totalCredit ? GREEN : RED}>{totalDebit === totalCredit ? 'Balanced' : 'Not balanced'}</Pill>}
              >
                <div className={tableWrap}>
                  <table className="w-full min-w-130 text-left text-[11px]">
                    <thead className="text-slate-400">
                      <tr>
                        <th className={th}>Account</th>
                        <th className={th}>Description</th>
                        <th className={th}>Debit</th>
                        <th className={th}>Credit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {accountRows.length === 0 && (
                        <tr>
                          <td colSpan={4} className={`${td} py-8 text-center text-slate-500`}>No accounts for this filter.</td>
                        </tr>
                      )}
                      {accountRows.map((a, idx) => (
                        <motion.tr
                          key={a.code}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ duration: 0.5, ease: EASE, delay: idx * 0.04 }}
                        >
                          <td className={`${td} whitespace-nowrap font-medium`}>{a.code}</td>
                          <td className={`${td} whitespace-nowrap text-slate-400`}>{a.desc}</td>
                          <td className={`${td} whitespace-nowrap font-medium`}>{moneyOrDash(a.debit)}</td>
                          <td className={`${td} whitespace-nowrap font-medium`}>{moneyOrDash(a.credit)}</td>
                        </motion.tr>
                      ))}
                      {/* Totals row */}
                      <tr className="font-bold">
                        <td className={td} colSpan={2}>Total</td>
                        <td className={`${td} whitespace-nowrap`}>{money(totalDebit)}</td>
                        <td className={`${td} whitespace-nowrap`}>{money(totalCredit)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            {/* Ledger tab: list of accounts (click a row to filter the entries) */}
            {tab === 'ledger' && (
              <Card
                title="General Ledger" sub="Click an account to see its entries"
                action={
                  selAcc && (
                    <button type="button" onClick={() => setSelAcc(null)} className="text-[11px] text-[#A29CFF] hover:underline">
                      Clear selection
                    </button>
                  )
                }
              >
                <div className={tableWrap}>
                  <table className="w-full min-w-150 text-left text-[11px]">
                    <thead className="text-slate-400">
                      <tr>
                        <th className={th}>
                          {/* Sort button on the Account column */}
                          <button
                            type="button"
                            onClick={() => setSortAsc((s) => !s)}
                            className="flex items-center gap-1 font-medium text-[#F59E0B]"
                          >
                            Account {sortAsc ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                          </button>
                        </th>
                        <th className={th}>Description</th>
                        <th className={th}>Debit</th>
                        <th className={th}>Credit</th>
                        <th className={th}>Balance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {accountRows.length === 0 && (
                        <tr>
                          <td colSpan={5} className={`${td} py-8 text-center text-slate-500`}>No accounts for this filter.</td>
                        </tr>
                      )}
                      {accountRows.map((a, idx) => {
                        const active = selAcc === a.code
                        return (
                          <motion.tr
                            key={a.code}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, ease: EASE, delay: idx * 0.04 }}
                            onClick={() => setSelAcc(active ? null : a.code)}
                            className={`cursor-pointer transition-colors hover:bg-white/3 ${active ? 'bg-[#F59E0B]/10' : ''}`}
                          >
                            <td className={`${td} whitespace-nowrap font-medium`}>{a.code}</td>
                            <td className={`${td} whitespace-nowrap`}>{a.desc}</td>
                            <td className={`${td} whitespace-nowrap text-slate-400`}>{moneyOrDash(a.debit)}</td>
                            <td className={`${td} whitespace-nowrap text-slate-400`}>{moneyOrDash(a.credit)}</td>
                            <td className={`${td} whitespace-nowrap font-medium`}>
                              {money(Math.abs(a.balance))} <span className="text-[10px] text-slate-400">{a.balance >= 0 ? 'Dr' : 'Cr'}</span>
                            </td>
                          </motion.tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}

            {/* Entries list (ledger and journal tabs) */}
            {showPanel && (
              <Card
                title="Journal Entries"
                sub={tab === 'ledger' && selAcc ? `Account ${selAcc}` : `${entries.length} ${entries.length === 1 ? 'entry' : 'entries'} found`}
              >
                <div className={tableWrap}>
                  <table className="w-full min-w-130 text-left text-[11px]">
                    <thead className="text-slate-400">
                      <tr>
                        <th className={th}>Date</th>
                        <th className={th}>Journal</th>
                        <th className={th}>Document Number</th>
                        <th className={th}>Reference</th>
                        <th className={th} />
                      </tr>
                    </thead>
                    <tbody>
                      {entries.length === 0 && (
                        <tr>
                          <td colSpan={5} className={`${td} py-8 text-center text-slate-500`}>No entries for this filter.</td>
                        </tr>
                      )}
                      {entries.map((e, idx) => {
                        const active = e.docNo === selDoc
                        return (
                          <motion.tr
                            key={e.key}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, ease: EASE, delay: idx * 0.04 }}
                            className={`transition-colors hover:bg-white/3 ${active ? 'bg-[#F59E0B]/10' : ''}`}
                          >
                            <td className={`${td} whitespace-nowrap text-slate-400`}>{fmtDate(e.date)}</td>
                            <td className={td}><Pill c={e.journal === 'Sales' ? BLUE : ORANGE}>{e.journal}</Pill></td>
                            <td className={`${td} whitespace-nowrap font-medium`}>{e.docNo}</td>
                            <td className={`${td} whitespace-nowrap text-slate-400`}>{e.ref}</td>
                            <td className={td}>
                              <button
                                type="button"
                                onClick={() => openDoc(e.docNo)}
                                className="rounded-md border border-[#F59E0B]/50 px-2 py-0.5 text-[10px] font-semibold text-[#F59E0B] transition-colors hover:bg-[#F59E0B]/10"
                              >
                                View
                              </button>
                            </td>
                          </motion.tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            )}
          </div>

          {/* ---------- Right side: document details panel ---------- */}
          {showPanel && (
            <div className="min-w-0">
              <Card title={`Document ${doc.docNo}`} sub="Journal entry details">
                {/* Panel tabs: Document / Notes */}
                <div className="mb-4 flex gap-1 border-b border-[#272D39]">
                  {(['document', 'notes'] as const).map((k) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setDocTab(k)}
                      className={`relative px-3 py-2 text-xs font-semibold capitalize transition-colors ${
                        docTab === k ? 'text-[#F59E0B]' : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {k}
                      {docTab === k && (
                        <motion.span
                          layoutId="doc-tab-underline"
                          transition={{ duration: 0.3, ease: EASE }}
                          className="absolute inset-x-0 -bottom-px h-0.5 bg-[#F59E0B]"
                        />
                      )}
                    </button>
                  ))}
                </div>

                {/* Content changes with a small fade when another document or tab is opened */}
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${doc.docNo}-${docTab}`}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    transition={{ duration: 0.3, ease: EASE }}
                  >
                    {docTab === 'notes' ? (
                      <div>
                        <label className={label}>Notes for this document</label>
                        <textarea
                          rows={6}
                          value={notes[doc.docNo] ?? ''}
                          onChange={(e) => setNotes((n) => ({ ...n, [doc.docNo]: e.target.value }))}
                          placeholder="Write a note..."
                          className={`${field} resize-none`}
                        />
                      </div>
                    ) : (
                      <div className="flex flex-col gap-4">
                        {/* Document info */}
                        <div className="grid grid-cols-2 gap-3 text-[11px] min-[480px]:grid-cols-3 xl:grid-cols-2 2xl:grid-cols-3">
                          <div className="min-w-0">
                            <p className="text-[10px] text-slate-400">Journal</p>
                            <p className="mt-0.5 truncate font-semibold">{doc.journal}</p>
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] text-slate-400">Invoice Number</p>
                            <p className="mt-0.5 truncate font-semibold">{doc.invoiceNo}</p>
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] text-slate-400">Reference</p>
                            <p className="mt-0.5 truncate font-semibold">{doc.ref}</p>
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] text-slate-400">Currency</p>
                            <p className="mt-0.5 truncate font-semibold">{doc.currency}</p>
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] text-slate-400">Origin</p>
                            <p className="mt-0.5 truncate font-semibold">{doc.origin}</p>
                          </div>
                          {/* Dates are highlighted with an orange border */}
                          <div className="min-w-0 rounded-lg border border-[#F59E0B]/60 p-2">
                            <p className="text-[10px] text-slate-400">Posting Date</p>
                            <p className="mt-0.5 truncate font-semibold">{fmtDate(doc.posting)}</p>
                            <p className="mt-1.5 text-[10px] text-slate-400">Created On</p>
                            <p className="mt-0.5 truncate font-semibold">{fmtDate(doc.created)}</p>
                          </div>
                        </div>

                        {/* Lines table with credit / debit bars */}
                        <div className={tableWrap}>
                          <table className="w-full min-w-105 text-left text-[11px]">
                            <thead className="text-slate-400">
                              <tr>
                                <th className={th}>Account</th>
                                <th className={th}>Description</th>
                                <th className={th}>Credit</th>
                                <th className={th}>Debit</th>
                              </tr>
                            </thead>
                            <tbody>
                              {doc.lines.map((l) => (
                                <tr key={l.account}>
                                  <td className={`${td} whitespace-nowrap font-medium`}>{l.account}</td>
                                  <td className={td}>
                                    <span className="block max-w-28 truncate">{l.desc}</span>
                                    {l.customer && <span className="block text-[10px] text-slate-500">{l.customer}</span>}
                                  </td>
                                  <td className={`${td} min-w-20`}>
                                    <span className="whitespace-nowrap">{money(l.credit)}</span>
                                    <Bar pct={(l.credit / docMax) * 100} c={ORANGE} />
                                  </td>
                                  <td className={`${td} min-w-20`}>
                                    <span className="whitespace-nowrap">{money(l.debit)}</span>
                                    <Bar pct={(l.debit / docMax) * 100} c={BLUE} />
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>

                        {/* Show / hide the document summary */}
                        <button
                          type="button"
                          onClick={() => setShowDoc((s) => !s)}
                          className="mx-auto flex items-center gap-1.5 text-[11px] font-semibold text-[#F59E0B] hover:underline"
                        >
                          {showDoc ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          {showDoc ? 'Hide Document' : 'Show Document'}
                        </button>

                        <AnimatePresence initial={false}>
                          {showDoc && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.35, ease: EASE }}
                              className="overflow-hidden"
                            >
                              <div className="grid grid-cols-1 gap-3 rounded-lg border border-[#272D39] bg-white/3 p-3 text-[11px] min-[480px]:grid-cols-3">
                                <div className="min-w-0">
                                  <p className="text-[10px] text-slate-400">Total Debit</p>
                                  <p className="mt-0.5 truncate font-semibold">{money(docDebit)}</p>
                                </div>
                                <div className="min-w-0">
                                  <p className="text-[10px] text-slate-400">Total Credit</p>
                                  <p className="mt-0.5 truncate font-semibold">{money(docCredit)}</p>
                                </div>
                                <div className="min-w-0">
                                  <p className="text-[10px] text-slate-400">Status</p>
                                  <div className="mt-0.5">
                                    <Pill c={docDebit === docCredit ? GREEN : RED}>{docDebit === docCredit ? 'Balanced' : 'Not balanced'}</Pill>
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </Card>
            </div>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}