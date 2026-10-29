'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent, DragEvent, ElementType, InputHTMLAttributes, ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  X, FileText, Save, Send, Building2, Tag, CalendarDays, Landmark, CreditCard,
  Network, IndianRupee, Plus, Trash2, UploadCloud, Paperclip, StickyNote, Clock,
  Info, ChevronDown,
} from 'lucide-react'
// Options, limits and validation come from the treasurer schema file
import {
  VENDOR_CATEGORIES,
  TAX_RATES,
  PAYMENT_MODES,
  BANK_CASH_ACCOUNTS,
  COST_CENTERS,
  ACCOUNTS,
  MAX_DESC,
  MAX_NOTES,
  MAX_FILE_MB,
  MAX_FILES,
  ALLOWED_FILE_TYPES,
  validateVendorBill,
} from '@/lib/validations/treasurerVendorBill.schema'

/* ---------- Config ---------- */

// TODO: fetch this list from the API later
// Each vendor has a default category (selecting a vendor auto-fills the category)
const VENDORS = [
  { name: 'ABC Elevator Services', category: 'Maintenance' },
  { name: 'SafeGuard Security Pvt. Ltd.', category: 'Security' },
  { name: 'CleanPro Housekeeping', category: 'Housekeeping' },
  { name: 'PowerGrid Electricals', category: 'Electricity' },
]

type LineItem = {
  id: number
  account: string
  description: string
  debit: string
  credit: string
}

// Data sent to the page when the drawer is saved
export type AddVendorBillPayload = {
  id: number
  status: 'Draft' | 'Pending'
  vendor: string
  category: string
  invoiceNo: string
  invoiceDate: string
  dueDate: string
  reference: string
  title: string
  description: string
  amount: number
  taxRate: number
  gst: number
  discount: number
  totalPayable: number
  paymentMode: string
  bankAccount: string
  costCenter: string
  lines: { account: string; description: string; debit: number; credit: number }[]
  notes: string
  files: File[]
}

const noScrollbar =
  '[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden'

/* ---------- Helpers ---------- */

// "15,000.50" -> 15000.5 (anything that is not a number becomes 0)
const toNum = (v: string) => Number(v.replace(/[^0-9.]/g, '')) || 0

// 15000 -> "15,000.00"
const money = (n: number) =>
  n.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

// Allow only digits and a single dot while typing an amount
const cleanAmount = (v: string) => {
  const cleaned = v.replace(/[^0-9.]/g, '')
  const [whole, ...rest] = cleaned.split('.')
  return rest.length ? `${whole}.${rest.join('')}` : whole
}

// 1048576 -> "1.0 MB"
const fileSize = (b: number) =>
  b >= 1024 * 1024
    ? `${(b / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.max(1, Math.round(b / 1024))} KB`

