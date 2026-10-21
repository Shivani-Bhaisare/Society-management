'use client'

import { useMemo, useState } from 'react'
import Image from 'next/image'
import { motion, type Variants } from 'framer-motion'
import {
  Search, Plus, Clock, Users, CalendarCheck,
  Waves, Dumbbell, Building2, Trophy, TreePine, Car, LayoutGrid,
  type LucideIcon,
} from 'lucide-react'
import { Badge } from '@/Components/ui'
import AddFacilityModal, { type FacilityPayload } from '@/Components/AddFacilityModal'

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

/* ---------- Types ---------- */
type Status = 'Open' | 'Available' | 'In Use' | 'Maintenance' | 'Unavailable'

type Facility = {
  id: number
  name: string
  status: Status
  timing: string
  capacity: number | null
  booking: boolean
  icon: LucideIcon
  c: string
  img: string
}

const tabs = ['All', 'Available', 'In Use', 'Maintenance'] as const
type Tab = (typeof tabs)[number]

/* ---------- Data (replace with API later) ---------- */
const initialFacilities: Facility[] = [
  { id: 1, name: 'Swimming Pool', status: 'Open', timing: '6 AM - 10 PM', capacity: 40, booking: true, icon: Waves, c: '#3B82F6', img: '/img31.jpg' },
  { id: 2, name: 'Gym', status: 'Open', timing: '5 AM - 11 PM', capacity: 25, booking: true, icon: Dumbbell, c: '#8B5CF6', img: '/img32.jpg' },
  { id: 3, name: 'Club House', status: 'Available', timing: '8 AM - 10 PM', capacity: 100, booking: true, icon: Building2, c: '#F59E0B', img: '/img33.jpg' },
  { id: 4, name: 'Community Hall', status: 'Available', timing: '9 AM - 11 PM', capacity: 150, booking: true, icon: Users, c: '#00C2B8', img: '/img34.jpg' },
  // The 2 samples below keep the "In Use" and "Maintenance" tabs from being empty. Delete them if not needed.
  { id: 5, name: 'Tennis Court', status: 'In Use', timing: '6 AM - 9 PM', capacity: 8, booking: true, icon: Trophy, c: '#EF4444', img: '/img35.jpg' },
  { id: 6, name: 'Terrace Garden', status: 'Maintenance', timing: '7 AM - 8 PM', capacity: 60, booking: false, icon: TreePine, c: '#10B981', img: '/img36.jpg' },
]

const statusTone: Record<Status, 'green' | 'blue' | 'orange' | 'gray'> = {
  Open: 'green',
  Available: 'green',
  'In Use': 'blue',
  Maintenance: 'orange',
  Unavailable: 'gray',
}

// Icon and colour based on the modal's category
const categoryStyle: Record<string, { icon: LucideIcon; c: string }> = {
  Sports: { icon: Trophy, c: '#EF4444' },
  Recreation: { icon: Building2, c: '#F59E0B' },
  Fitness: { icon: Dumbbell, c: '#8B5CF6' },
  'Event Space': { icon: Users, c: '#00C2B8' },
  'Kids Zone': { icon: TreePine, c: '#10B981' },
  Parking: { icon: Car, c: '#3B82F6' },
  Other: { icon: LayoutGrid, c: '#A29CFF' },
}

// "06:00 AM" -> "6 AM", "06:30 PM" -> "6:30 PM"
const fmtTime = (t: string) => {
  const [hm, ap] = t.split(' ')
  const [h, m] = hm.split(':')
  return `${parseInt(h, 10)}${m === '00' ? '' : `:${m}`} ${ap}`
}

function matchTab(status: Status, tab: Tab) {
  if (tab === 'All') return true
  if (tab === 'Available') return status === 'Open' || status === 'Available'
  return status === tab
}

