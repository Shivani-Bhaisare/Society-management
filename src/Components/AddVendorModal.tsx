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
  X, Store, Building2, User, Phone, Mail, Wrench, CalendarDays, IndianRupee,
  FileText, UploadCloud, Trash2, ChevronDown, Eye, Star, MapPin, ShieldCheck,
  RefreshCw, Wallet, ClipboardList,
} from 'lucide-react'

/* ---------- Config ---------- */

// TODO: fetch these from the API later
const SERVICES = [
  'Security', 'Plumbing', 'Electrical', 'Housekeeping', 'Gardening',
  'Lift / Elevator', 'Pest Control', 'Painting', 'Other',
]
const PAYMENT_TERMS = ['Monthly', 'Quarterly', 'Half-yearly', 'Yearly', 'One-time']
const STATUSES = ['Active', 'Pending', 'Inactive']

export type VendorPayload = {
  id: number
  name: string
  contactPerson: string
  phone: string
  email: string
  service: string
  address: string
  gst: string
  pan: string
  contractStart: string
  contractEnd: string
  contractValue: string
  paymentTerms: string
  autoRenew: boolean
  status: string
  rating: number // 0 = no rating
  notes: string
  contractFile: File | null
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

export default function AddVendorModal({
  open, onClose, onSave,
}: {
  open: boolean
  onClose: () => void
  onSave?: (data: VendorPayload) => void
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
  onSave?: (data: VendorPayload) => void
}) {
  const [name, setName] = useState('')
  const [contactPerson, setContactPerson] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [service, setService] = useState('')
  const [address, setAddress] = useState('')
  const [gst, setGst] = useState('')
  const [pan, setPan] = useState('')
  const [contractStart, setContractStart] = useState(toISO(new Date()))
  const [contractEnd, setContractEnd] = useState(addDays(365))
  const [contractValue, setContractValue] = useState('')
  const [paymentTerms, setPaymentTerms] = useState('Monthly')
  const [autoRenew, setAutoRenew] = useState(false)
  const [status, setStatus] = useState('Active')
  const [rating, setRating] = useState(0)
  const [notes, setNotes] = useState('')
  const [contractFile, setContractFile] = useState<File | null>(null)
  const [fileError, setFileError] = useState('')
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

  /* Contract document */
  function pickFile(list: FileList | null) {
    const f = list?.[0]
    if (!f) return
    const okType = /\.(pdf|jpe?g|png)$/i.test(f.name)
    const okSize = f.size <= 10 * 1024 * 1024
    if (okType && okSize) {
      setContractFile(f)
      setFileError('')
    } else {
      setFileError('Only PDF, JPG, PNG files up to 10 MB are allowed')
    }
  }

  function validate() {
    const err: Record<string, string> = {}
    if (!name.trim()) err.name = 'Vendor name is required'
    if (!service) err.service = 'Service type is required'
    if (!phone) err.phone = 'Contact number is required'
    else if (!/^[6-9]\d{9}$/.test(phone)) err.phone = 'Enter a valid 10-digit mobile number'
    if (email && !/^\S+@\S+\.\S+$/.test(email)) err.email = 'Enter a valid email address'
    if (gst && !/^\d{2}[A-Z]{5}\d{4}[A-Z]\d[A-Z\d][A-Z\d]$/.test(gst)) err.gst = 'Enter a valid 15-character GSTIN'
    if (pan && !/^[A-Z]{5}\d{4}[A-Z]$/.test(pan)) err.pan = 'Enter a valid 10-character PAN'
    if (!contractStart) err.contractStart = 'Start date is required'
    if (!contractEnd) err.contractEnd = 'End date is required'
    if (contractStart && contractEnd && contractEnd < contractStart)
      err.contractEnd = 'End date must be after start date'
    setErrors(err)
    return Object.keys(err).length === 0
  }

  function save() {
    if (!validate()) return
    // TODO: call the API here
    onSave?.({
      id: Date.now(),
      name: name.trim(),
      contactPerson: contactPerson.trim(),
      phone,
      email: email.trim(),
      service,
      address: address.trim(),
      gst,
      pan,
      contractStart,
      contractEnd,
      contractValue,
      paymentTerms,
      autoRenew,
      status,
      rating,
      notes: notes.trim(),
      contractFile,
    })
    onClose()
  }

  const statusTone =
    status === 'Active'
      ? 'bg-emerald-500/15 text-emerald-400'
      : status === 'Pending'
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
              <Store className="h-4 w-4 text-white" />
            </span>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-white">Add Vendor</h2>
              <p className="text-[10px] text-slate-400">Add a new vendor and contract details</p>
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
            {/* Section 1: Vendor Details */}
            <SectionHead first icon={Building2} title="Vendor Details" sub="Company, contact person and service" />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Vendor / Company Name" error={errors.name}>
                <IconInput
                  icon={Building2}
                  value={name}
                  onChange={(e) => { setName(e.target.value); clearErr('name') }}
                  error={!!errors.name}
                  placeholder="e.g. ABC Security Services"
                />
              </Field>

              <Field label="Service Type" error={errors.service}>
                <IconSelect
                  icon={Wrench}
                  value={service}
                  onChange={(e) => { setService(e.target.value); clearErr('service') }}
                  error={!!errors.service}
                  placeholder="Select service"
                  options={SERVICES}
                />
              </Field>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Contact Person" hint="Optional">
                <IconInput
                  icon={User}
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  placeholder="e.g. Rajesh Sharma"
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
                  placeholder="vendor@example.com"
                />
              </Field>

              <Field label="Address" hint="Optional">
                <IconInput
                  icon={MapPin}
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Office address"
                />
              </Field>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="GST Number" hint="Optional" error={errors.gst}>
                <IconInput
                  icon={ShieldCheck}
                  value={gst}
                  maxLength={15}
                  onChange={(e) => { setGst(e.target.value.toUpperCase()); clearErr('gst') }}
                  error={!!errors.gst}
                  placeholder="e.g. 23ABCDE1234F1Z5"
                />
              </Field>

              <Field label="PAN Number" hint="Optional" error={errors.pan}>
                <IconInput
                  icon={FileText}
                  value={pan}
                  maxLength={10}
                  onChange={(e) => { setPan(e.target.value.toUpperCase()); clearErr('pan') }}
                  error={!!errors.pan}
                  placeholder="e.g. ABCDE1234F"
                />
              </Field>
            </div>

            {/* Section 2: Contract */}
            <SectionHead icon={ClipboardList} title="Contract Details" sub="Duration, value and payment terms" />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Contract Start" error={errors.contractStart}>
                <DateInput
                  value={contractStart}
                  onChange={(e) => {
                    setContractStart(e.target.value)
                    clearErr('contractStart')
                    if (contractEnd && contractEnd < e.target.value) setContractEnd('')
                  }}
                  error={!!errors.contractStart}
                />
              </Field>

              <Field label="Contract End" error={errors.contractEnd}>
                <DateInput
                  value={contractEnd}
                  min={contractStart || undefined}
                  onChange={(e) => { setContractEnd(e.target.value); clearErr('contractEnd') }}
                  error={!!errors.contractEnd}
                />
              </Field>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
              <Field label="Contract Value" hint="Optional">
                <IconInput
                  icon={IndianRupee}
                  value={contractValue}
                  inputMode="numeric"
                  onChange={(e) => setContractValue(digits(e.target.value))}
                  placeholder="e.g. 120000"
                />
              </Field>

              <Field label="Payment Terms">
                <IconSelect
                  icon={Wallet}
                  value={paymentTerms}
                  onChange={(e) => setPaymentTerms(e.target.value)}
                  options={PAYMENT_TERMS}
                />
              </Field>

              <Field label="Status">
                <IconSelect
                  icon={ClipboardList}
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  options={STATUSES}
                />
              </Field>
            </div>

            {/* Auto renew */}
            <div className="mt-3 flex items-center justify-between gap-3 rounded-md border border-[#272D39] bg-[#0B0E14] px-3 py-2.5">
              <div className="flex min-w-0 items-center gap-2.5">
                <RefreshCw className="h-3.5 w-3.5 shrink-0 text-[#A29CFF]" />
                <div className="min-w-0">
                  <p className="text-[11px] font-medium">Auto-renew contract</p>
                  <p className="text-[9px] text-slate-500">Renew automatically when the contract ends</p>
                </div>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={autoRenew}
                aria-label="Auto-renew contract"
                onClick={() => setAutoRenew((v) => !v)}
                className={`relative h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors ${
                  autoRenew ? 'bg-linear-to-r from-[#6C63FF] to-[#4DA3FF]' : 'bg-[#272D39]'
                }`}
              >
                <span
                  className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${
                    autoRenew ? 'left-4.5' : 'left-0.5'
                  }`}
                />
              </button>
            </div>

            {/* Section 3: Document & Rating */}
            <SectionHead icon={FileText} title="Document, Rating & Notes" sub="Contract copy, rating and remarks" />

            <Field label="Contract Document" hint="Optional" error={fileError}>
              {!contractFile ? (
                <label className="flex cursor-pointer items-center gap-2.5 rounded-md border border-dashed border-[#3A4152] bg-[#0B0E14] px-3 py-3 transition-colors hover:border-[#6C63FF]">
                  <UploadCloud className="h-5 w-5 shrink-0 text-[#A29CFF]" />
                  <span className="min-w-0">
                    <span className="block text-[10px] font-medium text-white">Attach contract PDF or image</span>
                    <span className="block text-[10px] font-medium text-[#A29CFF]">Browse files</span>
                  </span>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    className="hidden"
                    onChange={(e) => {
                      pickFile(e.target.files)
                      e.target.value = ''
                    }}
                  />
                </label>
              ) : (
                <div className="flex items-center gap-2 rounded-md border border-[#272D39] bg-[#0B0E14] px-2.5 py-2.5">
                  <FileText className="h-3 w-3 shrink-0 text-red-400" />
                  <span className="min-w-0 flex-1 truncate text-[10px] text-white">{contractFile.name}</span>
                  <span className="shrink-0 text-[9px] text-slate-500">
                    {(contractFile.size / (1024 * 1024)).toFixed(1)} MB
                  </span>
                  <button
                    type="button"
                    onClick={() => setContractFile(null)}
                    aria-label="Remove file"
                    className="cursor-pointer text-slate-400 hover:text-red-400"
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              )}
              <p className="mt-1 text-[9px] text-slate-500">Supported formats: PDF, JPG, PNG (Max 10MB)</p>
            </Field>

            <div className="mt-3">
              <Field label="Rating" hint="Optional">
                <div className="flex flex-wrap items-center gap-1">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      aria-label={`${n} star`}
                      onClick={() => setRating(rating === n ? 0 : n)}
                      className="cursor-pointer rounded p-0.5 transition-transform hover:scale-110"
                    >
                      <Star
                        className={`h-5 w-5 ${
                          n <= rating ? 'fill-amber-400 text-amber-400' : 'text-slate-600'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="ml-2 text-[10px] text-slate-400">
                    {rating ? `${rating}.0 / 5` : 'Not rated'}
                  </span>
                </div>
              </Field>
            </div>

            <div className="mt-3">
              <Field label="Notes" hint="Optional">
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  placeholder="Any remarks about this vendor..."
                  className={`${inputCls(false)} resize-none`}
                />
              </Field>
            </div>

            {/* Section 4: Preview */}
            <SectionHead icon={Eye} title="Vendor Preview" sub="This is how the vendor will appear in the list" />

            <div className="rounded-lg border border-[#272D39] bg-[#0B0E14] p-3">
              <div className="flex items-start gap-2.5">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-[#272D39] bg-white/[0.03] text-[#A29CFF]">
                  <Building2 className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold">{name.trim() || 'Vendor Name'}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-1.5">
                    <span className="rounded-full bg-[#6C63FF]/20 px-2 py-0.5 text-[9px] font-medium text-[#A29CFF]">
                      {service || 'Service'}
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-[9px] font-medium ${statusTone}`}>
                      {status}
                    </span>
                    {autoRenew && (
                      <span className="flex items-center gap-1 rounded-full bg-sky-500/15 px-2 py-0.5 text-[9px] font-medium text-sky-400">
                        <RefreshCw className="h-2 w-2" /> Auto-renew
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-1 gap-3 border-t border-[#272D39] pt-2.5 min-[400px]:grid-cols-3">
                <div className="min-w-0">
                  <p className="truncate text-[10px] font-medium">
                    {phone ? (phone.length > 5 ? `${phone.slice(0, 5)} ${phone.slice(5)}` : phone) : '--'}
                  </p>
                  <p className="text-[9px] text-slate-500">Contact</p>
                </div>
                <div className="min-w-0">
                  <p className="truncate text-[10px] font-medium">
                    {contractStart && contractEnd
                      ? `${new Date(contractStart).getFullYear()} - ${new Date(contractEnd).getFullYear()}`
                      : '--'}
                  </p>
                  <p className="text-[9px] text-slate-500">Contract</p>
                </div>
                <div className="min-w-0">
                  <p className="flex items-center gap-1 text-[10px] font-medium">
                    <Star className="h-2.5 w-2.5 fill-amber-400 text-amber-400" />
                    {rating ? `${rating}.0` : '--'}
                  </p>
                  <p className="text-[9px] text-slate-500">Rating</p>
                </div>
              </div>

              <p className="mt-2.5 text-[9px] text-slate-500">
                {fmt(contractStart)} to {fmt(contractEnd)}
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
            type="submit"
            className="flex cursor-pointer items-center justify-center gap-1.5 rounded-md bg-linear-to-r from-[#6C63FF] to-[#4DA3FF] px-4 py-2 text-[11px] font-semibold text-white hover:opacity-90 sm:py-1.5"
          >
            <Store className="h-3 w-3" /> Add Vendor
          </button>
        </div>
      </motion.form>
    </motion.div>,
    document.body,
  )
}