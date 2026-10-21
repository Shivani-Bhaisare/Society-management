'use client'

import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  X, User, Mail, Phone, Building2, Home, CalendarDays, FileText,
  Briefcase, Users, Car, ChevronDown, Check, Clock, UserPlus,
} from 'lucide-react'
import { residentSchema } from '@/lib/validations/resident.schema' // ADDED: validation rules
import { getErrors } from '@/lib/validations/validate' // ADDED: converts rule errors to { field: message }

/* ---------- Config ---------- */

const TOWERS = ['Tower A', 'Tower B', 'Tower C', 'Tower D', 'Tower E', 'Tower F']

// Generate flats for a tower: A-101, A-102 ... (load from API later)
const unitsFor = (tower: string) => {
  const t = tower.replace('Tower ', '')
  const list: string[] = []
  for (let floor = 1; floor <= 8; floor++) {
    for (let n = 1; n <= 4; n++) list.push(`${t}-${floor}0${n}`)
  }
  return list
}

// All text fields of the form (every field is a string)
type Vals = {
  name: string
  email: string
  phone: string
  type: string
  tower: string
  unit: string
  moveIn: string
  status: string
  occupation: string
  family: string
  vehicle: string
  emergency: string
}

const INITIAL: Vals = {
  name: '', email: '', phone: '', type: '', tower: '', unit: '',
  moveIn: '', status: '', occupation: '', family: '', vehicle: '', emergency: '',
}

// Data received on submit (invite is a boolean, so it is added separately)
export type ResidentForm = Vals & { invite: boolean }

// Hide the scrollbar (content still scrolls)
const noScrollbar =
  '[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden'

/* ---------- Styles (compact, same as AddNoticeModal) ---------- */
/* bg: #10131A | input bg: #0B0E14 | border: #272D39 | accent: #6C63FF / #A29CFF */

// CHANGED: added the error argument (red border when a field has an error)
const inputCls = (icon = false, error = false) =>
  `w-full rounded-md border bg-[#0B0E14] py-2 text-[11px] text-white outline-none transition-colors placeholder:text-slate-500 focus:border-[#6C63FF] ${
    error ? 'border-red-500/60' : 'border-[#272D39]'
  } ${icon ? 'pl-8 pr-2.5' : 'px-2.5'}`

