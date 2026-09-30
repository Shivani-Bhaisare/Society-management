'use client'

import { useState, ReactNode } from 'react'
import Sidebar from './Sidebar'
import Topnavbar from './Topnavbar'

export default function PanelShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false)

  return (
    <div className="flex min-h-screen bg-[#0B0E14]">
      <Sidebar open={open} onClose={() => setOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topnavbar onMenuClick={() => setOpen(true)} />
        <main className="flex-1 p-6 text-white">{children}</main>
      </div>
    </div>
  )
}