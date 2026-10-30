'use client'

import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion, type Variants } from 'framer-motion'
import {
  Plus, Search, SlidersHorizontal, Eye, Pencil, Trash2, ChevronDown, CheckCircle2, X,
  Droplets, PartyPopper, Car, Wrench, CalendarClock, Megaphone, type LucideIcon,
} from 'lucide-react'
import { Card, Badge } from '@/Components/ui'
import AddCommunicationModal, { type CommunicationPayload } from '@/Components/AddCommunicationModal'

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
type Channel = 'App' | 'Email' | 'SMS'
type CStatus = 'Sent' | 'Scheduled' | 'Draft'
type Group = 'Residents' | 'Owners' | 'Staff'

type Msg = {
  id: number
  subject: string
  preview: string
  audience: string
  group: Group
  channel: Channel
  date: string
  status: CStatus
  icon: LucideIcon
  c: string
}

// Initial communications list
const initial: Msg[] = [
  { id: 1, subject: 'Water Supply Maintenance', preview: 'Water supply will be unavailable for...', audience: 'All Residents', group: 'Residents', channel: 'App', date: '28 Oct 2026', status: 'Sent', icon: Droplets, c: '#3B82F6' },
  { id: 2, subject: 'Diwali Celebration Event', preview: 'Join us for the Diwali celebration at...', audience: 'All Residents', group: 'Residents', channel: 'Email', date: '27 Oct 2026', status: 'Scheduled', icon: PartyPopper, c: '#EF4444' },
  { id: 3, subject: 'Parking Rules Update', preview: 'New parking rules will be effective...', audience: 'Owners', group: 'Owners', channel: 'SMS', date: '25 Oct 2026', status: 'Sent', icon: Car, c: '#3B82F6' },
  { id: 4, subject: 'Maintenance Reminder', preview: 'Please clear the maintenance dues for...', audience: 'All Residents', group: 'Residents', channel: 'App', date: '22 Oct 2026', status: 'Draft', icon: Wrench, c: '#F59E0B' },
]

// Upcoming scheduled sends
const scheduled = [
  { t: 'Diwali Celebration Event', when: '27 Oct 2026, 10:00 AM' },
  { t: 'Monthly Maintenance', when: '01 Nov 2026, 09:00 AM' },
]

// Latest sent messages
const recent = [
  { t: 'Water Supply Maintenance', when: '28 Oct 2026, 08:45 AM' },
  { t: 'Parking Rules Update', when: '25 Oct 2026, 06:15 PM' },
]

// Badge tones for channel and status
const channelTone: Record<Channel, 'blue' | 'purple' | 'green'> = { App: 'blue', Email: 'purple', SMS: 'green' }
const statusTone: Record<CStatus, 'green' | 'orange' | 'gray'> = { Sent: 'green', Scheduled: 'orange', Draft: 'gray' }

const tabs = ['All', 'Residents', 'Owners', 'Staff'] as const
type Tab = (typeof tabs)[number]

// All channels and statuses (used in the Edit popup)
const channelList: Channel[] = ['App', 'Email', 'SMS']
const statusList: CStatus[] = ['Sent', 'Scheduled', 'Draft']

// Audience options in the Edit popup
const audienceList = ['All Residents', 'Owners', 'Committee members']

// Convert the modal's audience into the table's Group
const audienceToGroup = (a: string): Group =>
  a === 'Owners only' ? 'Owners' : a === 'Committee members' ? 'Staff' : 'Residents'

// Convert an audience chosen in the Edit popup into the table's Group
const editAudienceToGroup = (a: string): Group => {
  const s = a.toLowerCase()
  if (s.includes('owner')) return 'Owners'
  if (s.includes('committee') || s.includes('staff')) return 'Staff'
  return 'Residents'
}

// Build a plain-text preview from the HTML message
const stripHtml = (html: string) =>
  html.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()

const fmtDate = (iso?: string) =>
  (iso ? new Date(iso) : new Date()).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })

