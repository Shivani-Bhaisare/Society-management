'use client'

import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  X, FileText, CalendarDays, Clock, MapPin, Users, User, ChevronDown, Check,
  UploadCloud, Trash2, Bell, Activity, CalendarPlus, Presentation,
} from 'lucide-react'
import { meetingSchema } from '@/lib/validations/meeting.schema' // ADDED: validation rules
import { getErrors } from '@/lib/validations/validate' // ADDED: converts rule errors to { field: message }

/* ---------- Config ---------- */

const MEETING_TYPES = ['Committee Meeting', 'AGM Meeting', 'Emergency Meeting', 'General Body Meeting', 'Other']
const MODES = ['In-person', 'Online', 'Hybrid']
const REMINDERS = ['No reminder', '5 minutes before', '15 minutes before', '30 minutes before', '1 hour before', '1 day before']
const STATUSES = ['Scheduled', 'Confirmed', 'Pending']

// Load from the API later
const MEMBERS = [
  'Ramesh Sharma', 'Priya Verma', 'Amit Kumar', 'Sunita Rao',
  'Vikram Singh', 'Neha Bansal', 'Rajesh Patel',
]

// 30 minute time slots (12 hour format)
const TIMES = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2)
  const m = i % 2 ? '30' : '00'
  const ap = h < 12 ? 'AM' : 'PM'
  const h12 = h % 12 === 0 ? 12 : h % 12
  return `${String(h12).padStart(2, '0')}:${m} ${ap}`
})

// Plain text fields of the form
type Fields = {
  title: string
  type: string
  date: string
  start: string
  end: string
  venue: string
  mode: string
  organizer: string
  agenda: string
  reminder: string
  status: string
}

const INITIAL: Fields = {
  title: '', type: 'Committee Meeting', date: '', start: '', end: '',
  venue: '', mode: 'In-person', organizer: '', agenda: '',
  reminder: '15 minutes before', status: 'Scheduled',
}

// Data sent to onSubmit (fields + participants, file names and invite flag)
export type MeetingForm = Fields & {
  participants: string[]
  files: string[]
  invite: boolean
}

/* Hide the scrollbar (content still scrolls, the bar is just not visible) */
const noScrollbar =
  '[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden'

/* ---------- Styles ---------- */
/* bg: #10131A | input bg: #0B0E14 | border: #272D39 | accent: #6C63FF / #A29CFF */

// CHANGED: added the error argument (red border when a field has an error)
const inputCls = (icon = false, error = false) =>
  `w-full rounded-md border bg-[#0B0E14] py-2 text-[11px] text-white outline-none transition-colors placeholder:text-slate-500 focus:border-[#6C63FF] ${
    error ? 'border-red-500/60' : 'border-[#272D39]'
  } ${icon ? 'pl-8 pr-2.5' : 'px-2.5'}`

// CHANGED: Field now shows an error message under the input
function Field({
  label, hint, error, className = '', children,
}: { label: string; hint?: string; error?: string; className?: string; children: React.ReactNode }) {
  return (
    <div className={`min-w-0 ${className}`}>
      <label className="mb-1 block text-[10px] text-slate-400">
        {label} {hint && <span className="text-slate-500">({hint})</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-[9px] text-red-400">{error}</p>}
    </div>
  )
}

// CHANGED: IconInput accepts an error flag
function IconInput({
  icon: Icon, error, ...props
}: { icon: React.ElementType; error?: boolean } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-500" />
      <input {...props} className={inputCls(true, error)} />
    </div>
  )
}

