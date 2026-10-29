'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  X, FileText, CalendarDays, User, ChevronDown, UploadCloud, Trash2,
  Gavel, Paperclip, Plus, Presentation,
} from 'lucide-react'
import {
  resolutionSchema,
  TITLE_MAX,
  DESC_MAX,
  MAX_FILES,
  MAX_FILE_SIZE,
  MAX_TOTAL_SIZE,
} from '@/lib/validations/resolution.schema'

/* ---------- Config ---------- */

// TODO: load from API later
const DEFAULT_MEETINGS = [
  'Monthly Committee Meeting',
  'Annual General Meeting',
  'Emergency Meeting',
]

// TODO: load from API later
const MEMBERS = [
  'Ramesh Sharma', 'Priya Verma', 'Amit Kumar', 'Sunita Rao',
  'Vikram Singh', 'Neha Bansal', 'Rajesh Patel',
]

// All text fields of the form (every field is a string)
type Vals = {
  title: string
  meeting: string
  date: string
  description: string
  proposedBy: string
  votingStart: string
  votingEnd: string
}

const INITIAL: Vals = {
  title: '', meeting: '', date: '', description: '',
  proposedBy: '', votingStart: '', votingEnd: '',
}

// Data received on save (id and files are not strings, so they are added separately)
export type ResolutionPayload = Vals & { id: number; files: File[] }

