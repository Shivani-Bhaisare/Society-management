'use client'

import { useEffect, useMemo, useRef, useState, type ElementType } from 'react'
import { AnimatePresence, motion, type Variants } from 'framer-motion'
import {
  Plus, Search, CalendarDays, ChevronDown, Users, UserCheck, Clock, UserX, MoreVertical,
  UserPlus, Package, Car, Briefcase, Truck,
  Eye, Trash2, CheckCircle2, LogIn, LogOut, X,
  type LucideIcon,
} from 'lucide-react'
import { Card, Badge } from '@/Components/ui'
import AddGateEntryModal, {
  type EntryType,
  type GateEntryPayload,
} from '@/Components/AddGateEntryModal'

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

/* ---------- Types ---------- */
type Tone = 'green' | 'blue' | 'orange' | 'gray'

type ActivityRow = {
  id: number | string
  n: string
  f: string
  p: string
  time: string
  date: string // YYYY-MM-DD, used by the date filter
  s: string
  st: Tone
  img: string // if empty, initials are shown
  isNew?: boolean // added via the modal
}

type LogRow = {
  id: number | string
  time: string
  date: string // YYYY-MM-DD, used by the date filter
  n: string
  f: string
  p: string
  type: 'Entry' | 'Exit'
  s: string
  st: Tone
  isNew?: boolean
}

// State of the three-dot dropdown / calendar popup (what is open and where to draw it)
type RowMenu = { id: ActivityRow['id']; top: number; left: number }
type CalPos = { top: number; left: number }

// Which popup is open (null = none)
type ModalState =
  | { type: 'view'; row: ActivityRow }
  | { type: 'delete'; row: ActivityRow }
  | { type: 'allActivity' }
  | { type: 'allLogs' }
  | null

// Dropdown / popup sizes used for positioning
const MENU_WIDTH = 184
const MENU_HEIGHT = 250
const CAL_WIDTH = 256

/* ---------- Data (replace with API later) ---------- */

// Top summary cards (base numbers: new entries get added to these)
const baseStats = [
  { label: "Today's Visitors", value: 48, sub: '↑ 12% yesterday', subC: 'text-emerald-400', icon: Users, c: '#3B82F6' },
  { label: 'Inside Visitors', value: 17, sub: 'Currently on premises', subC: 'text-slate-400', icon: UserCheck, c: '#00C2B8' },
  { label: 'Expected Visitors', value: 12, sub: 'Pre-approved today', subC: 'text-orange-400', icon: Clock, c: '#F59E0B' },
  { label: 'Blacklisted', value: 3, sub: 'Entry restricted', subC: 'text-red-400', icon: UserX, c: '#EF4444' },
]

// Recent gate activity rows (the date is added when the page loads: all demo rows are "today")
const initialActivity: Omit<ActivityRow, 'date'>[] = [
  { id: 1, n: 'Amit Sharma', f: 'A-204', p: 'Guest', time: '10:32 AM', s: 'Approved', st: 'green', img: '/img37.jpg' },
  { id: 2, n: 'Swiggy Delivery', f: '—', p: 'Delivery', time: '10:45 AM', s: 'Inside', st: 'blue', img: '/img38.jpg' },
  { id: 3, n: 'Rahul Cab', f: '—', p: 'Cab', time: '11:02 AM', s: 'Approved', st: 'green', img: '/img39.jpg' },
  { id: 4, n: 'Suresh Kumar', f: 'C-402', p: 'Service Provider', time: '11:20 AM', s: 'Approved', st: 'green', img: '/img22.jpg' },
  { id: 5, n: 'Neha Patel', f: 'B-103', p: 'Guest', time: '11:35 AM', s: 'Pending', st: 'orange', img: '/img26.jpg' },
]

// Quick entry actions (each button opens the modal with that type)
const quick: { l: string; t: EntryType; i: ElementType; c: string }[] = [
  { l: 'Visitor Entry', t: 'Visitor', i: UserPlus, c: '#3B82F6' },
  { l: 'Delivery Entry', t: 'Delivery', i: Package, c: '#00C2B8' },
  { l: 'Cab Entry', t: 'Cab', i: Car, c: '#8B5CF6' },
  { l: 'Service Provider', t: 'Service', i: Briefcase, c: '#F59E0B' },
  { l: 'Vehicle Entry', t: 'Vehicle', i: Truck, c: '#00C2B8' },
]

