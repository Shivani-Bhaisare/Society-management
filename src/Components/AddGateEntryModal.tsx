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
  X, DoorOpen, DoorClosed, UserPlus, Package, Car, ParkingSquare, User, Phone,
  Building2, Clock, Bell, Eye, Camera, Trash2, ChevronDown, Minus, Plus,
  ShieldCheck, ClipboardList, Hash, ShieldAlert, UserCheck,
} from 'lucide-react'

/* ---------- Config ---------- */

export type EntryType = 'Visitor' | 'Delivery' | 'Cab' | 'Vehicle'

// TODO: fetch these from the API later
const ENTRY_TYPES: { key: EntryType; icon: ElementType }[] = [
  { key: 'Visitor', icon: UserPlus },
  { key: 'Delivery', icon: Package },
  { key: 'Cab', icon: Car },
  { key: 'Vehicle', icon: ParkingSquare },
]
const PURPOSES = ['Guest', 'Family', 'Official', 'Interview', 'Service', 'Other']
const GATES = ['Main Gate', 'Gate 2', 'Service Gate', 'Tower A Gate']
const VEHICLE_TYPES = ['Car', 'Bike', 'Auto', 'Truck', 'Other']
const STATUSES = ['Pending', 'Approved', 'Inside']

const NAME_LABEL: Record<EntryType, string> = {
  Visitor: 'Visitor Name',
  Delivery: 'Delivery Person Name',
  Cab: 'Driver Name',
  Vehicle: 'Driver / Owner Name',
}
const COMPANY_HINT: Partial<Record<EntryType, string>> = {
  Delivery: 'e.g. Swiggy, Amazon',
  Cab: 'e.g. Uber, Ola',
}

export type GateEntryPayload = {
  id: number
  type: EntryType
  name: string
  phone: string
  purpose: string // For Visitor / Vehicle
  company: string // For Delivery / Cab
  persons: number
  gate: string
  flat: string
  meeting: string
  vehicleType: string
  vehicleNo: string
  entryTime: string // "HH:mm"
  status: string
  notifyResident: boolean
  notes: string
  photo: File | null
}

const noScrollbar =
  '[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden'

const nowHM = () => new Date().toTimeString().slice(0, 5)
const fmtTime = (hm: string) => {
  if (!hm) return '--'
  const [h, m] = hm.split(':').map(Number)
  const ap = h >= 12 ? 'PM' : 'AM'
  return `${String(h % 12 || 12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ap}`
}
const initials = (name: string) =>
  name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') || 'GE'
const digits = (v: string) => v.replace(/\D/g, '')

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

export default function AddGateEntryModal({
  open, onClose, onSave, defaultType = 'Visitor', blacklistedPhones = [],
}: {
  open: boolean
  onClose: () => void
  onSave?: (data: GateEntryPayload) => void
  defaultType?: EntryType // Used to pre-select the type from Quick Actions
  blacklistedPhones?: string[] // Entry is restricted for these numbers
}) {
  return (
    <AnimatePresence>
      {open && (
        <Body
          onClose={onClose}
          onSave={onSave}
          defaultType={defaultType}
          blacklistedPhones={blacklistedPhones}
        />
      )}
    </AnimatePresence>
  )
}