// Today's date as YYYY-MM-DD (used for the date picker min)
const todayStr = () => {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

// Hide the scrollbar (content still scrolls)
const noScrollbar =
  '[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden'

/* ---------- Styles ---------- */
/* bg: #10131A | input bg: #0B0E14 | border: #272D39 | accent: #6C63FF / #A29CFF */

const inputCls = (icon = false, error = false) =>
  `w-full rounded-md border bg-[#0B0E14] py-2 text-[11px] text-white outline-none transition-colors placeholder:text-slate-500 focus:border-[#6C63FF] ${
    error ? 'border-red-500/60' : 'border-[#272D39]'
  } ${icon ? 'pl-8 pr-2.5' : 'px-2.5'}`

function Field({
  label, hint, error, className = '', children,
}: {
  label: string
  hint?: string
  error?: string
  className?: string
  children: React.ReactNode
}) {
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

function DateInput({
  error, value, ...props
}: { error?: boolean } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="relative">
      <CalendarDays className="pointer-events-none absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-500" />
      <input
        type="date"
        value={value}
        {...props}
        className={`${inputCls(true, error)} scheme-dark ${value ? '' : 'text-slate-500'}`}
      />
    </div>
  )
}

/* ---------- Drawer ---------- */

export default function AddResolutionModal({
  open, onClose, onSave, meetings = DEFAULT_MEETINGS, members = MEMBERS,
}: {
  open: boolean
  onClose: () => void
  onSave?: (data: ResolutionPayload) => void | Promise<void>
  meetings?: string[]
  members?: string[]
}) {
  return (
    <AnimatePresence>
      {open && (
        <Body onClose={onClose} onSave={onSave} meetings={meetings} members={members} />
      )}
    </AnimatePresence>
  )
}

function Body({
  onClose, onSave, meetings, members,
}: {
  onClose: () => void
  onSave?: (data: ResolutionPayload) => void | Promise<void>
  meetings: string[]
  members: string[]
}) {
  const [v, setV] = useState<Vals>(INITIAL)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [files, setFiles] = useState<File[]>([])
  const [fileError, setFileError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  // Lock page scroll while the drawer is open + close on Esc
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

  // k can only be a key of Vals (a wrong field name shows a red line)
  const bind = (k: keyof Vals) => ({
    value: v[k],
    onChange: (
      e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
    ) => {
      const val = e.target.value
      setV((p) => ({ ...p, [k]: val }))
      setErrors((p) => ({ ...p, [k]: '' }))
    },
  })

  // Quick checks while picking files (final check also runs in the schema on submit)
  function addFiles(list: FileList | null) {
    if (!list) return
    const valid: File[] = []
    const problems = new Set<string>()
    let total = files.reduce((sum, f) => sum + f.size, 0)

    Array.from(list).forEach((f) => {
      if (!/\.(pdf|doc|docx)$/i.test(f.name)) {
        problems.add('Only PDF, DOC, DOCX files are allowed')
      } else if (f.size === 0) {
        problems.add(`"${f.name}" is empty`)
      } else if (f.size > MAX_FILE_SIZE) {
        problems.add('Each file must be 10 MB or less')
      } else if ([...files, ...valid].some((x) => x.name === f.name && x.size === f.size)) {
        problems.add(`"${f.name}" is already added`)
      } else if (files.length + valid.length >= MAX_FILES) {
        problems.add(`You can attach up to ${MAX_FILES} files`)
      } else if (total + f.size > MAX_TOTAL_SIZE) {
        problems.add('Total size of all files must be 25 MB or less')
      } else {
        valid.push(f)
        total += f.size
      }
    })

    setFileError(Array.from(problems).join('. '))
    if (valid.length) setFiles((p) => [...p, ...valid])
  }

  // Validation runs through resolution.schema.ts
  function validate() {
    const result = resolutionSchema.safeParse({ ...v, files })
    const err: Record<string, string> = {}

    if (!result.success) {
      for (const issue of result.error.issues) {
        const key = String(issue.path[0])
        if (!err[key]) err[key] = issue.message
      }
    }

    // Selected values must exist in the lists
    if (!err.meeting && !meetings.includes(v.meeting)) err.meeting = 'Please select a valid meeting'
    if (!err.proposedBy && !members.includes(v.proposedBy)) err.proposedBy = 'Please select a valid committee member'

    setErrors(err)
    setFileError(err.files ?? '')
    return Object.keys(err).length === 0
  }

  async function submit(ev: React.FormEvent) {
    ev.preventDefault()
    if (submitting) return // block double submit
    if (!validate()) return
    setSubmitting(true)
    try {
      // TODO: call the API here
      await onSave?.({
        ...v,
        title: v.title.trim(),
        description: v.description.trim(),
        id: Date.now(),
        files,
      })
      onClose()
    } finally {
      setSubmitting(false)
    }
  }

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      onClick={onClose}
      // Gap only on top and bottom (and a small left gap on phones), none on the right
      className="fixed inset-0 z-100 flex justify-end bg-black/70 py-2 pl-2 backdrop-blur-sm sm:py-5 sm:pl-0"
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
        <div className="flex shrink-0 items-start justify-between gap-3 p-3 pb-2 sm:p-4 sm:pb-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-[#6C63FF] to-[#4DA3FF]">
              <FileText className="h-4 w-4 text-white" />
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-sm font-bold text-white">Add New Resolution</h2>
              <p className="text-[10px] text-slate-400">Create a society resolution for voting and approval</p>
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

        {/* Body */}
        <div className={`mt-2 min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 text-white sm:px-4 ${noScrollbar}`}>
          <div className="rounded-xl border border-[#272D39] p-3 sm:p-3.5">
            {/* Section 1: Resolution Details */}
            <div className="mb-3 flex items-center gap-2.5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#6C63FF]/20 text-[#A29CFF]">
                <Presentation className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0">
                <h3 className="text-xs font-bold">Resolution Details</h3>
                <p className="text-[9px] text-slate-400">Title, meeting, description and proposer</p>
              </div>
            </div>

            <Field label="Resolution Title" error={errors.title}>
              <IconInput
                icon={FileText}
                {...bind('title')}
                error={!!errors.title}
                maxLength={TITLE_MAX}
                placeholder="Enter resolution title"
              />
            </Field>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Select Meeting" error={errors.meeting}>
                <IconSelect
                  icon={CalendarDays}
                  {...bind('meeting')}
                  error={!!errors.meeting}
                  placeholder="Choose a meeting"
                  options={meetings}
                />
              </Field>

              <Field label="Resolution Date" error={errors.date}>
                <DateInput {...bind('date')} error={!!errors.date} />
              </Field>
            </div>

            <div className="mt-3">
              <Field label="Description" error={errors.description}>
                <div className="relative">
                  <FileText className="pointer-events-none absolute left-2.5 top-2.5 h-3 w-3 text-slate-500" />
                  <textarea
                    rows={4}
                    maxLength={DESC_MAX}
                    {...bind('description')}
                    placeholder="Describe the resolution and its purpose..."
                    className={`${inputCls(true, !!errors.description)} resize-none ${noScrollbar}`}
                  />
                </div>
                <p className="mt-1 text-right text-[9px] text-slate-500">{v.description.length}/{DESC_MAX}</p>
              </Field>
            </div>

            <div className="mt-3">
              <Field label="Proposed By" error={errors.proposedBy}>
                <IconSelect
                  icon={User}
                  {...bind('proposedBy')}
                  error={!!errors.proposedBy}
                  placeholder="Select committee member"
                  options={members}
                />
              </Field>
            </div>

            {/* Section 2: Voting Configuration */}
            <div className="mb-3 mt-5 flex items-center gap-2.5 border-t border-[#272D39] pt-4">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#6C63FF]/20 text-[#A29CFF]">
                <Gavel className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0">
                <h3 className="text-xs font-bold">Voting Configuration</h3>
                <p className="text-[9px] text-slate-400">Set the voting period</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Voting Start Date" error={errors.votingStart}>
                <DateInput
                  {...bind('votingStart')}
                  min={todayStr()}
                  error={!!errors.votingStart}
                />
              </Field>

              <Field label="Voting End Date" error={errors.votingEnd}>
                <DateInput
                  {...bind('votingEnd')}
                  min={v.votingStart || todayStr()}
                  error={!!errors.votingEnd}
                />
              </Field>
            </div>

            {/* Section 3: Supporting Documents */}
            <div className="mb-3 mt-5 flex items-center gap-2.5 border-t border-[#272D39] pt-4">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#6C63FF]/20 text-[#A29CFF]">
                <Paperclip className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0">
                <h3 className="text-xs font-bold">Supporting Documents</h3>
                <p className="text-[9px] text-slate-400">Attach relevant files (optional)</p>
              </div>
            </div>

            <Field label="Attach Documents" hint="Optional" error={fileError}>
              <label className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed border-[#3A4152] bg-[#0B0E14] px-3 py-4 text-center transition-colors hover:border-[#6C63FF]">
                <UploadCloud className="h-4 w-4 text-[#A29CFF]" />
                <span className="text-[10px] font-medium text-white">Click to upload or drag and drop</span>
                <span className="text-[9px] text-slate-500">PDF, DOC, DOCX (max 10 MB each, up to {MAX_FILES} files)</span>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx"
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
                        onClick={() => {
                          setFiles((p) => p.filter((_, idx) => idx !== i))
                          setFileError('')
                        }}
                        className="cursor-pointer text-slate-400 hover:text-red-400"
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
          <div className="h-3" />
        </div>

        {/* Footer: buttons share the full width on phones, sit on the right on larger screens */}
        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-[#272D39] p-3 sm:p-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 cursor-pointer rounded-md border border-[#272D39] px-3.5 py-1.5 text-[11px] font-semibold text-white hover:bg-white/5 sm:flex-none"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-md bg-linear-to-r from-[#6C63FF] to-[#4DA3FF] px-4 py-1.5 text-[11px] font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 sm:flex-none"
          >
            <Plus className="h-3 w-3" /> {submitting ? 'Saving...' : 'Save Resolution'}
          </button>
        </div>
      </motion.form>
    </motion.div>,
    document.body,
  )
}