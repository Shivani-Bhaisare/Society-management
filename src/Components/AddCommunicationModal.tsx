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
  Send, Save, Eye, Bold, Italic, Underline, List, ListOrdered, Link2, AlignLeft,
  AlignCenter, Eraser, Clock, Paperclip, Flag, Smartphone, Mail, MessageSquare,
  Radio, ClipboardList,
} from 'lucide-react'
import {
  communicationSchema,
  communicationDraftSchema,
} from '@/lib/validations/communication.schema'

/* ---------- Config ---------- */

// TODO: fetch these from the API later
const AUDIENCES = ['All Residents', 'Owners only', 'Tenants only', 'Committee members']
const PRIORITIES = ['Low', 'Normal', 'High', 'Urgent']

const CHANNELS = [
  { key: 'App', icon: Smartphone },
  { key: 'Email', icon: Mail },
  { key: 'SMS', icon: MessageSquare },
] as const

type Channel = (typeof CHANNELS)[number]['key']
type ScheduleMode = 'now' | 'later'

const TEMPLATES = [
  {
    name: 'Maintenance Work',
    subject: 'Maintenance Work - Block A',
    html: 'Dear Residents,<br><br>We will be carrying out maintenance work in Block A from 10:00 AM to 2:00 PM. During this time, there may be water supply disruption.<br><br>We regret the inconvenience caused.<br><br>Regards,<br>Society Management',
  },
  {
    name: 'Meeting Reminder',
    subject: 'Reminder: Society Meeting',
    html: 'Dear Residents,<br><br>This is a reminder about the upcoming society meeting. Your presence is requested.<br><br>Regards,<br>Society Management',
  },
  {
    name: 'Payment Reminder',
    subject: 'Maintenance Fee Reminder',
    html: 'Dear Residents,<br><br>Please clear your pending maintenance dues before the due date to avoid late charges.<br><br>Regards,<br>Society Management',
  },
]

const MAX_MSG = 2000

export type CommunicationPayload = {
  id: number
  subject: string
  audience: string
  message: string // HTML
  channels: Channel[]
  priority: string
  schedule: ScheduleMode
  date: string
  time: string
  files: File[]
  status: 'Draft' | 'Sent' | 'Scheduled'
}

const noScrollbar =
  '[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden'

const toISO = (d: Date) => d.toISOString().split('T')[0]
const nowTime = () =>
  new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })

/* ---------- Styles ---------- */
/* bg: #10131A | input bg: #0B0E14 | border: #272D39 | accent: #6C63FF / #A29CFF */

