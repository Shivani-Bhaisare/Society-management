'use client'

import Image from 'next/image'
import { motion, type Variants } from 'framer-motion'

const problems = [
  'Visitor records kept in physical registers.',
  'Maintenance tracked across multiple spreadsheets.',
  'Complaints buried in WhatsApp group chats.',
  'Staff information scattered across loose files.',
  'Residents unsure about their payment status.',
  'Vendor documents difficult to locate and verify.',
  'Committee members juggling multiple tools.',
]

// Left column: label, heading, paragraph, list and bottom line appear one after another
const leftColumn: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
}

// Text blocks fade in while moving up
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: 'easeOut' } },
}

// Bullet list: each bullet slides in from the left, one by one
const list: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
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

const Problem = () => {
  return (
    <section className="w-full overflow-hidden bg-[#081121] py-14">
      {/* Animation replays every time this block enters the screen (scroll up or down) */}
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: false, amount: 0.3 }}
        className="mx-auto grid max-w-[1440px] items-center gap-12 px-10 lg:grid-cols-2 lg:px-24"
      >
        {/* Left: text */}
        <motion.div variants={leftColumn}>
          {/* Small label */}
          <motion.p
            variants={fadeUp}
            className="text-[10px] font-medium uppercase tracking-widest text-white/80"
          >
            The Problem
          </motion.p>

          {/* Heading */}
          <motion.h2
            variants={fadeUp}
            className="mt-4 max-w-[520px] text-4xl font-bold leading-[1.1] text-white lg:text-5xl"
          >
            Society Management Shouldn’t Feel Fragmented.
          </motion.h2>

          {/* Paragraph */}
          <motion.p
            variants={fadeUp}
            className="mt-4 max-w-[420px] text-sm leading-6 text-white/80"
          >
            The daily work of a society is connected. The tools used to run it
            rarely are.
          </motion.p>

          {/* Bullet list */}
          <motion.ul variants={list} className="mt-5 space-y-2.5">
            {problems.map((item) => (
              <motion.li
                key={item}
                variants={listItem}
                className="flex items-center gap-3 text-xs text-white/70"
              >
                <span className="h-1 w-1 shrink-0 rounded-full bg-[#2563EB]" />
                {item}
              </motion.li>
            ))}
          </motion.ul>

          {/* Bottom line with left border */}
          <motion.p
            variants={fadeUp}
            className="mt-5 border-l border-white/30 pl-3 text-xs font-medium text-white"
          >
            SocietyOS brings these workflows together.
          </motion.p>
        </motion.div>

        {/* Right: image */}
        <motion.div
          variants={imageVariant}
          className="relative mx-auto w-full max-w-[340px] sm:max-w-[400px] lg:mx-0 lg:ml-auto lg:max-w-[460px]"
        >
          {/* Image lifts up slightly on hover */}
          <div className="relative aspect-[460/480] w-full overflow-hidden rounded-tl-[20px] rounded-tr-[80px] rounded-br-[20px] rounded-bl-[80px] shadow-2xl shadow-black/20 transition-transform duration-500 hover:-translate-y-2 sm:rounded-tr-[120px] sm:rounded-bl-[120px]">
            <Image
              src="/img43.png"
              alt="Fragmented society management"
              fill
              sizes="(min-width: 1024px) 520px, 100vw"
              className="object-cover"
            />
          </div>
        </motion.div>
      </motion.div>
    </section>
  )
}

export default Problem