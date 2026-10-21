'use client'

import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  X, Receipt, CalendarDays, ChevronDown, UploadCloud, Trash2, Tag, Store,
  Phone, CreditCard, Hash, IndianRupee, Wallet, Paperclip, Plus, Save,
  FileText, ClipboardList, Clock,
} from 'lucide-react'
import { expenseSchema } from '@/lib/validations/expense.schema' // ADDED: validation rules
import { getErrors } from '@/lib/validations/validate' // ADDED: converts rule errors to { field: message }

/* ---------- Config ---------- */

// TODO: load from API later
const DEFAULT_CATEGORIES = [
  'Security Services', 'Electricity', 'Housekeeping', 'Water', 'Repairs & Maintenance',
  'Lift / Elevator', 'Garden & Landscaping', 'Insurance', 'Other',
]

// TODO: load from API later
const DEFAULT_VENDORS = [
  'Alpha Security', 'Adani Power', 'CleanCo', 'Green Gardens', 'Otis Elevators',
]

const PAYMENT_METHODS = ['Cash', 'UPI', 'Bank Transfer', 'Cheque', 'Card']
const PAYMENT_STATUSES = ['Pending', 'Paid', 'Partially Paid']

// All text fields of the form (every field is a string)
type Vals = {
  title: string
  category: string
  expenseDate: string
  dueDate: string
  description: string
  vendor: string
  invoiceNo: string
  vendorContact: string
  paymentMethod: string
  baseAmount: string
  tax: string
  paymentStatus: string
  paymentDate: string
  utr: string
  notes: string
}

// Returns today's date as YYYY-MM-DD (local time) for the default expense date
const today = () => {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

const INITIAL: Vals = {
  title: '', category: '', expenseDate: today(), dueDate: '', description: '',
  vendor: '', invoiceNo: '', vendorContact: '', paymentMethod: '',
  baseAmount: '', tax: '', paymentStatus: 'Pending', paymentDate: '', utr: '', notes: '',
}

// Data received on save (id, total, status and files are not plain strings, so they are added separately)
export type ExpensePayload = Vals & {
  id: number
  total: number
  status: 'draft' | 'submitted'
  files: File[]
}

// Hide the scrollbar (content still scrolls)
const noScrollbar =
  '[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden'

// Format a number as Indian rupees, e.g. 1,45,000.00
const money = (n: number) =>
  n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

// Format YYYY-MM-DD as "16 Oct 2026"
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
  label, hint, error, action, className = '', children,
}: {
  label: string
  hint?: string
  error?: string
  action?: React.ReactNode
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={`min-w-0 ${className}`}>
      <div className="mb-1 flex items-center justify-between gap-2">
        <label className="block text-[10px] text-slate-400">
          {label} {hint && <span className="text-slate-500">({hint})</span>}
        </label>
        {action}
      </div>
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
  open, onClose, onSave, onAddVendor,
  categories = DEFAULT_CATEGORIES, vendors = DEFAULT_VENDORS,
}: {
  open: boolean
  onClose: () => void
  onSave?: (data: ExpensePayload) => void
  onAddVendor?: () => void
  categories?: string[]
  vendors?: string[]
}) {
  return (
    <AnimatePresence>
      {open && (
        <Body
          onClose={onClose}
          onSave={onSave}
          onAddVendor={onAddVendor}
          categories={categories}
          vendors={vendors}
        />
      )}
    </AnimatePresence>
  )
}

