'use client'

import { useEffect, useState } from 'react'
import type {
  ElementType,
  FormEvent,
  InputHTMLAttributes,
  ReactNode,
  SelectHTMLAttributes,
} from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  X, ChevronDown, ChevronRight, Store, LayoutGrid, MapPin, Users, Clock, IndianRupee,
  FileText, UploadCloud, Trash2, Plus, Wrench, ShieldCheck, CalendarDays, ImageIcon,
  ClipboardList, Timer, CalendarCheck, Power,
} from 'lucide-react'
import { facilitySchema } from '@/lib/validations/facility.schema' // NEW

/* ---------- Config ---------- */

// TODO: fetch these from the API later
const CATEGORIES = ['Sports', 'Recreation', 'Fitness', 'Event Space', 'Kids Zone', 'Parking', 'Other']
const LOCATIONS = ['Tower A', 'Tower B', 'Tower C', 'Clubhouse', 'Ground Floor', 'Terrace', 'Basement']
const DURATIONS = ['30 minutes', '60 minutes', '90 minutes', '120 minutes']
const ALLOWED_FOR = ['Residents and family members', 'Residents only', 'Owners only', 'Everyone (incl. guests)']
const ACCESS_FOR = ['All residents', 'Owners only', 'Tenants only', 'Committee members']

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const
type Day = (typeof DAYS)[number]

// From 12:00 AM to 11:30 PM, in 30-minute steps
const TIMES: string[] = Array.from({ length: 48 }, (_, i) => {
  const h24 = Math.floor(i / 2)
  const m = i % 2 === 0 ? '00' : '30'
  const h12 = h24 % 12 === 0 ? 12 : h24 % 12
  return `${String(h12).padStart(2, '0')}:${m} ${h24 < 12 ? 'AM' : 'PM'}`
})

const MAX_DESC = 500
const MAX_RULES = 500

export type FacilityPayload = {
  id: number
  name: string
  category: string
  description: string
  location: string
  capacity: string
  openingTime: string
  closingTime: string
  days: Day[]
  bookingRequired: boolean
  duration: string
  charges: string
  allowedFor: string
  image: File | null
  rules: string
  maintenance: { from: string; to: string; closed: boolean }
  access: { who: string; guestsAllowed: boolean }
  available: boolean
}

const noScrollbar =
  '[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden'

const toISO = (d: Date) => d.toISOString().split('T')[0]

/* ---------- Styles ---------- */
/* bg: #10131A | input bg: #0B0E14 | border: #272D39 | accent: #6C63FF / #A29CFF */

const inputCls = (icon = false, error = false) =>
  `w-full rounded-md border bg-[#0B0E14] py-2 text-[11px] text-white outline-none transition-colors placeholder:text-slate-500 focus:border-[#6C63FF] disabled:cursor-not-allowed disabled:opacity-40 ${
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

function SectionHead({
  icon: Icon, title, sub, first = false, badge,
}: {
  icon: ElementType
  title: string
  sub: string
  first?: boolean
  badge?: ReactNode
}) {
  return (
    <div
      className={`mb-3 flex items-center gap-2.5 ${
        first ? '' : 'mt-5 border-t border-[#272D39] pt-4'
      }`}
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#6C63FF]/20 text-[#A29CFF]">
        <Icon className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0 flex-1">
        <h3 className="text-xs font-bold">{title}</h3>
        <p className="text-[9px] text-slate-400">{sub}</p>
      </div>
      {badge}
    </div>
  )
}

function Toggle({
  checked, onChange, color = 'purple',
}: { checked: boolean; onChange: (v: boolean) => void; color?: 'purple' | 'green' }) {
  const on = color === 'green' ? 'border-emerald-500 bg-emerald-500' : 'border-[#6C63FF] bg-[#6C63FF]'
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-5 w-9 shrink-0 cursor-pointer rounded-full border transition-colors ${
        checked ? on : 'border-[#272D39] bg-[#0B0E14]'
      }`}
    >
      <span
        className={`absolute top-0.5 h-3.5 w-3.5 rounded-full bg-white transition-all ${
          checked ? 'left-4.5' : 'left-0.5'
        }`}
      />
    </button>
  )
}

