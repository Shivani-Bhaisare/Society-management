'use client'

import { useEffect, useId, useRef, useState } from 'react'
import type {
  DragEvent,
  FormEvent,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
} from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  X, ChevronDown, Upload, UploadCloud, FileText, Trash2, CalendarDays, Folder, Eye,
  Bell, ClipboardList, Paperclip, Tag, Lock, type LucideIcon,
} from 'lucide-react'
import {
  documentSchema,
  validateDocumentFile,
  todayISO,
  CATEGORIES,
  VISIBILITY,
  ACCEPT,
  MAX_MB,
  MAX_DESC,
  MAX_TITLE,
} from '@/lib/validations/document.schema'

/* ---------- Config ---------- */

export type DocumentPayload = {
  id: number
  title: string
  category: string
  date: string
  visibility: string
  description: string
  notify: boolean
  file: File
}

const noScrollbar =
  '[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden'

const fmtSize = (bytes: number) =>
  bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`

// Icon colour based on the file type
const fileColor = (name: string) => {
  if (/\.pdf$/i.test(name)) return 'text-red-400 bg-red-500/15'
  if (/\.docx?$/i.test(name)) return 'text-blue-400 bg-blue-500/15'
  if (/\.xlsx?$/i.test(name)) return 'text-emerald-400 bg-emerald-500/15'
  return 'text-amber-400 bg-amber-500/15'
}

/* ---------- Styles ---------- */
/* bg: #10131A | input bg: #0B0E14 | border: #272D39 | accent: #6C63FF / #A29CFF */

const inputCls = (icon = false, error = false) =>
  `w-full rounded-md border bg-[#0B0E14] py-2 text-[11px] text-white outline-none transition-colors placeholder:text-slate-500 focus:border-[#6C63FF] ${
    error ? 'border-red-500/60' : 'border-[#272D39]'
  } ${icon ? 'pl-8 pr-2.5' : 'px-2.5'}`

function Field({
  label, hint, error, htmlFor, className = '', children,
}: {
  label: string
  hint?: string
  error?: string
  htmlFor?: string
  className?: string
  children: ReactNode
}) {
  return (
    <div className={`min-w-0 ${className}`}>
      <label htmlFor={htmlFor} className="mb-1 block text-[10px] text-slate-400">
        {label} {hint && <span className="text-slate-500">({hint})</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-[9px] text-red-400">{error}</p>}
    </div>
  )
}

function IconInput({
  icon: Icon, error, ...props
}: { icon: LucideIcon; error?: boolean } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-500" />
      <input {...props} aria-invalid={error || undefined} className={inputCls(true, error)} />
    </div>
  )
}

function IconSelect({
  icon: Icon, placeholder, options, error, ...props
}: {
  icon: LucideIcon
  placeholder?: string
  options: readonly string[]
  error?: boolean
} & SelectHTMLAttributes<HTMLSelectElement>) {
  const empty = !props.value
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-500" />
      <select
        {...props}
        aria-invalid={error || undefined}
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
}: { icon: LucideIcon; title: string; sub: string; first?: boolean }) {
  return (
    <div
      className={`mb-3 flex items-center gap-2.5 ${
        first ? '' : 'mt-5 border-t border-[#272D39] pt-4'
      }`}
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#6C63FF]/20 text-[#A29CFF]">
        <Icon className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="text-xs font-bold">{title}</h3>
        <p className="text-[9px] text-slate-400">{sub}</p>
      </div>
    </div>
  )
}

function Toggle({
  checked, onChange, label,
}: { checked: boolean; onChange: (v: boolean) => void; label?: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-5 w-9 shrink-0 cursor-pointer rounded-full border transition-colors ${
        checked ? 'border-[#6C63FF] bg-[#6C63FF]' : 'border-[#272D39] bg-[#0B0E14]'
      }`}
    >
      <span
        className={`absolute top-0.5 h-3.5 w-3.5 rounded-full bg-white transition-all ${
          checked ? 'left-4.5' : 'left-0.5'
        }`}
      />
    </button>
  )
}

/* ---------- Drawer ---------- */

