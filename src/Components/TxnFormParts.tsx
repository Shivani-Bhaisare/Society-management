'use client'

import { useEffect, useRef } from 'react'
import type { ChangeEvent, ElementType, InputHTMLAttributes, ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { motion } from 'framer-motion'
import {
  X, Plus, ChevronDown, CalendarDays, IndianRupee, UploadCloud, Paperclip,
} from 'lucide-react'

/* ---------- Helpers ---------- */

// Today as yyyy-mm-dd (local time)
export const today = () => {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

// "2026-10-27" -> "27/10/2026"
export const toDMY = (v: string) => {
  if (!v) return ''
  const [y, m, d] = v.split('-')
  return `${d}/${m}/${y}`
}

// Allow only digits and a single dot while typing an amount
export const cleanAmount = (v: string) => {
  const cleaned = v.replace(/[^0-9.]/g, '')
  const [whole, ...rest] = cleaned.split('.')
  return rest.length ? `${whole}.${rest.join('')}` : whole
}

const MAX_FILE_MB = 10
const ALLOWED_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/png']

/* ---------- Styles ---------- */
/* bg: #10131A | input bg: #0B0E14 | border: #272D39 | accent: #6C63FF / #4DA3FF */

// Shared input style. leftIcon / rightIcon add padding so text never touches the icon.
export const inputCls = (error = false, leftIcon = false, rightIcon = false) =>
  `w-full rounded-lg border bg-[#0B0E14] py-2.5 text-xs text-white outline-none transition-colors placeholder:text-slate-500 focus:border-[#6C63FF] ${
    error ? 'border-red-500/60' : 'border-[#272D39]'
  } ${leftIcon ? 'pl-9' : 'pl-3'} ${rightIcon ? 'pr-9' : 'pr-3'}`

const noScrollbar =
  '[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden'

/* ---------- Form pieces ---------- */

// Label + control + error text
export function Field({
  label, error, className = '', children,
}: {
  label: string
  error?: string
  className?: string
  children: ReactNode
}) {
  return (
    <div className={`min-w-0 ${className}`}>
      <label className="mb-1.5 block text-[11px] font-medium text-slate-200">{label}</label>
      {children}
      {error && <p className="mt-1 text-[10px] text-red-400">{error}</p>}
    </div>
  )
}

// Text input with an icon on the left
export function IconInput({
  icon: Icon, error, ...props
}: { icon: ElementType; error?: boolean } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
      <input {...props} className={inputCls(error, true, false)} />
    </div>
  )
}

// Amount input with the rupee icon on the right
export function AmountInput({
  error, ...props
}: { error?: boolean } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="relative">
      <input {...props} inputMode="decimal" className={inputCls(error, false, true)} />
      <IndianRupee className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
    </div>
  )
}

