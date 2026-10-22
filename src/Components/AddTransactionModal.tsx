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
  X, FileText, CalendarDays, ChevronDown, Send, Eye, Clock, UploadCloud, Trash2,
  Paperclip, ClipboardList, IndianRupee, Wallet, TrendingUp, TrendingDown, Tag,
  User, Hash, CreditCard, Building2, StickyNote,
} from 'lucide-react'
import {
  transactionSchema,
  transactionDraftSchema,
  validateReceipt,
  todayISO,
  MAX_TITLE,
  MAX_PARTY,
  MAX_REFERENCE,
  MAX_NOTES,
} from '@/lib/validations/transaction.schema'

/* ---------- Config ---------- */

// TODO: fetch these from the API later
const INCOME_CATEGORIES = [
  'Maintenance', 'Sinking Fund', 'Parking', 'Amenity Booking',
  'Penalty / Late Fee', 'Donation', 'Other',
]
const EXPENSE_CATEGORIES = [
  'Security', 'Staff Salary', 'Electricity', 'Water', 'Repairs',
  'Cleaning', 'Lift AMC', 'Garden', 'Other',
]
const PAYMENT_MODES = ['Cash', 'UPI', 'Bank Transfer', 'Cheque', 'Card']
const STATUSES = ['Completed', 'Pending']
const WINGS = ['All / Common', 'A Wing', 'B Wing', 'C Wing', 'D Wing']

type TxnType = 'Income' | 'Expense'

export type TransactionPayload = {
  id: number
  type: TxnType
  title: string
  category: string
  amount: string
  date: string
  paymentMode: string
  reference: string
  party: string
  wing: string
  notes: string
  status: string
  file: File | null
}

const noScrollbar =
  '[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden'

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
      <input {...props} aria-invalid={error || undefined} className={inputCls(true, error)} />
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
        aria-invalid={error || undefined}
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

