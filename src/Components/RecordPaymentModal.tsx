'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent, DragEvent, ElementType, InputHTMLAttributes, ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  X, CreditCard, Save, Building2, FileText, IndianRupee, CalendarDays, Landmark,
  Link2, UploadCloud, Paperclip, StickyNote, CheckCircle2, ChevronDown, Wallet,
} from 'lucide-react'

/* ---------- Config ---------- */

// TODO: fetch this list from the API later
// Each bill belongs to a vendor. "paid" is the amount already paid against that bill.
const BILLS = [
  { vendor: 'ABC Elevator Services', invoiceNo: 'V-001', total: 12000, paid: 0 },
  { vendor: 'SkyLine Plumbing', invoiceNo: 'V-002', total: 8500, paid: 0 },
  { vendor: 'Power Solutions', invoiceNo: 'V-003', total: 6800, paid: 3200 },
  { vendor: 'Fresh Mart Suppliers', invoiceNo: 'V-004', total: 15000, paid: 0 },
  { vendor: 'Global Hardware', invoiceNo: 'V-005', total: 9750, paid: 0 },
]
const VENDORS = Array.from(new Set(BILLS.map((b) => b.vendor)))
const PAYMENT_METHODS = ['Cash', 'Cheque', 'Bank Transfer', 'UPI', 'Card']

const MAX_NOTES = 500
const MAX_FILE_MB = 5
const ALLOWED_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/png']

type Option = { value: string; label: string }

// Data sent to the page when the drawer is saved
export type RecordPaymentPayload = {
  id: number
  status: 'Paid' | 'Partially Paid'
  vendor: string
  invoiceNo: string
  totalAmount: number
  paidAmount: number
  outstanding: number
  paymentAmount: number
  remainingBalance: number
  paymentDate: string
  paymentMethod: string
  referenceId: string
  notes: string
  receipt: File | null
}

const noScrollbar =
  '[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden'

/* ---------- Helpers ---------- */

// "15,000.50" -> 15000.5 (anything that is not a number becomes 0)
const toNum = (v: string) => Number(v.replace(/[^0-9.]/g, '')) || 0

// 12000 -> "12,000" (shows decimals only when needed)
const money = (n: number) =>
  n.toLocaleString('en-IN', { minimumFractionDigits: 0, maximumFractionDigits: 2 })

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

// Today as yyyy-mm-dd (local time)
const today = () => {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

// Bill label shown in the invoice dropdown, e.g. "V-001 (₹ 12,000)"
const billLabel = (b: { invoiceNo: string; total: number }) => `${b.invoiceNo} (₹ ${money(b.total)})`

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

// Label + control + error message (no "*" is shown for required fields)
function Field({
  label, optional = false, error, className = '', children,
}: {
  label: string
  required?: boolean
  optional?: boolean
  error?: string
  className?: string
  children: ReactNode
}) {
  return (
    <div className={`min-w-0 ${className}`}>
      <label className="mb-1 block text-[10px] text-slate-400">
        {label}
        {optional && <span className="ml-1 text-slate-500">(Optional)</span>}
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
  icon: Icon, value, onChange, options, placeholder, error, disabled,
}: {
  icon?: ElementType
  value: string
  onChange: (v: string) => void
  options: Option[]
  placeholder?: string
  error?: boolean
  disabled?: boolean
}) {
  return (
    <div className="relative">
      {Icon && <Icon className="pointer-events-none absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-500" />}
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputCls(!!Icon, error)} cursor-pointer appearance-none truncate pr-7 ${value === '' ? 'text-slate-500' : ''}`}
      >
        {placeholder && (
          <option value="" disabled className="bg-[#10131A] text-slate-500">{placeholder}</option>
        )}
        {options.map((o) => (
          <option key={o.value} value={o.value} className="bg-[#10131A] text-white">{o.label}</option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-400" />
    </div>
  )
}

// Date input with a left calendar icon
function DateInput({
  value, onChange, error, max,
}: { value: string; onChange: (v: string) => void; error?: boolean; max?: string }) {
  return (
    <div className="relative">
      <CalendarDays className="pointer-events-none absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-500" />
      <input
        type="date"
        value={value}
        max={max}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputCls(true, error)} scheme-dark`}
      />
    </div>
  )
}

