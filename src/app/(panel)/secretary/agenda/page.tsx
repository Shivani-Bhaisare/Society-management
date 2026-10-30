'use client'

import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion, type Variants } from 'framer-motion'
import {
  Plus, ChevronDown, ChevronLeft, ChevronRight, RotateCcw,
  Eye, Pencil, Trash2, CheckCircle2, X, Clock, PlayCircle,
} from 'lucide-react'
import { Card, Badge } from '@/Components/ui'
import AddAgendaModal, { type AgendaPayload } from '@/Components/AddAgendaModal'

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

/* ---------- Data (replace with API data later) ---------- */
type Status = 'Upcoming' | 'In Progress' | 'Completed'

type AgendaItem = { id: number; title: string; meeting: string; status: Status }

// Initial agenda items
const initialAgenda: AgendaItem[] = [
  { id: 1, title: 'Maintenance work approval', meeting: '12 Oct 2026', status: 'Upcoming' },
  { id: 2, title: 'Budget allocation for 2026', meeting: '25 Oct 2026', status: 'Upcoming' },
  { id: 3, title: 'New parking policy', meeting: '25 Oct 2026', status: 'In Progress' },
  { id: 4, title: 'Clubhouse renovation plan', meeting: '30 Oct 2026', status: 'In Progress' },
  { id: 5, title: 'Security staff enhancement', meeting: '30 Oct 2026', status: 'Completed' },
  { id: 6, title: 'Festival celebration plan', meeting: '15 Nov 2026', status: 'Completed' },
  { id: 7, title: 'Waste management update', meeting: '15 Nov 2026', status: 'Completed' },
  { id: 8, title: 'Water supply maintenance', meeting: '20 Nov 2026', status: 'Completed' },
]

// Badge tone for each status
const tone: Record<Status, 'blue' | 'orange' | 'green'> = {
  Upcoming: 'blue',
  'In Progress': 'orange',
  Completed: 'green',
}

const tabs: ('All' | Status)[] = ['All', 'Upcoming', 'In Progress', 'Completed']

// All real statuses (used in the Edit popup and the status icons)
const statusList: Status[] = ['Upcoming', 'In Progress', 'Completed']

// Icon + colour of the status change button in the Actions column
const statusIcon: Record<Status, { icon: React.ElementType; cls: string }> = {
  Upcoming: { icon: Clock, cls: 'hover:bg-[#3B82F6]/10 hover:text-[#3B82F6]' },
  'In Progress': { icon: PlayCircle, cls: 'hover:bg-amber-500/10 hover:text-amber-400' },
  Completed: { icon: CheckCircle2, cls: 'hover:bg-emerald-500/10 hover:text-emerald-400' },
}

// "2026-10-13" -> "13 Oct 2026"
const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

// Shared table + form field styles
const th = 'bg-white/[0.04] px-2 py-2 font-medium first:rounded-l-md last:rounded-r-md'
const td = 'border-t border-[#272D39] px-2 py-2.5'
const field =
  'w-full appearance-none rounded-lg border border-[#272D39] bg-[#10131A] px-3 py-2 pr-8 text-xs text-slate-200 outline-none focus:border-[#A29CFF]/60'

// Small icon button used in the Actions column
const iconBtn = 'cursor-pointer rounded-md p-1.5 transition active:scale-90'

/* ---------- View Details popup ---------- */

// One detail row (label on the left, value on the right)
function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-[#272D39] py-2 text-[11px] first:border-t-0">
      <span className="text-slate-400">{label}</span>
      <span className="text-right font-medium text-slate-200">{value}</span>
    </div>
  )
}

