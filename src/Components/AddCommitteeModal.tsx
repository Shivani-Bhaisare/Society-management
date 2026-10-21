'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  X, User, Mail, Phone, Building2, CalendarDays, FileText,
  Users, ChevronDown, Check, Activity, UserPlus,
} from 'lucide-react'
import { committeeSchema } from '@/lib/validations/committee.schema' // ADDED: validation rules
import { getErrors } from '@/lib/validations/validate' // ADDED: converts rule errors to { field: message }

/* ---------- Config ---------- */

const ROLES = [
  'President', 'Vice President', 'Secretary', 'Joint Secretary',
  'Treasurer', 'Executive Member', 'Member',
]

// Tower / Unit list: A-101, A-102 ... (load from the API later)
const UNITS = ['A', 'B', 'C', 'D', 'E', 'F'].flatMap((t) => {
  const list: string[] = []
  for (let floor = 1; floor <= 8; floor++) {
    for (let n = 1; n <= 4; n++) list.push(`${t}-${floor}0${n}`)
  }
  return list
})

type Vals = Record<string, string>

const INITIAL: Vals = {
  name: '', email: '', phone: '', role: '', unit: '',
  startDate: '', endDate: '', status: 'Active', notes: '',
}

export type CommitteeForm = Vals & { invite: boolean }

/* Hide the scrollbar (content still scrolls, the bar is just not visible) */
const noScrollbar =
  '[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden'

/* ---------- Styles ---------- */
/* bg: #10131A | input bg: #0B0E14 | border: #272D39 | accent: #6C63FF / #A29CFF */

// CHANGED: added the error argument (red border when a field has an error)
const inputCls = (icon = false, error = false) =>
  `w-full rounded-md border bg-[#0B0E14] py-2 text-[11px] text-white outline-none transition-colors placeholder:text-slate-500 focus:border-[#6C63FF] ${
    error ? 'border-red-500/60' : 'border-[#272D39]'
  } ${icon ? 'pl-8 pr-2.5' : 'px-2.5'}`

