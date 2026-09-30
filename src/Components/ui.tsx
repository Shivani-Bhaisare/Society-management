import { ReactNode } from 'react'

export function Card({
  title, sub, action, children, className = '',
}: {
  title?: string; sub?: string; action?: ReactNode; children: ReactNode; className?: string
}) {
  return (
    <section className={`min-w-0 rounded-xl border border-[#272D39] bg-[#10131A] ${className}`}>
      {title && (
        <div className="flex items-start justify-between gap-3 border-b border-[#272D39] px-4 py-3">
          <div className="min-w-0">
            <h3 className="truncate text-[13px] font-semibold text-white">{title}</h3>
            {sub && <p className="truncate text-[11px] text-slate-400">{sub}</p>}
          </div>
          {action}
        </div>
      )}
      <div className="p-4">{children}</div>
    </section>
  )
}

export function Box({ label, value, color = 'text-white' }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded-lg border border-[#272D39] bg-white/[0.03] px-3 py-2">
      <p className="truncate text-[10px] text-slate-400">{label}</p>
      <p className={`mt-0.5 text-base font-semibold ${color}`}>{value}</p>
    </div>
  )
}

export function Ring({
  value, color = '#00C2B8', label, size = 110,
}: { value: number; color?: string; label: string; size?: number }) {
  const r = 44, c = 2 * Math.PI * r
  return (
    <div className="relative mx-auto" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="-rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="#272D39" strokeWidth="9" />
        <circle
          cx="50" cy="50" r={r} fill="none" stroke={color} strokeWidth="9" strokeLinecap="round"
          strokeDasharray={c} strokeDashoffset={c * (1 - value / 100)}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold text-white">{value}{label === 'Out of 100' ? '' : '%'}</span>
        <span className="text-[9px] text-slate-400">{label}</span>
      </div>
    </div>
  )
}

export function Progress({ label, value, color = '#00C2B8' }: { label: string; value: number; color?: string }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-[10px] text-slate-400">
        <span>{label}</span><span className="text-white">{value}%</span>
      </div>
      <div className="h-1 rounded-full bg-[#272D39]">
        <div className="h-1 rounded-full" style={{ width: `${value}%`, background: color }} />
      </div>
    </div>
  )
}

export function Badge({ children, tone }: { children: ReactNode; tone: 'red' | 'orange' | 'green' | 'blue' | 'purple' | 'gray' }) {
  const t = {
    red: 'bg-red-500/15 text-red-400', orange: 'bg-orange-500/15 text-orange-400',
    green: 'bg-emerald-500/15 text-emerald-400', blue: 'bg-blue-500/15 text-blue-400',
    purple: 'bg-[#6C63FF]/20 text-[#A29CFF]', gray: 'bg-white/5 text-slate-300',
  }[tone]
  return <span className={`whitespace-nowrap rounded px-1.5 py-0.5 text-[10px] font-medium ${t}`}>{children}</span>
}

export function LinkBtn({ children }: { children: ReactNode }) {
  return (
    <button className="w-full rounded-lg border border-[#272D39] bg-white/[0.03] py-2 text-[11px] text-slate-300 transition-colors hover:bg-white/5">
      {children}
    </button>
  )
}

export function Curve({ d, color = '#3B82F6', fill = false }: { d: string; color?: string; fill?: boolean }) {
  return (
    <svg viewBox="0 0 300 80" preserveAspectRatio="none" className="h-24 w-full">
      {fill && <path d={`${d} L300,80 L0,80 Z`} fill={color} opacity="0.15" />}
      <path d={d} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" />
    </svg>
  )
}