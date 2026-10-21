'use client'

import { useEffect, useRef, useState } from 'react'
import type {
  ElementType,
  FormEvent,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
} from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  X, FileText, CalendarDays, ChevronDown, Megaphone, UploadCloud, Trash2, Send,
  User, Home, Building2, Folder, Pencil, UserCog, Droplets, Zap, ArrowUpDown,
  Volume2, ShieldCheck, Sparkles, ClipboardList, Flag, Paperclip, type LucideIcon,
} from 'lucide-react'

/* ---------- Config ---------- */

// TODO: fetch these from the API later
const RESIDENTS = ['Rahul Sharma', 'Amit Singh', 'Sneha Patel', 'Vikash Gupta', 'Pooja Kumari', 'Anil Peter']
const FLATS = ['A-101', 'A-302', 'B-201', 'B-304', 'C-104', 'C-202']
const TOWERS = ['Tower A', 'Tower B', 'Tower C']
const ASSIGNEES = ['Ramesh Kumar', 'Suresh Patel', 'Security Team', 'Housekeeping Team', 'Vendor']

const CATEGORIES: { name: string; icon: LucideIcon }[] = [
  { name: 'Plumbing', icon: Droplets },
  { name: 'Electrical', icon: Zap },
  { name: 'Lift', icon: ArrowUpDown },
  { name: 'Noise', icon: Volume2 },
  { name: 'Security', icon: ShieldCheck },
  { name: 'Housekeeping', icon: Sparkles },
]

const PRIORITIES = ['Low', 'Medium', 'High', 'Urgent'] as const
type Priority = (typeof PRIORITIES)[number]

// Active priority button styles
const PRIORITY_ACTIVE: Record<Priority, string> = {
  Low: 'border-emerald-500/60 bg-emerald-500/15 font-semibold text-emerald-400',
  Medium: 'border-blue-500/60 bg-blue-500/15 font-semibold text-blue-400',
  High: 'border-amber-500/70 bg-amber-500/15 font-semibold text-amber-400',
  Urgent: 'border-red-500/70 bg-red-500/15 font-semibold text-red-400',
}

const MAX_DESC = 1000

export type ComplaintPayload = {
  id: number
  title: string
  resident: string
  flat: string
  tower: string
  category: string
  priority: Priority
  date: string
  assignedTo: string
  description: string
  urgent: boolean
  files: File[]
}

const noScrollbar =
  '[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden'

