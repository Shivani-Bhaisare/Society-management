'use client'

import Link from 'next/link'
import { motion, type Variants } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

const bars = [40, 55, 45, 68, 58, 75, 64, 82]

const stats = [
  { label: 'Pending', value: '₹2.4L' },
  { label: 'Expenses', value: '₹11.2L' },
  { label: 'Vendor Payments', value: 'Organized' },
]

// Left collection card: slides in from the left with a slight zoom
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
      staggerChildren: 0.1,
    },
  },
}

// Items inside the card (title, amount) fade in one by one
const cardItem: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
}

// Badge: slides in from the right after the card
const badgeVariant: Variants = {
  hidden: { opacity: 0, x: 30 },
  show: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, ease: 'easeOut', delay: 0.8 },
  },
}

// Bar chart: bars grow from the bottom one by one
const barsRow: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.6 } },
}

const barItem: Variants = {
  hidden: { scaleY: 0, opacity: 0 },
  show: {
    scaleY: 1,
    opacity: 1,
    transition: { duration: 0.6, ease: 'easeOut' },
  },
}

// Stats row: each stat fades in after the bars
const statsRow: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 1.3 } },
}

const statItem: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
}

// Right column: label, heading, paragraph and link appear one after another
const rightColumn: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.15, delayChildren: 0.2 } },
}

// Text blocks fade in while moving up
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: 'easeOut' } },
}

const Finance = () => {
  return (
    <section className="w-full overflow-hidden bg-[#F8FAFD] py-12 sm:py-16">
      {/* Animation replays every time this block enters the screen (scroll up or down) */}
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: false, amount: 0.3 }}
        className="mx-auto grid max-w-[1440px] items-center gap-10 px-5 sm:px-10 lg:grid-cols-2 lg:gap-12 lg:px-24"
      >
        {/* Left: collection card */}
        <motion.div
          variants={cardVariant}
          className="mx-auto w-full max-w-[440px] rounded-2xl border border-gray-200 bg-[#F8F8F5] p-3 sm:p-4 lg:mx-0"
        >
          <div className="relative rounded-xl bg-white p-5 shadow-sm">
            {/* Badge */}
            <motion.span
              variants={badgeVariant}
              className="absolute right-0 top-4 flex items-center gap-1 rounded-l-full bg-[#DCFCE7] px-3 py-1 text-[8px] font-semibold uppercase text-green-600"
            >
              <ArrowRight size={8} /> Collection on track
            </motion.span>

            <motion.p variants={cardItem} className="text-xs uppercase text-gray-500">
              Monthly Collection
            </motion.p>
            <motion.p variants={cardItem} className="mt-1 text-2xl font-bold text-[#0B1220]">
              ₹18.25
            </motion.p>

            {/* Bar chart: each bar grows upward from its base */}
            <motion.div
              variants={barsRow}
              className="mt-6 flex h-40 items-end justify-between gap-2 sm:h-44"
            >
              {bars.map((h, i) => (
                <motion.div
                  key={i}
                  variants={barItem}
                  style={{ height: `${h}%`, originY: 1 }}
                  className="flex-1 rounded-t-sm bg-gradient-to-t from-[#2563EB] to-[#4F8BFF] transition-opacity duration-300 hover:opacity-80"
                />
              ))}
            </motion.div>

            {/* Stats */}
            <motion.div
              variants={statsRow}
              className="mt-4 grid grid-cols-3 gap-2 border-t border-gray-100 pt-3"
            >
              {stats.map((s) => (
                <motion.div key={s.label} variants={statItem}>
                  <p className="text-[8px] text-gray-400">{s.label}</p>
                  <p className="mt-0.5 text-[11px] font-semibold text-[#0B1220]">
                    {s.value}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.div>

        {/* Right: content */}
        <motion.div variants={rightColumn}>
          <motion.p
            variants={fadeUp}
            className="text-[10px] font-semibold uppercase tracking-widest text-[#0B1220]"
          >
            Finance &amp; Accounting
          </motion.p>

          <motion.h2
            variants={fadeUp}
            className="mt-4 max-w-[460px] text-3xl font-bold leading-[1.1] text-[#0B1220] sm:text-4xl lg:text-5xl"
          >
            Bring Financial Clarity to Your Society.
          </motion.h2>

          <motion.p
            variants={fadeUp}
            className="mt-5 max-w-[480px] text-sm leading-6 text-gray-500"
          >
            Automate maintenance billing, payment collection and resident
            payment records without relying on manual spreadsheets.
          </motion.p>

          {/* Link: arrow moves right on hover */}
          <motion.div variants={fadeUp}>
            <Link
              href="#"
              className="group mt-6 inline-flex items-center gap-1.5 text-xs font-semibold text-[#2563EB]"
            >
              Explore Financial Management
              <ArrowRight
                size={12}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </Link>
          </motion.div>
        </motion.div>
      </motion.div>
    </section>
  )
}

export default Finance