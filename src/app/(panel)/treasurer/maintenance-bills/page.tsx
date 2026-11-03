'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion, type Variants } from 'framer-motion'
import {
  Plus, FileText, CheckCircle2, Clock, AlertCircle, Search,
  Calendar, ChevronDown, ChevronLeft, ChevronRight, BadgeCheck, Trash2,
  Eye, Pencil, EllipsisVertical, Send, X, type LucideIcon,
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

// State of the three-dot dropdown (which row is open and where to draw it)
type RowMenu = { id: number; top: number; left: number }

// Dropdown size used for positioning (View + Edit + Reminder + 2 status options + Delete)
const MENU_WIDTH = 184
const MENU_HEIGHT = 250

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
const billStatuses: Status[] = ['Paid', 'Pending', 'Overdue']

// Status pill colours
const statusStyle: Record<Status, string> = {
  Paid: 'bg-emerald-500/15 text-emerald-400',
  Pending: 'bg-amber-500/15 text-amber-400',
  Overdue: 'bg-red-500/15 text-red-400',
}

// Icon + hover colour of each status option in the three-dot dropdown
const statusIcon: Record<Status, { icon: LucideIcon; cls: string }> = {
  Paid: { icon: BadgeCheck, cls: 'hover:text-emerald-400' },
  Pending: { icon: Clock, cls: 'hover:text-amber-400' },
  Overdue: { icon: AlertCircle, cls: 'hover:text-red-400' },
}

/* ---------- Shared styles (same as Charge Heads / Residents) ---------- */

const th = 'bg-white/4 px-2 py-2 font-medium first:rounded-l-md last:rounded-r-md'
const td = 'border-t border-[#272D39] px-2 py-2.5'
const field =
  'w-full rounded-lg border border-[#272D39] bg-[#10131A] px-3 py-2 text-xs text-slate-200 outline-none placeholder:text-slate-500 focus:border-[#A29CFF]/60'

// Shared style of every plain item inside the 3-dot action menu
const menuBtn =
  'flex w-full cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-left text-slate-300 transition-colors hover:bg-white/5'

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
        {options.map((o) => <option key={o} value={o} className="bg-[#10131A]">{o}</option>)}
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

// Row actions: a single 3-dot button that opens the action menu
function Actions({
  bill, menuOpen, onMore,
}: {
  bill: Bill
  menuOpen: boolean
  onMore: (e: React.MouseEvent<HTMLButtonElement>) => void
}) {
  return (
    <button
      type="button"
      data-menu-btn
      title="More actions"
      aria-label={`Open actions menu for ${bill.billNo}`}
      aria-haspopup="menu"
      aria-expanded={menuOpen}
      onClick={onMore}
      className={`inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-[#272D39] text-slate-300 transition hover:bg-white/5 hover:text-white active:scale-90 ${
        menuOpen ? 'bg-white/5 text-white' : ''
      }`}
    >
      <EllipsisVertical className="h-3.5 w-3.5" />
    </button>
  )
}

/* ---------- Popups ---------- */

// Close on Esc + lock page scroll while a popup is open
function usePopupBehavior(onClose: () => void) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])
}

const backdropCls =
  'fixed inset-0 z-70 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm'

// One detail row (label on the left, value on the right)
function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-[#272D39] py-2 text-[11px] first:border-t-0">
      <span className="shrink-0 text-slate-400">{label}</span>
      <span className="text-right font-medium text-slate-200">{value}</span>
    </div>
  )
}

