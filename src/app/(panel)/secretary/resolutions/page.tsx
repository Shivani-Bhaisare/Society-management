'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion, type Variants } from 'framer-motion'
import {
  Plus, ChevronDown, ChevronLeft, ChevronRight,
  Eye, Pencil, Trash2, CheckCircle2, X,
} from 'lucide-react'
import { Card, Badge } from '@/Components/ui'
import AddResolutionModal, { type ResolutionPayload } from '@/Components/AddResolutionModal'

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
type VStatus = 'In Progress' | 'Pending' | 'Approved' | 'Rejected'
type Tab = 'All' | 'Pending' | 'Approved' | 'Rejected'

type Resolution = { id: number; title: string; meeting: string; status: VStatus; pct: number }

// Initial resolutions list
const initialResolutions: Resolution[] = [
  { id: 1, title: 'Maintenance fund increase', meeting: '12 Oct 2026', status: 'In Progress', pct: 45 },
  { id: 2, title: 'Parking area renovation', meeting: '25 Oct 2026', status: 'In Progress', pct: 62 },
  { id: 3, title: 'New security vendor', meeting: '25 Oct 2026', status: 'Pending', pct: 0 },
  { id: 4, title: 'Clubhouse usage policy', meeting: '30 Oct 2026', status: 'Approved', pct: 100 },
  { id: 5, title: 'Pet policy update', meeting: '30 Oct 2026', status: 'Approved', pct: 100 },
  { id: 6, title: 'Electricity bill sharing', meeting: '15 Nov 2026', status: 'Rejected', pct: 12 },
]

// Badge tone for each voting status
const tone: Record<VStatus, 'orange' | 'gray' | 'green' | 'red'> = {
  'In Progress': 'orange',
  Pending: 'gray',
  Approved: 'green',
  Rejected: 'red',
}

// Percentage text colour for each voting status
const pctColor: Record<VStatus, string> = {
  'In Progress': 'text-orange-400',
  Pending: 'text-slate-400',
  Approved: 'text-emerald-400',
  Rejected: 'text-red-400',
}

const tabs: Tab[] = ['All', 'Pending', 'Approved', 'Rejected']

// All real statuses (used in the Edit popup)
const statusList: VStatus[] = ['In Progress', 'Pending', 'Approved', 'Rejected']

// The "Pending" tab includes both In Progress and Pending items
const matches = (s: VStatus, t: Tab) =>
  t === 'All' ||
  (t === 'Pending' ? s === 'Pending' || s === 'In Progress' : s === t)

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

function ViewResolutionModal({ record, onClose }: { record: Resolution; onClose: () => void }) {
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
            <h2 className="text-sm font-bold">Resolution Details</h2>
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

        {/* Voting status */}
        <div className="mt-3 flex items-center justify-between rounded-lg border border-[#272D39] bg-white/3 px-3 py-2">
          <span className="text-[11px] text-slate-400">Voting Status</span>
          <Badge tone={tone[record.status]}>{record.status}</Badge>
        </div>

        {/* Details */}
        <div className="mt-2 rounded-lg border border-[#272D39] bg-white/3 px-3">
          <DetailRow label="Resolution No." value={`#${record.id}`} />
          <DetailRow label="Title" value={record.title} />
          <DetailRow label="Meeting" value={record.meeting} />
          <DetailRow label="Voting Progress" value={`${record.pct}%`} />
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

/* ---------- Edit Resolution popup ---------- */

function EditResolutionModal({
  record, onClose, onSubmit,
}: {
  record: Resolution
  onClose: () => void
  onSubmit: (updated: Resolution) => void
}) {
  const [title, setTitle] = useState(record.title)
  const [meeting, setMeeting] = useState(record.meeting)
  const [status, setStatus] = useState<VStatus>(record.status)
  const [pct, setPct] = useState(String(record.pct))
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
    const pctNum = Number(pct)
    if (title.trim().length < 3) {
      setError('Title must be at least 3 characters.')
      return
    }
    if (!meeting.trim()) {
      setError('Please enter the meeting date.')
      return
    }
    if (pct.trim() === '' || Number.isNaN(pctNum) || pctNum < 0 || pctNum > 100) {
      setError('Voting % must be a number between 0 and 100.')
      return
    }
    onSubmit({ ...record, title: title.trim(), meeting: meeting.trim(), status, pct: Math.round(pctNum) })
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
            <h2 className="text-base font-bold">Edit Resolution</h2>
            <p className="text-[11px] text-slate-400">Update the details of this resolution</p>
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
            Resolution Title
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
              Voting Status
              <div className="relative">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as VStatus)}
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

          <label className="flex flex-col gap-1 text-[11px] text-slate-400">
            Voting % (0 - 100)
            <input
              type="number"
              min={0}
              max={100}
              value={pct}
              onChange={(e) => { setPct(e.target.value); setError('') }}
              className={`${field} pr-3`}
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

/* ---------- Delete confirm popup ---------- */

