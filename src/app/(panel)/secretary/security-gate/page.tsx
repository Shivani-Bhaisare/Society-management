'use client'

import { useMemo, useState, type ElementType } from 'react'
import Link from 'next/link'
import { motion, type Variants } from 'framer-motion'
import {
  Plus, Search, CalendarDays, ChevronDown, Users, UserCheck, Clock, UserX, MoreVertical,
  UserPlus, Package, Car, Briefcase, Truck,
} from 'lucide-react'
import { Card, Badge } from '@/Components/ui'
import AddGateEntryModal, {
  type EntryType,
  type GateEntryPayload,
} from '@/Components/AddGateEntryModal'

/* ---------- Animation ---------- */

// Smooth "expo-out" curve: starts fast, settles softly
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]

// Replays every time a section enters the screen (set once: true to play only once)
const VIEWPORT = { once: false, amount: 0.15 }

// Container: children appear one after another
const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
}

// Each child fades in while moving up and scaling slightly
const item: Variants = {
  hidden: { opacity: 0, y: 30, scale: 0.97 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.7, ease: EASE },
  },
}

// Animated wrapper around Card: keeps the card filling the full grid cell height
const cellClass = 'h-full [&>*]:h-full'

/* ---------- Types ---------- */
type Tone = 'green' | 'blue' | 'orange' | 'gray'

type ActivityRow = {
  id: number | string
  n: string
  f: string
  p: string
  time: string
  s: string
  st: Tone
  img: string // if empty, initials are shown
  isNew?: boolean // added via the modal
}

type LogRow = {
  id: number | string
  time: string
  n: string
  f: string
  p: string
  type: 'Entry' | 'Exit'
  s: string
  st: Tone
  isNew?: boolean
}

/* ---------- Data (replace with API later) ---------- */

// Top summary cards (base numbers: new entries get added to these)
const baseStats = [
  { label: "Today's Visitors", value: 48, sub: '↑ 12% yesterday', subC: 'text-emerald-400', icon: Users, c: '#3B82F6' },
  { label: 'Inside Visitors', value: 17, sub: 'Currently on premises', subC: 'text-slate-400', icon: UserCheck, c: '#00C2B8' },
  { label: 'Expected Visitors', value: 12, sub: 'Pre-approved today', subC: 'text-orange-400', icon: Clock, c: '#F59E0B' },
  { label: 'Blacklisted', value: 3, sub: 'Entry restricted', subC: 'text-red-400', icon: UserX, c: '#EF4444' },
]

// Recent gate activity rows
const initialActivity: ActivityRow[] = [
  { id: 1, n: 'Amit Sharma', f: 'A-204', p: 'Guest', time: '10:32 AM', s: 'Approved', st: 'green', img: '/img37.jpg' },
  { id: 2, n: 'Swiggy Delivery', f: '—', p: 'Delivery', time: '10:45 AM', s: 'Inside', st: 'blue', img: '/img38.jpg' },
  { id: 3, n: 'Rahul Cab', f: '—', p: 'Cab', time: '11:02 AM', s: 'Approved', st: 'green', img: '/img39.jpg' },
  { id: 4, n: 'Suresh Kumar', f: 'C-402', p: 'Service Provider', time: '11:20 AM', s: 'Approved', st: 'green', img: '/img22.jpg' },
  { id: 5, n: 'Neha Patel', f: 'B-103', p: 'Guest', time: '11:35 AM', s: 'Pending', st: 'orange', img: '/img26.jpg' },
]

// Quick entry actions (each button opens the modal with that type)
const quick: { l: string; t: EntryType; i: ElementType; c: string }[] = [
  { l: 'Visitor Entry', t: 'Visitor', i: UserPlus, c: '#3B82F6' },
  { l: 'Delivery Entry', t: 'Delivery', i: Package, c: '#00C2B8' },
  { l: 'Cab Entry', t: 'Cab', i: Car, c: '#8B5CF6' },
  { l: 'Service Provider', t: 'Service', i: Briefcase, c: '#F59E0B' },
  { l: 'Vehicle Entry', t: 'Vehicle', i: Truck, c: '#00C2B8' },
]

// Today's entry / exit logs
const initialLogs: LogRow[] = [
  { id: 1, time: '10:32 AM', n: 'Amit Sharma', f: 'A-204', p: 'Guest', type: 'Entry', s: 'Inside', st: 'blue' },
  { id: 2, time: '11:20 AM', n: 'Suresh Kumar', f: 'C-402', p: 'Service Provider', type: 'Entry', s: 'Approved', st: 'green' },
  { id: 3, time: '11:45 AM', n: 'Priya Singh', f: 'B-203', p: 'Guest', type: 'Exit', s: 'Exited', st: 'gray' },
]

// Blacklisted phone numbers (to be fetched from the API later). The entry modal blocks these
const blacklistedPhones: string[] = []

