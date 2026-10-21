'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, type Variants } from 'framer-motion'
import {
  Plus, ChevronLeft, ChevronRight, MapPin, Clock, CalendarDays, ListChecks, Pencil,
} from 'lucide-react'
import { Card, Badge } from '@/Components/ui'
import ScheduleMeetingModal, { type MeetingForm } from '@/Components/ScheduleMeetingModal'

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

const cellClass = 'h-full [&>*]:h-full'

/* ---------- Data (replace with API data later) ---------- */
type Status = 'Confirmed' | 'Scheduled' | 'Pending'

type Meeting = {
  id: number
  title: string
  year: number
  month: number // 0 = Jan ... 9 = Oct
  day: number
  label: string // "12 Oct 2026"
  start: string
  range: string
  place: string
  agenda: number
  status: Status
}

const initialMeetings: Meeting[] = [
  { id: 1, title: 'Committee Meeting', year: 2026, month: 9, day: 12, label: '12 Oct 2026', start: '06:00 PM', range: '06:00 PM - 07:30 PM', place: 'Clubhouse', agenda: 5, status: 'Confirmed' },
  { id: 2, title: 'AGM Meeting', year: 2026, month: 9, day: 25, label: '25 Oct 2026', start: '05:00 PM', range: '05:00 PM - 07:00 PM', place: 'Clubhouse', agenda: 8, status: 'Scheduled' },
  { id: 3, title: 'Emergency Meeting', year: 2026, month: 9, day: 30, label: '30 Oct 2026', start: '11:00 AM', range: '11:00 AM - 12:00 PM', place: 'Conference Room', agenda: 2, status: 'Pending' },
]

const tone: Record<Status, 'green' | 'blue' | 'orange'> = {
  Confirmed: 'green',
  Scheduled: 'blue',
  Pending: 'orange',
}

const dotColor: Record<Status, string> = {
  Confirmed: '#10B981',
  Scheduled: '#3B82F6',
  Pending: '#F59E0B',
}

const weekdays = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']
const monthName = (y: number, m: number) =>
  new Date(y, m, 1).toLocaleString('en-US', { month: 'long', year: 'numeric' })

