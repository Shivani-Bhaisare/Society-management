'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MapPin, PanelLeftClose, X } from 'lucide-react'
import { roleMenus, type Role } from '@/lib/roles'

type SidebarProps = {
  open: boolean
  onClose: () => void
}

export default function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname()
  const role = (pathname.split('/')[1] || 'president') as Role
  const navLinks = roleMenus[role] ?? []

  const isActive = (href: string) =>
    pathname === href || pathname.startsWith(href + '/')

  // Mobile: drawer khula ho to page scroll band + Esc se close
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
          fixed inset-y-0 left-0 z-50 flex h-dvh w-[270px] max-w-[85vw] shrink-0 flex-col
          border-r border-[#272D39] bg-[#10131A] text-white
          transition-transform duration-300 ease-out
          lg:sticky lg:top-0 lg:z-30 lg:max-w-none lg:translate-x-0
          ${open ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo */}
        <div className="flex items-center justify-between px-4 py-5">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#6C63FF] to-[#8B85FF] text-sm font-bold">
              S
            </div>
            <div className="min-w-0 leading-tight">
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

          {/* Desktop icon */}
          <PanelLeftClose className="hidden h-4 w-4 shrink-0 text-slate-500 lg:block" />
        </div>

        {/* Society card */}
        <div className="mx-4 mb-4 rounded-lg border border-[#272D39] bg-white/[0.03] px-3 py-2.5">
          <p className="truncate text-xs font-semibold">Green Valley Residency</p>
          <p className="mt-0.5 flex items-center gap-1 text-[11px] text-slate-400">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">Bhopal, Madhya Pradesh</span>
          </p>
        </div>

        {/* Nav (scrollable, scrollbar hidden) */}
        <div
          className="
            flex-1 overflow-y-auto px-4 pb-6
            [scrollbar-width:none] [-ms-overflow-style:none]
            [&::-webkit-scrollbar]:hidden
          "
        >
          <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-widest text-slate-500">
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
                  className={`relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] font-medium transition-colors duration-200 ${
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
                  <span className="truncate">{label}</span>
                </Link>
              )
            })}
          </nav>
        </div>
      </aside>
    </>
  )
}