'use client'

import { useMemo, useState } from 'react'
import { motion, type Variants } from 'framer-motion'
import {
  Plus, FileText, CheckCircle2, Clock, AlertCircle, Search,
  Calendar, ChevronDown, ChevronLeft, ChevronRight, BadgeCheck, Trash2,
} from 'lucide-react'
import { Card } from '@/Components/ui'
import AddGenerateBillsModal, { type AddGeneratePayload } from '@/Components/AddGenerateBillsModal'

/* ---------- Animation ---------- */

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

/* ---------- Types + data (replace with API data later) ---------- */

type Status = 'Paid' | 'Pending' | 'Overdue'

type Bill = {
  id: number
  billNo: string
  flat: string
  wing: string
  resident: string
  month: string
  amount: number
  due: string
  status: Status
}

const initialBills: Bill[] = [
  { id: 1, billNo: 'MB-0001', flat: 'A-101', wing: 'A', resident: 'Rakesh Sharma', month: 'Apr 2025', amount: 3700, due: '10 Apr 2025', status: 'Paid' },
  { id: 2, billNo: 'MB-0002', flat: 'A-102', wing: 'A', resident: 'Priya Mehta', month: 'Apr 2025', amount: 3200, due: '10 Apr 2025', status: 'Pending' },
  { id: 3, billNo: 'MB-0003', flat: 'B-201', wing: 'B', resident: 'Sandeep Kumar', month: 'Apr 2025', amount: 4500, due: '10 Apr 2025', status: 'Overdue' },
  { id: 4, billNo: 'MB-0004', flat: 'B-202', wing: 'B', resident: 'Neha Gupta', month: 'Apr 2025', amount: 3800, due: '10 Apr 2025', status: 'Paid' },
  { id: 5, billNo: 'MB-0005', flat: 'C-101', wing: 'C', resident: 'Amit Verma', month: 'Apr 2025', amount: 3100, due: '10 Apr 2025', status: 'Pending' },
]

// Dropdown options for the filters
const baseMonths = ['Apr 2025', 'May 2025', 'Jun 2025']
const wings = ['All Wings', 'A', 'B', 'C']
const statuses = ['All', 'Paid', 'Pending', 'Overdue']

// Status pill colours
const statusStyle: Record<Status, string> = {
  Paid: 'bg-emerald-500/15 text-emerald-400',
  Pending: 'bg-amber-500/15 text-amber-400',
  Overdue: 'bg-red-500/15 text-red-400',
}

/* ---------- Shared styles (same as Charge Heads / Residents) ---------- */

const th = 'bg-white/4 px-2 py-2 font-medium first:rounded-l-md last:rounded-r-md'
const td = 'border-t border-[#272D39] px-2 py-2.5'
const field =
  'w-full rounded-lg border border-[#272D39] bg-[#10131A] px-3 py-2 text-xs text-slate-200 outline-none placeholder:text-slate-500 focus:border-[#A29CFF]/60'

// Small icon button used in the Actions column
const iconBtn = 'cursor-pointer rounded-md p-1.5 transition active:scale-90'

/* ---------- Small helpers ---------- */

// Label + control wrapper for filters
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-[11px] text-slate-400">
      <span>{label}</span>
      {children}
    </label>
  )
}