/* ---------- Drawer ---------- */

export default function AddFacilityModal({
  open, onClose, onSave,
}: {
  open: boolean
  onClose: () => void
  onSave?: (data: FacilityPayload) => void
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
  onSave?: (data: FacilityPayload) => void
}) {
  // Basic info
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [capacity, setCapacity] = useState('')

  // Operating hours
  const [openingTime, setOpeningTime] = useState('06:00 AM')
  const [closingTime, setClosingTime] = useState('10:00 PM')
  const [days, setDays] = useState<Day[]>(['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'])

  // Booking
  const [bookingRequired, setBookingRequired] = useState(true)
  const [duration, setDuration] = useState('60 minutes')
  const [charges, setCharges] = useState('')
  const [allowedFor, setAllowedFor] = useState(ALLOWED_FOR[0])

  // Image + rules
  const [image, setImage] = useState<File | null>(null)
  const [preview, setPreview] = useState('')
  const [imageError, setImageError] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [rules, setRules] = useState('')

  // Maintenance + access
  const [openPanel, setOpenPanel] = useState<'maintenance' | 'access' | null>(null)
  const [mFrom, setMFrom] = useState('')
  const [mTo, setMTo] = useState('')
  const [closed, setClosed] = useState(false)
  const [accessWho, setAccessWho] = useState(ACCESS_FOR[0])
  const [guestsAllowed, setGuestsAllowed] = useState(false)

  // Status
  const [available, setAvailable] = useState(true)

  const [errors, setErrors] = useState<Record<string, string>>({})

  const today = toISO(new Date())

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

  // Revoke the image preview URL on cleanup
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview)
    }
  }, [preview])

  const clearErr = (k: string) => setErrors((p) => ({ ...p, [k]: '' }))

  const toggleDay = (d: Day) => {
    setDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]))
    clearErr('days')
  }

  /* Image upload */
  function pickImage(list: FileList | null) {
    const f = list?.[0]
    if (!f) return
    const okType = /\.(png|jpe?g|webp)$/i.test(f.name)
    const okSize = f.size <= 5 * 1024 * 1024
    if (!okType || !okSize) {
      setImageError('Only PNG, JPG or WEBP images up to 5 MB are allowed')
      return
    }
    setImageError('')
    setImage(f)
    setPreview(URL.createObjectURL(f))
  }
  function removeImage() {
    setImage(null)
    setPreview('')
  }

  // NEW: validation now runs through the zod schema
  function validate() {
    const result = facilitySchema.safeParse({
      name, category, description, location, capacity,
      openingTime, closingTime, days, bookingRequired, charges,
      rules, mFrom, mTo,
    })

    const err: Record<string, string> = {}
    if (!result.success) {
      for (const issue of result.error.issues) {
        const key = String(issue.path[0])
        if (!err[key]) err[key] = issue.message
      }
    }

    setErrors(err)
    // Open the maintenance panel if its error would be hidden
    if (err.mTo) setOpenPanel('maintenance')
    return result.success
  }

  function submit(ev: FormEvent) {
    ev.preventDefault()
    if (!validate()) return
    // TODO: call the API here
    onSave?.({
      id: Date.now(),
      name: name.trim(),
      category,
      description: description.trim(),
      location,
      capacity,
      openingTime,
      closingTime,
      days: DAYS.filter((d) => days.includes(d)),
      bookingRequired,
      duration,
      charges: bookingRequired ? charges : '',
      allowedFor,
      image,
      rules: rules.trim(),
      maintenance: { from: mFrom, to: mTo, closed },
      access: { who: accessWho, guestsAllowed },
      available,
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
        onSubmit={submit}
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
              <Store className="h-4 w-4 text-white" />
            </span>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-white">Add New Facility</h2>
              <p className="text-[10px] text-slate-400">Add and configure a society amenity</p>
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
            {/* Section 1: Basic Information */}
            <SectionHead first icon={ClipboardList} title="Basic Information" sub="Name, category, location and capacity" />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Facility Name" error={errors.name}>
                <IconInput
                  icon={Store}
                  value={name}
                  onChange={(e) => { setName(e.target.value); clearErr('name') }}
                  error={!!errors.name}
                  placeholder="e.g. Swimming Pool"
                />
              </Field>

              <Field label="Facility Category" error={errors.category}>
                <IconSelect
                  icon={LayoutGrid}
                  value={category}
                  onChange={(e) => { setCategory(e.target.value); clearErr('category') }}
                  error={!!errors.category}
                  placeholder="Select category"
                  options={CATEGORIES}
                />
              </Field>
            </div>

            <div className="mt-3">
              <Field label="Description" hint="Optional">
                <div className="relative">
                  <FileText className="pointer-events-none absolute left-2.5 top-2.5 h-3 w-3 text-slate-500" />
                  <textarea
                    rows={3}
                    maxLength={MAX_DESC}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe the facility and its available amenities..."
                    className={`${inputCls(true)} resize-none ${noScrollbar}`}
                  />
                </div>
                <p className="mt-1 text-right text-[9px] text-slate-500">
                  {description.length}/{MAX_DESC}
                </p>
              </Field>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Location / Block" hint="Optional">
                <IconSelect
                  icon={MapPin}
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Select location"
                  options={LOCATIONS}
                />
              </Field>

              <Field label="Maximum Capacity" hint="Optional" error={errors.capacity}>
                <IconInput
                  icon={Users}
                  inputMode="numeric"
                  value={capacity}
                  onChange={(e) => { setCapacity(e.target.value.replace(/\D/g, '')); clearErr('capacity') }}
                  error={!!errors.capacity}
                  placeholder="e.g. 40 people"
                />
              </Field>
            </div>

            {/* Section 2: Operating Hours */}
            <SectionHead icon={Clock} title="Operating Hours" sub="Timings and available days" />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Opening Time">
                <IconSelect
                  icon={Clock}
                  value={openingTime}
                  onChange={(e) => { setOpeningTime(e.target.value); clearErr('closingTime') }}
                  options={TIMES}
                />
              </Field>

              <Field label="Closing Time" error={errors.closingTime}>
                <IconSelect
                  icon={Clock}
                  value={closingTime}
                  onChange={(e) => { setClosingTime(e.target.value); clearErr('closingTime') }}
                  error={!!errors.closingTime}
                  options={TIMES}
                />
              </Field>
            </div>

            <div className="mt-3">
              <Field label="Available Days" error={errors.days}>
                <div className="flex flex-wrap gap-1.5">
                  {DAYS.map((d) => {
                    const active = days.includes(d)
                    return (
                      <button
                        key={d}
                        type="button"
                        onClick={() => toggleDay(d)}
                        className={`min-w-11 cursor-pointer rounded-md border px-3 py-1.5 text-[11px] transition-colors ${
                          active
                            ? 'border-transparent bg-linear-to-r from-[#6C63FF] to-[#4DA3FF] font-semibold text-white'
                            : 'border-[#272D39] bg-[#0B0E14] text-slate-400 hover:bg-white/5'
                        }`}
                      >
                        {d}
                      </button>
                    )
                  })}
                </div>
              </Field>
            </div>

            {/* Section 3: Booking & Charges */}
            <SectionHead
              icon={CalendarCheck}
              title="Booking & Charges"
              sub="Slot booking, duration and fees"
              badge={
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-[9px] font-medium ${
                    bookingRequired
                      ? 'bg-emerald-500/15 text-emerald-400'
                      : 'bg-slate-500/15 text-slate-400'
                  }`}
                >
                  {bookingRequired ? 'Enabled' : 'Disabled'}
                </span>
              }
            />

            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-white">Booking Required</p>
                <p className="mt-0.5 text-[9px] text-slate-400">Residents must reserve a time slot</p>
              </div>
              <Toggle checked={bookingRequired} onChange={setBookingRequired} />
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Field label="Booking Duration">
                <div className="relative">
                  <Timer className="pointer-events-none absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-500" />
                  <select
                    value={duration}
                    disabled={!bookingRequired}
                    onChange={(e) => setDuration(e.target.value)}
                    className={`${inputCls(true)} appearance-none pr-7`}
                  >
                    {DURATIONS.map((o) => (
                      <option key={o} value={o} className="bg-[#10131A] text-white">{o}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-400" />
                </div>
              </Field>

              <Field label="Charges per Slot (₹)" error={errors.charges}>
                <IconInput
                  icon={IndianRupee}
                  inputMode="decimal"
                  value={charges}
                  disabled={!bookingRequired}
                  onChange={(e) => { setCharges(e.target.value.replace(/[^\d.]/g, '')); clearErr('charges') }}
                  error={!!errors.charges}
                  placeholder="e.g. 200"
                />
              </Field>

              <Field label="Booking Allowed For">
                <div className="relative">
                  <Users className="pointer-events-none absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-500" />
                  <select
                    value={allowedFor}
                    disabled={!bookingRequired}
                    onChange={(e) => setAllowedFor(e.target.value)}
                    className={`${inputCls(true)} appearance-none truncate pr-7`}
                  >
                    {ALLOWED_FOR.map((o) => (
                      <option key={o} value={o} className="bg-[#10131A] text-white">{o}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-400" />
                </div>
              </Field>
            </div>

            {/* Section 4: Facility Image & Rules */}
            <SectionHead icon={ImageIcon} title="Facility Image & Rules" sub="Upload a photo and add guidelines" />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Facility Image" hint="Optional" error={imageError}>
                {!image ? (
                  <label
                    onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={(e) => {
                      e.preventDefault()
                      setDragOver(false)
                      pickImage(e.dataTransfer.files)
                    }}
                    className={`flex h-full min-h-28 cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed bg-[#0B0E14] px-3 py-4 text-center transition-colors hover:border-[#6C63FF] ${
                      dragOver ? 'border-[#6C63FF]' : 'border-[#3A4152]'
                    }`}
                  >
                    <UploadCloud className="h-4 w-4 text-[#A29CFF]" />
                    <span className="text-[10px] font-medium text-white">Upload Facility Image</span>
                    <span className="text-[9px] text-slate-500">
                      PNG, JPG or WEBP • Recommended landscape image
                    </span>
                    <span className="mt-1 rounded-md bg-linear-to-r from-[#6C63FF] to-[#4DA3FF] px-3 py-1 text-[10px] font-semibold text-white">
                      Choose File
                    </span>
                    <input
                      type="file"
                      accept=".png,.jpg,.jpeg,.webp"
                      className="hidden"
                      onChange={(e) => {
                        pickImage(e.target.files)
                        e.target.value = ''
                      }}
                    />
                  </label>
                ) : (
                  <div className="overflow-hidden rounded-md border border-[#272D39] bg-[#0B0E14]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={preview} alt="Facility preview" className="h-24 w-full object-cover" />
                    <div className="flex items-center gap-2 px-2.5 py-1.5">
                      <ImageIcon className="h-3 w-3 shrink-0 text-[#A29CFF]" />
                      <span className="min-w-0 flex-1 truncate text-[10px] text-white">{image.name}</span>
                      <span className="shrink-0 text-[9px] text-slate-500">
                        {(image.size / (1024 * 1024)).toFixed(1)} MB
                      </span>
                      <button
                        type="button"
                        onClick={removeImage}
                        aria-label="Remove image"
                        className="cursor-pointer text-slate-400 hover:text-red-400"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                )}
              </Field>

              <Field label="Rules & Guidelines" hint="Optional">
                <div className="relative">
                  <FileText className="pointer-events-none absolute left-2.5 top-2.5 h-3 w-3 text-slate-500" />
                  <textarea
                    rows={5}
                    maxLength={MAX_RULES}
                    value={rules}
                    onChange={(e) => setRules(e.target.value)}
                    placeholder="Enter safety rules, restrictions and instructions for residents..."
                    className={`${inputCls(true)} resize-none ${noScrollbar}`}
                  />
                </div>
                <p className="mt-1 text-right text-[9px] text-slate-500">
                  {rules.length}/{MAX_RULES}
                </p>
              </Field>
            </div>

            {/* Section 5: Maintenance & Access */}
            <SectionHead icon={Wrench} title="Maintenance & Access" sub="Closure dates and permissions" />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {/* Maintenance Settings card */}
              <div className="min-w-0 rounded-md border border-[#272D39] bg-[#0B0E14]">
                <button
                  type="button"
                  onClick={() => setOpenPanel((p) => (p === 'maintenance' ? null : 'maintenance'))}
                  className="flex w-full cursor-pointer items-center gap-2.5 p-2.5 text-left"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#6C63FF]/20 text-[#A29CFF]">
                    <Wrench className="h-3.5 w-3.5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[11px] font-semibold">Maintenance Settings</span>
                    <span className="block text-[9px] text-slate-400">
                      Set maintenance dates, temporary closure etc.
                    </span>
                  </span>
                  <ChevronRight
                    className={`h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform ${
                      openPanel === 'maintenance' ? 'rotate-90' : ''
                    }`}
                  />
                </button>

                {openPanel === 'maintenance' && (
                  <div className="flex flex-col gap-3 border-t border-[#272D39] p-2.5">
                    <Field label="Maintenance From">
                      <div className="relative">
                        <CalendarDays className="pointer-events-none absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-500" />
                        <input
                          type="date"
                          min={today}
                          value={mFrom}
                          onChange={(e) => { setMFrom(e.target.value); clearErr('mTo') }}
                          className={`${inputCls(true)} scheme-dark ${mFrom ? '' : 'text-slate-500'}`}
                        />
                      </div>
                    </Field>
                    <Field label="Maintenance To" error={errors.mTo}>
                      <div className="relative">
                        <CalendarDays className="pointer-events-none absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-500" />
                        <input
                          type="date"
                          min={mFrom || today}
                          value={mTo}
                          onChange={(e) => { setMTo(e.target.value); clearErr('mTo') }}
                          className={`${inputCls(true, !!errors.mTo)} scheme-dark ${mTo ? '' : 'text-slate-500'}`}
                        />
                      </div>
                    </Field>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold">Temporary closure</p>
                        <p className="mt-0.5 text-[9px] text-slate-400">Block bookings during these dates</p>
                      </div>
                      <Toggle checked={closed} onChange={setClosed} />
                    </div>
                  </div>
                )}
              </div>

              {/* Access & Permissions card */}
              <div className="min-w-0 rounded-md border border-[#272D39] bg-[#0B0E14]">
                <button
                  type="button"
                  onClick={() => setOpenPanel((p) => (p === 'access' ? null : 'access'))}
                  className="flex w-full cursor-pointer items-center gap-2.5 p-2.5 text-left"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#6C63FF]/20 text-[#A29CFF]">
                    <ShieldCheck className="h-3.5 w-3.5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[11px] font-semibold">Access & Permissions</span>
                    <span className="block text-[9px] text-slate-400">
                      Who can use the facility, guest permission etc.
                    </span>
                  </span>
                  <ChevronRight
                    className={`h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform ${
                      openPanel === 'access' ? 'rotate-90' : ''
                    }`}
                  />
                </button>

                {openPanel === 'access' && (
                  <div className="flex flex-col gap-3 border-t border-[#272D39] p-2.5">
                    <Field label="Who can use this facility">
                      <IconSelect
                        icon={Users}
                        value={accessWho}
                        onChange={(e) => setAccessWho(e.target.value)}
                        options={ACCESS_FOR}
                      />
                    </Field>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[11px] font-semibold">Guests allowed</p>
                        <p className="mt-0.5 text-[9px] text-slate-400">Residents can bring guests along</p>
                      </div>
                      <Toggle checked={guestsAllowed} onChange={setGuestsAllowed} />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Section 6: Availability Status */}
            <SectionHead icon={Power} title="Availability Status" sub="Show or hide this facility for residents" />

            <div className="flex items-center gap-2.5 rounded-md border border-[#272D39] bg-[#0B0E14] p-2.5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#6C63FF]/20 text-[#A29CFF]">
                <ImageIcon className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold">Facility Status</p>
                <p className="text-[9px] text-slate-400">Make this facility available for residents</p>
              </div>
              <span
                className={`shrink-0 text-[10px] font-medium ${available ? 'text-emerald-400' : 'text-slate-400'}`}
              >
                {available ? 'Available' : 'Unavailable'}
              </span>
              <Toggle color="green" checked={available} onChange={setAvailable} />
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
            <Plus className="h-3 w-3" /> Create Facility
          </button>
        </div>
      </motion.form>
    </motion.div>,
    document.body,
  )
}