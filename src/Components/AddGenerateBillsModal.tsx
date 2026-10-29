'use client'

import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  X, Receipt, CalendarDays, ChevronDown, Info, ArrowRight, ArrowLeft, Check,
} from 'lucide-react'
// Wings, plans and validation come from the treasurer schema file
import { WINGS, PLANS, validateBilling } from '@/lib/validations/treasurerGenerateBills.schema'

/* ---------- Config ---------- */

type ChargeHead = {
  id: number
  name: string
  method: 'Fixed' | 'Percentage'
  value: number
}

const CHARGE_HEADS: ChargeHead[] = [
  { id: 1, name: 'Maintenance', method: 'Fixed', value: 3000 },
  { id: 2, name: 'Parking', method: 'Fixed', value: 500 },
  { id: 3, name: 'Penalty', method: 'Percentage', value: 2 },
]

// Each plan decides which charge heads are ticked by default
const PLAN_HEADS: Record<string, number[]> = {
  'Monthly Maintenance': [1, 2, 3],
  'Basic Plan': [1],
}

export type Flat = {
  flat: string
  wing: string
  resident: string
  penalty: number // penalty amount for this flat (0 = not applicable)
}

const FLATS: Flat[] = [
  { flat: 'A-101', wing: 'A', resident: 'Rakesh Sharma', penalty: 200 },
  { flat: 'A-102', wing: 'A', resident: 'Priya Mehta', penalty: 0 },
  { flat: 'B-201', wing: 'B', resident: 'Sandeep Kumar', penalty: 300 },
  { flat: 'B-202', wing: 'B', resident: 'Neha Gupta', penalty: 0 },
  { flat: 'C-101', wing: 'C', resident: 'Amit Verma', penalty: 100 },
]

const STEPS = ['Billing Details', 'Preview Bills', 'Confirm & Generate']

export type AddGeneratePayload = {
  month: string // e.g. Apr 2025
  dueDate: string // e.g. 10 Apr 2025
  wing: string
  plan: string
  flats: Flat[]
  heads: ChargeHead[]
  total: number
}

const noScrollbar =
  '[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden'

/* ---------- Helpers ---------- */

// 2025-04 -> Apr 2025
const fmtMonth = (v: string) =>
  v
    ? new Date(`${v}-01T00:00:00`).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
    : '-'

// 2025-04-10 -> 10 Apr 2025
const fmtDate = (v: string) =>
  v
    ? new Date(`${v}T00:00:00`).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : '-'

const inr = (n: number) => n.toLocaleString('en-IN')

// Amount of one charge head for one flat
const headAmount = (h: ChargeHead, f: Flat) => (h.method === 'Fixed' ? h.value : f.penalty)

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

