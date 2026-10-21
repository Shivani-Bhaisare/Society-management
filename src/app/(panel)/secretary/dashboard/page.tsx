'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion, type Variants } from 'framer-motion'
import {
  Users, CalendarDays, AlertTriangle, FileText, Bell, UserPlus, MessageSquareWarning,
  ClipboardList, Megaphone, CalendarPlus, ShieldAlert, FilePlus2, Send, PartyPopper,
  Building2, Upload, IndianRupee, ArrowRight, MapPin, ChevronDown,
} from 'lucide-react'
import { Card, Box, Badge, LinkBtn } from '@/Components/ui'

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

/* ---------- Data (replace with API data later) ---------- */

// Top summary cards
const stats = [
  { label: 'Total Residents', value: '186', sub: 'Owners: 142 · Tenants: 44', subC: 'text-slate-400', icon: Users, c: '#3B82F6' },
  { label: 'Upcoming Meetings', value: '3', sub: 'Next: 28 Oct 2026, 7:00 PM', subC: 'text-slate-400', icon: CalendarDays, c: '#8B5CF6' },
  { label: 'Pending Complaints', value: '12', sub: '2 Critical · 5 High · 5 Medium', subC: 'text-red-400', icon: AlertTriangle, c: '#EF4444' },
  { label: 'Active Resolutions', value: '4', sub: '2 Voting · 2 Draft', subC: 'text-emerald-400', icon: FileText, c: '#00C2B8' },
  { label: 'Active Notices', value: '5', sub: '2 Today', subC: 'text-orange-400', icon: Bell, c: '#F59E0B' },
]

// Today's schedule: [time, title, place, dot colour]
const schedule = [
  ['10:00 AM', 'Committee Meeting', 'Clubhouse', '#3B82F6'],
  ['01:00 PM', 'Vendor Discussion', 'Admin Office', '#F59E0B'],
  ['04:00 PM', 'Facility Inspection', 'Clubhouse', '#00C2B8'],
  ['07:00 PM', 'Society Event Planning', 'Conference Room', '#8B5CF6'],
] as const

// Items waiting for the secretary
const pending = [
  { t: 'Resident Requests', s: 'Flat approvals, NOC, etc.', n: 4, i: UserPlus, c: '#EF4444', href: '/secretary/residents' },
  { t: 'Complaints', s: 'Need attention', n: 2, i: MessageSquareWarning, c: '#F59E0B', href: '/secretary/complaints' },
  { t: 'Approvals', s: 'Vendor, facility, etc.', n: 1, i: ClipboardList, c: '#8B5CF6', href: '/secretary/committee' },
  { t: 'Documents', s: 'Awaiting signatures / uploads', n: 3, i: FileText, c: '#3B82F6', href: '/secretary/documents' },
]

// Quick action tiles
const quick = [
  { l: 'Create Notice', i: Megaphone, c: '#8B5CF6', href: '/secretary/notices' },
  { l: 'Schedule Meeting', i: CalendarPlus, c: '#3B82F6', href: '/secretary/meetings' },
  { l: 'Add Resident', i: UserPlus, c: '#00C2B8', href: '/secretary/residents' },
  { l: 'Log Complaint', i: ShieldAlert, c: '#EF4444', href: '/secretary/complaints' },
  { l: 'Create Resolution', i: FilePlus2, c: '#8B5CF6', href: '/secretary/resolutions' },
  { l: 'Broadcast Message', i: Send, c: '#3B82F6', href: '/secretary/communication' },
  { l: 'Add Event', i: PartyPopper, c: '#F59E0B', href: '/secretary/facilities' },
  { l: 'Manage Facility', i: Building2, c: '#00C2B8', href: '/secretary/facilities' },
  { l: 'Upload Document', i: Upload, c: '#94A3B8', href: '/secretary/documents' },
]

// Latest notifications
const notifications = [
  { t: 'New resident request', s: 'Flat B-203 verification pending', time: '10 mins ago', i: UserPlus, c: '#3B82F6' },
  { t: 'Complaint update', s: 'Lift issue - B-201 is in progress', time: '25 mins ago', i: AlertTriangle, c: '#F59E0B' },
  { t: 'Meeting reminder', s: 'Committee meeting tomorrow at 7 PM', time: '1 hour ago', i: CalendarDays, c: '#8B5CF6' },
  { t: 'New notice published', s: 'Water maintenance - Tower A', time: '2 hours ago', i: Megaphone, c: '#EF4444' },
  { t: 'Payment received', s: 'Maintenance bill for A-402', time: '3 hours ago', i: IndianRupee, c: '#00C2B8' },
]

