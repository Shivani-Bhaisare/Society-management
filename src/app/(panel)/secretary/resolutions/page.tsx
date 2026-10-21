'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, type Variants } from 'framer-motion'
import { Plus, ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react'
import { Card, Badge } from '@/Components/ui'
import AddResolutionModal, { type ResolutionPayload } from '@/Components/AddResolutionModal'

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
type VStatus = 'In Progress' | 'Pending' | 'Approved' | 'Rejected'
type Tab = 'All' | 'Pending' | 'Approved' | 'Rejected'

type Resolution = { id: number; title: string; meeting: string; status: VStatus; pct: number }

// Initial resolutions list
const initialResolutions: Resolution[] = [
  { id: 1, title: 'Maintenance fund increase', meeting: '12 Oct 2026', status: 'In Progress', pct: 45 },
  { id: 2, title: 'Parking area renovation', meeting: '25 Oct 2026', status: 'In Progress', pct: 62 },
  { id: 3, title: 'New security vendor', meeting: '25 Oct 2026', status: 'Pending', pct: 0 },
  { id: 4, title: 'Clubhouse usage policy', meeting: '30 Oct 2026', status: 'Approved', pct: 100 },
  { id: 5, title: 'Pet policy update', meeting: '30 Oct 2026', status: 'Approved', pct: 100 },
  { id: 6, title: 'Electricity bill sharing', meeting: '15 Nov 2026', status: 'Rejected', pct: 12 },
]

// Badge tone for each voting status
const tone: Record<VStatus, 'orange' | 'gray' | 'green' | 'red'> = {
  'In Progress': 'orange',
  Pending: 'gray',
  Approved: 'green',
  Rejected: 'red',
}

// Percentage text colour for each voting status
const pctColor: Record<VStatus, string> = {
  'In Progress': 'text-orange-400',
  Pending: 'text-slate-400',
  Approved: 'text-emerald-400',
  Rejected: 'text-red-400',
}

const tabs: Tab[] = ['All', 'Pending', 'Approved', 'Rejected']

// The "Pending" tab includes both In Progress and Pending items
const matches = (s: VStatus, t: Tab) =>
  t === 'All' ||
  (t === 'Pending' ? s === 'Pending' || s === 'In Progress' : s === t)

// "2026-10-13" -> "13 Oct 2026"
const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })

// Shared table header / cell styles
const th = 'bg-white/[0.04] px-2 py-2 font-medium first:rounded-l-md last:rounded-r-md'
const td = 'border-t border-[#272D39] px-2 py-2.5'

/* ---------- Page ---------- */
export default function ResolutionsPage() {
  const [resolutions, setResolutions] = useState<Resolution[]>(initialResolutions)
  const [open, setOpen] = useState(false) // modal open / close
  const [tab, setTab] = useState<Tab>('All')

  const count = (t: Tab) => resolutions.filter((r) => matches(r.status, t)).length
  const list = resolutions.filter((r) => matches(r.status, tab))

  // Modal Save -> new row on top, starts with Pending status and 0%
  const handleSave = (p: ResolutionPayload) => {
    setResolutions((prev) => [
      { id: p.id, title: p.title, meeting: formatDate(p.date), status: 'Pending', pct: 0 },
      ...prev,
    ])
    // TODO: add the API call here (send the files with FormData)
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
          <h1 className="text-xl font-bold sm:text-2xl">Resolutions</h1>
          <p className="text-xs text-slate-400">Track and manage society resolutions</p>
        </motion.div>

        {/* Add button: Link removed and replaced with a button, now opens the modal */}
        <motion.div variants={item}>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-linear-to-r from-[#6C63FF] to-[#4DA3FF] px-4 py-2.5 text-xs font-semibold text-white transition hover:opacity-90 active:scale-95"
          >
            <Plus className="h-3.5 w-3.5" /> Add Resolution
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
        {tabs.map((t) => {
          const active = tab === t
          return (
            <motion.button
              key={t}
              variants={item}
              type="button"
              onClick={() => setTab(t)}
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

      {/* Table */}
      <motion.div
        variants={item}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
      >
        <Card title="Resolution List" sub={`${list.length} resolutions`}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[620px] text-left text-[11px]">
              <thead className="text-slate-400">
                <tr>
                  <th className={`${th} w-10`}>#</th>
                  <th className={th}>Title</th>
                  <th className={th}>Meeting</th>
                  <th className={th}>Voting Status</th>
                  <th className={`${th} text-right`}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.map((r, i) => (
                  <tr key={r.id} className="hover:bg-white/[0.02]">
                    <td className={`${td} text-slate-400`}>{i + 1}</td>
                    <td className={`${td} font-medium`}>{r.title}</td>
                    <td className={`${td} text-slate-400`}>{r.meeting}</td>
                    <td className={td}>
                      <div className="flex flex-col items-start gap-1">
                        <Badge tone={tone[r.status]}>{r.status}</Badge>
                        <span className={`text-[10px] ${pctColor[r.status]}`}>{r.pct}%</span>
                      </div>
                    </td>
                    <td className={`${td} text-right`}>
                      <span className="inline-flex items-center gap-1">
                        <Link
                          href={`/secretary/resolutions/${r.id}`}
                          className="rounded-md border border-[#272D39] px-2.5 py-1 text-[10px] text-slate-300 hover:bg-white/5"
                        >
                          View
                        </Link>
                        <button
                          type="button"
                          aria-label={`More actions for ${r.title}`}
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
                      No resolutions found
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

      {/* Add Resolution Modal (uses a portal, so it is safe to keep here) */}
      <AddResolutionModal
        open={open}
        onClose={() => setOpen(false)}
        onSave={handleSave}
      />
    </div>
  )
}