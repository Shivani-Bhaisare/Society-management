'use client'

import { useEffect, useMemo, useState } from 'react'
import type { ElementType, ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  X, FileText, CalendarDays, ChevronDown, Send, FileType2, BookOpen, Percent, Tag, Clock, CheckCircle2,
} from 'lucide-react'
import { buildGenerateTaxReportSchema } from '@/lib/validations/treasurerGenerateTaxReport.schema'
import { fyRange } from '@/lib/validations/treasurerGenerateReport.schema'
import { issuesToErrors } from '@/lib/validations/treasurerValidationHelpers'

/* ---------- Config ---------- */

// TODO: fetch these lists from the API later
const REPORT_TYPES = ['GST Summary', 'GSTR-1', 'GSTR-3B', 'Tax Transactions', 'Input Tax Credit']
const FINANCIAL_YEARS = ['2025-26', '2024-25', '2023-24']
const PERIOD_TYPES = ['Monthly', 'Quarterly', 'Yearly', 'Custom'] as const
const QUARTERS = ['Q1 (Apr - Jun)', 'Q2 (Jul - Sep)', 'Q3 (Oct - Dec)', 'Q4 (Jan - Mar)']
const CHARGE_HEADS = ['All Charge Heads', 'Maintenance', 'Parking', 'Club House', 'Water', 'Others']
const TAX_RATES = ['All Rates', '5%', '12%', '18%', '28%']
const STATUSES = ['All', 'Collected', 'Pending']
const REPORT_FORMATS = ['PDF', 'Excel', 'CSV']

const MAX_NOTES = 500

type PeriodType = (typeof PERIOD_TYPES)[number]

// Schema is built once, with the same lists the dropdowns use
const taxReportSchema = buildGenerateTaxReportSchema({
  reportTypes: REPORT_TYPES,
  financialYears: FINANCIAL_YEARS,
  periodTypes: PERIOD_TYPES,
  quarters: QUARTERS,
  chargeHeads: CHARGE_HEADS,
  taxRates: TAX_RATES,
  statuses: STATUSES,
  formats: REPORT_FORMATS,
})

// Data sent to the page when the report is generated
export type GenerateTaxReportPayload = {
  id: number
  reportType: string
  financialYear: string
  periodType: PeriodType
  month: string // yyyy-mm (Monthly only)
  quarter: string // Quarterly only
  dateFrom: string // yyyy-mm-dd (Custom only)
  dateTo: string // yyyy-mm-dd (Custom only)
  chargeHead: string
  taxRate: string
  status: string
  format: string
  notes: string
}

const noScrollbar =
  '[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden'

/* ---------- Helpers ---------- */

// "2025-04-01" -> "01 Apr 2025"
const prettyDate = (v: string) =>
  v
    ? new Date(`${v}T00:00:00`).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : 'Select date'

// Current month as yyyy-mm (local time)
const thisMonth = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

// Default month for a financial year: this month if it is inside the year, otherwise the first month of the year
const defaultMonth = (fy: string) => {
  const r = fyRange(fy)
  const cur = thisMonth()
  return cur >= r.from.slice(0, 7) && cur <= r.to.slice(0, 7) ? cur : r.from.slice(0, 7)
}

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

