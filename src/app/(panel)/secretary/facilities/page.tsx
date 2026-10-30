'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import { AnimatePresence, motion, type Variants } from 'framer-motion'
import {
  Search, Plus, Clock, Users, CalendarCheck,
  Waves, Dumbbell, Building2, Trophy, TreePine, Car, LayoutGrid,
  ChevronDown, Trash2, CheckCircle2, X,
  type LucideIcon,
} from 'lucide-react'
import { Badge } from '@/Components/ui'
import AddFacilityModal, { type FacilityPayload } from '@/Components/AddFacilityModal'

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

// Facility card animation: each card animates by itself when it mounts (so cards that appear after a tab change, search or add are never stuck hidden)
// "custom" is the card index and gives the one-after-another (stagger) delay
const cardItem: Variants = {
  hidden: { opacity: 0, y: 30, scale: 0.97 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.7, ease: EASE, delay: 0.05 + Math.min(i, 8) * 0.1 },
  }),
}

/* ---------- Types ---------- */
type Status = 'Open' | 'Available' | 'In Use' | 'Maintenance' | 'Unavailable'

type Facility = {
  id: number
  name: string
  status: Status
  timing: string
  capacity: number | null
  booking: boolean
  icon: LucideIcon
  c: string
  img: string
}

// One booking made from the Book popup (replace with API data later)
type Booking = {
  id: number
  facilityId: number
  bookedBy: string
  date: string
  from: string
  to: string
  guests: number
  purpose: string
}

const tabs = ['All', 'Available', 'In Use', 'Maintenance'] as const
type Tab = (typeof tabs)[number]

// All real statuses (used in the Manage popup)
const statusList: Status[] = ['Open', 'Available', 'In Use', 'Maintenance', 'Unavailable']

/* ---------- Data (replace with API later) ---------- */
const initialFacilities: Facility[] = [
  { id: 1, name: 'Swimming Pool', status: 'Open', timing: '6 AM - 10 PM', capacity: 40, booking: true, icon: Waves, c: '#3B82F6', img: '/img31.jpg' },
  { id: 2, name: 'Gym', status: 'Open', timing: '5 AM - 11 PM', capacity: 25, booking: true, icon: Dumbbell, c: '#8B5CF6', img: '/img32.jpg' },
  { id: 3, name: 'Club House', status: 'Available', timing: '8 AM - 10 PM', capacity: 100, booking: true, icon: Building2, c: '#F59E0B', img: '/img33.jpg' },
  { id: 4, name: 'Community Hall', status: 'Available', timing: '9 AM - 11 PM', capacity: 150, booking: true, icon: Users, c: '#00C2B8', img: '/img34.jpg' },
  // The 2 samples below keep the "In Use" and "Maintenance" tabs from being empty. Delete them if not needed.
  { id: 5, name: 'Tennis Court', status: 'In Use', timing: '6 AM - 9 PM', capacity: 8, booking: true, icon: Trophy, c: '#EF4444', img: '/img35.jpg' },
  { id: 6, name: 'Terrace Garden', status: 'Maintenance', timing: '7 AM - 8 PM', capacity: 60, booking: false, icon: TreePine, c: '#10B981', img: '/img36.jpg' },
]

const statusTone: Record<Status, 'green' | 'blue' | 'orange' | 'gray'> = {
  Open: 'green',
  Available: 'green',
  'In Use': 'blue',
  Maintenance: 'orange',
  Unavailable: 'gray',
}

// Icon and colour based on the modal's category
const categoryStyle: Record<string, { icon: LucideIcon; c: string }> = {
  Sports: { icon: Trophy, c: '#EF4444' },
  Recreation: { icon: Building2, c: '#F59E0B' },
  Fitness: { icon: Dumbbell, c: '#8B5CF6' },
  'Event Space': { icon: Users, c: '#00C2B8' },
  'Kids Zone': { icon: TreePine, c: '#10B981' },
  Parking: { icon: Car, c: '#3B82F6' },
  Other: { icon: LayoutGrid, c: '#A29CFF' },
}

// "06:00 AM" -> "6 AM", "06:30 PM" -> "6:30 PM"
const fmtTime = (t: string) => {
  const [hm, ap] = t.split(' ')
  const [h, m] = hm.split(':')
  return `${parseInt(h, 10)}${m === '00' ? '' : `:${m}`} ${ap}`
}

function matchTab(status: Status, tab: Tab) {
  if (tab === 'All') return true
  if (tab === 'Available') return status === 'Open' || status === 'Available'
  return status === tab
}

