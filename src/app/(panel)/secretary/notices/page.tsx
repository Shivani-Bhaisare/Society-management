'use client'

import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion, type Variants } from 'framer-motion'
import {
  Plus, ChevronDown, ChevronLeft, ChevronRight, RotateCcw,
  Eye, Pencil, Trash2, Send, FileText, CheckCircle2, X,
} from 'lucide-react'
import { Card, Badge } from '@/Components/ui'
import AddNoticeModal from '@/Components/AddNoticeModal'

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
type Priority = 'High' | 'Medium' | 'Low'
type NStatus = 'Published' | 'Draft'

type Notice = {
  id: number
  title: string
  type: string
  priority: Priority
  status: NStatus
  date: string
}

// Notices list (initial data)
const initialNotices: Notice[] = [
  { id: 1, title: 'Water supply maintenance', type: 'Maintenance', priority: 'High', status: 'Published', date: '10 Oct 2026' },
  { id: 2, title: 'Society AGM notice', type: 'Meeting', priority: 'Medium', status: 'Published', date: '07 Oct 2026' },
  { id: 3, title: 'Parking rules update', type: 'General', priority: 'Medium', status: 'Published', date: '05 Oct 2026' },
  { id: 4, title: 'Festival celebration', type: 'Event', priority: 'Low', status: 'Published', date: '02 Oct 2026' },
  { id: 5, title: 'Security alert', type: 'Security', priority: 'High', status: 'Published', date: '28 Sep 2026' },
  { id: 6, title: 'Maintenance fee reminder', type: 'Payment', priority: 'Medium', status: 'Published', date: '25 Sep 2026' },
  { id: 7, title: 'Clubhouse booking system', type: 'Facility', priority: 'Low', status: 'Published', date: '22 Sep 2026' },
  { id: 8, title: 'Fire safety drill', type: 'Safety', priority: 'Medium', status: 'Published', date: '18 Sep 2026' },
]

// Badge tone for each priority
const priorityTone: Record<Priority, 'red' | 'orange' | 'green'> = {
  High: 'red',
  Medium: 'orange',
  Low: 'green',
}

const statuses: NStatus[] = ['Published', 'Draft']

// All priorities (used in the Edit popup)
const priorities: Priority[] = ['High', 'Medium', 'Low']

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

