'use client'

import { useEffect, useRef, useState } from 'react'
import type { ElementType, ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  X, ReceiptText, Save, CalendarDays, ChevronDown, IndianRupee, User, Hash,
  UploadCloud, FileText,
} from 'lucide-react'

/* ---------- Config ---------- */

// TODO: fetch these lists from the API later
const EXPENSE_CATEGORIES = ['Maintenance', 'Electricity', 'Security', 'Housekeeping', 'Repairs', 'Other']
const PAYMENT_STATUSES = ['Paid', 'Pending', 'Partial']
const PAYMENT_METHODS = ['Cash', 'Cheque', 'Bank Transfer', 'UPI', 'Card']

// Data sent to the page when the drawer is saved
export type ExpenseEntryPayload = {
  id: number
  title: string
  category: string
  amount: number
  date: string // yyyy-mm-dd
  status: string
  paidTo: string
  method: string
  invoiceNo: string
  notes: string
  file: File | null
}

const noScrollbar =
  '[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden'

/* ---------- Helpers ---------- */

// Allow only digits and a single dot while typing an amount
const cleanAmount = (v: string) => {
  const cleaned = v.replace(/[^0-9.]/g, '')
  const [whole, ...rest] = cleaned.split('.')
  return rest.length ? `${whole}.${rest.join('')}` : whole
}

// Today as yyyy-mm-dd (local time)
const today = () => {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

// "2025-10-01" -> "01 Oct 2025"
const prettyDate = (v: string) =>
  v
    ? new Date(`${v}T00:00:00`).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : 'Select date'

// 1.5 MB / 320 KB
const prettySize = (bytes: number) =>
  bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`

/* ---------- Styles ---------- */
/* bg: #10131A | input bg: #0B0E14 | border: #272D39 | accent: #6C63FF / #A29CFF */

const inputCls = (icon = false, error = false) =>
  `w-full rounded-md border bg-[#0B0E14] py-2 text-[11px] text-white outline-none transition-colors placeholder:text-slate-500 focus:border-[#6C63FF] disabled:cursor-not-allowed disabled:opacity-40 ${
    error ? 'border-red-500/60' : 'border-[#272D39]'
  } ${icon ? 'pl-8 pr-2.5' : 'px-2.5'}`

/* ---------- Small reusable pieces ---------- */

function Field({
  label, error, className = '', children,
}: {
  label: string
  error?: string
  className?: string
  children: ReactNode
}) {
  return (
    <div className={`min-w-0 ${className}`}>
      <label className="mb-1 block text-[10px] text-slate-400">{label}</label>
      {children}
      {error && <p className="mt-1 text-[9px] text-red-400">{error}</p>}
    </div>
  )
}

// Input with an icon on the left
function IconInput({
  icon: Icon, value, onChange, placeholder, error, inputMode,
}: {
  icon: ElementType
  value: string
  onChange: (v: string) => void
  placeholder?: string
  error?: boolean
  inputMode?: 'decimal' | 'numeric' | 'text'
}) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-500" />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        className={inputCls(true, error)}
      />
    </div>
  )
}

// Select with an optional placeholder and a custom chevron
function SimpleSelect({
  value, onChange, options, placeholder, error,
}: {
  value: string
  onChange: (v: string) => void
  options: string[]
  placeholder?: string
  error?: boolean
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputCls(false, error)} cursor-pointer appearance-none truncate pr-7 ${value === '' ? 'text-slate-500' : ''}`}
      >
        {placeholder && (
          <option value="" disabled className="bg-[#10131A] text-slate-500">{placeholder}</option>
        )}
        {options.map((o) => (
          <option key={o} value={o} className="bg-[#10131A] text-white">{o}</option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-400" />
    </div>
  )
}

// Date field: shows "01 Oct 2025" while the real date picker sits invisibly on top
function DatePicker({
  value, onChange, error,
}: { value: string; onChange: (v: string) => void; error?: boolean }) {
  return (
    <div className="relative">
      <CalendarDays className="pointer-events-none absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-500" />
      <div className={`${inputCls(true, error)} truncate pr-7`}>{prettyDate(value)}</div>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-400" />
      <input
        type="date"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onClick={(e) => e.currentTarget.showPicker?.()}
        aria-label="Expense date"
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0 scheme-dark"
      />
    </div>
  )
}

// Bill / receipt upload (click or drag & drop)
function FileDrop({
  file, onChange, error,
}: {
  file: File | null
  onChange: (f: File | null) => void
  error?: string
}) {
  const ref = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)

  return (
    <Field label="Upload Bill / Receipt" error={error}>
      <input
        ref={ref}
        type="file"
        accept=".png,.jpg,.jpeg,.pdf"
        className="hidden"
        onChange={(e) => {
          onChange(e.target.files?.[0] ?? null)
          e.target.value = ''
        }}
      />

      {file ? (
        <div className="flex items-center gap-2.5 rounded-md border border-[#272D39] bg-[#0B0E14] p-2.5">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-[#6C63FF]/15">
            <FileText className="h-4 w-4 text-[#A29CFF]" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-[11px] font-semibold text-white">{file.name}</p>
            <p className="text-[10px] text-slate-400">{prettySize(file.size)}</p>
          </div>
          <button
            type="button"
            onClick={() => onChange(null)}
            aria-label="Remove file"
            className="cursor-pointer rounded-md p-1.5 text-slate-400 hover:bg-white/5 hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => ref.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragging(false)
            onChange(e.dataTransfer.files?.[0] ?? null)
          }}
          className={`flex w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed px-3 py-4 text-center transition-colors ${
            dragging
              ? 'border-[#6C63FF] bg-[#6C63FF]/10'
              : 'border-[#272D39] bg-[#0B0E14] hover:bg-white/3'
          }`}
        >
          <UploadCloud className="h-5 w-5 text-[#A29CFF]" />
          <span className="text-[11px] font-semibold text-slate-200">
            Click to upload <span className="font-normal text-slate-400">or drag and drop</span>
          </span>
          <span className="text-[9px] text-slate-500">PNG, JPG or PDF (Optional)</span>
        </button>
      )}
    </Field>
  )
}