// CHANGED: Field now shows an error message under the input
function Field({
  label, error, className = '', children,
}: {
  label: string; error?: string; className?: string; children: React.ReactNode
}) {
  return (
    <div className={`min-w-0 ${className}`}>
      <label className="mb-1 block text-[10px] text-slate-400">{label}</label>
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
  placeholder: string
  options: string[]
  error?: boolean
} & React.SelectHTMLAttributes<HTMLSelectElement>) {
  const empty = !props.value
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-500" />
      <select
        {...props}
        className={`${inputCls(true, error)} appearance-none pr-7 disabled:cursor-not-allowed disabled:opacity-60 ${
          empty ? 'text-slate-500' : ''
        }`}
      >
        <option value="" className="bg-[#10131A] text-slate-400">{placeholder}</option>
        {options.map((o) => (
          <option key={o} value={o} className="bg-[#10131A] text-white">{o}</option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-400" />
    </div>
  )
}

function SectionHead({
  icon: Icon, title, sub, first = false,
}: { icon: React.ElementType; title: string; sub: string; first?: boolean }) {
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

function Check2({ on, onChange, label }: { on: boolean; onChange: () => void; label: string }) {
  return (
    <button type="button" onClick={onChange} className="flex cursor-pointer items-center gap-2 text-left text-[11px] text-slate-200">
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

export default function AddResidentModal({
  open, onClose, onSubmit,
}: {
  open: boolean
  onClose: () => void
  onSubmit?: (data: ResidentForm) => void
}) {
  return (
    <AnimatePresence>
      {open && <Body onClose={onClose} onSubmit={onSubmit} />}
    </AnimatePresence>
  )
}

function Body({
  onClose, onSubmit,
}: { onClose: () => void; onSubmit?: (data: ResidentForm) => void }) {
  const [v, setV] = useState<Vals>(INITIAL)
  const [errors, setErrors] = useState<Record<string, string>>({}) // ADDED: error messages per field
  const [invite, setInvite] = useState(true)

  // Flats depend on the selected tower
  const units = useMemo(() => (v.tower ? unitsFor(v.tower) : []), [v.tower])

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
  // Changing the tower also clears the selected unit
  // CHANGED: typing in a field also clears its error (and the unit error when the tower changes)
  const bind = (k: keyof Vals) => ({
    value: v[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const val = e.target.value
      setV((p) => (k === 'tower' ? { ...p, tower: val, unit: '' } : { ...p, [k]: val }))
      setErrors((p) => (k === 'tower' ? { ...p, tower: '', unit: '' } : { ...p, [k]: '' }))
    },
  })

  // ADDED: validation (rules live in lib/validations/resident.schema.ts)
  function validate() {
    const err = getErrors(residentSchema, v)
    setErrors(err)
    return Object.keys(err).length === 0
  }

  function submit(ev: React.FormEvent) {
    ev.preventDefault()
    if (!validate()) return // CHANGED: stop here when there are errors
    // TODO: call the API here
    onSubmit?.({ ...v, invite })
    onClose()
  }

  // Portal: the drawer renders directly inside document.body
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
              <UserPlus className="h-4 w-4 text-white" />
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-sm font-bold text-white">Add New Resident</h2>
              <p className="text-[10px] text-slate-400">Add resident and unit details to your society</p>
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

        {/* Body: scrolls, but the scrollbar stays hidden */}
        <div className={`mt-2 min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 text-white sm:px-4 ${noScrollbar}`}>
          <div className="rounded-xl border border-[#272D39] p-3 sm:p-3.5">
            {/* Section 1: Resident details */}
            <SectionHead first icon={User} title="Resident Details" sub="Basic information and unit allocation" />

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

              <Field label="Resident Type" error={errors.type}>
                <IconSelect icon={User} {...bind('type')} error={!!errors.type} placeholder="Owner / Tenant" options={['Owner', 'Tenant']} />
              </Field>

              <Field label="Tower" error={errors.tower}>
                <IconSelect icon={Building2} {...bind('tower')} error={!!errors.tower} placeholder="Select tower" options={TOWERS} />
              </Field>

              {/* Disabled until a tower is selected */}
              <Field label="Unit / Flat Number" error={errors.unit}>
                <IconSelect
                  icon={Home}
                  {...bind('unit')}
                  error={!!errors.unit}
                  disabled={!v.tower}
                  placeholder={v.tower ? 'Select unit / flat number' : 'Select tower first'}
                  options={units}
                />
              </Field>

              <Field label="Move-in Date" error={errors.moveIn}>
                <div className="relative">
                  <CalendarDays className="pointer-events-none absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-500" />
                  <input
                    type="date"
                    {...bind('moveIn')}
                    className={`${inputCls(true, !!errors.moveIn)} scheme-dark ${v.moveIn ? '' : 'text-slate-500'}`}
                  />
                </div>
              </Field>

              <Field label="Resident Status" error={errors.status}>
                <IconSelect icon={Clock} {...bind('status')} error={!!errors.status} placeholder="Active / Inactive" options={['Active', 'Inactive']} />
              </Field>
            </div>

            {/* Section 2: Additional details (optional) */}
            <SectionHead icon={FileText} title="Additional Details" sub="Optional information about the resident" />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Occupation">
                <IconInput icon={Briefcase} {...bind('occupation')} placeholder="Enter occupation" />
              </Field>
              <Field label="Family Members" error={errors.family}>
                <IconInput icon={Users} type="number" min={0} inputMode="numeric" {...bind('family')} error={!!errors.family} placeholder="Enter number" />
              </Field>
              <Field label="Vehicle Number" error={errors.vehicle}>
                <IconInput icon={Car} {...bind('vehicle')} error={!!errors.vehicle} placeholder="Enter vehicle number" />
              </Field>
              <Field label="Emergency Contact" error={errors.emergency}>
                <IconInput icon={Phone} type="tel" {...bind('emergency')} error={!!errors.emergency} placeholder="Enter emergency contact" />
              </Field>
            </div>

            {/* Welcome invitation checkbox */}
            <div className="mt-4 rounded-md border border-[#272D39] bg-[#0B0E14] p-2.5">
              <Check2 on={invite} onChange={() => setInvite((p) => !p)} label="Send welcome invitation to resident" />
            </div>
          </div>
          <div className="h-3" />
        </div>

        {/* Footer: buttons share the full width on phones, sit on the right on larger screens */}
        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-[#272D39] p-3 sm:p-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 cursor-pointer rounded-md border border-[#272D39] px-3.5 py-1.5 text-[11px] font-semibold text-white hover:bg-white/5 sm:flex-none"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex flex-1 cursor-pointer items-center justify-center gap-1.5 rounded-md bg-linear-to-r from-[#6C63FF] to-[#4DA3FF] px-4 py-1.5 text-[11px] font-semibold text-white hover:opacity-90 sm:flex-none"
          >
            <UserPlus className="h-3 w-3" /> Add Resident
          </button>
        </div>
      </motion.form>
    </motion.div>,
    document.body,
  )
}