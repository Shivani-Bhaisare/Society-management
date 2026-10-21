'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, type Variants } from 'framer-motion'
import {
  Building2, Users, Home, KeyRound, MapPin, ChevronDown, Pencil,
  UserPlus, Megaphone, CalendarDays, Waves, Dumbbell, Car, Trees, PartyPopper,
} from 'lucide-react'
import { Card, Badge } from '@/Components/ui'
import EditProfileModal from '@/Components/EditProfileModal'

/* ---------- Animation ---------- */

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]
const VIEWPORT = { once: false, amount: 0.15 }

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
}

const item: Variants = {
  hidden: { opacity: 0, y: 30, scale: 0.97 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.7, ease: EASE },
  },
}

/* ---------- Data (replace with API data later) ---------- */

const stats = [
  { label: 'Total Units', value: '186', sub: '6 Towers', subC: 'text-slate-400', icon: Building2, c: '#3B82F6' },
  { label: 'Owners', value: '142', sub: '76% of total units', subC: 'text-emerald-400', icon: Users, c: '#00C2B8' },
  { label: 'Tenants', value: '44', sub: '24% of total units', subC: 'text-slate-400', icon: Home, c: '#8B5CF6' },
  { label: 'Vacant Units', value: '12', sub: 'Available for rent / sale', subC: 'text-orange-400', icon: KeyRound, c: '#F59E0B' },
]

const info = [
  ['Registration No.', 'GRV/2024/1023'],
  ['Society Type', 'Residential'],
  ['Established', '2018'],
  ['Total Towers', '6'],
  ['Total Units', '186'],
  ['Contact Email', 'info@greenvalleyresidency.com'],
  ['Contact Number', '+91 98765 43210'],
  ['Emergency Contact', '+91 98765 43211'],
] as const

const towers = [
  { n: 'Tower A', u: 32 },
  { n: 'Tower B', u: 32 },
  { n: 'Tower C', u: 30 },
  { n: 'Tower D', u: 30 },
  { n: 'Tower E', u: 30 },
  { n: 'Tower F', u: 32 },
]

const amenities = [
  { n: 'Clubhouse', i: PartyPopper, c: '#8B5CF6' },
  { n: 'Swimming Pool', i: Waves, c: '#3B82F6' },
  { n: 'Gym', i: Dumbbell, c: '#F59E0B' },
  { n: 'Parking', i: Car, c: '#94A3B8' },
  { n: 'Garden', i: Trees, c: '#00C2B8' },
]

const activity = [
  { t: 'New resident registered', s: 'Flat A-101 • Rahul Sharma', time: '2h ago', i: UserPlus, c: '#3B82F6' },
  { t: 'Maintenance notice published', s: 'Water supply maintenance', time: '4h ago', i: Megaphone, c: '#EF4444' },
  { t: 'Committee meeting scheduled', s: '12 Oct 2026, 6:00 PM', time: '6h ago', i: CalendarDays, c: '#8B5CF6' },
]

const cellClass = 'h-full [&>*]:h-full'