// Select with a custom chevron (optional left icon)
function SelectBox({
  value, onChange, options, icon: Icon,
}: {
  value: string
  onChange: (v: string) => void
  options: string[]
  icon?: React.ElementType
}) {
  return (
    <span className="relative block">
      {Icon && <Icon className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${field} cursor-pointer appearance-none pr-8 ${Icon ? 'pl-9' : ''}`}
      >
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
    </span>
  )
}

// Small coloured status pill
function StatusPill({ status }: { status: Status }) {
  return (
    <span className={`inline-block rounded-full px-2.5 py-0.5 text-[10px] font-medium ${statusStyle[status]}`}>
      {status}
    </span>
  )
}

/* ---------- Page ---------- */
export default function MaintenanceBillsPage() {
  const [bills, setBills] = useState<Bill[]>(initialBills)
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState(false)

  // Filter state
  const [month, setMonth] = useState(baseMonths[0])
  const [wing, setWing] = useState(wings[0])
  const [flat, setFlat] = useState('All Flats')
  const [status, setStatus] = useState(statuses[0])
  const [search, setSearch] = useState('')

  // Month dropdown also includes months of newly generated bills
  const months = useMemo(
    () => Array.from(new Set([...baseMonths, ...bills.map((b) => b.month)])),
    [bills],
  )

  // Flat dropdown options come from the bill list (duplicates removed so option keys stay unique)
  const flatOptions = useMemo(
    () => ['All Flats', ...Array.from(new Set(bills.map((b) => b.flat)))],
    [bills],
  )

  // Apply all filters
  const rows = bills.filter((b) => {
    const q = search.trim().toLowerCase()
    return (
      b.month === month &&
      (wing === 'All Wings' || b.wing === wing) &&
      (flat === 'All Flats' || b.flat === flat) &&
      (status === 'All' || b.status === status) &&
      (!q || b.billNo.toLowerCase().includes(q) || b.resident.toLowerCase().includes(q) || b.flat.toLowerCase().includes(q))
    )
  })

  // Summary numbers (static like the design, replace with API data later)
  const stats = [
    { label: 'Total Bills', value: 120, sub: 'All generated bills', subC: 'text-slate-400', icon: FileText, c: '#3B82F6' },
    { label: 'Paid', value: 86, sub: 'Payment received', subC: 'text-emerald-400', icon: CheckCircle2, c: '#00C2B8' },
    { label: 'Pending', value: 24, sub: 'Awaiting payment', subC: 'text-slate-400', icon: Clock, c: '#F59E0B' },
    { label: 'Overdue', value: 10, sub: 'Past due date', subC: 'text-red-400', icon: AlertCircle, c: '#EF4444' },
  ]

  // Add the generated bills to the table (replace with an API call later)
  const handleGenerate = (data: AddGeneratePayload) => {
    const stamp = Date.now()
    setBills((prev) => {
      const newBills: Bill[] = data.flats.map((f, i) => ({
        id: stamp + i,
        billNo: `MB-${String(prev.length + i + 1).padStart(4, '0')}`,
        flat: f.flat,
        wing: f.wing,
        resident: f.resident,
        month: data.month,
        amount: data.heads.reduce(
          (s, h) => s + (h.method === 'Fixed' ? h.value : f.penalty),
          0,
        ),
        due: data.dueDate,
        status: 'Pending',
      }))
      return [...prev, ...newBills]
    })
    setMonth(data.month)
  }

  // Row actions
  const markPaid = (id: number) => {
    setBills((prev) => prev.map((b) => (b.id === id ? { ...b, status: 'Paid' } : b)))
  }
  const remove = (id: number) => {
    setBills((prev) => prev.filter((b) => b.id !== id))
  }

  return (
    <div className="mx-auto flex w-full max-w-350 flex-col gap-4">
      {/* Heading */}
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
        className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
      >
        <motion.div variants={item}>
          <h1 className="text-xl font-bold sm:text-2xl">Maintenance Bills</h1>
          <p className="text-xs text-slate-400">Generate and manage maintenance bills for all flats</p>
        </motion.div>

        {/* Generate button: opens the drawer on click */}
        <motion.div variants={item}>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-linear-to-r from-[#6C63FF] to-[#4DA3FF] px-4 py-2.5 text-xs font-semibold text-white transition hover:opacity-90 active:scale-95"
          >
            <Plus className="h-3.5 w-3.5" /> Generate Bills
          </button>
        </motion.div>
      </motion.div>

      {/* Stat cards (same card style and size as Dashboard) */}
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
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                style={{ background: `${c}26`, color: c }}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span className="truncate text-xs font-semibold">{label}</span>
            </div>
            <p className="mt-3 text-2xl font-bold">{value}</p>
            <p className={`mt-1 text-[10px] ${subC}`}>{sub}</p>
            {/* Coloured accent line at the bottom of the card */}
            <span className="absolute inset-x-0 bottom-0 h-0.75" style={{ background: c }} />
          </motion.div>
        ))}
      </motion.div>

      {/* Bills table */}
      <motion.div
        variants={item}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
      >
        <Card title="Maintenance Bills" sub={`Total ${rows.length} bills`}>
          {/* Filters */}
          <div className="mb-4 grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 lg:grid-cols-5">
            <Field label="Billing Month">
              <SelectBox value={month} onChange={setMonth} options={months} icon={Calendar} />
            </Field>
            <Field label="Wing">
              <SelectBox value={wing} onChange={setWing} options={wings} />
            </Field>
            <Field label="Flat Number">
              <SelectBox value={flat} onChange={setFlat} options={flatOptions} />
            </Field>
            <Field label="Status">
              <SelectBox value={status} onChange={setStatus} options={statuses} />
            </Field>
            <Field label="Search">
              <span className="relative block">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search..."
                  className={`${field} pl-9`}
                />
              </span>
            </Field>
          </div>

          {/* Table scrolls sideways on small screens */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-180 text-left text-[11px]">
              <thead className="text-slate-400">
                <tr>
                  <th className={th}>Bill No.</th>
                  <th className={th}>Flat No.</th>
                  <th className={th}>Resident Name</th>
                  <th className={th}>Billing Month</th>
                  <th className={th}>Amount</th>
                  <th className={th}>Due Date</th>
                  <th className={th}>Status</th>
                  <th className={`${th} text-right`}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((b, i) => (
                  <motion.tr
                    key={b.id}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={VIEWPORT}
                    transition={{ duration: 0.5, ease: EASE, delay: i * 0.05 }}
                    className="hover:bg-white/2"
                  >
                    <td className={`${td} font-medium`}>{b.billNo}</td>
                    <td className={`${td} text-slate-300`}>{b.flat}</td>
                    <td className={`${td} text-slate-300`}>{b.resident}</td>
                    <td className={`${td} text-slate-400`}>{b.month}</td>
                    <td className={`${td} whitespace-nowrap text-slate-300`}>₹ {b.amount.toLocaleString('en-IN')}</td>
                    <td className={`${td} text-slate-400`}>{b.due}</td>
                    <td className={td}>
                      <StatusPill status={b.status} />
                    </td>

                    {/* Actions: icons directly in the row (no 3-dot menu) */}
                    <td className={`${td} text-right`}>
                      <div className="flex items-center justify-end gap-0.5">
                        {/* Mark Paid: only for bills that are not paid yet */}
                        {b.status !== 'Paid' && (
                          <button
                            type="button"
                            title="Mark Paid"
                            aria-label="Mark Paid"
                            onClick={() => markPaid(b.id)}
                            className={`${iconBtn} text-slate-400 hover:bg-emerald-500/10 hover:text-emerald-400`}
                          >
                            <BadgeCheck className="h-4 w-4" />
                          </button>
                        )}

                        {/* Delete */}
                        <button
                          type="button"
                          title="Delete"
                          aria-label="Delete"
                          onClick={() => remove(b.id)}
                          className={`${iconBtn} text-red-400 hover:bg-red-500/10`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}

                {rows.length === 0 && (
                  <tr>
                    <td colSpan={8} className={`${td} py-8 text-center text-slate-500`}>
                      No bills found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-4 flex flex-col items-center justify-between gap-3 text-[11px] text-slate-400 sm:flex-row">
            <span>Showing {rows.length ? `1-${rows.length}` : '0'} of 120</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Previous"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-[#272D39] hover:bg-white/5"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setPage(n)}
                  className={`h-7 w-7 cursor-pointer rounded-md border text-[11px] ${
                    page === n
                      ? 'border-transparent bg-linear-to-br from-[#6C63FF] to-[#4DA3FF] font-semibold text-white'
                      : 'border-[#272D39] hover:bg-white/5'
                  }`}
                >
                  {n}
                </button>
              ))}
              <button
                type="button"
                aria-label="Next"
                onClick={() => setPage((p) => Math.min(5, p + 1))}
                className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-[#272D39] hover:bg-white/5"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Generate Bills drawer */}
      <AddGenerateBillsModal
        open={open}
        onClose={() => setOpen(false)}
        onGenerate={handleGenerate}
      />
    </div>
  )
}