/* ---------- Page ---------- */
export default function FacilitiesPage() {
  // Facilities data + modal state
  const [items, setItems] = useState<Facility[]>(initialFacilities)
  const [showFacilityModal, setShowFacilityModal] = useState(false)

  const [tab, setTab] = useState<Tab>('All')
  const [q, setQ] = useState('')

  // Add the new facility card from the modal
  function handleSave(f: FacilityPayload) {
    const style = categoryStyle[f.category] ?? categoryStyle.Other
    const status: Status = f.maintenance.closed
      ? 'Maintenance'
      : f.available
      ? 'Available'
      : 'Unavailable'

    const newFacility: Facility = {
      id: f.id,
      name: f.name,
      status,
      timing: `${fmtTime(f.openingTime)} - ${fmtTime(f.closingTime)}`,
      capacity: f.capacity ? Number(f.capacity) : null,
      booking: f.bookingRequired,
      icon: style.icon,
      c: style.c,
      // Local URL of the uploaded image (use the server URL once the backend is ready)
      img: f.image ? URL.createObjectURL(f.image) : '',
    }
    setItems((prev) => [newFacility, ...prev])
  }

  const list = useMemo(() => {
    const term = q.trim().toLowerCase()
    return items.filter((f) => matchTab(f.status, tab) && f.name.toLowerCase().includes(term))
  }, [items, tab, q])

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-4">
      {/* Header */}
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
        className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
      >
        <motion.div variants={item}>
          <h1 className="text-xl font-bold sm:text-2xl">Facilities</h1>
          <p className="text-xs text-slate-400">Manage society amenities and facilities</p>
        </motion.div>

        <motion.div variants={item} className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
            <input
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search facilities..."
              className="w-full rounded-lg border border-[#272D39] bg-[#10131A] py-2 pl-9 pr-3 text-xs text-slate-200 outline-none placeholder:text-slate-500 focus:border-[#A29CFF]/60"
            />
          </div>
          {/* Primary button: opens the Add Facility modal */}
          <button
            type="button"
            onClick={() => setShowFacilityModal(true)}
            className="flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-linear-to-r from-[#6C63FF] to-[#4DA3FF] px-4 py-2.5 text-xs font-semibold text-white transition hover:opacity-90 active:scale-95"
          >
            <Plus className="h-3.5 w-3.5" /> Add Facility
          </button>
        </motion.div>
      </motion.div>

      {/* Tabs */}
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
        className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {tabs.map((t) => (
          <motion.button
            key={t}
            variants={item}
            type="button"
            onClick={() => setTab(t)}
            className={`shrink-0 whitespace-nowrap rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${
              tab === t
                ? 'border-transparent bg-gradient-to-r from-[#6C63FF] to-[#4DA3FF] text-white'
                : 'border-[#272D39] bg-[#10131A] text-slate-300 hover:bg-white/5'
            }`}
          >
            {t}
          </motion.button>
        ))}
      </motion.div>

      {/* Cards */}
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
        className="grid grid-cols-1 gap-4 min-[560px]:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4"
      >
        {list.map((f) => {
          const Icon = f.icon
          return (
            <motion.div
              key={f.id}
              variants={item}
              className="overflow-hidden rounded-xl border border-[#272D39] bg-[#10131A]"
            >
              {/* IMAGE: facility photo (icon placeholder if there is no image) */}
              <div className="relative h-36 w-full overflow-hidden border-b border-[#272D39] sm:h-40">
                {f.img ? (
                  <Image
                    src={f.img}
                    alt={f.name}
                    fill
                    unoptimized={f.img.startsWith('blob:')}
                    sizes="(min-width: 1536px) 25vw, (min-width: 1280px) 33vw, (min-width: 560px) 50vw, 100vw"
                    className="object-cover"
                  />
                ) : (
                  <div
                    className="flex h-full w-full items-center justify-center"
                    style={{ background: `${f.c}1A`, color: f.c }}
                  >
                    <Icon className="h-10 w-10" />
                  </div>
                )}
              </div>

              <div className="p-4">
                {/* Name + status */}
                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                      style={{ background: `${f.c}26`, color: f.c }}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="truncate text-xs font-semibold">{f.name}</span>
                  </div>
                  <Badge tone={statusTone[f.status]}>{f.status}</Badge>
                </div>

                {/* Details */}
                <ul className="mt-3 flex flex-col gap-1.5 text-[10px] text-slate-400">
                  <li className="flex items-center gap-2">
                    <Clock className="h-3.5 w-3.5 shrink-0 text-slate-500" /> {f.timing}
                  </li>
                  <li className="flex items-center gap-2">
                    <Users className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                    Capacity: {f.capacity ?? '—'}
                  </li>
                  <li className="flex items-center gap-2">
                    <CalendarCheck className="h-3.5 w-3.5 shrink-0 text-slate-500" />
                    {f.booking ? 'Booking Required' : 'No Booking Needed'}
                  </li>
                </ul>

                {/* Actions */}
                <div className="mt-4 grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    className="rounded-md border border-[#272D39] bg-white/[0.03] py-1.5 text-[10px] font-medium text-slate-300 hover:bg-white/5"
                  >
                    View
                  </button>
                  <button
                    type="button"
                    className="rounded-md border border-[#272D39] bg-white/[0.03] py-1.5 text-[10px] font-medium text-slate-300 hover:bg-white/5"
                  >
                    Manage
                  </button>
                  <button
                    type="button"
                    disabled={f.status === 'Maintenance' || f.status === 'Unavailable'}
                    className="rounded-md bg-gradient-to-r from-[#6C63FF] to-[#4DA3FF] py-1.5 text-[10px] font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Book
                  </button>
                </div>
              </div>
            </motion.div>
          )
        })}

        {/* Empty state */}
        {list.length === 0 && (
          <div className="col-span-full rounded-xl border border-dashed border-[#272D39] p-10 text-center text-xs text-slate-400">
            No facilities found.
          </div>
        )}
      </motion.div>

      {/* Add Facility modal */}
      <AddFacilityModal
        open={showFacilityModal}
        onClose={() => setShowFacilityModal(false)}
        onSave={handleSave}
      />
    </div>
  )
}