function SelectBox({
  value, onChange, options, error,
}: {
  value: string
  onChange: (v: string) => void
  options: string[]
  error?: boolean
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputCls(false, error)} cursor-pointer appearance-none pr-7`}
      >
        {options.map((o) => (
          <option key={o} value={o} className="bg-[#10131A] text-white">{o}</option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-400" />
    </div>
  )
}

// Checkbox with a label, used in the charge heads list
function Check3({ on, onChange, children }: { on: boolean; onChange: () => void; children: ReactNode }) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-[10px]">
      <input
        type="checkbox"
        checked={on}
        onChange={onChange}
        className="h-3.5 w-3.5 cursor-pointer accent-[#6C63FF]"
      />
      {children}
    </label>
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

export default function AddGenerateBillsModal({
  open, onClose, onGenerate,
}: {
  open: boolean
  onClose: () => void
  onGenerate?: (data: AddGeneratePayload) => void
}) {
  return (
    <AnimatePresence>
      {open && <Body onClose={onClose} onGenerate={onGenerate} />}
    </AnimatePresence>
  )
}

function Body({
  onClose, onGenerate,
}: {
  onClose: () => void
  onGenerate?: (data: AddGeneratePayload) => void
}) {
  const [step, setStep] = useState(1)

  // Step 1 state
  const [month, setMonth] = useState('2025-04')
  const [dueDate, setDueDate] = useState('2025-04-10')
  const [wing, setWing] = useState(WINGS[0])
  const [plan, setPlan] = useState(PLANS[0])
  const [flatMode, setFlatMode] = useState<'all' | 'selected'>('all')
  const [pickedFlats, setPickedFlats] = useState<string[]>([])
  const [flatsOpen, setFlatsOpen] = useState(false)
  const [heads, setHeads] = useState<number[]>(PLAN_HEADS[PLANS[0]])

  // Step 2 / 3 state
  const [expanded, setExpanded] = useState(false)
  const [confirmed, setConfirmed] = useState(false)
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

  // Flats that belong to the chosen wing
  const wingFlats = useMemo(
    () => FLATS.filter((f) => wing === 'All Wings' || f.wing === wing),
    [wing],
  )

  // Flats that will actually get bills
  const targetFlats = useMemo(
    () =>
      flatMode === 'all'
        ? wingFlats
        : wingFlats.filter((f) => pickedFlats.includes(f.flat)),
    [flatMode, wingFlats, pickedFlats],
  )

  const pickedHeads = CHARGE_HEADS.filter((h) => heads.includes(h.id))

  // Bill total of one flat
  const flatTotal = (f: Flat) => pickedHeads.reduce((s, h) => s + headAmount(h, f), 0)
  const grandTotal = targetFlats.reduce((s, f) => s + flatTotal(f), 0)

  const changePlan = (p: string) => {
    setPlan(p)
    setHeads(PLAN_HEADS[p])
    clearErr('heads')
    clearErr('plan')
    clearErr('total')
  }

  const changeWing = (w: string) => {
    setWing(w)
    setPickedFlats([])
    clearErr('flats')
    clearErr('wing')
    clearErr('total')
  }

  const toggleHead = (id: number) => {
    setHeads((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))
    clearErr('heads')
    clearErr('total')
  }

  const toggleFlat = (flat: string) => {
    setPickedFlats((p) => (p.includes(flat) ? p.filter((x) => x !== flat) : [...p, flat]))
    clearErr('flats')
    clearErr('total')
  }

  // Validate all billing details (step 1) with the schema helper
  function validateStep1() {
    const err = validateBilling({
      month,
      dueDate,
      wing,
      plan,
      flatMode,
      pickedFlats,
      headCount: pickedHeads.length,
      flatCount: targetFlats.length,
      total: grandTotal,
    })
    setErrors(err)
    return Object.keys(err).length === 0
  }

  // Validate the preview (step 2): there must be flats and a total above zero
  function validateStep2() {
    const err: Record<string, string> = {}
    if (targetFlats.length === 0) err.preview = 'No flats to generate bills for'
    else if (grandTotal <= 0) err.preview = 'Total bill amount cannot be zero'
    setErrors(err)
    return Object.keys(err).length === 0
  }

  const next = () => {
    if (step === 1 && !validateStep1()) return
    if (step === 2 && !validateStep2()) return
    setErrors({})
    setStep((s) => Math.min(3, s + 1))
  }
  const back = () => {
    setErrors({})
    setStep((s) => Math.max(1, s - 1))
  }

  function generate() {
    // Check all details again before generating, and go back to step 1 if something is wrong
    if (!validateStep1()) {
      setStep(1)
      return
    }
    if (!confirmed) {
      setErrors({ confirm: 'Please confirm before generating the bills' })
      return
    }
    // TODO: call the API here
    onGenerate?.({
      month: fmtMonth(month),
      dueDate: fmtDate(dueDate),
      wing,
      plan,
      flats: targetFlats,
      heads: pickedHeads,
      total: grandTotal,
    })
    onClose()
  }

  // Rows for the step 3 summary table
  const summaryRows = [
    ['Billing Month', fmtMonth(month)],
    ['Due Date', fmtDate(dueDate)],
    ['Applicable Wing', wing],
    ['Charge Plan', plan],
    ['Total Flats', String(targetFlats.length)],
    ['Total Amount', `₹ ${inr(grandTotal)}`],
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
          else generate()
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
              <Receipt className="h-4 w-4 text-white" />
            </span>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-white">Generate Maintenance Bills</h2>
              <p className="text-[10px] text-slate-400">
                Configure billing details and generate bills for selected flats
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
                {/* ---------- Step 1: Billing details ---------- */}
                {step === 1 && (
                  <>
                    <h3 className="mb-3 text-xs font-bold">Billing Details</h3>

                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      <Field label="Billing Month" error={errors.month}>
                        <div className="relative">
                          <CalendarDays className="pointer-events-none absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-500" />
                          <input
                            type="month"
                            value={month}
                            onChange={(e) => {
                              setMonth(e.target.value)
                              clearErr('month')
                              clearErr('dueDate')
                            }}
                            className={`${inputCls(true, !!errors.month)} scheme-dark`}
                          />
                        </div>
                      </Field>

                      <Field label="Due Date" error={errors.dueDate}>
                        <div className="relative">
                          <CalendarDays className="pointer-events-none absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-500" />
                          <input
                            type="date"
                            value={dueDate}
                            onChange={(e) => { setDueDate(e.target.value); clearErr('dueDate') }}
                            className={`${inputCls(true, !!errors.dueDate)} scheme-dark`}
                          />
                        </div>
                      </Field>

                      <Field label="Applicable Wing" error={errors.wing}>
                        <SelectBox value={wing} onChange={changeWing} options={WINGS} error={!!errors.wing} />
                      </Field>

                      <Field label="Charge Plan" error={errors.plan}>
                        <SelectBox value={plan} onChange={changePlan} options={PLANS} error={!!errors.plan} />
                      </Field>
                    </div>

                    {/* Applicable flats */}
                    <div className="mt-3">
                      <label className="mb-1.5 block text-[10px] text-slate-400">Applicable Flats</label>
                      <div className="mb-2 flex flex-wrap items-center gap-4">
                        {([['all', 'All Eligible Flats'], ['selected', 'Selected Flats']] as const).map(([k, label]) => (
                          <label key={k} className="flex cursor-pointer items-center gap-1.5 text-[10px]">
                            <input
                              type="radio"
                              name="flatMode"
                              checked={flatMode === k}
                              onChange={() => {
                                setFlatMode(k)
                                setFlatsOpen(false)
                                clearErr('flats')
                                clearErr('total')
                              }}
                              className="h-3 w-3 cursor-pointer accent-[#6C63FF]"
                            />
                            {label}
                          </label>
                        ))}
                      </div>

                      {/* Flat picker (only active for "Selected Flats") */}
                      <div className="relative">
                        <button
                          type="button"
                          disabled={flatMode === 'all'}
                          onClick={() => setFlatsOpen((o) => !o)}
                          className={`${inputCls(false, !!errors.flats)} flex cursor-pointer items-center justify-between text-left ${
                            pickedFlats.length ? 'text-white' : 'text-slate-500'
                          }`}
                        >
                          <span className="min-w-0 truncate">
                            {pickedFlats.length ? pickedFlats.join(', ') : 'Select Flats'}
                          </span>
                          <ChevronDown className="h-3 w-3 shrink-0 text-slate-400" />
                        </button>

                        {flatsOpen && flatMode === 'selected' && (
                          <div className={`absolute left-0 right-0 top-9 z-10 max-h-40 overflow-y-auto rounded-md border border-[#272D39] bg-[#0B0E14] p-1 shadow-xl ${noScrollbar}`}>
                            {wingFlats.map((f) => (
                              <label
                                key={f.flat}
                                className="flex cursor-pointer items-center gap-2 rounded px-2 py-1.5 text-[10px] hover:bg-white/5"
                              >
                                <input
                                  type="checkbox"
                                  checked={pickedFlats.includes(f.flat)}
                                  onChange={() => toggleFlat(f.flat)}
                                  className="h-3 w-3 cursor-pointer accent-[#6C63FF]"
                                />
                                <span className="font-medium">{f.flat}</span>
                                <span className="text-slate-400">{f.resident}</span>
                              </label>
                            ))}
                          </div>
                        )}
                      </div>
                      {errors.flats && <p className="mt-1 text-[9px] text-red-400">{errors.flats}</p>}
                    </div>

                    {/* Info box */}
                    <div className="mt-3 flex items-start gap-2 rounded-md border border-[#6C63FF]/30 bg-[#6C63FF]/10 p-2.5">
                      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#A29CFF]" />
                      <p className="text-[10px] leading-relaxed text-slate-300">
                        This will generate bills for all eligible flats based on the configured charge heads and rates.
                      </p>
                    </div>

                    {/* Charge heads + summary */}
                    <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-5">
                      <div className="rounded-lg border border-[#272D39] bg-[#0B0E14] p-3 md:col-span-3">
                        <p className="mb-2.5 text-[11px] font-bold">Charge Heads Included</p>
                        <div className="flex flex-col gap-2.5">
                          {CHARGE_HEADS.map((h) => (
                            <div key={h.id} className="flex items-center justify-between gap-2">
                              <Check3 on={heads.includes(h.id)} onChange={() => toggleHead(h.id)}>
                                <span className="text-slate-300">{h.name} ({h.method})</span>
                              </Check3>
                              <span className="shrink-0 text-[10px] text-slate-400">
                                {h.method === 'Fixed' ? `₹ ${inr(h.value)}` : `${h.value}% (if applicable)`}
                              </span>
                            </div>
                          ))}
                        </div>
                        {errors.heads && <p className="mt-2 text-[9px] text-red-400">{errors.heads}</p>}
                      </div>

                      <div className="rounded-lg border border-[#272D39] bg-[#0B0E14] p-3 md:col-span-2">
                        <p className="mb-2.5 text-[11px] font-bold">Summary</p>
                        <div className="flex flex-col gap-2 text-[10px]">
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">Applicable Flats</span>
                            <span className="font-semibold">{targetFlats.length}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-slate-400">Total Charge Heads</span>
                            <span className="font-semibold">{pickedHeads.length}</span>
                          </div>
                          <div className="flex items-center justify-between border-t border-[#272D39] pt-2">
                            <span className="text-slate-400">Estimated Total Amount</span>
                            <span className="font-bold">₹ {inr(grandTotal)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Error when the total amount is zero */}
                    {errors.total && <p className="mt-2 text-[9px] text-red-400">{errors.total}</p>}
                  </>
                )}

                {/* ---------- Step 2: Preview ---------- */}
                {step === 2 && (
                  <>
                    <h3 className="text-xs font-bold">Bill Preview</h3>
                    <p className="mb-3 text-[10px] text-slate-400">
                      Here is the summary of bills that will be generated.
                    </p>

                    {/* Table scrolls sideways on small screens */}
                    <div className={`overflow-x-auto rounded-md border border-[#272D39] ${noScrollbar}`}>
                      <div className={`${expanded ? '' : 'max-h-64'} overflow-y-auto ${noScrollbar}`}>
                        <table className="w-full min-w-120 text-left text-[10px]">
                          <thead className="bg-white/4 text-slate-400">
                            <tr>
                              <th className="px-2 py-2 font-medium">#</th>
                              <th className="px-2 py-2 font-medium">Flat No.</th>
                              <th className="px-2 py-2 font-medium">Resident Name</th>
                              {pickedHeads.map((h) => (
                                <th key={h.id} className="px-2 py-2 text-right font-medium">{h.name}</th>
                              ))}
                              <th className="px-2 py-2 text-right font-medium">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {targetFlats.map((f, i) => (
                              <tr key={f.flat} className="border-t border-[#272D39]">
                                <td className="px-2 py-2 text-slate-400">{i + 1}</td>
                                <td className="px-2 py-2 font-medium">{f.flat}</td>
                                <td className="px-2 py-2 text-slate-300">{f.resident}</td>
                                {pickedHeads.map((h) => (
                                  <td key={h.id} className="px-2 py-2 text-right text-slate-300">
                                    {inr(headAmount(h, f))}
                                  </td>
                                ))}
                                <td className="px-2 py-2 text-right font-bold">{inr(flatTotal(f))}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Totals */}
                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-[#272D39] bg-[#0B0E14] p-3">
                      <div>
                        <p className="text-[10px] text-slate-400">Total Bills</p>
                        <p className="text-sm font-bold">{targetFlats.length}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400">Total</p>
                        <p className="text-sm font-bold">₹ {inr(grandTotal)}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setExpanded((e) => !e)}
                        className="cursor-pointer rounded-md border border-[#272D39] px-3 py-1.5 text-[10px] font-semibold text-white hover:bg-white/5"
                      >
                        {expanded ? 'Hide Details' : 'View Details'}
                      </button>
                    </div>

                    {/* Error when there is nothing to generate */}
                    {errors.preview && <p className="mt-2 text-[9px] text-red-400">{errors.preview}</p>}
                  </>
                )}

                {/* ---------- Step 3: Confirm ---------- */}
                {step === 3 && (
                  <>
                    <h3 className="text-xs font-bold">Confirm &amp; Generate</h3>
                    <p className="mb-3 text-[10px] text-slate-400">
                      Please review the details before generating the bills.
                    </p>

                    <div className="overflow-hidden rounded-md border border-[#272D39] bg-[#0B0E14]">
                      {summaryRows.map(([label, value], i) => (
                        <div
                          key={label}
                          className={`flex items-center justify-between gap-3 px-3 py-2.5 text-[10px] ${
                            i > 0 ? 'border-t border-[#272D39]' : ''
                          }`}
                        >
                          <span className="text-slate-400">{label}</span>
                          <span className={`text-right ${label === 'Total Amount' ? 'font-bold' : 'font-medium'}`}>
                            {value}
                          </span>
                        </div>
                      ))}
                    </div>

                    <label className="mt-3 flex cursor-pointer items-start gap-2 text-[10px] text-slate-300">
                      <input
                        type="checkbox"
                        checked={confirmed}
                        onChange={(e) => { setConfirmed(e.target.checked); clearErr('confirm') }}
                        className="mt-0.5 h-3.5 w-3.5 shrink-0 cursor-pointer accent-[#6C63FF]"
                      />
                      I confirm that the above details are correct and I want to generate the bills.
                    </label>
                    {errors.confirm && <p className="mt-1 text-[9px] text-red-400">{errors.confirm}</p>}
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
              Generate Bills
            </button>
          )}
        </div>
      </motion.form>
    </motion.div>,
    document.body,
  )
}