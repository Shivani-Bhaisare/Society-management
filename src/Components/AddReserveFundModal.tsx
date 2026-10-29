'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import type { ChangeEvent, DragEvent, ElementType, InputHTMLAttributes, ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  X, Landmark, CalendarDays, ChevronDown, IndianRupee, UploadCloud, FilePlus2, ClipboardList,
} from 'lucide-react'
import {
  buildReserveFundSchema,
  ALLOWED_FILE_TYPES,
  MAX_FILE_MB,
} from '@/lib/validations/treasurerReserveFund.schema'
import { issuesToErrors } from '@/lib/validations/treasurerValidationHelpers'

/* ---------- Config ---------- */

// TODO: fetch these lists from the API later
const FUND_TYPES = ['Sinking Fund', 'Reserve Fund', 'Emergency Fund', 'Major Repairs', 'Other']
const FREQUENCIES = ['Monthly', 'Quarterly', 'Half-Yearly', 'Yearly']
const COMMITTEES = ['Managing Committee', 'Finance Committee', 'Maintenance Committee', 'Audit Committee']

const MAX_DESC = 500

// Schema is built once, with the same lists the dropdowns use
const fundSchema = buildReserveFundSchema({
  fundTypes: FUND_TYPES,
  frequencies: FREQUENCIES,
  committees: COMMITTEES,
})