// CHANGED: Field now shows an error message under the input
function Field({
  label, hint, error, className = '', children,
}: {
  label: string; hint?: string; error?: string; className?: string; children: React.ReactNode
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

// CHANGED: IconInput accepts an error flag
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

// CHANGED: IconSelect accepts an error flag
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

// CHANGED: DateInput accepts an error flag
function DateInput({
  error, ...props
}: { error?: boolean } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="relative">
      <CalendarDays className="pointer-events-none absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-500" />
      <input
        type="date"
        {...props}
        className={`${inputCls(true, error)} scheme-dark ${props.value ? '' : 'text-slate-500'}`}
      />
    </div>
  )
}

function Check2({ on, onChange, label }: { on: boolean; onChange: () => void; label: string }) {
  return (
    <button type="button" onClick={onChange} className="flex cursor-pointer items-center gap-2 text-left text-[10px] text-slate-200">
      <span
        className={`flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded border ${
          on ? 'border-[#6C63FF] bg-[#6C63FF]' : 'border-[#272D39]'
        }`}
      >
        {on && <Check className="h-2.5 w-2.5 text-white" />}
      </span>
      {label}
    </button>
  )
}

/* ---------- Drawer ---------- */

export default function AddCommitteeModal({
  open, onClose, onSubmit,
}: {
  open: boolean
  onClose: () => void
  onSubmit?: (data: CommitteeForm) => void
}) {
  return (
    <AnimatePresence>
      {open && <Body onClose={onClose} onSubmit={onSubmit} />}
    </AnimatePresence>
  )
}

function Body({
  onClose, onSubmit,
}: { onClose: () => void; onSubmit?: (data: CommitteeForm) => void }) {
  const [v, setV] = useState<Vals>(INITIAL)
  const [errors, setErrors] = useState<Record<string, string>>({}) // ADDED: error messages per field
  const [invite, setInvite] = useState(true)

  // Lock the page scroll behind the drawer as soon as it opens + close on Esc
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

  // CHANGED: typing in a field also clears its error
  const bind = (k: string) => ({
    value: v[k] ?? '',
    onChange: (
      e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
    ) => {
      const val = e.target.value
      setV((p) => ({ ...p, [k]: val }))
      setErrors((p) => ({ ...p, [k]: '' }))
    },
  })

  // ADDED: validation (rules live in lib/validations/committee.schema.ts)
  function validate() {
    const err = getErrors(committeeSchema, v)
    setErrors(err)
    return Object.keys(err).length === 0
  }

  function submit(ev: React.FormEvent) {
    ev.preventDefault()
    if (!validate()) return // CHANGED: stop here when there are errors
    // TODO: add the API call here
    onSubmit?.({ ...v, invite })
    onClose()
  }

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      onClick={onClose}
      // No gap on the right side, only top and bottom gap
      className="fixed inset-0 z-100 flex justify-end bg-black/70 py-3 pl-3 backdrop-blur-sm sm:py-5 sm:pl-0"
    >
      <motion.form
        onSubmit={submit}
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
              <Users className="h-4 w-4 text-white" />
            </span>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-white">Add Committee Member</h2>
              <p className="text-[10px] text-slate-400">Assign a role and contact details for your society committee</p>
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

        {/* Body: scrolls without a visible scrollbar */}
        <div className={`mt-2 min-h-0 flex-1 overflow-y-auto overscroll-contain px-3.5 text-white sm:px-4 ${noScrollbar}`}>
          <div className="rounded-xl border border-[#272D39] p-3.5">
            {/* Section 1 */}
            <div className="mb-3 flex items-center gap-2.5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#6C63FF]/20 text-[#A29CFF]">
                <User className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0">
                <h3 className="text-xs font-bold">Member Details</h3>
                <p className="text-[9px] text-slate-400">Personal information and committee role</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Full Name" error={errors.name}>
                <IconInput icon={User} {...bind('name')} error={!!errors.name} placeholder="Enter full name" />
              </Field>

              <Field label="Email Address" error={errors.email}>
                <IconInput icon={Mail} type="email" {...bind('email')} error={!!errors.email} placeholder="Enter email address" />
              </Field>

              <Field label="Phone Number" error={errors.phone}>
                <IconInput icon={Phone} type="tel" {...bind('phone')} error={!!errors.phone} placeholder="Enter phone number" />
              </Field>

              <Field label="Committee Role" error={errors.role}>
                <IconSelect icon={Users} {...bind('role')} error={!!errors.role} placeholder="Select role" options={ROLES} />
              </Field>

              <Field label="Tower / Unit" hint="Optional">
                <IconSelect icon={Building2} {...bind('unit')} placeholder="Select tower / unit" options={UNITS} />
              </Field>

              <Field label="Term Start Date" error={errors.startDate}>
                <DateInput {...bind('startDate')} error={!!errors.startDate} />
              </Field>

              <Field label="Term End Date" error={errors.endDate}>
                <DateInput {...bind('endDate')} error={!!errors.endDate} />
              </Field>

              <Field label="Status" error={errors.status}>
                <IconSelect icon={Activity} {...bind('status')} error={!!errors.status} options={['Active', 'Inactive']} />
              </Field>
            </div>

            {/* Section 2 */}
            <div className="mb-3 mt-5 flex items-center gap-2.5 border-t border-[#272D39] pt-4">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#6C63FF]/20 text-[#A29CFF]">
                <FileText className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0">
                <h3 className="text-xs font-bold">Responsibilities &amp; Notes</h3>
                <p className="text-[9px] text-slate-400">Optional details about the member&apos;s duties</p>
              </div>
            </div>

            <textarea
              rows={4}
              {...bind('notes')}
              placeholder="Add responsibilities or notes..."
              className={`${inputCls()} resize-none`}
            />

            <div className="mt-4 rounded-md border border-[#272D39] bg-[#0B0E14] p-2.5">
              <Check2 on={invite} onChange={() => setInvite((p) => !p)} label="Send invitation to member" />
            </div>
          </div>
          <div className="h-3" />
        </div>

        {/* Footer */}
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-[#272D39] p-3.5 sm:p-4">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-md border border-[#272D39] px-3.5 py-1.5 text-[11px] font-semibold text-white hover:bg-white/5 max-sm:flex-1"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex cursor-pointer items-center justify-center gap-1.5 rounded-md bg-linear-to-r from-[#6C63FF] to-[#4DA3FF] px-4 py-1.5 text-[11px] font-semibold text-white hover:opacity-90 max-sm:flex-1"
          >
            <UserPlus className="h-3 w-3" /> Add Member
          </button>
        </div>
      </motion.form>
    </motion.div>,
    document.body,
  )
}