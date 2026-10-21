'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Building2, X, Check, Upload, FileText, Trash2, ShieldCheck, Flame, HeartPulse, Shield,
  MapPin, Pencil, Home, Calendar, Mail, Phone, Clock, Download, Plus, ArrowRight, Save,
  ChevronDown, Car, Megaphone, Wrench, AlertTriangle, DoorOpen, UserCog, Hash, User, Zap,
} from 'lucide-react'
import { profileSteps } from '@/lib/validations/profile.schema' // ADDED: validation rules (one schema per step)
import { getErrors } from '@/lib/validations/validate' // ADDED: converts rule errors to { field: message }

/* ---------- Config ---------- */

const STEPS = [
  'Basic Details',
  'Address & Location',
  'Contact Info',
  'Society Structure',
  'Rules & Regulations',
  'Office Bearers',
  'Emergency Contacts',
  'Notification Settings',
]

const STEP_TITLE = [
  'Basic Details',
  'Address & Location',
  'Contact Information',
  'Society Structure',
  'Rules & Regulations',
  'Office Bearers',
  'Emergency Contacts',
  'Notification Settings',
]

const STEP_SUB = [
  "Update your society's core information and identity",
  "Provide your society's complete address and location details",
  'Keep your official contacts and communication details updated',
  "Manage your society's towers, units and amenities details",
  'Upload society rules and important documents',
  'Update president, secretary and treasurer details',
  'Keep important emergency numbers and contacts updated',
  'Manage your notification preferences',
]

const BASE_AMENITIES = [
  'Club House', 'Garden', 'Swimming Pool', 'Jogging Track', 'Gym',
  'CCTV Surveillance', "Children's Play Area", 'Basketball Court',
]

const NOTIFS = [
  { key: 'notices', icon: Megaphone, title: 'Society Notices', sub: 'Get notified about important society notices' },
  { key: 'maintenance', icon: Wrench, title: 'Maintenance Reminders', sub: 'Get reminders for maintenance and dues' },
  { key: 'emergency', icon: AlertTriangle, title: 'Emergency Alerts', sub: 'Get urgent alerts and safety notifications' },
  { key: 'visitor', icon: DoorOpen, title: 'Visitor Notifications', sub: 'Get notified about visitor entries' },
]

const CHANNELS = [
  ['inapp', 'In-App Notifications'],
  ['sms', 'SMS Notifications'],
  ['email', 'Email Notifications'],
  ['whatsapp', 'WhatsApp Notifications'],
]

const EMERGENCY = [
  { key: 'security', title: 'Security', sub: '24x7 Security Control Room', icon: ShieldCheck, color: '#3B82F6' },
  { key: 'fire', title: 'Fire Brigade', sub: 'Fire Emergency', icon: Flame, color: '#EF4444' },
  { key: 'ambulance', title: 'Ambulance', sub: 'Medical Emergency', icon: HeartPulse, color: '#F43F5E' },
  { key: 'police', title: 'Police', sub: 'Police Helpline', icon: Shield, color: '#8B5CF6' },
]

const OTHER_CONTACTS = [
  { key: 'manager', title: 'Society Manager', icon: UserCog },
  { key: 'plumber', title: 'Plumber', icon: Wrench },
  { key: 'electrician', title: 'Electrician', icon: Zap },
]

type Vals = Record<string, string>

// All inputs start empty. Set the initial values here once data comes from the API
const INITIAL: Vals = {
  name: '', regNo: '', type: 'Residential', year: '', desc: '',
  address: '', city: '', state: '', pin: '', country: 'India',
  email: '', phone: '', emergency: '', officeAddress: '', hours: '',
  towers: '', units: '', parking: '', gate: '',
  presName: '', presMobile: '', presEmail: '',
  secName: '', secMobile: '', secEmail: '',
  treName: '', treMobile: '', treEmail: '',
  security: '', fire: '', ambulance: '', police: '',
  manager: '', plumber: '', electrician: '',
}

/* Hide the scrollbar (content still scrolls, the bar is just not visible) */
const noScrollbar =
  '[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden'