// Data sent to the page when the fund is created
export type AddReserveFundPayload = {
  id: number
  name: string
  fundType: string
  targetAmount: number
  openingBalance: number
  monthlyContribution: number
  frequency: string
  startDate: string // yyyy-mm-dd
  targetDate: string // yyyy-mm-dd
  committee: string
  bankReference: string
  active: boolean
  description: string
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

// 2500000 -> "₹ 25,00,000"
const rupees = (n: number) => `₹ ${n.toLocaleString('en-IN')}`

// "2025-04-01" -> "01 Apr 2025"
const prettyDate = (v: string, placeholder: string) =>
  v
    ? new Date(`${v}T00:00:00`).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : placeholder

/* ---------- Styles ---------- */
/* bg: #10131A | input bg: #0B0E14 | border: #272D39 | accent: #6C63FF / #A29CFF */

const inputCls = (icon = false, error = false) =>
  `w-full rounded-md border bg-[#0B0E14] py-2 text-[11px] text-white outline-none transition-colors placeholder:text-slate-500 focus:border-[#6C63FF] disabled:cursor-not-allowed disabled:opacity-40 ${
    error ? 'border-red-500/60' : 'border-[#272D39]'
  } ${icon ? 'pl-8 pr-2.5' : 'px-2.5'}`

/* ---------- Small reusable pieces ---------- */

// Label + control + error message
function Field({
  label, optional = false, error, className = '', children,
}: {
  label: string
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

// Amount input with the rupee icon on the left
function RupeeInput({ error, ...props }: { error?: boolean } & InputHTMLAttributes<HTMLInputElement>) {
  return <IconInput icon={IndianRupee} error={error} inputMode="decimal" {...props} />
}

// Select with an optional placeholder and a custom chevron
function SimpleSelect({
  value, onChange, options, placeholder, error,
}: {
  value: string
  onChange: (v: string) => void
  options: readonly string[]
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

// Date field: shows "01 Apr 2025" while the real date picker sits invisibly on top
function DateBox({
  value, onChange, label, placeholder, error, min, max,
}: {
  value: string
  onChange: (v: string) => void
  label: string
  placeholder: string
  error?: boolean
  min?: string
  max?: string
}) {
  return (
    <div className="relative min-w-0">
      <CalendarDays className="pointer-events-none absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-500" />
      <div className={`${inputCls(true, error)} truncate ${value ? 'text-white' : 'text-slate-500'}`}>
        {prettyDate(value, placeholder)}
      </div>
      <input
        type="date"
        value={value}
        min={min}
        max={max}
        onChange={(e) => onChange(e.target.value)}
        onClick={(e) => e.currentTarget.showPicker?.()}
        aria-label={label}
        className="absolute inset-0 h-full w-full cursor-pointer opacity-0 scheme-dark"
      />
    </div>
  )
}

/* ---------- Drawer ---------- */

export default function AddReserveFundModal({
  open, onClose, onSave,
}: {
  open: boolean
  onClose: () => void
  onSave?: (data: AddReserveFundPayload) => void
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
  onSave?: (data: AddReserveFundPayload) => void
}) {
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [name, setName] = useState('')
  const [fundType, setFundType] = useState(FUND_TYPES[0])
  const [targetAmount, setTargetAmount] = useState('')
  const [openingBalance, setOpeningBalance] = useState('')
  const [monthly, setMonthly] = useState('')
  const [frequency, setFrequency] = useState(FREQUENCIES[0])
  const [startDate, setStartDate] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const [committee, setCommittee] = useState('')
  const [bankReference, setBankReference] = useState('')
  const [active, setActive] = useState(true)
  const [description, setDescription] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)

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

  // Live fund summary (estimated)
  const summary = useMemo(() => {
    const target = Number(targetAmount) || 0
    const opening = Number(openingBalance) || 0
    return { target, opening, remaining: Math.max(0, target - opening) }
  }, [targetAmount, openingBalance])

  /* ----- File helpers ----- */
  // A wrong file is rejected right away (same rules as the schema), a good file is kept
  function addFile(f: File | undefined) {
    if (!f) return
    if (!ALLOWED_FILE_TYPES.includes(f.type)) {
      setErrors((p) => ({ ...p, file: 'Only PDF, JPG and PNG files are allowed' }))
      return
    }
    if (f.size === 0) {
      setErrors((p) => ({ ...p, file: 'This file is empty' }))
      return
    }
    if (f.size > MAX_FILE_MB * 1024 * 1024) {
      setErrors((p) => ({ ...p, file: `File must be under ${MAX_FILE_MB}MB` }))
      return
    }
    setFile(f)
    clearErr('file')
  }
  const onPick = (e: ChangeEvent<HTMLInputElement>) => {
    addFile(e.target.files?.[0])
    e.target.value = ''
  }
  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    setDragging(false)
    addFile(e.dataTransfer.files?.[0])
  }

  /* ----- Validation + submit ----- */
  // Validate the whole form with the zod schema (all errors are shown together)
  function validate() {
    const result = fundSchema.safeParse({
      name,
      fundType,
      targetAmount,
      openingBalance,
      monthly,
      frequency,
      startDate,
      targetDate,
      committee,
      bankReference,
      description,
      file: file ? { type: file.type, size: file.size } : null,
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

    // TODO: call the API here (send as FormData because of the file)
    onSave?.({
      id: Date.now(),
      name: name.trim(),
      fundType,
      targetAmount: summary.target,
      openingBalance: summary.opening,
      monthlyContribution: Number(monthly) || 0,
      frequency,
      startDate,
      targetDate,
      committee,
      bankReference: bankReference.trim(),
      active,
      description: description.trim(),
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
        <div className="flex shrink-0 items-start justify-between gap-3 border-b border-[#272D39] p-3.5 sm:p-4">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-[#6C63FF] to-[#4DA3FF]">
              <Landmark className="h-4 w-4 text-white" />
            </span>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-white">Create Reserve Fund</h2>
              <p className="text-[10px] text-slate-400">Set up a fund for planned repairs and major expenses</p>
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
        <div className={`flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain px-3.5 py-4 text-white sm:px-4 ${noScrollbar}`}>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Fund Name" error={errors.name}>
              <input
                value={name}
                onChange={(e) => { setName(e.target.value); clearErr('name') }}
                placeholder="e.g. Building Maintenance Fund"
                className={inputCls(false, !!errors.name)}
              />
            </Field>

            <Field label="Fund Type" error={errors.fundType}>
              <SimpleSelect
                value={fundType}
                onChange={(v) => { setFundType(v); clearErr('fundType') }}
                options={FUND_TYPES}
                error={!!errors.fundType}
              />
            </Field>

            <Field label="Target Amount" error={errors.targetAmount}>
              <RupeeInput
                value={targetAmount}
                onChange={(e) => {
                  setTargetAmount(cleanAmount(e.target.value))
                  clearErr('targetAmount')
                  clearErr('openingBalance')
                  clearErr('monthly')
                }}
                placeholder="Enter target amount"
                error={!!errors.targetAmount}
              />
            </Field>

            <Field label="Opening Balance" optional error={errors.openingBalance}>
              <RupeeInput
                value={openingBalance}
                onChange={(e) => { setOpeningBalance(cleanAmount(e.target.value)); clearErr('openingBalance') }}
                placeholder="Enter opening balance"
                error={!!errors.openingBalance}
              />
            </Field>

            <Field label="Monthly Contribution" error={errors.monthly}>
              <RupeeInput
                value={monthly}
                onChange={(e) => { setMonthly(cleanAmount(e.target.value)); clearErr('monthly') }}
                placeholder="Enter monthly contribution"
                error={!!errors.monthly}
              />
            </Field>

            <Field label="Contribution Frequency" error={errors.frequency}>
              <SimpleSelect
                value={frequency}
                onChange={(v) => { setFrequency(v); clearErr('frequency') }}
                options={FREQUENCIES}
                error={!!errors.frequency}
              />
            </Field>

            <Field label="Start Date" error={errors.startDate}>
              <DateBox
                label="Start date"
                placeholder="Select start date"
                value={startDate}
                min="2000-01-01"
                max="2100-12-31"
                onChange={(v) => { setStartDate(v); clearErr('startDate'); clearErr('targetDate') }}
                error={!!errors.startDate}
              />
            </Field>

            <Field label="Target Date" error={errors.targetDate}>
              <DateBox
                label="Target date"
                placeholder="Select target date"
                value={targetDate}
                min={startDate || '2000-01-01'}
                max="2100-12-31"
                onChange={(v) => { setTargetDate(v); clearErr('targetDate') }}
                error={!!errors.targetDate}
              />
            </Field>

            <Field label="Responsible Committee" error={errors.committee}>
              <SimpleSelect
                value={committee}
                onChange={(v) => { setCommittee(v); clearErr('committee') }}
                options={COMMITTEES}
                placeholder="Select committee"
                error={!!errors.committee}
              />
            </Field>

            <Field label="Account / Bank Reference" optional error={errors.bankReference}>
              <IconInput
                icon={Landmark}
                value={bankReference}
                onChange={(e) => { setBankReference(e.target.value); clearErr('bankReference') }}
                placeholder="Enter account or bank reference"
                error={!!errors.bankReference}
              />
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
                aria-label="Fund status"
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
                    ? 'Fund will be active and accepting contributions'
                    : 'Fund will be saved but will not accept contributions'}
                </p>
              </div>
            </div>
          </div>

          {/* Description / purpose */}
          <Field label="Description / Purpose" error={errors.description}>
            <textarea
              value={description}
              maxLength={MAX_DESC}
              onChange={(e) => { setDescription(e.target.value); clearErr('description') }}
              rows={4}
              placeholder="Enter fund purpose and details..."
              className={`${inputCls(false, !!errors.description)} resize-y`}
            />
            <p className="mt-1 text-right text-[9px] text-slate-500">{description.length}/{MAX_DESC}</p>
          </Field>

          {/* Upload resolution / approval document */}
          <Field label="Upload Resolution / Approval Document" optional error={errors.file}>
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
              className={`flex cursor-pointer items-center justify-center gap-3 rounded-md border border-dashed px-3 py-4 text-left transition-colors ${
                dragging
                  ? 'border-[#6C63FF] bg-[#6C63FF]/10'
                  : errors.file
                    ? 'border-red-500/60 bg-[#0B0E14] hover:bg-white/3'
                    : 'border-[#6C63FF]/50 bg-[#0B0E14] hover:bg-white/3'
              }`}
            >
              <UploadCloud className="h-6 w-6 shrink-0 text-[#4DA3FF]" />
              <div className="min-w-0">
                {file ? (
                  <>
                    <p className="truncate text-[11px] font-semibold text-white">{file.name}</p>
                    <button
                      type="button"
                      onClick={(e) => { e.stopPropagation(); setFile(null); clearErr('file') }}
                      className="cursor-pointer text-[10px] text-red-400 hover:underline"
                    >
                      Remove file
                    </button>
                  </>
                ) : (
                  <>
                    <p className="text-[11px] text-slate-400">
                      <span className="font-semibold text-white">Click to upload</span> or drag and drop
                    </p>
                    <p className="text-[9px] text-slate-500">PDF, JPG, PNG (Max {MAX_FILE_MB}MB)</p>
                  </>
                )}
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={onPick}
              className="hidden"
            />
          </Field>

          {/* Fund summary (estimated) */}
          <div className="rounded-xl border border-teal-500/50 bg-teal-500/5 p-3.5">
            <h3 className="mb-3 flex items-center gap-2 text-xs font-bold">
              <ClipboardList className="h-3.5 w-3.5 text-teal-400" /> Fund Summary
              <span className="text-[10px] font-normal text-slate-400">(Estimated)</span>
            </h3>
            <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-3 min-[420px]:gap-0">
              <div className="min-w-0 min-[420px]:pr-3">
                <p className="text-[10px] text-slate-400">Target Amount</p>
                <p className="mt-0.5 truncate text-sm font-bold text-teal-300">{rupees(summary.target)}</p>
              </div>
              <div className="min-w-0 min-[420px]:border-l min-[420px]:border-[#272D39] min-[420px]:px-3">
                <p className="text-[10px] text-slate-400">Current Balance</p>
                <p className="mt-0.5 truncate text-sm font-bold text-white">{rupees(summary.opening)}</p>
              </div>
              <div className="min-w-0 min-[420px]:border-l min-[420px]:border-[#272D39] min-[420px]:pl-3">
                <p className="text-[10px] text-slate-400">Remaining Target</p>
                <p className="mt-0.5 truncate text-sm font-bold text-teal-300">{rupees(summary.remaining)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer: two equal buttons on mobile, small right-aligned buttons from sm and up */}
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
            <FilePlus2 className="h-3 w-3" /> Create Fund
          </button>
        </div>
      </motion.form>
    </motion.div>,
    document.body,
  )
}