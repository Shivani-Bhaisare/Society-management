'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, type Variants } from 'framer-motion'
import Button from '../Components/Button'

// Each link points to a section id on the home page (Home = hero section)
const links = [
  { label: 'Home', href: '/#home' },
  { label: 'Platform', href: '/#platform' },
  { label: 'Solutions', href: '/#solutions' },
  { label: 'For Residents', href: '/#residents' },
  { label: 'For Management', href: '/#management' },
  { label: 'Resources', href: '/#resources' },
]

// public/logo (2).png (%20 is used because of the space in the file name)
const LOGO_SRC = '/logo%20(2).png'

// Navbar slides down from the top on page load, then its children appear one by one
const navVariants: Variants = {
  hidden: { opacity: 0, y: -30 },
  show: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.7,
      ease: 'easeOut',
      when: 'beforeChildren',
      staggerChildren: 0.08,
    },
  },
}

// Each child (logo, link, right side) fades in and moves down slightly
const itemVariants: Variants = {
  hidden: { opacity: 0, y: -12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } },
}

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false)

  // Shrink the navbar height once the page is scrolled
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <motion.nav
      variants={navVariants}
      initial="hidden"
      animate="show"
      className="fixed left-0 top-0 z-50 w-full bg-transparent"
    >
      <div
        className={`mx-auto flex max-w-[1440px] items-center justify-between px-10 transition-all duration-300 ${
          scrolled ? 'h-20' : 'h-24'
        }`}
      >
        {/* Logo: image logo (40x40) + brand name */}
        <motion.div variants={itemVariants}>
          <Link href="/#home" className="flex items-center gap-2">
            <Image
              src={LOGO_SRC}
              alt="Society OS logo"
              width={40}
              height={40}
              priority
              className="h-10 w-10 shrink-0 object-contain"
            />
            <span className="text-xl font-semibold text-white">Society OS</span>
          </Link>
        </motion.div>

        {/* Links */}
        <ul className="hidden items-center gap-8 lg:flex">
          {links.map(({ label, href }) => (
            <motion.li key={label} variants={itemVariants}>
              {/* Underline grows from left to right on hover */}
              <Link
                href={href}
                className="group relative inline-block py-1 text-sm text-white/80 transition-colors duration-300 hover:text-white"
              >
                {label}
                <span className="absolute bottom-0 left-0 h-px w-full origin-left scale-x-0 bg-white transition-transform duration-300 ease-out group-hover:scale-x-100" />
              </Link>
            </motion.li>
          ))}
        </ul>

        {/* Right side */}
        <motion.div variants={itemVariants} className="flex items-center gap-5">
          <Link
            href="/auth/login"
            className="group relative inline-block py-1 text-sm text-white/80 transition-colors duration-300 hover:text-white"
          >
            Login
            {/* Same hover underline as the nav links */}
            <span className="absolute bottom-0 left-0 h-px w-full origin-left scale-x-0 bg-white transition-transform duration-300 ease-out group-hover:scale-x-100" />
          </Link>

          {/* Button gets a small scale effect on hover and press */}
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button href="#">Book a Demo</Button>
          </motion.div>
        </motion.div>
      </div>
    </motion.nav>
  )
}

export default Navbar