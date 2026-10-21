'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { motion, type Variants } from 'framer-motion'
import { Plus, ChevronDown, ChevronLeft, ChevronRight, MoreHorizontal, RotateCcw } from 'lucide-react'
import { Card, Badge } from '@/Components/ui'
import AddAgendaModal, { type AgendaPayload } from '@/Components/AddAgendaModal'

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
type Status = 'Upcoming' | 'In Progress' | 'Completed'

type AgendaItem = { id: number; title: string; meeting: string; status: Status }

// Initial agenda items
const initialAgenda: AgendaItem[] = [
  { id: 1, title: 'Maintenance work approval', meeting: '12 Oct 2026', status: 'Upcoming' },
  { id: 2, title: 'Budget allocation for 2026', meeting: '25 Oct 2026', status: 'Upcoming' },
  { id: 3, title: 'New parking policy', meeting: '25 Oct 2026', status: 'In Progress' },
  { id: 4, title: 'Clubhouse renovation plan', meeting: '30 Oct 2026', status: 'In Progress' },
  { id: 5, title: 'Security staff enhancement', meeting: '30 Oct 2026', status: 'Completed' },
  { id: 6, title: 'Festival celebration plan', meeting: '15 Nov 2026', status: 'Completed' },
  { id: 7, title: 'Waste management update', meeting: '15 Nov 2026', status: 'Completed' },
  { id: 8, title: 'Water supply maintenance', meeting: '20 Nov 2026', status: 'Completed' },
]

// Badge tone for each status
const tone: Record<Status, 'blue' | 'orange' | 'green'> = {
  Upcoming: 'blue',
  'In Progress': 'orange',
  Completed: 'green',
}

const tabs: ('All' | Status)[] = ['All', 'Upcoming', 'In Progress', 'Completed']

// "2026-10-13" -> "13 Oct 2026"
const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

// Shared table + form field styles
const th = 'bg-white/[0.04] px-2 py-2 font-medium first:rounded-l-md last:rounded-r-md'
const td = 'border-t border-[#272D39] px-2 py-2.5'
const field =
  'w-full appearance-none rounded-lg border border-[#272D39] bg-[#10131A] px-3 py-2 pr-8 text-xs text-slate-200 outline-none focus:border-[#A29CFF]/60'