function ViewAgendaModal({ record, onClose }: { record: AgendaItem; onClose: () => void }) {
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
        className="max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-xl border border-[#272D39] bg-[#10131A] p-4 text-white shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-sm font-bold">Agenda Details</h2>
            <p className="truncate text-[11px] text-slate-400">{record.title}</p>
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
          <Badge tone={tone[record.status]}>{record.status}</Badge>
        </div>

        {/* Details */}
        <div className="mt-2 rounded-lg border border-[#272D39] bg-white/3 px-3">
          <DetailRow label="Agenda No." value={`#${record.id}`} />
          <DetailRow label="Title" value={record.title} />
          <DetailRow label="Meeting" value={record.meeting} />
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

/* ---------- Edit Agenda popup ---------- */

function EditAgendaModal({
  record, onClose, onSubmit,
}: {
  record: AgendaItem
  onClose: () => void
  onSubmit: (updated: AgendaItem) => void
}) {
  const [title, setTitle] = useState(record.title)
  const [meeting, setMeeting] = useState(record.meeting)
  const [status, setStatus] = useState<Status>(record.status)
  const [error, setError] = useState('')

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (title.trim().length < 3) {
      setError('Title must be at least 3 characters.')
      return
    }
    if (!meeting.trim()) {
      setError('Please enter the meeting date.')
      return
    }
    onSubmit({ ...record, title: title.trim(), meeting: meeting.trim(), status })
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
      className="fixed inset-0 z-70 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
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
            <h2 className="text-base font-bold">Edit Agenda</h2>
            <p className="text-[11px] text-slate-400">Update the details of this agenda item</p>
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
            Agenda Title
            <input
              value={title}
              onChange={(e) => { setTitle(e.target.value); setError('') }}
              className={`${field} pr-3`}
              autoFocus
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-[11px] text-slate-400">
              Meeting Date
              <input
                value={meeting}
                onChange={(e) => { setMeeting(e.target.value); setError('') }}
                placeholder="e.g. 25 Oct 2026"
                className={`${field} pr-3`}
              />
            </label>

            <label className="flex flex-col gap-1 text-[11px] text-slate-400">
              Status
              <div className="relative">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as Status)}
                  className={`${field} cursor-pointer`}
                >
                  {statusList.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
              </div>
            </label>
          </div>

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

/* ---------- Delete confirm popup ---------- */

function DeleteAgendaConfirm({
  record, onClose, onConfirm,
}: {
  record: AgendaItem
  onClose: () => void
  onConfirm: () => void
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
        className="w-full max-w-sm rounded-xl border border-[#272D39] bg-[#10131A] p-5 text-white shadow-2xl"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-500/15 text-red-400">
            <Trash2 className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-base font-bold">Delete Agenda</h2>
            <p className="text-[11px] text-slate-400">This action cannot be undone.</p>
          </div>
        </div>

        <p className="mt-4 text-xs text-slate-300">
          Are you sure you want to delete{' '}
          <span className="font-semibold text-white">{record.title}</span>?
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
export default function AgendaPage() {
  const [agenda, setAgenda] = useState<AgendaItem[]>(initialAgenda)
  const [open, setOpen] = useState(false) // modal open / close
  const [meeting, setMeeting] = useState('All')
  const [status, setStatus] = useState<'All' | Status>('All')

  // Agenda item open in the View / Edit / Delete popup (null = closed)
  const [viewing, setViewing] = useState<AgendaItem | null>(null)
  const [editing, setEditing] = useState<AgendaItem | null>(null)
  const [deleting, setDeleting] = useState<AgendaItem | null>(null)
  // Small success message after an action
  const [toast, setToast] = useState('')

  // Hide the success message after 3 seconds
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 3000)
    return () => clearTimeout(t)
  }, [toast])

  // Meeting filter options (updates when new agenda is added)
  const meetingOptions = useMemo(
    () => Array.from(new Set(agenda.map((a) => a.meeting))),
    [agenda],
  )

  // If the selected meeting no longer exists (after edit / delete), fall back to "All"
  const activeMeeting = meeting === 'All' || meetingOptions.includes(meeting) ? meeting : 'All'

  // Tab counts (based on the meeting filter)
  const base = useMemo(
    () => agenda.filter((a) => activeMeeting === 'All' || a.meeting === activeMeeting),
    [agenda, activeMeeting],
  )
  const count = (s: 'All' | Status) => (s === 'All' ? base.length : base.filter((a) => a.status === s).length)

  const list = useMemo(
    () => base.filter((a) => status === 'All' || a.status === status),
    [base, status],
  )

  // Modal Save -> add new row at the top of the table
  const handleSave = (data: AgendaPayload) => {
    setAgenda((prev) => [
      {
        id: data.id,
        title: data.title,
        meeting: formatDate(data.date),
        status: data.status as Status,
      },
      ...prev,
    ])
    // TODO: add the API call here (send the file with FormData)
  }

  // Edit: save the changed details (replace with an API call later)
  const handleEdit = (updated: AgendaItem) => {
    setAgenda((prev) => prev.map((a) => (a.id === updated.id ? updated : a)))
    setToast(`"${updated.title}" updated`)
    setEditing(null)
  }

  // Status icons: changes only the status (replace with an API call later)
  const changeStatus = (a: AgendaItem, next: Status) => {
    setAgenda((prev) => prev.map((x) => (x.id === a.id ? { ...x, status: next } : x)))
    setToast(`"${a.title}" is now ${next}`)
  }

  // Delete: removes the agenda item (replace with an API call later)
  const handleDelete = () => {
    if (!deleting) return
    setAgenda((prev) => prev.filter((a) => a.id !== deleting.id))
    setToast(`"${deleting.title}" deleted`)
    setDeleting(null)
  }

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-4">
      {/* Heading */}
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
        className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
      >
        <motion.div variants={item}>
          <h1 className="text-xl font-bold sm:text-2xl">Agenda</h1>
          <p className="text-xs text-slate-400">Manage meeting agenda items</p>
        </motion.div>

        {/* Add button: opens the modal (Link removed) */}
        <motion.div variants={item}>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-linear-to-r from-[#6C63FF] to-[#4DA3FF] px-4 py-2.5 text-xs font-semibold text-white transition hover:opacity-90 active:scale-95"
          >
            <Plus className="h-3.5 w-3.5" /> Add Agenda
          </button>
        </motion.div>
      </motion.div>

      {/* Filters */}
      <motion.div
        variants={item}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
        className="grid grid-cols-1 gap-2 rounded-xl border border-[#272D39] bg-[#10131A] p-3 min-[480px]:grid-cols-2 lg:grid-cols-[1fr_1fr_auto]"
      >
        {/* Meeting select */}
        <div className="relative">
          <select value={activeMeeting} onChange={(e) => setMeeting(e.target.value)} className={field}>
            <option value="All">All Meetings</option>
            {meetingOptions.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
        </div>

        {/* Status select */}
        <div className="relative">
          <select value={status} onChange={(e) => setStatus(e.target.value as 'All' | Status)} className={field}>
            <option value="All">All Status</option>
            {tabs.slice(1).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
        </div>

        {/* Reset all filters */}
        <button
          type="button"
          onClick={() => { setMeeting('All'); setStatus('All') }}
          className="flex items-center justify-center gap-2 rounded-lg border border-[#272D39] px-4 py-2 text-xs text-slate-300 hover:bg-white/5 min-[480px]:col-span-2 lg:col-span-1"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Reset
        </button>
      </motion.div>

      {/* Status tabs */}
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
        className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {tabs.map((t) => {
          const active = status === t
          return (
            <motion.button
              key={t}
              variants={item}
              type="button"
              onClick={() => setStatus(t)}
              className={`shrink-0 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-[11px] transition-colors ${
                active
                  ? 'border-transparent bg-gradient-to-r from-[#6C63FF] to-[#4DA3FF] font-semibold text-white' // Active tab: Figma gradient
                  : 'border-[#272D39] bg-[#10131A] text-slate-400 hover:bg-white/5'
              }`}
            >
              {t} ({count(t)})
            </motion.button>
          )
        })}
      </motion.div>

      {/* Agenda table */}
      <motion.div
        variants={item}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
      >
        <Card title="Agenda Items" sub={`${list.length} items`}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[580px] text-left text-[11px]">
              <thead className="text-slate-400">
                <tr>
                  <th className={`${th} w-10`}>#</th>
                  <th className={th}>Title</th>
                  <th className={th}>Meeting</th>
                  <th className={th}>Status</th>
                  <th className={`${th} text-right`}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.map((a, i) => (
                  <tr key={a.id} className="hover:bg-white/[0.02]">
                    <td className={`${td} text-slate-400`}>{i + 1}</td>
                    <td className={`${td} font-medium`}>{a.title}</td>
                    <td className={`${td} text-slate-400`}>{a.meeting}</td>
                    <td className={td}><Badge tone={tone[a.status]}>{a.status}</Badge></td>

                    {/* Actions: icons directly in the row (no 3-dot menu) */}
                    <td className={`${td} text-right`}>
                      <div className="flex items-center justify-end gap-0.5">
                        {/* View */}
                        <button
                          type="button"
                          title="View Details"
                          aria-label="View Details"
                          onClick={() => setViewing(a)}
                          className={`${iconBtn} text-slate-400 hover:bg-white/5 hover:text-white`}
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        {/* Edit */}
                        <button
                          type="button"
                          title="Edit"
                          aria-label="Edit"
                          onClick={() => setEditing(a)}
                          className={`${iconBtn} text-slate-400 hover:bg-white/5 hover:text-[#A29CFF]`}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>

                        {/* Status change: icons for the statuses this item does not have yet */}
                        {statusList
                          .filter((s) => s !== a.status)
                          .map((s) => {
                            const { icon: StatusIcon, cls } = statusIcon[s]
                            return (
                              <button
                                key={s}
                                type="button"
                                title={`Mark as ${s}`}
                                aria-label={`Mark as ${s}`}
                                onClick={() => changeStatus(a, s)}
                                className={`${iconBtn} text-slate-400 ${cls}`}
                              >
                                <StatusIcon className="h-4 w-4" />
                              </button>
                            )
                          })}

                        {/* Delete */}
                        <button
                          type="button"
                          title="Delete"
                          aria-label="Delete"
                          onClick={() => setDeleting(a)}
                          className={`${iconBtn} text-red-400 hover:bg-red-500/10`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}

                {/* Empty state */}
                {list.length === 0 && (
                  <tr>
                    <td colSpan={5} className={`${td} py-8 text-center text-slate-500`}>
                      No agenda items found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-4 flex flex-col items-center justify-between gap-3 text-[11px] text-slate-400 sm:flex-row">
            <span>Showing {list.length ? `1-${list.length}` : 0} of {list.length}</span>
            <div className="flex items-center gap-1">
              <button type="button" aria-label="Previous page" className="flex h-7 w-7 items-center justify-center rounded-md border border-[#272D39] hover:bg-white/5">
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              {/* Active page: Figma gradient */}
              <button type="button" className="h-7 w-7 rounded-md border border-transparent bg-gradient-to-br from-[#6C63FF] to-[#4DA3FF] text-[11px] font-semibold text-white">
                1
              </button>
              <button type="button" aria-label="Next page" className="flex h-7 w-7 items-center justify-center rounded-md border border-[#272D39] hover:bg-white/5">
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Add Agenda Modal: kept outside the motion.div (so the fixed position works correctly) */}
      <AddAgendaModal
        open={open}
        onClose={() => setOpen(false)}
        onSave={handleSave}
        meetings={meetingOptions}
      />

      {/* View Details popup */}
      <AnimatePresence>
        {viewing && (
          <ViewAgendaModal
            key={viewing.id}
            record={viewing}
            onClose={() => setViewing(null)}
          />
        )}
      </AnimatePresence>

      {/* Edit popup */}
      <AnimatePresence>
        {editing && (
          <EditAgendaModal
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
          <DeleteAgendaConfirm
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