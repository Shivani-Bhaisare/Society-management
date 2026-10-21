'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  X, FileText, CalendarDays, Flag, User, ChevronDown,
  UploadCloud, Trash2, CircleCheck, ListChecks, Paperclip, ListPlus,
} from 'lucide-react'
import { agendaSchema } from '@/lib/validations/agenda.schema' // ADDED: validation rules
import { getErrors } from '@/lib/validations/validate' // ADDED: converts rule errors to { field: message }

/* ---------- Config ---------- */

const PRIORITIES = ['High', 'Medium', 'Low']
const STATUSES = ['Upcoming', 'In Progress', 'Completed']

// TODO: fetch from API later
const DEFAULT_MEETINGS = [
  'Monthly Committee Meeting',
  'Annual General Meeting',
  'Emergency Meeting',
]

// TODO: fetch from API later
const MEMBERS = [
  'Ramesh Sharma', 'Priya Verma', 'Amit Kumar', 'Sunita Rao',
  'Vikram Singh', 'Neha Bansal', 'Rajesh Patel',
]

// Explicit form value types (fixes the `string & number` = never issue)
type AgendaValues = {
  title: string
  meeting: string
  date: string
  priority: string
  description: string
  assignedTo: string
  status: string
}

const INITIAL: AgendaValues = {
  title: '', meeting: '', date: '', priority: '',
  description: '', assignedTo: '', status: 'Upcoming',
}

export type AgendaPayload = AgendaValues & { id: number; files: File[] }

const noScrollbar =
  '[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden'

/* ---------- Styles ---------- */
/* bg: #10131A | input bg: #0B0E14 | border: #272D39 | accent: #6C63FF / #A29CFF */

