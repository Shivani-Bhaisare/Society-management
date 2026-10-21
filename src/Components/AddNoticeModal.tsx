'use client'

import { useEffect, useRef, useState } from 'react'
import type {
  ElementType,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
} from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  X, FileText, CalendarDays, ChevronDown, Megaphone, Users, UploadCloud, Trash2,
  Send, Eye, Bold, Italic, Underline, List, ListOrdered, Link2, AlignLeft,
  AlignCenter, Clock, Paperclip, Flag, ClipboardList,
} from 'lucide-react'
import { noticeSchema, noticeDraftSchema } from '@/lib/validations/notice.schema'

/* ---------- Config ---------- */

// TODO: fetch these from the API later
const NOTICE_TYPES = ['General', 'Maintenance', 'Event', 'Emergency', 'Meeting', 'Payment']
const AUDIENCES = ['All Residents', 'Owners only', 'Tenants only', 'Committee members']
const STATUSES = ['Draft', 'Published']
const PRIORITIES = ['Low', 'Medium', 'High'] as const

const MAX_DESC = 2000

type Priority = (typeof PRIORITIES)[number]

export type NoticePayload = {
  id: number
  title: string
  type: string
  priority: Priority
  audience: string
  publishDate: string
  expiryDate: string
  description: string 
  status: string
  file: File | null
}

const noScrollbar =
  '[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden'

const toISO = (d: Date) => d.toISOString().split('T')[0]
const addDays = (n: number) => {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return toISO(d)
}
const fmt = (iso: string) =>
  iso
    ? new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : '--'

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

