'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MapPin, PanelLeftClose, PanelLeftOpen, X } from 'lucide-react'
import { roleMenus, type Role } from '../lib/roles'

type SidebarProps = {
  open: boolean
  onClose: () => void
}

/* Logo file: image placed in the public folder (change this if you rename it) */
const LOGO_SRC = '/logo (2).png'

/* One shared smooth curve + duration for width / position animations */
const SMOOTH =
  'duration-[500ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none'

/* Text / card fade:
   - collapsing: text fades out FAST (before the sidebar gets narrow)
   - expanding: text fades in SLOWLY after the sidebar has started opening */
const fadeClass = (collapsed: boolean) =>
  collapsed
    ? 'lg:opacity-0 lg:duration-150 lg:delay-0 lg:ease-in'
    : 'opacity-100 duration-300 delay-150 ease-out'

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname()
  const role = (pathname.split('/')[1] || 'president') as Role
  const navLinks = roleMenus[role] ?? []

  // Desktop only: true = icon-only rail, false = full sidebar
  const [collapsed, setCollapsed] = useState(false)
  // If the logo image fails to load, the old "S" circle is shown instead
  const [logoFailed, setLogoFailed] = useState(false)

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/')

  // Mobile: lock page scroll while the drawer is open + close on Esc
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  return (
    <>
      {/* Mobile / tablet overlay */}
      <div
        onClick={onClose}
        aria-hidden="true"
        className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 lg:hidden ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      />

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex h-dvh w-[270px] max-w-[85vw] shrink-0 flex-col overflow-x-hidden
          border-r border-[#272D39] bg-[#10131A] text-white will-change-[width]
          transition-[transform,width] ${SMOOTH}
          lg:sticky lg:top-0 lg:z-30 lg:max-w-none lg:translate-x-0
          ${collapsed ? 'lg:w-[76px]' : 'lg:w-[270px]'}
          ${open ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo */}
        <div
          className={`flex items-center justify-between px-[18px] py-5 transition-[padding] ${SMOOTH} ${
            collapsed ? 'lg:pb-[44px]' : ''
          }`}
        >
          <div className="flex min-w-0 items-center">
            {/* Logo image (fallback: gradient circle with S) */}
            {logoFailed ? (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#6C63FF] to-[#4DA3FF] text-sm font-bold">
                S
              </div>
            ) : (
              <Image
                src={LOGO_SRC}
                alt="SocietyOS logo"
                width={40}
                height={40}
                priority
                onError={() => setLogoFailed(true)}
                className="h-10 w-10 shrink-0 rounded-full object-contain"
              />
            )}

            {/* Brand text: fixed width, only fades + slides (no width animation = no jerk) */}
            <div
              className={`ml-3 w-[140px] shrink-0 whitespace-nowrap leading-tight transition-[opacity,transform] ${fadeClass(
                collapsed
              )} ${collapsed ? 'lg:-translate-x-2' : 'translate-x-0'}`}
            >
              <p className="truncate text-sm font-semibold">SocietyOS</p>
              <p className="truncate text-[10px] text-slate-400">
                Society Operating System
              </p>
            </div>
          </div>

          {/* Mobile close */}
          <button
            onClick={onClose}
            className="rounded-md p-1.5 text-slate-400 hover:bg-white/5 hover:text-white lg:hidden"
            aria-label="Close sidebar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Desktop collapse / expand toggle
            expanded: to the right of the logo | collapsed: below the logo (smooth move) */}
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className={`absolute right-4 top-[26px] hidden rounded-md p-1.5 text-slate-500 transition-[top,right,background-color,color] hover:bg-white/5 hover:text-white lg:block ${SMOOTH} ${
            collapsed ? 'lg:right-6 lg:top-[68px]' : ''
          }`}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!collapsed}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? (
            <PanelLeftOpen className="h-4 w-4" />
          ) : (
            <PanelLeftClose className="h-4 w-4" />
          )}
        </button>

        {/* Society card: height folds smoothly, content fades separately */}
        <div
          className={`mx-4 grid transition-[grid-template-rows,margin] ${SMOOTH} ${
            collapsed
              ? 'mb-4 grid-rows-[1fr] lg:mb-0 lg:grid-rows-[0fr]'
              : 'mb-4 grid-rows-[1fr]'
          }`}
        >
          <div className="min-h-0 overflow-hidden">
            <div
              className={`rounded-lg border border-[#272D39] bg-white/[0.03] px-3 py-2.5 transition-opacity ${fadeClass(
                collapsed
              )}`}
            >
              <p className="truncate text-xs font-semibold">Green Valley Residency</p>
              <p className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-400">
                <MapPin className="h-3 w-3 shrink-0" />
                <span className="truncate">Bhopal, Madhya Pradesh</span>
              </p>
            </div>
          </div>
        </div>

        {/* Nav (scrollable, scrollbar hidden) */}
        <div
          className="
            flex-1 overflow-y-auto overflow-x-hidden px-4 pb-6
            [scrollbar-width:none] [-ms-overflow-style:none]
            [&::-webkit-scrollbar]:hidden
          "
        >
          <p
            className={`overflow-hidden whitespace-nowrap px-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500 transition-[height,margin,opacity] ${
              collapsed
                ? 'mb-2 h-4 lg:mb-0 lg:h-0 lg:opacity-0 lg:duration-150 lg:ease-in'
                : 'mb-2 h-4 opacity-100 duration-300 delay-150 ease-out'
            }`}
          >
            Main
          </p>

          <nav className="flex flex-col gap-1.5">
            {navLinks.map(({ href, label, icon: Icon }) => {
              const active = isActive(href)
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={onClose}
                  title={collapsed ? label : undefined}
                  className={`relative flex items-center rounded-lg px-[14px] py-2.5 text-[13px] font-medium transition-colors duration-200 ${
                    active
                      ? 'bg-[#6C63FF]/15 text-white'
                      : 'text-slate-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  {active && (
                    <span className="absolute -left-4 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r bg-[#6C63FF]" />
                  )}
                  <Icon
                    className={`h-4 w-4 shrink-0 ${active ? 'text-[#8B85FF]' : ''}`}
                  />
                  {/* Label: stays in place, only fades + slides (icon never shifts) */}
                  <span
                    className={`ml-3 shrink-0 whitespace-nowrap transition-[opacity,transform] ${fadeClass(
                      collapsed
                    )} ${collapsed ? 'lg:-translate-x-2' : 'translate-x-0'}`}
                  >
                    {label}
                  </span>
                </Link>
              )
            })}
          </nav>
        </div>
      </aside>
    </>
  )
}