'use client'

import { motion, type Variants } from 'framer-motion'
import {
  ShieldCheck,
  CircleDollarSign,
  Users,
  Gauge,
  MessageSquare,
  Building2,
} from 'lucide-react'

const items = [
  { label: 'Security', icon: ShieldCheck },
  { label: 'Finance', icon: CircleDollarSign },
  { label: 'Residents', icon: Users },
  { label: 'Operations', icon: Gauge },
  { label: 'Community', icon: MessageSquare },
  { label: 'Facilities', icon: Building2 },
]

// Parent: heading, paragraph and icons appear one after another
const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.15 } },
}

// Heading and paragraph fade in while moving up
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: 'easeOut' } },
}

// Icons row: each icon pops in one by one
const iconsRow: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
}

const iconItem: Variants = {
  hidden: { opacity: 0, y: 30, scale: 0.8 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
}

const Features = () => {
  return (
    <section className="w-full overflow-hidden bg-white py-16">
      {/* Animation replays every time this block enters the screen (scroll up or down) */}
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={{ once: false, amount: 0.3 }}
        className="mx-auto max-w-[1440px] px-10 text-center"
      >
        {/* Heading */}
        <motion.h2
          variants={fadeUp}
          className="text-4xl font-bold text-[#0B1220] lg:text-5xl"
        >
          Everything Your Society Needs.
          <br />
          <span className="mt-2 block text-[#2563EB]">Connected in One Place</span>
        </motion.h2>

        {/* Paragraph */}
        <motion.p
          variants={fadeUp}
          className="mx-auto mt-6 max-w-[560px] text-sm leading-6 text-gray-600"
        >
          From the gate to the accounts office, from maintenance requests to
          resident communication — SocietyOS connects the people, processes and
          information that keep a community running.
        </motion.p>

        {/* Icons row */}
        <motion.div
          variants={iconsRow}
          className="mt-14 flex flex-wrap items-start justify-center gap-4 lg:gap-8"
        >
          {items.map(({ label, icon: Icon }) => (
            <motion.div
              key={label}
              variants={iconItem}
              className="group flex cursor-pointer flex-col items-center gap-3"
            >
              {/* Box lifts up and turns blue on hover */}
              <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-gray-200 bg-gray-50 transition-all duration-300 group-hover:-translate-y-2 group-hover:border-[#2563EB] group-hover:bg-[#2563EB] group-hover:shadow-lg group-hover:shadow-[#2563EB]/30">
                <Icon
                  size={24}
                  strokeWidth={1.5}
                  className="text-[#2563EB] transition-all duration-300 group-hover:scale-110 group-hover:text-white"
                />
              </div>
              <span className="text-xs font-medium uppercase tracking-wide text-[#0B1220] transition-colors duration-300 group-hover:text-[#2563EB]">
                {label}
              </span>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  )
}

export default Features