/* ---------- Small UI helpers (dashboard colours) ---------- */
/* bg: #10131A | input bg: #0B0E14 | border: #272D39 | accent: #6C63FF / #A29CFF */

const inputCls = (err?: string, icon = false) =>
  `w-full rounded-md border bg-[#0B0E14] py-2 text-[11px] text-white outline-none transition-colors placeholder:text-slate-500 focus:border-[#6C63FF] ${
    icon ? 'pl-8 pr-2.5' : 'px-2.5'
  } ${err ? 'border-red-500/60' : 'border-[#272D39]'}`

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

function IconInput({
  icon: Icon, error, ...props
}: { icon: React.ElementType; error?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-500" />
      <input {...props} className={inputCls(error, true)} />
    </div>
  )
}

function IconSelect({
  icon: Icon, children, ...props
}: { icon: React.ElementType } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-500" />
      <select {...props} className={`${inputCls(undefined, true)} appearance-none pr-7`}>
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-400" />
    </div>
  )
}

function Counter({ n, max = 500 }: { n: number; max?: number }) {
  return <p className="mt-1 text-right text-[9px] text-slate-500">{n}/{max}</p>
}

function Toggle({ on, onChange }: { on: boolean; onChange: () => void }) {
  return (
    <button
      type="button"
      onClick={onChange}
      className={`relative h-5 w-9 shrink-0 cursor-pointer rounded-full transition-colors ${on ? 'bg-[#6C63FF]' : 'bg-white/10'}`}
    >
      <span
        className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${on ? 'left-4.5' : 'left-0.5'}`}
      />
    </button>
  )
}

function Check2({ on, onChange, label }: { on: boolean; onChange: () => void; label: string }) {
  return (
    <button type="button" onClick={onChange} className="flex cursor-pointer items-center gap-2 text-left text-[11px] text-slate-200">
      <span
        className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
          on ? 'border-[#6C63FF] bg-[#6C63FF]' : 'border-[#272D39]'
        }`}
      >
        {on && <Check className="h-3 w-3 text-white" />}
      </span>
      {label}
    </button>
  )
}

function UploadBox({
  label, hint, fileName, onPick, accept, icon: Icon = Upload,
}: {
  label: string; hint: string; fileName?: string; onPick: (f: File) => void; accept?: string; icon?: React.ElementType
}) {
  return (
    <label className="flex h-28 cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed border-[#3A4152] bg-[#0B0E14] px-3 text-center transition-colors hover:border-[#6C63FF]">
      <Icon className="h-4 w-4 text-[#A29CFF]" />
      <span className="max-w-full truncate text-[10px] font-medium text-white">{fileName || label}</span>
      <span className="text-[9px] text-slate-500">{hint}</span>
      <input
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => e.target.files?.[0] && onPick(e.target.files[0])}
      />
    </label>
  )
}

function ImageUpload({
  label, hint, file, onPick, onClear,
}: {
  label: string; hint: string; file: File | null; onPick: (f: File) => void; onClear: () => void
}) {
  const [dataUrl, setDataUrl] = useState('')

  // Read the picked file as a data URL.
  // setState runs inside the async callback (not in the effect body), so the lint rule stays happy
  useEffect(() => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setDataUrl(String(reader.result))
    reader.readAsDataURL(file)
    return () => {
      reader.onload = null
    }
  }, [file])

  // Show nothing once the file is removed
  const url = file ? dataUrl : ''

  if (!url) return <UploadBox label={label} hint={hint} onPick={onPick} accept="image/*" />

  return (
    <div className="relative h-28 overflow-hidden rounded-md border border-[#272D39]">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={url} alt={label} className="h-full w-full object-cover" />
      <div className="absolute right-2 top-2 flex gap-1.5">
        <label className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-md bg-black/60 text-white hover:bg-[#6C63FF]">
          <Pencil className="h-3 w-3" />
          <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && onPick(e.target.files[0])} />
        </label>
        <button type="button" onClick={onClear} className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-md bg-black/60 text-white hover:bg-red-500">
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </div>
  )
}

/* ---------- Drawer ---------- */

export default function EditProfileModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return <AnimatePresence>{open && <ModalBody onClose={onClose} />}</AnimatePresence>
}