/* ---------- Page ---------- */
export default function AgendaPage() {
  const [agenda, setAgenda] = useState<AgendaItem[]>(initialAgenda)
  const [open, setOpen] = useState(false) // modal open / close
  const [meeting, setMeeting] = useState('All')
  const [status, setStatus] = useState<'All' | Status>('All')

  // Meeting filter options (updates when new agenda is added)
  const meetingOptions = useMemo(
    () => Array.from(new Set(agenda.map((a) => a.meeting))),
    [agenda],
  )

  // Tab counts (based on the meeting filter)
  const base = useMemo(
    () => agenda.filter((a) => meeting === 'All' || a.meeting === meeting),
    [agenda, meeting],
  )
  const count = (s: 'All' | Status) => (s === 'All' ? base.length : base.filter((a) => a.status === s).length)

  const list = useMemo(
    () => base.filter((a) => status === 'All' || a.status === status),
    [base, status],
  )

  // Modal Save -> add new row at the top of the table
  const handleSave = (data: AgendaPayload) => {
    setAgenda((prev) => [
      {
        id: data.id,
        title: data.title,
        meeting: formatDate(data.date),
        status: data.status as Status,
      },
      ...prev,
    ])
    // TODO: add the API call here (send the file with FormData)
  }

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
          <h1 className="text-xl font-bold sm:text-2xl">Agenda</h1>
          <p className="text-xs text-slate-400">Manage meeting agenda items</p>
        </motion.div>

        {/* Add button: opens the modal (Link removed) */}
        <motion.div variants={item}>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-linear-to-r from-[#6C63FF] to-[#4DA3FF] px-4 py-2.5 text-xs font-semibold text-white transition hover:opacity-90 active:scale-95"
          >
            <Plus className="h-3.5 w-3.5" /> Add Agenda
          </button>
        </motion.div>
      </motion.div>

      {/* Filters */}
      <motion.div
        variants={item}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
        className="grid grid-cols-1 gap-2 rounded-xl border border-[#272D39] bg-[#10131A] p-3 min-[480px]:grid-cols-2 lg:grid-cols-[1fr_1fr_auto]"
      >
        {/* Meeting select */}
        <div className="relative">
          <select value={meeting} onChange={(e) => setMeeting(e.target.value)} className={field}>
            <option value="All">All Meetings</option>
            {meetingOptions.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
        </div>

        {/* Status select */}
        <div className="relative">
          <select value={status} onChange={(e) => setStatus(e.target.value as 'All' | Status)} className={field}>
            <option value="All">All Status</option>
            {tabs.slice(1).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
        </div>

        {/* Reset all filters */}
        <button
          type="button"
          onClick={() => { setMeeting('All'); setStatus('All') }}
          className="flex items-center justify-center gap-2 rounded-lg border border-[#272D39] px-4 py-2 text-xs text-slate-300 hover:bg-white/5 min-[480px]:col-span-2 lg:col-span-1"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Reset
        </button>
      </motion.div>

      {/* Status tabs */}
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
        className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {tabs.map((t) => {
          const active = status === t
          return (
            <motion.button
              key={t}
              variants={item}
              type="button"
              onClick={() => setStatus(t)}
              className={`shrink-0 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-[11px] transition-colors ${
                active
                  ? 'border-transparent bg-gradient-to-r from-[#6C63FF] to-[#4DA3FF] font-semibold text-white' // Active tab: Figma gradient
                  : 'border-[#272D39] bg-[#10131A] text-slate-400 hover:bg-white/5'
              }`}
            >
              {t} ({count(t)})
            </motion.button>
          )
        })}
      </motion.div>

      {/* Agenda table */}
      <motion.div
        variants={item}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
      >
        <Card title="Agenda Items" sub={`${list.length} items`}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[580px] text-left text-[11px]">
              <thead className="text-slate-400">
                <tr>
                  <th className={`${th} w-10`}>#</th>
                  <th className={th}>Title</th>
                  <th className={th}>Meeting</th>
                  <th className={th}>Status</th>
                  <th className={`${th} text-right`}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.map((a, i) => (
                  <tr key={a.id} className="hover:bg-white/[0.02]">
                    <td className={`${td} text-slate-400`}>{i + 1}</td>
                    <td className={`${td} font-medium`}>{a.title}</td>
                    <td className={`${td} text-slate-400`}>{a.meeting}</td>
                    <td className={td}><Badge tone={tone[a.status]}>{a.status}</Badge></td>
                    <td className={`${td} text-right`}>
                      <span className="inline-flex items-center gap-1">
                        <Link
                          href={`/secretary/agenda/${a.id}`}
                          className="rounded-md border border-[#272D39] px-2.5 py-1 text-[10px] text-slate-300 hover:bg-white/5"
                        >
                          View
                        </Link>
                        <button
                          type="button"
                          aria-label={`More actions for ${a.title}`}
                          className="inline-flex h-6 w-6 items-center justify-center rounded-md text-slate-400 hover:bg-white/5"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </span>
                    </td>
                  </tr>
                ))}

                {/* Empty state */}
                {list.length === 0 && (
                  <tr>
                    <td colSpan={5} className={`${td} py-8 text-center text-slate-500`}>
                      No agenda items found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-4 flex flex-col items-center justify-between gap-3 text-[11px] text-slate-400 sm:flex-row">
            <span>Showing {list.length ? `1-${list.length}` : 0} of {list.length}</span>
            <div className="flex items-center gap-1">
              <button type="button" aria-label="Previous page" className="flex h-7 w-7 items-center justify-center rounded-md border border-[#272D39] hover:bg-white/5">
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              {/* Active page: Figma gradient */}
              <button type="button" className="h-7 w-7 rounded-md border border-transparent bg-gradient-to-br from-[#6C63FF] to-[#4DA3FF] text-[11px] font-semibold text-white">
                1
              </button>
              <button type="button" aria-label="Next page" className="flex h-7 w-7 items-center justify-center rounded-md border border-[#272D39] hover:bg-white/5">
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Add Agenda Modal: kept outside the motion.div (so the fixed position works correctly) */}
      <AddAgendaModal
        open={open}
        onClose={() => setOpen(false)}
        onSave={handleSave}
        meetings={meetingOptions}
      />
    </div>
  )
}