const toISO = (d: Date) => d.toISOString().split('T')[0]

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
  children: ReactNode
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
}: { icon: ElementType; error?: boolean } & InputHTMLAttributes<HTMLInputElement>) {
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
  icon: ElementType
  placeholder?: string
  options: string[]
  error?: boolean
} & SelectHTMLAttributes<HTMLSelectElement>) {
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

function SectionHead({
  icon: Icon, title, sub, first = false,
}: { icon: ElementType; title: string; sub: string; first?: boolean }) {
  return (
    <div
      className={`mb-3 flex items-center gap-2.5 ${
        first ? '' : 'mt-5 border-t border-[#272D39] pt-4'
      }`}
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#6C63FF]/20 text-[#A29CFF]">
        <Icon className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0">
        <h3 className="text-xs font-bold">{title}</h3>
        <p className="text-[9px] text-slate-400">{sub}</p>
      </div>
    </div>
  )
}

/* ---------- Category dropdown (with icons) ---------- */

function CategorySelect({
  value, onChange, error,
}: { value: string; onChange: (v: string) => void; error?: boolean }) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // Close when clicking outside
  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const selected = CATEGORIES.find((c) => c.name === value)
  const Icon = selected?.icon ?? Folder

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`${inputCls(true, error)} relative cursor-pointer truncate pr-7 text-left ${
          open ? 'border-[#6C63FF]' : ''
        } ${selected ? '' : 'text-slate-500'}`}
      >
        <Icon className="pointer-events-none absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-500" />
        {selected ? selected.name : 'Select category'}
        <ChevronDown
          className={`pointer-events-none absolute right-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-400 transition-transform ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <div className="absolute left-0 right-0 top-full z-20 mt-1 overflow-hidden rounded-md border border-[#272D39] bg-[#0B0E14] py-1 shadow-xl">
          {CATEGORIES.map(({ name, icon: I }) => (
            <button
              key={name}
              type="button"
              onClick={() => { onChange(name); setOpen(false) }}
              className={`flex w-full cursor-pointer items-center gap-2.5 px-3 py-2 text-left text-[11px] hover:bg-white/5 ${
                value === name ? 'text-[#A29CFF]' : 'text-slate-200'
              }`}
            >
              <I className="h-3.5 w-3.5 shrink-0 text-slate-400" />
              <span className="min-w-0 truncate">{name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/* ---------- Drawer ---------- */

export default function AddComplaintModal({
  open, onClose, onSave,
}: {
  open: boolean
  onClose: () => void
  onSave?: (data: ComplaintPayload) => void
}) {
  return (
    <AnimatePresence>
      {open && <Body onClose={onClose} onSave={onSave} />}
    </AnimatePresence>
  )
}

function Body({
  onClose, onSave,
}: {
  onClose: () => void
  onSave?: (data: ComplaintPayload) => void
}) {
  const [title, setTitle] = useState('')
  const [resident, setResident] = useState('')
  const [flat, setFlat] = useState('')
  const [tower, setTower] = useState('')
  const [category, setCategory] = useState('')
  const [priority, setPriority] = useState<Priority>('High')
  const [date, setDate] = useState(toISO(new Date()))
  const [assignedTo, setAssignedTo] = useState('')
  const [description, setDescription] = useState('')
  const [urgent, setUrgent] = useState(false)
  const [files, setFiles] = useState<File[]>([])
  const [fileError, setFileError] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

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

  const clearErr = (k: string) => setErrors((p) => ({ ...p, [k]: '' }))

  // Priority and the "Mark as urgent" toggle stay in sync
  const changePriority = (p: Priority) => {
    setPriority(p)
    setUrgent(p === 'Urgent')
  }
  const changeUrgent = (v: boolean) => {
    setUrgent(v)
    if (v) setPriority('Urgent')
    else if (priority === 'Urgent') setPriority('High')
  }

  /* Attachments */
  function addFiles(list: FileList | null) {
    if (!list) return
    const valid: File[] = []
    let bad = ''
    Array.from(list).forEach((f) => {
      const okType = /\.(pdf|jpe?g|png)$/i.test(f.name)
      const okSize = f.size <= 10 * 1024 * 1024
      if (okType && okSize) valid.push(f)
      else bad = 'Only JPG, PNG, PDF files up to 10 MB are allowed'
    })
    setFileError(bad)
    if (valid.length) setFiles((p) => [...p, ...valid])
  }

  function validate() {
    const err: Record<string, string> = {}
    if (!title.trim()) err.title = 'Complaint title is required'
    if (!resident) err.resident = 'Select a resident'
    if (!flat) err.flat = 'Select a flat'
    if (!category) err.category = 'Select a category'
    if (!date) err.date = 'Date is required'
    if (!description.trim()) err.description = 'Description is required'
    setErrors(err)
    return Object.keys(err).length === 0
  }

  function submit(ev: FormEvent) {
    ev.preventDefault()
    if (!validate()) return
    // TODO: call the API here
    onSave?.({
      id: Date.now(),
      title: title.trim(),
      resident,
      flat,
      tower,
      category,
      priority,
      date,
      assignedTo,
      description: description.trim(),
      urgent,
      files,
    })
    onClose()
  }

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      onClick={onClose}
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
        className="flex h-full w-full max-w-150 flex-col overflow-hidden rounded-l-2xl border border-r-0 border-[#272D39] bg-[#10131A] text-white shadow-2xl"
      >
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between gap-3 p-3.5 pb-2 sm:p-4 sm:pb-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-[#6C63FF] to-[#4DA3FF]">
              <Megaphone className="h-4 w-4 text-white" />
            </span>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-white">New Complaint</h2>
              <p className="text-[10px] text-slate-400">Register and assign a resident complaint</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="cursor-pointer rounded-lg p-1.5 text-slate-300 hover:bg-white/5 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className={`mt-2 min-h-0 flex-1 overflow-y-auto overscroll-contain px-3.5 text-white sm:px-4 ${noScrollbar}`}>
          <div className="rounded-xl border border-[#272D39] p-3.5">
            {/* Section 1: Complaint Details */}
            <SectionHead first icon={ClipboardList} title="Complaint Details" sub="Title, resident, flat and tower" />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Complaint Title" error={errors.title}>
                <IconInput
                  icon={FileText}
                  value={title}
                  onChange={(e) => { setTitle(e.target.value); clearErr('title') }}
                  error={!!errors.title}
                  placeholder="e.g. Water leakage in bathroom"
                />
              </Field>

              <Field label="Resident / Raised By" error={errors.resident}>
                <IconSelect
                  icon={User}
                  value={resident}
                  onChange={(e) => { setResident(e.target.value); clearErr('resident') }}
                  error={!!errors.resident}
                  placeholder="Select resident"
                  options={RESIDENTS}
                />
              </Field>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Flat / Unit" error={errors.flat}>
                <IconSelect
                  icon={Home}
                  value={flat}
                  onChange={(e) => { setFlat(e.target.value); clearErr('flat') }}
                  error={!!errors.flat}
                  placeholder="Select flat"
                  options={FLATS}
                />
              </Field>

              <Field label="Tower" hint="Optional">
                <IconSelect
                  icon={Building2}
                  value={tower}
                  onChange={(e) => setTower(e.target.value)}
                  placeholder="Select tower"
                  options={TOWERS}
                />
              </Field>
            </div>

            {/* Section 2: Classification */}
            <SectionHead icon={Flag} title="Classification" sub="Category, priority and assignment" />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Category" error={errors.category}>
                <CategorySelect
                  value={category}
                  onChange={(v) => { setCategory(v); clearErr('category') }}
                  error={!!errors.category}
                />
              </Field>

              <Field label="Priority">
                <div className="grid grid-cols-4 gap-1 rounded-md border border-[#272D39] bg-[#0B0E14] p-0.5">
                  {PRIORITIES.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => changePriority(p)}
                      className={`min-w-0 cursor-pointer truncate rounded border px-0.5 py-1.5 text-[11px] transition-colors ${
                        priority === p
                          ? PRIORITY_ACTIVE[p]
                          : 'border-transparent text-slate-400 hover:bg-white/5'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </Field>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Date Reported" error={errors.date}>
                <div className="relative">
                  <CalendarDays className="pointer-events-none absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-500" />
                  <input
                    type="date"
                    value={date}
                    max={toISO(new Date())}
                    onChange={(e) => { setDate(e.target.value); clearErr('date') }}
                    className={`${inputCls(true, !!errors.date)} scheme-dark ${date ? '' : 'text-slate-500'}`}
                  />
                </div>
              </Field>

              <Field label="Assigned To" hint="Optional">
                <IconSelect
                  icon={UserCog}
                  value={assignedTo}
                  onChange={(e) => setAssignedTo(e.target.value)}
                  placeholder="Select committee member or vendor"
                  options={ASSIGNEES}
                />
              </Field>
            </div>

            {/* Section 3: Description */}
            <SectionHead icon={Pencil} title="Description" sub="Describe the issue in detail" />

            <Field label="Description" error={errors.description}>
              <div className="relative">
                <Pencil className="pointer-events-none absolute left-2.5 top-2.5 h-3 w-3 text-slate-500" />
                <textarea
                  rows={4}
                  maxLength={MAX_DESC}
                  value={description}
                  onChange={(e) => { setDescription(e.target.value); clearErr('description') }}
                  placeholder="Describe the issue in detail..."
                  className={`${inputCls(true, !!errors.description)} resize-none ${noScrollbar}`}
                />
              </div>
              <p className="mt-1 text-right text-[9px] text-slate-500">
                {description.length}/{MAX_DESC}
              </p>
            </Field>

            {/* Section 4: Attachments & Urgency */}
            <SectionHead icon={Paperclip} title="Attachments & Urgency" sub="Attach photos or documents" />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Attach Photos / Documents" hint="Optional" error={fileError}>
                <label
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={(e) => {
                    e.preventDefault()
                    setDragOver(false)
                    addFiles(e.dataTransfer.files)
                  }}
                  className={`flex cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed bg-[#0B0E14] px-3 py-4 text-center transition-colors hover:border-[#6C63FF] ${
                    dragOver ? 'border-[#6C63FF]' : 'border-[#3A4152]'
                  }`}
                >
                  <UploadCloud className="h-4 w-4 text-[#A29CFF]" />
                  <span className="text-[10px] font-medium text-white">
                    Drag files here or <span className="text-[#4DA3FF]">browse</span>
                  </span>
                  <span className="text-[9px] text-slate-500">(JPG, PNG, PDF)</span>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={(e) => {
                      addFiles(e.target.files)
                      e.target.value = ''
                    }}
                  />
                </label>
                <p className="mt-1 text-[9px] text-slate-500">Max file size 10MB per file</p>

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
                          aria-label="Remove file"
                          className="cursor-pointer text-slate-400 hover:text-red-400"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </Field>

              {/* Mark as urgent toggle */}
              <div className="min-w-0 sm:pt-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-semibold text-white">Mark as urgent</p>
                    <p className="mt-0.5 text-[9px] text-slate-400">This will notify the committee immediately.</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={urgent}
                    onClick={() => changeUrgent(!urgent)}
                    className={`relative h-5 w-9 shrink-0 cursor-pointer rounded-full border transition-colors ${
                      urgent ? 'border-amber-500 bg-amber-500' : 'border-[#272D39] bg-[#0B0E14]'
                    }`}
                  >
                    <span
                      className={`absolute top-0.5 h-3.5 w-3.5 rounded-full bg-white transition-all ${
                        urgent ? 'left-4.5' : 'left-0.5'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
          <div className="h-3" />
        </div>

        {/* Footer */}
        <div className="grid shrink-0 grid-cols-2 items-center gap-2 border-t border-[#272D39] p-3.5 sm:flex sm:flex-wrap sm:justify-end sm:p-4">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-md border border-[#272D39] px-3.5 py-2 text-[11px] font-semibold text-white hover:bg-white/5 sm:py-1.5"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex cursor-pointer items-center justify-center gap-1.5 rounded-md bg-linear-to-r from-[#6C63FF] to-[#4DA3FF] px-4 py-2 text-[11px] font-semibold text-white hover:opacity-90 sm:py-1.5"
          >
            <Send className="h-3 w-3" /> Create Complaint
          </button>
        </div>
      </motion.form>
    </motion.div>,
    document.body,
  )
}