/* View Details popup */
function ViewBillModal({ record, onClose }: { record: Bill; onClose: () => void }) {
  usePopupBehavior(onClose)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
      className={backdropCls}
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.96 }}
        transition={{ duration: 0.3, ease: EASE }}
        className="max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-xl border border-[#272D39] bg-[#10131A] p-4 text-white shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#3B82F6]/15 text-[#3B82F6]">
              <FileText className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <h2 className="text-sm font-bold">Bill Details</h2>
              <p className="truncate text-[11px] text-slate-400">{record.billNo}</p>
            </div>
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

        {/* Status */}
        <div className="mt-3 flex items-center justify-between rounded-lg border border-[#272D39] bg-white/3 px-3 py-2">
          <span className="text-[11px] text-slate-400">Status</span>
          <StatusPill status={record.status} />
        </div>

        {/* Details */}
        <div className="mt-2 rounded-lg border border-[#272D39] bg-white/3 px-3">
          <DetailRow label="Bill No." value={record.billNo} />
          <DetailRow label="Flat No." value={record.flat} />
          <DetailRow label="Wing" value={record.wing} />
          <DetailRow label="Resident" value={record.resident} />
          <DetailRow label="Billing Month" value={record.month} />
          <DetailRow label="Amount" value={`₹ ${record.amount.toLocaleString('en-IN')}`} />
          <DetailRow label="Due Date" value={record.due} />
        </div>

        {/* Actions */}
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg border border-[#272D39] px-4 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/5 active:scale-95"
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

/* Edit Bill popup */
function EditBillModal({
  record, onClose, onSubmit,
}: {
  record: Bill
  onClose: () => void
  onSubmit: (updated: Bill) => void
}) {
  const [resident, setResident] = useState(record.resident)
  const [amount, setAmount] = useState(String(record.amount))
  const [due, setDue] = useState(record.due)
  const [bStatus, setBStatus] = useState<Status>(record.status)
  const [error, setError] = useState('')

  usePopupBehavior(onClose)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const amountNum = Number(amount)
    if (resident.trim().length < 3) {
      setError('Resident name must be at least 3 characters.')
      return
    }
    if (amount.trim() === '' || Number.isNaN(amountNum) || amountNum <= 0) {
      setError('Amount must be a number greater than 0.')
      return
    }
    if (!due.trim()) {
      setError('Please enter the due date.')
      return
    }
    onSubmit({
      ...record,
      resident: resident.trim(),
      amount: Math.round(amountNum),
      due: due.trim(),
      status: bStatus,
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
      className={backdropCls}
    >
      <motion.form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.96 }}
        transition={{ duration: 0.3, ease: EASE }}
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl border border-[#272D39] bg-[#10131A] p-5 text-white shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-bold">Edit Bill</h2>
            <p className="text-[11px] text-slate-400">
              {record.billNo} · {record.flat} · {record.month}
            </p>
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

        {/* Form fields */}
        <div className="mt-4 flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-[11px] text-slate-400">
            Resident Name
            <input
              value={resident}
              onChange={(e) => { setResident(e.target.value); setError('') }}
              className={field}
              autoFocus
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-[11px] text-slate-400">
              Amount (₹)
              <input
                type="number"
                min={1}
                value={amount}
                onChange={(e) => { setAmount(e.target.value); setError('') }}
                className={field}
              />
            </label>

            <label className="flex flex-col gap-1 text-[11px] text-slate-400">
              Due Date
              <input
                value={due}
                onChange={(e) => { setDue(e.target.value); setError('') }}
                placeholder="e.g. 10 Apr 2025"
                className={field}
              />
            </label>
          </div>

          <label className="flex flex-col gap-1 text-[11px] text-slate-400">
            Status
            <SelectBox
              value={bStatus}
              onChange={(v) => setBStatus(v as Status)}
              options={billStatuses}
            />
          </label>

          {error && <p className="text-[11px] text-red-400">{error}</p>}
        </div>

        {/* Actions */}
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg border border-[#272D39] px-4 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/5 active:scale-95"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="cursor-pointer rounded-lg bg-linear-to-r from-[#6C63FF] to-[#4DA3FF] px-4 py-2 text-xs font-semibold text-white transition hover:opacity-90 active:scale-95"
          >
            Save Changes
          </button>
        </div>
      </motion.form>
    </motion.div>
  )
}

/* Delete confirm popup */
function DeleteBillConfirm({
  record, onClose, onConfirm,
}: {
  record: Bill
  onClose: () => void
  onConfirm: () => void
}) {
  usePopupBehavior(onClose)

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
      className={backdropCls}
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.96 }}
        transition={{ duration: 0.3, ease: EASE }}
        className="w-full max-w-sm rounded-xl border border-[#272D39] bg-[#10131A] p-5 text-white shadow-2xl"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-500/15 text-red-400">
            <Trash2 className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-base font-bold">Delete Bill</h2>
            <p className="text-[11px] text-slate-400">This action cannot be undone.</p>
          </div>
        </div>

        <p className="mt-4 text-xs text-slate-300">
          Are you sure you want to delete bill{' '}
          <span className="font-semibold text-white">{record.billNo}</span> of{' '}
          <span className="font-semibold text-white">{record.resident}</span>?
        </p>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg border border-[#272D39] px-4 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/5 active:scale-95"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="cursor-pointer rounded-lg bg-red-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-red-600 active:scale-95"
          >
            Delete
          </button>
        </div>
      </motion.div>
    </motion.div>
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

  // Bill open in the View / Edit / Delete popup (null = closed)
  const [viewing, setViewing] = useState<Bill | null>(null)
  const [editing, setEditing] = useState<Bill | null>(null)
  const [deleting, setDeleting] = useState<Bill | null>(null)
  // Small success message after an action
  const [toast, setToast] = useState('')

  // Three-dot dropdown state
  const [menu, setMenu] = useState<RowMenu | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Hide the success message after 3 seconds
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 3000)
    return () => clearTimeout(t)
  }, [toast])

  // Close the dropdown on outside click, Escape key or page scroll
  useEffect(() => {
    if (!menu) return

    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      // Ignore clicks on the dropdown itself and on the three-dot buttons (they toggle on their own)
      if (menuRef.current?.contains(target) || target.closest('[data-menu-btn]')) return
      setMenu(null)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenu(null)
    }
    const onScroll = () => setMenu(null)

    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('keydown', onKeyDown)
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onScroll)
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onScroll)
    }
  }, [menu])

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

  // Edit: save the changed details (replace with an API call later)
  const handleEdit = (updated: Bill) => {
    setBills((prev) => prev.map((b) => (b.id === updated.id ? updated : b)))
    setToast(`Bill ${updated.billNo} updated`)
    setEditing(null)
  }

  // Three-dot status option: changes only the status (replace with an API call later)
  const changeStatus = (b: Bill, next: Status) => {
    setMenu(null)
    setBills((prev) => prev.map((x) => (x.id === b.id ? { ...x, status: next } : x)))
    setToast(`Bill ${b.billNo} is now ${next}`)
  }

  // Send reminder (replace with an API call later)
  const sendReminder = (b: Bill) => {
    setMenu(null)
    setToast(`Reminder sent to ${b.resident}`)
  }

  // Delete: removes the bill (replace with an API call later)
  const handleDelete = () => {
    if (!deleting) return
    setBills((prev) => prev.filter((b) => b.id !== deleting.id))
    setToast(`Bill ${deleting.billNo} deleted`)
    setDeleting(null)
  }

  // Three-dot click: toggle the dropdown under the clicked button (flips up near the bottom of the screen)
  const toggleMenu = (e: React.MouseEvent<HTMLButtonElement>, id: number) => {
    if (menu?.id === id) {
      setMenu(null)
      return
    }
    const rect = e.currentTarget.getBoundingClientRect()
    const openUp = rect.bottom + MENU_HEIGHT + 8 > window.innerHeight
    setMenu({
      id,
      top: openUp ? rect.top - MENU_HEIGHT - 4 : rect.bottom + 4,
      left: Math.max(8, rect.right - MENU_WIDTH),
    })
  }

  // The bill the open dropdown belongs to
  const menuBill = menu ? bills.find((b) => b.id === menu.id) : null

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
                  <th className={`${th} text-center`}>Actions</th>
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

                    {/* Actions: single 3-dot button (same as Vendors) */}
                    <td className={`${td} text-center`}>
                      <Actions
                        bill={b}
                        menuOpen={menu?.id === b.id}
                        onMore={(e) => toggleMenu(e, b.id)}
                      />
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

      {/* Three-dot dropdown: fixed position so the table's overflow does not clip it */}
      {menu && menuBill && (
        <div
          ref={menuRef}
          role="menu"
          style={{ top: menu.top, left: menu.left, width: MENU_WIDTH }}
          className="fixed z-50 overflow-hidden rounded-lg border border-[#272D39] bg-[#10131A] p-1 text-[11px] shadow-xl shadow-black/40"
        >
          {/* View Details: opens the details popup */}
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setViewing(menuBill)
              setMenu(null)
            }}
            className={menuBtn}
          >
            <Eye className="h-3.5 w-3.5" /> View Details
          </button>

          {/* Edit: opens the edit popup */}
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setEditing(menuBill)
              setMenu(null)
            }}
            className={menuBtn}
          >
            <Pencil className="h-3.5 w-3.5" /> Edit
          </button>

          {/* Send Reminder: only for bills that are not paid yet */}
          {menuBill.status !== 'Paid' && (
            <button
              type="button"
              role="menuitem"
              onClick={() => sendReminder(menuBill)}
              className={menuBtn}
            >
              <Send className="h-3.5 w-3.5" /> Send Reminder
            </button>
          )}

          {/* Divider */}
          <div className="my-1 border-t border-[#272D39]" />

          {/* Status options: every status except the current one */}
          {billStatuses
            .filter((s) => s !== menuBill.status)
            .map((s) => {
              const { icon: StatusIcon, cls } = statusIcon[s]
              return (
                <button
                  key={s}
                  type="button"
                  role="menuitem"
                  onClick={() => changeStatus(menuBill, s)}
                  className={`${menuBtn} ${cls}`}
                >
                  <StatusIcon className="h-3.5 w-3.5" /> Mark as {s}
                </button>
              )
            })}

          {/* Divider */}
          <div className="my-1 border-t border-[#272D39]" />

          {/* Delete: opens the confirm popup */}
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setDeleting(menuBill)
              setMenu(null)
            }}
            className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-left text-red-400 transition-colors hover:bg-red-500/10"
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
        </div>
      )}

      {/* Generate Bills drawer */}
      <AddGenerateBillsModal
        open={open}
        onClose={() => setOpen(false)}
        onGenerate={handleGenerate}
      />

      {/* View Details popup */}
      <AnimatePresence>
        {viewing && (
          <ViewBillModal
            key={viewing.id}
            record={viewing}
            onClose={() => setViewing(null)}
          />
        )}
      </AnimatePresence>

      {/* Edit popup */}
      <AnimatePresence>
        {editing && (
          <EditBillModal
            key={editing.id}
            record={editing}
            onClose={() => setEditing(null)}
            onSubmit={handleEdit}
          />
        )}
      </AnimatePresence>

      {/* Delete confirm popup */}
      <AnimatePresence>
        {deleting && (
          <DeleteBillConfirm
            key={deleting.id}
            record={deleting}
            onClose={() => setDeleting(null)}
            onConfirm={handleDelete}
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