/* ---------- Page ---------- */
export default function SocietyPage() {
  const [editOpen, setEditOpen] = useState(false)

  return (
    <div className="mx-auto flex w-full max-w-350 flex-col gap-4">
      {/* Heading */}
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
        className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
      >
        <motion.div variants={item}>
          <h1 className="text-xl font-bold sm:text-2xl">Society Overview</h1>
          <p className="flex items-center gap-1 text-xs text-slate-400">
            <MapPin className="h-3 w-3" /> Green Valley Residency • Jaipur, Rajasthan
          </p>
        </motion.div>

        <motion.div
          variants={item}
          className="flex flex-col gap-2 min-[480px]:flex-row min-[480px]:items-center"
        >
          <button
            type="button"
            className="flex cursor-pointer items-center gap-3 rounded-lg border border-[#272D39] bg-[#10131A] p-2 pr-3 text-left hover:bg-white/5"
          >
            <span className="relative block h-10 w-12 shrink-0 overflow-hidden rounded-md">
              <Image
                src="/img18.jpg"
                alt="Green Valley Society"
                fill
                sizes="48px"
                className="object-cover"
              />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-xs font-semibold">Green Valley Society</span>
              <span className="block text-[10px] text-slate-400">6 Towers • 186 Units</span>
            </span>
            <ChevronDown className="h-4 w-4 text-slate-500" />
          </button>

          <button
            type="button"
            onClick={() => setEditOpen(true)}
            className="flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-linear-to-r from-[#6C63FF] to-[#4DA3FF] px-4 py-2.5 text-xs font-semibold text-white transition hover:opacity-90 active:scale-95"
          >
            <Pencil className="h-3.5 w-3.5" /> Edit Society Profile
          </button>
        </motion.div>
      </motion.div>

      {/* Stat cards */}
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
        className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-3"
      >
        {stats.map(({ label, value, sub, subC, icon: Icon, c }) => (
          <motion.div
            key={label}
            variants={item}
            className="relative overflow-hidden rounded-xl border border-[#272D39] bg-[#10131A] p-4"
          >
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: `${c}26`, color: c }}>
                <Icon className="h-4 w-4" />
              </span>
              <span className="truncate text-xs font-semibold">{label}</span>
            </div>
            <p className="mt-3 text-2xl font-bold">{value}</p>
            <p className={`mt-1 text-[10px] ${subC}`}>{sub}</p>
            <span className="absolute inset-x-0 bottom-0 h-0.75" style={{ background: c }} />
          </motion.div>
        ))}
      </motion.div>

      {/* Information + Towers */}
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
        className="grid grid-cols-1 gap-4 xl:grid-cols-3"
      >
        <motion.div variants={item} className="xl:col-span-2">
          <Card title="Society Information" sub="Registration and contact details">
            <div className="grid grid-cols-1 gap-x-6 sm:grid-cols-2">
              {info.map(([k, v]) => (
                <div
                  key={k}
                  className="flex items-center justify-between gap-3 border-t border-[#272D39] py-2.5 text-[11px]"
                >
                  <span className="text-slate-400">{k}</span>
                  <span className="min-w-0 break-words text-right font-medium">{v}</span>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        <motion.div variants={item} className={cellClass}>
          <Card
            title="Towers & Units" sub="Unit count per tower"
            action={<Link href="/secretary/society/towers" className="text-[11px] text-[#A29CFF] hover:underline">View All</Link>}
          >
            <div className="flex flex-col gap-3">
              {towers.map(({ n, u }) => (
                <div key={n}>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="flex items-center gap-2 font-medium">
                      <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[#3B82F6]/15 text-[#3B82F6]">
                        <Building2 className="h-3 w-3" />
                      </span>
                      {n}
                    </span>
                    <span className="text-slate-400">{u} Units</span>
                  </div>
                  <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/6">
                    <div className="h-full rounded-full bg-[#3B82F6]" style={{ width: `${(u / 32) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </motion.div>

      {/* Amenities + Recent Activity */}
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
        className="grid grid-cols-1 gap-4 md:grid-cols-2"
      >
        <motion.div variants={item} className={cellClass}>
          <Card title="Amenities" sub="Facilities available in society">
            <div className="flex flex-col gap-2">
              {amenities.map(({ n, i: Icon, c }) => (
                <div
                  key={n}
                  className="flex items-center gap-3 rounded-lg border border-[#272D39] bg-white/3 px-3 py-2"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: `${c}26`, color: c }}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-xs font-semibold">{n}</span>
                  <Badge tone="green">Active</Badge>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        <motion.div variants={item} className={cellClass}>
          <Card
            title="Recent Activity" sub="Latest society updates"
            action={<Link href="/secretary/communication" className="text-[11px] text-[#A29CFF] hover:underline">View All</Link>}
          >
            <div className="flex flex-col gap-3">
              {activity.map(({ t, s, time, i: Icon, c }) => (
                <div key={t} className="flex items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full" style={{ background: `${c}26`, color: c }}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold">{t}</p>
                    <p className="truncate text-[10px] text-slate-400">{s}</p>
                  </div>
                  <span className="shrink-0 text-[10px] text-slate-500">{time}</span>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </motion.div>

      <EditProfileModal open={editOpen} onClose={() => setEditOpen(false)} />
    </div>
  )
}