// CHANGED: IconSelect accepts an error flag
function IconSelect({
  icon: Icon, placeholder, options, error, ...props
}: {
  icon: React.ElementType
  placeholder?: string
  options: string[]
  error?: boolean
} & React.SelectHTMLAttributes<HTMLSelectElement>) {
  const empty = !props.value
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-500" />
      <select
        {...props}
        className={`${inputCls(true, error)} appearance-none pr-7 ${empty ? 'text-slate-500' : ''}`}
      >
        {placeholder && (
          <option value="" className="bg-[#10131A] text-slate-400">{placeholder}</option>
        )}
        {options.map((o) => (
          <option key={o} value={o} className="bg-[#10131A] text-white">{o}</option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-400" />
    </div>
  )
}

function Check2({ on, onChange, label }: { on: boolean; onChange: () => void; label: string }) {
  return (
    <button type="button" onClick={onChange} className="flex cursor-pointer items-center gap-2 text-left text-[10px] text-slate-200">
      <span
        className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border ${
          on ? 'border-[#6C63FF] bg-[#6C63FF]' : 'border-[#272D39]'
        }`}
      >
        {on && <Check className="h-2.5 w-2.5 text-white" />}
      </span>
      {label}
    </button>
  )
}

/* ---------- Drawer ---------- */

export default function ScheduleMeetingModal({
  open, onClose, onSubmit,
}: {
  open: boolean
  onClose: () => void
  onSubmit?: (data: MeetingForm) => void
}) {
  return (
    <AnimatePresence>
      {open && <Body onClose={onClose} onSubmit={onSubmit} />}
    </AnimatePresence>
  )
}

function Body({
  onClose, onSubmit,
}: { onClose: () => void; onSubmit?: (data: MeetingForm) => void }) {
  const [v, setV] = useState<Fields>(INITIAL)
  const [errors, setErrors] = useState<Record<string, string>>({}) // ADDED: error messages per field
  const [fileError, setFileError] = useState('') // ADDED: error for the attached documents
  const [invite, setInvite] = useState(true)
  const [participants, setParticipants] = useState<string[]>([])
  const [pickerOpen, setPickerOpen] = useState(false)
  const [files, setFiles] = useState<File[]>([])

  const participantLabel = useMemo(() => {
    if (!participants.length) return 'Select members'
    if (participants.length <= 2) return participants.join(', ')
    return `${participants.length} members selected`
  }, [participants])

  // Lock the page scroll behind the drawer as soon as it opens + close on Esc
  useEffect(() => {
    const html = document.documentElement
    const body = document.body
    const prevHtml = html.style.overflow
    const prevBody = body.style.overflow
    html.style.overflow = 'hidden'
    body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => {
      html.style.overflow = prevHtml
      body.style.overflow = prevBody
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  // Bind an input / select / textarea to one of the form fields
  // CHANGED: typing in a field also clears its error
  const bind = (k: keyof Fields) => ({
    value: v[k],
    onChange: (
      e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
    ) => {
      const val = e.target.value
      setV((p) => ({ ...p, [k]: val }))
      setErrors((p) => ({ ...p, [k]: '' }))
    },
  })

  // CHANGED: picking a participant clears the participants error
  const toggleMember = (m: string) => {
    setParticipants((p) => (p.includes(m) ? p.filter((x) => x !== m) : [...p, m]))
    setErrors((p) => ({ ...p, participants: '' }))
  }

  // CHANGED: only PDF / DOC / DOCX / PNG / JPG up to 10 MB are accepted
  function addFiles(list: FileList | null) {
    if (!list) return
    const valid: File[] = []
    let bad = ''
    Array.from(list).forEach((f) => {
      const okType = /\.(pdf|doc|docx|png|jpg|jpeg)$/i.test(f.name)
      const okSize = f.size <= 10 * 1024 * 1024
      if (okType && okSize) valid.push(f)
      else bad = 'Only PDF, DOC, DOCX, PNG, JPG files up to 10 MB are allowed'
    })
    setFileError(bad)
    if (valid.length) setFiles((p) => [...p, ...valid])
  }

  // ADDED: validation (rules live in lib/validations/meeting.schema.ts)
  function validate() {
    const err = getErrors(meetingSchema, { ...v, participantCount: participants.length })
    setErrors(err)
    return Object.keys(err).length === 0
  }

  function submit(ev: React.FormEvent) {
    ev.preventDefault()
    if (!validate()) return // CHANGED: stop here when there are errors
    // TODO: add the API call here
    onSubmit?.({ ...v, participants, files: files.map((f) => f.name), invite })
    onClose()
  }

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      onClick={onClose}
      // No gap on the right side, only top and bottom gap
      className="fixed inset-0 z-100 flex justify-end bg-black/70 py-3 pl-3 backdrop-blur-sm sm:py-5 sm:pl-0"
    >
      <motion.form
        onSubmit={submit}
        noValidate
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="flex h-full w-full max-w-md flex-col overflow-hidden rounded-l-2xl border border-r-0 border-[#272D39] bg-[#10131A] text-white shadow-2xl"
      >
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between gap-3 p-3.5 pb-2 sm:p-4 sm:pb-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-[#6C63FF] to-[#4DA3FF]">
              <CalendarDays className="h-4 w-4 text-white" />
            </span>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-white">Schedule New Meeting</h2>
              <p className="text-[10px] text-slate-400">Create and share a meeting with your society members</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 cursor-pointer rounded-lg p-1.5 text-slate-300 hover:bg-white/5 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body: scrolls without a visible scrollbar */}
        <div className={`mt-2 min-h-0 flex-1 overflow-y-auto overscroll-contain px-3.5 text-white sm:px-4 ${noScrollbar}`}>
          <div className="rounded-xl border border-[#272D39] p-3.5">
            {/* Section 1 */}
            <div className="mb-3 flex items-center gap-2.5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#6C63FF]/20 text-[#A29CFF]">
                <Presentation className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0">
                <h3 className="text-xs font-bold">Meeting Details</h3>
                <p className="text-[9px] text-slate-400">Title, schedule, venue and organizer</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Meeting Title" error={errors.title}>
                <IconInput icon={FileText} {...bind('title')} error={!!errors.title} placeholder="Enter meeting title" />
              </Field>

              <Field label="Meeting Type" error={errors.type}>
                <IconSelect icon={Users} {...bind('type')} error={!!errors.type} options={MEETING_TYPES} />
              </Field>

              <Field label="Meeting Date" error={errors.date}>
                <div className="relative">
                  <CalendarDays className="pointer-events-none absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-500" />
                  <input
                    type="date"
                    {...bind('date')}
                    className={`${inputCls(true, !!errors.date)} scheme-dark ${v.date ? '' : 'text-slate-500'}`}
                  />
                </div>
              </Field>

              <Field label="Start Time" error={errors.start}>
                <IconSelect icon={Clock} {...bind('start')} error={!!errors.start} placeholder="Select start time" options={TIMES} />
              </Field>

              <Field label="End Time" error={errors.end}>
                <IconSelect icon={Clock} {...bind('end')} error={!!errors.end} placeholder="Select end time" options={TIMES} />
              </Field>

              <Field label="Venue / Location" error={errors.venue}>
                <IconInput icon={MapPin} {...bind('venue')} error={!!errors.venue} placeholder="Enter venue or location" />
              </Field>

              <Field label="Meeting Mode" error={errors.mode}>
                <IconSelect icon={Users} {...bind('mode')} error={!!errors.mode} options={MODES} />
              </Field>

              <Field label="Organizer" error={errors.organizer}>
                <IconSelect icon={User} {...bind('organizer')} error={!!errors.organizer} placeholder="Select committee member" options={MEMBERS} />
              </Field>
            </div>

            {/* Participants */}
            <div className="mt-3">
              <Field label="Participants / Invite Members" error={errors.participants}>
                <div className="relative">
                  <Users className="pointer-events-none absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-500" />
                  <button
                    type="button"
                    onClick={() => setPickerOpen((p) => !p)}
                    className={`${inputCls(true, !!errors.participants)} cursor-pointer pr-7 text-left ${participants.length ? '' : 'text-slate-500'}`}
                  >
                    <span className="block truncate">{participantLabel}</span>
                  </button>
                  <ChevronDown
                    className={`pointer-events-none absolute right-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-400 transition-transform ${
                      pickerOpen ? 'rotate-180' : ''
                    }`}
                  />
                </div>

                {pickerOpen && (
                  <div className="mt-1.5 grid grid-cols-1 gap-x-4 gap-y-2.5 rounded-md border border-[#272D39] bg-[#0B0E14] p-2.5 min-[480px]:grid-cols-2">
                    {MEMBERS.map((m) => (
                      <Check2 key={m} label={m} on={participants.includes(m)} onChange={() => toggleMember(m)} />
                    ))}
                  </div>
                )}
              </Field>
            </div>

            {/* Section 2 */}
            <div className="mb-3 mt-5 flex items-center gap-2.5 border-t border-[#272D39] pt-4">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#6C63FF]/20 text-[#A29CFF]">
                <FileText className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0">
                <h3 className="text-xs font-bold">Agenda &amp; Documents</h3>
                <p className="text-[9px] text-slate-400">Discussion points and attachments</p>
              </div>
            </div>

            <Field label="Agenda" error={errors.agenda}>
              <div className="relative">
                <FileText className="pointer-events-none absolute left-2.5 top-2.5 h-3 w-3 text-slate-500" />
                <textarea
                  rows={4}
                  maxLength={1000}
                  {...bind('agenda')}
                  placeholder="Enter meeting agenda and discussion points..."
                  className={`${inputCls(true, !!errors.agenda)} resize-none`}
                />
              </div>
              <p className="mt-1 text-right text-[9px] text-slate-500">{v.agenda.length}/1000</p>
            </Field>

            <div className="mt-3">
              <Field label="Attach Documents" hint="Optional" error={fileError}>
                <label className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed border-[#3A4152] bg-[#0B0E14] px-3 py-4 text-center transition-colors hover:border-[#6C63FF]">
                  <UploadCloud className="h-4 w-4 text-[#A29CFF]" />
                  <span className="text-[10px] font-medium text-white">Click to upload or drag and drop</span>
                  <span className="text-[9px] text-slate-500">PDF, DOC, DOCX, PNG, JPG (Max 10MB)</span>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
                    className="hidden"
                    onChange={(e) => {
                      addFiles(e.target.files)
                      e.target.value = ''
                    }}
                  />
                </label>

                {files.length > 0 && (
                  <div className="mt-2 flex flex-col gap-1.5">
                    {files.map((f, i) => (
                      <div key={`${f.name}-${i}`} className="flex items-center gap-2 rounded-md border border-[#272D39] bg-[#0B0E14] px-2.5 py-1.5">
                        <FileText className="h-3 w-3 shrink-0 text-red-400" />
                        <span className="min-w-0 flex-1 truncate text-[10px] text-white">{f.name}</span>
                        <span className="shrink-0 text-[9px] text-slate-500">
                          {(f.size / (1024 * 1024)).toFixed(1)} MB
                        </span>
                        <button
                          type="button"
                          onClick={() => setFiles((p) => p.filter((_, idx) => idx !== i))}
                          className="shrink-0 cursor-pointer text-slate-400 hover:text-red-400"
                          aria-label="Remove file"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </Field>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Reminder" error={errors.reminder}>
                <IconSelect icon={Bell} {...bind('reminder')} error={!!errors.reminder} options={REMINDERS} />
              </Field>
              <Field label="Meeting Status" error={errors.status}>
                <IconSelect icon={Activity} {...bind('status')} error={!!errors.status} options={STATUSES} />
              </Field>
            </div>

            <div className="mt-4 rounded-md border border-[#272D39] bg-[#0B0E14] p-2.5">
              <Check2
                on={invite}
                onChange={() => setInvite((p) => !p)}
                label="Send invitation and notification to participants"
              />
            </div>
          </div>
          <div className="h-3" />
        </div>

        {/* Footer */}
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-[#272D39] p-3.5 sm:p-4">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-md border border-[#272D39] px-3.5 py-1.5 text-[11px] font-semibold text-white hover:bg-white/5 max-sm:flex-1"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex cursor-pointer items-center justify-center gap-1.5 rounded-md bg-linear-to-r from-[#6C63FF] to-[#4DA3FF] px-4 py-1.5 text-[11px] font-semibold text-white hover:opacity-90 max-sm:flex-1"
          >
            <CalendarPlus className="h-3 w-3" /> Schedule Meeting
          </button>
        </div>
      </motion.form>
    </motion.div>,
    document.body,
  )
}