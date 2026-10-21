'use client'

import Image from 'next/image'
import { motion, type Variants } from 'framer-motion'
import { FiArrowRight } from 'react-icons/fi'
import Button from './Button'

// Night building image (public/img11.jpg)
const CTA_IMAGE = '/img11.jpg'

// Content block: label, heading, paragraph and buttons appear one after another
const content: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.15 } },
}

// Fades in while moving up
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: 'easeOut' } },
}

const CTA = () => {
  return (
    <section className="relative w-full overflow-hidden bg-[#000104]">
      {/* Fixed background image (stays in place while the page scrolls) */}
      <div className="absolute inset-0 [clip-path:inset(0)]">
        <div className="fixed inset-0 h-screen w-full">
          <Image
            src={CTA_IMAGE}
            alt=""
            fill
            priority
            sizes="100vw"
            className="object-cover object-[70%_center] lg:object-center"
          />
        </div>
      </div>

      {/* Dark overlays (left side dark, image visible on the right) */}
      <div className="absolute inset-0 bg-[#000104]/70 lg:bg-transparent" />
      <div className="absolute inset-0 bg-gradient-to-r from-[#000104] via-[#000104]/85 to-transparent lg:via-[#000104]/80 lg:to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-[#000104] to-transparent" />

      {/* Content */}
      <div className="relative mx-auto flex min-h-[520px] max-w-[1440px] items-center px-5 py-16 sm:min-h-[600px] sm:px-10 sm:py-20 lg:min-h-[720px] lg:px-24">
        {/* Replays every time it enters the screen (scroll up or down) */}
        <motion.div
          variants={content}
          initial="hidden"
          whileInView="show"
          viewport={{ once: false, amount: 0.3 }}
          className="max-w-[780px]"
        >
          {/* Small label */}
          <motion.p
            variants={fadeUp}
            className="text-[10px] font-medium uppercase tracking-[0.2em] text-white/70 sm:text-[11px]"
          >
            Complete Society Operating System
          </motion.p>

          {/* Main heading */}
          <motion.h2
            variants={fadeUp}
            className="mt-4 text-4xl font-medium leading-[1.1] tracking-tight text-white sm:text-5xl lg:mt-5 lg:text-[64px]"
          >
            Your Society.
            <br />
            One Connected
            <br />
            Operating System.
          </motion.h2>

          {/* Paragraph */}
          <motion.p
            variants={fadeUp}
            className="mt-5 max-w-[480px] text-xs leading-5 text-white/70 sm:text-sm sm:leading-6 lg:mt-6"
          >
            Bring security, finance, residents, operations and community
            services together with SocietyOS.
          </motion.p>

          {/* Buttons */}
          <motion.div
            variants={fadeUp}
            className="mt-7 flex flex-wrap items-center gap-3 lg:mt-8"
          >
            <Button
              href="#"
              variant="primary"
              className="!rounded-md !px-4 !py-2.5 !text-xs shadow-[0_0_24px_rgba(37,99,235,0.45)]"
            >
              Book a Demo
              <FiArrowRight aria-hidden="true" />
            </Button>

            <Button
              href="#"
              variant="outline"
              className="!rounded-md !border-white/15 !bg-black/40 !px-4 !py-2.5 !text-xs"
            >
              Explore the Platform
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}

export default CTA