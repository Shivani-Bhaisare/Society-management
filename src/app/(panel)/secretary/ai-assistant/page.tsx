'use client'

import { useEffect, useRef, useState } from 'react'
import { motion, type Variants } from 'framer-motion'
import {
  Send, Wallet, FileBarChart, CalendarCheck, CalendarClock,
  PieChart, Megaphone, AlertTriangle, MessageSquareWarning, FileClock, IndianRupee,
} from 'lucide-react'
import { Card } from '@/Components/ui'

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
type Msg = { id: number; from: 'user' | 'ai'; text: string }

/* ---------- Data (replace with API later) ---------- */
const userName = 'Rahul'

const suggestions = [
  'Show pending maintenance',
  'Find open complaints',
  "Show today's bookings",
  'Generate monthly report',
]

const quickActions = [
  { label: 'Analyse Pending Payments', icon: Wallet },
  { label: 'Generate Monthly Report', icon: FileBarChart },
  { label: 'Analyse Bookings', icon: CalendarCheck },
  { label: 'Show Facility Bookings', icon: CalendarClock },
  { label: 'Analyse Society Expenses', icon: PieChart },
  { label: 'Summarize Notices', icon: Megaphone },
]

const insights = [
  { text: '18 overdue accounts', icon: AlertTriangle, c: '#EF4444' },
  { text: '7 unresolved complaints', icon: MessageSquareWarning, c: '#EF4444' },
  { text: '3 vendor contracts expiring', icon: FileClock, c: '#F59E0B' },
  { text: '₹1.73L pending maintenance', icon: IndianRupee, c: '#10B981' },
]

/* Demo replies: replace with your own AI API call later */
function fakeReply(q: string) {
  const s = q.toLowerCase()
  if (s.includes('maintenance')) return 'Pending maintenance total is ₹1,73,000. 18 flats have overdue dues.'
  if (s.includes('complaint')) return '8 complaints are open and 6 are in progress. 3 complaints are overdue.'
  if (s.includes('booking')) return "Today there are 5 facility bookings: Pool (2), Gym (1), Club House (1), Community Hall (1)."
  if (s.includes('report')) return 'Monthly report is ready: collection ₹4,85,000, expenses ₹4.8L, complaint resolution 75%.'
  return "Got it. I'll check the society data and get back to you with an answer."
}

/* ---------- Animated Robot ----------
   Images: /public/robot/f00.webp ... f41.webp
   Code cross-fades them smoothly + gently floats/tilts the robot. */
const FRAMES = 42          // number of images (f00 ... f41)
const FRAME_TIME = 0.25    // seconds per image (smaller = faster)
const FADE = 0.22          // cross-fade time (close to FRAME_TIME = smoother blend)
const CYCLE = FRAMES * FRAME_TIME

function AnimatedRobot() {
  const hold = (FRAME_TIME / CYCLE) * 100
  const fade = (FADE / CYCLE) * 100

  return (
    <div className="relative flex flex-col items-center">
      {/* outer = slow up/down, inner = slow tilt (separate so both stay smooth) */}
      <div className="robot-bob">
        <div className="robot-tilt relative h-32 w-32 overflow-hidden rounded-2xl shadow-lg shadow-[#6D5EF5]/20">
          {Array.from({ length: FRAMES }).map((_, i) => (
            <img
              key={i}
              src={`/robot/f${String(i).padStart(2, '0')}.webp`}
              alt={i === 0 ? 'AI Assistant' : ''}
              draggable={false}
              decoding="async"
              className="robot-frame absolute inset-0 h-full w-full select-none object-cover"
              style={{ animationDelay: `${(i * FRAME_TIME).toFixed(3)}s`, zIndex: i }}
            />
          ))}
        </div>
      </div>

      <style>{`
        .robot-frame {
          opacity: 0;
          will-change: opacity;
          animation: robotFrame ${CYCLE}s linear infinite;
        }
        @keyframes robotFrame {
          0%   { opacity: 0; }
          ${fade}% { opacity: 1; }
          ${hold + fade}% { opacity: 1; }
          ${hold + fade + 0.01}% { opacity: 0; }
          100% { opacity: 0; }
        }

        .robot-bob {
          animation: robotBob 3s ease-in-out infinite alternate;
          will-change: transform;
        }
        @keyframes robotBob {
          from { transform: translate3d(0, 0, 0); }
          to   { transform: translate3d(0, -8px, 0); }
        }

        .robot-tilt {
          animation: robotTilt 4.5s ease-in-out infinite alternate;
          transform-origin: 50% 90%;
          will-change: transform;
        }
        @keyframes robotTilt {
          from { transform: rotate(-3deg); }
          to   { transform: rotate(3deg); }
        }
      `}</style>
    </div>
  )
}

