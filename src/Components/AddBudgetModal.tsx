'use client'

import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  X, FileText, CalendarDays, ChevronDown, Trash2, Plus, Save, Pencil, Bell,
  User, Layers, Shield, Home, BarChart3, Zap, Droplets, Wrench, Tag,
  IndianRupee, ClipboardList, Receipt, ShieldCheck, CheckCircle2, Wallet, Clock,
} from 'lucide-react'
import { budgetSchema } from '@/lib/validations/budget.schema' // ADDED: validation rules
import { getErrors } from '@/lib/validations/validate' // ADDED: converts rule errors to { field: message }

/* ---------- Config ---------- */

// TODO: load from API later
const PERIODS = ['Monthly', 'Quarterly', 'Half-Yearly', 'Annual', 'Custom']
const FINANCIAL_YEARS = ['FY 2025 – 26', 'FY 2026 – 27', 'FY 2027 – 28']
const BUDGET_TYPES = ['Annual', 'Half-Yearly', 'Quarterly', 'Monthly']
const THRESHOLDS = ['50%', '60%', '70%', '80%', '90%', '100%']
const APPROVERS = ['Rahul Sharma (Admin)', 'Committee Member', 'Treasurer', 'Secretary']

// Category list with a default note and icon (shown in the allocation table)
const CATEGORIES: { name: string; note: string; icon: React.ElementType }[] = [
  { name: 'Security Services', note: 'Security guards, monitoring, etc.', icon: Shield },
  { name: 'Housekeeping', note: 'Cleaning, sanitation, staff', icon: Home },
  { name: 'Lift Maintenance', note: 'Lift AMC and repairs', icon: BarChart3 },
  { name: 'Electricity', note: 'Common area power bills', icon: Zap },
  { name: 'Water Supply', note: 'Water tanker and tank cleaning', icon: Droplets },
  { name: 'Repairs & Maintenance', note: 'General repair work', icon: Wrench },
]

// Colors used for the allocation bar (cycled by row index)
const BAR_COLORS = ['#14B8A6', '#6C63FF', '#3B82F6', '#F59E0B', '#EC4899', '#22C55E']

type Row = { id: number; category: string; amount: number; note: string }

// All text fields of the form (every field is a string)
type Vals = {
  name: string
  period: string
  startDate: string
  endDate: string
  financialYear: string
  description: string
  category: string
  budgetType: string
  amount: string
  alertThreshold: string
  approver: string
}

// Data received on save (rows, totals and flags are not plain strings, so they are added separately)
export type BudgetPayload = Vals & {
  id: number
  total: number
  approvalRequired: boolean
  status: 'draft' | 'submitted'
  rows: Row[]
}

const INITIAL: Vals = {
  name: '', period: '', startDate: '', endDate: '', financialYear: '', description: '',
  category: '', budgetType: 'Annual', amount: '',
  alertThreshold: '80%', approver: '',
}

// Hide the scrollbar (content still scrolls)
const noScrollbar =
  '[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden'

// Format a number as Indian rupees, e.g. 18,50,000
const money = (n: number) => n.toLocaleString('en-IN', { maximumFractionDigits: 0 })

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
  children: React.ReactNode
}) {
  return (
    <div className={`min-w-0 ${className}`}>
      <div className="mb-1 flex items-center justify-between gap-2">
        <label className="block text-[10px] text-slate-400">
          {label} {hint && <span className="text-slate-500">({hint})</span>}
        </label>
      </div>
      {children}
      {error && <p className="mt-1 text-[9px] text-red-400">{error}</p>}
    </div>
  )
}

function SectionHeader({
  icon: Icon, title, subtitle, divider = false, action,
}: {
  icon: React.ElementType
  title: string
  subtitle: string
  divider?: boolean
  action?: React.ReactNode
}) {
  return (
    <div
      className={`mb-3 flex items-center justify-between gap-2.5 ${
        divider ? 'mt-5 border-t border-[#272D39] pt-4' : ''
      }`}
    >
      <div className="flex min-w-0 items-center gap-2.5">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#6C63FF]/20 text-[#A29CFF]">
          <Icon className="h-3.5 w-3.5" />
        </span>
        <div className="min-w-0">
          <h3 className="text-xs font-bold">{title}</h3>
          <p className="text-[9px] text-slate-400">{subtitle}</p>
        </div>
      </div>
      {action}
    </div>
  )
}

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

