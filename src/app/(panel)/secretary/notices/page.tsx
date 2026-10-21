'use client'

import { useMemo, useState } from 'react'
import { motion, type Variants } from 'framer-motion'
import { Plus, ChevronDown, ChevronLeft, ChevronRight, MoreVertical, RotateCcw } from 'lucide-react'
import { Card, Badge } from '@/Components/ui'
import AddNoticeModal from '@/Components/AddNoticeModal'

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
type Priority = 'High' | 'Medium' | 'Low'
type NStatus = 'Published' | 'Draft'

type Notice = {
  id: number
  title: string
  type: string
  priority: Priority
  status: NStatus
  date: string
}

// Notices list (initial data)
const initialNotices: Notice[] = [
  { id: 1, title: 'Water supply maintenance', type: 'Maintenance', priority: 'High', status: 'Published', date: '10 Oct 2026' },
  { id: 2, title: 'Society AGM notice', type: 'Meeting', priority: 'Medium', status: 'Published', date: '07 Oct 2026' },
  { id: 3, title: 'Parking rules update', type: 'General', priority: 'Medium', status: 'Published', date: '05 Oct 2026' },
  { id: 4, title: 'Festival celebration', type: 'Event', priority: 'Low', status: 'Published', date: '02 Oct 2026' },
  { id: 5, title: 'Security alert', type: 'Security', priority: 'High', status: 'Published', date: '28 Sep 2026' },
  { id: 6, title: 'Maintenance fee reminder', type: 'Payment', priority: 'Medium', status: 'Published', date: '25 Sep 2026' },
  { id: 7, title: 'Clubhouse booking system', type: 'Facility', priority: 'Low', status: 'Published', date: '22 Sep 2026' },
  { id: 8, title: 'Fire safety drill', type: 'Safety', priority: 'Medium', status: 'Published', date: '18 Sep 2026' },
]

// Badge tone for each priority
const priorityTone: Record<Priority, 'red' | 'orange' | 'green'> = {
  High: 'red',
  Medium: 'orange',
  Low: 'green',
}

const statuses: NStatus[] = ['Published', 'Draft']

// Shared table + form field styles
const th = 'bg-white/[0.04] px-2 py-2 font-medium first:rounded-l-md last:rounded-r-md'
const td = 'border-t border-[#272D39] px-2 py-2.5'
const field =
  'w-full appearance-none rounded-lg border border-[#272D39] bg-[#10131A] px-3 py-2 pr-8 text-xs text-slate-200 outline-none focus:border-[#A29CFF]/60'

/* ---------- Page ---------- */
export default function NoticesPage() {
  // Notices data + modal state
  const [items, setItems] = useState<Notice[]>(initialNotices)
  const [showNoticeModal, setShowNoticeModal] = useState(false)

  // Filter state
  const [type, setType] = useState('All')
  const [status, setStatus] = useState('All')

  // Type dropdown options (auto-updates when a new notice type is added)
  const types = useMemo(() => Array.from(new Set(items.map((n) => n.type))), [items])

  // Apply type + status filters
  const list = useMemo(
    () =>
      items.filter(
        (n) => (type === 'All' || n.type === type) && (status === 'All' || n.status === status),
      ),
    [items, type, status],
  )

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
          <h1 className="text-xl font-bold sm:text-2xl">Notices</h1>
          <p className="text-xs text-slate-400">Manage and share important updates</p>
        </motion.div>

        {/* Create button: opens the Create Notice modal */}
        <motion.div variants={item}>
          <button
            type="button"
            onClick={() => setShowNoticeModal(true)}
            className="flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-linear-to-r from-[#6C63FF] to-[#4DA3FF] px-4 py-2.5 text-xs font-semibold text-white transition hover:opacity-90 active:scale-95"
          >
            <Plus className="h-3.5 w-3.5" /> Create Notice
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
        {/* Type select */}
        <div className="relative">
          <select value={type} onChange={(e) => setType(e.target.value)} className={field}>
            <option value="All">All Types</option>
            {types.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
        </div>

        {/* Status select */}
        <div className="relative">
          <select value={status} onChange={(e) => setStatus(e.target.value)} className={field}>
            <option value="All">All Status</option>
            {statuses.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
        </div>

        {/* Reset all filters */}
        <button
          type="button"
          onClick={() => { setType('All'); setStatus('All') }}
          className="flex items-center justify-center gap-2 rounded-lg border border-[#272D39] px-4 py-2 text-xs text-slate-300 hover:bg-white/5 min-[480px]:col-span-2 lg:col-span-1"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Reset
        </button>
      </motion.div>

      {/* Notices table */}
      <motion.div
        variants={item}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
      >
        <Card title="All Notices" sub={`${list.length} notices`}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left text-[11px]">
              <thead className="text-slate-400">
                <tr>
                  <th className={th}>Title</th>
                  <th className={th}>Type</th>
                  <th className={th}>Priority</th>
                  <th className={th}>Status</th>
                  <th className={th}>Date</th>
                  <th className={`${th} text-right`}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.map((n) => (
                  <tr key={n.id} className="hover:bg-white/[0.02]">
                    <td className={`${td} font-medium`}>{n.title}</td>
                    <td className={`${td} text-slate-400`}>{n.type}</td>
                    <td className={td}><Badge tone={priorityTone[n.priority]}>{n.priority}</Badge></td>
                    <td className={td}><Badge tone={n.status === 'Published' ? 'green' : 'gray'}>{n.status}</Badge></td>
                    <td className={`${td} text-slate-400`}>{n.date}</td>
                    <td className={`${td} text-right`}>
                      <button
                        type="button"
                        aria-label={`Actions for ${n.title}`}
                        className="inline-flex h-7 w-7 items-center justify-center rounded-md text-slate-400 hover:bg-white/5"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}

                {/* Empty state */}
                {list.length === 0 && (
                  <tr>
                    <td colSpan={6} className={`${td} py-8 text-center text-slate-500`}>
                      No notices found
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

      {/* Create Notice modal */}
      <AddNoticeModal
        open={showNoticeModal}
        onClose={() => setShowNoticeModal(false)}
        onSave={(n) =>
          setItems((prev) => [
            {
              id: n.id,
              title: n.title,
              type: n.type,
              priority: n.priority,
              status: n.status as NStatus,
              date: new Date(n.publishDate).toLocaleDateString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              }),
            },
            ...prev,
          ])
        }
      />
    </div>
  )
}