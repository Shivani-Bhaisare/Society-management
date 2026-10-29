'use client'

import { useEffect, useState } from 'react'
import type { ElementType, ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  X, Wallet, Save, CalendarDays, ChevronDown, IndianRupee, User, Hash,
} from 'lucide-react'
import { incomeEntrySchema } from '@/lib/validations/treasurerIncomeEntry.schema'
import { issuesToErrors } from '@/lib/validations/treasurerValidationHelpers'

/* ---------- Config ---------- */

// TODO: fetch these lists from the API later
const INCOME_CATEGORIES = ['Maintenance', 'Parking', 'Clubhouse', 'Water', 'Electricity', 'Late Fee', 'Other Income']
const PAYMENT_METHODS = ['Cash', 'Cheque', 'Bank Transfer', 'UPI', 'Card']

// Data sent to the page when the drawer is saved
export type IncomeEntryPayload = {
  id: number
  title: string
  category: string
  amount: number
  date: string // yyyy-mm-dd
  method: string
  receivedFrom: string
  reference: string
  notes: string
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
        max={today()}
        onChange={(e) => onChange(e.target.value)}
        onClick={(e) => e.currentTarget.showPicker?.()}
        aria-label="Transaction date"
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0 scheme-dark"
      />
    </div>
  )
}

/* ---------- Drawer ---------- */

export default function AddIncomeEntryModal({
  open, onClose, onSave,
}: {
  open: boolean
  onClose: () => void
  onSave?: (data: IncomeEntryPayload) => void
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
  onSave?: (data: IncomeEntryPayload) => void
}) {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(() => today())
  const [method, setMethod] = useState('')
  const [receivedFrom, setReceivedFrom] = useState('')
  const [reference, setReference] = useState('')
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

  // Validate the whole form with the zod schema (all errors are shown together)
  function validate() {
    const result = incomeEntrySchema.safeParse({
      title,
      category,
      amount,
      date,
      method,
      receivedFrom,
      reference,
      notes,
    })

    if (!result.success) {
      setErrors(issuesToErrors(result.error.issues))
      return false
    }
    setErrors({})
    return true
  }

  function submit() {
    if (!validate()) return

    // TODO: call the API here
    onSave?.({
      id: Date.now(),
      title: title.trim(),
      category,
      amount: Number(amount) || 0,
      date,
      method,
      receivedFrom: receivedFrom.trim(),
      reference: reference.trim(),
      notes: notes.trim(),
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
              <Wallet className="h-4 w-4 text-white" />
            </span>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-white">Add Income</h2>
              <p className="text-[10px] text-slate-400">
                Record a new income transaction for your society.
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
          {/* Income title */}
          <Field label="Income Title" error={errors.title}>
            <input
              value={title}
              onChange={(e) => { setTitle(e.target.value); clearErr('title') }}
              placeholder="e.g. Monthly Maintenance Collection"
              className={inputCls(false, !!errors.title)}
            />
          </Field>

          {/* Category, amount, date, method */}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Field label="Income Category" error={errors.category}>
              <SimpleSelect
                value={category}
                onChange={(v) => { setCategory(v); clearErr('category') }}
                options={INCOME_CATEGORIES}
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

            <Field label="Transaction Date" error={errors.date}>
              <DatePicker
                value={date}
                onChange={(v) => { setDate(v); clearErr('date') }}
                error={!!errors.date}
              />
            </Field>

            <Field label="Payment Method" error={errors.method}>
              <SimpleSelect
                value={method}
                onChange={(v) => { setMethod(v); clearErr('method') }}
                options={PAYMENT_METHODS}
                placeholder="Select payment method"
                error={!!errors.method}
              />
            </Field>
          </div>

          {/* Received from */}
          <Field label="Received From" error={errors.receivedFrom}>
            <IconInput
              icon={User}
              value={receivedFrom}
              onChange={(v) => { setReceivedFrom(v); clearErr('receivedFrom') }}
              placeholder="Resident name / Vendor / Other"
              error={!!errors.receivedFrom}
            />
          </Field>

          {/* Reference */}
          <Field label="Reference / Transaction ID" error={errors.reference}>
            <IconInput
              icon={Hash}
              value={reference}
              onChange={(v) => { setReference(v); clearErr('reference') }}
              placeholder="Enter reference number (optional)"
              error={!!errors.reference}
            />
          </Field>

          {/* Description / notes */}
          <Field label="Description / Notes" error={errors.notes}>
            <textarea
              value={notes}
              onChange={(e) => { setNotes(e.target.value); clearErr('notes') }}
              rows={3}
              placeholder="Add transaction details..."
              className={`${inputCls(false, !!errors.notes)} resize-none`}
            />
          </Field>
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
            <Save className="h-3 w-3" /> Save Income
          </button>
        </div>
      </motion.form>
    </motion.div>,
    document.body,
  )
}