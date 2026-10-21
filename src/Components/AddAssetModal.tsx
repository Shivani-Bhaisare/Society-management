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
  X, ChevronDown, Wrench, LayoutGrid, MapPin, CalendarDays, IndianRupee, User, Hash,
  FileText, Copy, Check, UploadCloud, Trash2, Plus, ShieldCheck, Repeat, ClipboardList,
  FolderOpen, StickyNote, UserCog,
} from 'lucide-react'

/* ---------- Config ---------- */

// TODO: fetch these from the API later
const CATEGORIES = ['Lift', 'Generator', 'Water Pump', 'CCTV', 'Fire Safety', 'Electrical', 'Plumbing', 'HVAC', 'Other']
const LOCATIONS = ['Tower A', 'Tower B', 'Tower C', 'Clubhouse', 'Basement', 'Terrace', 'Main Gate', 'Garden']
const VENDORS = ['Otis Elevators', 'Kirloskar Power', 'Havells Services', 'Secure Eye Systems', 'Local Vendor']
const AMC_VENDORS = ['Otis Elevators', 'Kirloskar Power', 'Havells Services', 'Secure Eye Systems']
const FREQUENCIES = ['Weekly', 'Monthly', 'Quarterly', 'Half Yearly', 'Yearly']
const TECHNICIANS = ['Ramesh Kumar', 'Suresh Patel', 'In-house Team', 'Otis Elevators', 'Kirloskar Power']

const STATUSES = [
  { name: 'Active', dot: 'bg-emerald-400' },
  { name: 'Under Maintenance', dot: 'bg-amber-400' },
  { name: 'Inactive', dot: 'bg-slate-400' },
  { name: 'Retired', dot: 'bg-red-400' },
]

const MAINT_TYPES = ['Preventive', 'Corrective'] as const
type MaintType = (typeof MAINT_TYPES)[number]

const MAX_DESC = 500
const MAX_NOTES = 500

export type AssetPayload = {
  id: number
  assetId: string
  name: string
  category: string
  location: string
  purchaseDate: string
  purchaseCost: string
  vendor: string
  serial: string
  description: string
  warrantyStart: string
  warrantyEnd: string
  amc: {
    enabled: boolean
    vendor: string
    contractStart: string
    contractEnd: string
    annualCost: string
    document: File | null
  }
  maintenanceType: MaintType
  frequency: string
  lastService: string
  nextService: string
  technician: string
  documents: File[]
  status: string
  notes: string
}

const noScrollbar =
  '[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden'