// One number block inside a summary card (label on top, value below)
function Stat({ label, value, valueCls = 'text-white' }: { label: string; value: string; valueCls?: string }) {
  return (
    <div className="min-w-0 px-2.5 first:pl-0 last:pr-0">
      <p className="truncate text-[9px] text-slate-400 sm:text-[10px]">{label}</p>
      <p className={`mt-1 truncate text-xs font-bold sm:text-sm ${valueCls}`}>₹ {value}</p>
    </div>
  )
}

/* ---------- Drawer ---------- */

export default function RecordPaymentModal({
  open, onClose, onSave,
}: {
  open: boolean
  onClose: () => void
  onSave?: (data: RecordPaymentPayload) => void
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
  onSave?: (data: RecordPaymentPayload) => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Vendor & bill
  const [vendor, setVendor] = useState('')
  const [invoiceNo, setInvoiceNo] = useState('')

  // Payment details
  const [amount, setAmount] = useState('')
  const [paymentDate, setPaymentDate] = useState(() => today())
  const [paymentMethod, setPaymentMethod] = useState('')
  const [referenceId, setReferenceId] = useState('')

  // Receipt + notes
  const [receipt, setReceipt] = useState<File | null>(null)
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

  // Only the bills of the selected vendor
  const vendorBills = useMemo(() => BILLS.filter((b) => b.vendor === vendor), [vendor])

  // The selected bill (if any)
  const bill = useMemo(
    () => vendorBills.find((b) => b.invoiceNo === invoiceNo) ?? null,
    [vendorBills, invoiceNo],
  )

  // Bill totals (all calculated)
  const total = bill?.total ?? 0
  const paid = bill?.paid ?? 0
  const outstanding = Math.max(0, total - paid)

  // Payment summary (all calculated)
  const payAmount = toNum(amount)
  const remaining = Math.max(0, outstanding - payAmount)

  // Dropdown options
  const vendorOptions: Option[] = VENDORS.map((v) => ({ value: v, label: v }))
  const billOptions: Option[] = vendorBills.map((b) => ({ value: b.invoiceNo, label: billLabel(b) }))
  const methodOptions: Option[] = PAYMENT_METHODS.map((m) => ({ value: m, label: m }))

  // Vendor change resets the bill. If the vendor has only one bill, select it automatically.
  const onVendorChange = (name: string) => {
    setVendor(name)
    clearErr('vendor')
    const list = BILLS.filter((b) => b.vendor === name)
    if (list.length === 1) onBillChange(list[0].invoiceNo, list)
    else {
      setInvoiceNo('')
      setAmount('')
    }
  }

  // Bill change auto-fills the payment amount with the outstanding balance
  const onBillChange = (no: string, list = vendorBills) => {
    setInvoiceNo(no)
    clearErr('invoiceNo')
    clearErr('amount')
    const found = list.find((b) => b.invoiceNo === no)
    if (found) setAmount(String(Math.max(0, found.total - found.paid)))
  }

  /* ----- File helpers ----- */
  function addFile(list: FileList | null) {
    if (!list || !list[0]) return
    const f = list[0]
    if (!ALLOWED_FILE_TYPES.includes(f.type)) {
      setErrors((p) => ({ ...p, receipt: 'Only PDF, JPG and PNG files are allowed' }))
    } else if (f.size > MAX_FILE_MB * 1024 * 1024) {
      setErrors((p) => ({ ...p, receipt: `File must be under ${MAX_FILE_MB}MB` }))
    } else {
      setReceipt(f)
      clearErr('receipt')
    }
  }
  const onPick = (e: ChangeEvent<HTMLInputElement>) => {
    addFile(e.target.files)
    e.target.value = ''
  }
  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragging(false)
    addFile(e.dataTransfer.files)
  }

  /* ----- Validation + submit ----- */
  function validate() {
    const err: Record<string, string> = {}
    if (!vendor) err.vendor = 'Select a vendor'
    if (!invoiceNo) err.invoiceNo = 'Select an invoice / bill'
    if (!payAmount) err.amount = 'Payment amount is required'
    else if (bill && payAmount > outstanding) err.amount = `Amount cannot be more than outstanding (₹ ${money(outstanding)})`
    if (!paymentDate) err.paymentDate = 'Payment date is required'
    if (!paymentMethod) err.paymentMethod = 'Select a payment method'

    setErrors(err)
    return Object.keys(err).length === 0
  }

  function submit() {
    if (!validate() || !bill) return

    // TODO: call the API here (send as FormData because of the receipt file)
    onSave?.({
      id: Date.now(),
      status: remaining === 0 ? 'Paid' : 'Partially Paid',
      vendor,
      invoiceNo,
      totalAmount: total,
      paidAmount: paid,
      outstanding,
      paymentAmount: payAmount,
      remainingBalance: remaining,
      paymentDate,
      paymentMethod,
      referenceId: referenceId.trim(),
      notes: notes.trim(),
      receipt,
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
              <CreditCard className="h-4 w-4 text-white" />
            </span>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-white">Record Payment</h2>
              <p className="text-[10px] text-slate-400">Add a new payment for vendor bill</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="cursor-pointer rounded-lg p-1.5 text-slate-300 hover:bg-white/5 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className={`mt-2 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain px-3.5 pb-3 sm:px-4 ${noScrollbar}`}>
          {/* ---------- Vendor & bill ---------- */}
          <Section title="Vendor & Bill" icon={Building2}>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Field label="Vendor Name" required error={errors.vendor}>
                <IconSelect
                  icon={Building2}
                  value={vendor}
                  onChange={onVendorChange}
                  options={vendorOptions}
                  placeholder="Select vendor"
                  error={!!errors.vendor}
                />
              </Field>

              <Field label="Invoice / Bill" required error={errors.invoiceNo}>
                <IconSelect
                  icon={FileText}
                  value={invoiceNo}
                  onChange={(v) => onBillChange(v)}
                  options={billOptions}
                  placeholder={vendor ? 'Select invoice / bill' : 'Select vendor first'}
                  error={!!errors.invoiceNo}
                  disabled={!vendor}
                />
              </Field>
            </div>

            {/* Total / Paid / Outstanding */}
            <div className="mt-3 grid grid-cols-3 divide-x divide-[#272D39] rounded-lg border border-[#6C63FF]/30 bg-[#6C63FF]/10 p-3">
              <Stat label="Total Amount" value={money(total)} />
              <Stat label="Paid Amount" value={money(paid)} />
              <Stat label="Outstanding" value={money(outstanding)} valueCls="text-[#4DA3FF]" />
            </div>
          </Section>

          {/* ---------- Payment details ---------- */}
          <Section title="Payment Details" icon={Wallet}>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Field label="Payment Amount (₹)" required error={errors.amount}>
                <RupeeInput
                  value={amount}
                  onChange={(e) => { setAmount(cleanAmount(e.target.value)); clearErr('amount') }}
                  placeholder="0.00"
                  error={!!errors.amount}
                />
              </Field>

              <Field label="Payment Date" required error={errors.paymentDate}>
                <DateInput
                  value={paymentDate}
                  max={today()}
                  onChange={(v) => { setPaymentDate(v); clearErr('paymentDate') }}
                  error={!!errors.paymentDate}
                />
              </Field>

              <Field label="Payment Method" required error={errors.paymentMethod}>
                <IconSelect
                  icon={Landmark}
                  value={paymentMethod}
                  onChange={(v) => { setPaymentMethod(v); clearErr('paymentMethod') }}
                  options={methodOptions}
                  placeholder="Select payment method"
                  error={!!errors.paymentMethod}
                />
              </Field>

              <Field label="Transaction / Reference ID">
                <IconInput
                  icon={Link2}
                  value={referenceId}
                  onChange={(e) => setReferenceId(e.target.value)}
                  placeholder="Enter UTR / transaction number"
                />
              </Field>
            </div>
          </Section>

          {/* ---------- Receipt & notes ---------- */}
          <Section title="Receipt & Notes" icon={Paperclip}>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {/* Upload */}
              <div className="min-w-0">
                <label className="mb-1 flex items-center gap-1.5 text-[10px] text-slate-400">
                  <Paperclip className="h-3 w-3" /> Upload Receipt
                  <span className="text-slate-500">(Optional)</span>
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
                    Drag and drop a file here, or{' '}
                    <span className="text-[#4DA3FF] hover:underline">click to browse</span>
                  </p>
                  <p className="text-[9px] text-slate-500">PDF, JPG, PNG (Max {MAX_FILE_MB} MB)</p>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={onPick}
                  className="hidden"
                />
                {errors.receipt && <p className="mt-1 text-[9px] text-red-400">{errors.receipt}</p>}

                <AnimatePresence initial={false}>
                  {receipt && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2 }}
                      className="mt-2 overflow-hidden"
                    >
                      <div className="flex items-center justify-between gap-2 rounded-md border border-[#272D39] bg-[#0B0E14] px-2.5 py-1.5 text-[10px]">
                        <span className="min-w-0 truncate text-slate-200">{receipt.name}</span>
                        <span className="flex shrink-0 items-center gap-2">
                          <span className="text-slate-500">{fileSize(receipt.size)}</span>
                          <button
                            type="button"
                            onClick={() => setReceipt(null)}
                            aria-label={`Remove ${receipt.name}`}
                            className="cursor-pointer rounded p-0.5 text-slate-400 hover:bg-white/5 hover:text-white"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Notes */}
              <div className="min-w-0">
                <label className="mb-1 flex items-center gap-1.5 text-[10px] text-slate-400">
                  <StickyNote className="h-3 w-3" /> Notes / Remarks
                  <span className="text-slate-500">(Optional)</span>
                </label>
                <div className="relative">
                  <textarea
                    value={notes}
                    maxLength={MAX_NOTES}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={6}
                    placeholder="Add any additional details..."
                    className={`${inputCls()} resize-none pb-6`}
                  />
                  <span className="pointer-events-none absolute bottom-2 right-2.5 text-[10px] text-slate-500">
                    {notes.length}/{MAX_NOTES}
                  </span>
                </div>
              </div>
            </div>
          </Section>

          {/* ---------- Payment summary ---------- */}
          <div className="rounded-xl border border-emerald-500/50 bg-emerald-500/5 p-3.5">
            <h3 className="mb-3 flex items-center gap-2 text-xs font-bold text-emerald-300">
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> Payment Summary
            </h3>
            <div className="grid grid-cols-2 divide-x divide-[#272D39]">
              <div className="min-w-0 pr-3">
                <p className="text-[10px] text-slate-400">Payment Amount</p>
                <p className="mt-1 truncate text-base font-bold text-white">₹ {money(payAmount)}</p>
              </div>
              <div className="min-w-0 pl-3">
                <p className="text-[10px] text-slate-400">Remaining Balance</p>
                <p className="mt-1 truncate text-base font-bold text-emerald-400">₹ {money(remaining)}</p>
              </div>
            </div>
          </div>
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
            <Save className="h-3 w-3" /> Record Payment
          </button>
        </div>
      </motion.form>
    </motion.div>,
    document.body,
  )
}