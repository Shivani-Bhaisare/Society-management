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
  X, UserPlus, User, Phone, Mail, Briefcase, Building2, Clock, CalendarDays,
  IndianRupee, MapPin, UploadCloud, Trash2, ChevronDown, Eye, FileText,
  ShieldCheck, PhoneCall, Camera, Users,
} from 'lucide-react'
import { staffSchema } from '@/lib/validations/staff.schema' // NEW

/* ---------- Config ---------- */

// TODO: fetch these from the API later
const ROLES = [
  'Security Guard', 'Supervisor', 'Cleaner', 'Receptionist', 'Electrician',
  'Plumber', 'Gardener', 'Lift Operator', 'Driver', 'Other',
]
const DEPARTMENTS = ['Security', 'Housekeeping', 'Front Office', 'Maintenance', 'Gardening', 'Parking', 'Admin']
const SHIFTS = ['Morning', 'Day', 'Evening', 'Night'] as const
const STATUSES = ['Active', 'On Leave', 'Inactive']
const GENDERS = ['Male', 'Female', 'Other']
const ID_TYPES = ['Aadhaar Card', 'PAN Card', 'Voter ID', 'Driving License']

type Shift = (typeof SHIFTS)[number]

export type StaffPayload = {
  id: number
  name: string
  phone: string
  email: string
  gender: string
  role: string
  department: string
  shift: Shift
  joiningDate: string
  salary: string
  status: string
  idType: string
  idNumber: string
  address: string
  emergencyName: string
  emergencyPhone: string
  photo: File | null
  idFile: File | null
}

const noScrollbar =
  '[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden'

const toISO = (d: Date) => d.toISOString().split('T')[0]
const fmt = (iso: string) =>
  iso
    ? new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : '--'
const initials = (name: string) =>
  name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') || 'ST'
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