const inputCls = (icon = false, error = false) =>
  `w-full rounded-md border bg-[#0B0E14] py-2 text-[11px] text-white outline-none transition-colors placeholder:text-slate-500 focus:border-[#6C63FF] sm:py-2.5 sm:text-xs ${
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
      <label className="mb-1 block text-[10px] text-slate-400 sm:text-[11px]">
        {label} {hint && <span className="text-slate-500">({hint})</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-[9px] text-red-400 sm:text-[10px]">{error}</p>}
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

/* ---------- Drawer ---------- */

export default function AddAgendaModal({
  open, onClose, onSave, meetings = DEFAULT_MEETINGS, members = MEMBERS,
}: {
  open: boolean
  onClose: () => void
  onSave?: (data: AgendaPayload) => void
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
  onSave?: (data: AgendaPayload) => void
  meetings: string[]
  members: string[]
}) {
  const [v, setV] = useState<AgendaValues>(INITIAL)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [files, setFiles] = useState<File[]>([])
  const [fileError, setFileError] = useState('')

  // Lock background page scroll while the drawer is open + close on Esc
  useEffect(() => {
    const html = document.documentElement
    const body = document.body
    const prevHtml = html.style.overflow
    const prevBody = body.style.overflow
    html.style.overflow = 'hidden'
    body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      html.style.overflow = prevHtml
      body.style.overflow = prevBody
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  const bind = (k: keyof AgendaValues) => ({
    value: v[k] ?? '',
    onChange: (
      e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
    ) => {
      const val = e.target.value
      setV((p) => ({ ...p, [k]: val }))
      setErrors((p) => ({ ...p, [k]: '' }))
    },
  })

  function addFiles(list: FileList | null) {
    if (!list) return
    const valid: File[] = []
    let bad = ''
    Array.from(list).forEach((f) => {
      const okType = /\.(pdf|doc|docx)$/i.test(f.name)
      const okSize = f.size <= 10 * 1024 * 1024
      if (okType && okSize) valid.push(f)
      else bad = 'Only PDF, DOC, DOCX files up to 10 MB are allowed'
    })
    setFileError(bad)
    if (valid.length) setFiles((p) => [...p, ...valid])
  }

  // CHANGED: validation (rules live in lib/validations/agenda.schema.ts)
  function validate() {
    const err = getErrors(agendaSchema, v)
    setErrors(err)
    return Object.keys(err).length === 0
  }

  function submit(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault()
    if (!validate()) return
    // TODO: add API call here
    onSave?.({ ...v, id: Date.now(), files })
    onClose()
  }

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      onClick={onClose}
      className="fixed inset-0 z-100 flex justify-end bg-black/70 py-0 pl-0 backdrop-blur-sm sm:py-5 sm:pl-3"
    >
      <motion.form
        onSubmit={submit}
        noValidate
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="flex h-full w-full max-w-full flex-col overflow-hidden border border-r-0 border-[#272D39] bg-[#10131A] text-white shadow-2xl sm:max-w-150 sm:rounded-l-2xl"
      >
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between gap-3 p-3.5 pb-2 sm:p-4 sm:pb-2 lg:p-5 lg:pb-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-[#6C63FF] to-[#4DA3FF] sm:h-10 sm:w-10">
              <CalendarDays className="h-4 w-4 text-white sm:h-5 sm:w-5" />
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-sm font-bold text-white sm:text-base">Add New Agenda</h2>
              <p className="text-[10px] text-slate-400 sm:text-xs">Create an agenda item for a society meeting</p>
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
        <div className={`mt-2 min-h-0 flex-1 overflow-y-auto overscroll-contain px-3.5 text-white sm:px-4 lg:px-5 ${noScrollbar}`}>
          <div className="rounded-xl border border-[#272D39] p-3 sm:p-3.5 lg:p-4">
            {/* Section 1 */}
            <div className="mb-3 flex items-center gap-2.5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#6C63FF]/20 text-[#A29CFF]">
                <ListChecks className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0">
                <h3 className="text-xs font-bold sm:text-sm">Agenda Details</h3>
                <p className="text-[9px] text-slate-400 sm:text-[11px]">Title, meeting, schedule and details</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Agenda Title" error={errors.title}>
                <IconInput
                  icon={FileText}
                  {...bind('title')}
                  error={!!errors.title}
                  placeholder="Enter agenda title"
                />
              </Field>

              <Field label="Select Meeting" error={errors.meeting}>
                <IconSelect
                  icon={CalendarDays}
                  {...bind('meeting')}
                  error={!!errors.meeting}
                  placeholder="Choose a meeting"
                  options={meetings}
                />
              </Field>

              <Field label="Agenda Date" error={errors.date}>
                <div className="relative">
                  <CalendarDays className="pointer-events-none absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-500" />
                  <input
                    type="date"
                    {...bind('date')}
                    className={`${inputCls(true, !!errors.date)} scheme-dark ${v.date ? '' : 'text-slate-500'}`}
                  />
                </div>
              </Field>

              <Field label="Priority" error={errors.priority}>
                <IconSelect
                  icon={Flag}
                  {...bind('priority')}
                  error={!!errors.priority}
                  placeholder="Select priority"
                  options={PRIORITIES}
                />
              </Field>
            </div>

            <div className="mt-3">
              <Field label="Description" error={errors.description}>
                <div className="relative">
                  <FileText className="pointer-events-none absolute left-2.5 top-2.5 h-3 w-3 text-slate-500" />
                  <textarea
                    rows={4}
                    maxLength={1000}
                    {...bind('description')}
                    placeholder="Enter agenda details and discussion points..."
                    className={`${inputCls(true, !!errors.description)} resize-none ${noScrollbar}`}
                  />
                </div>
                <p className="mt-1 text-right text-[9px] text-slate-500 sm:text-[10px]">{v.description.length}/1000</p>
              </Field>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Assigned To" error={errors.assignedTo}>
                <IconSelect
                  icon={User}
                  {...bind('assignedTo')}
                  error={!!errors.assignedTo}
                  placeholder="Select committee member"
                  options={members}
                />
              </Field>

              <Field label="Status">
                <IconSelect icon={CircleCheck} {...bind('status')} options={STATUSES} />
              </Field>
            </div>

            {/* Section 2 */}
            <div className="mb-3 mt-5 flex items-center gap-2.5 border-t border-[#272D39] pt-4">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#6C63FF]/20 text-[#A29CFF]">
                <Paperclip className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0">
                <h3 className="text-xs font-bold sm:text-sm">Supporting Documents</h3>
                <p className="text-[9px] text-slate-400 sm:text-[11px]">Attach relevant files (optional)</p>
              </div>
            </div>

            <Field label="Attach Documents" hint="Optional" error={fileError}>
              <label className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed border-[#3A4152] bg-[#0B0E14] px-3 py-4 text-center transition-colors hover:border-[#6C63FF] sm:py-5">
                <UploadCloud className="h-4 w-4 text-[#A29CFF] sm:h-5 sm:w-5" />
                <span className="text-[10px] font-medium text-white sm:text-xs">Click to upload or drag and drop</span>
                <span className="text-[9px] text-slate-500 sm:text-[10px]">PDF, DOC, DOCX (max 10 MB)</span>
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
                      <span className="min-w-0 flex-1 truncate text-[10px] text-white sm:text-xs">{f.name}</span>
                      <span className="shrink-0 text-[9px] text-slate-500 sm:text-[10px]">
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
          <div className="h-3" />
        </div>

        {/* Footer */}
        <div className="flex shrink-0 flex-col-reverse items-stretch justify-end gap-2 border-t border-[#272D39] p-3.5 sm:flex-row sm:items-center sm:p-4 lg:p-5">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-md border border-[#272D39] px-3.5 py-2 text-[11px] font-semibold text-white hover:bg-white/5 sm:py-1.5 sm:text-xs"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex cursor-pointer items-center justify-center gap-1.5 rounded-md bg-linear-to-r from-[#6C63FF] to-[#4DA3FF] px-4 py-2 text-[11px] font-semibold text-white hover:opacity-90 sm:py-1.5 sm:text-xs"
          >
            <ListPlus className="h-3 w-3" /> Save Agenda
          </button>
        </div>
      </motion.form>
    </motion.div>,
    document.body,
  )
}