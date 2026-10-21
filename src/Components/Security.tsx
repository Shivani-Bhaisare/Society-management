'use client'

import Image from 'next/image'
import { motion, type Variants } from 'framer-motion'
import { Bell, CheckCircle2, Check } from 'lucide-react'

const features = [
  'Pre-approved Visitors',
  'Instant Entry Notifications',
  'Visitor Logs',
  'Delivery Tracking',
  'Staff Entry',
  'Vehicle Records',
  'Digital Gate Passes',
  'Emergency Alerts',
]

// Left image: slides in from the left with a slight zoom
const imageVariant: Variants = {
  hidden: { opacity: 0, x: -60, scale: 0.92 },
  show: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { duration: 0.9, ease: 'easeOut' },
  },
}

// Floating notification card: pops in after the image
const notificationVariant: Variants = {
  hidden: { opacity: 0, y: -20, scale: 0.8 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.6, ease: 'easeOut', delay: 0.8 },
  },
}

// Right column: label, heading, paragraph and list appear one after another
const rightColumn: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.15, delayChildren: 0.2 } },
}

// Text blocks fade in while moving up
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: 'easeOut' } },
}

// Feature list: each item slides in from the right, one by one
const list: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
}

const listItem: Variants = {
  hidden: { opacity: 0, x: 24 },
  show: { opacity: 1, x: 0, transition: { duration: 0.5, ease: 'easeOut' } },
}

const Security = () => {
  return (
    <section className="w-full overflow-hidden bg-[#081121] py-16">
      {/* Animation replays every time this block enters the screen (scroll up or down) */}
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: false, amount: 0.3 }}
        className="mx-auto grid max-w-[1440px] items-center gap-12 px-10 lg:grid-cols-2 lg:px-24"
      >
        {/* Left: image */}
        <motion.div
          variants={imageVariant}
          className="relative mx-auto w-full max-w-[520px]"
        >
          <div className="relative h-[460px] overflow-hidden rounded-bl-[24px] rounded-br-[90px] rounded-tl-[24px] rounded-tr-[24px]">
            <Image
              src="/img2 (3).png"
              alt="Security guard at society gate"
              fill
              sizes="(min-width: 1024px) 520px, 100vw"
              className="object-cover"
            />
          </div>

          {/* Floating notification card (top-right of the image) with a gentle up-down float */}
          <motion.div
            variants={notificationVariant}
            className="absolute right-4 top-4"
          >
            <motion.div
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="flex items-center gap-3 rounded-lg bg-white px-3 py-2 shadow-lg"
            >
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#E5ECFB]">
                <Bell size={14} className="text-[#2563EB]" />
              </div>
              <div>
                <p className="text-[8px] text-gray-400">Entry approved</p>
                <p className="text-[10px] font-semibold text-[#0B1220]">
                  Visitor at Gate 01
                </p>
              </div>
              <CheckCircle2 size={14} className="text-green-500" />
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Right: content */}
        <motion.div variants={rightColumn}>
          <motion.p
            variants={fadeUp}
            className="text-[10px] font-semibold uppercase tracking-widest text-white/80"
          >
            Security
          </motion.p>

          <motion.h2
            variants={fadeUp}
            className="mt-4 max-w-[460px] text-4xl font-bold leading-[1.1] text-white lg:text-5xl"
          >
            Know Who Enters. Know Who Leaves.
          </motion.h2>

          <motion.p
            variants={fadeUp}
            className="mt-5 max-w-[440px] text-sm leading-6 text-white/70"
          >
            Digitize visitor, delivery, staff and vehicle entry while keeping
            residents informed in real time.
          </motion.p>

          <motion.ul
            variants={list}
            className="mt-8 grid max-w-[460px] grid-cols-2 gap-x-8"
          >
            {features.map((item) => (
              <motion.li
                key={item}
                variants={listItem}
                className="group flex items-center gap-2 border-b border-white/10 py-3 text-xs text-white/80 transition-colors duration-300 hover:border-[#2563EB]/60 hover:text-white"
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
      </motion.div>
    </section>
  )
}

export default Security