export default function AddTransactionModal({
  open, onClose, onSave,
}: {
  open: boolean
  onClose: () => void
  onSave?: (data: TransactionPayload) => void
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
  onSave?: (data: TransactionPayload) => void
}) {
  const [type, setType] = useState<TxnType>('Income')
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState(INCOME_CATEGORIES[0])
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(todayISO())
  const [paymentMode, setPaymentMode] = useState('UPI')
  const [reference, setReference] = useState('')
  const [party, setParty] = useState('')
  const [wing, setWing] = useState('All / Common')
  const [notes, setNotes] = useState('')
  const [status, setStatus] = useState('Completed')
  const [file, setFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Used to focus the first invalid field after a failed submit
  const bodyRef = useRef<HTMLDivElement>(null)

  const isIncome = type === 'Income'
  const categories = isIncome ? INCOME_CATEGORIES : EXPENSE_CATEGORIES
  const refRequired = paymentMode !== 'Cash'
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

  // Changing the type also swaps the category list
  function changeType(t: TxnType) {
    setType(t)
    setCategory((t === 'Income' ? INCOME_CATEGORIES : EXPENSE_CATEGORIES)[0])
  }

  /* Attachment */
  function pickFile(list: FileList | null) {
    const f = list?.[0]
    if (!f) return
    const msg = validateReceipt(f)
    if (msg) {
      setFileError(msg)
    } else {
      setFile(f)
      setFileError('')
    }
  }

  // Validate with the zod schema (draft = title only)
  function validate(asDraft: boolean) {
    const values = {
      type, title, category, amount, date, paymentMode,
      reference, party, wing, notes, status,
    }
    const result = (asDraft ? transactionDraftSchema : transactionSchema).safeParse(values)

    if (result.success) {
      setErrors({})
      return true
    }

    // Keep only the first message for every field
    const err: Record<string, string> = {}
    for (const issue of result.error.issues) {
      const key = String(issue.path[0] ?? '')
      if (key && !err[key]) err[key] = issue.message
    }
    setErrors(err)
    return false
  }

  // Scroll to and focus the first invalid field
  function focusFirstError() {
    setTimeout(() => {
      const el = bodyRef.current?.querySelector<HTMLElement>('[aria-invalid="true"]')
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el?.focus({ preventScroll: true })
    }, 50)
  }

  function save(asDraft: boolean) {
    if (!validate(asDraft)) {
      focusFirstError()
      return
    }
    // TODO: call the API here
    onSave?.({
      id: Date.now(),
      type,
      title: title.trim(),
      category,
      amount,
      date,
      paymentMode,
      reference: reference.trim(),
      party: party.trim(),
      wing,
      notes,
      status: asDraft ? 'Draft' : status,
      file,
    })
    onClose()
  }

  const amountNum = Number(amount) || 0

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
          save(false)
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
              <Wallet className="h-4 w-4 text-white" />
            </span>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-white">Add Transaction</h2>
              <p className="text-[10px] text-slate-400">Record society income or expense</p>
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
            {/* Section 1: Transaction Details */}
            <SectionHead first icon={ClipboardList} title="Transaction Details" sub="Type, title and category" />

            <Field label="Transaction Type">
              <div className="grid grid-cols-2 gap-1 rounded-md border border-[#272D39] bg-[#0B0E14] p-0.5">
                <button
                  type="button"
                  onClick={() => changeType('Income')}
                  className={`flex cursor-pointer items-center justify-center gap-1.5 rounded py-1.5 text-[11px] transition-colors ${
                    isIncome
                      ? 'bg-emerald-500/20 font-semibold text-emerald-400'
                      : 'text-slate-400 hover:bg-white/5'
                  }`}
                >
                  <TrendingUp className="h-3 w-3" /> Income
                </button>
                <button
                  type="button"
                  onClick={() => changeType('Expense')}
                  className={`flex cursor-pointer items-center justify-center gap-1.5 rounded py-1.5 text-[11px] transition-colors ${
                    !isIncome
                      ? 'bg-red-500/20 font-semibold text-red-400'
                      : 'text-slate-400 hover:bg-white/5'
                  }`}
                >
                  <TrendingDown className="h-3 w-3" /> Expense
                </button>
              </div>
            </Field>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Transaction Title" error={errors.title}>
                <IconInput
                  icon={FileText}
                  value={title}
                  maxLength={MAX_TITLE}
                  onChange={(e) => { setTitle(e.target.value); clearErr('title') }}
                  error={!!errors.title}
                  placeholder={isIncome ? 'e.g. October maintenance' : 'e.g. Security salary'}
                />
              </Field>

              <Field label="Category" error={errors.category}>
                <IconSelect
                  icon={Tag}
                  value={category}
                  onChange={(e) => { setCategory(e.target.value); clearErr('category') }}
                  error={!!errors.category}
                  options={categories}
                />
              </Field>
            </div>

            {/* Section 2: Amount & Payment */}
            <SectionHead icon={IndianRupee} title="Amount & Payment" sub="Amount, date and payment mode" />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Amount" error={errors.amount}>
                <IconInput
                  icon={IndianRupee}
                  type="number"
                  min="0"
                  step="0.01"
                  inputMode="decimal"
                  value={amount}
                  onKeyDown={(e) => {
                    // Block characters that are valid in number inputs but not in an amount
                    if (['e', 'E', '+', '-'].includes(e.key)) e.preventDefault()
                  }}
                  onChange={(e) => { setAmount(e.target.value); clearErr('amount') }}
                  error={!!errors.amount}
                  placeholder="e.g. 25000"
                />
              </Field>

              <Field label="Transaction Date" error={errors.date}>
                <DateInput
                  value={date}
                  max={today}
                  onChange={(e) => { setDate(e.target.value); clearErr('date') }}
                  error={!!errors.date}
                />
              </Field>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Payment Mode" error={errors.paymentMode}>
                <IconSelect
                  icon={CreditCard}
                  value={paymentMode}
                  onChange={(e) => {
                    setPaymentMode(e.target.value)
                    clearErr('paymentMode')
                    clearErr('reference')
                  }}
                  error={!!errors.paymentMode}
                  options={PAYMENT_MODES}
                />
              </Field>

              <Field
                label="Reference No."
                hint={refRequired ? undefined : 'Optional'}
                error={errors.reference}
              >
                <IconInput
                  icon={Hash}
                  value={reference}
                  maxLength={MAX_REFERENCE}
                  onChange={(e) => { setReference(e.target.value); clearErr('reference') }}
                  error={!!errors.reference}
                  placeholder="UPI ID / Cheque / Txn no."
                />
              </Field>
            </div>

            {/* Section 3: Party */}
            <SectionHead
              icon={User}
              title={isIncome ? 'Received From' : 'Paid To'}
              sub={isIncome ? 'Who paid the society' : 'Who got the payment'}
            />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field
                label={isIncome ? 'Received From' : 'Paid To'}
                hint="Optional"
                error={errors.party}
              >
                <IconInput
                  icon={User}
                  value={party}
                  maxLength={MAX_PARTY}
                  onChange={(e) => { setParty(e.target.value); clearErr('party') }}
                  error={!!errors.party}
                  placeholder={isIncome ? 'e.g. Raj Sharma (A-101)' : 'e.g. ABC Security Services'}
                />
              </Field>

              <Field label="Wing" hint="Optional">
                <IconSelect
                  icon={Building2}
                  value={wing}
                  onChange={(e) => setWing(e.target.value)}
                  options={WINGS}
                />
              </Field>
            </div>

            {/* Section 4: Notes */}
            <SectionHead icon={StickyNote} title="Notes" sub="Extra details about this transaction" />

            <Field label="Description" hint="Optional" error={errors.notes}>
              <div className="overflow-hidden rounded-md border border-[#272D39] bg-[#0B0E14] transition-colors focus-within:border-[#6C63FF]">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value.slice(0, MAX_NOTES))}
                  placeholder="Add any details or remarks..."
                  className={`block min-h-20 max-h-40 w-full resize-none bg-transparent px-2.5 py-2 text-[11px] text-white outline-none placeholder:text-slate-500 ${noScrollbar}`}
                />
              </div>
              <p className="mt-1 text-right text-[9px] text-slate-500">
                {notes.length}/{MAX_NOTES}
              </p>
            </Field>

            {/* Section 5: Attachment & Status */}
            <SectionHead icon={Paperclip} title="Attachment & Status" sub="Attach receipt and set status" />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Receipt / Invoice" hint="Optional" error={fileError}>
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

              <Field label="Status" error={errors.status}>
                <IconSelect
                  icon={Send}
                  value={status}
                  onChange={(e) => { setStatus(e.target.value); clearErr('status') }}
                  error={!!errors.status}
                  options={STATUSES}
                />
              </Field>
            </div>

            {/* Section 6: Preview */}
            <SectionHead icon={Eye} title="Transaction Preview" sub="This is how the entry will appear in accounts" />

            <div className="rounded-lg border border-[#272D39] bg-[#0B0E14] p-3">
              <div className="flex items-start gap-2.5">
                <span
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                    isIncome ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                  }`}
                >
                  {isIncome ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-bold">{title.trim() || 'Transaction Title'}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <span className="rounded-full bg-[#6C63FF]/20 px-2 py-0.5 text-[9px] font-medium text-[#A29CFF]">
                      {category}
                    </span>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[9px] font-medium ${
                        status === 'Completed'
                          ? 'bg-emerald-500/15 text-emerald-400'
                          : 'bg-amber-500/15 text-amber-400'
                      }`}
                    >
                      {status}
                    </span>
                  </div>
                </div>
                <p className={`max-w-28 shrink-0 truncate text-sm font-bold ${isIncome ? 'text-emerald-400' : 'text-red-400'}`}>
                  {isIncome ? '+' : '-'} ₹ {amountNum.toLocaleString('en-IN')}
                </p>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-3 border-y border-[#272D39] py-2.5 min-[400px]:grid-cols-2">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  <div className="min-w-0">
                    <p className="truncate text-[10px] font-medium">{fmt(date)}</p>
                    <p className="text-[9px] text-slate-500">Date</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  <div className="min-w-0">
                    <p className="truncate text-[10px] font-medium">{paymentMode}</p>
                    <p className="text-[9px] text-slate-500">Payment Mode</p>
                  </div>
                </div>
              </div>

              <div className="mt-2.5 flex items-center justify-between gap-2 text-[10px]">
                <span className="shrink-0 text-slate-400">{isIncome ? 'Received From' : 'Paid To'}</span>
                <span className="min-w-0 truncate text-right font-medium">{party.trim() || '--'}</span>
              </div>

              <p className="mt-2 line-clamp-2 whitespace-pre-line break-words text-[10px] leading-relaxed text-slate-400">
                {notes.trim() ||
                  'This is a preview of your transaction. Details will appear here as you fill the form.'}
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
            onClick={() => save(true)}
            className="cursor-pointer rounded-md border border-[#272D39] px-3.5 py-2 text-[11px] font-semibold text-white hover:bg-white/5 sm:py-1.5"
          >
            Save as Draft
          </button>
          <button
            type="button"
            onClick={() => save(false)}
            className="col-span-2 flex cursor-pointer items-center justify-center gap-1.5 rounded-md bg-linear-to-r from-[#6C63FF] to-[#4DA3FF] px-4 py-2 text-[11px] font-semibold text-white hover:opacity-90 sm:col-span-1 sm:py-1.5"
          >
            <Send className="h-3 w-3" /> Add Transaction
          </button>
        </div>
      </motion.form>
    </motion.div>,
    document.body,
  )
}