// Today + N days as yyyy-mm-dd (local time)
const daysFromToday = (n: number) => {
  const d = new Date()
  d.setDate(d.getDate() + n)
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

const emptyLine = (id: number): LineItem => ({ id, account: '', description: '', debit: '', credit: '' })

/* ---------- Styles ---------- */
/* bg: #10131A | input bg: #0B0E14 | border: #272D39 | accent: #6C63FF / #A29CFF */

const inputCls = (icon = false, error = false) =>
  `w-full rounded-md border bg-[#0B0E14] py-2 text-[11px] text-white outline-none transition-colors placeholder:text-slate-500 focus:border-[#6C63FF] disabled:cursor-not-allowed disabled:opacity-40 ${
    error ? 'border-red-500/60' : 'border-[#272D39]'
  } ${icon ? 'pl-8 pr-2.5' : 'px-2.5'}`

/* ---------- Small reusable pieces ---------- */

// Section box with a title
function Section({ title, icon: Icon, children }: { title: string; icon: ElementType; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-[#272D39] p-3.5">
      <h3 className="mb-3 flex items-center gap-2 text-xs font-bold">
        <Icon className="h-3.5 w-3.5 text-[#A29CFF]" /> {title}
      </h3>
      {children}
    </div>
  )
}

function Field({
  label, error, className = '', children,
}: {
  label: string
  required?: boolean
  error?: string
  className?: string
  children: ReactNode
}) {
  return (
    <div className={`min-w-0 ${className}`}>
      <label className="mb-1 block text-[10px] text-slate-400">
        {label}
      </label>
      {children}
      {error && <p className="mt-1 text-[9px] text-red-400">{error}</p>}
    </div>
  )
}

// Text input with a left icon
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

// Amount input with a fixed rupee box on the left
function RupeeInput({ error, ...props }: { error?: boolean } & InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div
      className={`flex overflow-hidden rounded-md border bg-[#0B0E14] transition-colors focus-within:border-[#6C63FF] ${
        error ? 'border-red-500/60' : 'border-[#272D39]'
      }`}
    >
      <span className="flex w-8 shrink-0 items-center justify-center border-r border-[#272D39] text-slate-400">
        <IndianRupee className="h-3 w-3" />
      </span>
      <input
        {...props}
        inputMode="decimal"
        className="min-w-0 flex-1 bg-transparent px-2.5 py-2 text-[11px] text-white outline-none placeholder:text-slate-500"
      />
    </div>
  )
}

// Select with an optional left icon, a placeholder option and a custom chevron
function IconSelect({
  icon: Icon, value, onChange, options, placeholder, error,
}: {
  icon?: ElementType
  value: string
  onChange: (v: string) => void
  options: string[]
  placeholder?: string
  error?: boolean
}) {
  return (
    <div className="relative">
      {Icon && <Icon className="pointer-events-none absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-500" />}
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputCls(!!Icon, error)} cursor-pointer appearance-none truncate pr-7 ${value === '' ? 'text-slate-500' : ''}`}
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

// Date input with a left calendar icon
function DateInput({
  value, onChange, error, min, max,
}: { value: string; onChange: (v: string) => void; error?: boolean; min?: string; max?: string }) {
  return (
    <div className="relative">
      <CalendarDays className="pointer-events-none absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-500" />
      <input
        type="date"
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputCls(true, error)} scheme-dark`}
      />
    </div>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-slate-300">{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  )
}

/* ---------- Drawer ---------- */

