'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { motion, type Variants } from 'framer-motion'
import {
  Plus, Search, SlidersHorizontal, Eye, Pencil, Trash2, ChevronDown,
  Droplets, PartyPopper, Car, Wrench, CalendarClock, Megaphone, type LucideIcon,
} from 'lucide-react'
import { Card, Badge } from '@/Components/ui'
import AddCommunicationModal, { type CommunicationPayload } from '@/Components/AddCommunicationModal'

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
type Channel = 'App' | 'Email' | 'SMS'
type CStatus = 'Sent' | 'Scheduled' | 'Draft'
type Group = 'Residents' | 'Owners' | 'Staff'

type Msg = {
  id: number
  subject: string
  preview: string
  audience: string
  group: Group
  channel: Channel
  date: string
  status: CStatus
  icon: LucideIcon
  c: string
}

// Initial communications list
const initial: Msg[] = [
  { id: 1, subject: 'Water Supply Maintenance', preview: 'Water supply will be unavailable for...', audience: 'All Residents', group: 'Residents', channel: 'App', date: '28 Oct 2026', status: 'Sent', icon: Droplets, c: '#3B82F6' },
  { id: 2, subject: 'Diwali Celebration Event', preview: 'Join us for the Diwali celebration at...', audience: 'All Residents', group: 'Residents', channel: 'Email', date: '27 Oct 2026', status: 'Scheduled', icon: PartyPopper, c: '#EF4444' },
  { id: 3, subject: 'Parking Rules Update', preview: 'New parking rules will be effective...', audience: 'Owners', group: 'Owners', channel: 'SMS', date: '25 Oct 2026', status: 'Sent', icon: Car, c: '#3B82F6' },
  { id: 4, subject: 'Maintenance Reminder', preview: 'Please clear the maintenance dues for...', audience: 'All Residents', group: 'Residents', channel: 'App', date: '22 Oct 2026', status: 'Draft', icon: Wrench, c: '#F59E0B' },
]

// Upcoming scheduled sends
const scheduled = [
  { t: 'Diwali Celebration Event', when: '27 Oct 2026, 10:00 AM' },
  { t: 'Monthly Maintenance', when: '01 Nov 2026, 09:00 AM' },
]

// Latest sent messages
const recent = [
  { t: 'Water Supply Maintenance', when: '28 Oct 2026, 08:45 AM' },
  { t: 'Parking Rules Update', when: '25 Oct 2026, 06:15 PM' },
]

// Badge tones for channel and status
const channelTone: Record<Channel, 'blue' | 'purple' | 'green'> = { App: 'blue', Email: 'purple', SMS: 'green' }
const statusTone: Record<CStatus, 'green' | 'orange' | 'gray'> = { Sent: 'green', Scheduled: 'orange', Draft: 'gray' }

const tabs = ['All', 'Residents', 'Owners', 'Staff'] as const
type Tab = (typeof tabs)[number]

// Convert the modal's audience into the table's Group
const audienceToGroup = (a: string): Group =>
  a === 'Owners only' ? 'Owners' : a === 'Committee members' ? 'Staff' : 'Residents'

// Build a plain-text preview from the HTML message
const stripHtml = (html: string) =>
  html.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim()

const fmtDate = (iso?: string) =>
  (iso ? new Date(iso) : new Date()).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })

// Shared table + form field styles
const th = 'bg-white/[0.04] px-2 py-2 font-medium first:rounded-l-md last:rounded-r-md'
const td = 'border-t border-[#272D39] px-2 py-2.5'
const field =
  'w-full appearance-none rounded-lg border border-[#272D39] bg-[#10131A] px-3 py-2 text-xs text-slate-200 outline-none placeholder:text-slate-500 focus:border-[#A29CFF]/60'

