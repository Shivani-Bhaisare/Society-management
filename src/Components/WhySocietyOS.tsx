'use client'

import { motion, type Variants } from 'framer-motion'

type Reason = {
  no: string
  title: string
  desc: string
}

const reasons: Reason[] = [
  {
    no: '01',
    title: 'One Source of Truth',
    desc: 'All society information — residents, finance, operations, security — lives in one connected system, not across tools.',
  },
  {
    no: '02',
    title: 'Less Manual Work',
    desc: 'Replace repetitive registers, spreadsheets and paper processes with structured digital workflows.',
  },
  {
    no: '03',
    title: 'Clearer Operations',
    desc: "Every team gets visibility into their responsibilities — without interfering with what doesn't belong to them.",
  },
  {
    no: '04',
    title: 'Better Resident Experience',
    desc: 'Make everyday community services — payments, visitors, complaints — simple and accessible for every resident.',
  },
]

// Header block: label and heading appear one after another
const header: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.15 } },
}

// Text fades in while moving up
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: 'easeOut' } },
}

// Cards grid: cards pop in one by one
const grid: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
}

const card: Variants = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.6, ease: 'easeOut' },
  },
}

const WhySocietyOS = () => {
  return (
    <section className="w-full overflow-hidden bg-[#FDFDFC] py-12 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-[1440px] px-5 sm:px-10 lg:px-24">
        {/* Heading: replays every time it enters the screen (scroll up or down) */}
        <motion.div
          variants={header}
          initial="hidden"
          whileInView="show"
          viewport={{ once: false, amount: 0.5 }}
        >
          {/* Small label */}
          <motion.p
            variants={fadeUp}
            className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 sm:text-[11px]"
          >
            Why SocietyOS
          </motion.p>

          {/* Main heading */}
          <motion.h2
            variants={fadeUp}
            className="mt-3 max-w-[640px] text-3xl font-bold leading-[1.1] tracking-tight text-[#0B1330] sm:text-4xl lg:mt-4 lg:text-[56px]"
          >
            Designed Around How Societies Actually Work.
          </motion.h2>
        </motion.div>

        {/* Cards: also replay on every scroll */}
        <motion.ul
          variants={grid}
          initial="hidden"
          whileInView="show"
          viewport={{ once: false, amount: 0.15 }}
          className="mt-8 grid grid-cols-1 gap-3 sm:mt-10 sm:grid-cols-2 lg:mt-12 lg:gap-4"
        >
          {reasons.map(({ no, title, desc }) => (
            <motion.li
              key={no}
              variants={card}
              className="rounded-md bg-[#F8FAFD] p-5 transition-colors duration-300 hover:bg-[#F1F5FC] sm:p-6"
            >
              {/* Number */}
              <span className="block text-4xl font-light leading-none text-[#8FA8F5] sm:text-[44px]">
                {no}
              </span>

              {/* Title */}
              <h3 className="mt-4 text-[11px] font-semibold uppercase tracking-tight text-[#0B1330] sm:text-xs">
                {title}
              </h3>

              {/* Description */}
              <p className="mt-2 max-w-[460px] text-xs leading-5 text-slate-500">
                {desc}
              </p>
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </section>
  )
}

export default WhySocietyOS