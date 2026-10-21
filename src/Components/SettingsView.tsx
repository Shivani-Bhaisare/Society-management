'use client' // Keep this for Next.js App Router, remove otherwise

import { useState } from 'react'
import Link from 'next/link'
import {
  Building2, MapPin, FileText, Home, Layers, CalendarDays, Briefcase,
  Pencil, Save, X, Eye,
  type LucideIcon,
} from 'lucide-react'

/* ---------- Data (replace with API data later) ---------- */

type FieldConfig = {
  name: string
  label: string
  placeholder: string
  icon: LucideIcon
}

// Society Information fields (order matches the 2-column grid, left to right)
const fields: FieldConfig[] = [
  { name: 'societyName', label: 'Society Name', placeholder: 'Enter society name', icon: Building2 },
  { name: 'address', label: 'Society Address', placeholder: 'Enter society address', icon: MapPin },
  { name: 'registrationNo', label: 'Registration Number', placeholder: 'Enter registration number', icon: FileText },
  { name: 'totalUnits', label: 'Total Units', placeholder: 'Enter total units', icon: Home },
  { name: 'totalTowers', label: 'Total Towers', placeholder: 'Enter total towers', icon: Layers },
  { name: 'financialYear', label: 'Financial Year', placeholder: 'Enter financial year', icon: CalendarDays },
  { name: 'managementType', label: 'Management Type', placeholder: 'Enter management type', icon: Briefcase },
]

// Initial values (these will come from your API later)
const initialData: Record<string, string> = {
  societyName: 'Green Valley Residency',
  address: 'Green Valley Residency, Bhopal, Madhya Pradesh',
  registrationNo: 'REG-2020-0456',
  totalUnits: '240',
  totalTowers: '6',
  financialYear: '2026 – 2027',
  managementType: 'RWA / Cooperative Society',
}

/* ---------- Reusable pieces ---------- */

// Figma gradient: #6C63FF -> #4DA3FF
const gradientBg = 'bg-gradient-to-r from-[#6C63FF] to-[#4DA3FF]'

// Card wrapper with an icon + title header and an optional action on the right
function Section({
  title, icon: Icon, action, children,
}: { title: string; icon: LucideIcon; action?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-[#272D39] bg-[#10131A] p-4">
      {/* Section header */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#6C63FF]/15 text-[#8B85FF]">
            <Icon className="h-4 w-4" />
          </span>
          <h3 className="text-sm font-semibold">{title}</h3>
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

// A single field: icon box + small label + input (read-only unless editing)
function InputField({
  config, value, editing, onChange,
}: {
  config: FieldConfig
  value: string
  editing: boolean
  onChange: (name: string, value: string) => void
}) {
  const { name, label, placeholder, icon: Icon } = config
  return (
    <label
      htmlFor={name}
      className={`flex items-center gap-3 rounded-lg border bg-white/[0.03] px-3 py-2.5 transition-colors ${
        editing
          ? 'cursor-text border-[#272D39] focus-within:border-[#6C63FF] focus-within:bg-white/[0.05]'
          : 'cursor-default border-[#272D39]'
      }`}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5 text-slate-400">
        <Icon className="h-4 w-4" />
      </span>
      {/* min-w-0 lets long text truncate instead of overflowing */}
      <div className="min-w-0 flex-1">
        <p className="text-[10px] text-slate-400">{label}</p>
        <input
          id={name}
          name={name}
          type="text"
          value={value}
          readOnly={!editing}
          placeholder={placeholder}
          onChange={(e) => onChange(name, e.target.value)}
          className="w-full truncate bg-transparent text-xs font-semibold text-slate-100 outline-none placeholder:font-normal placeholder:text-slate-500"
        />
      </div>
    </label>
  )
}

/* ---------- Page UI ---------- */
export default function SocietySettingsView() {
  const [saved, setSaved] = useState<Record<string, string>>(initialData) // last saved values
  const [form, setForm] = useState<Record<string, string>>(initialData)   // values being edited
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  // Update a single field in the form state
  const handleChange = (name: string, value: string) =>
    setForm((prev) => ({ ...prev, [name]: value }))

  // Discard changes and go back to read-only mode
  const handleCancel = () => {
    setForm(saved)
    setEditing(false)
  }

  // Submit handler for the Save button
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      // TODO: call your API here, e.g. await fetch('/api/society', { method: 'PUT', body: JSON.stringify(form) })
      console.log('Saving society:', form)
      setSaved(form)
      setEditing(false)
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSave} className="mx-auto flex w-full max-w-[1400px] flex-col gap-4">
      {/* Page heading */}
      <div>
        <h1 className="text-xl font-bold sm:text-2xl">Society Settings</h1>
        <p className="text-xs text-slate-400">Manage your society information and configuration</p>
      </div>

      {/* Society Information section */}
      <Section
        title="Society Information"
        icon={Building2}
        action={
          // Edit button is hidden while editing (Save / Cancel are shown below instead)
          !editing && (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="flex items-center justify-center gap-2 rounded-lg border border-[#272D39] bg-white/5 px-3 py-1.5 text-[11px] font-semibold text-slate-200 transition-colors hover:bg-white/10"
            >
              <Pencil className="h-3 w-3" /> Edit
            </button>
          )
        }
      >
        {/* 1 column on mobile, 2 columns from md screens and up */}
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {fields.map((f) => (
            <InputField
              key={f.name}
              config={f}
              value={form[f.name]}
              editing={editing}
              onChange={handleChange}
            />
          ))}
        </div>
      </Section>

      {/* Bottom actions: stacked on mobile, right-aligned on larger screens */}
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        {editing ? (
          <>
            {/* Cancel button */}
            <button
              type="button"
              onClick={handleCancel}
              className="flex items-center justify-center gap-2 rounded-lg border border-[#272D39] bg-white/5 px-6 py-2.5 text-xs font-semibold text-slate-200 transition-colors hover:bg-white/10"
            >
              <X className="h-3.5 w-3.5" /> Cancel
            </button>

            {/* Save button (Figma gradient) */}
            <button
              type="submit"
              disabled={saving}
              className={`flex items-center justify-center gap-2 rounded-lg ${gradientBg} px-6 py-2.5 text-xs font-semibold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60`}
            >
              <Save className="h-3.5 w-3.5" /> {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </>
        ) : (
          // View-only mode: link to the full society overview page
          <Link
            href="/secretary/society"
            className="flex items-center justify-center gap-2 rounded-lg border border-[#6C63FF]/50 bg-[#6C63FF]/10 px-6 py-2.5 text-xs font-semibold text-[#A29CFF] transition-colors hover:bg-[#6C63FF]/20"
          >
            <Eye className="h-3.5 w-3.5" /> View Society Details
          </Link>
        )}
      </div>
    </form>
  )
}