export default function UploadDocumentModal({
  open, onClose, onSave,
}: {
  open: boolean
  onClose: () => void
  onSave?: (data: DocumentPayload) => void
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
  onSave?: (data: DocumentPayload) => void
}) {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [date, setDate] = useState(todayISO())
  const [visibility, setVisibility] = useState('All Residents')
  const [description, setDescription] = useState('')
  const [notify, setNotify] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Used to focus the first invalid field after a failed submit
  const bodyRef = useRef<HTMLDivElement>(null)

  // FIX: stops a double click from saving the document twice
  const submitted = useRef(false)

  // FIX: unique ids so every label is linked to its input
  const uid = useId()
  const id = (name: string) => `${uid}-${name}`

  const today = todayISO()

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

  /* File select / drop */
  function pickFile(list: FileList | null) {
    const f = list?.[0]
    if (!f) return
    const msg = validateDocumentFile(f)
    if (msg) {
      setErrors((p) => ({ ...p, file: msg }))
      return
    }
    setFile(f)
    clearErr('file')
    // If the title is empty, fill it with the file name
    if (!title.trim()) {
      setTitle(f.name.replace(/\.[^.]+$/, '').slice(0, MAX_TITLE))
      clearErr('title')
    }
  }

  // FIX: only turn the highlight off when the cursor really leaves the box
  // (moving over the icon or text inside it no longer makes it flicker)
  function onDragLeave(e: DragEvent<HTMLLabelElement>) {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
      setDragOver(false)
    }
  }

  // Validate with the zod schema
  function validate() {
    const err: Record<string, string> = {}

    if (!file) err.file = 'Please select a document to upload'

    const result = documentSchema.safeParse({
      title, category, date, visibility, description,
    })
    if (!result.success) {
      // Keep only the first message for every field
      for (const issue of result.error.issues) {
        const key = String(issue.path[0] ?? '')
        if (key && !err[key]) err[key] = issue.message
      }
    }

    setErrors(err)
    return Object.keys(err).length === 0
  }

  // Scroll to and focus the first invalid field
  function focusFirstError() {
    setTimeout(() => {
      const root = bodyRef.current
      const el =
        root?.querySelector<HTMLElement>('[aria-invalid="true"]') ??
        root?.querySelector<HTMLElement>('[data-file-error="true"]')
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el?.focus?.({ preventScroll: true })
    }, 50)
  }

  function submit(ev: FormEvent) {
    ev.preventDefault()
    if (submitted.current) return
    if (!validate() || !file) {
      focusFirstError()
      return
    }
    submitted.current = true
    // TODO: call the API here (send the file via FormData)
    onSave?.({
      id: Date.now(),
      title: title.trim(),
      category,
      date,
      visibility,
      description: description.trim(),
      notify,
      file,
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
              <Upload className="h-4 w-4 text-white" />
            </span>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-white">Upload Document</h2>
              <p className="text-[10px] text-slate-400">Add a document to the society&apos;s central storage</p>
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
        <div
          ref={bodyRef}
          className={`mt-2 min-h-0 flex-1 overflow-y-auto overscroll-contain px-3.5 text-white sm:px-4 ${noScrollbar}`}
        >
          <div className="rounded-xl border border-[#272D39] p-3.5">
            {/* Section 1: File */}
            <SectionHead first icon={Paperclip} title="Select File" sub="Choose the document you want to upload" />

            <Field label="Document File" error={errors.file}>
              {!file ? (
                <label
                  tabIndex={-1}
                  data-file-error={errors.file ? 'true' : undefined}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                  onDragLeave={onDragLeave}
                  onDrop={(e) => {
                    e.preventDefault()
                    setDragOver(false)
                    pickFile(e.dataTransfer.files)
                  }}
                  className={`flex cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed bg-[#0B0E14] px-3 py-6 text-center outline-none transition-colors hover:border-[#6C63FF] ${
                    dragOver ? 'border-[#6C63FF]' : errors.file ? 'border-red-500/60' : 'border-[#3A4152]'
                  }`}
                >
                  <UploadCloud className="h-5 w-5 text-[#A29CFF]" />
                  <span className="text-[10px] font-medium text-white">
                    Drag and drop a file here or <span className="text-[#4DA3FF]">browse</span>
                  </span>
                  <span className="text-[9px] text-slate-500">
                    PDF, DOC, DOCX, XLS, XLSX, JPG, PNG (Max {MAX_MB}MB)
                  </span>
                  <input
                    type="file"
                    accept={ACCEPT}
                    className="hidden"
                    onChange={(e) => {
                      pickFile(e.target.files)
                      e.target.value = ''
                    }}
                  />
                </label>
              ) : (
                <div className="flex items-center gap-2.5 rounded-md border border-[#272D39] bg-[#0B0E14] p-2.5">
                  <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${fileColor(file.name)}`}>
                    <FileText className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[11px] font-medium text-white">{file.name}</p>
                    <p className="text-[9px] text-slate-500">{fmtSize(file.size)}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFile(null)}
                    aria-label="Remove file"
                    className="cursor-pointer text-slate-400 hover:text-red-400"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}
            </Field>

            {/* Section 2: Document Details */}
            <SectionHead icon={ClipboardList} title="Document Details" sub="Title, category and date" />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Document Title" htmlFor={id('title')} error={errors.title} className="sm:col-span-2">
                <IconInput
                  id={id('title')}
                  icon={FileText}
                  value={title}
                  maxLength={MAX_TITLE}
                  onChange={(e) => { setTitle(e.target.value); clearErr('title') }}
                  error={!!errors.title}
                  placeholder="e.g. Society Registration Certificate"
                />
              </Field>

              <Field label="Category" htmlFor={id('category')} error={errors.category}>
                <IconSelect
                  id={id('category')}
                  icon={Folder}
                  value={category}
                  onChange={(e) => { setCategory(e.target.value); clearErr('category') }}
                  error={!!errors.category}
                  placeholder="Select category"
                  options={CATEGORIES}
                />
              </Field>

              <Field label="Document Date" htmlFor={id('date')} error={errors.date}>
                <div className="relative">
                  <CalendarDays className="pointer-events-none absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-500" />
                  <input
                    id={id('date')}
                    type="date"
                    value={date}
                    max={today}
                    onChange={(e) => { setDate(e.target.value); clearErr('date') }}
                    aria-invalid={!!errors.date || undefined}
                    className={`${inputCls(true, !!errors.date)} scheme-dark ${date ? '' : 'text-slate-500'}`}
                  />
                </div>
              </Field>
            </div>

            <div className="mt-3">
              <Field label="Description" hint="Optional" htmlFor={id('desc')} error={errors.description}>
                <div className="relative">
                  <Tag className="pointer-events-none absolute left-2.5 top-2.5 h-3 w-3 text-slate-500" />
                  <textarea
                    id={id('desc')}
                    rows={3}
                    maxLength={MAX_DESC}
                    value={description}
                    onChange={(e) => { setDescription(e.target.value); clearErr('description') }}
                    aria-invalid={!!errors.description || undefined}
                    placeholder="Add a short note about this document..."
                    className={`${inputCls(true, !!errors.description)} resize-none ${noScrollbar}`}
                  />
                </div>
                <p className="mt-1 text-right text-[9px] text-slate-500">
                  {description.length}/{MAX_DESC}
                </p>
              </Field>
            </div>

            {/* Section 3: Access */}
            <SectionHead icon={Lock} title="Access & Notification" sub="Who can view this document" />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Visibility" htmlFor={id('visibility')} error={errors.visibility}>
                <IconSelect
                  id={id('visibility')}
                  icon={Eye}
                  value={visibility}
                  onChange={(e) => { setVisibility(e.target.value); clearErr('visibility') }}
                  error={!!errors.visibility}
                  options={VISIBILITY}
                />
              </Field>
            </div>

            <div className="mt-3 flex items-start justify-between gap-3 rounded-md border border-[#272D39] bg-[#0B0E14] p-2.5">
              <div className="flex min-w-0 items-start gap-2.5">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#6C63FF]/20 text-[#A29CFF]">
                  <Bell className="h-3.5 w-3.5" />
                </span>
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-white">Notify residents</p>
                  <p className="mt-0.5 text-[9px] text-slate-400">
                    Send a notification when this document is uploaded
                  </p>
                </div>
              </div>
              <Toggle checked={notify} onChange={setNotify} label="Notify residents" />
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
            <Upload className="h-3 w-3" /> Upload Document
          </button>
        </div>
      </motion.form>
    </motion.div>,
    document.body,
  )
}