function DateInput({
  error, value, ...props
}: { error?: boolean } & InputHTMLAttributes<HTMLInputElement>) {
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

/* ---------- Drawer ---------- */

export default function AddNoticeModal({
  open, onClose, onSave,
}: {
  open: boolean
  onClose: () => void
  onSave?: (data: NoticePayload) => void
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
  onSave?: (data: NoticePayload) => void
}) {
  const [title, setTitle] = useState('')
  const [type, setType] = useState('General')
  const [priority, setPriority] = useState<Priority>('Medium')
  const [audience, setAudience] = useState('All Residents')
  const [publishDate, setPublishDate] = useState(toISO(new Date()))
  const [expiryDate, setExpiryDate] = useState(addDays(7))
  const [status, setStatus] = useState('Draft')
  const [descHtml, setDescHtml] = useState('')
  const [descText, setDescText] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const editorRef = useRef<HTMLDivElement>(null)

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

  /* Rich text toolbar */
  const exec = (cmd: string, val?: string) => {
    editorRef.current?.focus()
    document.execCommand(cmd, false, val)
    syncDesc()
  }
  const addLink = () => {
    const url = window.prompt('Enter link URL (https://...)')
    if (url) exec('createLink', url)
  }
  const syncDesc = () => {
    const el = editorRef.current
    if (!el) return
    let text = el.innerText.replace(/\n$/, '')
    if (text.length > MAX_DESC) {
      text = text.slice(0, MAX_DESC)
      el.innerText = text
    }
    setDescText(text)
    setDescHtml(el.innerHTML)
    clearErr('description')
  }

  const tools: { icon: ElementType; label: string; run: () => void; gap?: boolean }[] = [
    { icon: Bold, label: 'Bold', run: () => exec('bold') },
    { icon: Italic, label: 'Italic', run: () => exec('italic') },
    { icon: Underline, label: 'Underline', run: () => exec('underline') },
    { icon: List, label: 'Bullet list', run: () => exec('insertUnorderedList'), gap: true },
    { icon: ListOrdered, label: 'Numbered list', run: () => exec('insertOrderedList') },
    { icon: Link2, label: 'Link', run: addLink },
    { icon: AlignLeft, label: 'Align left', run: () => exec('justifyLeft'), gap: true },
    { icon: AlignCenter, label: 'Align center', run: () => exec('justifyCenter') },
  ]

  /* Attachment */
  function pickFile(list: FileList | null) {
    const f = list?.[0]
    if (!f) return
    const okType = /\.(pdf|jpe?g|png)$/i.test(f.name)
    const okSize = f.size <= 10 * 1024 * 1024
    if (okType && okSize) {
      setFile(f)
      setFileError('')
    } else {
      setFileError('Only PDF, JPG, PNG files up to 10 MB are allowed')
    }
  }

  // Validation runs through notice.schema.ts
  function validate(asDraft: boolean) {
    const data = {
      title,
      type,
      priority,
      audience,
      file,
      publishDate,
      expiryDate,
      description: descText, // plain text, not HTML
    }
    const result = (asDraft ? noticeDraftSchema : noticeSchema).safeParse(data)
    const err: Record<string, string> = {}

    if (!result.success) {
      for (const issue of result.error.issues) {
        const key = String(issue.path[0])
        if (!err[key]) err[key] = issue.message
      }
    }

    setErrors(err)
    if (err.file) setFileError(err.file)
    return Object.keys(err).length === 0
  }

  function save(finalStatus: 'Draft' | 'Published') {
    if (!validate(finalStatus === 'Draft')) return
    // TODO: call the API here
    onSave?.({
      id: Date.now(),
      title: title.trim(),
      type,
      priority,
      audience,
      publishDate,
      expiryDate,
      description: descHtml,
      status: finalStatus,
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
        onSubmit={(e) => {
          e.preventDefault()
          save(status === 'Published' ? 'Published' : 'Draft')
        }}
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
          <div className="flex items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-[#6C63FF] to-[#4DA3FF]">
              <Megaphone className="h-4 w-4 text-white" />
            </span>
            <div>
              <h2 className="text-sm font-bold text-white">Create Notice</h2>
              <p className="text-[10px] text-slate-400">Share important updates with residents</p>
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
            {/* Section 1: Notice Details */}
            <SectionHead first icon={ClipboardList} title="Notice Details" sub="Title, type, priority and audience" />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Notice Title" error={errors.title}>
                <IconInput
                  icon={FileText}
                  value={title}
                  onChange={(e) => { setTitle(e.target.value); clearErr('title') }}
                  error={!!errors.title}
                  placeholder="e.g. Water supply maintenance"
                />
              </Field>

              <Field label="Notice Type">
                <IconSelect
                  icon={FileText}
                  value={type}
                  onChange={(e) => setType(e.target.value)}
                  options={NOTICE_TYPES}
                />
              </Field>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Priority">
                <div className="grid grid-cols-3 gap-1 rounded-md border border-[#272D39] bg-[#0B0E14] p-0.5">
                  {PRIORITIES.map((p) => (
                    <button
                      key={p}
                      type="button"
                      onClick={() => setPriority(p)}
                      className={`cursor-pointer rounded py-1.5 text-[11px] transition-colors ${
                        priority === p
                          ? 'bg-linear-to-r from-[#6C63FF] to-[#4DA3FF] font-semibold text-white'
                          : 'text-slate-400 hover:bg-white/5'
                      }`}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="Audience">
                <IconSelect
                  icon={Users}
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  options={AUDIENCES}
                />
              </Field>
            </div>

            {/* Section 2: Schedule */}
            <SectionHead icon={CalendarDays} title="Schedule" sub="Publish and expiry dates" />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Publish Date" error={errors.publishDate}>
                <DateInput
                  value={publishDate}
                  onChange={(e) => {
                    setPublishDate(e.target.value)
                    clearErr('publishDate')
                    if (expiryDate && expiryDate < e.target.value) setExpiryDate('')
                  }}
                  error={!!errors.publishDate}
                />
              </Field>

              <Field label="Expiry Date" error={errors.expiryDate}>
                <DateInput
                  value={expiryDate}
                  min={publishDate || undefined}
                  onChange={(e) => { setExpiryDate(e.target.value); clearErr('expiryDate') }}
                  error={!!errors.expiryDate}
                />
              </Field>
            </div>

            {/* Section 3: Content */}
            <SectionHead icon={FileText} title="Notice Content" sub="Write the notice details" />

            <Field label="Notice Description" error={errors.description}>
              <div
                className={`overflow-hidden rounded-md border bg-[#0B0E14] transition-colors focus-within:border-[#6C63FF] ${
                  errors.description ? 'border-red-500/60' : 'border-[#272D39]'
                }`}
              >
                {/* Toolbar */}
                <div className="flex flex-wrap items-center gap-0.5 border-b border-[#272D39] p-1">
                  {tools.map(({ icon: Icon, label, run, gap }) => (
                    <span key={label} className={`flex items-center ${gap ? 'ml-1 border-l border-[#272D39] pl-1' : ''}`}>
                      <button
                        type="button"
                        title={label}
                        aria-label={label}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={run}
                        className="cursor-pointer rounded p-1.5 text-slate-300 hover:bg-white/5 hover:text-white"
                      >
                        <Icon className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                </div>

                {/* Editor */}
                <div
                  ref={editorRef}
                  contentEditable
                  suppressContentEditableWarning
                  role="textbox"
                  aria-multiline="true"
                  data-placeholder="Write the notice details and instructions for residents..."
                  onInput={syncDesc}
                  className={`min-h-24 max-h-48 overflow-y-auto px-2.5 py-2 text-[11px] text-white outline-none empty:before:text-slate-500 empty:before:content-[attr(data-placeholder)] [&_a]:text-[#A29CFF] [&_a]:underline [&_ol]:list-decimal [&_ol]:pl-4 [&_ul]:list-disc [&_ul]:pl-4 ${noScrollbar}`}
                />
              </div>
              <p className="mt-1 text-right text-[9px] text-slate-500">
                {descText.length}/{MAX_DESC}
              </p>
            </Field>

            {/* Section 4: Attachment & Status */}
            <SectionHead icon={Paperclip} title="Attachment & Status" sub="Attach a file and set publish status" />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Attachment" hint="Optional" error={fileError}>
                {!file ? (
                  <label className="flex cursor-pointer items-center gap-2.5 rounded-md border border-dashed border-[#3A4152] bg-[#0B0E14] px-3 py-3 transition-colors hover:border-[#6C63FF]">
                    <UploadCloud className="h-5 w-5 shrink-0 text-[#A29CFF]" />
                    <span className="min-w-0">
                      <span className="block text-[10px] font-medium text-white">Attach PDF or image</span>
                      <span className="block text-[10px] font-medium text-[#A29CFF]">Browse files</span>
                    </span>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={(e) => {
                        pickFile(e.target.files)
                        e.target.value = ''
                      }}
                    />
                  </label>
                ) : (
                  <div className="flex items-center gap-2 rounded-md border border-[#272D39] bg-[#0B0E14] px-2.5 py-2.5">
                    <FileText className="h-3 w-3 shrink-0 text-red-400" />
                    <span className="min-w-0 flex-1 truncate text-[10px] text-white">{file.name}</span>
                    <span className="shrink-0 text-[9px] text-slate-500">
                      {(file.size / (1024 * 1024)).toFixed(1)} MB
                    </span>
                    <button
                      type="button"
                      onClick={() => setFile(null)}
                      aria-label="Remove file"
                      className="cursor-pointer text-slate-400 hover:text-red-400"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                )}
                <p className="mt-1 text-[9px] text-slate-500">Supported formats: PDF, JPG, PNG (Max 10MB)</p>
              </Field>

              <Field label="Publish Status">
                <IconSelect
                  icon={Send}
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  options={STATUSES}
                />
              </Field>
            </div>

            {/* Section 5: Resident Preview */}
            <SectionHead icon={Eye} title="Resident Preview" sub="This is how the notice will appear to residents" />

            <div className="rounded-lg border border-[#272D39] bg-[#0B0E14] p-3">
              <div className="flex items-start gap-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#6C63FF]/25 text-[#A29CFF]">
                  <Megaphone className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold">{title.trim() || 'Notice Title'}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <span className="rounded-full bg-[#6C63FF]/20 px-2 py-0.5 text-[9px] font-medium text-[#A29CFF]">
                      {type}
                    </span>
                    <span
                      className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-medium ${
                        priority === 'High'
                          ? 'bg-red-500/15 text-red-400'
                          : priority === 'Medium'
                          ? 'bg-amber-500/15 text-amber-400'
                          : 'bg-emerald-500/15 text-emerald-400'
                      }`}
                    >
                      <Flag className="h-2 w-2" /> {priority}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-3 border-y border-[#272D39] py-2.5 min-[400px]:grid-cols-2">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-3.5 w-3.5 text-slate-400" />
                  <div>
                    <p className="text-[10px] font-medium">{fmt(publishDate)}</p>
                    <p className="text-[9px] text-slate-500">Published On</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                  <div>
                    <p className="text-[10px] font-medium">{fmt(expiryDate)}</p>
                    <p className="text-[9px] text-slate-500">Expires On</p>
                  </div>
                </div>
              </div>

              <p className="mt-2.5 line-clamp-3 whitespace-pre-line text-[10px] leading-relaxed text-slate-400">
                {descText.trim() ||
                  'This is a preview of your notice. The actual content will appear here as you enter the details in the form.'}
              </p>
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
            type="button"
            onClick={() => save('Draft')}
            className="cursor-pointer rounded-md border border-[#272D39] px-3.5 py-2 text-[11px] font-semibold text-white hover:bg-white/5 sm:py-1.5"
          >
            Save as Draft
          </button>
          <button
            type="button"
            onClick={() => save('Published')}
            className="col-span-2 flex cursor-pointer items-center justify-center gap-1.5 rounded-md bg-linear-to-r from-[#6C63FF] to-[#4DA3FF] px-4 py-2 text-[11px] font-semibold text-white hover:opacity-90 sm:col-span-1 sm:py-1.5"
          >
            <Send className="h-3 w-3" /> Publish Notice
          </button>
        </div>
      </motion.form>
    </motion.div>,
    document.body,
  )
}