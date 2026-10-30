'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AnimatePresence, motion, type Variants } from 'framer-motion'
import { Plus, Vote, Users, Percent, X } from 'lucide-react'
import { Card, Badge } from '@/Components/ui'
import AddPollModal from '@/Components/AddPollModal'

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
const TOTAL_VOTERS = 142

// Top summary cards
const stats = [
  { label: 'Active Polls', value: '3', sub: 'Open for voting', subC: 'text-slate-400', icon: Vote, c: '#3B82F6' },
  { label: 'Total Voters', value: String(TOTAL_VOTERS), sub: 'Eligible residents', subC: 'text-slate-400', icon: Users, c: '#8B5CF6' },
  { label: 'Participation Rate', value: '76%', sub: 'Across active polls', subC: 'text-emerald-400', icon: Percent, c: '#00C2B8' },
]

// Polls open for voting
const activePolls = [
  { id: 1, title: 'Maintenance Fund Increase', sub: 'Budget approval for 2026 • Closes in 2 days', voted: 108 },
  { id: 2, title: 'Clubhouse Renovation', sub: 'Facility upgrade • Closes in 5 days', voted: 89 },
  { id: 3, title: 'Parking Policy Change', sub: 'New parking rules • Closes in 8 days', voted: 64 },
]

// Placeholder data - replace with API data later
const pastPolls = [
  { id: 11, title: 'Security Vendor Selection', sub: 'Closed on 28 Sep 2026', voted: 121, result: 'Passed' },
  { id: 12, title: 'Pet Policy Update', sub: 'Closed on 20 Sep 2026', voted: 110, result: 'Passed' },
  { id: 13, title: 'Electricity Bill Sharing', sub: 'Closed on 12 Sep 2026', voted: 98, result: 'Rejected' },
  { id: 14, title: 'Garden Redesign', sub: 'Closed on 02 Sep 2026', voted: 105, result: 'Passed' },
  { id: 15, title: 'Festival Budget', sub: 'Closed on 25 Aug 2026', voted: 92, result: 'Passed' },
] as const

// Latest votes cast
const recent = [
  { name: 'Priya Verma', poll: 'Maintenance Fund Increase', time: '2h ago', c: '#8B5CF6' },
  { name: 'Ramesh Sharma', poll: 'Parking Policy Change', time: '4h ago', c: '#3B82F6' },
  { name: 'Neha Gupta', poll: 'Clubhouse Renovation', time: '6h ago', c: '#00C2B8' },
]

// Full voting activity shown in the "View All" popup (placeholder data - replace with API data later)
const allActivity = [
  ...recent,
  { name: 'Amit Singh', poll: 'Maintenance Fund Increase', time: '8h ago', c: '#F59E0B' },
  { name: 'Sunita Patel', poll: 'Clubhouse Renovation', time: '10h ago', c: '#EC4899' },
  { name: 'Vikram Joshi', poll: 'Parking Policy Change', time: '1d ago', c: '#3B82F6' },
  { name: 'Anita Desai', poll: 'Maintenance Fund Increase', time: '1d ago', c: '#8B5CF6' },
  { name: 'Rohit Mehta', poll: 'Clubhouse Renovation', time: '2d ago', c: '#00C2B8' },
]

// Helpers: avatar initials and vote percentage
const initials = (n: string) => n.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
const pct = (v: number) => Math.round((v / TOTAL_VOTERS) * 100)

type Tab = 'active' | 'past'

// Poll shown in the View popup (result is empty for active polls)
type PollView = { id: number; title: string; sub: string; voted: number; result?: 'Passed' | 'Rejected' }

/* ---------- View Poll popup ---------- */

// One detail row (label on the left, value on the right)
function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-[#272D39] py-2 text-[11px] first:border-t-0">
      <span className="text-slate-400">{label}</span>
      <span className="text-right font-medium text-slate-200">{value}</span>
    </div>
  )
}