// Today's date as "YYYY-MM-DD" (used as the minimum date in the Book popup)
const todayStr = () => {
  const d = new Date()
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

// "2026-10-30" -> "30 Oct 2026"
const fmtDate = (d: string) =>
  new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

// Shared form field style
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

function ViewFacilityModal({
  record, bookingCount, onClose,
}: {
  record: Facility
  bookingCount: number
  onClose: () => void
}) {
  const Icon = record.icon

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
            <h2 className="text-sm font-bold">Facility Details</h2>
            <p className="truncate text-[11px] text-slate-400">{record.name}</p>
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

        {/* Photo (icon placeholder if there is no image) */}
        <div className="relative mt-3 h-36 w-full overflow-hidden rounded-lg border border-[#272D39]">
          {record.img ? (
            <Image
              src={record.img}
              alt={record.name}
              fill
              unoptimized={record.img.startsWith('blob:')}
              sizes="400px"
              className="object-cover"
            />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center"
              style={{ background: `${record.c}1A`, color: record.c }}
            >
              <Icon className="h-10 w-10" />
            </div>
          )}
        </div>

        {/* Status */}
        <div className="mt-3 flex items-center justify-between rounded-lg border border-[#272D39] bg-white/3 px-3 py-2">
          <span className="text-[11px] text-slate-400">Status</span>
          <Badge tone={statusTone[record.status]}>{record.status}</Badge>
        </div>

        {/* Details */}
        <div className="mt-2 rounded-lg border border-[#272D39] bg-white/3 px-3">
          <DetailRow label="Facility No." value={`#${record.id}`} />
          <DetailRow label="Name" value={record.name} />
          <DetailRow label="Timing" value={record.timing} />
          <DetailRow label="Capacity" value={record.capacity === null ? '—' : String(record.capacity)} />
          <DetailRow label="Booking" value={record.booking ? 'Booking Required' : 'No Booking Needed'} />
          <DetailRow label="Total Bookings" value={String(bookingCount)} />
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

/* ---------- Manage Facility popup ---------- */

function ManageFacilityModal({
  record, onClose, onSubmit, onDelete,
}: {
  record: Facility
  onClose: () => void
  onSubmit: (updated: Facility) => void
  onDelete: () => void
}) {
  const [name, setName] = useState(record.name)
  const [fStatus, setFStatus] = useState<Status>(record.status)
  const [timing, setTiming] = useState(record.timing)
  const [capacity, setCapacity] = useState(record.capacity === null ? '' : String(record.capacity))
  const [booking, setBooking] = useState(record.booking)
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
    const capNum = Number(capacity)
    if (name.trim().length < 3) {
      setError('Name must be at least 3 characters.')
      return
    }
    if (!timing.trim()) {
      setError('Please enter the timing.')
      return
    }
    if (capacity.trim() !== '' && (Number.isNaN(capNum) || capNum < 1)) {
      setError('Capacity must be a number greater than 0.')
      return
    }
    onSubmit({
      ...record,
      name: name.trim(),
      status: fStatus,
      timing: timing.trim(),
      capacity: capacity.trim() === '' ? null : Math.round(capNum),
      booking,
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
            <h2 className="text-base font-bold">Manage Facility</h2>
            <p className="text-[11px] text-slate-400">Update the details of this facility</p>
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
            Facility Name
            <input
              value={name}
              onChange={(e) => { setName(e.target.value); setError('') }}
              className={field}
              autoFocus
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-[11px] text-slate-400">
              Status
              <div className="relative">
                <select
                  value={fStatus}
                  onChange={(e) => setFStatus(e.target.value as Status)}
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
              Capacity
              <input
                type="number"
                min={1}
                value={capacity}
                onChange={(e) => { setCapacity(e.target.value); setError('') }}
                placeholder="e.g. 40"
                className={field}
              />
            </label>
          </div>

          <label className="flex flex-col gap-1 text-[11px] text-slate-400">
            Timing
            <input
              value={timing}
              onChange={(e) => { setTiming(e.target.value); setError('') }}
              placeholder="e.g. 6 AM - 10 PM"
              className={field}
            />
          </label>

          <label className="flex flex-col gap-1 text-[11px] text-slate-400">
            Booking
            <div className="relative">
              <select
                value={booking ? 'yes' : 'no'}
                onChange={(e) => setBooking(e.target.value === 'yes')}
                className={`${field} cursor-pointer pr-8`}
              >
                <option value="yes">Booking Required</option>
                <option value="no">No Booking Needed</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
            </div>
          </label>

          {error && <p className="text-[11px] text-red-400">{error}</p>}
        </div>

        {/* Actions */}
        <div className="mt-5 flex items-center justify-between gap-2">
          {/* Delete: opens the confirm popup */}
          <button
            type="button"
            onClick={onDelete}
            className="flex cursor-pointer items-center gap-1.5 rounded-lg border border-red-500/30 px-3 py-2 text-xs font-semibold text-red-400 transition hover:bg-red-500/10 active:scale-95"
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>

          <div className="flex gap-2">
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
        </div>
      </motion.form>
    </motion.div>
  )
}

/* ---------- Book Facility popup ---------- */

function BookFacilityModal({
  record, onClose, onSubmit,
}: {
  record: Facility
  onClose: () => void
  onSubmit: (data: Omit<Booking, 'id' | 'facilityId'>) => void
}) {
  const [bookedBy, setBookedBy] = useState('')
  const [date, setDate] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [guests, setGuests] = useState('1')
  const [purpose, setPurpose] = useState('')
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
    const guestNum = Number(guests)
    if (bookedBy.trim().length < 3) {
      setError('Name must be at least 3 characters.')
      return
    }
    if (!date) {
      setError('Please select a date.')
      return
    }
    if (date < todayStr()) {
      setError('Date cannot be in the past.')
      return
    }
    if (!from || !to) {
      setError('Please select the start and end time.')
      return
    }
    if (to <= from) {
      setError('End time must be after the start time.')
      return
    }
    if (Number.isNaN(guestNum) || guestNum < 1) {
      setError('Guests must be at least 1.')
      return
    }
    if (record.capacity !== null && guestNum > record.capacity) {
      setError(`Guests cannot be more than the capacity (${record.capacity}).`)
      return
    }
    onSubmit({
      bookedBy: bookedBy.trim(),
      date,
      from,
      to,
      guests: Math.round(guestNum),
      purpose: purpose.trim(),
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
          <div className="min-w-0">
            <h2 className="text-base font-bold">Book Facility</h2>
            <p className="truncate text-[11px] text-slate-400">
              {record.name} • {record.timing}
              {record.capacity !== null && ` • Capacity ${record.capacity}`}
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
            Booked By
            <input
              value={bookedBy}
              onChange={(e) => { setBookedBy(e.target.value); setError('') }}
              placeholder="e.g. Rahul Sharma"
              className={field}
              autoFocus
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-[11px] text-slate-400">
              Date
              <input
                type="date"
                min={todayStr()}
                value={date}
                onChange={(e) => { setDate(e.target.value); setError('') }}
                className={`${field} scheme-dark`}
              />
            </label>

            <label className="flex flex-col gap-1 text-[11px] text-slate-400">
              Guests
              <input
                type="number"
                min={1}
                max={record.capacity ?? undefined}
                value={guests}
                onChange={(e) => { setGuests(e.target.value); setError('') }}
                className={field}
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-[11px] text-slate-400">
              From
              <input
                type="time"
                value={from}
                onChange={(e) => { setFrom(e.target.value); setError('') }}
                className={`${field} scheme-dark`}
              />
            </label>

            <label className="flex flex-col gap-1 text-[11px] text-slate-400">
              To
              <input
                type="time"
                value={to}
                onChange={(e) => { setTo(e.target.value); setError('') }}
                className={`${field} scheme-dark`}
              />
            </label>
          </div>

          <label className="flex flex-col gap-1 text-[11px] text-slate-400">
            Purpose (optional)
            <textarea
              value={purpose}
              onChange={(e) => setPurpose(e.target.value)}
              rows={2}
              placeholder="e.g. Birthday party"
              className={`${field} resize-none`}
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
            Confirm Booking
          </button>
        </div>
      </motion.form>
    </motion.div>
  )
}

/* ---------- Delete confirm popup ---------- */

function DeleteFacilityConfirm({
  record, onClose, onConfirm,
}: {
  record: Facility
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
            <h2 className="text-base font-bold">Delete Facility</h2>
            <p className="text-[11px] text-slate-400">This action cannot be undone.</p>
          </div>
        </div>

        <p className="mt-4 text-xs text-slate-300">
          Are you sure you want to delete{' '}
          <span className="font-semibold text-white">{record.name}</span>?
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
export default function FacilitiesPage() {
  // Facilities data + modal state
  const [items, setItems] = useState<Facility[]>(initialFacilities)
  const [showFacilityModal, setShowFacilityModal] = useState(false)

  const [tab, setTab] = useState<Tab>('All')
  const [q, setQ] = useState('')

  // Bookings made from the Book popup (replace with API data later)
  const [bookings, setBookings] = useState<Booking[]>([])

  // Facility open in the View / Manage / Book / Delete popup (null = closed)
  const [viewing, setViewing] = useState<Facility | null>(null)
  const [managing, setManaging] = useState<Facility | null>(null)
  const [booking, setBooking] = useState<Facility | null>(null)
  const [deleting, setDeleting] = useState<Facility | null>(null)
  // Small success message after an action
  const [toast, setToast] = useState('')

  // Hide the success message after 3 seconds
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 3000)
    return () => clearTimeout(t)
  }, [toast])

  // Add the new facility card from the modal
  function handleSave(f: FacilityPayload) {
    const style = categoryStyle[f.category] ?? categoryStyle.Other
    const status: Status = f.maintenance.closed
      ? 'Maintenance'
      : f.available
      ? 'Available'
      : 'Unavailable'

    const newFacility: Facility = {
      id: f.id,
      name: f.name,
      status,
      timing: `${fmtTime(f.openingTime)} - ${fmtTime(f.closingTime)}`,
      capacity: f.capacity ? Number(f.capacity) : null,
      booking: f.bookingRequired,
      icon: style.icon,
      c: style.c,
      // Local URL of the uploaded image (use the server URL once the backend is ready)
      img: f.image ? URL.createObjectURL(f.image) : '',
    }
    setItems((prev) => [newFacility, ...prev])
  }

  // Manage: save the changed details (replace with an API call later)
  const handleManage = (updated: Facility) => {
    setItems((prev) => prev.map((f) => (f.id === updated.id ? updated : f)))
    setToast(`"${updated.name}" updated`)
    setManaging(null)
  }

  // Book: save the booking (replace with an API call later)
  const handleBook = (data: Omit<Booking, 'id' | 'facilityId'>) => {
    if (!booking) return
    setBookings((prev) => [{ id: Date.now(), facilityId: booking.id, ...data }, ...prev])
    setToast(`${booking.name} booked for ${fmtDate(data.date)}`)
    setBooking(null)
  }

  // Delete: removes the facility (replace with an API call later)
  const handleDelete = () => {
    if (!deleting) return
    setItems((prev) => prev.filter((f) => f.id !== deleting.id))
    setBookings((prev) => prev.filter((b) => b.facilityId !== deleting.id))
    setToast(`"${deleting.name}" deleted`)
    setDeleting(null)
  }

  const list = useMemo(() => {
    const term = q.trim().toLowerCase()
    return items.filter((f) => matchTab(f.status, tab) && f.name.toLowerCase().includes(term))
  }, [items, tab, q])

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-4">
      {/* Header */}
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
        className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
      >
        <motion.div variants={item}>
          <h1 className="text-xl font-bold sm:text-2xl">Facilities</h1>
          <p className="text-xs text-slate-400">Manage society amenities and facilities</p>
        </motion.div>

        <motion.div variants={item} className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search facilities..."
              className="w-full rounded-lg border border-[#272D39] bg-[#10131A] py-2 pl-9 pr-3 text-xs text-slate-200 outline-none placeholder:text-slate-500 focus:border-[#A29CFF]/60"
            />
          </div>
          {/* Primary button: opens the Add Facility modal */}
          <button
            type="button"
            onClick={() => setShowFacilityModal(true)}
            className="flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-linear-to-r from-[#6C63FF] to-[#4DA3FF] px-4 py-2.5 text-xs font-semibold text-white transition hover:opacity-90 active:scale-95"
          >
            <Plus className="h-3.5 w-3.5" /> Add Facility
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
        {tabs.map((t) => (
          <motion.button
            key={t}
            variants={item}
            type="button"
            onClick={() => setTab(t)}
            className={`shrink-0 whitespace-nowrap rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
              tab === t
                ? 'border-transparent bg-gradient-to-r from-[#6C63FF] to-[#4DA3FF] text-white'
                : 'border-[#272D39] bg-[#10131A] text-slate-300 hover:bg-white/5'
            }`}
          >
            {t}
          </motion.button>
        ))}
      </motion.div>

      {/* Cards: plain div, every card animates by itself (fixes cards staying hidden after a tab change) */}
      <div className="grid grid-cols-1 gap-4 min-[560px]:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
        {list.map((f, i) => {
          const Icon = f.icon
          return (
            <motion.div
              key={f.id}
              custom={i}
              variants={cardItem}
              initial="hidden"
              whileInView="show"
              viewport={VIEWPORT}
              className="overflow-hidden rounded-xl border border-[#272D39] bg-[#10131A]"
            >
              {/* IMAGE: facility photo (icon placeholder if there is no image) */}
              <div className="relative h-36 w-full overflow-hidden border-b border-[#272D39] sm:h-40">
                {f.img ? (
                  <Image
                    src={f.img}
                    alt={f.name}
                    fill
                    unoptimized={f.img.startsWith('blob:')}
                    sizes="(min-width: 1536px) 25vw, (min-width: 1280px) 33vw, (min-width: 560px) 50vw, 100vw"
                    className="object-cover"
                  />
                ) : (
                  <div
                    className="flex h-full w-full items-center justify-center"
                    style={{ background: `${f.c}1A`, color: f.c }}
                  >
                    <Icon className="h-10 w-10" />
                  </div>
                )}
              </div>

              <div className="p-4">
                {/* Name + status */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                      style={{ background: `${f.c}26`, color: f.c }}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="truncate text-xs font-semibold">{f.name}</span>
                  </div>
                  <Badge tone={statusTone[f.status]}>{f.status}</Badge>
                </div>

                {/* Details */}
                <ul className="mt-3 flex flex-col gap-1.5 text-[10px] text-slate-400">
                  <li className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 shrink-0 text-slate-500" /> {f.timing}
                  </li>
                  <li className="flex items-center gap-2">
                    <Users className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                    Capacity: {f.capacity ?? '—'}
                  </li>
                  <li className="flex items-center gap-2">
                    <CalendarCheck className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                    {f.booking ? 'Booking Required' : 'No Booking Needed'}
                  </li>
                </ul>

                {/* Actions */}
                <div className="mt-4 grid grid-cols-3 gap-2">
                  {/* View: opens the details popup */}
                  <button
                    type="button"
                    onClick={() => setViewing(f)}
                    className="cursor-pointer rounded-md border border-[#272D39] bg-white/[0.03] py-1.5 text-[10px] font-medium text-slate-300 hover:bg-white/5"
                  >
                    View
                  </button>
                  {/* Manage: opens the edit / delete popup */}
                  <button
                    type="button"
                    onClick={() => setManaging(f)}
                    className="cursor-pointer rounded-md border border-[#272D39] bg-white/[0.03] py-1.5 text-[10px] font-medium text-slate-300 hover:bg-white/5"
                  >
                    Manage
                  </button>
                  {/* Book: opens the booking popup */}
                  <button
                    type="button"
                    onClick={() => setBooking(f)}
                    disabled={f.status === 'Maintenance' || f.status === 'Unavailable'}
                    className="cursor-pointer rounded-md bg-gradient-to-r from-[#6C63FF] to-[#4DA3FF] py-1.5 text-[10px] font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Book
                  </button>
                </div>
              </div>
            </motion.div>
          )
        })}

        {/* Empty state */}
        {list.length === 0 && (
          <div className="col-span-full rounded-xl border border-dashed border-[#272D39] p-10 text-center text-xs text-slate-400">
            No facilities found.
          </div>
        )}
      </div>

      {/* Add Facility modal */}
      <AddFacilityModal
        open={showFacilityModal}
        onClose={() => setShowFacilityModal(false)}
        onSave={handleSave}
      />

      {/* View Details popup */}
      <AnimatePresence>
        {viewing && (
          <ViewFacilityModal
            key={viewing.id}
            record={viewing}
            bookingCount={bookings.filter((b) => b.facilityId === viewing.id).length}
            onClose={() => setViewing(null)}
          />
        )}
      </AnimatePresence>

      {/* Manage popup */}
      <AnimatePresence>
        {managing && (
          <ManageFacilityModal
            key={managing.id}
            record={managing}
            onClose={() => setManaging(null)}
            onSubmit={handleManage}
            onDelete={() => {
              setDeleting(managing)
              setManaging(null)
            }}
          />
        )}
      </AnimatePresence>

      {/* Book popup */}
      <AnimatePresence>
        {booking && (
          <BookFacilityModal
            key={booking.id}
            record={booking}
            onClose={() => setBooking(null)}
            onSubmit={handleBook}
          />
        )}
      </AnimatePresence>

      {/* Delete confirm popup */}
      <AnimatePresence>
        {deleting && (
          <DeleteFacilityConfirm
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