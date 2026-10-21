'use client'

import { motion, type Variants } from 'framer-motion'
import { Check } from 'lucide-react'

const features = [
  'Automated Billing',
  'Maintenance Charges',
  'Payment Tracking',
  'Outstanding Dues',
  'Digital Receipts',
  'Payment Reminders',
  'Multiple Payment Methods',
  'Collection Reports',
]

const steps = [
  'Bill Generated',
  'Resident Notified',
  'Payment',
  'Receipt',
  'Accounting',
]

const details = [
  { label: 'Unit', value: 'UPI • HDFC Bank' },
  { label: 'Receipt No.', value: '#SOC • 202484' },
  { label: 'Period', value: 'September 2026' },
]

// Left column: label, heading, paragraph and list appear one after another
const leftColumn: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.15 } },
}

// Text blocks fade in while moving up
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: 'easeOut' } },
}

// Feature list: each item slides in from the left, one by one
const list: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
}

const listItem: Variants = {
  hidden: { opacity: 0, x: -24 },
  show: { opacity: 1, x: 0, transition: { duration: 0.5, ease: 'easeOut' } },
}

// Right billing card: slides in from the right with a slight zoom
const cardVariant: Variants = {
  hidden: { opacity: 0, x: 60, scale: 0.92 },
  show: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      duration: 0.9,
      ease: 'easeOut',
      delay: 0.2,
      when: 'beforeChildren',
      staggerChildren: 0.1,
    },
  },
}

// Items inside the card (details rows) fade in one by one
const cardItem: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
}

// PAID badge: pops in after the card
const badgeVariant: Variants = {
  hidden: { opacity: 0, x: 30 },
  show: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.5, ease: 'easeOut', delay: 0.9 },
  },
}

// Progress steps: each step pops in one by one
const stepsRow: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 1 } },
}

const stepItem: Variants = {
  hidden: { opacity: 0, y: 16, scale: 0.7 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
}

const Billing = () => {
  return (
    <section className="w-full overflow-hidden bg-white py-12 sm:py-16">
      {/* Animation replays every time this block enters the screen (scroll up or down) */}
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: false, amount: 0.3 }}
        className="mx-auto grid max-w-[1440px] items-center gap-10 px-5 sm:px-10 lg:grid-cols-2 lg:gap-12 lg:px-24"
      >
        {/* Left: content */}
        <motion.div variants={leftColumn}>
          <motion.p
            variants={fadeUp}
            className="text-[10px] font-semibold uppercase tracking-widest text-[#0B1220]"
          >
            Maintenance &amp; Billing
          </motion.p>

          <motion.h2
            variants={fadeUp}
            className="mt-4 max-w-[460px] text-3xl font-bold leading-[1.1] text-[#0B1220] sm:text-4xl lg:text-5xl"
          >
            Make Society Billing Simple.
          </motion.h2>

          <motion.p
            variants={fadeUp}
            className="mt-5 max-w-[460px] text-sm leading-6 text-gray-500"
          >
            Automate maintenance billing, payment collection and resident
            payment records without relying on manual spreadsheets.
          </motion.p>

          <motion.ul
            variants={list}
            className="mt-8 grid max-w-[480px] grid-cols-1 gap-x-8 sm:grid-cols-2"
          >
            {features.map((item) => (
              <motion.li
                key={item}
                variants={listItem}
                className="group flex items-center gap-2 border-b border-gray-200 py-3 text-xs text-gray-700 transition-colors duration-300 hover:border-[#2563EB]/60 hover:text-[#0B1220]"
              >
                {/* Check icon moves slightly right on hover */}
                <Check
                  size={12}
                  className="shrink-0 text-[#2563EB] transition-transform duration-300 group-hover:translate-x-1"
                />
                {item}
              </motion.li>
            ))}
          </motion.ul>
        </motion.div>

        {/* Right: billing card */}
        <motion.div
          variants={cardVariant}
          className="mx-auto w-full max-w-[440px] rounded-2xl border border-gray-200 bg-[#F8FAFD] p-3 sm:p-4 lg:ml-auto"
        >
          <div className="relative rounded-xl bg-white p-5 shadow-sm">
            {/* Paid badge */}
            <motion.span
              variants={badgeVariant}
              className="absolute right-0 top-4 rounded-l-full bg-[#DCFCE7] px-3 py-1 text-[9px] font-semibold text-green-600"
            >
              ✓ PAID
            </motion.span>

            <motion.p variants={cardItem} className="text-[10px] uppercase text-gray-500">
              Unit
            </motion.p>
            <motion.p variants={cardItem} className="mt-1 text-lg font-semibold text-[#0B1220]">
              A-1204
            </motion.p>

            <motion.p variants={cardItem} className="mt-5 text-xs text-gray-500">
              Monthly Maintenance
            </motion.p>
            <motion.p variants={cardItem} className="mt-1 text-3xl font-bold text-[#0B1220]">
              ₹4,850
            </motion.p>

            {/* Details */}
            <div className="mt-5 border-t border-gray-200">
              {details.map((d) => (
                <motion.div
                  key={d.label}
                  variants={cardItem}
                  className="flex items-center justify-between py-2 text-[11px]"
                >
                  <span className="text-gray-500">{d.label}</span>
                  <span className="font-medium text-[#0B1220]">{d.value}</span>
                </motion.div>
              ))}
            </div>

            {/* Progress steps */}
            <motion.div
              variants={stepsRow}
              className="mt-4 flex items-start justify-between"
            >
              {steps.map((step, i) => (
                <motion.div
                  key={step}
                  variants={stepItem}
                  className="flex w-1/5 flex-col items-center gap-1.5 text-center"
                >
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#2563EB] text-[8px] font-semibold text-white">
                    {i + 1}
                  </span>
                  <span className="text-[7px] uppercase leading-tight text-gray-400 sm:text-[8px]">
                    {step}
                  </span>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  )
}

export default Billing