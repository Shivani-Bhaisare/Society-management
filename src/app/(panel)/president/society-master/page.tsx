'use client'

import { useState, ReactNode } from 'react'
import Image from 'next/image'
import {
  Building2, MapPin, ArrowRight, Plus, Upload, MoreHorizontal,
  Phone, Mail, ShieldCheck, Wrench, Siren, FileText, Folder, Layers,
  Home, Users, ParkingCircle, FileUp,
} from 'lucide-react'

const tabs = [
  'Overview', 'Society Profile', 'Towers & Blocks', 'Floors', 'Units / Flats',
  'Ownership', 'Residents', 'Parking', 'Documents', 'Custom Fields',
]

const overview = [
  ['Society Name', 'Green Valley Residency'], ['Legal / Registered Name', 'Green Valley Residency Welfare Association'],
  ['Society Type', 'Residential Society'], ['Registered Type', 'RWA'],
  ['Registration Number', 'RWA/BPL/2026/02188'], ['Established Year', '2026'],
  ['Address', 'Sector 12, Bhopal, Madhya Pradesh'], ['PIN Code', '462022'],
  ['Total Tower', '810'], ['Total Units', '1001'],
  ['Management Type', 'Resident Welfare Association'],
]

const towers = ['A', 'B', 'C', 'D']

const management = [
    ['Amit Sharma', 'President', '/img13.png'],
  ['Jane Cooper', 'Secretary', '/img14.png'],
  ['Wade Warren', 'Treasurer', '/img15.png'],
  ['Bessie Cooper', 'President', '/img16.png'],
  ['Darlene Robertson', 'President', '/img17.png'],

]

const contacts = [
  { t: 'Society Office', v: '+91 584927285', i: Phone }, { t: 'Email Id', v: 'admin@greenvalleyresidency.in', i: Mail },
  { t: 'Security Gate', v: '+91 8459545955', i: ShieldCheck }, { t: 'Maintenance', v: '+91 2614119452', i: Wrench },
  { t: 'Emergency Contact', v: '6969', i: Siren },
]

const docs = [
  { t: 'Society Registration Certificate', s: 'Updated 12 Aug 2026', st: 'Verified', i: FileText },
  { t: 'RWA Certificate', s: 'Updated 12 Aug 2026', st: 'Verified', i: FileText },
  { t: 'Society Bye-Laws', s: 'Updated 12 Aug 2026', st: 'Available', i: FileText },
  { t: 'Property / Society Documents', s: 'Shared Folder', st: '18 files', i: Folder },
]

const completeness = [
  ['Society Profile', 100], ['Tower & Floor Structure', 80], ['Unit Master', 70],
  ['Ownership', 60], ['Parking', 50], ['Document', 91],
] as const

const changes = [
  ['Tower H added', 'By Rahul Sharma • Today, 10:42 AM'], ['Flat B-604 ownership updated', 'By Admin • Today, 09:18 AM'],
  ['Parking slot P-128 assigned', 'By Admin • Yesterday'], ['Society registration document updated', 'By Rahul Sharma • Yesterday'],
  ['New custom field created', 'By Admin • 2 days ago'],
]

const quick = [
  { l: 'Add Tower', i: Building2 }, { l: 'Add Floor', i: Layers }, { l: 'Add Units', i: Home },
  { l: 'Add Owner / Tenant', i: Users }, { l: 'Add Parking Slots', i: ParkingCircle }, { l: 'Upload documents', i: FileUp },
]

/* ---------- helpers ---------- */
const Panel = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <div className={`min-w-0 rounded-xl border border-[#272D39] bg-[#10131A] p-3 sm:p-4 ${className}`}>{children}</div>
)

const Mini = ({ v, l, blue }: { v: string; l: string; blue?: boolean }) => (
  <div className="rounded-lg border border-[#272D39] bg-white/[0.03] px-3 py-2">
    <p className={`text-base font-semibold ${blue ? 'text-blue-500' : 'text-white'}`}>{v}</p>
    <p className="text-[10px] text-slate-400">{l}</p>
  </div>
)

const Title = ({ title, sub, link }: { title: string; sub?: string; link?: string }) => (
  <div className="mb-3 flex items-start justify-between gap-3 border-l-2 border-blue-500 pl-3">
    <div className="min-w-0">
      <h2 className="text-sm font-semibold text-white">{title}</h2>
      {sub && <p className="text-[11px] text-slate-400">{sub}</p>}
    </div>
    {link && <button className="shrink-0 text-[11px] text-blue-500 hover:underline">{link}</button>}
  </div>
)

// Photo dikhata hai; photo na mile to initials dikhata hai
const Avatar = ({ name, src }: { name: string; src?: string }) => {
  const [failed, setFailed] = useState(false)

  if (!src || failed) {
    return (
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#6C63FF] to-[#8B85FF] text-[10px] font-bold">
        {name.split(' ').map((w) => w[0]).join('')}
      </span>
    )
  }

  return (
    <Image
      src={src}
      alt={name}
      width={36}
      height={36}
      onError={() => setFailed(true)}
      className="h-9 w-9 shrink-0 rounded-full object-cover"
    />
  )
}

