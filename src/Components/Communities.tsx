'use client'

import Image from 'next/image'
import { motion, type Variants } from 'framer-motion'

type Community = {
  label: string
  src: string
}

const communities: Community[] = [
  { label: 'Multi-Tower Communities', src: '/img6%20(2).png' },
  { label: 'RWAs', src: '/img7%20(2).png' },
  { label: 'Gated Communities', src: '/img8.png' },
  { label: 'Large Townships', src: '/img9.png' },
  { label: 'Residential Complexes', src: '/img10.png' },
  { label: 'Apartment Societies', src: '/img40.png' },
]

// Heading block: label, heading and paragraph appear one after another
const header: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.15 } },
}

// Text fades in while moving up
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: 'easeOut' } },
}

// Image grid: images rise up one by one
const grid: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
}

const imageCard: Variants = {
  hidden: { opacity: 0, y: 50, scale: 0.94 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.7, ease: 'easeOut' },
  },
}

const Communities = () => {
  return (
    <section className="w-full overflow-hidden bg-[#F8FAFD] py-12 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-[1440px] px-5 sm:px-10 lg:px-24">
        {/* Heading: replays every time it enters the screen (scroll up or down) */}
        <motion.div
          variants={header}
          initial="hidden"
          whileInView="show"
          viewport={{ once: false, amount: 0.5 }}
          className="text-center"
        >
          <motion.p
            variants={fadeUp}
            className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 sm:text-[11px]"
          >
            Built for Every Society
          </motion.p>

          <motion.h2
            variants={fadeUp}
            className="mx-auto mt-3 max-w-[720px] text-3xl font-bold leading-[1.1] tracking-tight text-[#0B1330] sm:text-4xl lg:mt-4 lg:text-[56px]"
          >
            Built for Communities of Every Scale.
          </motion.h2>

          <motion.p
            variants={fadeUp}
            className="mx-auto mt-4 max-w-[520px] text-xs leading-5 text-slate-500 sm:text-sm sm:leading-6 lg:mt-5"
          >
            Whether you manage a single residential community or multiple
            properties, SocietyOS gives you a connected operational foundation.
          </motion.p>
        </motion.div>

        {/* Image grid: also replays on every scroll */}
        <motion.ul
          variants={grid}
          initial="hidden"
          whileInView="show"
          viewport={{ once: false, amount: 0.15 }}
          className="mt-8 grid grid-cols-1 gap-3 sm:mt-10 sm:grid-cols-2 lg:mt-14 lg:grid-cols-3 lg:gap-4"
        >
          {communities.map(({ label, src }) => (
            <motion.li
              key={label}
              variants={imageCard}
              className="group relative aspect-[16/10] overflow-hidden rounded-md sm:aspect-[4/3]"
            >
              {/* Image zooms slightly on hover */}
              <Image
                src={src}
                alt={label}
                fill
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />

              {/* Bottom gradient for label readability */}
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 to-transparent" />

              {/* Label slides up slightly on hover */}
              <span className="absolute bottom-3 left-3 text-[11px] font-medium text-white transition-transform duration-300 group-hover:-translate-y-1 sm:bottom-3.5 sm:left-4 sm:text-xs">
                {label}
              </span>
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </section>
  )
}

export default Communities