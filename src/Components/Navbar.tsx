'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import Button from '../Components/Button'

const links = ['Home', 'Platform', 'Solutions', 'For Residents', 'For Management', 'Resources']

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav className="fixed left-0 top-0 z-50 w-full bg-transparent">
      <div
        className={`mx-auto flex max-w-[1440px] items-center justify-between px-10 transition-all duration-300 ${
          scrolled ? 'h-20' : 'h-24'
        }`}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo (2).png" alt="Society OS" width={36} height={36} />
          <span className="text-xl font-semibold text-white">Society OS</span>
        </Link>

        {/* Links */}
        <ul className="hidden items-center gap-8 lg:flex">
          {links.map((item) => (
            <li key={item}>
              <Link href="#" className="text-sm text-white/80 hover:text-white">
                {item}
              </Link>
            </li>
          ))}
        </ul>

        {/* Right side */}
        <div className="flex items-center gap-5">
          <Link href="#" className="text-sm text-white/80 hover:text-white">
            Login
          </Link>
          <Button href="#">Book a Demo</Button>
        </div>
      </div>
    </nav>
  )
}

export default Navbar