'use client'

import { motion, type Variants } from 'framer-motion'
import { FiUsers, FiChevronRight } from 'react-icons/fi'

const steps = [
  'Resident',
  'Complaint',
  'Category',
  'Assigned Staff',
  'Work in Progress',
  'Resolved',
  'Feedback',
]

// Header block: label, heading and paragraph appear one after another
const header: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.15 } },
}

// Text fades in while moving up
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: 'easeOut' } },
}

// Steps list: steps pop in one by one, left to right
const stepsList: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.2 } },
}

const stepItem: Variants = {
  hidden: { opacity: 0, y: 30, scale: 0.8 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
}

// Arrow between steps: slides in from the left after its step appears
const arrowVariant: Variants = {
  hidden: { opacity: 0, x: -10 },
  show: { opacity: 1, x: 0, transition: { duration: 0.4, ease: 'easeOut', delay: 0.2 } },
}

const Complaints = () => {
  return (
    <section className="w-full overflow-hidden bg-[#FDFDFB] py-12 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-[1440px] px-5 sm:px-10 lg:px-24">
        {/* Header: replays every time it enters the screen (scroll up or down) */}
        <motion.div
          variants={header}
          initial="hidden"
          whileInView="show"
          viewport={{ once: false, amount: 0.5 }}
        >
          {/* Small label */}
          <motion.p
            variants={fadeUp}
            className="text-[10px] font-semibold uppercase tracking-widest text-[#081121]"
          >
            Complaints &amp; Helpdesk
          </motion.p>

          {/* Heading */}
          <motion.h2
            variants={fadeUp}
            className="mt-4 max-w-[560px] text-3xl font-bold leading-[1.1] tracking-tight text-[#081121] sm:text-4xl lg:text-5xl"
          >
            From Complaint to Resolution.
          </motion.h2>

          {/* Paragraph */}
          <motion.p
            variants={fadeUp}
            className="mt-5 max-w-[520px] text-xs leading-6 text-slate-500 sm:text-sm"
          >
            Give residents a clear way to raise issues and give management a
            structured way to assign, track and resolve them.
          </motion.p>
        </motion.div>

        {/* Steps: also replays on every scroll */}
        <motion.ol
          variants={stepsList}
          initial="hidden"
          whileInView="show"
          viewport={{ once: false, amount: 0.3 }}
          className="mt-10 grid grid-cols-1 gap-x-3 gap-y-8 min-[360px]:grid-cols-2 sm:mt-14 sm:grid-cols-4 lg:mt-16 lg:flex lg:items-start lg:justify-between lg:gap-2"
        >
          {steps.map((label, i) => (
            <motion.li
              key={label}
              variants={stepItem}
              className="group relative flex min-w-0 flex-col items-center gap-3 text-center lg:flex-1"
            >
              {/* Icon circle: turns solid blue and lifts up on hover */}
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-100 text-lg text-blue-600 transition-all duration-300 group-hover:-translate-y-1.5 group-hover:bg-blue-600 group-hover:text-white group-hover:shadow-lg group-hover:shadow-blue-600/30 lg:h-12 lg:w-12 lg:text-xl">
                <FiUsers aria-hidden="true" />
              </div>

              <span className="text-[11px] font-semibold leading-tight text-[#081121] transition-colors duration-300 group-hover:text-blue-600 sm:text-xs">
                {label}
              </span>

              {/* Arrow: desktop only, not after the last item */}
              {i < steps.length - 1 && (
                <motion.span
                  variants={arrowVariant}
                  aria-hidden="true"
                  className="absolute right-0 top-[14px] hidden translate-x-1/2 lg:block"
                >
                  <FiChevronRight className="text-base text-slate-400" />
                </motion.span>
              )}
            </motion.li>
          ))}
        </motion.ol>
      </div>
    </section>
  )
}

export default Complaints