const inputCls = (icon = false, error = false) =>
  `w-full rounded-md border bg-[#0B0E14] py-2 text-[11px] text-white outline-none transition-colors placeholder:text-slate-500 focus:border-[#6C63FF] disabled:cursor-not-allowed disabled:opacity-40 ${
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

/* ---------- Drawer ---------- */

export default function AddCommunicationModal({
  open, onClose, onSave,
}: {
  open: boolean
  onClose: () => void
  onSave?: (data: CommunicationPayload) => void
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
  onSave?: (data: CommunicationPayload) => void
}) {
  const [subject, setSubject] = useState('')
  const [audience, setAudience] = useState('All Residents')
  const [msgHtml, setMsgHtml] = useState('')
  const [msgText, setMsgText] = useState('')
  const [channels, setChannels] = useState<Channel[]>(['App'])
  const [schedule, setSchedule] = useState<ScheduleMode>('now')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [priority, setPriority] = useState('Normal')
  const [files, setFiles] = useState<File[]>([])
  const [fileError, setFileError] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [showTemplates, setShowTemplates] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [sentAt] = useState(nowTime)

  const editorRef = useRef<HTMLDivElement>(null)
  const today = toISO(new Date())

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
  const syncMsg = () => {
    const el = editorRef.current
    if (!el) return
    let text = el.innerText.replace(/\n$/, '')
    if (text.length > MAX_MSG) {
      text = text.slice(0, MAX_MSG)
      el.innerText = text
    }
    setMsgText(text)
    setMsgHtml(el.innerHTML)
    clearErr('message')
  }
  const exec = (cmd: string, val?: string) => {
    editorRef.current?.focus()
    document.execCommand(cmd, false, val)
    syncMsg()
  }
  const addLink = () => {
    const url = window.prompt('Enter link URL (https://...)')
    if (url) exec('createLink', url)
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
    { icon: Eraser, label: 'Clear formatting', run: () => exec('removeFormat'), gap: true },
  ]

  /* Templates */
  function applyTemplate(t: (typeof TEMPLATES)[number]) {
    setSubject(t.subject)
    clearErr('subject')
    if (editorRef.current) editorRef.current.innerHTML = t.html
    syncMsg()
    setShowTemplates(false)
  }

  /* Channels (multi-select, at least one required) */
  const toggleChannel = (c: Channel) => {
    setChannels((prev) => {
      if (prev.includes(c)) return prev.length === 1 ? prev : prev.filter((x) => x !== c)
      return [...prev, c]
    })
    clearErr('channels')
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
      else bad = 'Only PDF, JPG, PNG files up to 10 MB are allowed'
    })
    setFileError(bad)
    if (valid.length) setFiles((p) => [...p, ...valid])
  }

  // Validation runs through communication.schema.ts
  function validate(asDraft: boolean) {
    const data = {
      subject,
      audience,
      priority,
      files,
      message: msgText, // plain text, not HTML
      channels,
      schedule,
      date,
      time,
    }
    const result = (asDraft ? communicationDraftSchema : communicationSchema).safeParse(data)
    const err: Record<string, string> = {}

    if (!result.success) {
      for (const issue of result.error.issues) {
        const key = String(issue.path[0])
        if (!err[key]) err[key] = issue.message
      }
    }

    setErrors(err)
    if (err.files) setFileError(err.files)
    return Object.keys(err).length === 0
  }

  function save(mode: 'draft' | 'send') {
    if (!validate(mode === 'draft')) return
    // TODO: call the API here
    onSave?.({
      id: Date.now(),
      subject: subject.trim(),
      audience,
      message: msgHtml,
      channels,
      priority,
      schedule,
      date,
      time,
      files,
      status: mode === 'draft' ? 'Draft' : schedule === 'later' ? 'Scheduled' : 'Sent',
    })
    onClose()
  }

  const ready = !!subject.trim() && !!msgText.trim() && channels.length > 0
  const channelText = channels.join(', ')
  const scheduleText =
    schedule === 'now'
      ? 'Send Now'
      : date && time
      ? `${new Date(date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}, ${time}`
      : 'Scheduled'

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
          save('send')
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
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-[#6C63FF] to-[#4DA3FF]">
              <Send className="h-4 w-4 text-white" />
            </span>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-white">New Communication</h2>
              <p className="text-[10px] text-slate-400">Send announcements and messages to residents</p>
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
            {/* Section 1: Message Details */}
            <SectionHead first icon={ClipboardList} title="Message Details" sub="Subject and audience" />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Subject" error={errors.subject}>
                <IconInput
                  icon={FileText}
                  value={subject}
                  onChange={(e) => { setSubject(e.target.value); clearErr('subject') }}
                  error={!!errors.subject}
                  placeholder="e.g. Maintenance work - Block A"
                />
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

            {/* Section 2: Message */}
            <SectionHead icon={FileText} title="Message" sub="Write the message for residents" />

            <div className="min-w-0">
              <div className="mb-1 flex items-center justify-between">
                <label className="block text-[10px] text-slate-400">Message</label>
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowTemplates((s) => !s)}
                    className="cursor-pointer text-[10px] font-medium text-[#A29CFF] hover:underline"
                  >
                    Use template
                  </button>
                  {showTemplates && (
                    <div className="absolute right-0 top-5 z-10 w-44 overflow-hidden rounded-md border border-[#272D39] bg-[#0B0E14] shadow-xl">
                      {TEMPLATES.map((t) => (
                        <button
                          key={t.name}
                          type="button"
                          onClick={() => applyTemplate(t)}
                          className="block w-full cursor-pointer px-3 py-2 text-left text-[10px] text-slate-200 hover:bg-white/5"
                        >
                          {t.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div
                className={`overflow-hidden rounded-md border bg-[#0B0E14] transition-colors focus-within:border-[#6C63FF] ${
                  errors.message ? 'border-red-500/60' : 'border-[#272D39]'
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
                  data-placeholder="Write your message here..."
                  onInput={syncMsg}
                  className={`min-h-28 max-h-48 overflow-y-auto px-2.5 py-2 text-[11px] text-white outline-none empty:before:text-slate-500 empty:before:content-[attr(data-placeholder)] [&_a]:text-[#A29CFF] [&_a]:underline [&_ol]:list-decimal [&_ol]:pl-4 [&_ul]:list-disc [&_ul]:pl-4 ${noScrollbar}`}
                />
              </div>
              {errors.message && <p className="mt-1 text-[9px] text-red-400">{errors.message}</p>}
              <p className="mt-1 text-right text-[9px] text-slate-500">
                {msgText.length}/{MAX_MSG}
              </p>
            </div>

            {/* Section 3: Delivery */}
            <SectionHead icon={Radio} title="Delivery" sub="Channel, schedule and priority" />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Channel" error={errors.channels}>
                <div className="grid grid-cols-3 gap-1.5">
                  {CHANNELS.map(({ key, icon: Icon }) => {
                    const active = channels.includes(key)
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => toggleChannel(key)}
                        className={`flex cursor-pointer items-center justify-center gap-1.5 rounded-md border py-2 text-[11px] transition-colors ${
                          active
                            ? 'border-transparent bg-linear-to-r from-[#6C63FF] to-[#4DA3FF] font-semibold text-white'
                            : 'border-[#272D39] bg-[#0B0E14] text-slate-300 hover:bg-white/5'
                        }`}
                      >
                        <Icon className="h-3 w-3" /> {key}
                      </button>
                    )
                  })}
                </div>
              </Field>

              <Field label="Schedule">
                <div className="grid grid-cols-2 gap-1 rounded-md border border-[#272D39] bg-[#0B0E14] p-0.5">
                  {([['now', 'Send Now'], ['later', 'Schedule for later']] as const).map(([k, label]) => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => { setSchedule(k); clearErr('date'); clearErr('time') }}
                      className={`cursor-pointer rounded py-1.5 text-[11px] transition-colors ${
                        schedule === k
                          ? 'bg-linear-to-r from-[#6C63FF] to-[#4DA3FF] font-semibold text-white'
                          : 'text-slate-400 hover:bg-white/5'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </Field>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Priority">
                <IconSelect
                  icon={Flag}
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  options={PRIORITIES}
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Date" error={errors.date}>
                  <div className="relative">
                    <CalendarDays className="pointer-events-none absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-500" />
                    <input
                      type="date"
                      min={today}
                      value={date}
                      disabled={schedule === 'now'}
                      onChange={(e) => { setDate(e.target.value); clearErr('date') }}
                      className={`${inputCls(true, !!errors.date)} scheme-dark ${date ? '' : 'text-slate-500'}`}
                    />
                  </div>
                </Field>
                <Field label="Time" error={errors.time}>
                  <div className="relative">
                    <Clock className="pointer-events-none absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-500" />
                    <input
                      type="time"
                      value={time}
                      disabled={schedule === 'now'}
                      onChange={(e) => { setTime(e.target.value); clearErr('time') }}
                      className={`${inputCls(true, !!errors.time)} scheme-dark ${time ? '' : 'text-slate-500'}`}
                    />
                  </div>
                </Field>
              </div>
            </div>

            {/* Section 4: Attachment & Status */}
            <SectionHead icon={Paperclip} title="Attachment & Status" sub="Attach files and check status" />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Attachment" hint="Optional" error={fileError}>
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
                  <span className="text-[10px] font-medium text-white">Drag and drop files here or click to upload</span>
                  <span className="text-[9px] text-slate-500">Supported formats: PDF, JPG, PNG (Max 10MB)</span>
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

              <Field label="Status Preview">
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-medium ${
                    !ready
                      ? 'bg-slate-500/15 text-slate-400'
                      : schedule === 'later'
                      ? 'bg-amber-500/15 text-amber-400'
                      : 'bg-emerald-500/15 text-emerald-400'
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      !ready ? 'bg-slate-400' : schedule === 'later' ? 'bg-amber-400' : 'bg-emerald-400'
                    }`}
                  />
                  {!ready ? 'Incomplete' : schedule === 'later' ? 'Scheduled' : 'Ready to send'}
                </span>
                <p className="mt-2 text-[9px] leading-relaxed text-slate-400">
                  This message will be {schedule === 'later' ? 'scheduled for' : 'sent to'} selected audience
                  using {channelText} channel{channels.length > 1 ? 's' : ''}.
                </p>
              </Field>
            </div>

            {/* Section 5: Message Preview */}
            <SectionHead icon={Eye} title="Message Preview" sub="This is how your message will appear to residents" />

            <div className="rounded-lg border border-[#272D39] bg-[#0B0E14] p-3">
              <div className="flex items-center gap-2.5 border-b border-[#272D39] pb-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#6C63FF]/25 text-[#A29CFF]">
                  <Megaphone className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold">SocietyOS</p>
                  <p className="truncate text-[9px] text-slate-400">Green Valley Residency</p>
                </div>
                <span className="shrink-0 text-[9px] text-slate-500">{sentAt}</span>
              </div>

              <p className="mt-2.5 break-words text-xs font-bold">{subject.trim() || 'Message Subject'}</p>
              <p className="mt-1.5 line-clamp-5 whitespace-pre-line break-words text-[10px] leading-relaxed text-slate-400">
                {msgText.trim() || 'Your message will appear here as you type it in the form.'}
              </p>
            </div>

            {/* Section 6: Delivery Summary */}
            <div className="mt-3 rounded-lg border border-[#272D39] bg-[#0B0E14] p-3">
              <p className="mb-2 text-[11px] font-bold">Delivery Summary</p>
              {[
                { icon: Users, label: 'Audience', value: audience },
                { icon: Smartphone, label: 'Channel', value: channelText },
                { icon: Flag, label: 'Priority', value: priority },
                { icon: Clock, label: 'Schedule', value: scheduleText },
              ].map(({ icon: Icon, label, value }, i) => (
                <div
                  key={label}
                  className={`flex items-center gap-2.5 py-2 ${i > 0 ? 'border-t border-[#272D39]' : ''}`}
                >
                  <Icon className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  <span className="shrink-0 text-[10px] text-slate-400">{label}</span>
                  <span className="min-w-0 flex-1 break-words text-right text-[10px] font-medium text-white">
                    {value}
                  </span>
                </div>
              ))}
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
            onClick={() => save('draft')}
            className="flex cursor-pointer items-center justify-center gap-1.5 rounded-md border border-[#272D39] px-3.5 py-2 text-[11px] font-semibold text-white hover:bg-white/5 sm:py-1.5"
          >
            <Save className="h-3 w-3" /> Save as Draft
          </button>
          <button
            type="submit"
            className="col-span-2 flex cursor-pointer items-center justify-center gap-1.5 rounded-md bg-linear-to-r from-[#6C63FF] to-[#4DA3FF] px-4 py-2 text-[11px] font-semibold text-white hover:opacity-90 sm:col-span-1 sm:py-1.5"
          >
            <Send className="h-3 w-3" /> Send Communication
          </button>
        </div>
      </motion.form>
    </motion.div>,
    document.body,
  )
}