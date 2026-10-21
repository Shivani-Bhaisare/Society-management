'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, type Variants } from 'framer-motion'
import { Plus, Vote, Users, Percent } from 'lucide-react'
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

// Helpers: avatar initials and vote percentage
const initials = (n: string) => n.split(' ').map((w) => w[0]).join('').slice(0, 2).toUpperCase()
const pct = (v: number) => Math.round((v / TOTAL_VOTERS) * 100)

type Tab = 'active' | 'past'

/* ---------- Page ---------- */
export default function VotingPage() {
  const [tab, setTab] = useState<Tab>('active')
  const [showPollModal, setShowPollModal] = useState(false)

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
                      <Link
                        href={`/secretary/voting/${p.id}`}
                        className="flex-1 rounded-md border border-[#272D39] px-4 py-1.5 text-center text-[11px] text-slate-300 hover:bg-white/5 sm:flex-none"
                      >
                        View
                      </Link>
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
                      <Link
                        href={`/secretary/voting/${p.id}`}
                        className="rounded-md border border-[#272D39] px-4 py-1.5 text-[11px] text-slate-300 hover:bg-white/5"
                      >
                        View
                      </Link>
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
          action={<Link href="/secretary/voting/activity" className="text-[11px] text-[#A29CFF] hover:underline">View All</Link>}
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
    </div>
  )
}