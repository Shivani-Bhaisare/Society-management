'use client'

import { useEffect, useState } from 'react'
import type {
  ElementType,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
} from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  X, FileText, CalendarDays, ChevronDown, Users, Send, Eye, Clock, Flag,
  IndianRupee, Building2, Calculator, Receipt, Bell, ClipboardList,
  MessageCircle, Mail, Smartphone, StickyNote,
} from 'lucide-react'

/* ---------- Config ---------- */

// TODO: fetch these from the API later
const MONTHS = ['October 2026', 'November 2026', 'December 2026']
const WINGS = ['All Wings', 'A Wing', 'B Wing', 'C Wing', 'D Wing']
const BILL_TYPES = ['Maintenance', 'Sinking Fund', 'Water Charges', 'Parking', 'Amenities', 'Other']
const CALC_TYPES = ['Fixed per flat', 'Per sq. ft.', 'Custom per flat']

// Number of flats per wing (186 in total)
const FLATS_BY_WING: Record<string, number> = {
  'All Wings': 186,
  'A Wing': 48,
  'B Wing': 46,
  'C Wing': 46,
  'D Wing': 46,
}

const MAX_NOTES = 500

type NotifyKey = 'notifyWhatsApp' | 'notifyEmail' | 'notifySMS'

const NOTIFY_OPTIONS: { key: NotifyKey; label: string; icon: ElementType }[] = [
  { key: 'notifyWhatsApp', label: 'WhatsApp', icon: MessageCircle },
  { key: 'notifyEmail', label: 'Email', icon: Mail },
  { key: 'notifySMS', label: 'SMS', icon: Smartphone },
]

export type GenerateBillsForm = {
  id: number
  month: string
  wing: string
  billType: string
  calcType: string
  amount: string
  dueDate: string
  lateFee: string
  notes: string
  notifyWhatsApp: boolean
  notifyEmail: boolean
  notifySMS: boolean
  status: 'Draft' | 'Generated'
}

const noScrollbar =
  '[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden'

const toISO = (d: Date) => d.toISOString().split('T')[0]
const addDays = (n: number) => {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return toISO(d)
}
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
      <input {...props} className={inputCls(true, error)} />
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

export default function GenerateBillsModal({
  open, onClose, onSubmit,
}: {
  open: boolean
  onClose: () => void
  onSubmit?: (data: GenerateBillsForm) => void
}) {
  return (
    <AnimatePresence>
      {open && <Body onClose={onClose} onSubmit={onSubmit} />}
    </AnimatePresence>
  )
}

