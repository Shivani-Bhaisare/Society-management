'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion, type Variants } from 'framer-motion'
import {
  Plus, ChevronLeft, ChevronRight, ChevronDown, MapPin, Clock, CalendarDays, ListChecks, Pencil,
  CheckCircle2, X,
} from 'lucide-react'
import { Card, Badge } from '@/Components/ui'
import ScheduleMeetingModal, { type MeetingForm } from '@/Components/ScheduleMeetingModal'

/* ---------- Animation ---------- */

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]
const VIEWPORT = { once: false, amount: 0.15 }

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
}

const item: Variants = {
  hidden: { opacity: 0, y: 30, scale: 0.97 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.7, ease: EASE },
  },
}

const cellClass = 'h-full [&>*]:h-full'

/* ---------- Data (replace with API data later) ---------- */
type Status = 'Confirmed' | 'Scheduled' | 'Pending'

type Meeting = {
  id: number
  title: string
  year: number
  month: number // 0 = Jan ... 9 = Oct
  day: number
  label: string // "12 Oct 2026"
  start: string
  range: string
  place: string
  agenda: number
  status: Status
}

const initialMeetings: Meeting[] = [
  { id: 1, title: 'Committee Meeting', year: 2026, month: 9, day: 12, label: '12 Oct 2026', start: '06:00 PM', range: '06:00 PM - 07:30 PM', place: 'Clubhouse', agenda: 5, status: 'Confirmed' },
  { id: 2, title: 'AGM Meeting', year: 2026, month: 9, day: 25, label: '25 Oct 2026', start: '05:00 PM', range: '05:00 PM - 07:00 PM', place: 'Clubhouse', agenda: 8, status: 'Scheduled' },
  { id: 3, title: 'Emergency Meeting', year: 2026, month: 9, day: 30, label: '30 Oct 2026', start: '11:00 AM', range: '11:00 AM - 12:00 PM', place: 'Conference Room', agenda: 2, status: 'Pending' },
]

const statusOptions: Status[] = ['Confirmed', 'Scheduled', 'Pending']

const tone: Record<Status, 'green' | 'blue' | 'orange'> = {
  Confirmed: 'green',
  Scheduled: 'blue',
  Pending: 'orange',
}

const dotColor: Record<Status, string> = {
  Confirmed: '#10B981',
  Scheduled: '#3B82F6',
  Pending: '#F59E0B',
}

const weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const monthName = (y: number, m: number) =>
  new Date(y, m, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' })

/* ---------- Helpers ---------- */

const pad = (n: number) => String(n).padStart(2, '0')

// "2026-10-12" from the meeting fields (used by the date input)
const toISO = (m: Meeting) => `${m.year}-${pad(m.month + 1)}-${pad(m.day)}`

// "06:00 PM" -> "18:00" (used by the time input). Returns '' if the text is not a time
function to24(t: string) {
  const match = t.trim().match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i)
  if (!match) return ''
  let h = Number(match[1]) % 12
  if (match[3].toUpperCase() === 'PM') h += 12
  return `${pad(h)}:${match[2]}`
}

// "18:00" -> "06:00 PM"
function to12(t: string) {
  const [h, m] = t.split(':').map(Number)
  const ap = h >= 12 ? 'PM' : 'AM'
  return `${pad(h % 12 === 0 ? 12 : h % 12)}:${pad(m)} ${ap}`
}

// "06:00 PM - 07:30 PM" -> "07:30 PM"
const endOf = (range: string) => (range.includes(' - ') ? range.split(' - ')[1] : '')

// Checks a yyyy-mm-dd date is a real calendar date
function isRealDate(v: string) {
  const [y, m, d] = v.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d
}

/* ---------- Shared styles ---------- */

const field =
  'w-full rounded-lg border border-[#272D39] bg-[#10131A] px-3 py-2 text-xs text-slate-200 outline-none placeholder:text-slate-500 focus:border-[#A29CFF]/60'

// Small icon button used in the All Meetings list
const iconBtn = 'cursor-pointer rounded-md p-1.5 transition active:scale-90'

/* ---------- Detail row (used in View popup) ---------- */

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-[#272D39] py-2 text-[11px] first:border-t-0">
      <span className="shrink-0 text-slate-400">{label}</span>
      <span className="min-w-0 break-words text-right font-medium text-slate-200">{value}</span>
    </div>
  )
}