export default function SocietyMasterPage() {
  const [tab, setTab] = useState('Overview')

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-5">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl font-bold sm:text-2xl">Society Master</h1>
          <p className="max-w-xl text-xs text-slate-400">
            Manage your society&apos;s core information, structure, units, ownership and foundational records from one place.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 rounded-lg bg-[#6C63FF] px-3 py-2 text-xs font-semibold hover:opacity-90">
            <Plus className="h-3.5 w-3.5" /> Add / Update Society
          </button>
          <button className="flex items-center gap-1.5 rounded-lg border border-[#272D39] px-3 py-2 text-xs text-slate-300 hover:bg-white/5">
            <Upload className="h-3.5 w-3.5" /> <span className="hidden min-[480px]:inline">Import Data</span>
          </button>
          <button className="rounded-lg border border-[#272D39] p-2 text-slate-300 hover:bg-white/5" aria-label="More">
            <MoreHorizontal className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Society card */}
      <Panel className="!p-0 overflow-hidden">
        <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal-500/15 text-teal-400">
            <Building2 className="h-6 w-6" />
          </span>
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold">Green Valley Residency</h2>
            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-400">
              <span>Registered Residential Welfare Association</span>
              <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> Bhopal, Madhya Pradesh</span>
            </p>
          </div>
          <span className="w-fit rounded-full bg-white px-2.5 py-0.5 text-[10px] font-semibold text-emerald-600">● Active</span>
        </div>
        <div className="flex flex-col gap-3 border-t border-[#272D39] bg-white/[0.02] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 sm:flex sm:gap-8">
            {[['Registration No.', 'RWA/BPL/2026/02188'], ['Established', '2026'], ['Total Towers', '10'], ['Total Units', '1001']].map(([l, v]) => (
              <div key={l}>
                <p className="text-[9px] uppercase text-slate-500">{l}</p>
                <p className="text-xs font-semibold">{v}</p>
              </div>
            ))}
          </div>
          <button className="flex w-fit items-center gap-1.5 rounded-lg bg-[#6C63FF] px-3 py-2 text-xs font-semibold hover:opacity-90">
            Edit Society Profile <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </Panel>

      {/* Tabs */}
      <div className="-mx-3 overflow-x-auto border-b border-[#272D39] px-3 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
        <div className="flex min-w-max gap-5">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`whitespace-nowrap border-b-2 pb-2 text-[11px] transition-colors ${
                tab === t ? 'border-blue-500 font-semibold text-blue-500' : 'border-transparent text-slate-400 hover:text-white'
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Society Overview */}
      <section>
        <Title title="Society Overview" sub="Foundational identity and registration record." link="Edit details →" />
        <Panel>
          <div className="grid grid-cols-1 gap-x-10 md:grid-cols-2">
            {overview.map(([l, v]) => (
              <div key={l} className="border-b border-[#272D39] py-3">
                <p className="text-[11px] text-slate-400">{l}:</p>
                <p className="mt-0.5 text-xs font-medium">{v}</p>
              </div>
            ))}
          </div>
        </Panel>
      </section>

      {/* Society Structure */}
      <section>
        <Title title="Society Structure" sub="Understand The Physical Structure Of Your Community" link="Manage Structure →" />
        <Panel>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            <Mini v="8" l="Towers" blue /><Mini v="5000" l="Floors" /><Mini v="500" l="Units" /><Mini v="1,857" l="Residents" />
          </div>
          <div className="mt-3 grid grid-cols-1 gap-2 rounded-lg border border-[#272D39] p-3 min-[480px]:grid-cols-2 lg:grid-cols-4">
            {towers.map((t) => (
              <div key={t} className="flex items-center gap-3 rounded-lg border border-[#272D39] bg-white/[0.03] p-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5 text-slate-300"><Building2 className="h-4 w-4" /></span>
                <div>
                  <p className="text-[11px] font-medium">Towers {t}</p>
                  <p className="text-[10px] text-slate-400">8 Floors • 80 Units</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[10px]">
            {['Society', '8 Towers', '32 Floors', '648 Units'].map((c, i) => (
              <span key={c} className="flex items-center gap-2">
                {i > 0 && <span className="text-slate-500">›</span>}
                <span className="rounded-full bg-blue-100 px-2 py-0.5 font-medium text-blue-600">{c}</span>
              </span>
            ))}
          </div>
        </Panel>
      </section>

      {/* Parking + Ownership */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[2fr_3fr]">
        <section>
          <Title title="Parking Configuration" link="Manage Parking →" />
          <Panel className="h-[calc(100%-2.5rem)]">
            <p className="text-2xl font-bold">500</p>
            <p className="text-xs text-slate-400">Total Parking Slots</p>
            <div className="mt-2 h-1.5 rounded-full bg-blue-950"><div className="h-1.5 w-[80%] rounded-full bg-blue-600" /></div>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Mini v="542" l="Allocated" /><Mini v="54" l="Available" />
              <Mini v="165" l="Two - Wheeler" /><Mini v="54" l="Four - Wheeler" />
              <Mini v="50" l="EV Slots" /><Mini v="8" l="Reserved" />
            </div>
          </Panel>
        </section>

        <section>
          <Title title="Unit & Ownership Snapshot" link="Manage Ownership →" />
          <Panel className="h-[calc(100%-2.5rem)]">
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <Mini v="648" l="Total Units" /><Mini v="554" l="Occupied" /><Mini v="54" l="Vacant" />
              <Mini v="648" l="Owner Occupied" /><Mini v="250" l="Tenant Occupied" /><Mini v="50" l="Under Possession" />
            </div>
            <div className="mt-4 flex h-2 overflow-hidden rounded-full">
              <div className="bg-blue-600" style={{ width: '50%' }} />
              <div className="bg-sky-400" style={{ width: '30%' }} />
              <div className="bg-slate-200" style={{ width: '20%' }} />
            </div>
            <div className="mt-2 flex flex-wrap gap-4 text-[10px] text-slate-400">
              <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-blue-600" />Owner 428</span>
              <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-sky-400" />Tenant 164</span>
              <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-slate-200" />Vacant 56</span>
            </div>
          </Panel>
        </section>
      </div>

      {/* Management + Contact */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <section>
          <Title title="Current Management" link="View Committee →" />
          <Panel className="flex flex-col gap-2">
            {management.map(([n, r, img]) => (
              <div key={n + r} className="flex items-center gap-3 rounded-lg border border-[#272D39] bg-white/[0.03] px-3 py-2">
                <Avatar name={n} src={img} />
                <div>
                  <p className="text-xs font-medium">{n}</p>
                  <p className="text-[10px] text-slate-400">{r}</p>
                </div>
              </div>
            ))}
            <div className="flex items-center justify-between pt-1 text-[11px]">
              <span>Management Committee</span><span className="text-blue-500">12 members</span>
            </div>
          </Panel>
        </section>

        <section>
          <Title title="Society contact" link="Edit Contacts →" />
          <Panel className="flex flex-col gap-2">
            {contacts.map(({ t, v, i: Icon }) => (
              <div key={t} className="flex items-center gap-3 rounded-lg border border-[#272D39] bg-white/[0.03] px-3 py-2.5">
                <Icon className="h-4 w-4 shrink-0 text-slate-400" />
                <div className="min-w-0"><p className="text-xs font-medium">{t}</p><p className="truncate text-[10px] text-slate-400">{v}</p></div>
              </div>
            ))}
          </Panel>
        </section>
      </div>

      {/* Documents */}
      <section>
        <Title title="Registration & Important Documents" link="View All Documents →" />
        <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 lg:grid-cols-4">
          {docs.map(({ t, s, st, i: Icon }) => (
            <Panel key={t} className="!p-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/15 text-orange-400"><Icon className="h-4 w-4" /></span>
              <p className="mt-2 text-[11px] font-semibold">{t}</p>
              <p className="text-[10px] text-slate-400">{s}</p>
              <div className="mt-1 flex justify-between text-[10px]">
                <span className="text-emerald-400">{st}</span><span className="text-blue-500">View</span>
              </div>
            </Panel>
          ))}
        </div>
      </section>

      {/* Completeness + Recent Changes */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[2fr_3fr]">
        <section>
          <Title title="Society Master completeness" />
          <Panel>
            <p className="text-2xl font-bold">50%</p>
            <p className="mb-3 text-xs text-slate-400">Complete</p>
            <div className="flex flex-col gap-2.5">
              {completeness.map(([l, v]) => (
                <div key={l}>
                  <div className="mb-1 flex justify-between text-[10px] text-slate-400"><span>{l}</span><span>{v}%</span></div>
                  <div className="h-1 rounded-full bg-blue-950"><div className="h-1 rounded-full bg-blue-600" style={{ width: `${v}%` }} /></div>
                </div>
              ))}
            </div>
            <button className="mt-4 text-[11px] font-semibold">Review Missing Date</button>
          </Panel>
        </section>

        <section>
          <Title title="Recent Changes" link="View Audit Trail →" />
          <Panel>
            <div className="flex flex-col gap-4 border-l border-blue-500/40 pl-4">
              {changes.map(([t, s]) => (
                <div key={t} className="relative">
                  <i className="absolute -left-[21px] top-1 h-2 w-2 rounded-full border-2 border-blue-500 bg-[#10131A]" />
                  <p className="text-xs font-medium">{t}</p>
                  <p className="text-[10px] text-slate-500">{s}</p>
                </div>
              ))}
            </div>
          </Panel>
        </section>
      </div>

      {/* Quick Actions */}
      <section>
        <Title title="Quick Actions" />
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
          {quick.map(({ l, i: Icon }) => (
            <button key={l} className="flex items-center justify-center gap-2 rounded-lg border border-[#272D39] bg-[#10131A] px-3 py-3 text-[11px] text-slate-300 transition-colors hover:bg-white/5">
              <Icon className="h-4 w-4 shrink-0 text-slate-400" /> {l}
            </button>
          ))}
        </div>
      </section>
    </div>
  )
}