function IconSelect({
  icon: Icon, placeholder, options, error, ...props
}: {
  icon: React.ElementType
  placeholder?: string
  options: string[]
  error?: boolean
} & React.SelectHTMLAttributes<HTMLSelectElement>) {
  const empty = !props.value
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-500" />
      <select
        {...props}
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
}: { error?: boolean } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="relative">
      <CalendarDays className="pointer-events-none absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-500" />
      <input
        type="date"
        value={value}
        {...props}
        className={`${inputCls(true, error)} scheme-dark ${value ? '' : 'text-slate-500'}`}
      />
    </div>
  )
}

/* ---------- Drawer ---------- */

export default function AddBudgetModal({
  open, onClose, onSave,
}: {
  open: boolean
  onClose: () => void
  onSave?: (data: BudgetPayload) => void
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
  onSave?: (data: BudgetPayload) => void
}) {
  const [v, setV] = useState<Vals>(INITIAL)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [rows, setRows] = useState<Row[]>([])
  const [editId, setEditId] = useState<number | null>(null)
  const [approval, setApproval] = useState(true)

  // Total budget = sum of all allocated categories
  const total = useMemo(() => rows.reduce((s, r) => s + r.amount, 0), [rows])

  // Lock page scroll while the drawer is open + close on Esc
  useEffect(() => {
    const html = document.documentElement
    const body = document.body
    const prevHtml = html.style.overflow
    const prevBody = body.style.overflow
    html.style.overflow = 'hidden'
    body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => {
      html.style.overflow = prevHtml
      body.style.overflow = prevBody
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  // k can only be a key of Vals (a wrong field name shows a red line)
  const bind = (k: keyof Vals) => ({
    value: v[k],
    onChange: (
      e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
    ) => {
      const val = e.target.value
      setV((p) => ({ ...p, [k]: val }))
      setErrors((p) => ({ ...p, [k]: '' }))
    },
  })

  // Amount field: allow only digits and a single decimal point (max 2 decimals)
  const onAmount = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    if (!/^\d*\.?\d{0,2}$/.test(val)) return
    setV((p) => ({ ...p, amount: val }))
    setErrors((p) => ({ ...p, amount: '', rows: '' }))
  }

  // Add a new category row (or update the one being edited)
  function addOrUpdateRow() {
    const err: Record<string, string> = {}
    if (!v.category) err.category = 'Select a category'
    if (!v.amount || parseFloat(v.amount) <= 0) err.amount = 'Enter a valid amount'
    // The same category cannot be added twice
    if (v.category && rows.some((r) => r.category === v.category && r.id !== editId))
      err.category = 'This category is already added'
    if (Object.keys(err).length) {
      setErrors((p) => ({ ...p, ...err }))
      return
    }
    const note = CATEGORIES.find((c) => c.name === v.category)?.note ?? ''
    const amount = parseFloat(v.amount)
    if (editId !== null) {
      setRows((p) => p.map((r) => (r.id === editId ? { ...r, category: v.category, amount, note } : r)))
      setEditId(null)
    } else {
      setRows((p) => [...p, { id: Date.now(), category: v.category, amount, note }])
    }
    setV((p) => ({ ...p, category: '', amount: '' }))
    setErrors((p) => ({ ...p, category: '', amount: '', rows: '' }))
  }

  // Load a row back into the form for editing
  function editRow(r: Row) {
    setEditId(r.id)
    setV((p) => ({ ...p, category: r.category, amount: String(r.amount) }))
  }

  function removeRow(id: number) {
    setRows((p) => p.filter((r) => r.id !== id))
    if (editId === id) {
      setEditId(null)
      setV((p) => ({ ...p, category: '', amount: '' }))
    }
  }

  // CHANGED: full validation for "Create Budget" (rules live in lib/validations/budget.schema.ts)
  function validate() {
    const err = getErrors(budgetSchema, { ...v, rowCount: rows.length, approval })
    setErrors(err)
    return Object.keys(err).length === 0
  }

  function build(status: 'draft' | 'submitted'): BudgetPayload {
    return { ...v, id: Date.now(), total, approvalRequired: approval, status, rows }
  }

  function submit(ev: React.FormEvent) {
    ev.preventDefault()
    if (!validate()) return
    // TODO: call the API here
    onSave?.(build('submitted'))
    onClose()
  }

  // Draft only needs a name
  function saveDraft() {
    if (!v.name.trim()) {
      setErrors({ name: 'Budget name is required to save a draft' })
      return
    }
    // TODO: call the draft API here
    onSave?.(build('draft'))
    onClose()
  }

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      onClick={onClose}
      // Gap only on top and bottom (and a small left gap on phones), none on the right
      className="fixed inset-0 z-100 flex justify-end bg-black/70 py-2 pl-2 backdrop-blur-sm sm:py-5 sm:pl-0"
    >
      <motion.form
        onSubmit={submit}
        noValidate
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="flex h-full w-full max-w-full flex-col overflow-hidden rounded-l-2xl border border-r-0 border-[#272D39] bg-[#10131A] text-white shadow-2xl sm:max-w-150"
      >
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between gap-3 p-3 pb-2 sm:p-4 sm:pb-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-[#6C63FF] to-[#4DA3FF]">
              <Wallet className="h-4 w-4 text-white" />
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-sm font-bold text-white">Create New Budget</h2>
              <p className="text-[10px] text-slate-400">Set spending limits and track society finances</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 cursor-pointer rounded-lg p-1.5 text-slate-300 hover:bg-white/5 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className={`mt-2 min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 text-white sm:px-4 ${noScrollbar}`}>
          <div className="rounded-xl border border-[#272D39] p-3 sm:p-3.5">
            {/* Section 1: Budget Information */}
            <SectionHeader
              icon={ClipboardList}
              title="1. Budget Information"
              subtitle="Name, period, dates and description"
            />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Budget Name *" error={errors.name}>
                <IconInput
                  icon={FileText}
                  {...bind('name')}
                  error={!!errors.name}
                  placeholder="e.g. Annual Society Maintenance"
                />
              </Field>

              <Field label="Budget Period *" error={errors.period}>
                <IconSelect
                  icon={CalendarDays}
                  {...bind('period')}
                  error={!!errors.period}
                  placeholder="Select period"
                  options={PERIODS}
                />
              </Field>

              <Field label="Start Date *" error={errors.startDate}>
                <DateInput {...bind('startDate')} error={!!errors.startDate} />
              </Field>

              <Field label="End Date *" error={errors.endDate}>
                <DateInput
                  {...bind('endDate')}
                  min={v.startDate || undefined}
                  error={!!errors.endDate}
                />
              </Field>
            </div>

            <div className="mt-3">
              <Field label="Financial Year *" error={errors.financialYear}>
                <IconSelect
                  icon={CalendarDays}
                  {...bind('financialYear')}
                  error={!!errors.financialYear}
                  placeholder="Select financial year"
                  options={FINANCIAL_YEARS}
                />
              </Field>
            </div>

            <div className="mt-3">
              <Field label="Description" hint="Optional">
                <div className="relative">
                  <FileText className="pointer-events-none absolute left-2.5 top-2.5 h-3 w-3 text-slate-500" />
                  <textarea
                    rows={4}
                    maxLength={500}
                    {...bind('description')}
                    placeholder="Add budget details, purpose and notes..."
                    className={`${inputCls(true)} resize-none ${noScrollbar}`}
                  />
                </div>
                <p className="mt-1 text-right text-[9px] text-slate-500">{v.description.length}/500</p>
              </Field>
            </div>

            {/* Section 2: Budget Allocation */}
            <SectionHeader
              divider
              icon={Layers}
              title="2. Budget Allocation"
              subtitle="Add categories and set their amounts"
              action={
                <button
                  type="button"
                  onClick={addOrUpdateRow}
                  className="flex shrink-0 cursor-pointer items-center gap-0.5 rounded-md border border-[#6C63FF]/50 bg-[#6C63FF]/10 px-2.5 py-1 text-[10px] font-medium text-[#A29CFF] hover:bg-[#6C63FF]/20 hover:text-white"
                >
                  <Plus className="h-3 w-3" /> {editId !== null ? 'Update Category' : 'Add Category'}
                </button>
              }
            />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Department / Category *" error={errors.category}>
                <IconSelect
                  icon={Layers}
                  {...bind('category')}
                  error={!!errors.category}
                  placeholder="Select department or category"
                  options={CATEGORIES.map((c) => c.name)}
                />
              </Field>

              <Field label="Budget Type *">
                <IconSelect icon={Bell} {...bind('budgetType')} options={BUDGET_TYPES} />
              </Field>
            </div>

            <div className="mt-3">
              <Field label="Total Budget Amount (₹) *" error={errors.amount}>
                <IconInput
                  icon={IndianRupee}
                  value={v.amount}
                  onChange={onAmount}
                  inputMode="decimal"
                  error={!!errors.amount}
                  placeholder="Enter total amount"
                />
              </Field>
            </div>

            {/* Allocation table (scrolls sideways on small screens) */}
            <div
              className={`mt-3 overflow-x-auto rounded-md border ${
                errors.rows ? 'border-red-500/60' : 'border-[#272D39]'
              } ${noScrollbar}`}
            >
              <table className="w-full min-w-[440px] text-left text-[10px]">
                <thead>
                  <tr className="border-b border-[#272D39] text-slate-400">
                    <th className="px-2.5 py-2 font-medium">Category</th>
                    <th className="px-2.5 py-2 font-medium">Amount (₹)</th>
                    <th className="px-2.5 py-2 font-medium">Notes</th>
                    <th className="px-2.5 py-2 text-right font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-3 py-5 text-center text-slate-500">
                        No categories added yet
                      </td>
                    </tr>
                  )}
                  {rows.map((r) => {
                    const Icon = CATEGORIES.find((c) => c.name === r.category)?.icon ?? Tag
                    return (
                      <tr key={r.id} className="border-b border-[#272D39] last:border-b-0">
                        <td className="px-2.5 py-2">
                          <div className="flex items-center gap-2 text-white">
                            <Icon className="h-3.5 w-3.5 shrink-0 text-slate-300" />
                            <span className="whitespace-nowrap">{r.category}</span>
                          </div>
                        </td>
                        <td className="whitespace-nowrap px-2.5 py-2 text-white">₹ {money(r.amount)}</td>
                        <td className="px-2.5 py-2 text-[#A29CFF]">{r.note}</td>
                        <td className="px-2.5 py-2">
                          <div className="flex items-center justify-end gap-2.5">
                            <button
                              type="button"
                              onClick={() => editRow(r)}
                              aria-label="Edit"
                              className="cursor-pointer text-slate-400 hover:text-white"
                            >
                              <Pencil className="h-3 w-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => removeRow(r.id)}
                              aria-label="Delete"
                              className="cursor-pointer text-slate-400 hover:text-red-400"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
            {errors.rows && <p className="mt-1 text-[9px] text-red-400">{errors.rows}</p>}

            {/* Section 3: Approval & Alerts */}
            <SectionHeader
              divider
              icon={Bell}
              title="3. Approval & Alerts"
              subtitle="Approval, alert threshold and approver"
            />

            {/* Approval toggle */}
            <button
              type="button"
              role="switch"
              aria-checked={approval}
              onClick={() => setApproval((p) => !p)}
              className="mb-3 flex w-full cursor-pointer items-center gap-2.5 rounded-md border border-[#272D39] bg-[#0B0E14] px-2.5 py-2 text-left"
            >
              <span
                className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${
                  approval ? 'bg-[#6C63FF]' : 'bg-[#272D39]'
                }`}
              >
                <span
                  className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${
                    approval ? 'left-4.5' : 'left-0.5'
                  }`}
                />
              </span>
              <span className="min-w-0">
                <span className="block text-[10px] font-medium text-white">Approval Required</span>
                <span className="block text-[9px] text-slate-400">
                  {approval ? 'Budget will require admin/committee approval' : 'No approval needed'}
                </span>
              </span>
            </button>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Alert Threshold *">
                <IconSelect icon={Bell} {...bind('alertThreshold')} options={THRESHOLDS} />
              </Field>

              <Field label={approval ? 'Notify Approver *' : 'Notify Approver'} error={errors.approver}>
                <IconSelect
                  icon={User}
                  {...bind('approver')}
                  error={!!errors.approver}
                  placeholder="Select approver"
                  options={APPROVERS}
                />
              </Field>
            </div>
          </div>

          {/* Budget Summary (live preview of the entered values) */}
          <div className="mt-3 rounded-xl border border-[#272D39] p-3 sm:p-3.5">
            <SectionHeader
              icon={Receipt}
              title="Budget Summary"
              subtitle="Live preview of this budget"
            />

            <dl className="flex flex-col gap-2 text-[11px]">
              {[
                ['Budget Name', v.name || '-'],
                ['Period', v.financialYear || '-'],
                ['Categories', `${rows.length} ${rows.length === 1 ? 'Category' : 'Categories'}`],
              ].map(([k, val]) => (
                <div key={k} className="flex items-center justify-between gap-3">
                  <dt className="text-slate-400">{k}</dt>
                  <dd className="min-w-0 truncate text-right text-white">{val}</dd>
                </div>
              ))}
              <div className="flex items-center justify-between gap-3 border-t border-[#272D39] pt-2">
                <dt className="text-slate-400">Total Budget</dt>
                <dd className="text-sm font-bold text-[#A29CFF]">₹ {money(total)}</dd>
              </div>
            </dl>

            {/* Allocation overview: stacked bar + legend */}
            <div className="mt-3 border-t border-[#272D39] pt-3">
              <p className="mb-2 text-[10px] font-semibold text-white">Allocation Overview</p>

              <div className="flex h-2.5 w-full overflow-hidden rounded-full bg-[#0B0E14]">
                {rows.map((r, i) => (
                  <div
                    key={r.id}
                    style={{ width: `${(r.amount / total) * 100}%`, background: BAR_COLORS[i % BAR_COLORS.length] }}
                  />
                ))}
              </div>

              <div className="mt-3 flex flex-col gap-2 text-[10px]">
                {rows.length === 0 && <p className="text-slate-500">Add categories to see the split</p>}
                {rows.map((r, i) => (
                  <div key={r.id} className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ background: BAR_COLORS[i % BAR_COLORS.length] }}
                    />
                    <span className="min-w-0 flex-1 truncate text-slate-300">{r.category}</span>
                    <span className="shrink-0 text-slate-400">{Math.round((r.amount / total) * 100)}%</span>
                    <span className="w-20 shrink-0 text-right text-white">₹ {money(r.amount)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-3 border-t border-[#272D39] pt-3">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                <span className="flex items-center justify-center gap-1.5 rounded-md border border-amber-500/40 bg-amber-500/10 px-2.5 py-1.5 text-[10px] font-medium text-amber-400">
                  <Clock className="h-3 w-3" /> Status: Draft
                </span>
                <span className="flex items-center justify-center gap-1.5 rounded-md border border-[#6C63FF]/40 bg-[#6C63FF]/10 px-2.5 py-1.5 text-[10px] font-medium text-[#A29CFF]">
                  <Clock className="h-3 w-3" /> {approval ? 'Pending Approval' : 'No Approval'}
                </span>
              </div>
            </div>
          </div>

          {/* Budget Rules */}
          <div className="mt-3 rounded-xl border border-[#272D39] p-3 sm:p-3.5">
            <SectionHeader
              icon={ShieldCheck}
              title="Budget Rules"
              subtitle="Checks applied to this budget"
            />
            <ul className="flex flex-col gap-2 text-[10px] text-slate-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                Allocated total must not exceed budget
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                Alerts at {v.alertThreshold} utilization
              </li>
            </ul>
          </div>
          <div className="h-3" />
        </div>

        {/* Footer: buttons share the full width on phones, sit on the right on larger screens */}
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-[#272D39] p-3 sm:p-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 cursor-pointer rounded-md border border-[#272D39] px-3.5 py-1.5 text-[11px] font-semibold text-white hover:bg-white/5 sm:flex-none"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={saveDraft}
            className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-md border border-[#272D39] px-3.5 py-1.5 text-[11px] font-semibold text-white hover:bg-white/5 sm:flex-none"
          >
            <Save className="h-3 w-3" /> Save as Draft
          </button>
          <button
            type="submit"
            className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-md bg-linear-to-r from-[#6C63FF] to-[#4DA3FF] px-4 py-1.5 text-[11px] font-semibold text-white hover:opacity-90 sm:flex-none"
          >
            <Plus className="h-3 w-3" /> Create Budget
          </button>
        </div>
      </motion.form>
    </motion.div>,
    document.body,
  )
}