// Select with a placeholder and a custom chevron on the right
export function SelectInput({
  value, onChange, options, placeholder, error,
}: {
  value: string
  onChange: (v: string) => void
  options: string[]
  placeholder: string
  error?: boolean
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputCls(error, false, true)} cursor-pointer appearance-none truncate ${
          value === '' ? 'text-slate-500' : ''
        }`}
      >
        <option value="" disabled className="bg-[#10131A] text-slate-500">{placeholder}</option>
        {options.map((o) => (
          <option key={o} value={o} className="bg-[#10131A] text-white">{o}</option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-300" />
    </div>
  )
}

// Date field: shows DD/MM/YYYY while the real date picker sits invisibly on top
export function DateInput({
  value, onChange, error,
}: { value: string; onChange: (v: string) => void; error?: boolean }) {
  return (
    <div className="relative">
      <div className={`${inputCls(error, false, true)} truncate ${value ? 'text-white' : 'text-slate-500'}`}>
        {value ? toDMY(value) : 'DD/MM/YYYY'}
      </div>
      <CalendarDays className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-300" />
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onClick={(e) => e.currentTarget.showPicker?.()}
        aria-label="Select date"
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0 scheme-dark"
      />
    </div>
  )
}

// Multi-line notes box
export function NotesArea({
  value, onChange, placeholder, rows = 4,
}: { value: string; onChange: (v: string) => void; placeholder: string; rows?: number }) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={rows}
      placeholder={placeholder}
      className={`${inputCls()} resize-y`}
    />
  )
}

// Optional file upload box (PNG, JPG or PDF)
export function FileDrop({
  file, onChange, error, onError, title, hint,
}: {
  file: File | null
  onChange: (f: File | null) => void
  error?: string
  onError: (msg: string) => void
  title: string
  hint: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)

  const onPick = (e: ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    e.target.value = ''
    if (!f) return
    if (!ALLOWED_FILE_TYPES.includes(f.type)) return onError('Only PNG, JPG and PDF files are allowed')
    if (f.size > MAX_FILE_MB * 1024 * 1024) return onError(`File must be under ${MAX_FILE_MB}MB`)
    onError('')
    onChange(f)
  }

  return (
    <div>
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            inputRef.current?.click()
          }
        }}
        className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-[#6C63FF]/60 bg-[#0B0E14] px-3.5 py-3 transition-colors hover:bg-white/3"
      >
        <Paperclip className="h-5 w-5 shrink-0 text-[#8B85FF]" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold text-white">{file ? file.name : title}</p>
          <p className="truncate text-[10px] text-slate-400">{file ? 'Click to replace the file' : hint}</p>
        </div>
        {file ? (
          <button
            type="button"
            aria-label="Remove file"
            onClick={(e) => {
              e.stopPropagation()
              onChange(null)
            }}
            className="cursor-pointer rounded p-1 text-slate-400 hover:bg-white/5 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        ) : (
          <UploadCloud className="h-5 w-5 shrink-0 text-[#4DA3FF]" />
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept=".png,.jpg,.jpeg,.pdf"
        onChange={onPick}
        className="hidden"
      />
      {error && <p className="mt-1 text-[10px] text-red-400">{error}</p>}
    </div>
  )
}

/* ---------- Modal shell (overlay + header + scroll body + footer) ---------- */

export function ModalShell({
  title, subtitle, icon: Icon, tone, saveLabel, onClose, onSubmit, children,
}: {
  title: string
  subtitle: string
  icon: ElementType
  tone: string // hex colour of the round header icon
  saveLabel: string
  onClose: () => void
  onSubmit: () => void
  children: ReactNode
}) {
  // Lock background page scroll while the modal is open + close on Esc
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

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
      className="fixed inset-0 z-100 flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm sm:p-5"
    >
      <motion.form
        noValidate
        onSubmit={(e) => {
          e.preventDefault()
          onSubmit()
        }}
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.97 }}
        transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-full w-full max-w-xl flex-col overflow-hidden rounded-2xl border border-[#272D39] bg-[#10131A] text-white shadow-2xl"
      >
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[#272D39] p-4 sm:p-5">
          <div className="flex min-w-0 items-center gap-3">
            <span
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border sm:h-12 sm:w-12"
              style={{ background: `${tone}33`, borderColor: `${tone}66`, color: tone }}
            >
              <Icon className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h2 className="text-lg font-bold text-white sm:text-xl">{title}</h2>
              <p className="text-[11px] text-slate-400 sm:text-xs">{subtitle}</p>
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

        {/* Scrollable body */}
        <div className={`flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain p-4 sm:p-5 ${noScrollbar}`}>
          {children}
        </div>

        {/* Footer: two equal buttons on mobile, right aligned on bigger screens */}
        <div className="grid shrink-0 grid-cols-2 items-center gap-2.5 p-4 pt-1 sm:flex sm:justify-end sm:p-5 sm:pt-2">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg border border-[#272D39] px-5 py-2.5 text-xs font-semibold text-white hover:bg-white/5"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-linear-to-r from-[#6C63FF] to-[#4DA3FF] px-5 py-2.5 text-xs font-semibold text-white hover:opacity-90"
          >
            <Plus className="h-3.5 w-3.5" /> {saveLabel}
          </button>
        </div>
      </motion.form>
    </motion.div>,
    document.body,
  )
}