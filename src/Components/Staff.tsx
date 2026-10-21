'use client'

import Image from 'next/image'
import { motion, type Variants } from 'framer-motion'
import { FiCheck } from 'react-icons/fi'

const features = [
  'Staff Profiles',
  'Attendance',
  'Tasks',
  'Vendor Records',
  'Contracts',
  'Documents',
  'Service History',
  'Renewal Reminders',
]

const people = [
  {
    type: 'Security',
    role: 'Security Guard',
    name: 'Raj Kumar',
    status: 'Morning Shift - On Duty',
    image: '/img41.jpg',
  },
  {
    type: 'Staff',
    role: 'Maintenance',
    name: 'Suresh Patel',
    status: 'Morning Shift - On Duty',
    image: '/img5 (2).png',
  },
  {
    type: 'Vendor',
    role: 'AMC Vendor',
    name: 'Abhishek Kumar',
    status: 'Contract active',
    image: '/img42.jpg',
  },
]

// Left column: label, heading and paragraph appear one after another
const leftColumn: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.15 } },
}

// Text blocks fade in while moving up
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: 'easeOut' } },
}

// Feature list: each item slides in from the right, one by one
const list: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.2 } },
}

const listItem: Variants = {
  hidden: { opacity: 0, x: 24 },
  show: { opacity: 1, x: 0, transition: { duration: 0.5, ease: 'easeOut' } },
}

// Cards grid: cards rise up one by one
const cardsGrid: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.15, delayChildren: 0.1 } },
}

const cardVariant: Variants = {
  hidden: { opacity: 0, y: 50, scale: 0.95 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.7, ease: 'easeOut' },
  },
}

const Staff = () => {
  return (
    <section className="w-full overflow-hidden bg-[#FDFDFB] py-12 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-[1440px] px-5 sm:px-10 lg:px-24">
        {/* Top row: replays every time it enters the screen (scroll up or down) */}
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={{ once: false, amount: 0.3 }}
          className="grid items-end gap-10 lg:grid-cols-2 lg:gap-16"
        >
          {/* Left content */}
          <motion.div variants={leftColumn}>
            <motion.p
              variants={fadeUp}
              className="text-[10px] font-semibold uppercase tracking-widest text-slate-500"
            >
              Staff &amp; Vendor Management
            </motion.p>

            <motion.h2
              variants={fadeUp}
              className="mt-4 max-w-[520px] text-3xl font-bold leading-[1.1] tracking-tight text-[#081121] sm:text-4xl lg:text-5xl"
            >
              Know Your People. Manage Your Operations..
            </motion.h2>

            <motion.p
              variants={fadeUp}
              className="mt-5 max-w-[440px] text-xs leading-6 text-slate-500 sm:text-sm"
            >
              Keep staff, service providers and vendors organized with clear
              records, responsibilities and service history.
            </motion.p>
          </motion.div>

          {/* Features */}
          <motion.ul
            variants={list}
            className="grid w-full max-w-[460px] grid-cols-1 gap-x-8 min-[420px]:grid-cols-2 lg:ml-auto"
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

        {/* Cards: also replays on every scroll */}
        <motion.div
          variants={cardsGrid}
          initial="hidden"
          whileInView="show"
          viewport={{ once: false, amount: 0.2 }}
          className="mt-10 grid grid-cols-1 gap-4 sm:mt-14 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5"
        >
          {people.map((person) => (
            <motion.article
              key={person.name}
              variants={cardVariant}
              className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg shadow-black/5 transition-[translate,box-shadow] duration-300 hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-600/10"
            >
              {/* Image zooms slightly on card hover */}
              <div className="relative aspect-[4/2.7] w-full overflow-hidden">
                <Image
                  src={person.image}
                  alt={`${person.name}, ${person.role}`}
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              </div>

              <div className="p-3.5 sm:p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[8px] font-bold uppercase tracking-wider text-blue-600">
                    {person.type}
                  </span>
                  <span className="text-[9px] text-slate-400">
                    {person.role}
                  </span>
                </div>

                <h3 className="mt-2 text-sm font-semibold text-[#081121]">
                  {person.name}
                </h3>

                <p className="mt-2 flex items-center gap-1.5 text-[9px] text-slate-500">
                  <span
                    className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500"
                    aria-hidden="true"
                  />
                  {person.status}
                </p>
              </div>
            </motion.article>
          ))}
        </motion.div>
      </div>
    </section>
  )
}

export default Staff