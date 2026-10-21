'use client'

import Image from 'next/image'
import Link from 'next/link'
import { motion, type Variants } from 'framer-motion'
import {
  FiArrowRight,
  FiInstagram,
  FiLinkedin,
  FiMail,
} from 'react-icons/fi'

type FooterColumn = {
  title: string
  links: { label: string; href: string }[]
}

const columns: FooterColumn[] = [
  {
    title: 'Platform',
    links: [
      { label: 'Society Management', href: '#' },
      { label: 'Resident Management', href: '#' },
      { label: 'Security', href: '#' },
      { label: 'Finance', href: '#' },
      { label: 'Billing', href: '#' },
      { label: 'Helpdesk', href: '#' },
      { label: 'Amenities', href: '#' },
      { label: 'Parking', href: '#' },
    ],
  },
  {
    title: 'Solutions',
    links: [
      { label: 'For Society Management', href: '#' },
      { label: 'For Committees', href: '#' },
      { label: 'For Residents', href: '#' },
      { label: 'For Security Teams', href: '#' },
      { label: 'For Staff & Vendors', href: '#' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '#' },
      { label: 'Contact', href: '#' },
      { label: 'Careers', href: '#' },
      { label: 'Resources', href: '#' },
      { label: 'Book a Demo', href: '#' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy', href: '#' },
      { label: 'Terms', href: '#' },
      { label: 'Security', href: '#' },
      { label: 'Data Protection', href: '#' },
    ],
  },
]

const socials = [
  { label: 'LinkedIn', href: '#', icon: FiLinkedin },
  { label: 'Instagram', href: '#', icon: FiInstagram },
  { label: 'Email', href: '#', icon: FiMail },
]

const tagline = ['One Society', 'One Platform', 'One Database.']

// public/logo (2).png (%20 is used because of the space in the file name)
const LOGO_SRC = '/logo%20(2).png'

// Smooth "expo-out" curve: starts fast, settles softly
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]

// Top grid: brand and columns appear one after another
const grid: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.12 } },
}

// Brand block: fades in, moves up and clears from a soft blur
const brand: Variants = {
  hidden: { opacity: 0, y: 30, filter: 'blur(6px)' },
  show: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { duration: 0.9, ease: EASE },
  },
}

// Each column fades in first, then its links follow one by one
const column: Variants = {
  hidden: { opacity: 0, y: 30, filter: 'blur(6px)' },
  show: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      duration: 0.9,
      ease: EASE,
      staggerChildren: 0.05,
      delayChildren: 0.15,
    },
  },
}

// Single link inside a column
const linkItem: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
}

// Bottom bar: copyright and socials appear one after another
const bottom: Variants = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.8,
      ease: EASE,
      staggerChildren: 0.1,
      delayChildren: 0.1,
    },
  },
}

// Small items inside the bottom bar
const bottomItem: Variants = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.6, ease: EASE } },
}

const Footer = () => {
  return (
    <footer className="w-full overflow-hidden bg-[#02040E]">
      <div className="mx-auto max-w-[1440px] px-5 pb-4 pt-8 sm:px-10 sm:pt-10 lg:px-24 lg:pt-12">
        {/* Top: brand + link columns (replays every time it enters the screen) */}
        <motion.div
          variants={grid}
          initial="hidden"
          whileInView="show"
          viewport={{ once: false, amount: 0.2 }}
          className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4 lg:grid-cols-[2.4fr_1fr_1fr_1fr_1fr]"
        >
          {/* Brand */}
          <motion.div
            variants={brand}
            className="col-span-2 sm:col-span-4 lg:col-span-1"
          >
            <Link href="/" className="inline-flex items-center gap-2">
              <Image
                src={LOGO_SRC}
                alt="SocietyOS logo"
                width={24}
                height={24}
                className="h-6 w-6 object-contain"
              />
              <span className="text-sm font-bold text-white">
                Society<span className="text-[#2563EB]">OS</span>
              </span>
            </Link>

            <ul className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-white/60 sm:text-[11px]">
              {tagline.map((item, i) => (
                <li key={item} className="flex items-center gap-2">
                  {item}
                  {i < tagline.length - 1 && (
                    <FiArrowRight className="text-[#3B82F6]" aria-hidden="true" />
                  )}
                </li>
              ))}
            </ul>
          </motion.div>

          {/* Link columns */}
          {columns.map(({ title, links }) => (
            <motion.nav key={title} variants={column} aria-label={title}>
              <h3 className="text-[9px] font-medium uppercase tracking-[0.2em] text-[#3B82F6]">
                {title}
              </h3>

              <ul className="mt-3 space-y-2">
                {links.map(({ label, href }) => (
                  <motion.li key={label} variants={linkItem}>
                    <Link
                      href={href}
                      className="text-[11px] text-white/60 transition hover:text-white sm:text-xs"
                    >
                      {label}
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </motion.nav>
          ))}
        </motion.div>

        {/* Bottom bar (replays every time it enters the screen) */}
        <motion.div
          variants={bottom}
          initial="hidden"
          whileInView="show"
          viewport={{ once: false, amount: 0.5 }}
          className="mt-8 flex flex-col-reverse items-start justify-between gap-4 border-t border-white/10 pt-4 sm:mt-10 sm:flex-row sm:items-center"
        >
          <motion.p
            variants={bottomItem}
            className="text-[10px] text-white/40 sm:text-[11px]"
          >
            © 2026 SocietyOS. All rights reserved.
          </motion.p>

          <ul className="flex items-center gap-2">
            {socials.map(({ label, href, icon: Icon }) => (
              <motion.li key={label} variants={bottomItem}>
                <Link
                  href={href}
                  aria-label={label}
                  className="flex h-7 w-7 items-center justify-center rounded-full border border-white/10 text-white/80 transition hover:border-[#3B82F6] hover:text-white"
                >
                  <Icon size={12} aria-hidden="true" />
                </Link>
              </motion.li>
            ))}
          </ul>
        </motion.div>
      </div>
    </footer>
  )
}

export default Footer