'use client'

import { motion, type Variants } from 'framer-motion'

type Step = {
  no: string
  title: string
  desc: string
}

const steps: Step[] = [
  {
    no: '01',
    title: 'Setup',
    desc: 'Create your society structure and essential records.',
  },
  {
    no: '02',
    title: 'Connect',
    desc: 'Bring residents, staff, security, finance and operations together.',
  },
  {
    no: '03',
    title: 'Digitize',
    desc: 'Move everyday workflows from manual processes to digital.',
  },
  {
    no: '04',
    title: 'Operate',
    desc: 'Run your society through one connected platform.',
  },
]

// Heading block: label and heading appear one after another
const header: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.15 } },
}

// Text fades in while moving up
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: 'easeOut' } },
}

// Steps grid: cards rise up one by one, left to right
const grid: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.15, delayChildren: 0.1 } },
}

const card: Variants = {
  hidden: { opacity: 0, y: 50, scale: 0.95 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.7, ease: 'easeOut' },
  },
}

const HowItWorks = () => {
  return (
    <section className="w-full overflow-hidden  bg-[#F8FAFD] py-12 sm:py-14 lg:py-16">
      <div className="mx-auto max-w-[1440px] px-5 sm:px-10 lg:px-24">
        {/* Heading: replays every time it enters the screen (scroll up or down) */}
        <motion.div
          variants={header}
          initial="hidden"
          whileInView="show"
          viewport={{ once: false, amount: 0.5 }}
        >
          <motion.p
            variants={fadeUp}
            className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 sm:text-[11px]"
          >
            How SocietyOS Work
          </motion.p>

          <motion.h2
            variants={fadeUp}
            className="mt-3 max-w-[560px] text-3xl font-bold leading-[1.1] tracking-tight text-[#0B1330] sm:text-4xl lg:mt-4 lg:text-[44px]"
          >
            From Setup to Connected Operations.
          </motion.h2>
        </motion.div>

        {/* Steps: also replays on every scroll */}
        <motion.ul
          variants={grid}
          initial="hidden"
          whileInView="show"
          viewport={{ once: false, amount: 0.2 }}
          className="mt-8 grid grid-cols-1 gap-4 sm:mt-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5"
        >
          {steps.map(({ no, title, desc }) => (
            <motion.li
              key={no}
              variants={card}
              className="group rounded-bl-[28px] rounded-br-lg rounded-tl-lg rounded-tr-[28px] bg-[#FAFAF5] p-5 shadow-[0_2px_10px_rgba(15,23,42,0.05)] transition-[translate,background-color,box-shadow] duration-300 hover:-translate-y-2 hover:bg-white hover:shadow-[0_8px_30px_rgba(37,99,235,0.15)] sm:p-6"
            >
              {/* Number: turns a stronger blue on card hover */}
              <span className="block text-4xl font-light leading-none text-[#8FA8F5] transition-colors duration-300 group-hover:text-[#2563EB] sm:text-[44px]">
                {no}
              </span>

              {/* Title */}
              <h3 className="mt-4 text-[10px] font-bold uppercase tracking-wider text-[#0B1330] sm:text-[11px]">
                {title}
              </h3>

              {/* Description */}
              <p className="mt-2 text-xs leading-5 text-gray-500">{desc}</p>
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </section>
  )
}

export default HowItWorks