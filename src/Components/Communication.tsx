'use client'

import { motion, type Variants } from 'framer-motion'
import {
  FiBell,
  FiCheck,
  FiSmartphone,
  FiMessageSquare,
  FiMail,
  FiMessageCircle,
} from 'react-icons/fi'

const audience = [
  { label: 'All Residents', active: true },
  { label: 'Tower A', active: false },
  { label: 'Committee', active: false },
  { label: 'Security', active: false },
]

const channels = [
  { label: 'Push', icon: FiSmartphone, active: true },
  { label: 'SMS', icon: FiMessageSquare, active: false },
  { label: 'Email', icon: FiMail, active: false },
  { label: 'WhatsApp', icon: FiMessageCircle, active: false },
]

// Notice card: slides in from the left with a slight zoom, then its content follows
const cardVariant: Variants = {
  hidden: { opacity: 0, x: -60, scale: 0.92 },
  show: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      duration: 0.9,
      ease: 'easeOut',
      when: 'beforeChildren',
      staggerChildren: 0.12,
    },
  },
}

// Items inside the card (header, title, paragraph, sections) fade in one by one
const cardItem: Variants = {
  hidden: { opacity: 0, y: 14 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: 'easeOut' } },
}

// Pills (audience / channels): each pill pops in one by one
const pillsList: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
}

const pillItem: Variants = {
  hidden: { opacity: 0, y: 12, scale: 0.8 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
}

// Right column: label, heading and paragraph appear one after another
const rightColumn: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.15, delayChildren: 0.2 } },
}

// Text blocks fade in while moving up
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: 'easeOut' } },
}

const Communication = () => {
  return (
    <section className="w-full overflow-hidden bg-[#F8FAFD] py-12 sm:py-16 lg:py-20">
      {/* Animation replays every time this block enters the screen (scroll up or down) */}
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: false, amount: 0.3 }}
        className="mx-auto grid max-w-[1440px] items-center gap-10 px-5 sm:px-10 lg:grid-cols-[1.15fr_1fr] lg:gap-16 lg:px-24"
      >
        {/* Notice card (left on desktop, below the text on mobile) */}
        <motion.article
          variants={cardVariant}
          className="order-2 w-full rounded-xl border border-slate-200 bg-white p-4 shadow-lg shadow-black/5 sm:p-5 lg:order-1"
        >
          {/* Header */}
          <motion.div
            variants={cardItem}
            className="flex items-center justify-between gap-3"
          >
            <p className="flex items-center gap-2 text-[8px] font-semibold uppercase tracking-wider text-blue-600">
              <FiBell aria-hidden="true" />
              Society Notice
            </p>
            <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[8px] font-medium text-slate-500">
              Draft
            </span>
          </motion.div>

          <motion.h3
            variants={cardItem}
            className="mt-4 text-base font-semibold leading-snug text-[#081121] sm:text-lg"
          >
            Water supply maintenance scheduled for Sunday.
          </motion.h3>

          <motion.p
            variants={cardItem}
            className="mt-2 text-[10px] leading-5 text-slate-500 sm:text-[11px]"
          >
            Water supply will be paused between 10:00 AM and 12:00 PM for
            scheduled maintenance.
          </motion.p>

          {/* Send to */}
          <motion.div
            variants={cardItem}
            className="mt-5 border-t border-slate-200 pt-4"
          >
            <p className="text-[8px] font-semibold uppercase tracking-wider text-slate-400">
              Send to
            </p>

            <motion.ul
              variants={pillsList}
              className="mt-2.5 flex flex-wrap gap-2"
            >
              {audience.map(({ label, active }) => (
                <motion.li
                  key={label}
                  variants={pillItem}
                  className={`inline-flex cursor-default items-center gap-1 rounded-full border px-3 py-1.5 text-[10px] font-medium transition-colors duration-300 ${
                    active
                      ? 'border-blue-200 bg-blue-100 text-blue-600'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600'
                  }`}
                >
                  {active && <FiCheck aria-hidden="true" />}
                  {label}
                </motion.li>
              ))}
            </motion.ul>
          </motion.div>

          {/* Channels */}
          <motion.div
            variants={cardItem}
            className="mt-4 border-t border-slate-200 pt-4"
          >
            <p className="text-[8px] font-semibold uppercase tracking-wider text-slate-400">
              Channels
            </p>

            <motion.ul
              variants={pillsList}
              className="mt-2.5 flex flex-wrap gap-2"
            >
              {channels.map(({ label, icon: Icon, active }) => (
                <motion.li
                  key={label}
                  variants={pillItem}
                  className={`inline-flex cursor-default items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-medium transition-colors duration-300 ${
                    active
                      ? 'border-blue-200 bg-blue-100 text-blue-600'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600'
                  }`}
                >
                  <Icon aria-hidden="true" />
                  {label}
                </motion.li>
              ))}
            </motion.ul>
          </motion.div>
        </motion.article>

        {/* Text content (right on desktop, above the card on mobile) */}
        <motion.div variants={rightColumn} className="order-1 lg:order-2">
          <motion.p
            variants={fadeUp}
            className="text-[10px] font-semibold uppercase tracking-widest text-slate-500"
          >
            Communication
          </motion.p>

          <motion.h2
            variants={fadeUp}
            className="mt-4 max-w-[420px] text-3xl font-bold leading-[1.1] tracking-tight text-[#081121] sm:text-4xl lg:text-5xl"
          >
            Keep the Whole Community in Sync.
          </motion.h2>

          <motion.p
            variants={fadeUp}
            className="mt-5 max-w-[420px] text-xs leading-6 text-slate-500 sm:text-sm"
          >
            Send important updates to the right residents, teams and groups
            without relying on scattered communication channels.
          </motion.p>
        </motion.div>
      </motion.div>
    </section>
  )
}

export default Communication