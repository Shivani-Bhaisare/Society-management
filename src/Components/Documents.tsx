'use client'

import { motion, type Variants } from 'framer-motion'
import { FiFileText, FiCheckCircle } from 'react-icons/fi'

const docs = [
  'Society Registration',
  'AGM Minutes',
  'Audit Reports',
  'Vendor Agreement',
  'AMC Documents',
  'Insurance',
  'Society Rules',
  'Invoices',
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

// Documents visual: the cards and the list panel appear one after another
const visual: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.15, delayChildren: 0.2 } },
}

// Back cards: fan out from behind the front card
const backCard: Variants = {
  hidden: { opacity: 0, x: -50, y: 20 },
  show: {
    opacity: 1,
    x: 0,
    y: 0,
    transition: { duration: 0.7, ease: 'easeOut' },
  },
}

// Front card: rises up with a slight zoom
const frontCard: Variants = {
  hidden: { opacity: 0, y: 50, scale: 0.9 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.8,
      ease: 'easeOut',
      when: 'beforeChildren',
    },
  },
}

// Dark list panel: slides in from the right, then its rows follow one by one
const panel: Variants = {
  hidden: { opacity: 0, x: 60 },
  show: {
    opacity: 1,
    x: 0,
    transition: {
      duration: 0.8,
      ease: 'easeOut',
      when: 'beforeChildren',
      staggerChildren: 0.07,
    },
  },
}

const panelItem: Variants = {
  hidden: { opacity: 0, x: 16 },
  show: { opacity: 1, x: 0, transition: { duration: 0.4, ease: 'easeOut' } },
}

const Documents = () => {
  return (
    <section className="w-full overflow-hidden bg-[#F9F6F2] py-12 sm:py-16 lg:py-20">
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
            Documents &amp; Compliance
          </motion.p>

          <motion.h2
            variants={fadeUp}
            className="mt-4 max-w-[420px] text-3xl font-bold leading-[1.1] tracking-tight text-[#081121] sm:text-4xl lg:text-5xl"
          >
            Every Important Record. Organized.
          </motion.h2>

          <motion.p
            variants={fadeUp}
            className="mt-5 max-w-[420px] text-xs leading-6 text-slate-500 sm:text-sm"
          >
            Keep society documents, agreements, invoices, notices and
            operational records accessible from one secure place.
          </motion.p>
        </motion.div>

        {/* Documents visual */}
        <motion.div
          variants={visual}
          className="relative mx-auto h-[234px] w-[302px] min-[480px]:h-[340px] min-[480px]:w-[440px] sm:h-[425px] sm:w-[550px] lg:mx-0 lg:ml-auto"
        >
          {/* Stage: 550 x 425, scales down on small screens */}
          <div className="absolute left-0 top-0 h-[425px] w-[550px] origin-top-left scale-[0.55] min-[480px]:scale-[0.8] sm:scale-100">
            {/*
              Each card has an outer motion wrapper (position + animation) and an inner
              element that keeps the Tailwind tilt, so the two transforms never clash.
            */}

            {/* Back cards */}
            <motion.div
              variants={backCard}
              className="absolute left-[190px] top-[12px] h-[288px] w-[212px]"
            >
              <div className="relative h-full w-full rotate-[14deg] rounded-xl bg-white shadow-md shadow-black/10">
                <span className="absolute right-4 top-4 text-[10px] font-bold text-blue-600">
                  PDF
                </span>
              </div>
            </motion.div>

            <motion.div
              variants={backCard}
              className="absolute left-[150px] top-[8px] h-[288px] w-[212px]"
            >
              <div className="relative h-full w-full rotate-[9deg] rounded-xl bg-white shadow-md shadow-black/10">
                <span className="absolute right-4 top-4 text-[10px] font-bold text-blue-600">
                  PDF
                </span>
              </div>
            </motion.div>

            <motion.div
              variants={backCard}
              className="absolute left-[106px] top-[3px] h-[288px] w-[212px]"
            >
              <div className="relative h-full w-full rotate-[4deg] rounded-xl bg-white shadow-md shadow-black/10">
                <span className="absolute right-4 top-4 text-[10px] font-bold text-blue-600">
                  PDF
                </span>
              </div>
            </motion.div>

            {/* Front card */}
            <motion.div
              variants={frontCard}
              className="absolute left-[25px] top-[12px] h-[300px] w-[225px]"
            >
              <article className="relative h-full w-full -rotate-[4deg] rounded-xl bg-white p-5 shadow-xl shadow-black/15 transition-transform duration-300 hover:-rotate-[2deg] hover:scale-[1.03]">
                <div className="flex items-start justify-between">
                  <span className="flex h-8 w-8 items-center justify-center rounded-md bg-blue-100 text-sm text-blue-600">
                    <FiFileText aria-hidden="true" />
                  </span>
                  <span className="text-[10px] font-bold text-blue-600">PDF</span>
                </div>

                <h3 className="mt-6 text-sm font-semibold text-[#081121]">
                  Society Registration
                </h3>
                <p className="mt-1 text-[9px] text-slate-400">
                  Updated 15 Sep 2026
                </p>

                <div className="mt-6 space-y-2.5" aria-hidden="true">
                  <div className="h-1 w-full rounded bg-slate-200" />
                  <div className="h-1 w-4/5 rounded bg-slate-200" />
                  <div className="h-1 w-3/5 rounded bg-slate-200" />
                </div>

                <p className="absolute bottom-5 left-5 flex items-center gap-1 text-[9px] font-medium text-emerald-600">
                  <FiCheckCircle aria-hidden="true" />
                  Verified
                </p>
              </article>
            </motion.div>

            {/* Dark list panel */}
            <motion.div
              variants={panel}
              className="absolute bottom-0 right-0 w-[188px] overflow-hidden rounded-xl bg-[#081121] shadow-2xl shadow-black/30"
            >
              <ul>
                {docs.map((item) => (
                  <motion.li
                    key={item}
                    variants={panelItem}
                    className="flex items-center gap-2 border-b border-white/10 px-3.5 py-[11px] text-[9px] text-white/85 transition-colors duration-300 last:border-b-0 hover:bg-white/5 hover:text-white"
                  >
                    <FiFileText
                      className="shrink-0 text-blue-400"
                      aria-hidden="true"
                    />
                    {item}
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>
    </section>
  )
}

export default Documents