const statusTone: Record<string, Tone> = {
  Approved: 'green',
  Inside: 'blue',
  Pending: 'orange',
}

// Shared table header / cell styles (same as dashboard)
const th = 'bg-white/4 px-2 py-2 font-medium first:rounded-l-md last:rounded-r-md'
const td = 'border-t border-[#272D39] px-2 py-2.5'

/* ---------- Helpers ---------- */
const initials = (name: string) =>
  name.trim().split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase()).join('') || 'GE'

// "14:05" -> "02:05 PM"
const fmtTime = (hm: string) => {
  const [h, m] = hm.split(':').map(Number)
  const ap = h >= 12 ? 'PM' : 'AM'
  return `${String(h % 12 || 12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ap}`
}

// For the table's "Purpose" column
const purposeOf = (p: GateEntryPayload) =>
  p.type === 'Visitor' || p.type === 'Vehicle'
    ? p.purpose
    : p.type === 'Service'
    ? 'Service Provider'
    : p.type

/* IMAGE: visitor photo (32x32). Shows initials if there is no photo */
function Avatar({ src, name }: { src: string; name: string }) {
  if (!src) {
    return (
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#272D39] bg-[#6C63FF]/25 text-[10px] font-bold text-[#A29CFF]">
        {initials(name)}
      </span>
    )
  }
  return (
    <img
      src={src}
      alt={name}
      width={32}
      height={32}
      className="h-8 w-8 shrink-0 rounded-full border border-[#272D39] object-cover"
    />
  )
}