/* ---------- Page ---------- */
export default function MeetingsPage() {
  const [meetings, setMeetings] = useState<Meeting[]>(initialMeetings)
  const [selectedId, setSelectedId] = useState(1)
  const [view, setView] = useState({ y: 2026, m: 9 })
  const [addOpen, setAddOpen] = useState(false)

  const selected = meetings.find((m) => m.id === selectedId) ?? meetings[0]

  // calendar grid
  const firstDay = new Date(view.y, view.m, 1).getDay()
  const daysInMonth = new Date(view.y, view.m + 1, 0).getDate()
  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ]

  const meetingOn = (d: number) =>
    meetings.find((m) => m.year === view.y && m.month === view.m && m.day === d)

  const shift = (delta: number) =>
    setView(({ y, m }) => {
      const d = new Date(y, m + delta, 1)
      return { y: d.getFullYear(), m: d.getMonth() }
    })

  const pick = (m: Meeting) => {
    setSelectedId(m.id)
    setView({ y: m.year, m: m.month })
  }

  // When a new meeting comes in from the modal, add it to the list + calendar
  function handleAdd(data: MeetingForm) {
    if (!data.date) return // can't show it on the calendar without a date
    const [y, mo, d] = data.date.split('-').map(Number)
    const dt = new Date(y, mo - 1, d)
    const status: Status =
      data.status === 'Confirmed' || data.status === 'Pending' ? data.status : 'Scheduled'

    const created: Meeting = {
      id: Date.now(),
      title: data.title || data.type || 'New Meeting',
      year: y,
      month: mo - 1,
      day: d,
      label: dt.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }),
      start: data.start || '--',
      range: data.start && data.end ? `${data.start} - ${data.end}` : data.start || '--',
      place: data.venue || 'TBD',
      agenda: data.agenda.trim() ? data.agenda.split('\n').filter(Boolean).length : 0,
      status,
    }
    setMeetings((p) => [...p, created])
    setSelectedId(created.id)
    setView({ y, m: mo - 1 })
  }

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
          <h1 className="text-xl font-bold sm:text-2xl">Meetings</h1>
          <p className="text-xs text-slate-400">Schedule and manage society meetings</p>
        </motion.div>

        {/* Schedule button: opens the drawer on click */}
        <motion.div variants={item}>
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-linear-to-r from-[#6C63FF] to-[#4DA3FF] px-4 py-2.5 text-xs font-semibold text-white transition hover:opacity-90 active:scale-95"
          >
            <Plus className="h-3.5 w-3.5" /> Schedule Meeting
          </button>
        </motion.div>
      </motion.div>

      {/* Calendar + Upcoming */}
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
        className="grid grid-cols-1 gap-4 lg:grid-cols-2"
      >
        <motion.div variants={item} className={cellClass}>
          <Card title={monthName(view.y, view.m)} sub="Tap a highlighted date to view meeting"
            action={
              <div className="flex items-center gap-1">
                <button
                  type="button" onClick={() => shift(-1)} aria-label="Previous month"
                  className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-[#272D39] text-slate-300 hover:bg-white/5"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button" onClick={() => shift(1)} aria-label="Next month"
                  className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-[#272D39] text-slate-300 hover:bg-white/5"
                >
                  <ChevronRight className="h-3.5 w-3.5" />
                </button>
              </div>
            }
          >
            <div className="grid grid-cols-7 gap-1 text-center">
              {weekdays.map((d) => (
                <span key={d} className="py-1.5 text-[10px] font-medium text-slate-500">{d}</span>
              ))}

              {cells.map((d, i) => {
                if (d === null) return <span key={`b${i}`} />
                const m = meetingOn(d)
                const isSel = m?.id === selected.id
                return (
                  <button
                    key={d}
                    type="button"
                    disabled={!m}
                    onClick={() => m && pick(m)}
                    className={`relative flex aspect-square items-center justify-center rounded-lg text-[11px] transition-colors ${
                      isSel
                        ? 'cursor-pointer bg-linear-to-br from-[#6C63FF] to-[#4DA3FF] font-bold text-white'
                        : m
                          ? 'cursor-pointer border border-[#272D39] bg-white/4 font-semibold text-white hover:bg-white/10'
                          : 'cursor-default text-slate-400'
                    }`}
                  >
                    {d}
                    {m && !isSel && (
                      <i className="absolute bottom-1 h-1 w-1 rounded-full" style={{ background: dotColor[m.status] }} />
                    )}
                  </button>
                )
              })}
            </div>
          </Card>
        </motion.div>

        <motion.div variants={item} className={cellClass}>
          <Card
            title="Upcoming Meetings" sub="Next scheduled meetings"
            action={<Link href="/secretary/meetings/all" className="text-[11px] text-[#A29CFF] hover:underline">View All</Link>}
          >
            <div className="flex flex-col gap-2">
              {meetings.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => pick(m)}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-colors ${
                    m.id === selected.id
                      ? 'border-[#6C63FF]/60 bg-[#6C63FF]/10'
                      : 'border-[#272D39] bg-white/3 hover:bg-white/5'
                  }`}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#8B5CF6]/15 text-[#8B5CF6]">
                    <CalendarDays className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-semibold">{m.title}</span>
                    <span className="block truncate text-[10px] text-slate-400">{m.label} • {m.start}</span>
                    <span className="flex items-center gap-1 truncate text-[10px] text-slate-400">
                      <MapPin className="h-3 w-3 shrink-0" /> {m.place}
                    </span>
                  </span>
                  <Badge tone={tone[m.status]}>{m.status}</Badge>
                </button>
              ))}
            </div>
          </Card>
        </motion.div>
      </motion.div>

      {/* Meeting Details */}
      <motion.div
        variants={item}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
      >
        <Card
          title="Meeting Details" sub="Selected meeting"
          action={<Link href="/secretary/meetings/all" className="text-[11px] text-[#A29CFF] hover:underline">View All</Link>}
        >
          <div className="flex items-center gap-3 border-b border-[#272D39] pb-3">
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#3B82F6]/15 text-[#3B82F6]">
              <CalendarDays className="h-5 w-5" />
            </span>
            <p className="min-w-0 truncate text-sm font-bold">{selected.title}</p>
          </div>

          <div className="grid grid-cols-1 gap-x-8 sm:grid-cols-2">
            {[
              ['Date & Time', `${selected.label} • ${selected.range}`, Clock],
              ['Location', selected.place, MapPin],
              ['Agenda', `${selected.agenda} items`, ListChecks],
            ].map(([k, v, Icon]) => {
              const I = Icon as typeof Clock
              return (
                <div key={k as string} className="flex items-center justify-between gap-3 border-b border-[#272D39] py-2.5 text-[11px]">
                  <span className="flex items-center gap-2 text-slate-400">
                    <I className="h-3.5 w-3.5" /> {k as string}
                  </span>
                  <span className="min-w-0 break-words text-right font-medium">{v as string}</span>
                </div>
              )
            })}

            <div className="flex items-center justify-between gap-3 border-b border-[#272D39] py-2.5 text-[11px]">
              <span className="text-slate-400">Status</span>
              <Badge tone={tone[selected.status]}>{selected.status}</Badge>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-2 min-[480px]:flex-row min-[480px]:items-center min-[480px]:justify-between">
            <Link
              href={`/secretary/meetings/${selected.id}`}
              className="flex items-center justify-center rounded-lg bg-linear-to-r from-[#6C63FF] to-[#4DA3FF] px-5 py-2.5 text-xs font-semibold text-white transition-opacity hover:opacity-90"
            >
              View Details
            </Link>
            <Link
              href={`/secretary/meetings/${selected.id}/edit`}
              className="flex items-center justify-center gap-2 rounded-lg border border-[#272D39] px-4 py-2.5 text-xs text-slate-300 hover:bg-white/5"
            >
              <Pencil className="h-3.5 w-3.5" /> Edit
            </Link>
          </div>
        </Card>
      </motion.div>

      {/* Schedule Meeting drawer */}
      <ScheduleMeetingModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSubmit={handleAdd}
      />
    </div>
  )
}