export default function AddVendorBillModal({
  open, onClose, onSave,
}: {
  open: boolean
  onClose: () => void
  onSave?: (data: AddVendorBillPayload) => void
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
  onSave?: (data: AddVendorBillPayload) => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const nextLineId = useRef(3)

  // Vendor & invoice
  const [vendor, setVendor] = useState('')
  const [category, setCategory] = useState('')
  const [invoiceNo, setInvoiceNo] = useState('')
  const [invoiceDate, setInvoiceDate] = useState(() => daysFromToday(0))
  const [dueDate, setDueDate] = useState(() => daysFromToday(14))
  const [reference, setReference] = useState('')

  // Bill details
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [taxRate, setTaxRate] = useState('18%')
  const [discount, setDiscount] = useState('')
  const [paymentMode, setPaymentMode] = useState('')
  const [bankAccount, setBankAccount] = useState('')
  const [costCenter, setCostCenter] = useState('')

  // Ledger lines
  const [lines, setLines] = useState<LineItem[]>([emptyLine(1), emptyLine(2)])

  // Attachments + notes
  const [files, setFiles] = useState<File[]>([])
  const [dragging, setDragging] = useState(false)
  const [notes, setNotes] = useState('')

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

  // Bill summary (all calculated)
  const summary = useMemo(() => {
    const subtotal = toNum(amount)
    const rate = Number(taxRate.replace('%', '')) || 0
    const gst = Math.round(subtotal * rate) / 100
    const disc = toNum(discount)
    const total = Math.max(0, subtotal + gst - disc)
    return { subtotal, rate, gst, disc, total }
  }, [amount, taxRate, discount])

  // Vendor change auto-fills the category
  const onVendorChange = (name: string) => {
    setVendor(name)
    clearErr('vendor')
    const found = VENDORS.find((v) => v.name === name)
    if (found) {
      setCategory(found.category)
      clearErr('category')
    }
  }

  /* ----- Ledger line helpers ----- */
  const updateLine = (id: number, patch: Partial<LineItem>) => {
    setLines((p) => p.map((l) => (l.id === id ? { ...l, ...patch } : l)))
    clearErr('lines')
  }
  const addLine = () => setLines((p) => [...p, emptyLine(nextLineId.current++)])
  // At least two lines must always stay
  const removeLine = (id: number) => {
    if (lines.length <= 2) return
    setLines((p) => p.filter((l) => l.id !== id))
    clearErr('lines')
  }

  /* ----- File helpers ----- */
  function addFiles(list: FileList | null) {
    if (!list) return
    const accepted: File[] = []
    let problem = ''
    Array.from(list).forEach((f) => {
      if (!ALLOWED_FILE_TYPES.includes(f.type)) problem = 'Only PDF, JPG and PNG files are allowed'
      else if (f.size > MAX_FILE_MB * 1024 * 1024) problem = `Each file must be under ${MAX_FILE_MB}MB`
      else accepted.push(f)
    })
    // Do not allow more than MAX_FILES files in total
    const room = MAX_FILES - files.length
    if (accepted.length > room) {
      problem = `You can attach up to ${MAX_FILES} files`
      accepted.splice(Math.max(room, 0))
    }
    if (accepted.length) setFiles((p) => [...p, ...accepted])
    setErrors((p) => ({ ...p, files: problem }))
  }
  const onPick = (e: ChangeEvent<HTMLInputElement>) => {
    addFiles(e.target.files)
    e.target.value = ''
  }
  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragging(false)
    addFiles(e.dataTransfer.files)
  }

  /* ----- Validation + submit ----- */

  // "draft" needs vendor + title. "submit" needs every required field. (uses the treasurer schema)
  function validate(mode: 'draft' | 'submit') {
    const err = validateVendorBill(
      {
        vendor,
        vendorExists: VENDORS.some((v) => v.name === vendor),
        category,
        invoiceNo,
        reference,
        invoiceDate,
        dueDate,
        title,
        description,
        amount,
        taxRate,
        discount,
        paymentMode,
        bankAccount,
        costCenter,
        lines: lines.map((l) => ({
          account: l.account,
          description: l.description,
          debit: l.debit,
          credit: l.credit,
        })),
        notes,
        files: files.map((f) => ({ name: f.name, type: f.type, size: f.size })),
      },
      mode,
    )

    setErrors(err)
    return Object.keys(err).length === 0
  }

  function submit(mode: 'draft' | 'submit') {
    if (!validate(mode)) return

    // TODO: call the API here (send as FormData because of the files)
    onSave?.({
      id: Date.now(),
      status: mode === 'draft' ? 'Draft' : 'Pending',
      vendor,
      category,
      invoiceNo: invoiceNo.trim(),
      invoiceDate,
      dueDate,
      reference: reference.trim(),
      title: title.trim(),
      description: description.trim(),
      amount: summary.subtotal,
      taxRate: summary.rate,
      gst: summary.gst,
      discount: summary.disc,
      totalPayable: summary.total,
      paymentMode,
      bankAccount,
      costCenter,
      lines: lines
        .filter((l) => l.account)
        .map((l) => ({
          account: l.account,
          description: l.description.trim(),
          debit: toNum(l.debit),
          credit: toNum(l.credit),
        })),
      notes: notes.trim(),
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
        noValidate
        onSubmit={(e) => {
          e.preventDefault()
          submit('submit')
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
              <FileText className="h-4 w-4 text-white" />
            </span>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-white">Add Vendor Bill</h2>
              <p className="text-[10px] text-slate-400">Record a new vendor bill and manage your payments</p>
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
        <div className={`mt-2 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain px-3.5 pb-3 sm:px-4 ${noScrollbar}`}>
          {/* ---------- Vendor & invoice details ---------- */}
          <Section title="Vendor & Invoice Details" icon={Building2}>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Field label="Vendor Name" required error={errors.vendor}>
                <IconSelect
                  icon={Building2}
                  value={vendor}
                  onChange={onVendorChange}
                  options={VENDORS.map((v) => v.name)}
                  placeholder="Select vendor"
                  error={!!errors.vendor}
                />
              </Field>

              <Field label="Vendor Category" required error={errors.category}>
                <IconSelect
                  icon={Tag}
                  value={category}
                  onChange={(v) => { setCategory(v); clearErr('category') }}
                  options={VENDOR_CATEGORIES}
                  placeholder="Select category"
                  error={!!errors.category}
                />
              </Field>

              <Field label="Invoice Number" required error={errors.invoiceNo}>
                <IconInput
                  icon={FileText}
                  value={invoiceNo}
                  onChange={(e) => { setInvoiceNo(e.target.value); clearErr('invoiceNo') }}
                  error={!!errors.invoiceNo}
                  placeholder="e.g. INV-2026-0458"
                />
              </Field>

              <Field label="Reference / PO Number" error={errors.reference}>
                <IconInput
                  icon={FileText}
                  value={reference}
                  onChange={(e) => { setReference(e.target.value); clearErr('reference') }}
                  error={!!errors.reference}
                  placeholder="Enter reference / PO number"
                />
              </Field>

              <Field label="Invoice Date" required error={errors.invoiceDate}>
                <DateInput
                  value={invoiceDate}
                  max={daysFromToday(0)}
                  onChange={(v) => { setInvoiceDate(v); clearErr('invoiceDate'); clearErr('dueDate') }}
                  error={!!errors.invoiceDate}
                />
              </Field>

              <Field label="Due Date" required error={errors.dueDate}>
                <DateInput
                  value={dueDate}
                  min={invoiceDate}
                  onChange={(v) => { setDueDate(v); clearErr('dueDate') }}
                  error={!!errors.dueDate}
                />
              </Field>
            </div>
          </Section>

          {/* ---------- Bill details ---------- */}
          <Section title="Bill Details" icon={FileText}>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Field label="Bill Title" required error={errors.title} className="md:col-span-2">
                <input
                  value={title}
                  onChange={(e) => { setTitle(e.target.value); clearErr('title') }}
                  placeholder="e.g. Lift Maintenance Service"
                  className={inputCls(false, !!errors.title)}
                />
              </Field>

              <Field label="Description" required error={errors.description} className="md:col-span-2">
                <div className="relative">
                  <textarea
                    value={description}
                    maxLength={MAX_DESC}
                    onChange={(e) => { setDescription(e.target.value); clearErr('description') }}
                    rows={3}
                    placeholder="Enter a short description of the bill"
                    className={`${inputCls(false, !!errors.description)} resize-none pb-6`}
                  />
                  <span className="pointer-events-none absolute bottom-2 right-2.5 text-[10px] text-slate-500">
                    {description.length}/{MAX_DESC}
                  </span>
                </div>
              </Field>

              <Field label="Bill Amount (₹)" required error={errors.amount}>
                <RupeeInput
                  value={amount}
                  onChange={(e) => { setAmount(cleanAmount(e.target.value)); clearErr('amount'); clearErr('discount') }}
                  placeholder="0.00"
                  error={!!errors.amount}
                />
              </Field>

              <Field label="Tax / GST (%)" error={errors.taxRate}>
                <IconSelect
                  value={taxRate}
                  onChange={(v) => { setTaxRate(v); clearErr('taxRate'); clearErr('discount') }}
                  options={TAX_RATES}
                  error={!!errors.taxRate}
                />
              </Field>

              <Field label="Discount (₹)" error={errors.discount}>
                <RupeeInput
                  value={discount}
                  onChange={(e) => { setDiscount(cleanAmount(e.target.value)); clearErr('discount') }}
                  placeholder="0.00"
                  error={!!errors.discount}
                />
              </Field>

              <Field label="Payment Mode" error={errors.paymentMode}>
                <IconSelect
                  icon={CreditCard}
                  value={paymentMode}
                  onChange={(v) => { setPaymentMode(v); clearErr('paymentMode'); clearErr('bankAccount') }}
                  options={PAYMENT_MODES}
                  placeholder="Select payment mode"
                  error={!!errors.paymentMode}
                />
              </Field>

              <Field label="Bank / Cash Account" error={errors.bankAccount}>
                <IconSelect
                  icon={Landmark}
                  value={bankAccount}
                  onChange={(v) => { setBankAccount(v); clearErr('bankAccount') }}
                  options={BANK_CASH_ACCOUNTS}
                  placeholder="Select bank or cash account"
                  error={!!errors.bankAccount}
                />
              </Field>

              <Field label="Cost Center / Department" error={errors.costCenter}>
                <IconSelect
                  icon={Network}
                  value={costCenter}
                  onChange={(v) => { setCostCenter(v); clearErr('costCenter') }}
                  options={COST_CENTERS}
                  placeholder="Select cost center"
                  error={!!errors.costCenter}
                />
              </Field>
            </div>
          </Section>

          {/* ---------- Ledger entries (one card per line, fits the drawer) ---------- */}
          <Section title="Ledger Entries" icon={FileText}>
            <div className="flex flex-col gap-2.5">
              {lines.map((l, i) => (
                <div key={l.id} className="rounded-md border border-[#272D39] bg-[#0B0E14] p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-slate-300">Line {i + 1}</span>
                    <button
                      type="button"
                      onClick={() => removeLine(l.id)}
                      disabled={lines.length <= 2}
                      aria-label={`Remove line ${i + 1}`}
                      className="cursor-pointer rounded-md p-1 text-red-400 transition-colors hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <Field label="Account">
                      <IconSelect
                        value={l.account}
                        onChange={(v) => updateLine(l.id, { account: v })}
                        options={ACCOUNTS}
                        placeholder="Select account"
                      />
                    </Field>
                    <Field label="Description">
                      <input
                        value={l.description}
                        onChange={(e) => updateLine(l.id, { description: e.target.value })}
                        placeholder="Description"
                        className={inputCls()}
                      />
                    </Field>
                    <Field label="Debit (₹)">
                      <input
                        value={l.debit}
                        onChange={(e) => updateLine(l.id, { debit: cleanAmount(e.target.value) })}
                        inputMode="decimal"
                        placeholder="0.00"
                        className={inputCls()}
                      />
                    </Field>
                    <Field label="Credit (₹)">
                      <input
                        value={l.credit}
                        onChange={(e) => updateLine(l.id, { credit: cleanAmount(e.target.value) })}
                        inputMode="decimal"
                        placeholder="0.00"
                        className={inputCls()}
                      />
                    </Field>
                  </div>
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={addLine}
              className="mt-3 flex cursor-pointer items-center gap-1.5 text-[11px] font-medium text-[#8B85FF] hover:text-[#A29CFF]"
            >
              <Plus className="h-3.5 w-3.5" /> Add Another Line
            </button>
            {errors.lines && <p className="mt-2 text-[9px] text-red-400">{errors.lines}</p>}
          </Section>

          {/* ---------- Attachments & notes ---------- */}
          <Section title="Attachments & Notes" icon={Paperclip}>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {/* Upload */}
              <div className="min-w-0">
                <label className="mb-1 flex items-center gap-1.5 text-[10px] text-slate-400">
                  <Paperclip className="h-3 w-3" /> Upload Invoice / Bill
                </label>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => fileInputRef.current?.click()}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault()
                      fileInputRef.current?.click()
                    }
                  }}
                  onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
                  onDragLeave={() => setDragging(false)}
                  onDrop={onDrop}
                  className={`flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-md border border-dashed px-3 py-5 text-center transition-colors ${
                    dragging ? 'border-[#6C63FF] bg-[#6C63FF]/10' : 'border-[#6C63FF]/50 bg-[#0B0E14] hover:bg-white/3'
                  }`}
                >
                  <UploadCloud className="h-6 w-6 text-[#8B85FF]" />
                  <p className="text-[10px] text-slate-200">
                    Drag and drop files here, or{' '}
                    <span className="text-[#4DA3FF] hover:underline">click to browse</span>
                  </p>
                  <p className="text-[9px] text-slate-500">PDF, JPG, PNG (Max {MAX_FILE_MB} MB)</p>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={onPick}
                  className="hidden"
                />
                {errors.files && <p className="mt-1 text-[9px] text-red-400">{errors.files}</p>}

                <ul className="mt-2 flex flex-col gap-1.5">
                  <AnimatePresence initial={false}>
                    {files.map((f, i) => (
                      <motion.li
                        key={`${f.name}-${f.size}-${i}`}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="flex items-center justify-between gap-2 rounded-md border border-[#272D39] bg-[#0B0E14] px-2.5 py-1.5 text-[10px]">
                          <span className="min-w-0 truncate text-slate-200">{f.name}</span>
                          <span className="flex shrink-0 items-center gap-2">
                            <span className="text-slate-500">{fileSize(f.size)}</span>
                            <button
                              type="button"
                              onClick={() => { setFiles((p) => p.filter((_, idx) => idx !== i)); clearErr('files') }}
                              aria-label={`Remove ${f.name}`}
                              className="cursor-pointer rounded p-0.5 text-slate-400 hover:bg-white/5 hover:text-white"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        </div>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              </div>

              {/* Notes */}
              <div className="min-w-0">
                <label className="mb-1 flex items-center gap-1.5 text-[10px] text-slate-400">
                  <StickyNote className="h-3 w-3" /> Notes
                </label>
                <div className="relative">
                  <textarea
                    value={notes}
                    maxLength={MAX_NOTES}
                    onChange={(e) => { setNotes(e.target.value); clearErr('notes') }}
                    rows={6}
                    placeholder="Enter any additional notes or remarks..."
                    className={`${inputCls(false, !!errors.notes)} resize-none pb-6`}
                  />
                  <span className="pointer-events-none absolute bottom-2 right-2.5 text-[10px] text-slate-500">
                    {notes.length}/{MAX_NOTES}
                  </span>
                </div>
                {errors.notes && <p className="mt-1 text-[9px] text-red-400">{errors.notes}</p>}
              </div>
            </div>
          </Section>

          {/* ---------- Bill summary ---------- */}
          <Section title="Bill Summary" icon={Clock}>
            <div className="flex flex-col gap-2.5 text-[11px]">
              <SummaryRow label="Subtotal" value={`₹ ${money(summary.subtotal)}`} />
              <SummaryRow label={`GST (${summary.rate}%)`} value={`₹ ${money(summary.gst)}`} />
              <SummaryRow label="Discount" value={`₹ ${money(summary.disc)}`} />

              <div className="flex items-center justify-between gap-3 border-t border-[#272D39] pt-3">
                <span className="text-xs font-semibold">Total Payable</span>
                <span className="text-base font-bold text-emerald-400">₹ {money(summary.total)}</span>
              </div>

              <div className="flex items-center gap-2.5 rounded-lg border border-amber-500/50 bg-amber-500/5 px-3 py-2">
                <Clock className="h-4 w-4 shrink-0 text-amber-400" />
                <span className="text-[11px] text-slate-200">Status</span>
                <span className="ml-1 rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[10px] font-medium text-amber-300">
                  Pending Approval
                </span>
              </div>

              <div className="flex items-start gap-2 rounded-md border border-[#6C63FF]/30 bg-[#6C63FF]/10 p-2.5">
                <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#A29CFF]" />
                <p className="text-[10px] leading-relaxed text-slate-300">
                  Bill will be sent for approval after submission.
                </p>
              </div>
            </div>
          </Section>
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
            onClick={() => submit('draft')}
            className="flex cursor-pointer items-center justify-center gap-1.5 rounded-md border border-[#6C63FF]/60 bg-[#6C63FF]/10 px-3.5 py-2 text-[11px] font-semibold text-[#C9C5FF] hover:bg-[#6C63FF]/20 sm:py-1.5"
          >
            <Save className="h-3 w-3" /> Save as Draft
          </button>
          <button
            type="submit"
            className="col-span-2 flex cursor-pointer items-center justify-center gap-1.5 rounded-md bg-linear-to-r from-[#6C63FF] to-[#4DA3FF] px-4 py-2 text-[11px] font-semibold text-white hover:opacity-90 sm:col-span-1 sm:py-1.5"
          >
            <Send className="h-3 w-3" /> Submit for Approval
          </button>
        </div>
      </motion.form>
    </motion.div>,
    document.body,
  )
}