const toISO = (d: Date) => d.toISOString().split('T')[0]
const makeAssetId = () =>
  `ASSET-${new Date().getFullYear()}-${String(Math.floor(Math.random() * 900) + 100)}`

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
      <div className="min-w-0 flex-1">
        <h3 className="text-xs font-bold">{title}</h3>
        <p className="text-[9px] text-slate-400">{sub}</p>
      </div>
    </div>
  )
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative h-5 w-9 shrink-0 cursor-pointer rounded-full border transition-colors ${
        checked ? 'border-[#6C63FF] bg-[#6C63FF]' : 'border-[#272D39] bg-[#0B0E14]'
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

export default function AddAssetModal({
  open, onClose, onSave,
}: {
  open: boolean
  onClose: () => void
  onSave?: (data: AssetPayload) => void
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
  onSave?: (data: AssetPayload) => void
}) {
  // Basic info
  const [assetId] = useState(makeAssetId)
  const [copied, setCopied] = useState(false)
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [location, setLocation] = useState('')
  const [purchaseDate, setPurchaseDate] = useState('')
  const [purchaseCost, setPurchaseCost] = useState('')
  const [vendor, setVendor] = useState('')
  const [serial, setSerial] = useState('')
  const [description, setDescription] = useState('')

  // Warranty & AMC
  const [warrantyStart, setWarrantyStart] = useState('')
  const [warrantyEnd, setWarrantyEnd] = useState('')
  const [amcOn, setAmcOn] = useState(false)
  const [amcVendor, setAmcVendor] = useState('')
  const [contractStart, setContractStart] = useState('')
  const [contractEnd, setContractEnd] = useState('')
  const [annualCost, setAnnualCost] = useState('')
  const [amcDoc, setAmcDoc] = useState<File | null>(null)
  const [amcDocError, setAmcDocError] = useState('')

  // Maintenance
  const [maintType, setMaintType] = useState<MaintType>('Preventive')
  const [frequency, setFrequency] = useState('')
  const [lastService, setLastService] = useState('')
  const [nextService, setNextService] = useState('')
  const [technician, setTechnician] = useState('')

  // Documents
  const [docs, setDocs] = useState<File[]>([])
  const [docError, setDocError] = useState('')
  const [dragOver, setDragOver] = useState(false)

  // Status & notes
  const [status, setStatus] = useState('Active')
  const [notes, setNotes] = useState('')

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

  const clearErr = (k: string) => setErrors((p) => ({ ...p, [k]: '' }))

  async function copyId() {
    try {
      await navigator.clipboard.writeText(assetId)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard access is not allowed */
    }
  }

  /* AMC document (single) */
  function pickAmcDoc(list: FileList | null) {
    const f = list?.[0]
    if (!f) return
    const okType = /\.(pdf|docx?)$/i.test(f.name)
    const okSize = f.size <= 5 * 1024 * 1024
    if (okType && okSize) {
      setAmcDoc(f)
      setAmcDocError('')
    } else {
      setAmcDocError('Only PDF, DOC, DOCX files up to 5 MB are allowed')
    }
  }

  /* Asset documents (multiple) */
  function addDocs(list: FileList | null) {
    if (!list) return
    const valid: File[] = []
    let bad = ''
    Array.from(list).forEach((f) => {
      const okType = /\.(pdf|jpe?g|png)$/i.test(f.name)
      const okSize = f.size <= 10 * 1024 * 1024
      if (okType && okSize) valid.push(f)
      else bad = 'Only PDF, JPG, PNG files up to 10 MB are allowed'
    })
    setDocError(bad)
    if (valid.length) setDocs((p) => [...p, ...valid])
  }

  function validate() {
    const err: Record<string, string> = {}
    if (!name.trim()) err.name = 'Asset name is required'
    if (!category) err.category = 'Select a category'
    if (!location) err.location = 'Select a location'
    if (!purchaseDate) err.purchaseDate = 'Purchase date is required'
    if (!purchaseCost) err.purchaseCost = 'Purchase cost is required'
    if (!vendor) err.vendor = 'Select a vendor'
    if (warrantyStart && warrantyEnd && warrantyEnd < warrantyStart)
      err.warrantyEnd = 'End must be after start'
    if (amcOn) {
      if (!amcVendor) err.amcVendor = 'Select an AMC vendor'
      if (!contractStart) err.contractStart = 'Start date is required'
      if (!contractEnd) err.contractEnd = 'End date is required'
      if (contractStart && contractEnd && contractEnd < contractStart)
        err.contractEnd = 'End must be after start'
    }
    if (!frequency) err.frequency = 'Select a frequency'
    if (lastService && nextService && nextService < lastService)
      err.nextService = 'Must be after last service'
    if (!status) err.status = 'Select a status'
    setErrors(err)
    return Object.keys(err).length === 0
  }

  function submit(ev: FormEvent) {
    ev.preventDefault()
    if (!validate()) return
    // TODO: call the API here
    onSave?.({
      id: Date.now(),
      assetId,
      name: name.trim(),
      category,
      location,
      purchaseDate,
      purchaseCost,
      vendor,
      serial: serial.trim(),
      description: description.trim(),
      warrantyStart,
      warrantyEnd,
      amc: {
        enabled: amcOn,
        vendor: amcOn ? amcVendor : '',
        contractStart: amcOn ? contractStart : '',
        contractEnd: amcOn ? contractEnd : '',
        annualCost: amcOn ? annualCost : '',
        document: amcOn ? amcDoc : null,
      },
      maintenanceType: maintType,
      frequency,
      lastService,
      nextService,
      technician,
      documents: docs,
      status,
      notes: notes.trim(),
    })
    onClose()
  }

  const statusDot = STATUSES.find((s) => s.name === status)?.dot ?? 'bg-slate-400'

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
        className="flex h-full w-full max-w-150 flex-col overflow-hidden rounded-l-2xl border border-r-0 border-[#272D39] bg-[#10131A] text-white shadow-2xl"
      >
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between gap-3 p-3.5 pb-2 sm:p-4 sm:pb-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-[#6C63FF] to-[#4DA3FF]">
              <Wrench className="h-4 w-4 text-white" />
            </span>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-white">Add New Asset</h2>
              <p className="text-[10px] text-slate-400">Register a new asset and set up maintenance details</p>
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
            {/* Section 1: Basic Asset Information */}
            <SectionHead first icon={ClipboardList} title="Basic Asset Information" sub="Provide essential details about the asset" />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Asset Name" error={errors.name}>
                <IconInput
                  icon={LayoutGrid}
                  value={name}
                  onChange={(e) => { setName(e.target.value); clearErr('name') }}
                  error={!!errors.name}
                  placeholder="Enter asset name (e.g. Lift, Generator)"
                />
              </Field>

              <Field label="Asset ID" hint="Auto-generated">
                <div className="relative">
                  <Hash className="pointer-events-none absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-500" />
                  <input
                    readOnly
                    value={assetId}
                    className={`${inputCls(true)} cursor-default pr-8 text-slate-300`}
                  />
                  <button
                    type="button"
                    onClick={copyId}
                    aria-label="Copy asset ID"
                    className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer text-slate-400 hover:text-white"
                  >
                    {copied ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  </button>
                </div>
              </Field>

              <Field label="Category" error={errors.category}>
                <IconSelect
                  icon={LayoutGrid}
                  value={category}
                  onChange={(e) => { setCategory(e.target.value); clearErr('category') }}
                  error={!!errors.category}
                  placeholder="Select category"
                  options={CATEGORIES}
                />
              </Field>

              <Field label="Location / Block" error={errors.location}>
                <IconSelect
                  icon={MapPin}
                  value={location}
                  onChange={(e) => { setLocation(e.target.value); clearErr('location') }}
                  error={!!errors.location}
                  placeholder="Select location / block"
                  options={LOCATIONS}
                />
              </Field>

              <Field label="Purchase Date" error={errors.purchaseDate}>
                <DateInput
                  value={purchaseDate}
                  max={today}
                  onChange={(e) => { setPurchaseDate(e.target.value); clearErr('purchaseDate') }}
                  error={!!errors.purchaseDate}
                />
              </Field>

              <Field label="Purchase Cost (₹)" error={errors.purchaseCost}>
                <IconInput
                  icon={IndianRupee}
                  inputMode="decimal"
                  value={purchaseCost}
                  onChange={(e) => { setPurchaseCost(e.target.value.replace(/[^\d.]/g, '')); clearErr('purchaseCost') }}
                  error={!!errors.purchaseCost}
                  placeholder="e.g. 50,000"
                />
              </Field>

              <Field label="Vendor" error={errors.vendor}>
                <IconSelect
                  icon={User}
                  value={vendor}
                  onChange={(e) => { setVendor(e.target.value); clearErr('vendor') }}
                  error={!!errors.vendor}
                  placeholder="Select vendor"
                  options={VENDORS}
                />
              </Field>

              <Field label="Serial / Model Number" hint="Optional">
                <IconInput
                  icon={Hash}
                  value={serial}
                  onChange={(e) => setSerial(e.target.value)}
                  placeholder="Enter serial or model number"
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
                    placeholder="Enter asset description, specifications and other details..."
                    className={`${inputCls(true)} resize-none ${noScrollbar}`}
                  />
                </div>
                <p className="mt-1 text-right text-[9px] text-slate-500">
                  {description.length}/{MAX_DESC}
                </p>
              </Field>
            </div>

            {/* Section 2: Warranty & AMC */}
            <SectionHead icon={ShieldCheck} title="Warranty & AMC" sub="Add warranty and AMC details for the asset" />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Warranty Start">
                <DateInput value={warrantyStart} onChange={(e) => setWarrantyStart(e.target.value)} />
              </Field>
              <Field label="Warranty End" error={errors.warrantyEnd}>
                <DateInput
                  value={warrantyEnd}
                  min={warrantyStart || undefined}
                  onChange={(e) => { setWarrantyEnd(e.target.value); clearErr('warrantyEnd') }}
                  error={!!errors.warrantyEnd}
                />
              </Field>
            </div>

            <div className="mt-3 flex items-start justify-between gap-3 rounded-md border border-[#272D39] bg-[#0B0E14] p-2.5">
              <div className="min-w-0">
                <p className="text-[11px] font-semibold text-white">Enable AMC</p>
                <p className="mt-0.5 text-[9px] text-slate-400">Annual Maintenance Contract for this asset</p>
              </div>
              <Toggle checked={amcOn} onChange={setAmcOn} />
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="AMC Vendor" error={errors.amcVendor}>
                <IconSelect
                  icon={User}
                  value={amcVendor}
                  disabled={!amcOn}
                  onChange={(e) => { setAmcVendor(e.target.value); clearErr('amcVendor') }}
                  error={!!errors.amcVendor}
                  placeholder="Select AMC vendor"
                  options={AMC_VENDORS}
                />
              </Field>

              <Field label="Annual AMC Cost (₹)">
                <IconInput
                  icon={IndianRupee}
                  inputMode="decimal"
                  value={annualCost}
                  disabled={!amcOn}
                  onChange={(e) => setAnnualCost(e.target.value.replace(/[^\d.]/g, ''))}
                  placeholder="e.g. 5,000"
                />
              </Field>

              <Field label="Contract Start" error={errors.contractStart}>
                <DateInput
                  value={contractStart}
                  disabled={!amcOn}
                  onChange={(e) => { setContractStart(e.target.value); clearErr('contractStart') }}
                  error={!!errors.contractStart}
                />
              </Field>

              <Field label="Contract End" error={errors.contractEnd}>
                <DateInput
                  value={contractEnd}
                  min={contractStart || undefined}
                  disabled={!amcOn}
                  onChange={(e) => { setContractEnd(e.target.value); clearErr('contractEnd') }}
                  error={!!errors.contractEnd}
                />
              </Field>
            </div>

            <div className="mt-3">
              <Field label="Upload AMC Document" hint="Optional" error={amcDocError}>
                {!amcDoc ? (
                  <label
                    className={`flex cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed border-[#3A4152] bg-[#0B0E14] px-3 py-4 text-center transition-colors hover:border-[#6C63FF] ${
                      amcOn ? '' : 'pointer-events-none opacity-40'
                    }`}
                  >
                    <UploadCloud className="h-4 w-4 text-[#A29CFF]" />
                    <span className="text-[10px] font-medium text-white">Click to upload or drag and drop</span>
                    <span className="text-[9px] text-slate-500">PDF, DOC, DOCX (Max 5MB)</span>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      className="hidden"
                      onChange={(e) => {
                        pickAmcDoc(e.target.files)
                        e.target.value = ''
                      }}
                    />
                  </label>
                ) : (
                  <div className="flex items-center gap-2 rounded-md border border-[#272D39] bg-[#0B0E14] px-2.5 py-2.5">
                    <FileText className="h-3 w-3 shrink-0 text-red-400" />
                    <span className="min-w-0 flex-1 truncate text-[10px] text-white">{amcDoc.name}</span>
                    <span className="shrink-0 text-[9px] text-slate-500">
                      {(amcDoc.size / (1024 * 1024)).toFixed(1)} MB
                    </span>
                    <button
                      type="button"
                      onClick={() => setAmcDoc(null)}
                      aria-label="Remove file"
                      className="cursor-pointer text-slate-400 hover:text-red-400"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </Field>
            </div>

            {/* Section 3: Maintenance Schedule */}
            <SectionHead icon={Repeat} title="Maintenance Schedule" sub="Set up maintenance frequency and assign responsible person" />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Maintenance Type">
                <div className="grid grid-cols-2 gap-1 rounded-md border border-[#272D39] bg-[#0B0E14] p-0.5">
                  {MAINT_TYPES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setMaintType(t)}
                      className={`cursor-pointer rounded py-1.5 text-[11px] transition-colors ${
                        maintType === t
                          ? 'bg-linear-to-r from-[#6C63FF] to-[#4DA3FF] font-semibold text-white'
                          : 'text-slate-400 hover:bg-white/5'
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="Frequency" error={errors.frequency}>
                <IconSelect
                  icon={CalendarDays}
                  value={frequency}
                  onChange={(e) => { setFrequency(e.target.value); clearErr('frequency') }}
                  error={!!errors.frequency}
                  placeholder="Select frequency"
                  options={FREQUENCIES}
                />
              </Field>

              <Field label="Last Service Date" hint="Optional">
                <DateInput
                  value={lastService}
                  max={today}
                  onChange={(e) => { setLastService(e.target.value); clearErr('nextService') }}
                />
              </Field>

              <Field label="Next Service Date" hint="Optional" error={errors.nextService}>
                <DateInput
                  value={nextService}
                  min={lastService || undefined}
                  onChange={(e) => { setNextService(e.target.value); clearErr('nextService') }}
                  error={!!errors.nextService}
                />
              </Field>
            </div>

            <div className="mt-3">
              <Field label="Assigned Technician / Vendor" hint="Optional">
                <IconSelect
                  icon={UserCog}
                  value={technician}
                  onChange={(e) => setTechnician(e.target.value)}
                  placeholder="Select technician / vendor"
                  options={TECHNICIANS}
                />
              </Field>
            </div>

            {/* Section 4: Asset Documents */}
            <SectionHead icon={FolderOpen} title="Asset Documents" sub="Upload relevant documents for the asset" />

            <Field label="Documents" hint="Optional" error={docError}>
              <label
                onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault()
                  setDragOver(false)
                  addDocs(e.dataTransfer.files)
                }}
                className={`flex cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed bg-[#0B0E14] px-3 py-4 text-center transition-colors hover:border-[#6C63FF] ${
                  dragOver ? 'border-[#6C63FF]' : 'border-[#3A4152]'
                }`}
              >
                <UploadCloud className="h-4 w-4 text-[#A29CFF]" />
                <span className="text-[10px] font-medium text-white">Drag & drop files here or click to upload</span>
                <span className="text-[9px] text-slate-500">
                  Invoice, warranty certificate, manuals (PDF, JPG, PNG - Max 10MB)
                </span>
                <input
                  type="file"
                  multiple
                  accept=".pdf,.jpg,.jpeg,.png"
                  className="hidden"
                  onChange={(e) => {
                    addDocs(e.target.files)
                    e.target.value = ''
                  }}
                />
              </label>

              {docs.length > 0 && (
                <div className="mt-2 flex flex-col gap-1.5">
                  {docs.map((f, i) => (
                    <div key={`${f.name}-${i}`} className="flex items-center gap-2 rounded-md border border-[#272D39] bg-[#0B0E14] px-2.5 py-1.5">
                      <FileText className="h-3 w-3 shrink-0 text-red-400" />
                      <span className="min-w-0 flex-1 truncate text-[10px] text-white">{f.name}</span>
                      <span className="shrink-0 text-[9px] text-slate-500">
                        {(f.size / (1024 * 1024)).toFixed(1)} MB
                      </span>
                      <button
                        type="button"
                        onClick={() => setDocs((p) => p.filter((_, idx) => idx !== i))}
                        aria-label="Remove file"
                        className="cursor-pointer text-slate-400 hover:text-red-400"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Field>

            {/* Section 5: Status & Notes */}
            <SectionHead icon={StickyNote} title="Status & Notes" sub="Set asset status and add any additional notes" />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Status" error={errors.status}>
                <div className="relative">
                  <span
                    className={`pointer-events-none absolute left-3 top-1/2 h-2 w-2 -translate-y-1/2 rounded-full ${statusDot}`}
                  />
                  <select
                    value={status}
                    onChange={(e) => { setStatus(e.target.value); clearErr('status') }}
                    className={`${inputCls(true, !!errors.status)} appearance-none pr-7`}
                  >
                    {STATUSES.map((s) => (
                      <option key={s.name} value={s.name} className="bg-[#10131A] text-white">{s.name}</option>
                    ))}
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-400" />
                </div>
              </Field>

              <Field label="Notes" hint="Optional">
                <textarea
                  rows={3}
                  maxLength={MAX_NOTES}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any additional notes, installation details, etc..."
                  className={`${inputCls()} resize-none ${noScrollbar}`}
                />
                <p className="mt-1 text-right text-[9px] text-slate-500">
                  {notes.length}/{MAX_NOTES}
                </p>
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
            <Plus className="h-3 w-3" /> Create Asset
          </button>
        </div>
      </motion.form>
    </motion.div>,
    document.body,
  )
}