export default function AddStaffModal({
  open, onClose, onSave,
}: {
  open: boolean
  onClose: () => void
  onSave?: (data: StaffPayload) => void
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
  onSave?: (data: StaffPayload) => void
}) {
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [gender, setGender] = useState('')
  const [role, setRole] = useState('')
  const [department, setDepartment] = useState('')
  const [shift, setShift] = useState<Shift>('Morning')
  const [joiningDate, setJoiningDate] = useState(toISO(new Date()))
  const [salary, setSalary] = useState('')
  const [status, setStatus] = useState('Active')
  const [idType, setIdType] = useState('Aadhaar Card')
  const [idNumber, setIdNumber] = useState('')
  const [address, setAddress] = useState('')
  const [emergencyName, setEmergencyName] = useState('')
  const [emergencyPhone, setEmergencyPhone] = useState('')

  const [photo, setPhoto] = useState<File | null>(null)
  const [photoUrl, setPhotoUrl] = useState('')
  const [photoError, setPhotoError] = useState('')
  const [idFile, setIdFile] = useState<File | null>(null)
  const [idFileError, setIdFileError] = useState('')
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

  // Revoke the photo preview URL on change / unmount
  useEffect(() => {
    return () => {
      if (photoUrl) URL.revokeObjectURL(photoUrl)
    }
  }, [photoUrl])

  const clearErr = (k: string) => setErrors((p) => ({ ...p, [k]: '' }))

  /* Photo */
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

  /* ID proof */
  function pickIdFile(list: FileList | null) {
    const f = list?.[0]
    if (!f) return
    const okType = /\.(pdf|jpe?g|png)$/i.test(f.name)
    const okSize = f.size <= 5 * 1024 * 1024
    if (okType && okSize) {
      setIdFile(f)
      setIdFileError('')
    } else {
      setIdFileError('Only PDF, JPG, PNG files up to 5 MB are allowed')
    }
  }

  // NEW: validation now runs through the zod schema
  function validate() {
    const result = staffSchema.safeParse({
      name, phone, email, role, department, joiningDate, emergencyPhone,
    })

    const err: Record<string, string> = {}
    if (!result.success) {
      for (const issue of result.error.issues) {
        const key = String(issue.path[0])
        if (!err[key]) err[key] = issue.message
      }
    }

    setErrors(err)
    return result.success
  }

  function save() {
    if (!validate()) return
    // TODO: call the API here
    onSave?.({
      id: Date.now(),
      name: name.trim(),
      phone,
      email: email.trim(),
      gender,
      role,
      department,
      shift,
      joiningDate,
      salary,
      status,
      idType,
      idNumber: idNumber.trim(),
      address: address.trim(),
      emergencyName: emergencyName.trim(),
      emergencyPhone,
      photo,
      idFile,
    })
    onClose()
  }

  const statusTone =
    status === 'Active'
      ? 'bg-emerald-500/15 text-emerald-400'
      : status === 'On Leave'
      ? 'bg-amber-500/15 text-amber-400'
      : 'bg-slate-500/20 text-slate-300'

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
              <UserPlus className="h-4 w-4 text-white" />
            </span>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-white">Add Staff</h2>
              <p className="text-[10px] text-slate-400">Add a new staff member to your society</p>
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
            {/* Section 1: Personal Details */}
            <SectionHead first icon={User} title="Personal Details" sub="Photo, name and contact information" />

            {/* Photo upload */}
            <div className="mb-3 flex items-center gap-3">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-full border border-[#272D39] bg-[#0B0E14]">
                {photoUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={photoUrl} alt="Staff preview" className="h-full w-full object-cover" />
                ) : (
                  <Camera className="h-5 w-5 text-slate-500" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <label className="cursor-pointer rounded-md border border-[#272D39] px-3 py-1.5 text-[10px] font-semibold text-white hover:bg-white/5">
                    {photo ? 'Change Photo' : 'Upload Photo'}
                    <input
                      type="file"
                      accept=".jpg,.jpeg,.png,.webp"
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
              <Field label="Full Name" error={errors.name}>
                <IconInput
                  icon={User}
                  value={name}
                  onChange={(e) => { setName(e.target.value); clearErr('name') }}
                  error={!!errors.name}
                  placeholder="e.g. Ramesh Kumar"
                />
              </Field>

              <Field label="Contact Number" error={errors.phone}>
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
              <Field label="Email" hint="Optional" error={errors.email}>
                <IconInput
                  icon={Mail}
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); clearErr('email') }}
                  error={!!errors.email}
                  placeholder="name@example.com"
                />
              </Field>

              <Field label="Gender" hint="Optional">
                <IconSelect
                  icon={Users}
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  placeholder="Select gender"
                  options={GENDERS}
                />
              </Field>
            </div>

            {/* Section 2: Job Details */}
            <SectionHead icon={Briefcase} title="Job Details" sub="Role, department, shift and salary" />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Role" error={errors.role}>
                <IconSelect
                  icon={Briefcase}
                  value={role}
                  onChange={(e) => { setRole(e.target.value); clearErr('role') }}
                  error={!!errors.role}
                  placeholder="Select role"
                  options={ROLES}
                />
              </Field>

              <Field label="Department" error={errors.department}>
                <IconSelect
                  icon={Building2}
                  value={department}
                  onChange={(e) => { setDepartment(e.target.value); clearErr('department') }}
                  error={!!errors.department}
                  placeholder="Select department"
                  options={DEPARTMENTS}
                />
              </Field>
            </div>

            <div className="mt-3">
              <Field label="Shift">
                <div className="grid grid-cols-4 gap-1 rounded-md border border-[#272D39] bg-[#0B0E14] p-0.5">
                  {SHIFTS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setShift(s)}
                      className={`min-w-0 cursor-pointer truncate rounded px-0.5 py-1.5 text-[11px] transition-colors ${
                        shift === s
                          ? 'bg-linear-to-r from-[#6C63FF] to-[#4DA3FF] font-semibold text-white'
                          : 'text-slate-400 hover:bg-white/5'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </Field>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Field label="Joining Date" error={errors.joiningDate}>
                <DateInput
                  value={joiningDate}
                  onChange={(e) => { setJoiningDate(e.target.value); clearErr('joiningDate') }}
                  error={!!errors.joiningDate}
                />
              </Field>

              <Field label="Monthly Salary" hint="Optional">
                <IconInput
                  icon={IndianRupee}
                  value={salary}
                  inputMode="numeric"
                  onChange={(e) => setSalary(digits(e.target.value))}
                  placeholder="e.g. 15000"
                />
              </Field>

              <Field label="Status">
                <IconSelect
                  icon={Clock}
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  options={STATUSES}
                />
              </Field>
            </div>

            {/* Section 3: ID Proof */}
            <SectionHead icon={ShieldCheck} title="ID Proof" sub="Identity document for verification" />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="ID Type" hint="Optional">
                <IconSelect
                  icon={ShieldCheck}
                  value={idType}
                  onChange={(e) => setIdType(e.target.value)}
                  options={ID_TYPES}
                />
              </Field>

              <Field label="ID Number" hint="Optional">
                <IconInput
                  icon={FileText}
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  placeholder="Enter ID number"
                />
              </Field>
            </div>

            <div className="mt-3">
              <Field label="ID Document" hint="Optional" error={idFileError}>
                {!idFile ? (
                  <label className="flex cursor-pointer items-center gap-2.5 rounded-md border border-dashed border-[#3A4152] bg-[#0B0E14] px-3 py-3 transition-colors hover:border-[#6C63FF]">
                    <UploadCloud className="h-5 w-5 shrink-0 text-[#A29CFF]" />
                    <span className="min-w-0">
                      <span className="block text-[10px] font-medium text-white">Attach PDF or image</span>
                      <span className="block text-[10px] font-medium text-[#A29CFF]">Browse files</span>
                    </span>
                    <input
                      type="file"
                      accept=".pdf,.jpg,.jpeg,.png"
                      className="hidden"
                      onChange={(e) => {
                        pickIdFile(e.target.files)
                        e.target.value = ''
                      }}
                    />
                  </label>
                ) : (
                  <div className="flex items-center gap-2 rounded-md border border-[#272D39] bg-[#0B0E14] px-2.5 py-2.5">
                    <FileText className="h-3 w-3 shrink-0 text-red-400" />
                    <span className="min-w-0 flex-1 truncate text-[10px] text-white">{idFile.name}</span>
                    <span className="shrink-0 text-[9px] text-slate-500">
                      {(idFile.size / (1024 * 1024)).toFixed(1)} MB
                    </span>
                    <button
                      type="button"
                      onClick={() => setIdFile(null)}
                      aria-label="Remove file"
                      className="cursor-pointer text-slate-400 hover:text-red-400"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                )}
                <p className="mt-1 text-[9px] text-slate-500">Supported formats: PDF, JPG, PNG (Max 5MB)</p>
              </Field>
            </div>

            {/* Section 4: Address & Emergency */}
            <SectionHead icon={MapPin} title="Address & Emergency Contact" sub="Home address and emergency details" />

            <Field label="Address" hint="Optional">
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={2}
                placeholder="House no, street, city..."
                className={`${inputCls(false)} resize-none`}
              />
            </Field>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Emergency Contact Name" hint="Optional">
                <IconInput
                  icon={User}
                  value={emergencyName}
                  onChange={(e) => setEmergencyName(e.target.value)}
                  placeholder="e.g. Sunita Kumar"
                />
              </Field>

              <Field label="Emergency Contact Number" hint="Optional" error={errors.emergencyPhone}>
                <IconInput
                  icon={PhoneCall}
                  value={emergencyPhone}
                  inputMode="numeric"
                  maxLength={10}
                  onChange={(e) => { setEmergencyPhone(digits(e.target.value)); clearErr('emergencyPhone') }}
                  error={!!errors.emergencyPhone}
                  placeholder="10-digit mobile number"
                />
              </Field>
            </div>

            {/* Section 5: Preview */}
            <SectionHead icon={Eye} title="Staff Preview" sub="This is how the staff member will appear in the list" />

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
                  <p className="truncate text-xs font-bold">{name.trim() || 'Staff Name'}</p>
                  <p className="truncate text-[10px] text-slate-400">{role || 'Role'}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <span className="rounded-full bg-[#6C63FF]/20 px-2 py-0.5 text-[9px] font-medium text-[#A29CFF]">
                      {department || 'Department'}
                    </span>
                    <span className="rounded-full bg-sky-500/15 px-2 py-0.5 text-[9px] font-medium text-sky-400">
                      {shift}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-[9px] font-medium ${statusTone}`}>
                      {status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-3 border-t border-[#272D39] pt-2.5 min-[400px]:grid-cols-2">
                <div className="flex items-center gap-2">
                  <Phone className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  <div className="min-w-0">
                    <p className="truncate text-[10px] font-medium">
                      {phone ? (phone.length > 5 ? `${phone.slice(0, 5)} ${phone.slice(5)}` : phone) : '--'}
                    </p>
                    <p className="text-[9px] text-slate-500">Contact</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-3.5 w-3.5 shrink-0 text-slate-400" />
                  <div className="min-w-0">
                    <p className="truncate text-[10px] font-medium">{fmt(joiningDate)}</p>
                    <p className="text-[9px] text-slate-500">Joining Date</p>
                  </div>
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
            <UserPlus className="h-3 w-3" /> Add Staff
          </button>
        </div>
      </motion.form>
    </motion.div>,
    document.body,
  )
}