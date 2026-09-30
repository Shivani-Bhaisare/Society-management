'use client'

import { useEffect, useState } from 'react'
import {
  Menu,
  Search,
  CalendarDays,
  Bell,
  HelpCircle,
  ChevronDown,
  User,
  Settings,
  LogOut,
} from 'lucide-react'
import { useRouter, usePathname } from 'next/navigation'

const roleInfo: Record<string, { name: string; initials: string; title: string }> = {
  president: { name: 'Rahul Sharma', initials: 'RS', title: 'Society Administrator' },
  secretary: { name: 'Priya Verma', initials: 'PV', title: 'Secretary' },
  treasurer: { name: 'Amit Joshi', initials: 'AJ', title: 'Treasurer' },
}

// "society-master" -> "Society Master"
const formatPage = (s: string) =>
  s
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ')

export default function Topnavbar({ onMenuClick }: { onMenuClick: () => void }) {
  const router = useRouter()
  const pathname = usePathname()
  const [profileOpen, setProfileOpen] = useState(false)

  // /president/society-master -> role = president, page = Society Master
  const segments = pathname.split('/').filter(Boolean)
  const role = segments[0] || 'president'
  const page = formatPage(segments[1] || 'dashboard')
  const user = roleInfo[role] ?? roleInfo.president

  // Esc se dropdown band
  useEffect(() => {
    if (!profileOpen) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setProfileOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [profileOpen])

  const handleLogout = () => {
    document.cookie = 'role=; path=/; max-age=0'
    setProfileOpen(false)
    router.push('/auth/login')
  }

  return (
    <header className="sticky top-0 z-30 flex h-[70px] w-full shrink-0 items-center gap-2 border-b border-[#272D39] bg-[#10131A] px-3 sm:gap-3 sm:px-4 lg:px-6">
      {/* Hamburger (mobile/tablet only) */}
      <button
        onClick={onMenuClick}
        className="shrink-0 rounded-md p-2 text-slate-300 transition-colors hover:bg-white/5 lg:hidden"
        aria-label="Open sidebar"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Breadcrumb (md+) */}
      <p className="hidden shrink-0 items-center whitespace-nowrap text-xs text-slate-400 md:flex">
        <span>SocietyOS</span>
        <span className="mx-1.5 text-slate-500">/</span>
        <span className="font-medium text-white">{page}</span>
      </p>

      {/* Search */}
      <div className="flex min-w-0 flex-1 items-center justify-center md:px-2 lg:px-4">
        <div className="flex w-full max-w-md items-center gap-2 rounded-lg border border-[#272D39] bg-white/[0.03] px-3 py-2 transition-colors focus-within:border-[#6C63FF]/60">
          <Search className="h-4 w-4 shrink-0 text-slate-500" />
          <input
            type="text"
            placeholder="Search residents, units, complaints..."
            className="w-full min-w-0 bg-transparent text-xs text-white placeholder:text-slate-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Right side */}
      <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
        {/* Date filter (lg+) */}
        <button className="hidden items-center gap-2 whitespace-nowrap rounded-lg border border-[#272D39] px-3 py-2 text-xs text-slate-300 transition-colors hover:bg-white/5 lg:flex">
          <CalendarDays className="h-4 w-4" />
          Last 30 days
          <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
        </button>

        {/* Notification bell */}
        <button
          className="relative rounded-lg border border-[#272D39] p-2 text-slate-300 transition-colors hover:bg-white/5"
          aria-label="Notifications"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-red-500 ring-2 ring-[#10131A]" />
        </button>

        {/* Help (sm+) */}
        <button
          className="hidden rounded-lg border border-[#272D39] p-2 text-slate-300 transition-colors hover:bg-white/5 sm:block"
          aria-label="Help"
        >
          <HelpCircle className="h-4 w-4" />
        </button>

        {/* Profile dropdown */}
        <div className="relative">
          <button
            onClick={() => setProfileOpen((v) => !v)}
            aria-haspopup="menu"
            aria-expanded={profileOpen}
            className="flex items-center gap-2 rounded-lg border border-[#272D39] py-1.5 pl-1.5 pr-2 transition-colors hover:bg-white/5 sm:pr-3"
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[#6C63FF] to-[#8B85FF] text-[11px] font-bold text-white">
              {user.initials}
            </div>

            <div className="hidden text-left leading-tight md:block">
              <p className="whitespace-nowrap text-xs font-semibold text-white">
                {user.name}
              </p>
              <p className="whitespace-nowrap text-[10px] text-slate-400">
                {user.title}
              </p>
            </div>

            <ChevronDown
              className={`hidden h-3.5 w-3.5 text-slate-500 transition-transform sm:block ${
                profileOpen ? 'rotate-180' : ''
              }`}
            />
          </button>

          {profileOpen && (
            <>
              <div
                className="fixed inset-0 z-40"
                onClick={() => setProfileOpen(false)}
                aria-hidden="true"
              />

              <div
                role="menu"
                className="absolute right-0 z-50 mt-2 w-52 overflow-hidden rounded-lg border border-[#272D39] bg-[#161A23] py-1 shadow-xl"
              >
                {/* Mobile par naam yahan dikhega (topbar mein hidden hota hai) */}
                <div className="border-b border-[#272D39] px-3 py-2 md:hidden">
                  <p className="text-xs font-semibold text-white">{user.name}</p>
                  <p className="text-[10px] text-slate-400">{user.title}</p>
                </div>

                <button className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-300 transition-colors hover:bg-white/5">
                  <User className="h-4 w-4" /> My Profile
                </button>
                <button className="flex w-full items-center gap-2 px-3 py-2 text-xs text-slate-300 transition-colors hover:bg-white/5">
                  <Settings className="h-4 w-4" /> Settings
                </button>
                <div className="my-1 h-px bg-[#272D39]" />
                <button
                  onClick={handleLogout}
                  className="flex w-full items-center gap-2 px-3 py-2 text-xs text-red-400 transition-colors hover:bg-white/5"
                >
                  <LogOut className="h-4 w-4" /> Logout
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  )
}