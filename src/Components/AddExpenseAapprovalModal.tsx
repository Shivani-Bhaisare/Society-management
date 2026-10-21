'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  X, FileText, CalendarDays, ChevronDown, UploadCloud, Trash2, Tag, User,
  CreditCard, Hash, IndianRupee, Wallet, Paperclip, Send, ClipboardList,
  Clock, Eye, Receipt, ShieldCheck,
} from 'lucide-react'
import { expenseSchema } from '@/lib/validations/expenseApproval.schema' // ADDED: validation rules
import { getErrors } from '@/lib/validations/validate' // ADDED: converts rule errors to { field: message }

/* ---------- Config ---------- */

// TODO: load from API later
const DEFAULT_CATEGORIES = [
  'Maintenance', 'General', 'Utilities', 'Security', 'Housekeeping', 'Repairs', 'Other',
]

const PAYMENT_METHODS = ['Cash', 'UPI', 'Bank Transfer', 'Cheque', 'Card']
const PAYMENT_STATUSES = ['Unpaid', 'Paid', 'Partially Paid']

// All text fields of the form (every field is a string)
type Vals = {
  title: string
  category: string
  vendor: string
  expenseDate: string
  amount: string
  paymentMethod: string
  paymentStatus: string
  invoiceNo: string
  description: string
}