// Recent meetings table
const meetings = [
  { d: '28 Oct 2026, 7:00 PM', t: 'Committee Meeting', s: 'Upcoming', st: 'blue' },
  { d: '20 Oct 2026, 6:00 PM', t: 'Budget Discussion', s: 'Completed', st: 'green' },
  { d: '12 Oct 2026, 7:00 PM', t: 'Society Event Plan', s: 'Completed', st: 'green' },
  { d: '05 Oct 2026, 6:00 PM', t: 'Vendor Meeting', s: 'Completed', st: 'green' },
] as const

// Recent complaints table (pt = priority tone, st = status tone)
const complaints = [
  { id: 'CMP-012', t: 'Lift not working', f: 'B-201', p: 'Critical', pt: 'red', s: 'Escalated', st: 'red' },
  { id: 'CMP-011', t: 'Water leakage', f: 'A-302', p: 'High', pt: 'orange', s: 'In Progress', st: 'purple' },
  { id: 'CMP-010', t: 'Power issue', f: 'C-102', p: 'Medium', pt: 'blue', s: 'Pending', st: 'orange' },
  { id: 'CMP-009', t: 'Cleaning issue', f: 'B-404', p: 'Low', pt: 'gray', s: 'Resolved', st: 'green' },
] as const

// Upcoming events: [title, date & time, place, image]
const events = [
  ['Diwali Celebration', '02 Nov 2026, 07:00 PM', 'Society Ground', '/img28.jpg'],
  ['Health Checkup Camp', '15 Nov 2026, 10:00 AM', 'Clubhouse', '/img29.jpg'],
  ["Children's Day Event", '14 Nov 2026, 04:00 PM', 'Play Area', '/img30.jpg'],
] as const

// Published notices table
const notices = [
  { t: 'Water Supply Maintenance', a: 'All Residents', d: '28 Oct 2026', i: Megaphone, c: '#8B5CF6' },
  { t: 'Diwali Event', a: 'Tower A/B', d: '27 Oct 2026', i: PartyPopper, c: '#F59E0B' },
  { t: 'Parking Rules Update', a: 'Owners', d: '25 Oct 2026', i: FileText, c: '#3B82F6' },
]

// Shared table header / cell styles
const th = 'bg-white/[0.04] px-2 py-2 font-medium first:rounded-l-md last:rounded-r-md'
const td = 'border-t border-[#272D39] px-2 py-2.5'

// Animated wrapper around Card: keeps the card filling the full grid cell height
const cellClass = 'h-full [&>*]:h-full'