function DeleteResolutionConfirm({
  record, onClose, onConfirm,
}: {
  record: Resolution
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
            <h2 className="text-base font-bold">Delete Resolution</h2>
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
export default function ResolutionsPage() {
  const [resolutions, setResolutions] = useState<Resolution[]>(initialResolutions)
  const [open, setOpen] = useState(false) // modal open / close
  const [tab, setTab] = useState<Tab>('All')

  // Resolution open in the View / Edit / Delete popup (null = closed)
  const [viewing, setViewing] = useState<Resolution | null>(null)
  const [editing, setEditing] = useState<Resolution | null>(null)
  const [deleting, setDeleting] = useState<Resolution | null>(null)
  // Small success message after an action
  const [toast, setToast] = useState('')

  // Hide the success message after 3 seconds
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 3000)
    return () => clearTimeout(t)
  }, [toast])

  const count = (t: Tab) => resolutions.filter((r) => matches(r.status, t)).length
  const list = resolutions.filter((r) => matches(r.status, tab))

  // Modal Save -> new row on top, starts with Pending status and 0%
  const handleSave = (p: ResolutionPayload) => {
    setResolutions((prev) => [
      { id: p.id, title: p.title, meeting: formatDate(p.date), status: 'Pending', pct: 0 },
      ...prev,
    ])
    // TODO: add the API call here (send the files with FormData)
  }

  // Edit: save the changed details (replace with an API call later)
  const handleEdit = (updated: Resolution) => {
    setResolutions((prev) => prev.map((r) => (r.id === updated.id ? updated : r)))
    setToast(`"${updated.title}" updated`)
    setEditing(null)
  }

  // Delete: removes the resolution (replace with an API call later)
  const handleDelete = () => {
    if (!deleting) return
    setResolutions((prev) => prev.filter((r) => r.id !== deleting.id))
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
          <h1 className="text-xl font-bold sm:text-2xl">Resolutions</h1>
          <p className="text-xs text-slate-400">Track and manage society resolutions</p>
        </motion.div>

        {/* Add button: Link removed and replaced with a button, now opens the modal */}
        <motion.div variants={item}>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-linear-to-r from-[#6C63FF] to-[#4DA3FF] px-4 py-2.5 text-xs font-semibold text-white transition hover:opacity-90 active:scale-95"
          >
            <Plus className="h-3.5 w-3.5" /> Add Resolution
          </button>
        </motion.div>
      </motion.div>

      {/* Tabs */}
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
        className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {tabs.map((t) => {
          const active = tab === t
          return (
            <motion.button
              key={t}
              variants={item}
              type="button"
              onClick={() => setTab(t)}
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

      {/* Table */}
      <motion.div
        variants={item}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
      >
        <Card title="Resolution List" sub={`${list.length} resolutions`}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-left text-[11px]">
              <thead className="text-slate-400">
                <tr>
                  <th className={`${th} w-10`}>#</th>
                  <th className={th}>Title</th>
                  <th className={th}>Meeting</th>
                  <th className={th}>Voting Status</th>
                  <th className={`${th} text-right`}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.map((r, i) => (
                  <tr key={r.id} className="hover:bg-white/[0.02]">
                    <td className={`${td} text-slate-400`}>{i + 1}</td>
                    <td className={`${td} font-medium`}>{r.title}</td>
                    <td className={`${td} text-slate-400`}>{r.meeting}</td>
                    <td className={td}>
                      <div className="flex flex-col items-start gap-1">
                        <Badge tone={tone[r.status]}>{r.status}</Badge>
                        <span className={`text-[10px] ${pctColor[r.status]}`}>{r.pct}%</span>
                      </div>
                    </td>

                    {/* Actions: icons directly in the row (no 3-dot menu) */}
                    <td className={`${td} text-right`}>
                      <div className="flex items-center justify-end gap-0.5">
                        {/* View */}
                        <button
                          type="button"
                          title="View Details"
                          aria-label="View Details"
                          onClick={() => setViewing(r)}
                          className={`${iconBtn} text-slate-400 hover:bg-white/5 hover:text-white`}
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        {/* Edit */}
                        <button
                          type="button"
                          title="Edit"
                          aria-label="Edit"
                          onClick={() => setEditing(r)}
                          className={`${iconBtn} text-slate-400 hover:bg-white/5 hover:text-[#A29CFF]`}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>

                        {/* Delete */}
                        <button
                          type="button"
                          title="Delete"
                          aria-label="Delete"
                          onClick={() => setDeleting(r)}
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
                      No resolutions found
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

      {/* Add Resolution Modal (uses a portal, so it is safe to keep here) */}
      <AddResolutionModal
        open={open}
        onClose={() => setOpen(false)}
        onSave={handleSave}
      />

      {/* View Details popup */}
      <AnimatePresence>
        {viewing && (
          <ViewResolutionModal
            key={viewing.id}
            record={viewing}
            onClose={() => setViewing(null)}
          />
        )}
      </AnimatePresence>

      {/* Edit popup */}
      <AnimatePresence>
        {editing && (
          <EditResolutionModal
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
          <DeleteResolutionConfirm
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