function ViewNoticeModal({ record, onClose }: { record: Notice; onClose: () => void }) {
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
            <h2 className="text-sm font-bold">Notice Details</h2>
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
          <Badge tone={record.status === 'Published' ? 'green' : 'gray'}>{record.status}</Badge>
        </div>

        {/* Priority */}
        <div className="mt-2 flex items-center justify-between rounded-lg border border-[#272D39] bg-white/3 px-3 py-2">
          <span className="text-[11px] text-slate-400">Priority</span>
          <Badge tone={priorityTone[record.priority]}>{record.priority}</Badge>
        </div>

        {/* Details */}
        <div className="mt-2 rounded-lg border border-[#272D39] bg-white/3 px-3">
          <DetailRow label="Notice No." value={`#${record.id}`} />
          <DetailRow label="Title" value={record.title} />
          <DetailRow label="Type" value={record.type} />
          <DetailRow label="Date" value={record.date} />
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

/* ---------- Edit Notice popup ---------- */

function EditNoticeModal({
  record, onClose, onSubmit,
}: {
  record: Notice
  onClose: () => void
  onSubmit: (updated: Notice) => void
}) {
  const [title, setTitle] = useState(record.title)
  const [noticeType, setNoticeType] = useState(record.type)
  const [priority, setPriority] = useState<Priority>(record.priority)
  const [noticeStatus, setNoticeStatus] = useState<NStatus>(record.status)
  const [date, setDate] = useState(record.date)
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
    if (!noticeType.trim()) {
      setError('Please enter the notice type.')
      return
    }
    if (!date.trim()) {
      setError('Please enter the date.')
      return
    }
    onSubmit({
      ...record,
      title: title.trim(),
      type: noticeType.trim(),
      priority,
      status: noticeStatus,
      date: date.trim(),
    })
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
            <h2 className="text-base font-bold">Edit Notice</h2>
            <p className="text-[11px] text-slate-400">Update the details of this notice</p>
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
            Notice Title
            <input
              value={title}
              onChange={(e) => { setTitle(e.target.value); setError('') }}
              className={`${field} pr-3`}
              autoFocus
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-[11px] text-slate-400">
              Type
              <input
                value={noticeType}
                onChange={(e) => { setNoticeType(e.target.value); setError('') }}
                placeholder="e.g. Maintenance"
                className={`${field} pr-3`}
              />
            </label>

            <label className="flex flex-col gap-1 text-[11px] text-slate-400">
              Date
              <input
                value={date}
                onChange={(e) => { setDate(e.target.value); setError('') }}
                placeholder="e.g. 25 Oct 2026"
                className={`${field} pr-3`}
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-[11px] text-slate-400">
              Priority
              <div className="relative">
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as Priority)}
                  className={`${field} cursor-pointer`}
                >
                  {priorities.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
              </div>
            </label>

            <label className="flex flex-col gap-1 text-[11px] text-slate-400">
              Status
              <div className="relative">
                <select
                  value={noticeStatus}
                  onChange={(e) => setNoticeStatus(e.target.value as NStatus)}
                  className={`${field} cursor-pointer`}
                >
                  {statuses.map((s) => (
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

function DeleteNoticeConfirm({
  record, onClose, onConfirm,
}: {
  record: Notice
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
            <h2 className="text-base font-bold">Delete Notice</h2>
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
export default function NoticesPage() {
  // Notices data + modal state
  const [items, setItems] = useState<Notice[]>(initialNotices)
  const [showNoticeModal, setShowNoticeModal] = useState(false)

  // Filter state
  const [type, setType] = useState('All')
  const [status, setStatus] = useState('All')

  // Notice open in the View / Edit / Delete popup (null = closed)
  const [viewing, setViewing] = useState<Notice | null>(null)
  const [editing, setEditing] = useState<Notice | null>(null)
  const [deleting, setDeleting] = useState<Notice | null>(null)
  // Small success message after an action
  const [toast, setToast] = useState('')

  // Hide the success message after 3 seconds
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 3000)
    return () => clearTimeout(t)
  }, [toast])

  // Type dropdown options (auto-updates when a new notice type is added)
  const types = useMemo(() => Array.from(new Set(items.map((n) => n.type))), [items])

  // If the selected type no longer exists (after edit / delete), fall back to "All"
  const activeType = type === 'All' || types.includes(type) ? type : 'All'

  // Apply type + status filters
  const list = useMemo(
    () =>
      items.filter(
        (n) => (activeType === 'All' || n.type === activeType) && (status === 'All' || n.status === status),
      ),
    [items, activeType, status],
  )

  // Edit: save the changed details (replace with an API call later)
  const handleEdit = (updated: Notice) => {
    setItems((prev) => prev.map((n) => (n.id === updated.id ? updated : n)))
    setToast(`"${updated.title}" updated`)
    setEditing(null)
  }

  // Publish / Draft icon: changes only the status (replace with an API call later)
  const changeStatus = (n: Notice, next: NStatus) => {
    setItems((prev) => prev.map((x) => (x.id === n.id ? { ...x, status: next } : x)))
    setToast(next === 'Published' ? `"${n.title}" published` : `"${n.title}" moved to draft`)
  }

  // Delete: removes the notice (replace with an API call later)
  const handleDelete = () => {
    if (!deleting) return
    setItems((prev) => prev.filter((n) => n.id !== deleting.id))
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
          <h1 className="text-xl font-bold sm:text-2xl">Notices</h1>
          <p className="text-xs text-slate-400">Manage and share important updates</p>
        </motion.div>

        {/* Create button: opens the Create Notice modal */}
        <motion.div variants={item}>
          <button
            type="button"
            onClick={() => setShowNoticeModal(true)}
            className="flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-linear-to-r from-[#6C63FF] to-[#4DA3FF] px-4 py-2.5 text-xs font-semibold text-white transition hover:opacity-90 active:scale-95"
          >
            <Plus className="h-3.5 w-3.5" /> Create Notice
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
        {/* Type select */}
        <div className="relative">
          <select value={activeType} onChange={(e) => setType(e.target.value)} className={field}>
            <option value="All">All Types</option>
            {types.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
        </div>

        {/* Status select */}
        <div className="relative">
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={field}>
            <option value="All">All Status</option>
            {statuses.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
        </div>

        {/* Reset all filters */}
        <button
          type="button"
          onClick={() => { setType('All'); setStatus('All') }}
          className="flex items-center justify-center gap-2 rounded-lg border border-[#272D39] px-4 py-2 text-xs text-slate-300 hover:bg-white/5 min-[480px]:col-span-2 lg:col-span-1"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Reset
        </button>
      </motion.div>

      {/* Notices table */}
      <motion.div
        variants={item}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
      >
        <Card title="All Notices" sub={`${list.length} notices`}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-[11px]">
              <thead className="text-slate-400">
                <tr>
                  <th className={th}>Title</th>
                  <th className={th}>Type</th>
                  <th className={th}>Priority</th>
                  <th className={th}>Status</th>
                  <th className={th}>Date</th>
                  <th className={`${th} text-right`}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.map((n) => (
                  <tr key={n.id} className="hover:bg-white/[0.02]">
                    <td className={`${td} font-medium`}>{n.title}</td>
                    <td className={`${td} text-slate-400`}>{n.type}</td>
                    <td className={td}><Badge tone={priorityTone[n.priority]}>{n.priority}</Badge></td>
                    <td className={td}><Badge tone={n.status === 'Published' ? 'green' : 'gray'}>{n.status}</Badge></td>
                    <td className={`${td} text-slate-400`}>{n.date}</td>

                    {/* Actions: icons directly in the row (no 3-dot menu) */}
                    <td className={`${td} text-right`}>
                      <div className="flex items-center justify-end gap-0.5">
                        {/* View */}
                        <button
                          type="button"
                          title="View Details"
                          aria-label="View Details"
                          onClick={() => setViewing(n)}
                          className={`${iconBtn} text-slate-400 hover:bg-white/5 hover:text-white`}
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        {/* Edit */}
                        <button
                          type="button"
                          title="Edit"
                          aria-label="Edit"
                          onClick={() => setEditing(n)}
                          className={`${iconBtn} text-slate-400 hover:bg-white/5 hover:text-[#A29CFF]`}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>

                        {/* Publish / Draft: shows the opposite of the current status */}
                        {n.status === 'Published' ? (
                          <button
                            type="button"
                            title="Move to Draft"
                            aria-label="Move to Draft"
                            onClick={() => changeStatus(n, 'Draft')}
                            className={`${iconBtn} text-slate-400 hover:bg-amber-500/10 hover:text-amber-400`}
                          >
                            <FileText className="h-4 w-4" />
                          </button>
                        ) : (
                          <button
                            type="button"
                            title="Publish"
                            aria-label="Publish"
                            onClick={() => changeStatus(n, 'Published')}
                            className={`${iconBtn} text-slate-400 hover:bg-emerald-500/10 hover:text-emerald-400`}
                          >
                            <Send className="h-4 w-4" />
                          </button>
                        )}

                        {/* Delete */}
                        <button
                          type="button"
                          title="Delete"
                          aria-label="Delete"
                          onClick={() => setDeleting(n)}
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
                    <td colSpan={6} className={`${td} py-8 text-center text-slate-500`}>
                      No notices found
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

      {/* Create Notice modal */}
      <AddNoticeModal
        open={showNoticeModal}
        onClose={() => setShowNoticeModal(false)}
        onSave={(n) =>
          setItems((prev) => [
            {
              id: n.id,
              title: n.title,
              type: n.type,
              priority: n.priority,
              status: n.status as NStatus,
              date: new Date(n.publishDate).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              }),
            },
            ...prev,
          ])
        }
      />

      {/* View Details popup */}
      <AnimatePresence>
        {viewing && (
          <ViewNoticeModal
            key={viewing.id}
            record={viewing}
            onClose={() => setViewing(null)}
          />
        )}
      </AnimatePresence>

      {/* Edit popup */}
      <AnimatePresence>
        {editing && (
          <EditNoticeModal
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
          <DeleteNoticeConfirm
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