// Today's entry / exit logs (the date is added when the page loads)
const initialLogs: Omit<LogRow, 'date'>[] = [
  { id: 1, time: '10:32 AM', n: 'Amit Sharma', f: 'A-204', p: 'Guest', type: 'Entry', s: 'Inside', st: 'blue' },
  { id: 2, time: '11:20 AM', n: 'Suresh Kumar', f: 'C-402', p: 'Service Provider', type: 'Entry', s: 'Approved', st: 'green' },
  { id: 3, time: '11:45 AM', n: 'Priya Singh', f: 'B-203', p: 'Guest', type: 'Exit', s: 'Exited', st: 'gray' },
]

// Blacklisted phone numbers (to be fetched from the API later). The entry modal blocks these
const blacklistedPhones: string[] = []

const statusTone: Record<string, Tone> = {
  Approved: 'green',
  Inside: 'blue',
  Pending: 'orange',
  Exited: 'gray',
}

// All statuses (used in the three-dot dropdown)
const statusList = ['Approved', 'Pending', 'Inside', 'Exited'] as const

// Icon + hover colour of each status option in the three-dot dropdown
const statusIcon: Record<(typeof statusList)[number], { icon: LucideIcon; cls: string }> = {
  Approved: { icon: CheckCircle2, cls: 'hover:text-emerald-400' },
  Pending: { icon: Clock, cls: 'hover:text-amber-400' },
  Inside: { icon: LogIn, cls: 'hover:text-[#4DA3FF]' },
  Exited: { icon: LogOut, cls: 'hover:text-slate-200' },
}

// Date filter options
const ranges = ['Today', 'Yesterday', 'This Week', 'This Month'] as const
type Range = (typeof ranges)[number]

// Shared table header / cell styles (same as dashboard)
const th = 'bg-white/4 px-2 py-2 font-medium first:rounded-l-md last:rounded-r-md'
const td = 'border-t border-[#272D39] px-2 py-2.5'
const field =
  'w-full appearance-none rounded-lg border border-[#272D39] bg-[#10131A] px-3 py-2 text-xs text-slate-200 outline-none placeholder:text-slate-500 focus:border-[#A29CFF]/60'

/* ---------- Helpers ---------- */
const initials = (name: string) =>
  name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') || 'GE'

// "14:05" -> "02:05 PM"
const fmtTime = (hm: string) => {
  const [h, m] = hm.split(':').map(Number)
  const ap = h >= 12 ? 'PM' : 'AM'
  return `${String(h % 12 || 12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ap}`
}

// For the table's "Purpose" column
const purposeOf = (p: GateEntryPayload) =>
  p.type === 'Visitor' || p.type === 'Vehicle'
    ? p.purpose
    : p.type === 'Service'
    ? 'Service Provider'
    : p.type

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

// Date -> "YYYY-MM-DD" (local time)
const toStr = (d: Date) => {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}
const todayStr = () => toStr(new Date())

// "2026-10-30" + n days -> "YYYY-MM-DD"
const addDays = (iso: string, n: number) => {
  const [y, m, d] = iso.split('-').map(Number)
  return toStr(new Date(y, m - 1, d + n))
}

// Monday of the week of the given date
const mondayOf = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  return toStr(new Date(y, m - 1, d - ((dt.getDay() + 6) % 7)))
}

// "2026-10-30" -> "30 Oct 2026"
const fmtFull = (iso: string) => {
  const [y, m, d] = iso.split('-')
  return `${d} ${MONTHS[Number(m) - 1]} ${y}`
}