// Select with a left icon and a custom chevron
function IconSelect({
  icon: Icon, value, onChange, options, error,
}: {
  icon: ElementType
  value: string
  onChange: (v: string) => void
  options: readonly string[]
  error?: boolean
}) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-500" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputCls(true, error)} cursor-pointer appearance-none truncate pr-7`}
      >
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
  value, onChange, label, error, min, max,
}: {
  value: string
  onChange: (v: string) => void
  label: string
  error?: boolean
  min?: string
  max?: string
}) {
  return (
    <div className="relative min-w-0">
      <CalendarDays className="pointer-events-none absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-500" />
      <div className={`${inputCls(true, error)} truncate pr-7`}>{prettyDate(value)}</div>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-400" />
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

export default function AddGenerateTaxReportModal({
  open, onClose, onGenerate,
}: {
  open: boolean
  onClose: () => void
  onGenerate?: (data: GenerateTaxReportPayload) => void
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
  onGenerate?: (data: GenerateTaxReportPayload) => void
}) {
  const [reportType, setReportType] = useState(REPORT_TYPES[0])
  const [financialYear, setFinancialYear] = useState(FINANCIAL_YEARS[0])
  const [periodType, setPeriodType] = useState<PeriodType>('Monthly')
  const [month, setMonth] = useState(() => defaultMonth(FINANCIAL_YEARS[0]))
  const [quarter, setQuarter] = useState(QUARTERS[0])
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [chargeHead, setChargeHead] = useState(CHARGE_HEADS[0])
  const [taxRate, setTaxRate] = useState(TAX_RATES[0])
  const [status, setStatus] = useState(STATUSES[0])
  const [format, setFormat] = useState(REPORT_FORMATS[0])
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

  // Month and date pickers only allow values inside the chosen financial year
  const range = useMemo(() => fyRange(financialYear), [financialYear])

  // Changing the financial year also resets the month and the custom dates
  const onYearChange = (fy: string) => {
    setFinancialYear(fy)
    setMonth(defaultMonth(fy))
    setDateFrom('')
    setDateTo('')
    clearErr('financialYear')
    clearErr('month')
    clearErr('dateRange')
  }

  /* ----- Validation + submit ----- */
  // Validate the whole form with the zod schema (all errors are shown together)
  function validate() {
    const result = taxReportSchema.safeParse({
      reportType,
      financialYear,
      periodType,
      month,
      quarter,
      dateFrom,
      dateTo,
      chargeHead,
      taxRate,
      status,
      format,
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
    onGenerate?.({
      id: Date.now(),
      reportType,
      financialYear,
      periodType,
      month: periodType === 'Monthly' ? month : '',
      quarter: periodType === 'Quarterly' ? quarter : '',
      dateFrom: periodType === 'Custom' ? dateFrom : '',
      dateTo: periodType === 'Custom' ? dateTo : '',
      chargeHead,
      taxRate,
      status,
      format,
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
              <FileText className="h-4 w-4 text-white" />
            </span>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-white">Generate Tax Report</h2>
              <p className="text-[10px] text-slate-400">
                Select the details below to generate your GST and tax report.
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
        <div className={`mt-2 min-h-0 flex-1 overflow-y-auto overscroll-contain px-3.5 text-white sm:px-4 ${noScrollbar}`}>
          <div className="rounded-xl border border-[#272D39] p-3.5">
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <Field label="Report Type" error={errors.reportType}>
                <IconSelect
                  icon={BookOpen}
                  value={reportType}
                  onChange={(v) => { setReportType(v); clearErr('reportType') }}
                  options={REPORT_TYPES}
                  error={!!errors.reportType}
                />
              </Field>

              <Field label="Financial Year" error={errors.financialYear}>
                <IconSelect
                  icon={CalendarDays}
                  value={financialYear}
                  onChange={onYearChange}
                  options={FINANCIAL_YEARS}
                  error={!!errors.financialYear}
                />
              </Field>

              <Field label="Period Type" error={errors.periodType}>
                <IconSelect
                  icon={Clock}
                  value={periodType}
                  onChange={(v) => { setPeriodType(v as PeriodType); setErrors({}) }}
                  options={PERIOD_TYPES}
                  error={!!errors.periodType}
                />
              </Field>

              {/* Changes with the period type */}
              {periodType === 'Monthly' && (
                <Field label="Month" error={errors.month}>
                  <div className="relative">
                    <CalendarDays className="pointer-events-none absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-500" />
                    <input
                      type="month"
                      value={month}
                      min={range.from.slice(0, 7)}
                      max={range.to.slice(0, 7)}
                      onChange={(e) => { setMonth(e.target.value); clearErr('month') }}
                      className={`${inputCls(true, !!errors.month)} scheme-dark`}
                    />
                  </div>
                </Field>
              )}

              {periodType === 'Quarterly' && (
                <Field label="Quarter" error={errors.quarter}>
                  <IconSelect
                    icon={CalendarDays}
                    value={quarter}
                    onChange={(v) => { setQuarter(v); clearErr('quarter') }}
                    options={QUARTERS}
                    error={!!errors.quarter}
                  />
                </Field>
              )}

              {periodType === 'Yearly' && (
                <Field label="Period">
                  <div className={`${inputCls(true)} flex items-center truncate text-slate-400`}>
                    <CalendarDays className="pointer-events-none absolute left-2.5 h-3 w-3 text-slate-500" />
                    Full year {financialYear}
                  </div>
                </Field>
              )}

              {periodType === 'Custom' && (
                <Field label="Date Range" error={errors.dateRange} className="md:col-span-2">
                  <div className="grid grid-cols-1 items-center gap-2 min-[400px]:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
                    <DateBox
                      label="From date"
                      value={dateFrom}
                      min={range.from}
                      max={dateTo || range.to}
                      onChange={(v) => { setDateFrom(v); clearErr('dateRange') }}
                      error={!!errors.dateRange}
                    />
                    <span className="hidden text-center text-slate-400 min-[400px]:block">—</span>
                    <DateBox
                      label="To date"
                      value={dateTo}
                      min={dateFrom || range.from}
                      max={range.to}
                      onChange={(v) => { setDateTo(v); clearErr('dateRange') }}
                      error={!!errors.dateRange}
                    />
                  </div>
                </Field>
              )}

              <Field label="Charge Head" error={errors.chargeHead}>
                <IconSelect
                  icon={Tag}
                  value={chargeHead}
                  onChange={(v) => { setChargeHead(v); clearErr('chargeHead') }}
                  options={CHARGE_HEADS}
                  error={!!errors.chargeHead}
                />
              </Field>

              <Field label="Tax Rate" error={errors.taxRate}>
                <IconSelect
                  icon={Percent}
                  value={taxRate}
                  onChange={(v) => { setTaxRate(v); clearErr('taxRate') }}
                  options={TAX_RATES}
                  error={!!errors.taxRate}
                />
              </Field>

              <Field label="Status" error={errors.status}>
                <IconSelect
                  icon={CheckCircle2}
                  value={status}
                  onChange={(v) => { setStatus(v); clearErr('status') }}
                  options={STATUSES}
                  error={!!errors.status}
                />
              </Field>

              <Field label="Report Format" error={errors.format}>
                <IconSelect
                  icon={FileType2}
                  value={format}
                  onChange={(v) => { setFormat(v); clearErr('format') }}
                  options={REPORT_FORMATS}
                  error={!!errors.format}
                />
              </Field>
            </div>

            {/* Description / notes */}
            <div className="mt-3">
              <Field label="Description / Notes" optional error={errors.notes}>
                <textarea
                  value={notes}
                  maxLength={MAX_NOTES}
                  onChange={(e) => { setNotes(e.target.value); clearErr('notes') }}
                  rows={4}
                  placeholder="Enter any additional notes or remarks..."
                  className={`${inputCls(false, !!errors.notes)} resize-none`}
                />
                <p className="mt-1 text-right text-[9px] text-slate-500">{notes.length}/{MAX_NOTES}</p>
              </Field>
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
            type="submit"
            className="flex cursor-pointer items-center justify-center gap-1.5 rounded-md bg-linear-to-r from-[#6C63FF] to-[#4DA3FF] px-4 py-2 text-[11px] font-semibold text-white hover:opacity-90 sm:py-1.5"
          >
            <Send className="h-3 w-3" /> Generate Report
          </button>
        </div>
      </motion.form>
    </motion.div>,
    document.body,
  )
}