/* ---------- Drawer ---------- */

export default function AddExpenseEntryModal({
  open, onClose, onSave,
}: {
  open: boolean
  onClose: () => void
  onSave?: (data: ExpenseEntryPayload) => void
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
  onSave?: (data: ExpenseEntryPayload) => void
}) {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(() => today())
  const [status, setStatus] = useState('')
  const [paidTo, setPaidTo] = useState('')
  const [method, setMethod] = useState('')
  const [invoiceNo, setInvoiceNo] = useState('')
  const [notes, setNotes] = useState('')
  const [file, setFile] = useState<File | null>(null)

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

  // Required: title, category, amount, date, payment status, paid to
  function validate() {
    const err: Record<string, string> = {}
    if (!title.trim()) err.title = 'Expense title is required'
    if (!category) err.category = 'Select a category'
    if (!(Number(amount) > 0)) err.amount = 'Enter a valid amount'
    if (!date) err.date = 'Select a date'
    if (!status) err.status = 'Select a payment status'
    if (!paidTo.trim()) err.paidTo = 'Vendor or recipient name is required'
    setErrors(err)
    return Object.keys(err).length === 0
  }

  function submit() {
    if (!validate()) return

    // TODO: call the API here (send as FormData because of the file)
    onSave?.({
      id: Date.now(),
      title: title.trim(),
      category,
      amount: Number(amount) || 0,
      date,
      status,
      paidTo: paidTo.trim(),
      method,
      invoiceNo: invoiceNo.trim(),
      notes: notes.trim(),
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
        noValidate
        onSubmit={(e) => {
          e.preventDefault()
          submit()
        }}
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
              <ReceiptText className="h-4 w-4 text-white" />
            </span>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-white">Add Expense</h2>
              <p className="text-[10px] text-slate-400">
                Record a new expense transaction for your society.
              </p>
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
        <div className={`mt-2 flex min-h-0 flex-1 flex-col gap-3.5 overflow-y-auto overscroll-contain border-t border-[#272D39] px-3.5 pb-4 pt-4 sm:px-4 ${noScrollbar}`}>
          {/* Expense title */}
          <Field label="Expense Title" error={errors.title}>
            <input
              value={title}
              onChange={(e) => { setTitle(e.target.value); clearErr('title') }}
              placeholder="e.g. Lift Maintenance Payment"
              className={inputCls(false, !!errors.title)}
            />
          </Field>

          {/* Category, amount, date, status, paid to, method */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Field label="Expense Category" error={errors.category}>
              <SimpleSelect
                value={category}
                onChange={(v) => { setCategory(v); clearErr('category') }}
                options={EXPENSE_CATEGORIES}
                placeholder="Select category"
                error={!!errors.category}
              />
            </Field>

            <Field label="Amount (₹)" error={errors.amount}>
              <IconInput
                icon={IndianRupee}
                value={amount}
                onChange={(v) => { setAmount(cleanAmount(v)); clearErr('amount') }}
                placeholder="Enter amount"
                inputMode="decimal"
                error={!!errors.amount}
              />
            </Field>

            <Field label="Expense Date" error={errors.date}>
              <DatePicker
                value={date}
                onChange={(v) => { setDate(v); clearErr('date') }}
                error={!!errors.date}
              />
            </Field>

            <Field label="Payment Status" error={errors.status}>
              <SimpleSelect
                value={status}
                onChange={(v) => { setStatus(v); clearErr('status') }}
                options={PAYMENT_STATUSES}
                placeholder="Select status"
                error={!!errors.status}
              />
            </Field>

            <Field label="Paid To / Vendor Name" error={errors.paidTo}>
              <IconInput
                icon={User}
                value={paidTo}
                onChange={(v) => { setPaidTo(v); clearErr('paidTo') }}
                placeholder="Enter vendor or recipient name"
                error={!!errors.paidTo}
              />
            </Field>

            <Field label="Payment Method">
              <SimpleSelect
                value={method}
                onChange={setMethod}
                options={PAYMENT_METHODS}
                placeholder="Select payment method"
              />
            </Field>
          </div>

          {/* Invoice number */}
          <Field label="Invoice / Bill Number">
            <IconInput
              icon={Hash}
              value={invoiceNo}
              onChange={setInvoiceNo}
              placeholder="Enter invoice number (optional)"
            />
          </Field>

          {/* Description / notes */}
          <Field label="Description / Notes">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Enter expense details..."
              className={`${inputCls()} resize-none`}
            />
          </Field>

          {/* Bill / receipt upload */}
          <FileDrop file={file} onChange={setFile} error={errors.file} />
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
            <Save className="h-3 w-3" /> Save Expense
          </button>
        </div>
      </motion.form>
    </motion.div>,
    document.body,
  )
}