function Body({
  onClose, onSubmit,
}: {
  onClose: () => void
  onSubmit?: (data: GenerateBillsForm) => void
}) {
  const [month, setMonth] = useState(MONTHS[0])
  const [wing, setWing] = useState('All Wings')
  const [billType, setBillType] = useState('Maintenance')
  const [calcType, setCalcType] = useState('Fixed per flat')
  const [amount, setAmount] = useState('')
  const [dueDate, setDueDate] = useState(addDays(10))
  const [lateFee, setLateFee] = useState('')
  const [notes, setNotes] = useState('')
  const [notify, setNotify] = useState<Record<NotifyKey, boolean>>({
    notifyWhatsApp: true,
    notifyEmail: true,
    notifySMS: false,
  })
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

  const flats = FLATS_BY_WING[wing] ?? 0
  const amountNum = Number(amount) || 0
  const total = calcType === 'Fixed per flat' ? amountNum * flats : null

  function validate(asDraft: boolean) {
    const err: Record<string, string> = {}
    if (!asDraft) {
      if (!amount || amountNum <= 0) err.amount = 'Enter a valid amount'
      if (!dueDate) err.dueDate = 'Due date is required'
      else if (dueDate < toISO(new Date())) err.dueDate = 'Due date cannot be in the past'
    }
    setErrors(err)
    return Object.keys(err).length === 0
  }

  function save(finalStatus: 'Draft' | 'Generated') {
    if (!validate(finalStatus === 'Draft')) return
    // TODO: call the API here
    onSubmit?.({
      id: Date.now(),
      month,
      wing,
      billType,
      calcType,
      amount,
      dueDate,
      lateFee,
      notes,
      ...notify,
      status: finalStatus,
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
        onSubmit={(e) => {
          e.preventDefault()
          save('Generated')
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
              <Receipt className="h-4 w-4 text-white" />
            </span>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-white">Generate Bills</h2>
              <p className="text-[10px] text-slate-400">Create maintenance bills for residents</p>
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
        <div className={`mt-2 min-h-0 flex-1 overflow-y-auto overscroll-contain px-3.5 text-white sm:px-4 ${noScrollbar}`}>
          <div className="rounded-xl border border-[#272D39] p-3.5">
            {/* Section 1: Bill Details */}
            <SectionHead first icon={ClipboardList} title="Bill Details" sub="Month, wing, bill type and calculation" />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Billing Month">
                <IconSelect
                  icon={CalendarDays}
                  value={month}
                  onChange={(e) => setMonth(e.target.value)}
                  options={MONTHS}
                />
              </Field>

              <Field label="Apply To">
                <IconSelect
                  icon={Building2}
                  value={wing}
                  onChange={(e) => setWing(e.target.value)}
                  options={WINGS}
                />
              </Field>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Bill Type">
                <IconSelect
                  icon={FileText}
                  value={billType}
                  onChange={(e) => setBillType(e.target.value)}
                  options={BILL_TYPES}
                />
              </Field>

              <Field label="Calculation">
                <IconSelect
                  icon={Calculator}
                  value={calcType}
                  onChange={(e) => setCalcType(e.target.value)}
                  options={CALC_TYPES}
                />
              </Field>
            </div>

            {/* Section 2: Amount & Schedule */}
            <SectionHead icon={IndianRupee} title="Amount & Schedule" sub="Bill amount, due date and late fee" />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Amount" error={errors.amount}>
                <IconInput
                  icon={IndianRupee}
                  type="number"
                  min="0"
                  value={amount}
                  onChange={(e) => { setAmount(e.target.value); clearErr('amount') }}
                  error={!!errors.amount}
                  placeholder="e.g. 4500"
                />
              </Field>

              <Field label="Due Date" error={errors.dueDate}>
                <DateInput
                  value={dueDate}
                  min={toISO(new Date())}
                  onChange={(e) => { setDueDate(e.target.value); clearErr('dueDate') }}
                  error={!!errors.dueDate}
                />
              </Field>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Late Fee" hint="Optional, per month">
                <IconInput
                  icon={IndianRupee}
                  type="number"
                  min="0"
                  value={lateFee}
                  onChange={(e) => setLateFee(e.target.value)}
                  placeholder="e.g. 100"
                />
              </Field>
            </div>

            {/* Section 3: Notes */}
            <SectionHead icon={StickyNote} title="Notes" sub="Extra details shown on the bill" />

            <Field label="Bill Notes" hint="Optional">
              <div className="overflow-hidden rounded-md border border-[#272D39] bg-[#0B0E14] transition-colors focus-within:border-[#6C63FF]">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value.slice(0, MAX_NOTES))}
                  placeholder="e.g. Includes lift AMC and security charges"
                  className={`block min-h-20 max-h-40 w-full resize-none bg-transparent px-2.5 py-2 text-[11px] text-white outline-none placeholder:text-slate-500 ${noScrollbar}`}
                />
              </div>
              <p className="mt-1 text-right text-[9px] text-slate-500">
                {notes.length}/{MAX_NOTES}
              </p>
            </Field>

            {/* Section 4: Notifications */}
            <SectionHead icon={Bell} title="Notify Residents" sub="Choose how residents get the bill" />

            <div className="grid grid-cols-3 gap-1 rounded-md border border-[#272D39] bg-[#0B0E14] p-0.5">
              {NOTIFY_OPTIONS.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setNotify((p) => ({ ...p, [key]: !p[key] }))}
                  className={`flex min-w-0 cursor-pointer items-center justify-center gap-1.5 rounded px-1 py-1.5 text-[11px] transition-colors ${
                    notify[key]
                      ? 'bg-linear-to-r from-[#6C63FF] to-[#4DA3FF] font-semibold text-white'
                      : 'text-slate-400 hover:bg-white/5'
                  }`}
                >
                  <Icon className="h-3 w-3 shrink-0" /> <span className="truncate">{label}</span>
                </button>
              ))}
            </div>

            {/* Section 5: Bill Preview */}
            <SectionHead icon={Eye} title="Bill Preview" sub="This is a summary of the bills to be generated" />

            <div className="rounded-lg border border-[#272D39] bg-[#0B0E14] p-3">
              <div className="flex items-start gap-2.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#6C63FF]/25 text-[#A29CFF]">
                  <Receipt className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold">{billType} Bill – {month}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <span className="rounded-full bg-[#6C63FF]/20 px-2 py-0.5 text-[9px] font-medium text-[#A29CFF]">
                      {wing}
                    </span>
                    <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-[9px] font-medium text-amber-400">
                      {calcType}
                    </span>
                    {Number(lateFee) > 0 && (
                      <span className="flex items-center gap-1 rounded-full bg-red-500/15 px-2 py-0.5 text-[9px] font-medium text-red-400">
                        <Flag className="h-2 w-2" /> Late fee ₹{Number(lateFee).toLocaleString('en-IN')}
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-3 border-y border-[#272D39] py-2.5 min-[400px]:grid-cols-2">
                <div className="flex items-center gap-2">
                  <Users className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  <div className="min-w-0">
                    <p className="truncate text-[10px] font-medium">{flats} flats</p>
                    <p className="text-[9px] text-slate-500">Will be billed</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  <div className="min-w-0">
                    <p className="truncate text-[10px] font-medium">{fmt(dueDate)}</p>
                    <p className="text-[9px] text-slate-500">Due On</p>
                  </div>
                </div>
              </div>

              <div className="mt-2.5 flex items-center justify-between gap-2">
                <span className="shrink-0 text-[10px] text-slate-400">Estimated total</span>
                <span className="min-w-0 truncate text-right text-xs font-bold">
                  {total !== null
                    ? `₹ ${total.toLocaleString('en-IN')}`
                    : 'Calculated on generation'}
                </span>
              </div>

              <p className="mt-2 line-clamp-2 whitespace-pre-line break-words text-[10px] leading-relaxed text-slate-400">
                {notes.trim() ||
                  'This is a preview of your bills. Notes and details will appear here as you fill the form.'}
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
            onClick={() => save('Draft')}
            className="cursor-pointer rounded-md border border-[#272D39] px-3.5 py-2 text-[11px] font-semibold text-white hover:bg-white/5 sm:py-1.5"
          >
            Save as Draft
          </button>
          <button
            type="button"
            onClick={() => save('Generated')}
            className="col-span-2 flex cursor-pointer items-center justify-center gap-1.5 rounded-md bg-linear-to-r from-[#6C63FF] to-[#4DA3FF] px-4 py-2 text-[11px] font-semibold text-white hover:opacity-90 sm:col-span-1 sm:py-1.5"
          >
            <Send className="h-3 w-3" /> Generate Bills
          </button>
        </div>
      </motion.form>
    </motion.div>,
    document.body,
  )
}