function Body({
  onClose, onSave, onAddVendor, categories, vendors,
}: {
  onClose: () => void
  onSave?: (data: ExpensePayload) => void
  onAddVendor?: () => void
  categories: string[]
  vendors: string[]
}) {
  const [v, setV] = useState<Vals>(INITIAL)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [files, setFiles] = useState<File[]>([])
  const [fileError, setFileError] = useState('')

  // Total = base amount + tax
  const total = useMemo(
    () => (parseFloat(v.baseAmount) || 0) + (parseFloat(v.tax) || 0),
    [v.baseAmount, v.tax],
  )

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

  // Amount fields: allow only digits and a single decimal point (max 2 decimals)
  const bindAmount = (k: 'baseAmount' | 'tax') => ({
    value: v[k],
    inputMode: 'decimal' as const,
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value
      if (!/^\d*\.?\d{0,2}$/.test(val)) return
      setV((p) => ({ ...p, [k]: val }))
      setErrors((p) => ({ ...p, [k]: '' }))
    },
  })

  // Phone field: digits only, max 10
  const onPhone = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 10)
    setV((p) => ({ ...p, vendorContact: val }))
    setErrors((p) => ({ ...p, vendorContact: '' }))
  }

  function addFiles(list: FileList | null) {
    if (!list) return
    const valid: File[] = []
    let bad = ''
    Array.from(list).forEach((f) => {
      const okType = /\.(pdf|jpg|jpeg|png)$/i.test(f.name)
      const okSize = f.size <= 5 * 1024 * 1024
      if (okType && okSize) valid.push(f)
      else bad = 'Only PDF, JPG, PNG files up to 5 MB are allowed'
    })
    setFileError(bad)
    if (valid.length) setFiles((p) => [...p, ...valid])
  }

  // CHANGED: full validation for "Save Expense" (rules live in lib/validations/expense.schema.ts)
  function validate() {
    const err = getErrors(expenseSchema, v)
    setErrors(err)
    return Object.keys(err).length === 0
  }

  function submit(ev: React.FormEvent) {
    ev.preventDefault()
    if (!validate()) return
    // TODO: call the API here
    onSave?.({ ...v, id: Date.now(), total, status: 'submitted', files })
    onClose()
  }

  // Draft only needs a title
  function saveDraft() {
    if (!v.title.trim()) {
      setErrors({ title: 'Expense title is required to save a draft' })
      return
    }
    // TODO: call the draft API here
    onSave?.({ ...v, id: Date.now(), total, status: 'draft', files })
    onClose()
  }

  // Badge colors for the payment status shown in the summary
  const payBadge =
    v.paymentStatus === 'Paid'
      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
      : v.paymentStatus === 'Partially Paid'
        ? 'border-sky-500/40 bg-sky-500/10 text-sky-400'
        : 'border-amber-500/40 bg-amber-500/10 text-amber-400'

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
              <Receipt className="h-4 w-4 text-white" />
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-sm font-bold text-white">Add Expense</h2>
              <p className="text-[10px] text-slate-400">Record and manage society expenses</p>
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
            {/* Section 1: Expense Information */}
            <SectionHeader
              icon={ClipboardList}
              title="1. Expense Information"
              subtitle="Title, category, dates and description"
            />

            <Field label="Expense Title" error={errors.title}>
              <IconInput
                icon={FileText}
                {...bind('title')}
                error={!!errors.title}
                placeholder="e.g. Security Services"
              />
            </Field>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Expense Category" error={errors.category}>
                <IconSelect
                  icon={Tag}
                  {...bind('category')}
                  error={!!errors.category}
                  placeholder="Select category"
                  options={categories}
                />
              </Field>

              <Field label="Expense Date" error={errors.expenseDate}>
                <DateInput {...bind('expenseDate')} error={!!errors.expenseDate} />
              </Field>
            </div>

            <div className="mt-3">
              <Field label="Due Date" error={errors.dueDate}>
                <DateInput
                  {...bind('dueDate')}
                  min={v.expenseDate || undefined}
                  error={!!errors.dueDate}
                />
              </Field>
            </div>

            <div className="mt-3">
              <Field label="Description" error={errors.description}>
                <div className="relative">
                  <FileText className="pointer-events-none absolute left-2.5 top-2.5 h-3 w-3 text-slate-500" />
                  <textarea
                    rows={4}
                    maxLength={500}
                    {...bind('description')}
                    placeholder="Enter expense details..."
                    className={`${inputCls(true, !!errors.description)} resize-none ${noScrollbar}`}
                  />
                </div>
                <p className="mt-1 text-right text-[9px] text-slate-500">{v.description.length}/500</p>
              </Field>
            </div>

            {/* Section 2: Vendor Details */}
            <SectionHeader
              divider
              icon={Store}
              title="2. Vendor Details"
              subtitle="Vendor, invoice and payment method"
            />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field
                label="Vendor Name"
                error={errors.vendor}
                action={
                  <button
                    type="button"
                    onClick={onAddVendor}
                    className="flex cursor-pointer items-center gap-0.5 text-[10px] font-medium text-[#A29CFF] hover:text-white"
                  >
                    <Plus className="h-3 w-3" /> Add New
                  </button>
                }
              >
                <IconSelect
                  icon={Store}
                  {...bind('vendor')}
                  error={!!errors.vendor}
                  placeholder="Select vendor"
                  options={vendors}
                />
              </Field>

              <Field label="Invoice / Bill Number">
                <IconInput
                  icon={FileText}
                  {...bind('invoiceNo')}
                  placeholder="e.g. INV-2026-001"
                />
              </Field>

              <Field label="Vendor Contact" error={errors.vendorContact}>
                <IconInput
                  icon={Phone}
                  type="tel"
                  value={v.vendorContact}
                  onChange={onPhone}
                  error={!!errors.vendorContact}
                  placeholder="Enter phone number"
                />
              </Field>

              <Field label="Payment Method">
                <IconSelect
                  icon={CreditCard}
                  {...bind('paymentMethod')}
                  placeholder="Select payment method"
                  options={PAYMENT_METHODS}
                />
              </Field>
            </div>

            {/* Section 3: Amount & Payment */}
            <SectionHeader
              divider
              icon={Wallet}
              title="3. Amount & Payment"
              subtitle="Amount, tax and payment status"
            />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Base Amount (₹)" error={errors.baseAmount}>
                <IconInput
                  icon={IndianRupee}
                  {...bindAmount('baseAmount')}
                  error={!!errors.baseAmount}
                  placeholder="0.00"
                />
              </Field>

              <Field label="Tax / GST (₹)">
                <IconInput
                  icon={IndianRupee}
                  {...bindAmount('tax')}
                  placeholder="0.00"
                />
              </Field>

              {/* Total is auto-calculated (read only) */}
              <Field label="Total Amount">
                <div className="flex items-center gap-1 rounded-md border border-[#6C63FF]/40 bg-[#6C63FF]/10 px-2.5 py-1.5 text-xs font-bold text-[#A29CFF]">
                  <IndianRupee className="h-3 w-3 shrink-0" />
                  <span className="truncate">{money(total)}</span>
                </div>
              </Field>

              <Field label="Payment Status">
                <IconSelect
                  icon={Clock}
                  {...bind('paymentStatus')}
                  options={PAYMENT_STATUSES}
                />
              </Field>

              <Field label="Payment Date" error={errors.paymentDate}>
                <DateInput {...bind('paymentDate')} error={!!errors.paymentDate} />
              </Field>

              <Field label="Transaction Reference / UTR">
                <IconInput
                  icon={Hash}
                  {...bind('utr')}
                  placeholder="e.g. UPI123456789"
                />
              </Field>
            </div>

            {/* Section 4: Attachments & Notes */}
            <SectionHeader
              divider
              icon={Paperclip}
              title="4. Attachments & Notes"
              subtitle="Upload invoice and add internal notes (optional)"
            />

            <Field label="Upload Invoice / Receipt" hint="Optional" error={fileError}>
              <label className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed border-[#3A4152] bg-[#0B0E14] px-3 py-4 text-center transition-colors hover:border-[#6C63FF]">
                <UploadCloud className="h-4 w-4 text-[#A29CFF]" />
                <span className="text-[10px] font-medium text-white">Click to upload or drag and drop</span>
                <span className="text-[9px] text-slate-500">PDF, JPG, PNG (max 5 MB)</span>
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

            <div className="mt-3">
              <Field label="Internal Notes">
                <div className="relative">
                  <FileText className="pointer-events-none absolute left-2.5 top-2.5 h-3 w-3 text-slate-500" />
                  <textarea
                    rows={3}
                    maxLength={500}
                    {...bind('notes')}
                    placeholder="Add notes for the committee or approver..."
                    className={`${inputCls(true)} resize-none ${noScrollbar}`}
                  />
                </div>
                <p className="mt-1 text-right text-[9px] text-slate-500">{v.notes.length}/500</p>
              </Field>
            </div>
          </div>

          {/* Expense Summary (live preview of the entered values) */}
          <div className="mt-3 rounded-xl border border-[#272D39] p-3 sm:p-3.5">
            <SectionHeader
              icon={Receipt}
              title="Expense Summary"
              subtitle="Live preview of this expense"
            />

            <dl className="flex flex-col gap-2 text-[11px]">
              {[
                ['Expense Title', v.title || '-'],
                ['Category', v.category || '-'],
                ['Vendor', v.vendor || '-'],
                ['Date', prettyDate(v.expenseDate)],
              ].map(([k, val]) => (
                <div key={k} className="flex items-center justify-between gap-3">
                  <dt className="text-slate-400">{k}</dt>
                  <dd className="min-w-0 truncate text-right text-white">{val}</dd>
                </div>
              ))}
              <div className="flex items-center justify-between gap-3">
                <dt className="text-slate-400">Total Amount</dt>
                <dd className="text-sm font-bold text-[#A29CFF]">₹ {money(total)}</dd>
              </div>
            </dl>

            <div className="mt-3 border-t border-[#272D39] pt-3">
              <p className="mb-2 text-[10px] text-slate-400">Status</p>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <span className={`flex items-center justify-center gap-1.5 rounded-md border px-2.5 py-1.5 text-[10px] font-medium ${payBadge}`}>
                  <Clock className="h-3 w-3" /> Payment: {v.paymentStatus}
                </span>
                <span className="flex items-center justify-center gap-1.5 rounded-md border border-[#6C63FF]/40 bg-[#6C63FF]/10 px-2.5 py-1.5 text-[10px] font-medium text-[#A29CFF]">
                  <Clock className="h-3 w-3" /> Approval: Pending
                </span>
              </div>
            </div>
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
            type="button"
            onClick={saveDraft}
            className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-md border border-[#272D39] px-3.5 py-1.5 text-[11px] font-semibold text-white hover:bg-white/5 sm:flex-none"
          >
            <Save className="h-3 w-3" /> Save as Draft
          </button>
          <button
            type="submit"
            className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-md bg-linear-to-r from-[#6C63FF] to-[#4DA3FF] px-4 py-1.5 text-[11px] font-semibold text-white hover:opacity-90 sm:flex-none"
          >
            <Plus className="h-3 w-3" /> Save Expense
          </button>
        </div>
      </motion.form>
    </motion.div>,
    document.body,
  )
}