'use client'

import Image from 'next/image'
import { motion, type Variants } from 'framer-motion'
import { FiCheck } from 'react-icons/fi'

const features = [
  'Resident Parking',
  'Visitor Parking',
  'Vehicle Registration',
  'Parking Allocation',
  'Parking History',
  'Vehicle Records',
]

const details = [
  { label: 'Resident', value: 'A-1204' },
  { label: 'Vehicle', value: 'MH 12 AB 4521' },
  { label: 'Type', value: '4 Wheeler' },
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

// Right image: slides in from the right with a slight zoom
const imageVariant: Variants = {
  hidden: { opacity: 0, x: 60, scale: 0.92 },
  show: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: { duration: 0.9, ease: 'easeOut', delay: 0.2 },
  },
}

// Slot card: pops up after the image, then its content follows
const slotCardVariant: Variants = {
  hidden: { opacity: 0, y: 40, scale: 0.85 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.6,
      ease: 'easeOut',
      delay: 0.9,
      when: 'beforeChildren',
      staggerChildren: 0.1,
    },
  },
}

// Items inside the slot card fade in one by one
const slotItem: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } },
}

const Parking = () => {
  return (
    <section className="w-full overflow-hidden bg-[#F8FAFD] py-12 sm:py-16 lg:py-20">
      {/* Animation replays every time this block enters the screen (scroll up or down) */}
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: false, amount: 0.3 }}
        className="mx-auto grid max-w-[1440px] items-center gap-10 px-5 sm:px-10 lg:grid-cols-2 lg:gap-16 lg:px-24"
      >
        {/* Left content */}
        <motion.div variants={leftColumn}>
          <motion.p
            variants={fadeUp}
            className="text-[10px] font-semibold uppercase tracking-widest text-slate-500"
          >
            Parking &amp; Vehicles
          </motion.p>

          <motion.h2
            variants={fadeUp}
            className="mt-4 max-w-[480px] text-3xl font-bold leading-[1.1] tracking-tight text-[#081121] sm:text-4xl lg:text-5xl"
          >
            Turn Parking Into a Managed System.
          </motion.h2>

          <motion.p
            variants={fadeUp}
            className="mt-5 max-w-[440px] text-xs leading-6 text-slate-500 sm:text-sm"
          >
            Digitize visitor, delivery, staff and vehicle entry while keeping
            residents informed in real time.
          </motion.p>

          {/* Features */}
          <motion.ul
            variants={list}
            className="mt-8 grid max-w-[460px] grid-cols-1 gap-x-8 min-[420px]:grid-cols-2"
          >
            {features.map((item) => (
              <motion.li
                key={item}
                variants={listItem}
                className="group flex items-center gap-2 border-b border-slate-300 py-3 text-[11px] font-medium text-[#081121] transition-colors duration-300 hover:border-blue-600/60 sm:text-xs"
              >
                {/* Check icon moves slightly right on hover */}
                <FiCheck
                  className="shrink-0 text-blue-600 transition-transform duration-300 group-hover:translate-x-1"
                  aria-hidden="true"
                />
                {item}
              </motion.li>
            ))}
          </motion.ul>
        </motion.div>

        {/* Right image + card */}
        <motion.div
          variants={imageVariant}
          className="relative mx-auto w-full max-w-[340px] sm:max-w-[400px] lg:mx-0 lg:ml-auto lg:max-w-[460px]"
        >
          <div className="relative aspect-[460/480] w-full overflow-hidden rounded-bl-[80px] rounded-br-[20px] rounded-tl-[20px] rounded-tr-[80px] shadow-2xl shadow-black/20 sm:rounded-bl-[120px] sm:rounded-tr-[120px]">
            <Image
              src="/img4.jpg"
              alt="Managed society parking area"
              fill
              sizes="(min-width: 1024px) 460px, 100vw"
              className="object-cover"
            />
          </div>

          {/* Slot card */}
          <motion.article
            variants={slotCardVariant}
            className="absolute bottom-3 right-0 w-[180px] rounded-xl bg-white p-3 shadow-xl shadow-black/20 sm:bottom-5 sm:right-0 sm:w-[210px] sm:p-3.5 lg:bottom-6 lg:right-0 lg:w-[220px]"
          >
            <motion.div
              variants={slotItem}
              className="flex items-start justify-between gap-2"
            >
              <div>
                <p className="text-[7px] font-semibold uppercase tracking-wider text-slate-400 sm:text-[8px]">
                  Parking Slot
                </p>
                <p className="mt-1 text-lg font-bold leading-none text-[#081121] sm:text-xl">
                  P-204
                </p>
              </div>
              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2 py-1 text-[7px] font-bold uppercase tracking-wider text-emerald-600 sm:text-[8px]">
                <FiCheck aria-hidden="true" />
                Assigned
              </span>
            </motion.div>

            <dl className="mt-3 grid grid-cols-3 gap-2">
              {details.map(({ label, value }) => (
                <motion.div key={label} variants={slotItem} className="min-w-0">
                  <dt className="text-[6px] font-semibold uppercase tracking-wider text-slate-400 sm:text-[7px]">
                    {label}
                  </dt>
                  <dd className="mt-0.5 truncate text-[8px] font-semibold text-[#081121] sm:text-[9px]">
                    {value}
                  </dd>
                </motion.div>
              ))}
            </dl>
          </motion.article>
        </motion.div>
      </motion.div>
    </section>
  )
}

export default Parking