// Returns today's date as YYYY-MM-DD (local time) for the default expense date
const today = () => {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

const INITIAL: Vals = {
  title: '', category: '', vendor: '', expenseDate: today(),
  amount: '', paymentMethod: '', paymentStatus: 'Unpaid', invoiceNo: '',
  description: '',
}

// Data received on save (id, status, flags and files are not plain strings, so they are added separately)
export type ExpensePayload = Vals & {
  id: number
  amountValue: number
  requireApproval: boolean
  status: 'pending' | 'approved'
  files: File[]
}

// Hide the scrollbar (content still scrolls)
const noScrollbar =
  '[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden'

// Format a number as Indian rupees, e.g. 1,45,000.00
const money = (n: number) =>
  n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

// Format YYYY-MM-DD as "03 Oct 2026"
const prettyDate = (s: string) =>
  s
    ? new Date(s + 'T00:00:00').toLocaleDateString('en-GB', {
        day: '2-digit', month: 'short', year: 'numeric',
      })
    : '-'

/* ---------- Styles ---------- */
/* bg: #10131A | input bg: #0B0E14 | border: #272D39 | accent: #6C63FF / #A29CFF */

const inputCls = (icon = false, error = false) =>
  `w-full rounded-md border bg-[#0B0E14] py-2 text-[11px] text-white outline-none transition-colors placeholder:text-slate-500 focus:border-[#6C63FF] ${
    error ? 'border-red-500/60' : 'border-[#272D39]'
  } ${icon ? 'pl-8 pr-2.5' : 'px-2.5'}`

function Field({
  label, required = false, error, className = '', children,
}: {
  label: string
  required?: boolean
  error?: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={`min-w-0 ${className}`}>
      <label className="mb-1 block text-[10px] text-slate-400">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-[9px] text-red-400">{error}</p>}
    </div>
  )
}

function SectionHeader({
  icon: Icon, title, subtitle, divider = false,
}: {
  icon: React.ElementType
  title: string
  subtitle: string
  divider?: boolean
}) {
  return (
    <div
      className={`mb-3 flex items-center gap-2.5 ${
        divider ? 'mt-5 border-t border-[#272D39] pt-4' : ''
      }`}
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#6C63FF]/20 text-[#A29CFF]">
        <Icon className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0">
        <h3 className="text-xs font-bold">{title}</h3>
        <p className="text-[9px] text-slate-400">{subtitle}</p>
      </div>
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

export default function AddExpenseModal({
  open, onClose, onSave, categories = DEFAULT_CATEGORIES,
}: {
  open: boolean
  onClose: () => void
  onSave?: (data: ExpensePayload) => void
  categories?: string[]
}) {
  return (
    <AnimatePresence>
      {open && <Body onClose={onClose} onSave={onSave} categories={categories} />}
    </AnimatePresence>
  )
}

function Body({
  onClose, onSave, categories,
}: {
  onClose: () => void
  onSave?: (data: ExpensePayload) => void
  categories: string[]
}) {
  const [v, setV] = useState<Vals>(INITIAL)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [files, setFiles] = useState<File[]>([])
  const [fileError, setFileError] = useState('')
  const [approval, setApproval] = useState(true)

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

  // Amount field: allow only digits and a single decimal point (max 2 decimals)
  const onAmount = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    if (!/^\d*\.?\d{0,2}$/.test(val)) return
    setV((p) => ({ ...p, amount: val }))
    setErrors((p) => ({ ...p, amount: '' }))
  }

  // Validate and add the selected files (PDF / JPG / PNG, max 10 MB each)
  function addFiles(list: FileList | null) {
    if (!list) return
    const valid: File[] = []
    let bad = ''
    Array.from(list).forEach((f) => {
      const okType = /\.(pdf|jpg|jpeg|png)$/i.test(f.name)
      const okSize = f.size <= 10 * 1024 * 1024
      if (okType && okSize) valid.push(f)
      else bad = 'Only PDF, JPG, PNG files up to 10 MB are allowed'
    })
    setFileError(bad)
    if (valid.length) setFiles((p) => [...p, ...valid])
  }

  // CHANGED: full validation for "Submit for Approval" (rules live in lib/validations/expense.schema.ts)
  // The file check stays here because zod does not handle File objects in this setup
  function validate() {
    const err = getErrors(expenseSchema, v)
    setErrors(err)
    if (files.length === 0) {
      setFileError('Please upload an invoice or receipt')
      return false
    }
    return Object.keys(err).length === 0
  }

  function submit(ev: React.FormEvent) {
    ev.preventDefault()
    if (!validate()) return
    // TODO: call the API here
    onSave?.({
      ...v,
      id: Date.now(),
      amountValue: parseFloat(v.amount) || 0,
      requireApproval: approval,
      status: approval ? 'pending' : 'approved',
      files,
    })
    onClose()
  }

  // Values shown in the preview / summary cards
  const statusLabel = approval ? 'Pending' : 'Approved'
  const statusBadge = approval
    ? 'border-amber-500/40 bg-amber-500/10 text-amber-400'
    : 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'

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
        className="flex h-full w-full max-w-full flex-col overflow-hidden rounded-l-2xl border border-r-0 border-[#272D39] bg-[#10131A] text-white shadow-2xl sm:max-w-150"
      >
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between gap-3 p-3 pb-2 sm:p-4 sm:pb-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-[#6C63FF] to-[#4DA3FF]">
              <FileText className="h-4 w-4 text-white" />
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-sm font-bold text-white">Add New Expense</h2>
              <p className="text-[10px] text-slate-400">Submit an expense for treasurer approval</p>
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
            {/* Section 1: Basic Information */}
            <SectionHeader
              icon={ClipboardList}
              title="1. Basic Information"
              subtitle="Enter the basic details of the expense"
            />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Expense Title" required error={errors.title}>
                <IconInput
                  icon={FileText}
                  {...bind('title')}
                  error={!!errors.title}
                  placeholder="e.g. Water leakage repair"
                />
              </Field>

              <Field label="Expense Category" required error={errors.category}>
                <IconSelect
                  icon={Tag}
                  {...bind('category')}
                  error={!!errors.category}
                  placeholder="Select category"
                  options={categories}
                />
              </Field>

              <Field label="Vendor / Paid To" required error={errors.vendor}>
                <IconInput
                  icon={User}
                  {...bind('vendor')}
                  error={!!errors.vendor}
                  placeholder="Enter vendor or payee name"
                />
              </Field>

              <Field label="Expense Date" required error={errors.expenseDate}>
                <DateInput {...bind('expenseDate')} error={!!errors.expenseDate} />
              </Field>
            </div>

            {/* Section 2: Payment Details */}
            <SectionHeader
              divider
              icon={Wallet}
              title="2. Payment Details"
              subtitle="Add payment information and method"
            />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Amount (₹)" required error={errors.amount}>
                <IconInput
                  icon={IndianRupee}
                  value={v.amount}
                  onChange={onAmount}
                  inputMode="decimal"
                  error={!!errors.amount}
                  placeholder="Enter amount"
                />
              </Field>

              <Field label="Payment Method" required error={errors.paymentMethod}>
                <IconSelect
                  icon={CreditCard}
                  {...bind('paymentMethod')}
                  error={!!errors.paymentMethod}
                  placeholder="Select payment method"
                  options={PAYMENT_METHODS}
                />
              </Field>

              <Field label="Payment Status">
                <IconSelect
                  icon={Clock}
                  {...bind('paymentStatus')}
                  options={PAYMENT_STATUSES}
                />
              </Field>

              <Field label="Invoice / Receipt Number">
                <IconInput
                  icon={Hash}
                  {...bind('invoiceNo')}
                  placeholder="Enter invoice or receipt number"
                />
              </Field>
            </div>

            {/* Section 3: Description & Documents */}
            <SectionHeader
              divider
              icon={Paperclip}
              title="3. Description & Documents"
              subtitle="Provide details and attach supporting documents"
            />

            <Field label="Expense Description" required error={errors.description}>
              <div className="relative">
                <FileText className="pointer-events-none absolute left-2.5 top-2.5 h-3 w-3 text-slate-500" />
                <textarea
                  rows={4}
                  maxLength={500}
                  {...bind('description')}
                  placeholder="Describe the expense, work completed and reason for payment..."
                  className={`${inputCls(true, !!errors.description)} resize-none ${noScrollbar}`}
                />
              </div>
              <p className="mt-1 text-right text-[9px] text-slate-500">{v.description.length}/500</p>
            </Field>

            <div className="mt-3">
              <Field label="Upload Invoice / Receipt" required error={fileError}>
                <label className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed border-[#3A4152] bg-[#0B0E14] px-3 py-4 text-center transition-colors hover:border-[#6C63FF]">
                  <UploadCloud className="h-4 w-4 text-[#A29CFF]" />
                  <span className="text-[10px] font-medium text-white">Drag and drop files here or click to upload</span>
                  <span className="text-[9px] text-slate-500">PDF, JPG, PNG (max 10 MB)</span>
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

            {/* Section 4: Approval Details */}
            <SectionHeader
              divider
              icon={ShieldCheck}
              title="4. Approval Details"
              subtitle="This expense will be sent for treasurer approval"
            />

            <button
              type="button"
              role="switch"
              aria-checked={approval}
              onClick={() => setApproval((p) => !p)}
              className="flex w-full cursor-pointer items-center gap-2.5 rounded-md border border-[#272D39] bg-[#0B0E14] px-2.5 py-2 text-left"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#6C63FF]/20 text-[#A29CFF]">
                <ShieldCheck className="h-3.5 w-3.5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-[10px] font-medium text-white">Require Approval</span>
                <span className="block text-[9px] text-slate-400">Send this expense for treasurer review</span>
              </span>
              <span
                className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
                  approval ? 'bg-[#6C63FF]' : 'bg-[#272D39]'
                }`}
              >
                <span
                  className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${
                    approval ? 'left-4.5' : 'left-0.5'
                  }`}
                />
              </span>
            </button>
          </div>

          {/* Expense Preview (live preview of the entered values) */}
          <div className="mt-3 rounded-xl border border-[#272D39] p-3 sm:p-3.5">
            <SectionHeader
              icon={Eye}
              title="Expense Preview"
              subtitle="This is how the expense will appear"
            />

            <div className="rounded-lg border border-[#272D39] bg-[#0B0E14] p-3">
              <div className="flex items-center gap-2.5 border-b border-[#272D39] pb-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-[#6C63FF] to-[#4DA3FF]">
                  <FileText className="h-4 w-4 text-white" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[11px] font-bold text-white">{v.title || 'Expense Title'}</p>
                  <p className="truncate text-[9px] text-slate-400">{v.title ? v.category || '-' : 'e.g. Water leakage repair'}</p>
                </div>
              </div>

              <dl className="mt-3 flex flex-col gap-2.5 text-[11px]">
                {[
                  ['Category', v.category || '-'],
                  ['Vendor', v.vendor || '-'],
                  ['Amount', v.amount ? `₹ ${money(parseFloat(v.amount) || 0)}` : '-'],
                  ['Date', prettyDate(v.expenseDate)],
                ].map(([k, val]) => (
                  <div key={k} className="flex items-center justify-between gap-3">
                    <dt className="text-slate-400">{k}</dt>
                    <dd className="min-w-0 truncate text-right text-white">{val}</dd>
                  </div>
                ))}
                <div className="flex items-center justify-between gap-3">
                  <dt className="text-slate-400">Status</dt>
                  <dd>
                    <span className={`rounded-md border px-2 py-0.5 text-[10px] font-medium ${statusBadge}`}>
                      {statusLabel}
                    </span>
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Summary */}
          <div className="mt-3 rounded-xl border border-[#272D39] p-3 sm:p-3.5">
            <SectionHeader
              icon={Receipt}
              title="Summary"
              subtitle="Quick overview of this expense"
            />

            <dl className="flex flex-col gap-2 text-[11px]">
              {[
                ['Category', v.category || '-'],
                ['Payment Method', v.paymentMethod || '-'],
                ['Payment Status', v.paymentStatus],
                ['Approval', approval ? 'Required' : 'Not required'],
              ].map(([k, val]) => (
                <div key={k} className="flex items-center justify-between gap-3">
                  <dt className="text-slate-400">{k}</dt>
                  <dd className={`min-w-0 truncate text-right ${k === 'Approval' && approval ? 'text-amber-400' : 'text-white'}`}>
                    {val}
                  </dd>
                </div>
              ))}
              <div className="flex items-center justify-between gap-3 border-t border-[#272D39] pt-2">
                <dt className="text-slate-400">Status</dt>
                <dd>
                  <span className={`rounded-md border px-2 py-0.5 text-[10px] font-medium ${statusBadge}`}>
                    {statusLabel}
                  </span>
                </dd>
              </div>
            </dl>
          </div>
          <div className="h-3" />
        </div>

        {/* Footer: buttons share the full width on phones, sit on the right on larger screens */}
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-[#272D39] p-3 sm:p-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 cursor-pointer rounded-md border border-[#272D39] px-3.5 py-1.5 text-[11px] font-semibold text-white hover:bg-white/5 sm:flex-none"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-md bg-linear-to-r from-[#6C63FF] to-[#4DA3FF] px-4 py-1.5 text-[11px] font-semibold text-white hover:opacity-90 sm:flex-none"
          >
            <Send className="h-3 w-3" /> Submit for Approval
          </button>
        </div>
      </motion.form>
    </motion.div>,
    document.body,
  )
}