// Shared table + form field styles
const th = 'bg-white/[0.04] px-2 py-2 font-medium first:rounded-l-md last:rounded-r-md'
const td = 'border-t border-[#272D39] px-2 py-2.5'
const field =
  'w-full appearance-none rounded-lg border border-[#272D39] bg-[#10131A] px-3 py-2 text-xs text-slate-200 outline-none placeholder:text-slate-500 focus:border-[#A29CFF]/60'

/* ---------- View Details popup ---------- */

// One detail row (label on the left, value on the right)
function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-[#272D39] py-2 text-[11px] first:border-t-0">
      <span className="shrink-0 text-slate-400">{label}</span>
      <span className="text-right font-medium text-slate-200">{value}</span>
    </div>
  )
}

function ViewMsgModal({ record, onClose }: { record: Msg; onClose: () => void }) {
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
            <h2 className="text-sm font-bold">Communication Details</h2>
            <p className="truncate text-[11px] text-slate-400">{record.subject}</p>
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
          <Badge tone={statusTone[record.status]}>{record.status}</Badge>
        </div>

        {/* Channel */}
        <div className="mt-2 flex items-center justify-between rounded-lg border border-[#272D39] bg-white/3 px-3 py-2">
          <span className="text-[11px] text-slate-400">Channel</span>
          <Badge tone={channelTone[record.channel]}>{record.channel}</Badge>
        </div>

        {/* Details */}
        <div className="mt-2 rounded-lg border border-[#272D39] bg-white/3 px-3">
          <DetailRow label="Message No." value={`#${record.id}`} />
          <DetailRow label="Subject" value={record.subject} />
          <DetailRow label="Message" value={record.preview} />
          <DetailRow label="Audience" value={record.audience} />
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

/* ---------- Edit Communication popup ---------- */

function EditMsgModal({
  record, onClose, onSubmit,
}: {
  record: Msg
  onClose: () => void
  onSubmit: (updated: Msg) => void
}) {
  const [subject, setSubject] = useState(record.subject)
  const [preview, setPreview] = useState(record.preview)
  const [audience, setAudience] = useState(record.audience)
  const [channel, setChannel] = useState<Channel>(record.channel)
  const [msgStatus, setMsgStatus] = useState<CStatus>(record.status)
  const [date, setDate] = useState(record.date)
  const [error, setError] = useState('')

  // Audience options (includes the current value if it is not in the default list)
  const audienceOptions = audienceList.includes(record.audience)
    ? audienceList
    : [record.audience, ...audienceList]

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
    if (subject.trim().length < 3) {
      setError('Subject must be at least 3 characters.')
      return
    }
    if (!preview.trim()) {
      setError('Please enter the message.')
      return
    }
    if (!date.trim()) {
      setError('Please enter the date.')
      return
    }
    onSubmit({
      ...record,
      subject: subject.trim(),
      preview: preview.trim(),
      audience,
      group: editAudienceToGroup(audience),
      channel,
      status: msgStatus,
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
            <h2 className="text-base font-bold">Edit Communication</h2>
            <p className="text-[11px] text-slate-400">Update the details of this message</p>
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
            Subject
            <input
              value={subject}
              onChange={(e) => { setSubject(e.target.value); setError('') }}
              className={field}
              autoFocus
            />
          </label>

          <label className="flex flex-col gap-1 text-[11px] text-slate-400">
            Message
            <textarea
              value={preview}
              onChange={(e) => { setPreview(e.target.value); setError('') }}
              rows={3}
              className={`${field} resize-none`}
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-[11px] text-slate-400">
              Audience
              <div className="relative">
                <select
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  className={`${field} cursor-pointer pr-8`}
                >
                  {audienceOptions.map((a) => (
                    <option key={a} value={a}>{a}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
              </div>
            </label>

            <label className="flex flex-col gap-1 text-[11px] text-slate-400">
              Channel
              <div className="relative">
                <select
                  value={channel}
                  onChange={(e) => setChannel(e.target.value as Channel)}
                  className={`${field} cursor-pointer pr-8`}
                >
                  {channelList.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
              </div>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-[11px] text-slate-400">
              Status
              <div className="relative">
                <select
                  value={msgStatus}
                  onChange={(e) => setMsgStatus(e.target.value as CStatus)}
                  className={`${field} cursor-pointer pr-8`}
                >
                  {statusList.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
              </div>
            </label>

            <label className="flex flex-col gap-1 text-[11px] text-slate-400">
              Date
              <input
                value={date}
                onChange={(e) => { setDate(e.target.value); setError('') }}
                placeholder="e.g. 25 Oct 2026"
                className={field}
              />
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

function DeleteMsgConfirm({
  record, onClose, onConfirm,
}: {
  record: Msg
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
            <h2 className="text-base font-bold">Delete Communication</h2>
            <p className="text-[11px] text-slate-400">This action cannot be undone.</p>
          </div>
        </div>

        <p className="mt-4 text-xs text-slate-300">
          Are you sure you want to delete{' '}
          <span className="font-semibold text-white">{record.subject}</span>?
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

/* ---------- View All (Recent Messages) popup ---------- */

function AllSentModal({ messages, onClose }: { messages: Msg[]; onClose: () => void }) {
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
        className="flex max-h-[90vh] w-full max-w-md flex-col rounded-xl border border-[#272D39] bg-[#10131A] p-4 text-white shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold">All Sent Messages</h2>
            <p className="text-[11px] text-slate-400">{messages.length} messages sent</p>
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

        {/* Sent messages list (scrolls when long) */}
        <div className="mt-3 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto rounded-lg border border-[#272D39] bg-white/3 p-3">
          {messages.map((m) => {
            const Icon = m.icon
            return (
              <div key={m.id} className="flex items-center gap-3">
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                  style={{ background: `${m.c}26`, color: m.c }}
                >
                  <Icon className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold">{m.subject}</p>
                  <p className="truncate text-[10px] text-slate-400">{m.date} • {m.audience}</p>
                </div>
                <Badge tone="green">Sent</Badge>
              </div>
            )
          })}

          {/* Empty state */}
          {messages.length === 0 && (
            <p className="py-6 text-center text-[11px] text-slate-500">No sent messages yet</p>
          )}
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

/* ---------- Page ---------- */
export default function CommunicationPage() {
  // List + filter state
  const [items, setItems] = useState(initial)
  const [tab, setTab] = useState<Tab>('All')
  const [q, setQ] = useState('')
  const [showFilter, setShowFilter] = useState(false)
  const [status, setStatus] = useState('All')

  // Modal state
  const [showCommModal, setShowCommModal] = useState(false)

  // Message open in the View / Edit / Delete popup (null = closed)
  const [viewing, setViewing] = useState<Msg | null>(null)
  const [editing, setEditing] = useState<Msg | null>(null)
  const [deleting, setDeleting] = useState<Msg | null>(null)
  // View All popup (Recent Messages) open / close
  const [showAll, setShowAll] = useState(false)
  // Small success message after an action
  const [toast, setToast] = useState('')

  // Hide the success message after 3 seconds
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 3000)
    return () => clearTimeout(t)
  }, [toast])

  // Add the new message from the modal to the table
  function handleSave(c: CommunicationPayload) {
    const plain = stripHtml(c.message)
    const newMsg: Msg = {
      id: c.id,
      subject: c.subject,
      preview: plain ? (plain.length > 40 ? `${plain.slice(0, 40)}...` : plain) : 'No message content',
      audience: c.audience,
      group: audienceToGroup(c.audience),
      channel: c.channels[0] ?? 'App',
      date: fmtDate(c.schedule === 'later' ? c.date : undefined),
      status: c.status,
      icon: Megaphone,
      c: '#8B5CF6',
    }
    setItems((prev) => [newMsg, ...prev])
  }

  // Edit: save the changed details (replace with an API call later)
  const handleEdit = (updated: Msg) => {
    setItems((prev) => prev.map((m) => (m.id === updated.id ? updated : m)))
    setToast(`"${updated.subject}" updated`)
    setEditing(null)
  }

  // Delete: removes the message (replace with an API call later)
  const handleDelete = () => {
    if (!deleting) return
    setItems((prev) => prev.filter((m) => m.id !== deleting.id))
    setToast(`"${deleting.subject}" deleted`)
    setDeleting(null)
  }

  // Apply tab + status + search filters
  const list = useMemo(() => {
    const s = q.trim().toLowerCase()
    return items.filter(
      (m) =>
        (tab === 'All' || m.group === tab) &&
        (status === 'All' || m.status === status) &&
        (!s || `${m.subject} ${m.audience} ${m.channel}`.toLowerCase().includes(s)),
    )
  }, [items, tab, q, status])

  // All sent messages (shown in the View All popup)
  const sentMessages = useMemo(() => items.filter((m) => m.status === 'Sent'), [items])

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
          <h1 className="text-xl font-bold sm:text-2xl">Communication</h1>
          <p className="text-xs text-slate-400">Send announcements and messages to residents</p>
        </motion.div>

        {/* New button: opens the New Communication modal */}
        <motion.div variants={item}>
          <button
            type="button"
            onClick={() => setShowCommModal(true)}
            className="flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-linear-to-r from-[#6C63FF] to-[#4DA3FF] px-4 py-2.5 text-xs font-semibold text-white transition hover:opacity-90 active:scale-95"
          >
            <Plus className="h-3.5 w-3.5" /> New Communication
          </button>
        </motion.div>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {/* Left: tabs + search + table */}
        <div className="flex flex-col gap-3 xl:col-span-2">
          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={VIEWPORT}
            className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"
          >
            {/* Group tabs */}
            <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {tabs.map((t) => (
                <motion.button
                  key={t}
                  variants={item}
                  type="button"
                  onClick={() => setTab(t)}
                  className={`shrink-0 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-[11px] transition-colors ${
                    tab === t
                      ? 'border-transparent bg-gradient-to-r from-[#6C63FF] to-[#4DA3FF] font-semibold text-white' // Active tab: Figma gradient
                      : 'border-[#272D39] bg-[#10131A] text-slate-400 hover:bg-white/5'
                  }`}
                >
                  {t}
                </motion.button>
              ))}
            </div>

            {/* Search + filter toggle */}
            <motion.div variants={item} className="flex items-center gap-2">
              <div className="relative flex-1 lg:w-64 lg:flex-none">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search communications..."
                  className={`${field} pl-9`}
                />
              </div>
              <button
                type="button"
                onClick={() => setShowFilter((v) => !v)}
                aria-label="Filters"
                aria-pressed={showFilter}
                className={`flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-lg border text-slate-300 hover:bg-white/5 ${
                  showFilter ? 'border-[#6C63FF] text-[#A29CFF]' : 'border-[#272D39]' // Active filter border: Figma purple
                }`}
              >
                <SlidersHorizontal className="h-4 w-4" />
              </button>
            </motion.div>
          </motion.div>

          {/* Status filter (shown when the filter button is active) */}
          {showFilter && (
            <div className="relative max-w-xs">
              <select value={status} onChange={(e) => setStatus(e.target.value)} className={`${field} pr-8`}>
                <option value="All">Status: All</option>
                <option value="Sent">Sent</option>
                <option value="Scheduled">Scheduled</option>
                <option value="Draft">Draft</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
            </div>
          )}

          {/* Communications table */}
          <motion.div
            variants={item}
            initial="hidden"
            whileInView="show"
            viewport={VIEWPORT}
          >
            <Card title="Communications" sub={`${list.length} messages`}>
              {/* Scrollbar hidden, but horizontal scrolling still works */}
              <div className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <table className="w-full min-w-[680px] text-left text-[11px]">
                  <thead className="text-slate-400">
                    <tr>
                      <th className={th}>Subject</th>
                      <th className={th}>Audience</th>
                      <th className={th}>Channel</th>
                      <th className={th}>Date</th>
                      <th className={th}>Status</th>
                      <th className={`${th} text-right`}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((m) => {
                      const Icon = m.icon
                      return (
                        <tr key={m.id} className="hover:bg-white/[0.02]">
                          <td className={td}>
                            <span className="flex items-center gap-3">
                              <span
                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                                style={{ background: `${m.c}26`, color: m.c }}
                              >
                                <Icon className="h-4 w-4" />
                              </span>
                              <span className="min-w-0">
                                <span className="block truncate font-semibold">{m.subject}</span>
                                <span className="block max-w-[200px] truncate text-[10px] text-slate-400">{m.preview}</span>
                              </span>
                            </span>
                          </td>
                          <td className={`${td} text-slate-300`}>{m.audience}</td>
                          <td className={td}><Badge tone={channelTone[m.channel]}>{m.channel}</Badge></td>
                          <td className={`${td} text-slate-400`}>{m.date}</td>
                          <td className={td}><Badge tone={statusTone[m.status]}>{m.status}</Badge></td>
                          <td className={`${td} text-right`}>
                            <span className="inline-flex items-center gap-0.5 text-slate-400">
                              {/* View: opens the details popup */}
                              <button
                                type="button"
                                title="View Details"
                                aria-label="View"
                                onClick={() => setViewing(m)}
                                className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md transition active:scale-90 hover:bg-white/5 hover:text-white"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </button>
                              {/* Edit: opens the edit popup */}
                              <button
                                type="button"
                                title="Edit"
                                aria-label="Edit"
                                onClick={() => setEditing(m)}
                                className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md transition active:scale-90 hover:bg-white/5 hover:text-[#A29CFF]"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              {/* Delete: opens the confirm popup */}
                              <button
                                type="button"
                                title="Delete"
                                aria-label="Delete"
                                onClick={() => setDeleting(m)}
                                className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-red-400 transition active:scale-90 hover:bg-red-500/10"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </span>
                          </td>
                        </tr>
                      )
                    })}

                    {/* Empty state */}
                    {list.length === 0 && (
                      <tr>
                        <td colSpan={6} className={`${td} py-8 text-center text-slate-500`}>
                          No communications found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Right: Scheduled + Recent */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={VIEWPORT}
          className="flex flex-col gap-4"
        >
          <motion.div variants={item}>
            <Card title="Scheduled Messages" sub="Upcoming sends">
              <div className="flex flex-col gap-3">
                {scheduled.map((s) => (
                  <div key={s.t} className="flex items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F59E0B]/15 text-[#F59E0B]">
                      <CalendarClock className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold">{s.t}</p>
                      <p className="truncate text-[10px] text-slate-400">{s.when}</p>
                    </div>
                    <Badge tone="orange">Scheduled</Badge>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>

          <motion.div variants={item}>
            <Card
              title="Recent Messages" sub="Latest sent"
              action={
                // View All: opens the all sent messages popup
                <button
                  type="button"
                  onClick={() => setShowAll(true)}
                  className="cursor-pointer text-[11px] text-[#A29CFF] hover:underline"
                >
                  View All
                </button>
              }
            >
              <div className="flex flex-col gap-3">
                {recent.map((r) => (
                  <div key={r.t} className="flex items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#00C2B8]/15 text-[#00C2B8]">
                      <Eye className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold">{r.t}</p>
                      <p className="truncate text-[10px] text-slate-400">{r.when}</p>
                    </div>
                    <Badge tone="green">Sent</Badge>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        </motion.div>
      </div>

      {/* New Communication modal */}
      <AddCommunicationModal
        open={showCommModal}
        onClose={() => setShowCommModal(false)}
        onSave={handleSave}
      />

      {/* View Details popup */}
      <AnimatePresence>
        {viewing && (
          <ViewMsgModal
            key={viewing.id}
            record={viewing}
            onClose={() => setViewing(null)}
          />
        )}
      </AnimatePresence>

      {/* Edit popup */}
      <AnimatePresence>
        {editing && (
          <EditMsgModal
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
          <DeleteMsgConfirm
            key={deleting.id}
            record={deleting}
            onClose={() => setDeleting(null)}
            onConfirm={handleDelete}
          />
        )}
      </AnimatePresence>

      {/* View All (Recent Messages) popup */}
      <AnimatePresence>
        {showAll && <AllSentModal messages={sentMessages} onClose={() => setShowAll(false)} />}
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