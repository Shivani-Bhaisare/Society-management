'use client'

import { useEffect, useMemo, useState } from 'react'
import type { ElementType, ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  X, Receipt, Save, CalendarDays, ChevronDown, IndianRupee, Percent, BarChart3, Eye,
} from 'lucide-react'

/* ---------- Config ---------- */

// TODO: fetch these lists from the API later
const CHARGE_HEADS = ['Maintenance', 'Parking', 'Water', 'Electricity', 'Clubhouse', 'Others']
const FREQUENCIES = ['One Time', 'Daily', 'Weekly', 'Monthly', 'Quarterly', 'Yearly']

const MAX_NAME = 100
const MAX_NOTES = 500

type FeeType = 'Fixed' | 'Percentage' | 'Interest'
type ApplyTo = 'All' | 'Selected'

const FEE_TYPES: { key: FeeType; label: string; sub: string; icon: ElementType }[] = [
  { key: 'Fixed', label: 'Fixed Amount', sub: 'Flat amount per period', icon: IndianRupee },
  { key: 'Percentage', label: 'Percentage', sub: '% of outstanding amount', icon: Percent },
  { key: 'Interest', label: 'Interest', sub: 'Interest on overdue', icon: BarChart3 },
]

// Data sent to the page when the drawer is saved
export type AddLateFeeRulePayload = {
  id: number
  name: string
  chargeHead: string
  graceDays: number
  feeType: FeeType
  rate: number
  frequency: string
  effectiveFrom: string
  applyTo: ApplyTo
  units: string
  active: boolean
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

// "Monthly" -> "monthly" (used in the preview sentence)
const freqWord = (f: string) => (f === 'One Time' ? 'once' : f.toLowerCase())

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

// Input with a fixed unit box on the right (days / rupee / percent)
function SuffixInput({
  value, onChange, placeholder, suffix, error, inputMode = 'decimal',
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  suffix: ReactNode
  error?: boolean
  inputMode?: 'decimal' | 'numeric'
}) {
  return (
    <div
      className={`flex overflow-hidden rounded-md border bg-[#0B0E14] transition-colors focus-within:border-[#6C63FF] ${
        error ? 'border-red-500/60' : 'border-[#272D39]'
      }`}
    >
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        className="min-w-0 flex-1 bg-transparent px-2.5 py-2 text-[11px] text-white outline-none placeholder:text-slate-500"
      />
      <span className="flex min-w-8 shrink-0 items-center justify-center border-l border-[#272D39] px-2 text-[11px] text-slate-400">
        {suffix}
      </span>
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
        aria-label="Effective from"
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0 scheme-dark"
      />
    </div>
  )
}

/* ---------- Drawer ---------- */

export default function AddLateFeeRuleModal({
  open, onClose, onSave,
}: {
  open: boolean
  onClose: () => void
  onSave?: (data: AddLateFeeRulePayload) => void
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
  onSave?: (data: AddLateFeeRulePayload) => void
}) {
  const [name, setName] = useState('')
  const [chargeHead, setChargeHead] = useState('')
  const [grace, setGrace] = useState('0')
  const [feeType, setFeeType] = useState<FeeType>('Fixed')
  const [rate, setRate] = useState('0')
  const [frequency, setFrequency] = useState('Monthly')
  const [effectiveFrom, setEffectiveFrom] = useState(() => today())
  const [applyTo, setApplyTo] = useState<ApplyTo>('All')
  const [units, setUnits] = useState('')
  const [active, setActive] = useState(true)
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

  // Rate unit: rupee for fixed amount, percent for the other two
  const rateSuffix = feeType === 'Fixed' ? <IndianRupee className="h-3 w-3" /> : '%'

  // Live preview sentence
  const preview = useMemo(() => {
    const g = Number(grace) || 0
    const r = rate || '0'
    const amt = feeType === 'Fixed' ? `₹${r}` : `${r}%`
    const what = feeType === 'Interest' ? `${amt} interest` : amt
    return `After ${g} grace ${g === 1 ? 'day' : 'days'}, charge ${what} ${freqWord(frequency)} on overdue amount.`
  }, [grace, rate, feeType, frequency])

  /* ----- Validation + submit ----- */
  function validate() {
    const err: Record<string, string> = {}
    if (!name.trim()) err.name = 'Rule name is required'
    if (!chargeHead) err.chargeHead = 'Select a charge head'
    if (grace === '') err.grace = 'Enter grace period'
    if (!(Number(rate) > 0)) err.rate = 'Enter a rate / amount'
    else if (feeType !== 'Fixed' && Number(rate) > 100) err.rate = 'Cannot be more than 100%'
    if (!effectiveFrom) err.effectiveFrom = 'Select a date'
    if (applyTo === 'Selected' && !units.trim()) err.units = 'Enter at least one unit'
    setErrors(err)
    return Object.keys(err).length === 0
  }

  function submit() {
    if (!validate()) return

    // TODO: call the API here
    onSave?.({
      id: Date.now(),
      name: name.trim(),
      chargeHead,
      graceDays: Number(grace) || 0,
      feeType,
      rate: Number(rate) || 0,
      frequency,
      effectiveFrom,
      applyTo,
      units: applyTo === 'Selected' ? units.trim() : '',
      active,
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
        className="flex h-full w-full max-w-2xl flex-col overflow-hidden rounded-l-2xl border border-r-0 border-[#272D39] bg-[#10131A] text-white shadow-2xl"
      >
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between gap-3 p-3.5 pb-2 sm:p-4 sm:pb-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-[#6C63FF] to-[#4DA3FF]">
              <Receipt className="h-4 w-4 text-white" />
            </span>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-white">Create Late Fee Rule</h2>
              <p className="text-[10px] text-slate-400">
                Configure late payment rules for maintenance charges, parking, utilities and more.
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
          {/* Rule name + Charge head */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Rule Name" error={errors.name}>
              <input
                value={name}
                maxLength={MAX_NAME}
                onChange={(e) => { setName(e.target.value); clearErr('name') }}
                placeholder="e.g. Maintenance Late Fee"
                className={inputCls(false, !!errors.name)}
              />
              <p className="mt-1 text-right text-[10px] text-slate-500">{name.length}/{MAX_NAME}</p>
            </Field>

            <Field label="Charge Head" error={errors.chargeHead}>
              <SimpleSelect
                value={chargeHead}
                onChange={(v) => { setChargeHead(v); clearErr('chargeHead') }}
                options={CHARGE_HEADS}
                placeholder="Select charge head"
                error={!!errors.chargeHead}
              />
            </Field>
          </div>

          {/* Grace period + Fee type */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
            <Field label="Grace Period" error={errors.grace}>
              <SuffixInput
                value={grace}
                onChange={(v) => { setGrace(v.replace(/[^0-9]/g, '')); clearErr('grace') }}
                placeholder="0"
                suffix="days"
                inputMode="numeric"
                error={!!errors.grace}
              />
            </Field>

            <Field label="Fee Type">
              <div className="grid grid-cols-3 gap-2">
                {FEE_TYPES.map(({ key, label, sub, icon: Icon }) => {
                  const active = key === feeType
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => { setFeeType(key); clearErr('rate') }}
                      aria-pressed={active}
                      className={`flex min-w-0 cursor-pointer flex-col items-center justify-center gap-1 rounded-md border px-1.5 py-2.5 text-center transition-colors ${
                        active
                          ? 'border-[#4DA3FF] bg-[#4DA3FF]/10'
                          : 'border-[#272D39] bg-[#0B0E14] hover:bg-white/3'
                      }`}
                    >
                      <Icon className={`h-4 w-4 ${active ? 'text-[#4DA3FF]' : 'text-slate-400'}`} />
                      <span className={`text-[11px] font-semibold ${active ? 'text-white' : 'text-slate-200'}`}>
                        {label}
                      </span>
                      <span className="text-[9px] leading-tight text-slate-500">{sub}</span>
                    </button>
                  )
                })}
              </div>
            </Field>
          </div>

          {/* Rate + Frequency */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Rate / Amount" error={errors.rate}>
              <SuffixInput
                value={rate}
                onChange={(v) => { setRate(cleanAmount(v)); clearErr('rate') }}
                placeholder="0"
                suffix={rateSuffix}
                error={!!errors.rate}
              />
            </Field>

            <Field label="Frequency">
              <SimpleSelect value={frequency} onChange={setFrequency} options={FREQUENCIES} />
            </Field>
          </div>

          {/* Effective from + Apply to */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Effective From" error={errors.effectiveFrom}>
              <DatePicker
                value={effectiveFrom}
                onChange={(v) => { setEffectiveFrom(v); clearErr('effectiveFrom') }}
                error={!!errors.effectiveFrom}
              />
            </Field>

            <Field label="Apply To" error={errors.units}>
              <div className="flex h-8.5 items-center gap-5">
                {([
                  { key: 'All', label: 'All residents' },
                  { key: 'Selected', label: 'Selected units' },
                ] as const).map(({ key, label }) => (
                  <label key={key} className="flex cursor-pointer items-center gap-2 text-[11px] text-slate-200">
                    <input
                      type="radio"
                      name="applyTo"
                      checked={applyTo === key}
                      onChange={() => { setApplyTo(key); clearErr('units') }}
                      className="h-3.5 w-3.5 cursor-pointer accent-[#4DA3FF]"
                    />
                    {label}
                  </label>
                ))}
              </div>
              {applyTo === 'Selected' && (
                <input
                  value={units}
                  onChange={(e) => { setUnits(e.target.value); clearErr('units') }}
                  placeholder="e.g. A-101, A-102, B-204"
                  className={`${inputCls(false, !!errors.units)} mt-2`}
                />
              )}
            </Field>
          </div>

          {/* Status */}
          <div>
            <p className="mb-1.5 text-[10px] text-slate-400">Status</p>
            <div className="flex items-start gap-3">
              <button
                type="button"
                role="switch"
                aria-checked={active}
                aria-label="Rule status"
                onClick={() => setActive((v) => !v)}
                className={`relative mt-0.5 h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors ${
                  active ? 'bg-[#6C63FF]' : 'bg-[#272D39]'
                }`}
              >
                <span
                  className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
                    active ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-white">{active ? 'Active' : 'Inactive'}</p>
                <p className="text-[10px] text-slate-400">
                  {active
                    ? 'Rule will be applied to new charges and existing dues.'
                    : 'Rule will be saved but not applied to any charges.'}
                </p>
              </div>
            </div>
          </div>

          {/* Description / notes */}
          <Field label="Description / Notes">
            <textarea
              value={notes}
              maxLength={MAX_NOTES}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Add any additional notes or details about this rule..."
              className={`${inputCls()} resize-none`}
            />
            <p className="mt-1 text-right text-[10px] text-slate-500">{notes.length}/{MAX_NOTES}</p>
          </Field>

          {/* Rule preview */}
          <div className="rounded-xl border border-[#272D39] p-3.5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="flex items-center gap-2 text-xs font-bold">
                <Eye className="h-3.5 w-3.5 text-[#A29CFF]" /> Rule Preview
              </h3>
              <span className="rounded-full bg-[#4DA3FF]/20 px-2.5 py-0.5 text-[10px] font-medium text-[#7DBBFF]">
                {frequency}
              </span>
            </div>
            <p className="mt-2 text-[10px] leading-relaxed text-slate-300">{preview}</p>
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
            <Save className="h-3 w-3" /> Save Rule
          </button>
        </div>
      </motion.form>
    </motion.div>,
    document.body,
  )
}