/* ---------- Page ---------- */
export default function GateManagementPage() {
  const [activity, setActivity] = useState<ActivityRow[]>(initialActivity)
  const [logs, setLogs] = useState<LogRow[]>(initialLogs)

  const [showEntryModal, setShowEntryModal] = useState(false)
  const [entryType, setEntryType] = useState<EntryType>('Visitor')

  // Open the modal (with a type)
  const openEntry = (t: EntryType = 'Visitor') => {
    setEntryType(t)
    setShowEntryModal(true)
  }

  // Add the new entry from the modal to the lists
  function handleSave(p: GateEntryPayload) {
    const time = fmtTime(p.entryTime)
    const tone = statusTone[p.status] ?? 'gray'
    const flat = p.flat || '—'

    setActivity((prev) => [
      {
        id: p.id,
        n: p.name,
        f: flat,
        p: purposeOf(p),
        time,
        s: p.status,
        st: tone,
        // Local URL for preview for now. After the API, the server's photo URL will go here
        img: p.photo ? URL.createObjectURL(p.photo) : '',
        isNew: true,
      },
      ...prev,
    ])

    setLogs((prev) => [
      { id: p.id, time, n: p.name, f: flat, p: purposeOf(p), type: 'Entry', s: p.status, st: tone, isNew: true },
      ...prev,
    ])

    // TODO: add the API call here (along with the p.photo upload)
    console.log('New entry:', p)
  }

  // Stat cards: demo numbers + new entries (remove this once the API is in place)
  const stats = useMemo(() => {
    const added = activity.filter((a) => a.isNew)
    const bumps = [
      added.length, // Today's Visitors
      added.filter((a) => a.s === 'Inside').length, // Inside Visitors
      0, // Expected Visitors
      0, // Blacklisted
    ]
    return baseStats.map((s, i) => ({ ...s, value: String(s.value + bumps[i]) }))
  }, [activity])

  return (
    <div className="mx-auto flex w-full max-w-350 flex-col gap-4">
      {/* Header */}
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
        className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
      >
        <motion.div variants={item}>
          <h1 className="text-xl font-bold sm:text-2xl">Security / Gate Management</h1>
          <p className="text-xs text-slate-400">Manage visitors, vehicles and gate activity</p>
        </motion.div>
        {/* Primary button: gradient #6C63FF -> #4DA3FF */}
        <motion.div variants={item}>
          <button
            type="button"
            onClick={() => openEntry()}
            className="flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-linear-to-r from-[#6C63FF] to-[#4DA3FF] px-4 py-2.5 text-xs font-semibold text-white transition hover:opacity-90 active:scale-95"
          >
            <Plus className="h-3.5 w-3.5" /> Add Entry
          </button>
        </motion.div>
      </motion.div>

      {/* Filters bar */}
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
        className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center"
      >
        {/* Search */}
        <motion.div
          variants={item}
          className="flex flex-1 items-center gap-2 rounded-lg border border-[#272D39] bg-[#10131A] px-3 py-2 transition-colors hover:border-[#A29CFF]/60 focus-within:border-[#A29CFF]/60 sm:min-w-60"
        >
          <Search className="h-4 w-4 shrink-0 text-slate-500" />
          <input
            type="text"
            placeholder="Search visitor, flat, vehicle..."
            className="w-full bg-transparent text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none"
          />
        </motion.div>

        {/* Gate select */}
        <motion.div variants={item} className="relative">
          <select className="w-full appearance-none rounded-lg border border-[#272D39] bg-[#10131A] py-2 pl-3 pr-8 text-xs text-slate-300 focus:outline-none sm:w-36">
            <option>All Gates</option>
            <option>Main Gate</option>
            <option>Gate 2</option>
            <option>Service Gate</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        </motion.div>

        {/* Date select */}
        <motion.div variants={item} className="relative">
          <select className="w-full appearance-none rounded-lg border border-[#272D39] bg-[#10131A] py-2 pl-3 pr-8 text-xs text-slate-300 focus:outline-none sm:w-36">
            <option>Today</option>
            <option>Yesterday</option>
            <option>This Week</option>
            <option>This Month</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        </motion.div>

        {/* Calendar button */}
        <motion.button
          variants={item}
          type="button"
          aria-label="Pick a date"
          className="flex items-center justify-center rounded-lg border border-[#272D39] bg-[#10131A] p-2 text-slate-300 hover:bg-white/5"
        >
          <CalendarDays className="h-4 w-4" />
        </motion.button>
      </motion.div>

      {/* Stat cards (same card size as President dashboard cards) */}
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
        className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 lg:grid-cols-4"
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

      {/* Recent activity + Quick actions */}
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
        className="grid grid-cols-1 gap-4 xl:grid-cols-3"
      >
        <motion.div variants={item} className="xl:col-span-2">
          <Card
            title="Recent Gate Activity" sub="Latest visitors and vehicles"
            action={<Link href="/secretary/gate/visitors" className="text-[11px] text-[#A29CFF] hover:underline">View All</Link>}
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-155 text-left text-[11px]">
                <thead className="text-slate-400">
                  <tr>
                    <th className={th}>Photo</th>
                    <th className={th}>Name</th>
                    <th className={th}>Flat No.</th>
                    <th className={th}>Purpose</th>
                    <th className={th}>Time</th>
                    <th className={th}>Status</th>
                    <th className={th} />
                  </tr>
                </thead>
                <tbody>
                  {activity.map((a) => (
                    <tr key={a.id}>
                      <td className={td}>
                        <Avatar src={a.img} name={a.n} />
                      </td>
                      <td className={`${td} font-medium`}>{a.n}</td>
                      <td className={`${td} text-slate-400`}>{a.f}</td>
                      <td className={`${td} text-slate-400`}>{a.p}</td>
                      <td className={`${td} text-slate-400`}>{a.time}</td>
                      <td className={td}><Badge tone={a.st}>{a.s}</Badge></td>
                      <td className={td}>
                        <button type="button" aria-label="More actions" className="text-slate-500 hover:text-slate-300">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={item} className={cellClass}>
          <Card title="Quick Actions" sub="Log a new gate entry">
            <div className="flex flex-col gap-2">
              {quick.map(({ l, t, i: Icon, c }) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => openEntry(t)}
                  className="flex w-full items-center gap-3 rounded-lg border border-[#272D39] bg-white/3 px-3 py-2.5 text-left transition-colors hover:bg-white/5"
                  style={{ background: `${c}14` }}
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: `${c}26`, color: c }}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="text-xs font-semibold text-slate-200">{l}</span>
                </button>
              ))}
            </div>
          </Card>
        </motion.div>
      </motion.div>

      {/* Today's entry / exit logs */}
      <motion.div
        variants={item}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
      >
        <Card
          title="Today's Entry / Exit Logs" sub="Gate movement for today"
          action={<Link href="/secretary/gate/logs" className="text-[11px] text-[#A29CFF] hover:underline">View All</Link>}
        >
          <div className="overflow-x-auto">
            <table className="w-full min-w-140 text-left text-[11px]">
              <thead className="text-slate-400">
                <tr>
                  <th className={th}>Time</th>
                  <th className={th}>Name</th>
                  <th className={th}>Flat No.</th>
                  <th className={th}>Purpose</th>
                  <th className={th}>Type</th>
                  <th className={th}>Status</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id}>
                    <td className={`${td} text-slate-400`}>{l.time}</td>
                    <td className={`${td} font-medium`}>{l.n}</td>
                    <td className={`${td} text-slate-400`}>{l.f}</td>
                    <td className={`${td} text-slate-400`}>{l.p}</td>
                    <td className={`${td} text-slate-400`}>{l.type}</td>
                    <td className={td}><Badge tone={l.st}>{l.s}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </motion.div>

      {/* Add Gate Entry modal (outside the motion wrappers) */}
      <AddGateEntryModal
        open={showEntryModal}
        onClose={() => setShowEntryModal(false)}
        defaultType={entryType}
        blacklistedPhones={blacklistedPhones}
        onSave={handleSave}
      />
    </div>
  )
}