/* ---------- Page ---------- */
export default function AIAssistantPage() {
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [typing, setTyping] = useState(false)
  const endRef = useRef<HTMLDivElement>(null)

  /* Auto-scroll to the latest message */
  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [msgs, typing])

  function send(text: string) {
    const t = text.trim()
    if (!t || typing) return
    setMsgs((m) => [...m, { id: Date.now(), from: 'user', text: t }])
    setInput('')
    setTyping(true)
    setTimeout(() => {
      setMsgs((m) => [...m, { id: Date.now() + 1, from: 'ai', text: fakeReply(t) }])
      setTyping(false)
    }, 700)
  }

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-4">
      {/* Header (icon removed) */}
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
      >
        <motion.div variants={item}>
          <h1 className="text-xl font-bold sm:text-2xl">SocietyOS AI Assistant</h1>
          <p className="text-xs text-slate-400">Your intelligent society management assistant</p>
        </motion.div>
      </motion.div>

      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
        className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_320px]"
      >
        {/* Chat */}
        <motion.section
          variants={item}
          className="flex h-[70vh] min-h-[420px] min-w-0 flex-col rounded-xl border border-[#272D39] bg-[#10131A] lg:h-[calc(100vh-190px)]"
        >
          <div className="flex-1 overflow-y-auto p-4">
            {msgs.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
                {/* Animated robot */}
                <AnimatedRobot />

                <div>
                  <p className="text-sm font-bold">👋 Hello {userName}!</p>
                  <p className="mt-1 text-xs text-slate-400">How can I help you today?</p>
                </div>
                <div className="flex max-w-xl flex-wrap justify-center gap-2">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => send(s)}
                      className="rounded-lg border border-[#272D39] bg-white/[0.03] px-3 py-1.5 text-[11px] text-slate-300 transition-colors hover:bg-white/5"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {msgs.map((m) => (
                  <div key={m.id} className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {/* User bubble uses gradient #6C63FF -> #4DA3FF */}
                    <div
                      className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed sm:max-w-[70%] ${
                        m.from === 'user'
                          ? 'bg-gradient-to-r from-[#6C63FF] to-[#4DA3FF] text-white'
                          : 'border border-[#272D39] bg-white/[0.04] text-slate-200'
                      }`}
                    >
                      {m.text}
                    </div>
                  </div>
                ))}
                {typing && (
                  <div className="flex justify-start">
                    <div className="flex gap-1 rounded-xl border border-[#272D39] bg-white/[0.04] px-3 py-3">
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:150ms]" />
                      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:300ms]" />
                    </div>
                  </div>
                )}
                <div ref={endRef} />
              </div>
            )}
          </div>

          {/* Input */}
          <form
            onSubmit={(e) => {
              e.preventDefault()
              send(input)
            }}
            className="flex items-center gap-2 border-t border-[#272D39] p-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about your society..."
              aria-label="Message"
              className="min-w-0 flex-1 rounded-lg border border-[#272D39] bg-[#10131A] px-3 py-2 text-xs text-slate-200 outline-none placeholder:text-slate-500 focus:border-[#A29CFF]/60"
            />
            {/* Send button: gradient #6C63FF -> #4DA3FF */}
            <button
              type="submit"
              aria-label="Send"
              disabled={!input.trim() || typing}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-r from-[#6C63FF] to-[#4DA3FF] text-white transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>
        </motion.section>

        {/* Side panels */}
        <motion.aside
          variants={container}
          className="grid min-w-0 grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-1 lg:content-start"
        >
          <motion.div variants={item} className="min-w-0 [&>*]:h-full">
            <Card title="Quick Actions" sub="Ask the assistant in one tap">
              <div className="flex flex-col gap-2">
                {quickActions.map(({ label, icon: Icon }) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => send(label)}
                    className="flex items-center gap-3 rounded-lg border border-[#272D39] bg-white/[0.03] px-3 py-2 text-left hover:bg-white/5"
                  >
                    <Icon className="h-4 w-4 shrink-0 text-[#A29CFF]" />
                    <span className="truncate text-xs font-semibold">{label}</span>
                  </button>
                ))}
              </div>
            </Card>
          </motion.div>

          <motion.div variants={item} className="min-w-0 [&>*]:h-full">
            <Card title="AI Insights" sub="Highlights from your society data">
              <ul className="flex flex-col gap-3">
                {insights.map(({ text, icon: Icon, c }) => (
                  <li key={text} className="flex items-center gap-3">
                    <span
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                      style={{ background: `${c}26`, color: c }}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="text-xs font-semibold">{text}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </motion.div>
        </motion.aside>
      </motion.div>
    </div>
  )
}