'use client' // Keep this for Next.js App Router, remove otherwise

import { useRef, useState } from 'react'
import {
  User, Phone, Mail, ShieldCheck, MapPin, CalendarDays, Clock,
  Camera, Pencil, Building2, Hash, BadgeCheck, Save,
  type LucideIcon,
} from 'lucide-react'

/* ---------- Data ---------- */

// Data shown in the top profile card (replace with API data / useUser() later)
const profile = {
  initials: 'RS',
  name: 'Rahul Sharma',
  role: 'Secretary',
  society: 'Green Valley Residency',
  status: 'Active',
  joinedOn: '15 Jun 2025',
  lastLogin: '10 Oct 2025, 02:34 PM',
}

type FieldConfig = {
  name: string
  label: string
  placeholder: string
  icon: LucideIcon
  type?: string
}

// Personal Information fields (blank for now)
const personalFields: FieldConfig[] = [
  { name: 'fullName', label: 'Full Name', placeholder: 'Enter full name', icon: User },
  { name: 'mobile', label: 'Mobile Number', placeholder: 'Enter mobile number', icon: Phone, type: 'tel' },
  { name: 'email', label: 'Email Address', placeholder: 'Enter email address', icon: Mail, type: 'email' },
  { name: 'role', label: 'Role', placeholder: 'Enter role', icon: ShieldCheck },
]

// Society Information fields (blank for now)
const societyFields: FieldConfig[] = [
  { name: 'societyName', label: 'Society Name', placeholder: 'Enter society name', icon: Building2 },
  { name: 'societyId', label: 'Society ID', placeholder: 'Enter society ID', icon: Hash },
  { name: 'location', label: 'Location', placeholder: 'Enter location', icon: MapPin },
  { name: 'memberSince', label: 'Committee Member Since', placeholder: 'Enter date', icon: BadgeCheck },
]

const allFields = [...personalFields, ...societyFields]

// Initial form state: every field starts as an empty string
const initialForm = Object.fromEntries(allFields.map((f) => [f.name, ''])) as Record<string, string>

/* ---------- Reusable pieces ---------- */

// Figma gradient: #6C63FF -> #4DA3FF
const gradientBg = 'bg-gradient-to-r from-[#6C63FF] to-[#4DA3FF]'

// Card wrapper with an icon + title header (used for each information section)
function Section({
  title, icon: Icon, children,
}: { title: string; icon: LucideIcon; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-[#272D39] bg-[#10131A] p-4">
      {/* Section header */}
      <div className="mb-4 flex items-center gap-2">
        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#6C63FF]/15 text-[#8B85FF]">
          <Icon className="h-4 w-4" />
        </span>
        <h3 className="text-sm font-semibold">{title}</h3>
      </div>
      {children}
    </section>
  )
}

// A single editable field: icon box + small label + input
function InputField({
  config, value, onChange, inputRef,
}: {
  config: FieldConfig
  value: string
  onChange: (name: string, value: string) => void
  inputRef?: React.Ref<HTMLInputElement>
}) {
  const { name, label, placeholder, icon: Icon, type = 'text' } = config
  return (
    <label
      htmlFor={name}
      className="flex cursor-text items-center gap-3 rounded-lg border border-[#272D39] bg-white/[0.03] px-3 py-2.5 transition-colors focus-within:border-[#6C63FF] focus-within:bg-white/[0.05]"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5 text-slate-400">
        <Icon className="h-4 w-4" />
      </span>
      {/* min-w-0 lets long text truncate instead of overflowing */}
      <div className="min-w-0 flex-1">
        <p className="text-[10px] text-slate-400">{label}</p>
        <input
          ref={inputRef}
          id={name}
          name={name}
          type={type}
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(name, e.target.value)}
          className="w-full truncate bg-transparent text-xs font-semibold text-slate-100 outline-none placeholder:font-normal placeholder:text-slate-500"
        />
      </div>
    </label>
  )
}

// Small info row used in the profile card (Joined On, Last Login)
function MetaItem({ label, value, icon: Icon }: { label: string; value: string; icon: LucideIcon }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#272D39] text-slate-400">
        <Icon className="h-4 w-4" />
      </span>
      <div className="min-w-0">
        <p className="text-[10px] text-slate-400">{label}</p>
        <p className="text-xs font-semibold">{value}</p>
      </div>
    </div>
  )
}

