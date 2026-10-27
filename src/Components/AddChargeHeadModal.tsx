'use client'

import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  X, ListChecks, ChevronDown, Info, ArrowRight, ArrowLeft, Check,
  Tag, Calculator, CalendarDays, Users, Percent, IndianRupee,
} from 'lucide-react'

/* ---------- Config ---------- */

// TODO: fetch these from the API later
const CALC_TYPES = [
  { label: 'Fixed Amount', method: 'Fixed' },
  { label: 'Percentage', method: 'Percentage' },
  { label: 'Per Sq. Ft.', method: 'Per Sq. Ft.' },
] as const

const FREQUENCIES = ['Monthly', 'Quarterly', 'Half Yearly', 'Yearly']
const APPLICABLE_TO = ['All Flats', 'Selected Wings', 'Selected Flats']
const TAX_OPTIONS = ['As applicable', 'No Tax', 'GST 18%']
const WINGS = ['A', 'B', 'C']
const FLATS = ['A-101', 'A-102', 'B-201', 'B-202', 'C-101']

const STEPS = ['Basic Details', 'Applicable Flats', 'Settings & Review']

export type ChargeMethod = (typeof CALC_TYPES)[number]['method']

export type AddChargeHeadPayload = {
  id: number
  name: string
  code: string
  method: ChargeMethod
  value: number
  freq: string
  appliesTo: string
  wings: string[]
  flats: string[]
  tax: string
  description: string
  active: boolean
}

const noScrollbar =
  '[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden'

/* ---------- Styles ---------- */
/* bg: #10131A | input bg: #0B0E14 | border: #272D39 | accent: #6C63FF / #A29CFF */

const inputCls = (icon = false, error = false) =>
  `w-full rounded-md border bg-[#0B0E14] py-2 text-[11px] text-white outline-none transition-colors placeholder:text-slate-500 focus:border-[#6C63FF] disabled:cursor-not-allowed disabled:opacity-40 ${
    error ? 'border-red-500/60' : 'border-[#272D39]'
  } ${icon ? 'pl-8 pr-2.5' : 'px-2.5'}`

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

// Text input with a left icon
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

// Select with a left icon and a custom chevron
function IconSelect({
  icon: Icon, value, onChange, options,
}: {
  icon: React.ElementType
  value: string
  onChange: (v: string) => void
  options: string[]
}) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-500" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputCls(true)} cursor-pointer appearance-none pr-7`}
      >
        {options.map((o) => (
          <option key={o} value={o} className="bg-[#10131A] text-white">{o}</option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-400" />
    </div>
  )
}

// On / off switch
function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={() => onChange(!on)}
      className={`relative h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors ${on ? 'bg-[#6C63FF]' : 'bg-slate-600'}`}
    >
      <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${on ? 'left-4.5' : 'left-0.5'}`} />
    </button>
  )
}

// Step indicator: 1 --- 2 --- 3
function Stepper({ current }: { current: number }) {
  return (
    <div className="flex items-start">
      {STEPS.map((label, i) => {
        const n = i + 1
        const done = n < current
        const active = n === current
        return (
          <div key={label} className="flex min-w-0 flex-1 flex-col items-center last:flex-none">
            <div className="flex w-full items-center">
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${
                  active || done
                    ? 'bg-linear-to-br from-[#6C63FF] to-[#4DA3FF] text-white'
                    : 'border border-[#272D39] text-slate-400'
                }`}
              >
                {done ? <Check className="h-3 w-3" /> : n}
              </span>
              {n < STEPS.length && (
                <span className={`mx-1.5 h-px flex-1 ${done ? 'bg-[#6C63FF]' : 'bg-[#272D39]'}`} />
              )}
            </div>
            <span
              className={`mt-1.5 w-full truncate text-[9px] ${
                n === STEPS.length ? 'text-right' : 'text-left'
              } ${active ? 'font-semibold text-white' : 'text-slate-500'}`}
            >
              {label}
            </span>
          </div>
        )
      })}
    </div>
  )
}

/* ---------- Drawer ---------- */