function ViewPollModal({ poll, onClose }: { poll: PollView; onClose: () => void }) {
  // Close on Esc + lock page scroll while the popup is open
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  // Status label + badge colour (active polls have no result yet)
  const statusLabel = poll.result ?? 'Active'
  const statusTone = poll.result === 'Passed' ? 'green' : poll.result === 'Rejected' ? 'red' : 'blue'
  const barColor =
    poll.result === 'Passed' ? 'bg-emerald-500' : poll.result === 'Rejected' ? 'bg-red-500' : 'bg-gradient-to-r from-[#6C63FF] to-[#4DA3FF]'

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
      className="fixed inset-0 z-70 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.96 }}
        transition={{ duration: 0.3, ease: EASE }}
        className="max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-xl border border-[#272D39] bg-[#10131A] p-4 text-white shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-sm font-bold">Poll Details</h2>
            <p className="truncate text-[11px] text-slate-400">{poll.title}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="cursor-pointer rounded-md p-1.5 text-slate-400 hover:bg-white/5 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Status */}
        <div className="mt-3 flex items-center justify-between rounded-lg border border-[#272D39] bg-white/3 px-3 py-2">
          <span className="text-[11px] text-slate-400">Status</span>
          <Badge tone={statusTone}>{statusLabel}</Badge>
        </div>

        {/* Details */}
        <div className="mt-2 rounded-lg border border-[#272D39] bg-white/3 px-3">
          <DetailRow label="Poll No." value={`#${poll.id}`} />
          <DetailRow label="Title" value={poll.title} />
          <DetailRow label="Description" value={poll.sub} />
          <DetailRow label="Total Voters" value={String(TOTAL_VOTERS)} />
          <DetailRow label="Voted" value={String(poll.voted)} />
          <DetailRow label="Not Voted" value={String(TOTAL_VOTERS - poll.voted)} />
        </div>

        {/* Participation progress */}
        <div className="mt-2 rounded-lg border border-[#272D39] bg-white/3 px-3 py-3">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Participation</span>
            <span className="font-semibold">{pct(poll.voted)}%</span>
          </div>
          <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
            <div className={`h-full rounded-full ${barColor}`} style={{ width: `${pct(poll.voted)}%` }} />
          </div>
        </div>

        {/* Actions */}
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg border border-[#272D39] px-4 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/5 active:scale-95"
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ---------- View All activity popup ---------- */

function ActivityModal({ onClose }: { onClose: () => void }) {
  // Close on Esc + lock page scroll while the popup is open
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
      className="fixed inset-0 z-70 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.96 }}
        transition={{ duration: 0.3, ease: EASE }}
        className="flex max-h-[90vh] w-full max-w-md flex-col rounded-xl border border-[#272D39] bg-[#10131A] p-4 text-white shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-sm font-bold">All Voting Activity</h2>
            <p className="text-[11px] text-slate-400">{allActivity.length} votes cast recently</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="cursor-pointer rounded-md p-1.5 text-slate-400 hover:bg-white/5 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Activity list (scrolls when long) */}
        <div className="mt-3 flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto rounded-lg border border-[#272D39] bg-white/3 p-3">
          {allActivity.map(({ name, poll, time, c }) => (
            <div key={`${name}-${poll}`} className="flex items-center gap-3">
              <span
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                style={{ background: `${c}26`, color: c }}
              >
                {initials(name)}
              </span>
              <p className="min-w-0 flex-1 truncate text-xs">
                <span className="font-semibold">{name}</span>{' '}
                <span className="text-slate-400">voted on</span> {poll}
              </p>
              <span className="shrink-0 text-[10px] text-slate-500">{time}</span>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg border border-[#272D39] px-4 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/5 active:scale-95"
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ---------- Page ---------- */
export default function VotingPage() {
  const [tab, setTab] = useState<Tab>('active')
  const [showPollModal, setShowPollModal] = useState(false)
  const [viewing, setViewing] = useState<PollView | null>(null) // poll open in the View popup (null = closed)
  const [showActivity, setShowActivity] = useState(false) // View All activity popup open / close

  const tabs: { key: Tab; label: string }[] = [
    { key: 'active', label: `Active Polls (${activePolls.length})` },
    { key: 'past', label: `Past Polls (${pastPolls.length})` },
  ]

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
          <h1 className="text-xl font-bold sm:text-2xl">Voting</h1>
          <p className="text-xs text-slate-400">Participate in society polls and elections</p>
        </motion.div>

        {/* New poll button: opens the Create Poll modal */}
        <motion.div variants={item}>
          <button
            type="button"
            onClick={() => setShowPollModal(true)}
            className="flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-linear-to-r from-[#6C63FF] to-[#4DA3FF] px-4 py-2.5 text-xs font-semibold text-white transition hover:opacity-90 active:scale-95"
          >
            <Plus className="h-3.5 w-3.5" /> New Poll
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
            <p className={`mt-1 truncate text-[10px] ${subC}`}>{sub}</p>
            {/* Coloured accent line at the bottom of the card */}
            <span className="absolute inset-x-0 bottom-0 h-[3px]" style={{ background: c }} />
          </motion.div>
        ))}
      </motion.div>

      {/* Tabs */}
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
        className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {tabs.map(({ key, label }) => (
          <motion.button
            key={key}
            variants={item}
            type="button"
            onClick={() => setTab(key)}
            className={`shrink-0 whitespace-nowrap rounded-full border px-3.5 py-1.5 text-[11px] transition-colors ${
              tab === key
                ? 'border-transparent bg-gradient-to-r from-[#6C63FF] to-[#4DA3FF] font-semibold text-white'
                : 'border-[#272D39] bg-[#10131A] text-slate-400 hover:bg-white/5'
            }`}
          >
            {label}
          </motion.button>
        ))}
      </motion.div>

      {/* Polls */}
      <motion.div
        variants={item}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
      >
        <Card
          title={tab === 'active' ? 'Active Polls' : 'Past Polls'}
          sub={tab === 'active' ? 'Cast your vote before polls close' : 'Closed polls and results'}
        >
          <div className="flex flex-col gap-3">
            {/* Active polls */}
            {tab === 'active' &&
              activePolls.map((p) => (
                <div key={p.id} className="rounded-lg border border-[#272D39] bg-white/[0.03] p-3 sm:p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold sm:text-sm">{p.title}</p>
                      <p className="mt-0.5 text-[10px] text-[#A29CFF]">{p.sub}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Link
                        href={`/secretary/voting/${p.id}/vote`}
                        className="flex-1 rounded-md bg-gradient-to-r from-[#6C63FF] to-[#4DA3FF] px-4 py-1.5 text-center text-[11px] font-semibold text-white hover:opacity-90 sm:flex-none"
                      >
                        Vote Now
                      </Link>
                      {/* View: opens the poll details popup */}
                      <button
                        type="button"
                        onClick={() => setViewing(p)}
                        className="flex-1 cursor-pointer rounded-md border border-[#272D39] px-4 py-1.5 text-center text-[11px] text-slate-300 hover:bg-white/5 sm:flex-none"
                      >
                        View
                      </button>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="mt-3 flex items-center gap-3">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                      <div className="h-full rounded-full bg-gradient-to-r from-[#6C63FF] to-[#4DA3FF]" style={{ width: `${pct(p.voted)}%` }} />
                    </div>
                    <span className="shrink-0 text-[11px] font-semibold">{pct(p.voted)}%</span>
                  </div>
                  <p className="mt-1.5 text-[10px] text-slate-400">
                    {p.voted} / {TOTAL_VOTERS} voted
                  </p>
                </div>
              ))}

            {/* Past polls */}
            {tab === 'past' &&
              pastPolls.map((p) => (
                <div key={p.id} className="rounded-lg border border-[#272D39] bg-white/[0.03] p-3 sm:p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold sm:text-sm">{p.title}</p>
                      <p className="mt-0.5 text-[10px] text-slate-400">{p.sub}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Badge tone={p.result === 'Passed' ? 'green' : 'red'}>{p.result}</Badge>
                      {/* View: opens the poll details popup */}
                      <button
                        type="button"
                        onClick={() => setViewing(p)}
                        className="cursor-pointer rounded-md border border-[#272D39] px-4 py-1.5 text-[11px] text-slate-300 hover:bg-white/5"
                      >
                        View
                      </button>
                    </div>
                  </div>

                  {/* Result progress bar */}
                  <div className="mt-3 flex items-center gap-3">
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                      <div
                        className={`h-full rounded-full ${p.result === 'Passed' ? 'bg-emerald-500' : 'bg-red-500'}`}
                        style={{ width: `${pct(p.voted)}%` }}
                      />
                    </div>
                    <span className="shrink-0 text-[11px] font-semibold">{pct(p.voted)}%</span>
                  </div>
                  <p className="mt-1.5 text-[10px] text-slate-400">
                    {p.voted} / {TOTAL_VOTERS} voted
                  </p>
                </div>
              ))}
          </div>
        </Card>
      </motion.div>

      {/* Recent Voting Activity */}
      <motion.div
        variants={item}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
      >
        <Card
          title="Recent Voting Activity" sub="Latest votes cast"
          action={
            // View All: opens the full activity popup
            <button
              type="button"
              onClick={() => setShowActivity(true)}
              className="cursor-pointer text-[11px] text-[#A29CFF] hover:underline"
            >
              View All
            </button>
          }
        >
          <div className="flex flex-col gap-3">
            {recent.map(({ name, poll, time, c }) => (
              <div key={name} className="flex items-center gap-3">
                <span
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                  style={{ background: `${c}26`, color: c }}
                >
                  {initials(name)}
                </span>
                <p className="min-w-0 flex-1 truncate text-xs">
                  <span className="font-semibold">{name}</span>{' '}
                  <span className="text-slate-400">voted on</span> {poll}
                </p>
                <span className="shrink-0 text-[10px] text-slate-500">{time}</span>
              </div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Create Poll modal */}
    <AddPollModal
  open={showPollModal}
  onClose={() => setShowPollModal(false)}
  onSave={(poll) => {
    console.log('New poll:', poll) // add the API call here
  }}
/>

      {/* View Poll popup */}
      <AnimatePresence>
        {viewing && (
          <ViewPollModal
            key={viewing.id}
            poll={viewing}
            onClose={() => setViewing(null)}
          />
        )}
      </AnimatePresence>

      {/* View All activity popup */}
      <AnimatePresence>
        {showActivity && <ActivityModal onClose={() => setShowActivity(false)} />}
      </AnimatePresence>
    </div>
  )
}