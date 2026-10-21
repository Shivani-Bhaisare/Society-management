'use client'

import { useMemo, useState } from 'react'
import { motion, type Variants } from 'framer-motion'
import {
  Wallet, Briefcase, Laptop, Music, Clock, Upload, Trash2, Download, Pencil,
  IndianRupee, LayoutGrid, type LucideIcon,
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

/* ---------- Data (replace with API data later) ---------- */

type CatKey = 'main' | 'second' | 'hobby'

// Income categories (the same colours are used in the pie and the bar chart)
const cats: { k: CatKey; l: string; c: string; i: LucideIcon }[] = [
  { k: 'main', l: 'Main job', c: BLUE, i: Briefcase },
  { k: 'second', l: 'Second job', c: RED, i: Laptop },
  { k: 'hobby', l: 'Hobby', c: ORANGE, i: Music },
]

type Rec = {
  id: number
  name: string
  amount: number
  cat: CatKey
  date: string // YYYY-MM-DD
  planned: boolean
}

// Newest first (this is the order shown in "Last Added")
const initialRecords: Rec[] = [
  { id: 5, name: 'Hobby', amount: 150, cat: 'hobby', date: '2026-01-23', planned: false },
  { id: 4, name: 'Hobby', amount: 60, cat: 'hobby', date: '2026-01-11', planned: false },
  { id: 3, name: 'Hobby', amount: 40, cat: 'hobby', date: '2026-01-17', planned: false },
  { id: 2, name: 'Second job', amount: 900, cat: 'second', date: '2026-01-21', planned: false },
  { id: 1, name: 'Main job', amount: 1500, cat: 'main', date: '2026-01-07', planned: false },
]

/* ---------- Shared styles ---------- */

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
  'flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-linear-to-r from-[#6C63FF] to-[#4DA3FF] px-4 py-2.5 text-xs font-semibold text-white transition hover:opacity-90 active:scale-95'

// Format a number as Indian rupees
const money = (n: number) => `₹ ${n.toLocaleString('en-IN')}`

// Round the chart top to a clean number and build the Y axis ticks
function niceScale(max: number) {
  if (max <= 0) return { top: 4, ticks: [4, 3, 2, 1, 0] }
  const rough = max / 6
  const pow = Math.pow(10, Math.floor(Math.log10(rough)))
  const step = [1, 2, 5, 10].map((m) => m * pow).find((s) => s >= rough) ?? pow * 10
  const n = Math.ceil(max / step)
  const top = +(step * n).toFixed(2)
  const ticks = Array.from({ length: n + 1 }, (_, i) => +(step * (n - i)).toFixed(2))
  return { top, ticks }
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

// Pie chart drawn with SVG circles (no chart library needed).
// The wrapper never grows wider than its parent, so it stays responsive on small screens.
function Pie({ segments, size = 150 }: { segments: { pct: number; c: string }[]; size?: number }) {
  let offset = 0
  return (
    <div className="aspect-square w-full shrink-0" style={{ maxWidth: size }}>
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        {/* Background ring */}
        <circle cx="50" cy="50" r="25" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="50" />
        {/* One circle per category, each drawn with a dash length equal to its share */}
        {segments.map((s, idx) => {
          const el = (
            <circle
              key={idx}
              cx="50"
              cy="50"
              r="25"
              fill="none"
              stroke={s.c}
              strokeWidth="50"
              pathLength={100}
              strokeDasharray={`${s.pct} ${100 - s.pct}`}
              strokeDashoffset={-offset}
            />
          )
          offset += s.pct
          return el
        })}
      </svg>
    </div>
  )
}

/* ---------- Page ---------- */
export default function IncomePage() {
  const [records, setRecords] = useState<Rec[]>(initialRecords)
  const [nextId, setNextId] = useState(6)

  // Add form state
  const [name, setName] = useState('')
  const [value, setValue] = useState('')
  const [cat, setCat] = useState<CatKey>('main')
  const [planned, setPlanned] = useState(false)
  const [error, setError] = useState('')

  // Filter state
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [fcat, setFcat] = useState<'all' | CatKey>('all')

  // Save a new income record
  const save = (e: React.FormEvent) => {
    e.preventDefault()
    const amount = parseFloat(value)
    if (!amount || amount <= 0) {
      setError('Enter a valid amount')
      return
    }
    // If no name is typed, fall back to the category name
    const catLabel = cats.find((c) => c.k === cat)?.l ?? ''
    setRecords((r) => [
      {
        id: nextId,
        name: name.trim() || catLabel,
        amount,
        cat,
        date: new Date().toISOString().slice(0, 10),
        planned,
      },
      ...r,
    ])
    setNextId((n) => n + 1)
    setName('')
    setValue('')
    setPlanned(false)
    setError('')
  }

  // Delete a record by id
  const remove = (id: number) => setRecords((r) => r.filter((x) => x.id !== id))

  // Records after the date + category filters
  const filtered = useMemo(
    () =>
      records.filter(
        (r) => (!from || r.date >= from) && (!to || r.date <= to) && (fcat === 'all' || r.cat === fcat),
      ),
    [records, from, to, fcat],
  )

  // Planned income is not counted in totals and charts
  const received = useMemo(() => filtered.filter((r) => !r.planned), [filtered])
  const total = received.reduce((s, r) => s + r.amount, 0)
  const byCat = cats.map((c) => ({
    ...c,
    amt: received.filter((r) => r.cat === c.k).reduce((s, r) => s + r.amount, 0),
  }))

  // Bar chart data: one bar per day (or per month if the range is longer than 31 days)
  const chart = useMemo(() => {
    if (received.length === 0) return null
    const ds = received.map((r) => r.date).sort()
    const start = from || ds[0]
    const end = to || ds[ds.length - 1]
    if (start > end) return null

    const days = Math.round((Date.parse(end) - Date.parse(start)) / 86400000)
    const monthly = days > 31
    const keys: string[] = []

    if (!monthly) {
      // Daily keys: YYYY-MM-DD
      for (let t = Date.parse(start); t <= Date.parse(end); t += 86400000) {
        keys.push(new Date(t).toISOString().slice(0, 10))
      }
    } else {
      // Monthly keys: YYYY-MM
      let y = +start.slice(0, 4)
      let m = +start.slice(5, 7)
      const ey = +end.slice(0, 4)
      const em = +end.slice(5, 7)
      while (y < ey || (y === ey && m <= em)) {
        keys.push(`${y}-${String(m).padStart(2, '0')}`)
        m++
        if (m > 12) {
          m = 1
          y++
        }
      }
    }

    // Sum the amount of each category for every bar
    const len = monthly ? 7 : 10
    const data = keys.map((k) => {
      const parts = cats.map((c) => ({
        k: c.k,
        c: c.c,
        v: received
          .filter((r) => r.cat === c.k && r.date.slice(0, len) === k)
          .reduce((s, r) => s + r.amount, 0),
      }))
      return { k, label: monthly ? k : k.slice(5), parts, total: parts.reduce((s, p) => s + p.v, 0) }
    })
    return { data, scale: niceScale(Math.max(...data.map((d) => d.total))) }
  }, [received, from, to])

  // Download the filtered records as a CSV file
  const exportCsv = () => {
    const rows = [
      ['Date', 'Name', 'Category', 'Amount', 'Status'],
      ...filtered.map((r) => [
        r.date,
        r.name,
        cats.find((c) => c.k === r.cat)?.l ?? '',
        r.amount,
        r.planned ? 'Planned' : 'Received',
      ]),
    ]
    const csv = rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
    const a = document.createElement('a')
    a.href = url
    a.download = 'income.csv'
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
          <h1 className="text-xl font-bold sm:text-2xl">Income</h1>
          <p className="text-xs text-slate-400">All society income sources</p>
        </motion.div>
      </motion.div>

      {/* ---------- Main grid: form column + charts column ---------- */}
      {/* 1 column on mobile / tablet, 3 columns (1 + 2) on extra-large screens */}
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
        className="grid grid-cols-1 gap-4 xl:grid-cols-3"
      >
        {/* ---------- Left column ---------- */}
        <div className="flex min-w-0 flex-col gap-4">
          {/* Add income form */}
          <motion.div variants={item} className="min-w-0">
            <Card title="Add Income" sub="Record a new income entry">
              <form onSubmit={save} className="flex flex-col gap-4">
                {/* Name */}
                <div>
                  <label className={label}><Pencil className="h-3 w-3" /> Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Name"
                    className={field}
                  />
                </div>

                {/* Amount */}
                <div>
                  <label className={label}><IndianRupee className="h-3 w-3" /> Value</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={value}
                      onChange={(e) => {
                        setValue(e.target.value)
                        setError('')
                      }}
                      placeholder="0.00"
                      className={field}
                    />
                    <span className="flex w-9 shrink-0 items-center justify-center rounded-lg bg-[#3B82F6]/15 text-xs font-bold text-[#3B82F6]">
                      ₹
                    </span>
                  </div>
                  {error && <p className="mt-1.5 text-[10px] text-red-400">{error}</p>}
                </div>

                {/* Category picker */}
                <div>
                  <label className={label}><LayoutGrid className="h-3 w-3" /> Category</label>
                  <div className="grid grid-cols-1 gap-2 min-[400px]:grid-cols-2">
                    {cats.map(({ k, l, i: Icon }) => {
                      const active = k === cat
                      return (
                        <button
                          key={k}
                          type="button"
                          onClick={() => setCat(k)}
                          className={`flex min-w-0 items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-xs font-semibold transition-colors ${
                            active
                              ? 'border-[#8B85FF] bg-[#8B85FF]/15 text-[#A29CFF]'
                              : 'border-[#272D39] bg-[#10131A] text-slate-300 hover:bg-white/5'
                          }`}
                        >
                          <Icon className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{l}</span>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Planned toggle + Save button (they stack on very small screens) */}
                <div className="flex flex-col gap-2 min-[400px]:flex-row min-[400px]:items-center min-[400px]:justify-between">
                  <button
                    type="button"
                    onClick={() => setPlanned((p) => !p)}
                    className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2.5 text-xs font-semibold transition-colors ${
                      planned
                        ? 'border-[#F59E0B] bg-[#F59E0B]/15 text-[#F59E0B]'
                        : 'border-[#272D39] bg-[#10131A] text-slate-300 hover:bg-white/5'
                    }`}
                  >
                    <Clock className="h-3.5 w-3.5" /> Planned
                  </button>

                  <button type="submit" className={gradBtn}>
                    <Upload className="h-3.5 w-3.5" /> Save record
                  </button>
                </div>
              </form>
            </Card>
          </motion.div>

          {/* Last added */}
          <motion.div variants={item} className="min-w-0">
            <Card title="Last Added" sub="Latest income entries">
              <div className={tableWrap}>
                <table className="w-full min-w-65 text-left text-[11px]">
                  <tbody>
                    {records.length === 0 && (
                      <tr>
                        <td className="py-6 text-center text-slate-500">No records yet.</td>
                      </tr>
                    )}
                    {/* Show only the 4 newest records */}
                    {records.slice(0, 4).map((r) => {
                      const c = cats.find((x) => x.k === r.cat)!
                      return (
                        <tr key={r.id}>
                          <td className="border-t border-[#272D39] px-2 py-2 font-medium first:border-t-0">
                            <span className="block max-w-24 truncate">{r.name}</span>
                          </td>
                          <td className="whitespace-nowrap border-t border-[#272D39] px-2 py-2 font-bold">
                            {r.amount.toFixed(2)}
                          </td>
                          <td className="border-t border-[#272D39] px-2 py-2">
                            <Pill c={c.c}>{c.l}</Pill>
                          </td>
                          <td className="whitespace-nowrap border-t border-[#272D39] px-2 py-2 text-slate-400">
                            {r.date.slice(5)}
                          </td>
                          <td className="border-t border-[#272D39] px-2 py-2">
                            <button
                              type="button"
                              onClick={() => remove(r.id)}
                              aria-label={`Delete ${r.name}`}
                              className="flex h-6 w-6 items-center justify-center rounded-md border border-[#272D39] text-red-400 hover:bg-white/5"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </motion.div>

          {/* Filter */}
          <motion.div variants={item} className="min-w-0">
            <Card
              title="Filter" sub="Narrow down the income records"
              action={
                <button
                  type="button"
                  onClick={() => {
                    setFrom('')
                    setTo('')
                    setFcat('all')
                  }}
                  className="text-[11px] text-[#A29CFF] hover:underline"
                >
                  Reset
                </button>
              }
            >
              {/* 1 column on mobile, 2 on small/tablet, 1 again inside the narrow desktop column */}
              <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 xl:grid-cols-1">
                <div className="min-w-0">
                  <label className={label}>From</label>
                  <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={field} />
                </div>
                <div className="min-w-0">
                  <label className={label}>To</label>
                  <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className={field} />
                </div>
                <div className="min-w-0 min-[480px]:col-span-2 xl:col-span-1">
                  <label className={label}>Category</label>
                  <select
                    value={fcat}
                    onChange={(e) => setFcat(e.target.value as 'all' | CatKey)}
                    className={field}
                  >
                    <option value="all" className="bg-[#10131A]">All Categories</option>
                    {cats.map((c) => (
                      <option key={c.k} value={c.k} className="bg-[#10131A]">{c.l}</option>
                    ))}
                  </select>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* ---------- Right column ---------- */}
        <div className="flex min-w-0 flex-col gap-4 xl:col-span-2">
          {/* Total card + pie chart */}
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* Total income card */}
            <motion.div
              variants={item}
              className="relative min-w-0 overflow-hidden rounded-xl border border-[#272D39] bg-[#10131A] p-4"
            >
              <div className="flex items-center gap-2">
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                  style={{ background: `${BLUE}26`, color: BLUE }}
                >
                  <Wallet className="h-4 w-4" />
                </span>
                <span className="truncate text-xs font-semibold">Total Income</span>
              </div>
              <p className="mt-3 truncate text-xl font-bold min-[480px]:text-2xl">{money(total)}</p>
              <p className="mt-1 text-[10px] text-slate-400">
                {received.length} {received.length === 1 ? 'record' : 'records'}
              </p>
              {/* Coloured line at the bottom of the card */}
              <span className="absolute inset-x-0 bottom-0 h-0.75" style={{ background: BLUE }} />
            </motion.div>

            {/* Pie chart + legend */}
            <motion.div variants={item} className="min-w-0 md:col-span-2">
              <Card title="Income by Category" sub="Share of total income">
                <div className="flex flex-col items-center gap-4 min-[480px]:flex-row">
                  <Pie
                    size={150}
                    segments={byCat.map(({ amt, c }) => ({ pct: total ? (amt / total) * 100 : 0, c }))}
                  />
                  <div className="flex w-full min-w-0 flex-1 flex-col gap-2.5">
                    {byCat.map(({ l, amt, c }) => (
                      <div key={l} className="flex items-center gap-2 text-[11px]">
                        <i className="h-2 w-2 shrink-0 rounded-full" style={{ background: c }} />
                        <span className="min-w-0 flex-1 truncate">{l}</span>
                        <span className="shrink-0 font-semibold">{money(amt)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>

          {/* Bar chart */}
          <motion.div variants={item} className="min-w-0">
            <Card
              title="Total Income by Date" sub="Daily income (monthly if the range is long)"
              action={
                // Legend (wraps onto several lines on small screens)
                <span className="flex flex-wrap items-center justify-end gap-x-3 gap-y-1 text-[10px] text-slate-400">
                  {cats.map(({ l, c }) => (
                    <span key={l} className="flex items-center gap-1">
                      <i className="h-2 w-2 rounded-full" style={{ background: c }} /> {l}
                    </span>
                  ))}
                </span>
              }
            >
              {!chart ? (
                <p className="py-10 text-center text-xs text-slate-500">No income to show for this filter.</p>
              ) : (
                <div className="flex gap-2">
                  {/* Y axis labels */}
                  <div className="flex h-40 shrink-0 flex-col justify-between text-[10px] text-slate-500 sm:h-52">
                    {chart.scale.ticks.map((t) => (
                      <span key={t} className="leading-none">{t}</span>
                    ))}
                  </div>

                  {/* Plot (scrolls sideways on small screens) */}
                  <div className="thin-scroll min-w-0 flex-1 overflow-x-auto overflow-y-hidden pb-1">
                    <div style={{ minWidth: chart.data.length * 28 }}>
                      <div className="relative h-40 border-b border-l border-[#272D39] sm:h-52">
                        {/* Horizontal grid lines */}
                        {chart.scale.ticks.slice(0, -1).map((t) => (
                          <span
                            key={t}
                            className="absolute inset-x-0 border-t border-dashed border-[#272D39]"
                            style={{ top: `${100 - (t / chart.scale.top) * 100}%` }}
                          />
                        ))}

                        {/* Bars (stacked by category) */}
                        <div className="absolute inset-0 flex items-end">
                          {chart.data.map((d) => (
                            <div key={d.k} className="relative flex h-full min-w-0 flex-1 items-end justify-center px-0.5">
                              {d.total > 0 && (
                                <motion.div
                                  initial={{ height: 0 }}
                                  animate={{ height: `${(d.total / chart.scale.top) * 100}%` }}
                                  transition={{ duration: 0.8, ease: EASE }}
                                  className="relative w-full max-w-5"
                                >
                                  {/* Total value above the bar */}
                                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-[9px] text-slate-400">
                                    {d.total}
                                  </span>
                                  <div className="flex h-full w-full flex-col-reverse overflow-hidden rounded-t-sm">
                                    {d.parts
                                      .filter((p) => p.v > 0)
                                      .map((p) => (
                                        <div key={p.k} style={{ height: `${(p.v / d.total) * 100}%`, background: p.c }} />
                                      ))}
                                  </div>
                                </motion.div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* X axis labels (vertical, so many dates fit) */}
                      <div className="mt-1.5 flex">
                        {chart.data.map((d) => (
                          <div key={d.k} className="flex min-w-0 flex-1 justify-center">
                            <span className="rotate-180 whitespace-nowrap text-[9px] text-slate-400 [writing-mode:vertical-rl]">
                              {d.label}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Export button (full width on mobile, right aligned on larger screens) */}
              <div className="mt-4 flex sm:justify-end">
                <button type="button" onClick={exportCsv} className={`${gradBtn} w-full sm:w-auto`}>
                  <Download className="h-3.5 w-3.5" /> Export CSV
                </button>
              </div>
            </Card>
          </motion.div>
        </div>
      </motion.div>

      {/* ---------- All records table ---------- */}
      <motion.div variants={item} initial="hidden" whileInView="show" viewport={VIEWPORT} className="min-w-0">
        <Card
          title="Income Records"
          sub={`${filtered.length} ${filtered.length === 1 ? 'record' : 'records'} found`}
        >
          {/* Table scrolls sideways inside the card on small screens */}
          <div className={tableWrap}>
            <table className="w-full min-w-130 text-left text-[11px]">
              <thead className="text-slate-400">
                <tr>
                  <th className={th}>Date</th>
                  <th className={th}>Name</th>
                  <th className={th}>Category</th>
                  <th className={th}>Amount</th>
                  <th className={th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className={`${td} py-8 text-center text-slate-500`}>
                      No income records match your filters.
                    </td>
                  </tr>
                )}
                {/* Newest date first */}
                {[...filtered]
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .map((r) => {
                    const c = cats.find((x) => x.k === r.cat)!
                    return (
                      <tr key={r.id}>
                        <td className={`${td} whitespace-nowrap text-slate-400`}>{r.date}</td>
                        <td className={`${td} whitespace-nowrap font-medium`}>{r.name}</td>
                        <td className={td}><Pill c={c.c}>{c.l}</Pill></td>
                        <td className={`${td} whitespace-nowrap font-medium`}>{money(r.amount)}</td>
                        <td className={td}>
                          <Pill c={r.planned ? ORANGE : GREEN}>{r.planned ? 'Planned' : 'Received'}</Pill>
                        </td>
                      </tr>
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