/* ---------- Page UI ---------- */
export default function ProfileView() {
  const [form, setForm] = useState<Record<string, string>>(initialForm)
  const [saving, setSaving] = useState(false)
  const firstInputRef = useRef<HTMLInputElement>(null)

  // Update a single field in the form state
  const handleChange = (name: string, value: string) =>
    setForm((prev) => ({ ...prev, [name]: value }))

  // Submit handler for the Save button
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      // TODO: call your API here, e.g. await fetch('/api/profile', { method: 'PUT', body: JSON.stringify(form) })
      console.log('Saving profile:', form)
    } finally {
      setSaving(false)
    }
  }

  return (
    // Same wrapper as the Society page: no extra outer padding (the layout already provides it)
    <form
      onSubmit={handleSave}
      className="mx-auto flex w-full max-w-[1400px] flex-col gap-4"
    >
      {/* Page heading */}
      <div>
        <h1 className="text-xl font-bold sm:text-2xl">My Profile</h1>
        <p className="text-xs text-slate-400">View and manage your personal and society details</p>
      </div>

      {/* Profile hero card */}
      <section className="rounded-xl border border-[#272D39] bg-[#10131A] p-4">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          {/* Left side: avatar + name + badges */}
          <div className="flex items-center gap-4">
            {/* Avatar with camera button overlay */}
            <div className="relative shrink-0">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#6C63FF] to-[#4DA3FF] text-2xl font-bold text-white sm:h-24 sm:w-24 sm:text-3xl">
                {profile.initials}
              </div>
              <button
                type="button"
                aria-label="Change photo"
                className="absolute bottom-0 right-0 flex h-7 w-7 items-center justify-center rounded-full border-2 border-[#10131A] bg-gradient-to-br from-[#6C63FF] to-[#4DA3FF] text-white transition-opacity hover:opacity-90"
              >
                <Camera className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="flex min-w-0 flex-col gap-1.5">
              <h2 className="truncate text-lg font-bold">{profile.name}</h2>

              {/* Role badge */}
              <span className="flex w-fit items-center gap-1.5 rounded-md border border-[#272D39] bg-white/5 px-2 py-0.5 text-[11px] text-slate-300">
                <ShieldCheck className="h-3 w-3 text-[#8B85FF]" /> {profile.role}
              </span>

              {/* Society name */}
              <span className="flex items-center gap-1.5 text-[11px] text-slate-400">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate">{profile.society}</span>
              </span>

              {/* Active status badge */}
              <span className="flex w-fit items-center gap-1.5 rounded-md bg-emerald-500/15 px-2 py-0.5 text-[10px] font-semibold text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> {profile.status}
              </span>
            </div>
          </div>

          {/* Right side: join/login info + edit button */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center lg:gap-8">
            {/* Top border on mobile, left border from sm screens and up */}
            <div className="flex flex-col gap-3 border-t border-[#272D39] pt-4 sm:border-l sm:border-t-0 sm:pl-6 sm:pt-0">
              <MetaItem label="Joined On" value={profile.joinedOn} icon={CalendarDays} />
              <MetaItem label="Last Login" value={profile.lastLogin} icon={Clock} />
            </div>

            {/* Focuses the first input so the user can start editing */}
            <button
              type="button"
              onClick={() => firstInputRef.current?.focus()}
              className={`flex items-center justify-center gap-2 rounded-lg ${gradientBg} px-4 py-2.5 text-xs font-semibold text-white transition-opacity hover:opacity-90`}
            >
              <Pencil className="h-3.5 w-3.5" /> Edit Profile
            </button>
          </div>
        </div>
      </section>

      {/* Personal Information section */}
      <Section title="Personal Information" icon={User}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {personalFields.map((f, i) => (
            <InputField
              key={f.name}
              config={f}
              value={form[f.name]}
              onChange={handleChange}
              inputRef={i === 0 ? firstInputRef : undefined}
            />
          ))}
        </div>
      </Section>

      {/* Society Information section */}
      <Section title="Society Information" icon={Building2}>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {societyFields.map((f) => (
            <InputField key={f.name} config={f} value={form[f.name]} onChange={handleChange} />
          ))}
        </div>
      </Section>

      {/* Save button: full width on mobile, auto width and right-aligned on larger screens */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={saving}
          className={`flex w-full items-center justify-center gap-2 rounded-lg ${gradientBg} px-6 py-2.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto`}
        >
          <Save className="h-3.5 w-3.5" /> {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  )
}