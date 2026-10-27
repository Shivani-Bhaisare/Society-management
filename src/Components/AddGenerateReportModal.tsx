'use client'

import { useEffect, useState } from 'react'
import type { ElementType, ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  X, FileText, CalendarDays, ChevronDown, Building2, Send, FileType2, BookOpen,
} from 'lucide-react'

/* ---------- Config ---------- */

// TODO: fetch these lists from the API later
const FINANCIAL_YEARS = ['2025-26', '2024-25', '2023-24', '2022-23']
const REPORT_TYPES = [
  'General Ledger',
  'Accounts Receivable',
  'Accounts Payable',
  'Vendor Bill Management',
  'Late Fee Rules',
  'Bank Reconciliation',
  'Income / Expense',
  'GST / Tax Support',
  'Sinking / Reserve Funds',
]
const BRANCHES = ['All Branches', 'Main Branch', 'Wing A', 'Wing B', 'Wing C']
const REPORT_FORMATS = ['PDF', 'Excel', 'CSV']

const MAX_NOTES = 500

// Data sent to the page when the report is generated
export type GenerateReportPayload = {
  id: number
  financialYear: string
  reportType: string
  branch: string
  dateFrom: string // yyyy-mm-dd
  dateTo: string // yyyy-mm-dd
  format: string
  notes: string
}

const noScrollbar =
  '[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden'

/* ---------- Helpers ---------- */

// "2025-26" -> { from: "2025-04-01", to: "2026-03-31" } (Indian financial year)
const fyRange = (fy: string) => {
  const start = Number(fy.slice(0, 4))
  return { from: `${start}-04-01`, to: `${start + 1}-03-31` }
}

// "2025-04-01" -> "01 Apr 2025"
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

// Label + control + error message
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

// Select with a left icon and a custom chevron
function IconSelect({
  icon: Icon, value, onChange, options, error,
}: {
  icon: ElementType
  value: string
  onChange: (v: string) => void
  options: string[]
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

export default function AddGenerateReportModal({
  open, onClose, onGenerate,
}: {
  open: boolean
  onClose: () => void
  onGenerate?: (data: GenerateReportPayload) => void
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
  onGenerate?: (data: GenerateReportPayload) => void
}) {
  const [financialYear, setFinancialYear] = useState(FINANCIAL_YEARS[0])
  const [reportType, setReportType] = useState(REPORT_TYPES[0])
  const [branch, setBranch] = useState(BRANCHES[0])
  const [dateFrom, setDateFrom] = useState(() => fyRange(FINANCIAL_YEARS[0]).from)
  const [dateTo, setDateTo] = useState(() => fyRange(FINANCIAL_YEARS[0]).to)
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

  // Changing the financial year also resets the date range to that year
  const onYearChange = (fy: string) => {
    setFinancialYear(fy)
    const r = fyRange(fy)
    setDateFrom(r.from)
    setDateTo(r.to)
    clearErr('financialYear')
    clearErr('dateRange')
  }

  /* ----- Validation + submit ----- */
  // Required: financial year, report type, date range, report format
  function validate() {
    const err: Record<string, string> = {}
    if (!financialYear) err.financialYear = 'Select a financial year'
    if (!reportType) err.reportType = 'Select a report type'
    if (!dateFrom || !dateTo) err.dateRange = 'Select both dates'
    else if (dateTo < dateFrom) err.dateRange = 'End date cannot be before start date'
    if (!format) err.format = 'Select a report format'
    setErrors(err)
    return Object.keys(err).length === 0
  }

  function submit() {
    if (!validate()) return

    // TODO: call the API here
    onGenerate?.({
      id: Date.now(),
      financialYear,
      reportType,
      branch,
      dateFrom,
      dateTo,
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
              <h2 className="text-sm font-bold text-white">Generate Report</h2>
              <p className="text-[10px] text-slate-400">
                Select the details below to generate your audit and compliance report.
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
              {/* Financial year */}
              <Field label="Financial Year" required error={errors.financialYear}>
                <IconSelect
                  icon={CalendarDays}
                  value={financialYear}
                  onChange={onYearChange}
                  options={FINANCIAL_YEARS}
                  error={!!errors.financialYear}
                />
              </Field>

              {/* Report type */}
              <Field label="Report Type" required error={errors.reportType}>
                <IconSelect
                  icon={BookOpen}
                  value={reportType}
                  onChange={(v) => { setReportType(v); clearErr('reportType') }}
                  options={REPORT_TYPES}
                  error={!!errors.reportType}
                />
              </Field>

              {/* Branch */}
              <Field label="Branch">
                <IconSelect icon={Building2} value={branch} onChange={setBranch} options={BRANCHES} />
              </Field>

              {/* Report format */}
              <Field label="Report Format" required error={errors.format}>
                <IconSelect
                  icon={FileType2}
                  value={format}
                  onChange={(v) => { setFormat(v); clearErr('format') }}
                  options={REPORT_FORMATS}
                  error={!!errors.format}
                />
              </Field>

              {/* Date range */}
              <Field label="Date Range" required error={errors.dateRange} className="md:col-span-2">
                <div className="grid grid-cols-1 items-center gap-2 min-[400px]:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)]">
                  <DateBox
                    label="From date"
                    value={dateFrom}
                    max={dateTo || undefined}
                    onChange={(v) => { setDateFrom(v); clearErr('dateRange') }}
                    error={!!errors.dateRange}
                  />
                  <span className="hidden text-center text-slate-400 min-[400px]:block">—</span>
                  <DateBox
                    label="To date"
                    value={dateTo}
                    min={dateFrom || undefined}
                    onChange={(v) => { setDateTo(v); clearErr('dateRange') }}
                    error={!!errors.dateRange}
                  />
                </div>
              </Field>
            </div>

            {/* Description / notes */}
            <div className="mt-3">
              <Field label="Description / Notes" optional>
                <textarea
                  value={notes}
                  maxLength={MAX_NOTES}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  placeholder="Enter any additional notes or remarks..."
                  className={`${inputCls()} resize-none`}
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