/* ---------- View Details popup ---------- */

type ViewMeetingModalProps = {
  record: Meeting
  onClose: () => void
  onEdit: () => void
}

function ViewMeetingModal({ record, onClose, onEdit }: ViewMeetingModalProps) {
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
            <h2 className="text-sm font-bold">Meeting Details</h2>
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
          <DetailRow label="Title" value={record.title} />
          <DetailRow label="Date" value={record.label} />
          <DetailRow label="Time" value={record.range} />
          <DetailRow label="Location" value={record.place} />
          <DetailRow label="Agenda" value={`${record.agenda} items`} />
        </div>

        {/* Actions */}
        <div className="mt-4 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg border border-[#272D39] px-4 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/5 active:scale-95"
          >
            Close
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="flex cursor-pointer items-center gap-1.5 rounded-lg bg-linear-to-r from-[#6C63FF] to-[#4DA3FF] px-4 py-2 text-xs font-semibold text-white transition hover:opacity-90 active:scale-95"
          >
            <Pencil className="h-3.5 w-3.5" /> Edit
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ---------- Edit Meeting popup ---------- */

type EditMeetingModalProps = {
  record: Meeting
  onClose: () => void
  onSubmit: (updated: Meeting) => void
}

function EditMeetingModal({ record, onClose, onSubmit }: EditMeetingModalProps) {
  const [title, setTitle] = useState(record.title)
  const [date, setDate] = useState(toISO(record))
  const [start, setStart] = useState(to24(record.start))
  const [end, setEnd] = useState(to24(endOf(record.range)))
  const [place, setPlace] = useState(record.place === 'TBD' ? '' : record.place)
  const [agenda, setAgenda] = useState(String(record.agenda))
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
    const t = title.trim()
    const p = place.trim()

    if (!t) return setError('Please enter the meeting title.')
    if (t.length < 3) return setError('Title must be at least 3 characters.')
    if (t.length > 80) return setError('Title cannot be more than 80 characters.')

    if (!date) return setError('Please select the meeting date.')
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !isRealDate(date)) return setError('Enter a valid date.')
    const year = Number(date.slice(0, 4))
    if (year < 2000 || year > 2100) return setError('Year must be between 2000 and 2100.')

    if (!start) return setError('Please select the start time.')
    if (!end) return setError('Please select the end time.')
    if (end <= start) return setError('End time must be after the start time.')

    if (!p) return setError('Please enter the location.')
    if (p.length > 60) return setError('Location cannot be more than 60 characters.')

    const count = Number(agenda)
    if (agenda.trim() === '' || !Number.isInteger(count) || count < 0 || count > 50) {
      return setError('Agenda items must be a whole number from 0 to 50.')
    }

    const [y, mo, d] = date.split('-').map(Number)
    const dt = new Date(y, mo - 1, d)

    onSubmit({
      ...record,
      title: t,
      year: y,
      month: mo - 1,
      day: d,
      label: dt.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      start: to12(start),
      range: `${to12(start)} - ${to12(end)}`,
      place: p,
      agenda: count,
      status,
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
        noValidate
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
            <h2 className="text-base font-bold">Edit Meeting</h2>
            <p className="text-[11px] text-slate-400">Update the details of {record.title}</p>
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
            Meeting Title
            <input
              value={title}
              onChange={(e) => { setTitle(e.target.value); setError('') }}
              className={field}
              autoFocus
            />
          </label>

          <label className="flex flex-col gap-1 text-[11px] text-slate-400">
            Date
            <input
              type="date"
              value={date}
              onChange={(e) => { setDate(e.target.value); setError('') }}
              className={`${field} scheme-dark`}
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-[11px] text-slate-400">
              Start Time
              <input
                type="time"
                value={start}
                onChange={(e) => { setStart(e.target.value); setError('') }}
                className={`${field} scheme-dark`}
              />
            </label>

            <label className="flex flex-col gap-1 text-[11px] text-slate-400">
              End Time
              <input
                type="time"
                value={end}
                onChange={(e) => { setEnd(e.target.value); setError('') }}
                className={`${field} scheme-dark`}
              />
            </label>
          </div>

          <label className="flex flex-col gap-1 text-[11px] text-slate-400">
            Location
            <input
              value={place}
              onChange={(e) => { setPlace(e.target.value); setError('') }}
              placeholder="e.g. Clubhouse"
              className={field}
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-[11px] text-slate-400">
              Agenda Items
              <input
                type="number"
                min={0}
                max={50}
                value={agenda}
                onChange={(e) => { setAgenda(e.target.value); setError('') }}
                className={field}
              />
            </label>

            <label className="flex flex-col gap-1 text-[11px] text-slate-400">
              Status
              <div className="relative">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as Status)}
                  className={`${field} cursor-pointer appearance-none pr-8`}
                >
                  {statusOptions.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
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

/* ---------- All Meetings popup (View All) ---------- */

type AllMeetingsModalProps = {
  meetings: Meeting[]
  selectedId: number
  onClose: () => void
  onSelect: (m: Meeting) => void
  onEdit: (m: Meeting) => void
}

function AllMeetingsModal({ meetings, selectedId, onClose, onSelect, onEdit }: AllMeetingsModalProps) {
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

  // Earliest meeting first
  const sorted = [...meetings].sort(
    (a, b) => new Date(a.year, a.month, a.day).getTime() - new Date(b.year, b.month, b.day).getTime(),
  )

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
        className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-xl border border-[#272D39] bg-[#10131A] p-4 text-white shadow-2xl"
      >
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-sm font-bold">All Meetings</h2>
            <p className="text-[11px] text-slate-400">Total {meetings.length} meetings. Tap one to select it</p>
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

        {/* List */}
        <div className="mt-3 flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pr-0.5">
          {sorted.map((m) => (
            <div
              key={m.id}
              className={`flex items-center gap-2 rounded-lg border px-3 py-2.5 transition-colors ${
                m.id === selectedId
                  ? 'border-[#6C63FF]/60 bg-[#6C63FF]/10'
                  : 'border-[#272D39] bg-white/3 hover:bg-white/5'
              }`}
            >
              <button
                type="button"
                onClick={() => onSelect(m)}
                className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 text-left"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#8B5CF6]/15 text-[#8B5CF6]">
                  <CalendarDays className="h-4 w-4" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-semibold">{m.title}</span>
                  <span className="block truncate text-[10px] text-slate-400">{m.label} • {m.range}</span>
                  <span className="flex items-center gap-1 truncate text-[10px] text-slate-400">
                    <MapPin className="h-3 w-3 shrink-0" /> {m.place}
                  </span>
                </span>
              </button>

              <Badge tone={tone[m.status]}>{m.status}</Badge>

              <button
                type="button"
                title="Edit"
                aria-label={`Edit ${m.title}`}
                onClick={() => onEdit(m)}
                className={`${iconBtn} shrink-0 text-slate-400 hover:bg-white/5 hover:text-[#A29CFF]`}
              >
                <Pencil className="h-4 w-4" />
              </button>
            </div>
          ))}

          {meetings.length === 0 && (
            <p className="py-8 text-center text-[11px] text-slate-500">No meetings found</p>
          )}
        </div>

        {/* Actions */}
        <div className="mt-4 flex shrink-0 justify-end">
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

/* ---------- Page ---------- */
export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>(initialMeetings)
  const [selectedId, setSelectedId] = useState(1)
  const [view, setView] = useState({ y: 2026, m: 9 })
  const [addOpen, setAddOpen] = useState(false)

  // Popups: All Meetings list, View Details, Edit (null / false = closed)
  const [allOpen, setAllOpen] = useState(false)
  const [viewing, setViewing] = useState<Meeting | null>(null)
  const [editing, setEditing] = useState<Meeting | null>(null)
  // Small success message after an action
  const [toast, setToast] = useState('')

  // Hide the success message after 3 seconds
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 3000)
    return () => clearTimeout(t)
  }, [toast])

  const selected = meetings.find((m) => m.id === selectedId) ?? meetings[0]

  // calendar grid
  const firstDay = new Date(view.y, view.m, 1).getDay()
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate()
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  const meetingOn = (d: number) =>
    meetings.find((m) => m.year === view.y && m.month === view.m && m.day === d)

  const shift = (delta: number) =>
    setView(({ y, m }) => {
      const d = new Date(y, m + delta, 1)
      return { y: d.getFullYear(), m: d.getMonth() }
    })

  const pick = (m: Meeting) => {
    setSelectedId(m.id)
    setView({ y: m.year, m: m.month })
  }

  // When a new meeting comes in from the modal, add it to the list + calendar
  function handleAdd(data: MeetingForm) {
    if (!data.date) return // can't show it on the calendar without a date
    const [y, mo, d] = data.date.split('-').map(Number)
    const dt = new Date(y, mo - 1, d)
    const status: Status =
      data.status === 'Confirmed' || data.status === 'Pending' ? data.status : 'Scheduled'

    const created: Meeting = {
      id: Date.now(),
      title: data.title || data.type || 'New Meeting',
      year: y,
      month: mo - 1,
      day: d,
      label: dt.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      start: data.start || '--',
      range: data.start && data.end ? `${data.start} - ${data.end}` : data.start || '--',
      place: data.venue || 'TBD',
      agenda: data.agenda.trim() ? data.agenda.split('\n').filter(Boolean).length : 0,
      status,
    }
    setMeetings((p) => [...p, created])
    setSelectedId(created.id)
    setView({ y, m: mo - 1 })
  }

  // Edit: save the changed details (replace with an API call later)
  function handleEdit(updated: Meeting) {
    setMeetings((p) => p.map((m) => (m.id === updated.id ? updated : m)))
    setSelectedId(updated.id)
    setView({ y: updated.year, m: updated.month })
    setToast(`${updated.title} updated`)
    setEditing(null)
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
          <h1 className="text-xl font-bold sm:text-2xl">Meetings</h1>
          <p className="text-xs text-slate-400">Schedule and manage society meetings</p>
        </motion.div>

        {/* Schedule button: opens the drawer on click */}
        <motion.div variants={item}>
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-linear-to-r from-[#6C63FF] to-[#4DA3FF] px-4 py-2.5 text-xs font-semibold text-white transition hover:opacity-90 active:scale-95"
          >
            <Plus className="h-3.5 w-3.5" /> Schedule Meeting
          </button>
        </motion.div>
      </motion.div>

      {/* Calendar + Upcoming */}
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
        className="grid grid-cols-1 gap-4 lg:grid-cols-2"
      >
        <motion.div variants={item} className={cellClass}>
          <Card title={monthName(view.y, view.m)} sub="Tap a highlighted date to view meeting"
            action={
              <div className="flex items-center gap-1">
                <button
                  type="button" onClick={() => shift(-1)} aria-label="Previous month"
                  className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-[#272D39] text-slate-300 hover:bg-white/5"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button" onClick={() => shift(1)} aria-label="Next month"
                  className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-[#272D39] text-slate-300 hover:bg-white/5"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            }
          >
            <div className="grid grid-cols-7 gap-1 text-center">
              {weekdays.map((d) => (
                <span key={d} className="py-1.5 text-[10px] font-medium text-slate-500">{d}</span>
              ))}

              {cells.map((d, i) => {
                if (d === null) return <span key={`b${i}`} />
                const m = meetingOn(d)
                const isSel = m?.id === selected.id
                return (
                  <button
                    key={d}
                    type="button"
                    disabled={!m}
                    onClick={() => m && pick(m)}
                    className={`relative flex aspect-square items-center justify-center rounded-lg text-[11px] transition-colors ${
                      isSel
                        ? 'cursor-pointer bg-linear-to-br from-[#6C63FF] to-[#4DA3FF] font-bold text-white'
                        : m
                          ? 'cursor-pointer border border-[#272D39] bg-white/4 font-semibold text-white hover:bg-white/10'
                          : 'cursor-default text-slate-400'
                    }`}
                  >
                    {d}
                    {m && !isSel && (
                      <i className="absolute bottom-1 h-1 w-1 rounded-full" style={{ background: dotColor[m.status] }} />
                    )}
                  </button>
                )
              })}
            </div>
          </Card>
        </motion.div>

        <motion.div variants={item} className={cellClass}>
          <Card
            title="Upcoming Meetings" sub="Next scheduled meetings"
            action={
              <button
                type="button"
                onClick={() => setAllOpen(true)}
                className="cursor-pointer text-[11px] text-[#A29CFF] hover:underline"
              >
                View All
              </button>
            }
          >
            <div className="flex flex-col gap-2">
              {meetings.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => pick(m)}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors ${
                    m.id === selected.id
                      ? 'border-[#6C63FF]/60 bg-[#6C63FF]/10'
                      : 'border-[#272D39] bg-white/3 hover:bg-white/5'
                  }`}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#8B5CF6]/15 text-[#8B5CF6]">
                    <CalendarDays className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-semibold">{m.title}</span>
                    <span className="block truncate text-[10px] text-slate-400">{m.label} • {m.start}</span>
                    <span className="flex items-center gap-1 truncate text-[10px] text-slate-400">
                      <MapPin className="h-3 w-3 shrink-0" /> {m.place}
                    </span>
                  </span>
                  <Badge tone={tone[m.status]}>{m.status}</Badge>
                </button>
              ))}
            </div>
          </Card>
        </motion.div>
      </motion.div>

      {/* Meeting Details */}
      <motion.div
        variants={item}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
      >
        <Card
          title="Meeting Details" sub="Selected meeting"
          action={
            <button
              type="button"
              onClick={() => setAllOpen(true)}
              className="cursor-pointer text-[11px] text-[#A29CFF] hover:underline"
            >
              View All
            </button>
          }
        >
          <div className="flex items-center gap-3 border-b border-[#272D39] pb-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#3B82F6]/15 text-[#3B82F6]">
              <CalendarDays className="h-5 w-5" />
            </span>
            <p className="min-w-0 truncate text-sm font-bold">{selected.title}</p>
          </div>

          <div className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
            {[
              ['Date & Time', `${selected.label} • ${selected.range}`, Clock],
              ['Location', selected.place, MapPin],
              ['Agenda', `${selected.agenda} items`, ListChecks],
            ].map(([k, v, Icon]) => {
              const I = Icon as typeof Clock
              return (
                <div key={k as string} className="flex items-center justify-between gap-3 border-b border-[#272D39] py-2.5 text-[11px]">
                  <span className="flex items-center gap-2 text-slate-400">
                    <I className="h-3.5 w-3.5" /> {k as string}
                  </span>
                  <span className="min-w-0 break-words text-right font-medium">{v as string}</span>
                </div>
              )
            })}

            <div className="flex items-center justify-between gap-3 border-b border-[#272D39] py-2.5 text-[11px]">
              <span className="text-slate-400">Status</span>
              <Badge tone={tone[selected.status]}>{selected.status}</Badge>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-2 min-[480px]:flex-row min-[480px]:items-center min-[480px]:justify-between">
            <button
              type="button"
              onClick={() => setViewing(selected)}
              className="flex cursor-pointer items-center justify-center rounded-lg bg-linear-to-r from-[#6C63FF] to-[#4DA3FF] px-5 py-2.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
            >
              View Details
            </button>
            <button
              type="button"
              onClick={() => setEditing(selected)}
              className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-[#272D39] px-4 py-2.5 text-xs text-slate-300 hover:bg-white/5"
            >
              <Pencil className="h-3.5 w-3.5" /> Edit
            </button>
          </div>
        </Card>
      </motion.div>

      {/* Schedule Meeting drawer */}
      <ScheduleMeetingModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSubmit={handleAdd}
      />

      {/* All Meetings popup (View All) */}
      <AnimatePresence>
        {allOpen && (
          <AllMeetingsModal
            meetings={meetings}
            selectedId={selected.id}
            onClose={() => setAllOpen(false)}
            onSelect={(m) => {
              pick(m)
              setAllOpen(false)
            }}
            onEdit={(m) => {
              setAllOpen(false)
              setEditing(m)
            }}
          />
        )}
      </AnimatePresence>

      {/* View Details popup */}
      <AnimatePresence>
        {viewing && (
          <ViewMeetingModal
            key={viewing.id}
            record={viewing}
            onClose={() => setViewing(null)}
            onEdit={() => {
              const m = viewing
              setViewing(null)
              setEditing(m)
            }}
          />
        )}
      </AnimatePresence>

      {/* Edit popup */}
      <AnimatePresence>
        {editing && (
          <EditMeetingModal
            key={editing.id}
            record={editing}
            onClose={() => setEditing(null)}
            onSubmit={handleEdit}
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
            className="fixed right-4 top-20 z-80 flex max-w-[90vw] items-center gap-2 rounded-lg border border-emerald-500/30 bg-[#10131A] px-4 py-2.5 text-xs text-emerald-400 shadow-xl"
          >
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}