function Body({
  onClose, onSave, defaultType, blacklistedPhones,
}: {
  onClose: () => void
  onSave?: (data: GateEntryPayload) => void
  defaultType: EntryType
  blacklistedPhones: string[]
}) {
  const [type, setType] = useState<EntryType>(defaultType)
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [purpose, setPurpose] = useState('Guest')
  const [company, setCompany] = useState('')
  const [persons, setPersons] = useState(1)
  const [gate, setGate] = useState('Main Gate')
  const [flat, setFlat] = useState('')
  const [meeting, setMeeting] = useState('')
  const [vehicleType, setVehicleType] = useState('')
  const [vehicleNo, setVehicleNo] = useState('')
  const [entryTime, setEntryTime] = useState(nowHM())
  const [status, setStatus] = useState('Pending')
  const [notify, setNotify] = useState(true)
  const [notes, setNotes] = useState('')

  const [photo, setPhoto] = useState<File | null>(null)
  const [photoUrl, setPhotoUrl] = useState('')
  const [photoError, setPhotoError] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Which fields are shown / required depends on the entry type
  const showPurpose = type === 'Visitor' || type === 'Vehicle'
  const showCompany = type === 'Delivery' || type === 'Cab'
  const phoneReq = type === 'Visitor' || type === 'Vehicle'
  const flatReq = type === 'Visitor' || type === 'Vehicle'
  const vehicleReq = type === 'Cab' || type === 'Vehicle'

  const isBlacklisted = phone.length === 10 && blacklistedPhones.includes(phone)

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

  // Revoke the photo preview URL on change / unmount
  useEffect(() => {
    return () => {
      if (photoUrl) URL.revokeObjectURL(photoUrl)
    }
  }, [photoUrl])

  const clearErr = (k: string) => setErrors((p) => ({ ...p, [k]: '' }))

  function pickPhoto(list: FileList | null) {
    const f = list?.[0]
    if (!f) return
    const okType = /\.(jpe?g|png|webp)$/i.test(f.name)
    const okSize = f.size <= 5 * 1024 * 1024
    if (okType && okSize) {
      setPhoto(f)
      setPhotoUrl(URL.createObjectURL(f))
      setPhotoError('')
    } else {
      setPhotoError('Only JPG, PNG, WEBP up to 5 MB')
    }
  }
  function removePhoto() {
    setPhoto(null)
    setPhotoUrl('')
  }

  function validate() {
    const err: Record<string, string> = {}
    if (!name.trim()) err.name = `${NAME_LABEL[type]} is required`

    if (isBlacklisted) err.phone = 'This person is blacklisted. Entry restricted'
    else if (!phone && phoneReq) err.phone = 'Phone number is required'
    else if (phone && !/^[6-9]\d{9}$/.test(phone)) err.phone = 'Enter a valid 10-digit mobile number'

    if (flatReq && !flat.trim()) err.flat = 'Flat number is required'

    const vn = vehicleNo.replace(/\s/g, '')
    if (vehicleReq && !vn) err.vehicleNo = 'Vehicle number is required'
    else if (vn && !/^[A-Z]{2}\d{2}[A-Z]{1,3}\d{4}$/.test(vn))
      err.vehicleNo = 'Enter a valid number, e.g. MP04 AB 1234'

    if (!entryTime) err.entryTime = 'Entry time is required'

    setErrors(err)
    return Object.keys(err).length === 0
  }

  function save() {
    if (!validate()) return
    // TODO: call the API here
    onSave?.({
      id: Date.now(),
      type,
      name: name.trim(),
      phone,
      purpose: showPurpose ? purpose : '',
      company: showCompany ? company.trim() : '',
      persons,
      gate,
      flat: flat.trim().toUpperCase(),
      meeting: meeting.trim(),
      vehicleType,
      vehicleNo: vehicleNo.replace(/\s/g, ''),
      entryTime,
      status,
      notifyResident: notify,
      notes: notes.trim(),
      photo,
    })
    onClose()
  }

  const statusTone =
    status === 'Approved'
      ? 'bg-emerald-500/15 text-emerald-400'
      : status === 'Inside'
      ? 'bg-sky-500/15 text-sky-400'
      : 'bg-amber-500/15 text-amber-400'

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
          save()
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
              <DoorOpen className="h-4 w-4 text-white" />
            </span>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-white">Add Gate Entry</h2>
              <p className="text-[10px] text-slate-400">Log a visitor, delivery, cab or vehicle</p>
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
            {/* Blacklist alert */}
            {isBlacklisted && (
              <div className="mb-3 flex items-start gap-2 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2">
                <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-red-400" />
                <div className="min-w-0">
                  <p className="text-[11px] font-semibold text-red-400">Blacklisted visitor</p>
                  <p className="text-[10px] text-red-300/80">Entry is restricted for this phone number.</p>
                </div>
              </div>
            )}

            {/* Entry type switch */}
            <Field label="Entry Type">
              <div className="grid grid-cols-2 gap-1 rounded-md border border-[#272D39] bg-[#0B0E14] p-0.5 min-[480px]:grid-cols-4">
                {ENTRY_TYPES.map(({ key, icon: Icon }) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => { setType(key); setErrors({}) }}
                    className={`flex min-w-0 cursor-pointer items-center justify-center gap-1.5 rounded py-2 text-[11px] transition-colors ${
                      type === key
                        ? 'bg-linear-to-r from-[#6C63FF] to-[#4DA3FF] font-semibold text-white'
                        : 'text-slate-400 hover:bg-white/5'
                    }`}
                  >
                    <Icon className="h-3 w-3 shrink-0" /> <span className="truncate">{key}</span>
                  </button>
                ))}
              </div>
            </Field>

            {/* Section 1: Entry Details */}
            <SectionHead icon={User} title="Entry Details" sub="Photo, name and contact" />

            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-13 w-13 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#272D39] bg-[#0B0E14]">
                {photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photoUrl} alt="Preview" className="h-full w-full object-cover" />
                ) : (
                  <Camera className="h-5 w-5 text-slate-500" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <label className="cursor-pointer rounded-md border border-[#272D39] px-3 py-1.5 text-[10px] font-semibold text-white hover:bg-white/5">
                    {photo ? 'Change Photo' : 'Take / Upload Photo'}
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp"
                      capture="user"
                      className="hidden"
                      onChange={(e) => {
                        pickPhoto(e.target.files)
                        e.target.value = ''
                      }}
                    />
                  </label>
                  {photo && (
                    <button
                      type="button"
                      onClick={removePhoto}
                      aria-label="Remove photo"
                      className="cursor-pointer text-slate-400 hover:text-red-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
                <p className={`mt-1 text-[9px] ${photoError ? 'text-red-400' : 'text-slate-500'}`}>
                  {photoError || 'JPG, PNG, WEBP (Max 5MB) - Optional'}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label={NAME_LABEL[type]} error={errors.name}>
                <IconInput
                  icon={User}
                  value={name}
                  onChange={(e) => { setName(e.target.value); clearErr('name') }}
                  error={!!errors.name}
                  placeholder="e.g. Amit Sharma"
                />
              </Field>

              <Field label="Phone" hint={phoneReq ? 'Required' : 'Optional'} error={errors.phone}>
                <IconInput
                  icon={Phone}
                  value={phone}
                  inputMode="numeric"
                  maxLength={10}
                  onChange={(e) => { setPhone(digits(e.target.value)); clearErr('phone') }}
                  error={!!errors.phone}
                  placeholder="10-digit mobile number"
                />
              </Field>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {showPurpose && (
                <Field label="Purpose of Visit">
                  <IconSelect
                    icon={ClipboardList}
                    value={purpose}
                    onChange={(e) => setPurpose(e.target.value)}
                    options={PURPOSES}
                  />
                </Field>
              )}
              {showCompany && (
                <Field label="Company / Service" hint="Optional">
                  <IconInput
                    icon={Building2}
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    placeholder={COMPANY_HINT[type]}
                  />
                </Field>
              )}

              <Field label="Number of Persons">
                <div className="flex items-center justify-between rounded-md border border-[#272D39] bg-[#0B0E14] p-1">
                  <button
                    type="button"
                    aria-label="Decrease"
                    onClick={() => setPersons((n) => Math.max(1, n - 1))}
                    className="cursor-pointer rounded p-1.5 text-slate-300 hover:bg-white/5"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="text-[11px] font-semibold">{persons}</span>
                  <button
                    type="button"
                    aria-label="Increase"
                    onClick={() => setPersons((n) => Math.min(20, n + 1))}
                    className="cursor-pointer rounded p-1.5 text-slate-300 hover:bg-white/5"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                </div>
              </Field>
            </div>

            {/* Section 2: Visiting */}
            <SectionHead icon={Building2} title="Visiting" sub="Gate, flat and resident" />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Field label="Gate">
                <IconSelect
                  icon={DoorClosed}
                  value={gate}
                  onChange={(e) => setGate(e.target.value)}
                  options={GATES}
                />
              </Field>

              <Field label="Flat No." hint={flatReq ? undefined : 'Optional'} error={errors.flat}>
                <IconInput
                  icon={Building2}
                  value={flat}
                  onChange={(e) => { setFlat(e.target.value); clearErr('flat') }}
                  error={!!errors.flat}
                  placeholder="e.g. A-204"
                />
              </Field>

              <Field label="Whom to Meet" hint="Optional">
                <IconInput
                  icon={UserCheck}
                  value={meeting}
                  onChange={(e) => setMeeting(e.target.value)}
                  placeholder="Resident name"
                />
              </Field>
            </div>

            {/* Section 3: Vehicle */}
            <SectionHead
              icon={Car}
              title={`Vehicle (${vehicleReq ? 'Required' : 'Optional'})`}
              sub="Vehicle type and number plate"
            />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Vehicle Type">
                <IconSelect
                  icon={Car}
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value)}
                  placeholder="Select type"
                  options={VEHICLE_TYPES}
                />
              </Field>

              <Field label="Vehicle Number" error={errors.vehicleNo}>
                <IconInput
                  icon={Hash}
                  value={vehicleNo}
                  maxLength={13}
                  onChange={(e) => {
                    setVehicleNo(e.target.value.toUpperCase().replace(/[^A-Z0-9 ]/g, ''))
                    clearErr('vehicleNo')
                  }}
                  error={!!errors.vehicleNo}
                  placeholder="e.g. MP04 AB 1234"
                />
              </Field>
            </div>

            {/* Section 4: Entry & Approval */}
            <SectionHead icon={Clock} title="Entry & Approval" sub="Time, status and resident alert" />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Entry Time" error={errors.entryTime}>
                <div className="relative">
                  <Clock className="pointer-events-none absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-500" />
                  <input
                    type="time"
                    value={entryTime}
                    onChange={(e) => { setEntryTime(e.target.value); clearErr('entryTime') }}
                    className={`${inputCls(true, !!errors.entryTime)} scheme-dark`}
                  />
                </div>
              </Field>

              <Field label="Status">
                <IconSelect
                  icon={ShieldCheck}
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  options={STATUSES}
                />
              </Field>
            </div>

            {/* Notify resident */}
            <div className="mt-3 flex items-center justify-between gap-3 rounded-md border border-[#272D39] bg-[#0B0E14] px-3 py-2.5">
              <div className="flex min-w-0 items-center gap-2.5">
                <Bell className="h-3.5 w-3.5 shrink-0 text-[#A29CFF]" />
                <div className="min-w-0">
                  <p className="text-[11px] font-medium">Notify resident</p>
                  <p className="text-[9px] text-slate-500">Send an approval request to the flat</p>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={notify}
                aria-label="Notify resident"
                onClick={() => setNotify((v) => !v)}
                className={`relative h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors ${
                  notify ? 'bg-linear-to-r from-[#6C63FF] to-[#4DA3FF]' : 'bg-[#272D39]'
                }`}
              >
                <span
                  className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${
                    notify ? 'left-4.5' : 'left-0.5'
                  }`}
                />
              </button>
            </div>

            <div className="mt-3">
              <Field label="Notes" hint="Optional">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Any remarks for the guard..."
                  className={`${inputCls(false)} resize-none`}
                />
              </Field>
            </div>

            {/* Section 5: Preview */}
            <SectionHead icon={Eye} title="Gate Pass Preview" sub="This is how the entry will appear in the log" />

            <div className="rounded-lg border border-[#272D39] bg-[#0B0E14] p-3">
              <div className="flex items-start gap-2.5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#6C63FF]/25 text-xs font-bold text-[#A29CFF]">
                  {photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={photoUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    initials(name)
                  )}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold">{name.trim() || 'Visitor Name'}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <span className="rounded-full bg-[#6C63FF]/20 px-2 py-0.5 text-[9px] font-medium text-[#A29CFF]">
                      {type}
                    </span>
                    <span className="rounded-full bg-sky-500/15 px-2 py-0.5 text-[9px] font-medium text-sky-400">
                      {showPurpose ? purpose : company.trim() || type}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-[9px] font-medium ${statusTone}`}>
                      {status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-3 border-t border-[#272D39] pt-2.5 min-[400px]:grid-cols-3">
                <div className="min-w-0">
                  <p className="truncate text-[10px] font-medium">{flat.trim().toUpperCase() || '--'}</p>
                  <p className="text-[9px] text-slate-500">Flat</p>
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[10px] font-medium">{gate}</p>
                  <p className="text-[9px] text-slate-500">Gate</p>
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[10px] font-medium">{fmtTime(entryTime)}</p>
                  <p className="text-[9px] text-slate-500">Time</p>
                </div>
              </div>
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
            <DoorOpen className="h-3 w-3" /> Add Entry
          </button>
        </div>
      </motion.form>
    </motion.div>,
    document.body,
  )
}