'use client'

import Image from 'next/image'
import { motion, type Variants } from 'framer-motion'

const phones = [
  {
    src: '/img44.jpeg',
    alt: 'SocietyOS welcome screen',
    className: '-rotate-[6deg] lg:-rotate-[8deg] lg:translate-y-6 z-10',
  },
  {
    src: '/img45.jpeg',
    alt: 'SocietyOS login screen',
    className: '-rotate-[2deg] lg:-rotate-[3deg] lg:-translate-y-2 z-20',
  },
  {
    src: '/img46.jpeg',
    alt: 'SocietyOS community features screen',
    className: 'rotate-[2deg] lg:rotate-[3deg] lg:-translate-y-2 z-20',
  },
  {
    src: '/img48.jpeg',
    alt: 'SocietyOS security guard screen',
    className: 'rotate-[6deg] lg:rotate-[8deg] lg:translate-y-6 z-10',
  },
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

// Phones row: phones rise up one by one
const phonesRow: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.15, delayChildren: 0.3 } },
}

// The animation is on a wrapper so it does not clash with the tilt (rotate/translate)
// classes applied to the inner phone element
const phoneItem: Variants = {
  hidden: { opacity: 0, y: 80, scale: 0.9 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.8, ease: 'easeOut' },
  },
}

const Residents = () => {
  return (
    <section className="w-full overflow-hidden bg-[#081121] py-12 sm:py-16 lg:py-20">
      {/* Animation replays every time this block enters the screen (scroll up or down) */}
      <motion.div
        variants={header}
        initial="hidden"
        whileInView="show"
        viewport={{ once: false, amount: 0.25 }}
        className="mx-auto max-w-[1440px] px-5 text-center sm:px-10 lg:px-24"
      >
        {/* Small label */}
        <motion.p
          variants={fadeUp}
          className="text-[10px] font-semibold uppercase tracking-widest text-white/80"
        >
          For Residents
        </motion.p>

        {/* Heading */}
        <motion.h2
          variants={fadeUp}
          className="mx-auto mt-4 max-w-[760px] text-3xl font-bold leading-[1.1] text-white sm:text-4xl lg:text-5xl"
        >
          Everything Residents Need.
          <span className="block">Right at Their Fingertips.</span>
        </motion.h2>

        {/* Paragraph */}
        <motion.p
          variants={fadeUp}
          className="mx-auto mt-5 max-w-[460px] text-xs leading-6 text-white/70 sm:text-sm"
        >
          Give residents one simple place to manage everyday community
          activities.
        </motion.p>

        {/* Phones images */}
        <motion.div
          variants={phonesRow}
          className="mx-auto mt-12 grid w-full max-w-[420px] grid-cols-2 items-center gap-x-6 gap-y-10 pb-10 sm:mt-16 sm:max-w-[640px] sm:gap-x-8 md:max-w-[880px] md:grid-cols-4 md:gap-x-8 lg:max-w-[1100px] lg:gap-x-10 lg:pb-14"
        >
          {phones.map(({ src, alt, className }) => (
            <motion.div key={src} variants={phoneItem} className="w-full">
              {/* Inner element keeps the tilt, shadow and hover zoom */}
              <div
                className={`relative aspect-[9/16] w-full origin-bottom overflow-hidden rounded-3xl shadow-2xl shadow-black/40 transition-transform duration-300 hover:scale-[1.03] ${className}`}
              >
                <Image
                  src={src}
                  alt={alt}
                  fill
                  sizes="(min-width: 1024px) 260px, (min-width: 768px) 22vw, 45vw"
                  className="object-cover object-top"
                />
              </div>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </section>
  )
}

export default Residents