/* ---------- Page ---------- */
export default function SecretaryDashboardPage() {
  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-4">
      {/* Greeting */}
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
        className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
      >
        <motion.div variants={item}>
          <h1 className="text-xl font-bold sm:text-2xl">Good Morning, Rahul 👋</h1>
          <p className="text-xs text-slate-400">Here&apos;s what&apos;s happening in your society today.</p>
        </motion.div>
        <motion.button
          variants={item}
          type="button"
          className="flex items-center gap-3 rounded-lg border border-[#272D39] bg-[#10131A] p-2 pr-3 text-left hover:bg-white/5"
        >
          {/* IMAGE: society building photo (48x40) */}
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
            <span className="flex items-center gap-1 text-[10px] text-slate-400">
              <MapPin className="h-3 w-3" /> Jaipur, Rajasthan
            </span>
          </span>
          <ChevronDown className="h-4 w-4 text-slate-500" />
        </motion.button>
      </motion.div>

      {/* Stat cards (same card size as President dashboard) */}
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
            {/* Coloured accent line at the bottom of the card */}
            <span className="absolute inset-x-0 bottom-0 h-[3px]" style={{ background: c }} />
          </motion.div>
        ))}
      </motion.div>

      {/* Schedule + Pending + Quick actions + Notifications */}
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
        className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-4"
      >
        <motion.div variants={item} className={cellClass}>
          <Card
            title="Today's Schedule" sub="Meetings & inspections today"
            action={<Link href="/secretary/meetings" className="text-[11px] text-[#A29CFF] hover:underline">View All</Link>}
          >
            <div className="flex flex-col gap-3">
              {schedule.map(([time, t, place, c]) => (
                <div key={t} className="flex items-center gap-3">
                  <i className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: c }} />
                  <span className="w-14 shrink-0 text-[10px] text-slate-400">{time}</span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold">{t}</p>
                    <p className="truncate text-[10px] text-slate-400">{place}</p>
                  </div>
                  <button
                    type="button"
                    className="rounded-md border border-[#272D39] px-2.5 py-1 text-[10px] text-slate-300 hover:bg-white/5"
                  >
                    View
                  </button>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        <motion.div variants={item} className={cellClass}>
          <Card title="Pending Actions" sub="Items waiting for you">
            <div className="flex flex-col gap-2">
              {pending.map(({ t, s, n, i: Icon, c, href }) => (
                <Link
                  key={t}
                  href={href}
                  className="flex items-center gap-3 rounded-lg border border-[#272D39] bg-white/[0.03] px-3 py-2 hover:bg-white/5"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg" style={{ background: `${c}26`, color: c }}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-semibold">{t}</span>
                    <span className="block truncate text-[10px] text-slate-400">{s}</span>
                  </span>
                  {/* Pending count badge */}
                  <span
                    className="flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-[11px] font-bold"
                    style={{ background: `${c}26`, color: c }}
                  >
                    {n}
                  </span>
                  <ArrowRight className="h-3 w-3 shrink-0 text-slate-500" />
                </Link>
              ))}
            </div>
          </Card>
        </motion.div>

        <motion.div variants={item} className={cellClass}>
          <Card title="Quick Actions" sub="Frequent secretary operations">
            <div className="grid grid-cols-3 gap-2">
              {quick.map(({ l, i: Icon, c, href }) => (
                <Link
                  key={l}
                  href={href}
                  className="flex flex-col items-center gap-1.5 rounded-lg border border-[#272D39] bg-white/[0.03] p-2.5 text-center transition-colors hover:bg-white/5"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: `${c}26`, color: c }}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="text-[10px] leading-tight text-slate-300">{l}</span>
                </Link>
              ))}
            </div>
          </Card>
        </motion.div>

        <motion.div variants={item} className={cellClass}>
          <Card
            title="Recent Notifications" sub="Latest updates"
            action={<Link href="/secretary/communication" className="text-[11px] text-[#A29CFF] hover:underline">View All</Link>}
          >
            <div className="flex flex-col gap-3">
              {notifications.map(({ t, s, time, i: Icon, c }) => (
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

      {/* Meetings + Complaints + Events */}
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
        className="grid grid-cols-1 gap-4 xl:grid-cols-2 2xl:grid-cols-3"
      >
        <motion.div variants={item} className={cellClass}>
          <Card
            title="Recent Meetings" sub="Last 4 meetings"
            action={<Link href="/secretary/meetings" className="text-[11px] text-[#A29CFF] hover:underline">View All</Link>}
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[380px] text-left text-[11px]">
                <thead className="text-slate-400">
                  <tr>
                    <th className={th}>Date &amp; Time</th>
                    <th className={th}>Meeting Title</th>
                    <th className={th}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {meetings.map((m) => (
                    <tr key={m.d}>
                      <td className={`${td} text-slate-400`}>{m.d}</td>
                      <td className={`${td} font-medium`}>{m.t}</td>
                      <td className={td}><Badge tone={m.st}>{m.s}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={item} className={cellClass}>
          <Card
            title="Recent Complaints" sub="Help desk status"
            action={<Link href="/secretary/complaints" className="text-[11px] text-[#A29CFF] hover:underline">View All</Link>}
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[460px] text-left text-[11px]">
                <thead className="text-slate-400">
                  <tr>
                    <th className={th}>ID</th>
                    <th className={th}>Title</th>
                    <th className={th}>Flat</th>
                    <th className={th}>Priority</th>
                    <th className={th}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {complaints.map((c) => (
                    <tr key={c.id}>
                      <td className={`${td} text-slate-400`}>{c.id}</td>
                      <td className={`${td} font-medium`}>{c.t}</td>
                      <td className={`${td} text-slate-400`}>{c.f}</td>
                      <td className={td}><Badge tone={c.pt}>{c.p}</Badge></td>
                      <td className={td}><Badge tone={c.st}>{c.s}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={item} className="xl:col-span-2 2xl:col-span-1">
          <Card
            title="Upcoming Events" sub="Society events this month"
            action={<Link href="/secretary/facilities" className="text-[11px] text-[#A29CFF] hover:underline">View All</Link>}
          >
            <div className="flex flex-col gap-3">
              {events.map(([t, when, place, img]) => (
                <div key={t} className="flex items-center gap-3">
                  {/* IMAGE: event thumbnail (56x56) */}
                  <span className="relative block h-14 w-14 shrink-0 overflow-hidden rounded-lg">
                    <Image
                      src={img}
                      alt={t}
                      fill
                      sizes="56px"
                      className="object-cover"
                    />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold">{t}</p>
                    <p className="truncate text-[10px] text-slate-400">{when}</p>
                    <p className="truncate text-[10px] text-slate-400">{place}</p>
                  </div>
                  <button
                    type="button"
                    className="rounded-md bg-emerald-500/15 px-3 py-1.5 text-[10px] font-semibold text-emerald-400 hover:bg-emerald-500/25"
                  >
                    Register
                  </button>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </motion.div>

      {/* Notices + Finance + Banner */}
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
        className="grid grid-cols-1 gap-4 xl:grid-cols-2 2xl:grid-cols-3"
      >
        <motion.div variants={item} className={cellClass}>
          <Card
            title="Recent Notices" sub="Published notices"
            action={<Link href="/secretary/notices" className="text-[11px] text-[#A29CFF] hover:underline">View All</Link>}
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[380px] text-left text-[11px]">
                <thead className="text-slate-400">
                  <tr>
                    <th className={th}>Title</th>
                    <th className={th}>Audience</th>
                    <th className={th}>Date</th>
                    <th className={th}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {notices.map(({ t, a, d, i: Icon, c }) => (
                    <tr key={t}>
                      <td className={td}>
                        <span className="flex items-center gap-2 font-medium">
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md" style={{ background: `${c}26`, color: c }}>
                            <Icon className="h-3 w-3" />
                          </span>
                          {t}
                        </span>
                      </td>
                      <td className={`${td} text-slate-400`}>{a}</td>
                      <td className={`${td} text-slate-400`}>{d}</td>
                      <td className={td}><Badge tone="green">Live</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={item} className={cellClass}>
          <Card
            title="Society Finance Overview" sub="Maintenance cycle summary"
            action={<Badge tone="blue">View Only</Badge>}
          >
            <div className="grid grid-cols-1 gap-2 min-[480px]:grid-cols-3">
              <Box label="Total Maintenance Due" value="₹4,85,000" color="text-[#8B85FF]" />
              <Box label="Collected This Month" value="₹3,12,000" color="text-emerald-400" />
              <Box label="Pending Payments" value="₹1,73,000" color="text-orange-400" />
            </div>
            {/* Overdue accounts alert row */}
            <div className="mt-3 flex items-center justify-between rounded-lg border border-red-500/40 bg-white/[0.03] px-3 py-2">
              <span className="flex items-center gap-2 text-xs font-semibold text-red-400">
                <AlertTriangle className="h-4 w-4" /> Overdue Accounts
              </span>
              <span className="text-sm font-bold text-red-400">18</span>
            </div>
            <div className="mt-3"><LinkBtn>View Reports →</LinkBtn></div>
          </Card>
        </motion.div>

        {/* Banner */}
        <motion.div
          variants={item}
          className="relative min-h-[170px] overflow-hidden rounded-xl border border-[#272D39] bg-[#10131A] p-5 xl:col-span-2 2xl:col-span-1"
        >
          {/* Jaipur image (right half) */}
          <div className="absolute inset-y-0 right-0 w-1/2 overflow-hidden">
            <Image
              src="/img19.jpg"
              alt="Jaipur"
              fill
              sizes="(min-width: 1536px) 25vw, 50vw"
              className="object-cover"
            />
            {/* Fade the image's left edge into the card's dark background */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#10131A] via-[#10131A]/40 to-transparent" />
          </div>

          {/* Banner text (left side) */}
          <div className="relative max-w-[55%]">
            <p className="text-sm font-bold">Jaipur&apos;s First Smart Society App</p>
            <p className="mt-0.5 text-[11px] font-medium text-[#A29CFF]">Safe • Smart • Secure</p>
            <p className="mt-3 text-[11px] italic text-slate-400">
              &ldquo;A better connected community for a brighter tomorrow.&rdquo;
            </p>
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}