/* IMAGE: visitor photo (32x32). Shows initials if there is no photo */
function Avatar({ src, name }: { src: string; name: string }) {
  if (!src) {
    return (
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#272D39] bg-[#6C63FF]/25 text-[10px] font-bold text-[#A29CFF]">
        {initials(name)}
      </span>
    )
  }
  return (
    <img
      src={src}
      alt={name}
      width={32}
      height={32}
      className="h-8 w-8 shrink-0 rounded-full border border-[#272D39] object-cover"
    />
  )
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

// Single Close button used at the bottom of the view popups
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

function ViewEntryModal({ row, onClose }: { row: ActivityRow; onClose: () => void }) {
  return (
    <Modal title="Entry Details" sub={row.n} onClose={onClose} width="max-w-sm">
      {/* Photo + status */}
      <div className="flex items-center justify-between rounded-lg border border-[#272D39] bg-white/3 px-3 py-2">
        <span className="flex items-center gap-2">
          <Avatar src={row.img} name={row.n} />
          <span className="text-[11px] text-slate-400">Status</span>
        </span>
        <Badge tone={row.st}>{row.s}</Badge>
      </div>

      {/* Details */}
      <div className="mt-2 rounded-lg border border-[#272D39] bg-white/3 px-3">
        <DetailRow label="Entry No." value={`#${row.id}`} />
        <DetailRow label="Name" value={row.n} />
        <DetailRow label="Flat No." value={row.f} />
        <DetailRow label="Purpose" value={row.p} />
        <DetailRow label="Date" value={fmtFull(row.date)} />
        <DetailRow label="Time" value={row.time} />
      </div>

      <CloseRow onClose={onClose} />
    </Modal>
  )
}

/* ---------- Delete confirm popup ---------- */

function DeleteEntryConfirm({
  row,
  onClose,
  onConfirm,
}: {
  row: ActivityRow
  onClose: () => void
  onConfirm: () => void
}) {
  return (
    <Modal title="Delete Entry" sub="This action cannot be undone." onClose={onClose} width="max-w-sm">
      <p className="text-xs text-slate-300">
        Are you sure you want to delete the entry of{' '}
        <span className="font-semibold text-white">{row.n}</span> ({row.time})?
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
    </Modal>
  )
}

/* ---------- View All popups ---------- */

// View All (Recent Gate Activity): every entry, no date filter
function AllActivityModal({
  rows,
  onClose,
  onView,
}: {
  rows: ActivityRow[]
  onClose: () => void
  onView: (r: ActivityRow) => void
}) {
  return (
    <Modal title="All Gate Activity" sub={`${rows.length} entries`} onClose={onClose} width="max-w-3xl">
      <div className="overflow-x-auto">
        <table className="w-full min-w-150 text-left text-[11px]">
          <thead className="text-slate-400">
            <tr>
              <th className={th}>Photo</th>
              <th className={th}>Name</th>
              <th className={th}>Flat No.</th>
              <th className={th}>Purpose</th>
              <th className={th}>Date</th>
              <th className={th}>Time</th>
              <th className={th}>Status</th>
              <th className={th} />
            </tr>
          </thead>
          <tbody>
            {rows.map((a) => (
              <tr key={a.id}>
                <td className={td}>
                  <Avatar src={a.img} name={a.n} />
                </td>
                <td className={`${td} font-medium`}>{a.n}</td>
                <td className={`${td} text-slate-400`}>{a.f}</td>
                <td className={`${td} text-slate-400`}>{a.p}</td>
                <td className={`${td} text-slate-400`}>{fmtFull(a.date)}</td>
                <td className={`${td} text-slate-400`}>{a.time}</td>
                <td className={td}><Badge tone={a.st}>{a.s}</Badge></td>
                <td className={td}>
                  <button
                    type="button"
                    onClick={() => onView(a)}
                    className="cursor-pointer rounded-md border border-[#272D39] px-2.5 py-1 text-[10px] text-slate-300 hover:bg-white/5"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className={`${td} py-8 text-center text-slate-500`}>
                  No entries found
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

// View All (Entry / Exit Logs): every log, no date filter
function AllLogsModal({ rows, onClose }: { rows: LogRow[]; onClose: () => void }) {
  return (
    <Modal title="All Entry / Exit Logs" sub={`${rows.length} logs`} onClose={onClose} width="max-w-3xl">
      <div className="overflow-x-auto">
        <table className="w-full min-w-140 text-left text-[11px]">
          <thead className="text-slate-400">
            <tr>
              <th className={th}>Date</th>
              <th className={th}>Time</th>
              <th className={th}>Name</th>
              <th className={th}>Flat No.</th>
              <th className={th}>Purpose</th>
              <th className={th}>Type</th>
              <th className={th}>Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((l) => (
              <tr key={l.id}>
                <td className={`${td} text-slate-400`}>{fmtFull(l.date)}</td>
                <td className={`${td} text-slate-400`}>{l.time}</td>
                <td className={`${td} font-medium`}>{l.n}</td>
                <td className={`${td} text-slate-400`}>{l.f}</td>
                <td className={`${td} text-slate-400`}>{l.p}</td>
                <td className={`${td} text-slate-400`}>{l.type}</td>
                <td className={td}><Badge tone={l.st}>{l.s}</Badge></td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={7} className={`${td} py-8 text-center text-slate-500`}>
                  No logs found
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
export default function GateManagementPage() {
  // Demo rows are all "today" (the date is added here so it is always the real current date)
  const [activity, setActivity] = useState<ActivityRow[]>(() =>
    initialActivity.map((a) => ({ ...a, date: todayStr() })),
  )
  const [logs, setLogs] = useState<LogRow[]>(() =>
    initialLogs.map((l) => ({ ...l, date: todayStr() })),
  )

  const [showEntryModal, setShowEntryModal] = useState(false)
  const [entryType, setEntryType] = useState<EntryType>('Visitor')

  // Date filter: the dropdown range, or a specific date picked from the calendar (picked wins)
  const [range, setRange] = useState<Range>('Today')
  const [picked, setPicked] = useState('')

  // Popup that is open (null = closed) + success message
  const [modal, setModal] = useState<ModalState>(null)
  const [toast, setToast] = useState('')

  // Three-dot dropdown + calendar popup state
  const [menu, setMenu] = useState<RowMenu | null>(null)
  const [cal, setCal] = useState<CalPos | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const calRef = useRef<HTMLDivElement>(null)

  // Hide the success message after 3 seconds
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 3000)
    return () => clearTimeout(t)
  }, [toast])

  // Close the dropdown / calendar on outside click, Escape key or page scroll
  useEffect(() => {
    if (!menu && !cal) return

    const closeAll = () => {
      setMenu(null)
      setCal(null)
    }
    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      // Ignore clicks inside the popups and on their buttons (the buttons toggle on their own)
      if (
        menuRef.current?.contains(target) ||
        calRef.current?.contains(target) ||
        target.closest('[data-menu-btn]') ||
        target.closest('[data-cal-btn]')
      )
        return
      closeAll()
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeAll()
    }

    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('keydown', onKeyDown)
    window.addEventListener('scroll', closeAll, true)
    window.addEventListener('resize', closeAll)
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('scroll', closeAll, true)
      window.removeEventListener('resize', closeAll)
    }
  }, [menu, cal])

  const close = () => setModal(null)

  // Open the modal (with a type)
  const openEntry = (t: EntryType = 'Visitor') => {
    setEntryType(t)
    setShowEntryModal(true)
  }

  // Add the new entry from the modal to the lists
  function handleSave(p: GateEntryPayload) {
    const time = fmtTime(p.entryTime)
    const tone = statusTone[p.status] ?? 'gray'
    const flat = p.flat || '—'

    setActivity((prev) => [
      {
        id: p.id,
        n: p.name,
        f: flat,
        p: purposeOf(p),
        time,
        date: todayStr(),
        s: p.status,
        st: tone,
        // Local URL for preview for now. After the API, the server's photo URL will go here
        img: p.photo ? URL.createObjectURL(p.photo) : '',
        isNew: true,
      },
      ...prev,
    ])

    setLogs((prev) => [
      { id: p.id, time, date: todayStr(), n: p.name, f: flat, p: purposeOf(p), type: 'Entry', s: p.status, st: tone, isNew: true },
      ...prev,
    ])

    // TODO: add the API call here (along with the p.photo upload)
    console.log('New entry:', p)
  }

  // Three-dot status option: changes the status and the matching log row (replace with an API call later)
  const changeStatus = (a: ActivityRow, next: (typeof statusList)[number]) => {
    setMenu(null)
    setActivity((prev) =>
      prev.map((x) => (x.id === a.id ? { ...x, s: next, st: statusTone[next] } : x)),
    )
    setLogs((prev) =>
      prev.map((l) =>
        l.n === a.n && l.time === a.time
          ? { ...l, s: next, st: statusTone[next], type: next === 'Exited' ? 'Exit' : 'Entry' }
          : l,
      ),
    )
    setToast(`${a.n} is now ${next}`)
  }

  // Delete: removes the entry and its matching log row (replace with an API call later)
  const handleDelete = () => {
    if (modal?.type !== 'delete') return
    const { row } = modal
    setActivity((prev) => prev.filter((x) => x.id !== row.id))
    setLogs((prev) => prev.filter((l) => !(l.n === row.n && l.time === row.time)))
    setToast(`${row.n} deleted`)
    close()
  }

  // Three-dot click: toggle the dropdown under the clicked button (flips up near the bottom of the screen)
  const toggleMenu = (e: React.MouseEvent<HTMLButtonElement>, id: ActivityRow['id']) => {
    setCal(null)
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

  // Calendar click: toggle the date popup under the button
  const toggleCal = (e: React.MouseEvent<HTMLButtonElement>) => {
    setMenu(null)
    if (cal) {
      setCal(null)
      return
    }
    const rect = e.currentTarget.getBoundingClientRect()
    setCal({
      top: rect.bottom + 8,
      left: Math.max(8, Math.min(rect.right - CAL_WIDTH, window.innerWidth - CAL_WIDTH - 8)),
    })
  }

  // The row the open dropdown belongs to
  const menuRow = menu ? activity.find((a) => a.id === menu.id) : null

  // Does a row's date match the current date filter?
  const inRange = (iso: string) => {
    if (picked) return iso === picked
    const t = todayStr()
    if (range === 'Today') return iso === t
    if (range === 'Yesterday') return iso === addDays(t, -1)
    if (range === 'This Week') return iso >= mondayOf(t) && iso <= t
    return iso.slice(0, 7) === t.slice(0, 7) // This Month
  }

  // Rows shown in the two tables (date filter applied)
  const activityList = useMemo(() => activity.filter((a) => inRange(a.date)), [activity, range, picked]) // eslint-disable-line react-hooks/exhaustive-deps
  const logList = useMemo(() => logs.filter((l) => inRange(l.date)), [logs, range, picked]) // eslint-disable-line react-hooks/exhaustive-deps

  // Stat cards: demo numbers + new entries (remove this once the API is in place)
  const stats = useMemo(() => {
    const added = activity.filter((a) => a.isNew)
    const bumps = [
      added.length, // Today's Visitors
      added.filter((a) => a.s === 'Inside').length, // Inside Visitors
      0, // Expected Visitors
      0, // Blacklisted
    ]
    return baseStats.map((s, i) => ({ ...s, value: String(s.value + bumps[i]) }))
  }, [activity])

  return (
    <div className="mx-auto flex w-full max-w-350 flex-col gap-4">
      {/* Header */}
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
        className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
      >
        <motion.div variants={item}>
          <h1 className="text-xl font-bold sm:text-2xl">Security / Gate Management</h1>
          <p className="text-xs text-slate-400">Manage visitors, vehicles and gate activity</p>
        </motion.div>
        {/* Primary button: gradient #6C63FF -> #4DA3FF */}
        <motion.div variants={item}>
          <button
            type="button"
            onClick={() => openEntry()}
            className="flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-linear-to-r from-[#6C63FF] to-[#4DA3FF] px-4 py-2.5 text-xs font-semibold text-white transition hover:opacity-90 active:scale-95"
          >
            <Plus className="h-3.5 w-3.5" /> Add Entry
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
        {/* Search */}
        <motion.div
          variants={item}
          className="flex flex-1 items-center gap-2 rounded-lg border border-[#272D39] bg-[#10131A] px-3 py-2 transition-colors hover:border-[#A29CFF]/60 focus-within:border-[#A29CFF]/60 sm:min-w-60"
        >
          <Search className="h-4 w-4 shrink-0 text-slate-500" />
          <input
            type="text"
            placeholder="Search visitor, flat, vehicle..."
            className="w-full bg-transparent text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none"
          />
        </motion.div>

        {/* Gate select */}
        <motion.div variants={item} className="relative">
          <select className="w-full appearance-none rounded-lg border border-[#272D39] bg-[#10131A] py-2 pl-3 pr-8 text-xs text-slate-300 focus:outline-none sm:w-36">
            <option>All Gates</option>
            <option>Main Gate</option>
            <option>Gate 2</option>
            <option>Service Gate</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        </motion.div>

        {/* Date select: picking an option clears a calendar date. A picked calendar date shows here as "Custom" */}
        <motion.div variants={item} className="relative">
          <select
            value={picked ? 'Custom' : range}
            onChange={(e) => {
              setPicked('')
              setRange(e.target.value as Range)
            }}
            className="w-full appearance-none rounded-lg border border-[#272D39] bg-[#10131A] py-2 pl-3 pr-8 text-xs text-slate-300 focus:outline-none sm:w-36"
          >
            {picked && <option value="Custom">{fmtFull(picked)}</option>}
            {ranges.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        </motion.div>

        {/* Calendar button: opens the date popup (purple border while a date is picked) */}
        <motion.button
          variants={item}
          type="button"
          data-cal-btn
          title="Pick a date"
          aria-label="Pick a date"
          aria-expanded={!!cal}
          onClick={toggleCal}
          className={`flex cursor-pointer items-center justify-center rounded-lg border bg-[#10131A] p-2 hover:bg-white/5 ${
            picked || cal ? 'border-[#6C63FF] text-[#A29CFF]' : 'border-[#272D39] text-slate-300'
          }`}
        >
          <CalendarDays className="h-4 w-4" />
        </motion.button>
      </motion.div>

      {/* Stat cards (same card size as President dashboard cards) */}
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
            <p className={`mt-1 text-[10px] ${subC}`}>{sub}</p>
            <span className="absolute inset-x-0 bottom-0 h-0.75" style={{ background: c }} />
          </motion.div>
        ))}
      </motion.div>

      {/* Recent activity + Quick actions */}
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
        className="grid grid-cols-1 gap-4 xl:grid-cols-3"
      >
        <motion.div variants={item} className="xl:col-span-2">
          <Card
            title="Recent Gate Activity" sub="Latest visitors and vehicles"
            action={
              // View All: opens the all gate activity popup
              <button
                type="button"
                onClick={() => setModal({ type: 'allActivity' })}
                className="cursor-pointer text-[11px] text-[#A29CFF] hover:underline"
              >
                View All
              </button>
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-155 text-left text-[11px]">
                <thead className="text-slate-400">
                  <tr>
                    <th className={th}>Photo</th>
                    <th className={th}>Name</th>
                    <th className={th}>Flat No.</th>
                    <th className={th}>Purpose</th>
                    <th className={th}>Time</th>
                    <th className={th}>Status</th>
                    <th className={th} />
                  </tr>
                </thead>
                <tbody>
                  {activityList.map((a) => (
                    <tr key={a.id}>
                      <td className={td}>
                        <Avatar src={a.img} name={a.n} />
                      </td>
                      <td className={`${td} font-medium`}>{a.n}</td>
                      <td className={`${td} text-slate-400`}>{a.f}</td>
                      <td className={`${td} text-slate-400`}>{a.p}</td>
                      <td className={`${td} text-slate-400`}>{a.time}</td>
                      <td className={td}><Badge tone={a.st}>{a.s}</Badge></td>
                      <td className={td}>
                        {/* Three dot: opens the actions dropdown */}
                        <button
                          type="button"
                          data-menu-btn
                          aria-label={`More actions for ${a.n}`}
                          aria-haspopup="menu"
                          aria-expanded={menu?.id === a.id}
                          onClick={(e) => toggleMenu(e, a.id)}
                          className={`cursor-pointer text-slate-500 hover:text-slate-300 ${
                            menu?.id === a.id ? 'text-slate-200' : ''
                          }`}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}

                  {/* Empty state */}
                  {activityList.length === 0 && (
                    <tr>
                      <td colSpan={7} className={`${td} py-8 text-center text-slate-500`}>
                        No gate activity found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={item} className={cellClass}>
          <Card title="Quick Actions" sub="Log a new gate entry">
            <div className="flex flex-col gap-2">
              {quick.map(({ l, t, i: Icon, c }) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => openEntry(t)}
                  className="flex w-full items-center gap-3 rounded-lg border border-[#272D39] bg-white/3 px-3 py-2.5 text-left transition-colors hover:bg-white/5"
                  style={{ background: `${c}14` }}
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: `${c}26`, color: c }}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="text-xs font-semibold text-slate-200">{l}</span>
                </button>
              ))}
            </div>
          </Card>
        </motion.div>
      </motion.div>

      {/* Today's entry / exit logs */}
      <motion.div
        variants={item}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
      >
        <Card
          title="Today's Entry / Exit Logs" sub="Gate movement for today"
          action={
            // View All: opens the all logs popup
            <button
              type="button"
              onClick={() => setModal({ type: 'allLogs' })}
              className="cursor-pointer text-[11px] text-[#A29CFF] hover:underline"
            >
              View All
            </button>
          }
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-140 text-left text-[11px]">
              <thead className="text-slate-400">
                <tr>
                  <th className={th}>Time</th>
                  <th className={th}>Name</th>
                  <th className={th}>Flat No.</th>
                  <th className={th}>Purpose</th>
                  <th className={th}>Type</th>
                  <th className={th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {logList.map((l) => (
                  <tr key={l.id}>
                    <td className={`${td} text-slate-400`}>{l.time}</td>
                    <td className={`${td} font-medium`}>{l.n}</td>
                    <td className={`${td} text-slate-400`}>{l.f}</td>
                    <td className={`${td} text-slate-400`}>{l.p}</td>
                    <td className={`${td} text-slate-400`}>{l.type}</td>
                    <td className={td}><Badge tone={l.st}>{l.s}</Badge></td>
                  </tr>
                ))}

                {/* Empty state */}
                {logList.length === 0 && (
                  <tr>
                    <td colSpan={6} className={`${td} py-8 text-center text-slate-500`}>
                      No logs found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </motion.div>

      {/* Calendar popup: fixed position so nothing clips it */}
      {cal && (
        <div
          ref={calRef}
          style={{ top: cal.top, left: cal.left, width: CAL_WIDTH }}
          className="fixed z-50 rounded-lg border border-[#272D39] bg-[#10131A] p-3 text-[11px] shadow-xl shadow-black/40"
        >
          <label className="flex flex-col gap-1 text-slate-400">
            Pick a date
            <input
              type="date"
              max={todayStr()}
              value={picked}
              onChange={(e) => {
                setPicked(e.target.value)
                if (e.target.value) setCal(null)
              }}
              className={`${field} scheme-dark`}
            />
          </label>
          <p className="mt-2 text-[10px] text-slate-500">
            {picked ? `Showing entries for ${fmtFull(picked)}` : 'Showing entries for the selected range'}
          </p>
          {picked && (
            <button
              type="button"
              onClick={() => {
                setPicked('')
                setCal(null)
              }}
              className="mt-2 w-full cursor-pointer rounded-lg border border-[#272D39] px-3 py-1.5 text-[11px] font-semibold text-slate-300 transition hover:bg-white/5 active:scale-95"
            >
              Clear date
            </button>
          )}
        </div>
      )}

      {/* Three-dot dropdown: fixed position so the table's overflow does not clip it */}
      {menu && menuRow && (
        <div
          ref={menuRef}
          role="menu"
          style={{ top: menu.top, left: menu.left, width: MENU_WIDTH }}
          className="fixed z-50 overflow-hidden rounded-lg border border-[#272D39] bg-[#10131A] p-1 text-[11px] shadow-xl shadow-black/40"
        >
          {/* View details */}
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setModal({ type: 'view', row: menuRow })
              setMenu(null)
            }}
            className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-left text-slate-300 transition-colors hover:bg-white/5"
          >
            <Eye className="h-3.5 w-3.5" /> View Details
          </button>

          {/* Divider */}
          <div className="my-1 border-t border-[#272D39]" />

          {/* Status options: every status except the current one */}
          {statusList
            .filter((s) => s !== menuRow.s)
            .map((s) => {
              const { icon: StatusIcon, cls } = statusIcon[s]
              return (
                <button
                  key={s}
                  type="button"
                  role="menuitem"
                  onClick={() => changeStatus(menuRow, s)}
                  className={`flex w-full cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-left text-slate-300 transition-colors hover:bg-white/5 ${cls}`}
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
              setModal({ type: 'delete', row: menuRow })
              setMenu(null)
            }}
            className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-left text-red-400 transition-colors hover:bg-red-500/10"
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
        </div>
      )}

      {/* Add Gate Entry modal (outside the motion wrappers) */}
      <AddGateEntryModal
        open={showEntryModal}
        onClose={() => setShowEntryModal(false)}
        defaultType={entryType}
        blacklistedPhones={blacklistedPhones}
        onSave={handleSave}
      />

      {/* Popups */}
      <AnimatePresence>
        {modal?.type === 'view' && (
          <ViewEntryModal key={`view-${modal.row.id}`} row={modal.row} onClose={close} />
        )}

        {modal?.type === 'delete' && (
          <DeleteEntryConfirm
            key={`delete-${modal.row.id}`}
            row={modal.row}
            onClose={close}
            onConfirm={handleDelete}
          />
        )}

        {modal?.type === 'allActivity' && (
          <AllActivityModal
            key="all-activity"
            rows={activity}
            onClose={close}
            onView={(r) => setModal({ type: 'view', row: r })}
          />
        )}

        {modal?.type === 'allLogs' && (
          <AllLogsModal key="all-logs" rows={logs} onClose={close} />
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