type Extra = { role: string; name: string; mobile: string; email: string }

function ModalBody({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0)
  const [v, setV] = useState<Vals>(INITIAL)
  const [errors, setErrors] = useState<Vals>({})
  const [amenityList, setAmenityList] = useState<string[]>(BASE_AMENITIES)
  const [amenities, setAmenities] = useState<string[]>([])
  const [addingAmenity, setAddingAmenity] = useState(false)
  const [newAmenity, setNewAmenity] = useState('')
  const [notifs, setNotifs] = useState<Record<string, boolean>>({ notices: true, maintenance: true, emergency: true, visitor: true })
  const [channels, setChannels] = useState<Record<string, boolean>>({ inapp: true, sms: true, email: true, whatsapp: true })
  const [logo, setLogo] = useState<File | null>(null)
  const [cover, setCover] = useState<File | null>(null)
  const [rules, setRules] = useState<File | null>(null)
  const [docs, setDocs] = useState<{ name: string; size: string }[]>([])
  const [extras, setExtras] = useState<Extra[]>([])

  const isLast = step === STEPS.length - 1

  // Lock the page scroll behind the drawer as soon as it opens
  useEffect(() => {
    const html = document.documentElement
    const body = document.body
    const prevHtml = html.style.overflow
    const prevBody = body.style.overflow
    html.style.overflow = 'hidden'
    body.style.overflow = 'hidden'
    return () => {
      html.style.overflow = prevHtml
      body.style.overflow = prevBody
    }
  }, [])

  const set = (k: string, val: string) => {
    setV((p) => ({ ...p, [k]: val }))
    if (errors[k]) setErrors((p) => ({ ...p, [k]: '' }))
  }

  const bind = (k: string) => ({
    value: v[k] ?? '',
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
      set(k, e.target.value),
  })

  // CHANGED: validation for each step (rules live in lib/validations/profile.schema.ts)
  function validate(i: number): Vals {
    return getErrors(profileSteps[i], v)
  }

  function next() {
    const e = validate(step)
    setErrors(e)
    if (!Object.keys(e).length) setStep((s) => s + 1)
  }

  function save() {
    for (let i = 0; i < STEPS.length; i++) {
      const e = validate(i)
      if (Object.keys(e).length) { setErrors(e); setStep(i); return }
    }
    // TODO: add the API call here
    console.log('SAVE', { ...v, amenities, notifs, channels, logo, cover, rules, docs, extras })
    onClose()
  }

  const toggleAmenity = (a: string) =>
    setAmenities((p) => (p.includes(a) ? p.filter((x) => x !== a) : [...p, a]))

  function addAmenity() {
    const a = newAmenity.trim()
    if (a && !amenityList.includes(a)) {
      setAmenityList((p) => [...p, a])
      setAmenities((p) => [...p, a])
    }
    setNewAmenity('')
    setAddingAmenity(false)
  }

  const updateExtra = (i: number, k: keyof Extra, val: string) =>
    setExtras((p) => p.map((x, idx) => (idx === i ? { ...x, [k]: val } : x)))

  /* ----- Step contents ----- */
  function renderStep() {
    switch (step) {
      case 0:
        return (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Society Logo">
              <ImageUpload label="Click to upload logo" hint="PNG, JPG (Max 2MB)" file={logo} onPick={setLogo} onClear={() => setLogo(null)} />
            </Field>
            <Field label="Cover Image (Optional)">
              <ImageUpload label="Click to upload cover image" hint="PNG, JPG (Max 5MB)" file={cover} onPick={setCover} onClear={() => setCover(null)} />
            </Field>
            <Field label="Society Name" error={errors.name}>
              <IconInput icon={Building2} {...bind('name')} placeholder="Enter society name" error={errors.name} />
            </Field>
            <Field label="Registration Number" error={errors.regNo}>
              <IconInput icon={Hash} {...bind('regNo')} placeholder="Enter registration number" error={errors.regNo} />
            </Field>
            <Field label="Society Type">
              <IconSelect icon={Home} {...bind('type')}>
                <option className="bg-[#10131A] text-white">Residential</option>
                <option className="bg-[#10131A] text-white">Commercial</option>
                <option className="bg-[#10131A] text-white">Mixed</option>
              </IconSelect>
            </Field>
            <Field label="Established Year" error={errors.year}>
              <IconInput icon={Calendar} type="number" {...bind('year')} placeholder="e.g. 2018" error={errors.year} />
            </Field>
            <Field label="Society Description" className="sm:col-span-2">
              <textarea rows={3} maxLength={500} {...bind('desc')} placeholder="Write about your society" className={`${inputCls()} resize-none ${noScrollbar}`} />
              <Counter n={v.desc.length} />
            </Field>
          </div>
        )
      case 1:
        return (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Full Address" error={errors.address} className="sm:col-span-2">
              <textarea rows={3} maxLength={500} {...bind('address')} placeholder="Enter full address" className={`${inputCls(errors.address)} resize-none ${noScrollbar}`} />
              <Counter n={v.address.length} />
            </Field>
            <Field label="City" error={errors.city}>
              <IconInput icon={MapPin} {...bind('city')} placeholder="Enter city" error={errors.city} />
            </Field>
            <Field label="State" error={errors.state}>
              <input {...bind('state')} placeholder="Enter state" className={inputCls(errors.state)} />
            </Field>
            <Field label="PIN Code" error={errors.pin}>
              <input {...bind('pin')} inputMode="numeric" maxLength={6} placeholder="6 digit PIN" className={inputCls(errors.pin)} />
            </Field>
            <Field label="Country">
              <div className="relative">
                <select {...bind('country')} className={`${inputCls()} appearance-none pr-7`}>
                  <option className="bg-[#10131A] text-white">India</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-400" />
              </div>
            </Field>
            <Field label="Location on Map" className="sm:col-span-2">
              <div className="relative flex h-32 items-center justify-center overflow-hidden rounded-md border border-[#272D39] bg-[#0B0E14] bg-[radial-gradient(circle_at_30%_40%,rgba(108,99,255,0.12),transparent_60%)]">
                <span className="mx-2 flex max-w-full items-center gap-2 truncate rounded-md bg-white/10 px-3 py-1.5 text-[10px] text-white">
                  <MapPin className="h-3 w-3 shrink-0 text-red-400" />
                  <span className="truncate">{v.name || 'Your society location'}</span>
                </span>
                {/* Add Google Map / Leaflet here later */}
                <button type="button" className="absolute bottom-2 right-2 cursor-pointer rounded-md bg-[#6C63FF] px-3 py-1.5 text-[10px] font-semibold text-white hover:opacity-90">
                  Update Location
                </button>
              </div>
            </Field>
          </div>
        )
      case 2:
        return (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Official Email" error={errors.email}>
              <IconInput icon={Mail} type="email" {...bind('email')} placeholder="Enter official email" error={errors.email} />
            </Field>
            <Field label="Contact Number" error={errors.phone}>
              <IconInput icon={Phone} type="tel" {...bind('phone')} placeholder="Enter contact number" error={errors.phone} />
            </Field>
            <Field label="Emergency Contact" error={errors.emergency} className="sm:col-span-2">
              <IconInput icon={Phone} type="tel" {...bind('emergency')} placeholder="Enter emergency number" error={errors.emergency} />
            </Field>
            <Field label="Office Address" className="sm:col-span-2">
              <div className="relative">
                <Building2 className="pointer-events-none absolute left-2.5 top-2.5 h-3 w-3 text-slate-500" />
                <textarea rows={3} maxLength={500} {...bind('officeAddress')} placeholder="Enter office address" className={`${inputCls(undefined, true)} resize-none ${noScrollbar}`} />
              </div>
              <Counter n={v.officeAddress.length} />
            </Field>
            <Field label="Office Working Hours" className="sm:col-span-2">
              <IconInput icon={Clock} {...bind('hours')} placeholder="e.g. 9:00 AM - 6:00 PM" />
            </Field>
          </div>
        )
      case 3:
        return (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {[
                ['towers', 'Total Towers', 'Towers / Blocks', Building2, '#3B82F6'],
                ['units', 'Total Units', 'Flats / Units', Home, '#8B5CF6'],
                ['parking', 'Total Parking Slots', 'Parking Slots', Car, '#00C2B8'],
              ].map(([k, l, s, Icon, c]) => {
                const I = Icon as typeof Building2
                return (
                  <div key={k as string} className="flex items-center gap-2.5 rounded-md border border-[#272D39] bg-[#0B0E14] p-2.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: `${c}26`, color: c as string }}>
                      <I className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] text-slate-400">{l as string}</p>
                      <input type="number" {...bind(k as string)} placeholder="0" className="w-full bg-transparent text-base font-bold text-white outline-none placeholder:text-slate-600" />
                      <p className="text-[9px] text-slate-500">{s as string}</p>
                    </div>
                  </div>
                )
              })}
            </div>

            <div>
              <p className="mb-1 text-[10px] text-slate-400">Available Amenities</p>
              <div className="grid grid-cols-1 gap-x-4 gap-y-3 rounded-md border border-[#272D39] bg-[#0B0E14] p-3 min-[480px]:grid-cols-2">
                {amenityList.map((a) => (
                  <Check2 key={a} label={a} on={amenities.includes(a)} onChange={() => toggleAmenity(a)} />
                ))}
                {addingAmenity ? (
                  <input
                    autoFocus
                    value={newAmenity}
                    onChange={(e) => setNewAmenity(e.target.value)}
                    onBlur={addAmenity}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addAmenity() } }}
                    placeholder="Type & press Enter"
                    className="min-w-0 rounded-md border border-[#272D39] bg-transparent px-2 py-1 text-[11px] text-white outline-none focus:border-[#6C63FF]"
                  />
                ) : (
                  <button type="button" onClick={() => setAddingAmenity(true)} className="flex cursor-pointer items-center gap-1 text-left text-[11px] font-medium text-[#A29CFF]">
                    <Plus className="h-3 w-3" /> More
                  </button>
                )}
              </div>
            </div>

            <Field label="Security Gate Details">
              <div className="relative">
                <textarea rows={4} {...bind('gate')} placeholder="Enter security gate details" className={`${inputCls()} resize-none pr-16 ${noScrollbar}`} />
                <span className="pointer-events-none absolute bottom-2 right-2 flex items-center gap-1 rounded-md border border-[#272D39] px-2 py-1 text-[9px] text-[#A29CFF]">
                  <Pencil className="h-3 w-3" /> Edit
                </span>
              </div>
            </Field>
          </div>
        )
      case 4:
        return (
          <div className="flex flex-col gap-4">
            <Field label="Society Rules & Regulations">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <UploadBox label="Click to upload PDF" hint="PDF (Max 10MB)" accept=".pdf" onPick={setRules} />
                {rules && (
                  <div className="flex items-center gap-2.5 rounded-md border border-[#272D39] bg-[#0B0E14] p-2.5">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-500/15">
                      <FileText className="h-4 w-4 text-red-400" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[10px] font-medium text-white">{rules.name}</p>
                      <p className="text-[9px] text-slate-500">{(rules.size / (1024 * 1024)).toFixed(1)} MB</p>
                    </div>
                    <button type="button" onClick={() => { const u = URL.createObjectURL(rules); window.open(u, '_blank') }} className="cursor-pointer text-slate-400 hover:text-white">
                      <Download className="h-3 w-3" />
                    </button>
                    <button type="button" onClick={() => setRules(null)} className="cursor-pointer text-slate-400 hover:text-red-400">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                )}
              </div>
            </Field>

            <Field label="Other Important Documents">
              <div className="flex flex-col gap-1.5">
                {docs.map((d, idx) => (
                  <div key={`${d.name}-${idx}`} className="flex items-center gap-2.5 rounded-md border border-[#272D39] bg-[#0B0E14] px-2.5 py-2">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-red-500/15">
                      <FileText className="h-4 w-4 text-red-400" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-[10px] font-medium text-white">{d.name}</p>
                      <p className="text-[9px] text-slate-500">{d.size}</p>
                    </div>
                    <button type="button" onClick={() => setDocs((p) => p.filter((_, i) => i !== idx))} className="cursor-pointer text-slate-400 hover:text-red-400">
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                <label className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed border-[#3A4152] bg-[#0B0E14] px-3 py-4 text-center transition-colors hover:border-[#6C63FF]">
                  <Upload className="h-4 w-4 text-[#A29CFF]" />
                  <span className="text-[10px] font-medium text-white">Click to upload document</span>
                  <span className="text-[9px] text-slate-500">PDF, DOC, DOCX (Max 10MB)</span>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0]
                      if (f) setDocs((p) => [...p, { name: f.name, size: `${(f.size / (1024 * 1024)).toFixed(1)} MB` }])
                      e.target.value = ''
                    }}
                  />
                </label>
              </div>
            </Field>
          </div>
        )
      case 5:
        return (
          <div className="flex flex-col gap-3">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {[
                ['President', 'pres'],
                ['Secretary', 'sec'],
              ].map(([title, p]) => (
                <div key={p} className="rounded-md border border-[#272D39] p-3">
                  <p className="mb-3 flex items-center gap-2 text-[11px] font-semibold text-white">
                    <User className="h-3 w-3 text-[#A29CFF]" /> {title}
                  </p>
                  <div className="flex flex-col gap-3">
                    <Field label="Name"><input {...bind(`${p}Name`)} placeholder="Full name" className={inputCls()} /></Field>
                    <Field label="Mobile"><input {...bind(`${p}Mobile`)} placeholder="Mobile number" className={inputCls(errors[`${p}Mobile`])} /></Field>
                    <Field label="Email"><input {...bind(`${p}Email`)} placeholder="Email address" className={inputCls(errors[`${p}Email`])} /></Field>
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-md border border-[#272D39] p-3">
              <p className="mb-3 flex items-center gap-2 text-[11px] font-semibold text-white">
                <User className="h-3 w-3 text-[#A29CFF]" /> Treasurer
              </p>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                <Field label="Name"><input {...bind('treName')} placeholder="Full name" className={inputCls()} /></Field>
                <Field label="Mobile"><input {...bind('treMobile')} placeholder="Mobile number" className={inputCls(errors.treMobile)} /></Field>
                <Field label="Email"><input {...bind('treEmail')} placeholder="Email address" className={inputCls(errors.treEmail)} /></Field>
              </div>
            </div>

            {extras.map((x, i) => (
              <div key={i} className="rounded-md border border-[#272D39] p-3">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <input
                    value={x.role}
                    onChange={(e) => updateExtra(i, 'role', e.target.value)}
                    placeholder="Designation (e.g. Joint Secretary)"
                    className="min-w-0 flex-1 bg-transparent text-[11px] font-semibold text-white outline-none placeholder:text-slate-500"
                  />
                  <button type="button" onClick={() => setExtras((p) => p.filter((_, idx) => idx !== i))} className="cursor-pointer text-slate-400 hover:text-red-400">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <Field label="Name"><input value={x.name} onChange={(e) => updateExtra(i, 'name', e.target.value)} placeholder="Full name" className={inputCls()} /></Field>
                  <Field label="Mobile"><input value={x.mobile} onChange={(e) => updateExtra(i, 'mobile', e.target.value)} placeholder="Mobile number" className={inputCls()} /></Field>
                  <Field label="Email"><input value={x.email} onChange={(e) => updateExtra(i, 'email', e.target.value)} placeholder="Email address" className={inputCls()} /></Field>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={() => setExtras((p) => [...p, { role: '', name: '', mobile: '', email: '' }])}
              className="flex cursor-pointer items-center justify-center gap-1.5 self-start rounded-md border border-dashed border-[#3A4152] px-3 py-2 text-[11px] font-medium text-[#A29CFF] hover:border-[#6C63FF]"
            >
              <Plus className="h-3 w-3" /> Add Office Bearer
            </button>
          </div>
        )
      case 6:
        return (
          <div className="flex flex-col gap-4">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {EMERGENCY.map(({ key, title, sub, icon: I, color }) => (
                <div key={key} className="flex items-center gap-2.5 rounded-md border border-[#272D39] bg-[#0B0E14] p-2.5">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg" style={{ background: `${color}26`, color }}>
                    <I className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-[11px] font-semibold text-white">{title}</p>
                    <input {...bind(key)} placeholder="Enter number" className="w-full bg-transparent text-[11px] text-slate-300 outline-none placeholder:text-slate-600" />
                    <p className="truncate text-[9px] text-slate-500">{sub}</p>
                  </div>
                </div>
              ))}
            </div>

            <div>
              <p className="mb-1 text-[10px] text-slate-400">Other Important Contacts</p>
              <div className="flex flex-col gap-1.5">
                {OTHER_CONTACTS.map(({ key, title, icon: I }) => (
                  <div key={key} className="flex items-center gap-2.5 rounded-md border border-[#272D39] bg-[#0B0E14] px-2.5 py-2">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/5 text-slate-300">
                      <I className="h-3 w-3" />
                    </span>
                    <span className="w-24 shrink-0 truncate text-[11px] text-white sm:w-28">{title}</span>
                    <input {...bind(key)} placeholder="Enter number" className="min-w-0 flex-1 bg-transparent text-right text-[11px] text-slate-300 outline-none placeholder:text-slate-600" />
                    <Pencil className="h-3 w-3 shrink-0 text-slate-500" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )
      default:
        return (
          <div className="flex flex-col gap-4">
            <div>
              <p className="mb-1 text-[10px] text-slate-400">Notification Preferences</p>
              <div className="flex flex-col divide-y divide-[#272D39] rounded-md border border-[#272D39] bg-[#0B0E14]">
                {NOTIFS.map(({ key, icon: I, title, sub }) => (
                  <div key={key} className="flex items-center gap-2.5 px-2.5 py-2.5">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#6C63FF]/20 text-[#A29CFF]">
                      <I className="h-3.5 w-3.5" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-semibold text-white">{title}</p>
                      <p className="text-[9px] text-slate-400">{sub}</p>
                    </div>
                    <Toggle on={!!notifs[key]} onChange={() => setNotifs((p) => ({ ...p, [key]: !p[key] }))} />
                  </div>
                ))}
              </div>
            </div>
            <div>
              <p className="mb-1 text-[10px] text-slate-400">Preferred Notification Channels</p>
              <div className="grid grid-cols-1 gap-3 rounded-md border border-[#272D39] bg-[#0B0E14] p-3 min-[480px]:grid-cols-2">
                {CHANNELS.map(([k, l]) => (
                  <Check2 key={k} label={l} on={!!channels[k]} onChange={() => setChannels((p) => ({ ...p, [k]: !p[k] }))} />
                ))}
              </div>
            </div>
          </div>
        )
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      onClick={onClose}
      // No gap on the right side, only top and bottom gap
      className="fixed inset-0 z-100 flex justify-end bg-black/70 py-3 pl-3 backdrop-blur-sm sm:py-5 sm:pl-0"
    >
      <motion.div
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
              <Building2 className="h-4 w-4 text-white" />
            </span>
            <div className="min-w-0">
              <h2 className="text-sm font-bold text-white">Edit Society Profile</h2>
              <p className="text-[10px] text-slate-400">Update your society information and settings</p>
            </div>
          </div>
          <button type="button" onClick={onClose} aria-label="Close" className="shrink-0 cursor-pointer rounded-lg p-1.5 text-slate-300 hover:bg-white/5 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Stepper (mobile): compact progress bar */}
        <div className="shrink-0 px-3.5 pb-3 pt-2 sm:hidden">
          <div className="mb-1.5 flex items-center justify-between gap-2 text-[10px]">
            <span className="truncate font-semibold text-[#A29CFF]">{STEPS[step]}</span>
            <span className="shrink-0 text-slate-400">Step {step + 1} of {STEPS.length}</span>
          </div>
          <div className="flex gap-1">
            {STEPS.map((s, i) => (
              <button
                key={s}
                type="button"
                disabled={i > step}
                onClick={() => setStep(i)}
                aria-label={`Go to ${s}`}
                className={`h-1.5 flex-1 cursor-pointer rounded-full transition-colors disabled:cursor-not-allowed ${
                  i <= step ? 'bg-[#6C63FF]' : 'bg-white/10'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Stepper (tablet and up): top/bottom padding keeps the active number's ring from being clipped */}
        <div className={`hidden shrink-0 overflow-x-auto px-3.5 pb-3 pt-2 sm:block sm:px-4 ${noScrollbar}`}>
          <div className="flex min-w-130 items-start">
            {STEPS.map((s, i) => {
              const done = i < step
              const active = i === step
              return (
                <div key={s} className="flex flex-1 flex-col items-center">
                  <div className="flex w-full items-center">
                    <span className={`h-px flex-1 ${i === 0 ? 'opacity-0' : i <= step ? 'bg-[#6C63FF]' : 'bg-white/10'}`} />
                    <button
                      type="button"
                      disabled={i > step}
                      onClick={() => setStep(i)}
                      className={`flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded-full border text-[10px] font-semibold transition-all disabled:cursor-not-allowed ${
                        active
                          ? 'border-[#6C63FF] bg-[#6C63FF] text-white ring-4 ring-[#6C63FF]/25'
                          : done
                            ? 'border-[#6C63FF] bg-[#10131A] text-[#A29CFF]'
                            : 'border-white/15 bg-[#10131A] text-slate-500'
                      }`}
                    >
                      {i + 1}
                    </button>
                    <span className={`h-px flex-1 ${i === STEPS.length - 1 ? 'opacity-0' : done ? 'bg-[#6C63FF]' : 'bg-white/10'}`} />
                  </div>
                  <span className={`mt-1.5 px-1 text-center text-[9px] leading-tight ${active ? 'font-semibold text-[#A29CFF]' : 'text-slate-500'}`}>
                    {s}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* Body: scrolls without a visible scrollbar */}
        <div className={`min-h-0 flex-1 overflow-y-auto overscroll-contain px-3.5 text-white sm:px-4 ${noScrollbar}`}>
          <div className="rounded-xl border border-[#272D39] p-3.5">
            <div className="mb-3 flex items-center gap-2.5">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#6C63FF]/20 text-[11px] font-bold text-[#A29CFF]">
                {step + 1}
              </span>
              <div className="min-w-0">
                <h3 className="text-xs font-bold">{step + 1}. {STEP_TITLE[step]}</h3>
                <p className="text-[9px] text-slate-400">{STEP_SUB[step]}</p>
              </div>
            </div>
            {renderStep()}

            {/* ADDED: error list for steps whose inputs have no inline error text (Structure, Office Bearers, Emergency) */}
            {[3, 5, 6].includes(step) && Object.values(errors).some(Boolean) && (
              <ul className="mt-3 flex flex-col gap-1 text-[9px] text-red-400">
                {Object.values(errors)
                  .filter(Boolean)
                  .map((m) => (
                    <li key={m}>{m}</li>
                  ))}
              </ul>
            )}
          </div>
          <div className="h-3" />
        </div>

        {/* Footer */}
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 border-t border-[#272D39] p-3.5 sm:p-4">
          <button type="button" onClick={onClose} className="cursor-pointer rounded-md border border-[#272D39] px-3.5 py-1.5 text-[11px] font-semibold text-white hover:bg-white/5 max-sm:flex-1">
            Cancel
          </button>
          {step > 0 && (
            <button type="button" onClick={() => setStep((s) => s - 1)} className="cursor-pointer rounded-md border border-[#272D39] px-3.5 py-1.5 text-[11px] font-semibold text-white hover:bg-white/5 max-sm:flex-1">
              Back
            </button>
          )}
          <button
            type="button"
            onClick={isLast ? save : next}
            className="flex cursor-pointer items-center justify-center gap-1.5 rounded-md bg-linear-to-r from-[#6C63FF] to-[#4DA3FF] px-4 py-1.5 text-[11px] font-semibold text-white hover:opacity-90 max-sm:flex-1"
          >
            {isLast ? (<><Save className="h-3 w-3" /> Save Changes</>) : (<>Next <ArrowRight className="h-3 w-3" /></>)}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}