/* ---------- Page ---------- */
export default function CommunicationPage() {
  // List + filter state
  const [items, setItems] = useState(initial)
  const [tab, setTab] = useState<Tab>('All')
  const [q, setQ] = useState('')
  const [showFilter, setShowFilter] = useState(false)
  const [status, setStatus] = useState('All')

  // Modal state
  const [showCommModal, setShowCommModal] = useState(false)

  // Add the new message from the modal to the table
  function handleSave(c: CommunicationPayload) {
    const plain = stripHtml(c.message)
    const newMsg: Msg = {
      id: c.id,
      subject: c.subject,
      preview: plain ? (plain.length > 40 ? `${plain.slice(0, 40)}...` : plain) : 'No message content',
      audience: c.audience,
      group: audienceToGroup(c.audience),
      channel: c.channels[0] ?? 'App',
      date: fmtDate(c.schedule === 'later' ? c.date : undefined),
      status: c.status,
      icon: Megaphone,
      c: '#8B5CF6',
    }
    setItems((prev) => [newMsg, ...prev])
  }

  // Apply tab + status + search filters
  const list = useMemo(() => {
    const s = q.trim().toLowerCase()
    return items.filter(
      (m) =>
        (tab === 'All' || m.group === tab) &&
        (status === 'All' || m.status === status) &&
        (!s || `${m.subject} ${m.audience} ${m.channel}`.toLowerCase().includes(s)),
    )
  }, [items, tab, q, status])

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-4">
      {/* Heading */}
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
        className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
      >
        <motion.div variants={item}>
          <h1 className="text-xl font-bold sm:text-2xl">Communication</h1>
          <p className="text-xs text-slate-400">Send announcements and messages to residents</p>
        </motion.div>

        {/* New button: opens the New Communication modal */}
        <motion.div variants={item}>
          <button
            type="button"
            onClick={() => setShowCommModal(true)}
            className="flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-linear-to-r from-[#6C63FF] to-[#4DA3FF] px-4 py-2.5 text-xs font-semibold text-white transition hover:opacity-90 active:scale-95"
          >
            <Plus className="h-3.5 w-3.5" /> New Communication
          </button>
        </motion.div>
      </motion.div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        {/* Left: tabs + search + table */}
        <div className="flex flex-col gap-3 xl:col-span-2">
          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={VIEWPORT}
            className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between"
          >
            {/* Group tabs */}
            <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {tabs.map((t) => (
                <motion.button
                  key={t}
                  variants={item}
                  type="button"
                  onClick={() => setTab(t)}
                  className={`shrink-0 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-[11px] transition-colors ${
                    tab === t
                      ? 'border-transparent bg-gradient-to-r from-[#6C63FF] to-[#4DA3FF] font-semibold text-white' // Active tab: Figma gradient
                      : 'border-[#272D39] bg-[#10131A] text-slate-400 hover:bg-white/5'
                  }`}
                >
                  {t}
                </motion.button>
              ))}
            </div>

            {/* Search + filter toggle */}
            <motion.div variants={item} className="flex items-center gap-2">
              <div className="relative flex-1 lg:w-64 lg:flex-none">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search communications..."
                  className={`${field} pl-9`}
                />
              </div>
              <button
                type="button"
                onClick={() => setShowFilter((v) => !v)}
                aria-label="Filters"
                aria-pressed={showFilter}
                className={`flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-lg border text-slate-300 hover:bg-white/5 ${
                  showFilter ? 'border-[#6C63FF] text-[#A29CFF]' : 'border-[#272D39]' // Active filter border: Figma purple
                }`}
              >
                <SlidersHorizontal className="h-4 w-4" />
              </button>
            </motion.div>
          </motion.div>

          {/* Status filter (shown when the filter button is active) */}
          {showFilter && (
            <div className="relative max-w-xs">
              <select value={status} onChange={(e) => setStatus(e.target.value)} className={`${field} pr-8`}>
                <option value="All">Status: All</option>
                <option value="Sent">Sent</option>
                <option value="Scheduled">Scheduled</option>
                <option value="Draft">Draft</option>
              </select>
              <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
            </div>
          )}

          {/* Communications table */}
          <motion.div
            variants={item}
            initial="hidden"
            whileInView="show"
            viewport={VIEWPORT}
          >
            <Card title="Communications" sub={`${list.length} messages`}>
              {/* Scrollbar hidden, but horizontal scrolling still works */}
              <div className="overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                <table className="w-full min-w-[680px] text-left text-[11px]">
                  <thead className="text-slate-400">
                    <tr>
                      <th className={th}>Subject</th>
                      <th className={th}>Audience</th>
                      <th className={th}>Channel</th>
                      <th className={th}>Date</th>
                      <th className={th}>Status</th>
                      <th className={`${th} text-right`}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {list.map((m) => {
                      const Icon = m.icon
                      return (
                        <tr key={m.id} className="hover:bg-white/[0.02]">
                          <td className={td}>
                            <span className="flex items-center gap-3">
                              <span
                                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                                style={{ background: `${m.c}26`, color: m.c }}
                              >
                                <Icon className="h-4 w-4" />
                              </span>
                              <span className="min-w-0">
                                <span className="block truncate font-semibold">{m.subject}</span>
                                <span className="block max-w-[200px] truncate text-[10px] text-slate-400">{m.preview}</span>
                              </span>
                            </span>
                          </td>
                          <td className={`${td} text-slate-300`}>{m.audience}</td>
                          <td className={td}><Badge tone={channelTone[m.channel]}>{m.channel}</Badge></td>
                          <td className={`${td} text-slate-400`}>{m.date}</td>
                          <td className={td}><Badge tone={statusTone[m.status]}>{m.status}</Badge></td>
                          <td className={`${td} text-right`}>
                            <span className="inline-flex items-center gap-0.5 text-slate-400">
                              <Link
                                href={`/secretary/communication/${m.id}`}
                                aria-label="View"
                                className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-white/5"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </Link>
                              <Link
                                href={`/secretary/communication/${m.id}/edit`}
                                aria-label="Edit"
                                className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-white/5"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </Link>
                              <button
                                type="button"
                                aria-label="Delete"
                                onClick={() => setItems((p) => p.filter((x) => x.id !== m.id))}
                                className="flex h-7 w-7 items-center justify-center rounded-md text-red-400 hover:bg-white/5"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </span>
                          </td>
                        </tr>
                      )
                    })}

                    {/* Empty state */}
                    {list.length === 0 && (
                      <tr>
                        <td colSpan={6} className={`${td} py-8 text-center text-slate-500`}>
                          No communications found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Right: Scheduled + Recent */}
        <motion.div
          variants={container}
          initial="hidden"
          whileInView="show"
          viewport={VIEWPORT}
          className="flex flex-col gap-4"
        >
          <motion.div variants={item}>
            <Card title="Scheduled Messages" sub="Upcoming sends">
              <div className="flex flex-col gap-3">
                {scheduled.map((s) => (
                  <div key={s.t} className="flex items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#F59E0B]/15 text-[#F59E0B]">
                      <CalendarClock className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold">{s.t}</p>
                      <p className="truncate text-[10px] text-slate-400">{s.when}</p>
                    </div>
                    <Badge tone="orange">Scheduled</Badge>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>

          <motion.div variants={item}>
            <Card
              title="Recent Messages" sub="Latest sent"
              action={<Link href="/secretary/communication/all" className="text-[11px] text-[#A29CFF] hover:underline">View All</Link>}
            >
              <div className="flex flex-col gap-3">
                {recent.map((r) => (
                  <div key={r.t} className="flex items-center gap-3">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#00C2B8]/15 text-[#00C2B8]">
                      <Eye className="h-4 w-4" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold">{r.t}</p>
                      <p className="truncate text-[10px] text-slate-400">{r.when}</p>
                    </div>
                    <Badge tone="green">Sent</Badge>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        </motion.div>
      </div>

      {/* New Communication modal */}
      <AddCommunicationModal
        open={showCommModal}
        onClose={() => setShowCommModal(false)}
        onSave={handleSave}
      />
    </div>
  )
}