export default function AddChargeHeadModal({
  open, onClose, onSave,
}: {
  open: boolean
  onClose: () => void
  onSave?: (data: AddChargeHeadPayload) => void
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
  onSave?: (data: AddChargeHeadPayload) => void
}) {
  const [step, setStep] = useState(1)

  // Step 1 state
  const [name, setName] = useState('')
  const [code, setCode] = useState('CHG-001')
  const [calc, setCalc] = useState<string>(CALC_TYPES[0].label)
  const [amount, setAmount] = useState('')
  const [freq, setFreq] = useState(FREQUENCIES[0])
  const [appliesTo, setAppliesTo] = useState(APPLICABLE_TO[0])
  const [tax, setTax] = useState(TAX_OPTIONS[0])
  const [active, setActive] = useState(true)

  // Step 2 state
  const [wings, setWings] = useState<string[]>([])
  const [flats, setFlats] = useState<string[]>([])

  // Step 3 state
  const [description, setDescription] = useState('')

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

  const method: ChargeMethod = CALC_TYPES.find((t) => t.label === calc)?.method ?? 'Fixed'
  const amountNum = Number(amount.replace(/[^0-9.]/g, ''))

  // Amount text used in the review table
  const amountText =
    method === 'Percentage'
      ? `${amountNum}%`
      : method === 'Per Sq. Ft.'
      ? `₹ ${amountNum.toLocaleString('en-IN')} / sq.ft`
      : `₹ ${amountNum.toLocaleString('en-IN')}`

  const toggleIn = (list: string[], v: string) =>
    list.includes(v) ? list.filter((x) => x !== v) : [...list, v]

  // Validation for each step
  function validate(s: number) {
    const err: Record<string, string> = {}
    if (s === 1) {
      if (!name.trim()) err.name = 'Charge name is required'
      if (!code.trim()) err.code = 'Charge code is required'
      if (!amountNum) err.amount = 'Amount / rate is required'
      else if (method === 'Percentage' && amountNum > 100) err.amount = 'Percentage cannot be more than 100'
    }
    if (s === 2) {
      if (appliesTo === 'Selected Wings' && wings.length === 0) err.wings = 'Select at least one wing'
      if (appliesTo === 'Selected Flats' && flats.length === 0) err.flats = 'Select at least one flat'
    }
    setErrors(err)
    return Object.keys(err).length === 0
  }

  const next = () => {
    if (!validate(step)) return
    setStep((s) => Math.min(3, s + 1))
  }
  const back = () => setStep((s) => Math.max(1, s - 1))

  function save() {
    // TODO: call the API here
    onSave?.({
      id: Date.now(),
      name: name.trim(),
      code: code.trim(),
      method,
      value: amountNum,
      freq,
      appliesTo,
      wings: appliesTo === 'Selected Wings' ? wings : [],
      flats: appliesTo === 'Selected Flats' ? flats : [],
      tax,
      description: description.trim(),
      active,
    })
    onClose()
  }

  // What the "Applicable To" row shows on the review step
  const appliesText =
    appliesTo === 'Selected Wings'
      ? `Wings: ${wings.join(', ')}`
      : appliesTo === 'Selected Flats'
      ? `Flats: ${flats.join(', ')}`
      : 'All Flats'

  // Rows for the review table
  const reviewRows = [
    ['Charge Name', name.trim() || '-'],
    ['Charge Code', code.trim() || '-'],
    ['Calculation Type', calc],
    ['Amount / Rate', amountNum ? amountText : '-'],
    ['Frequency', freq],
    ['Applicable To', appliesText],
    ['Tax Configuration', tax],
    ['Status', active ? 'Active' : 'Inactive'],
  ]

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
          if (step < 3) next()
          else save()
        }}
        noValidate
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
              <ListChecks className="h-4 w-4 text-white" />
            </span>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-white">Add Charge Head</h2>
              <p className="text-[10px] text-slate-400">
                Configure a charge head for maintenance billing
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

        {/* Stepper */}
        <div className="shrink-0 px-3.5 pb-1 pt-2 sm:px-4">
          <Stepper current={step} />
        </div>

        {/* Body */}
        <div className={`mt-2 min-h-0 flex-1 overflow-y-auto overscroll-contain px-3.5 text-white sm:px-4 ${noScrollbar}`}>
          <div className="rounded-xl border border-[#272D39] p-3.5">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                {/* ---------- Step 1: Basic details ---------- */}
                {step === 1 && (
                  <>
                    <h3 className="text-xs font-bold">Basic Details</h3>
                    <p className="mb-3 text-[10px] text-slate-400">
                      Enter the basic information about the charge head.
                    </p>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <Field label="Charge Name" error={errors.name}>
                        <IconInput
                          icon={ListChecks}
                          value={name}
                          onChange={(e) => { setName(e.target.value); clearErr('name') }}
                          error={!!errors.name}
                          placeholder="Enter charge name"
                        />
                      </Field>

                      <Field label="Charge Code" error={errors.code}>
                        <IconInput
                          icon={Tag}
                          value={code}
                          onChange={(e) => { setCode(e.target.value); clearErr('code') }}
                          error={!!errors.code}
                          placeholder="CHG-001"
                        />
                      </Field>

                      <Field label="Calculation Type">
                        <IconSelect
                          icon={Calculator}
                          value={calc}
                          onChange={setCalc}
                          options={CALC_TYPES.map((t) => t.label)}
                        />
                      </Field>

                      <Field label={method === 'Percentage' ? 'Rate (%)' : 'Amount / Rate'} error={errors.amount}>
                        <IconInput
                          icon={method === 'Percentage' ? Percent : IndianRupee}
                          value={amount}
                          onChange={(e) => { setAmount(e.target.value); clearErr('amount') }}
                          error={!!errors.amount}
                          inputMode="decimal"
                          placeholder="Enter amount"
                        />
                      </Field>

                      <Field label="Frequency">
                        <IconSelect icon={CalendarDays} value={freq} onChange={setFreq} options={FREQUENCIES} />
                      </Field>

                      <Field label="Applicable To">
                        <IconSelect
                          icon={Users}
                          value={appliesTo}
                          onChange={(v) => { setAppliesTo(v); clearErr('wings'); clearErr('flats') }}
                          options={APPLICABLE_TO}
                        />
                      </Field>

                      <Field label="Tax Configuration">
                        <IconSelect icon={Percent} value={tax} onChange={setTax} options={TAX_OPTIONS} />
                      </Field>

                      <Field label="Status">
                        <span className="flex h-8.5 items-center gap-2">
                          <Toggle on={active} onChange={setActive} />
                          <span className="text-[11px] text-slate-300">{active ? 'Active' : 'Inactive'}</span>
                        </span>
                      </Field>
                    </div>

                    {/* Info box */}
                    <div className="mt-3 flex items-start gap-2 rounded-md border border-[#6C63FF]/30 bg-[#6C63FF]/10 p-2.5">
                      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#A29CFF]" />
                      <p className="text-[10px] leading-relaxed text-slate-300">
                        This charge head will be used in maintenance bills and will be applied to selected flats as per the configuration.
                      </p>
                    </div>
                  </>
                )}

                {/* ---------- Step 2: Applicable flats ---------- */}
                {step === 2 && (
                  <>
                    <h3 className="text-xs font-bold">Applicable Flats</h3>
                    <p className="mb-3 text-[10px] text-slate-400">
                      Choose where this charge head will be applied.
                    </p>

                    {/* All flats */}
                    {appliesTo === 'All Flats' && (
                      <div className="flex items-start gap-2 rounded-md border border-[#6C63FF]/30 bg-[#6C63FF]/10 p-2.5">
                        <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#A29CFF]" />
                        <p className="text-[10px] leading-relaxed text-slate-300">
                          This charge head will be applied to all flats in the society. Go back to change this option.
                        </p>
                      </div>
                    )}

                    {/* Selected wings */}
                    {appliesTo === 'Selected Wings' && (
                      <div>
                        <label className="mb-1.5 block text-[10px] text-slate-400">Select Wings</label>
                        <div className="grid grid-cols-3 gap-1.5">
                          {WINGS.map((w) => {
                            const on = wings.includes(w)
                            return (
                              <button
                                key={w}
                                type="button"
                                onClick={() => { setWings((p) => toggleIn(p, w)); clearErr('wings') }}
                                className={`cursor-pointer rounded-md border py-2 text-[11px] transition-colors ${
                                  on
                                    ? 'border-transparent bg-linear-to-r from-[#6C63FF] to-[#4DA3FF] font-semibold text-white'
                                    : 'border-[#272D39] bg-[#0B0E14] text-slate-300 hover:bg-white/5'
                                }`}
                              >
                                Wing {w}
                              </button>
                            )
                          })}
                        </div>
                        {errors.wings && <p className="mt-1 text-[9px] text-red-400">{errors.wings}</p>}
                      </div>
                    )}

                    {/* Selected flats */}
                    {appliesTo === 'Selected Flats' && (
                      <div>
                        <label className="mb-1.5 block text-[10px] text-slate-400">Select Flats</label>
                        <div className="grid grid-cols-2 gap-1.5 md:grid-cols-3">
                          {FLATS.map((f) => {
                            const on = flats.includes(f)
                            return (
                              <button
                                key={f}
                                type="button"
                                onClick={() => { setFlats((p) => toggleIn(p, f)); clearErr('flats') }}
                                className={`cursor-pointer rounded-md border py-2 text-[11px] transition-colors ${
                                  on
                                    ? 'border-transparent bg-linear-to-r from-[#6C63FF] to-[#4DA3FF] font-semibold text-white'
                                    : 'border-[#272D39] bg-[#0B0E14] text-slate-300 hover:bg-white/5'
                                }`}
                              >
                                {f}
                              </button>
                            )
                          })}
                        </div>
                        {errors.flats && <p className="mt-1 text-[9px] text-red-400">{errors.flats}</p>}
                      </div>
                    )}
                  </>
                )}

                {/* ---------- Step 3: Settings & review ---------- */}
                {step === 3 && (
                  <>
                    <h3 className="text-xs font-bold">Settings &amp; Review</h3>
                    <p className="mb-3 text-[10px] text-slate-400">
                      Please review the details before saving the charge head.
                    </p>

                    <div className="overflow-hidden rounded-md border border-[#272D39] bg-[#0B0E14]">
                      {reviewRows.map(([label, value], i) => (
                        <div
                          key={label}
                          className={`flex items-center justify-between gap-3 px-3 py-2.5 text-[10px] ${
                            i > 0 ? 'border-t border-[#272D39]' : ''
                          }`}
                        >
                          <span className="shrink-0 text-slate-400">{label}</span>
                          <span className="min-w-0 break-words text-right font-medium">{value}</span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-3">
                      <Field label="Description (Optional)">
                        <textarea
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          rows={3}
                          placeholder="Add a short note about this charge head"
                          className={`${inputCls()} resize-none`}
                        />
                      </Field>
                    </div>
                  </>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
          <div className="h-3" />
        </div>

        {/* Footer */}
        <div className="grid shrink-0 grid-cols-2 items-center gap-2 border-t border-[#272D39] p-3.5 sm:flex sm:flex-wrap sm:justify-end sm:p-4">
          {step === 1 ? (
            <button
              type="button"
              onClick={onClose}
              className="cursor-pointer rounded-md border border-[#272D39] px-3.5 py-2 text-[11px] font-semibold text-white hover:bg-white/5 sm:py-1.5"
            >
              Cancel
            </button>
          ) : (
            <button
              type="button"
              onClick={back}
              className="flex cursor-pointer items-center justify-center gap-1.5 rounded-md border border-[#272D39] px-3.5 py-2 text-[11px] font-semibold text-white hover:bg-white/5 sm:py-1.5"
            >
              <ArrowLeft className="h-3 w-3" /> Back
            </button>
          )}

          {step < 3 ? (
            <button
              type="submit"
              className="flex cursor-pointer items-center justify-center gap-1.5 rounded-md bg-linear-to-r from-[#6C63FF] to-[#4DA3FF] px-4 py-2 text-[11px] font-semibold text-white hover:opacity-90 sm:py-1.5"
            >
              Next <ArrowRight className="h-3 w-3" />
            </button>
          ) : (
            <button
              type="submit"
              className="flex cursor-pointer items-center justify-center gap-1.5 rounded-md bg-linear-to-r from-[#6C63FF] to-[#4DA3FF] px-4 py-2 text-[11px] font-semibold text-white hover:opacity-90 sm:py-1.5"
            >
              Save Charge Head
            </button>
          )}
        </div>
      </motion.form>
    </motion.div>,
    document.body,
  )
}