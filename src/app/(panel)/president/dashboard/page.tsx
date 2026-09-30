import Image from 'next/image'
import {
  Users, Building2, MessageSquareWarning, Clock, IndianRupee, Camera, CalendarDays,
  ArrowRight, AlertTriangle, UserPlus, Receipt, ShieldCheck, Megaphone, Wallet,
} from 'lucide-react'
import { Card, Box, Ring, Progress, Badge, LinkBtn, Curve } from '@/Components/ui'
const stats = [
  { label: 'Total Residents', value: '2,438', sub: '+2.4% this month', subC: 'text-emerald-400', icon: Users, c: '#6C63FF' },
  { label: 'Total Units', value: '205', sub: '812 Occupied · 52 Vacant', subC: 'text-slate-400', icon: Building2, c: '#3B82F6' },
  { label: 'Active Complaints', value: '50', sub: '↗ +2 Since Yesterday', subC: 'text-red-400', icon: MessageSquareWarning, c: '#EF4444' },
  { label: 'Pending Dues', value: '₹2.5L', sub: '48 Account Overdue', subC: 'text-orange-400', icon: Clock, c: '#F59E0B' },
  { label: 'Maintenance Collection', value: '₹24.8L', sub: '86.4% collected', subC: 'text-emerald-400', icon: IndianRupee, c: '#00C2B8' },
]
const health = [
  ['Security', 98, '#00C2B8'], ['Finance', 90, '#00C2B8'], ['Operations', 89, '#3B82F6'],
  ['Maintenance', 90, '#00C2B8'], ['Resident Satisfaction', 94, '#00C2B8'],
] as const

const months = ['Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep']
const collection = [72, 78, 70, 84, 82, 86]
const expenses = [30, 32, 30, 28, 32, 34]

const complaints = [
  { t: 'Water leakage', s: 'Tower B · Flat B-402', p: 'High', pt: 'red', st: 'Open', stt: 'blue', time: '18 min ago' },
  { t: 'Lift Issue', s: 'Tower A · Lift 2', p: 'Medium', pt: 'orange', st: 'In Progress', stt: 'purple', time: '2hr ago' },
  { t: 'Parking Obstruction', s: 'Tower C · Basement P2', p: 'Low', pt: 'gray', st: 'Assigned', stt: 'purple', time: '5hr ago' },
] as const

const amenities = [
  ['Clubhouse', 90, '#8B5CF6'], ['Gym', 80, '#3B82F6'], ['Swimming Pool', 60, '#3B82F6'],
  ['Badminton', 50, '#00C2B8'], ['Community Hall', 30, '#00C2B8'],
] as const

const staff = [['SEC', 'Security'], ['HOU', 'Housekeeping'], ['MAI', 'Maintenance'], ['OFF', 'Office Staff']]

const amc = [
  ['Lift AMC', 'Otis Elevators', 'red'], ['Generator AMC', 'Kir Inskar Power', 'orange'], ['CCTV AMC', 'Hik vision Partner', 'orange'],
] as const

const activity = [
  ['Maintenance payment received from Flat B-402', '10:42 AM', '#00C2B8'],
  ['New visitor pass approved for Tower A', '10:28 AM', '#3B82F6'],
  ['Complaint assigned to Maintenance Team', '09:54 AM', '#F59E0B'],
  ['New tenant registered in Tower C', '09:32 AM', '#8B5CF6'],
  ['Parking slot P-204 reassigned', '09:10 AM', '#94A3B8'],
]

const quick = [
  { l: 'Add Resident', i: UserPlus }, { l: 'Add Unit', i: Building2 }, { l: 'Generate Bill', i: Receipt },
  { l: 'Approve Visitor', i: ShieldCheck }, { l: 'Create Notice', i: Megaphone }, { l: 'Raise Expense', i: Wallet },
]

export default function DashboardPage() {
  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-4">
      {/* Hero image */}
      <div className="relative h-40 w-full overflow-hidden rounded-[10px] sm:h-56 lg:h-[283px]">
        <Image src="/img12.png" alt="Society" fill priority className="object-cover" />
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/10">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/20 backdrop-blur">
            <Camera className="h-5 w-5" />
          </span>
          <span className="text-sm font-semibold">Upload Image</span>
        </div>
      </div>
      {/* Greeting */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">Good Morning, Rahul 👋</h1>
          <p className="text-xs text-slate-400">Here&apos;s what&apos;s happening across Green Valley Residency today.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-2 rounded-lg border border-[#272D39] px-3 py-2 text-xs text-slate-300">
            <CalendarDays className="h-4 w-4" /> Today, 26 September 2026
          </span>
          <button className="rounded-lg bg-[#6C63FF] px-4 py-2 text-xs font-semibold hover:opacity-90">View Reports</button>
        </div>
      </div>
      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-5">
        {stats.map(({ label, value, sub, subC, icon: Icon, c }) => (
          <div key={label} className="relative overflow-hidden rounded-xl border border-[#272D39] bg-[#10131A] p-4">
            <div className="flex items-center gap-2">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg" style={{ background: `${c}26`, color: c }}>
                <Icon className="h-4 w-4" />
              </span>
              <span className="truncate text-xs font-semibold">{label}</span>
            </div>
            <p className="mt-3 text-2xl font-bold">{value}</p>
            <p className={`mt-1 text-[10px] ${subC}`}>{sub}</p>
            <span className="absolute inset-x-0 bottom-0 h-[3px]" style={{ background: c }} />
          </div>
        ))}
      </div>

      {/* Society Health + Financial Overview */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[2fr_3fr]">
        <Card title="Society Health" sub="Composite score across five operational pillars">
          <Ring value={92} label="Out of 100" size={130} />
          <p className="mx-auto mt-1 w-fit rounded bg-emerald-500/15 px-2 py-0.5 text-[10px] text-emerald-400">Healthy</p>
          <div className="mt-4 flex flex-col gap-3">
            {health.map(([l, v, c]) => <Progress key={l} label={l} value={v} color={c} />)}
          </div>
        </Card>

        <Card
          title="Financial Overview" sub="Collection vs expenses · Apr - Sep 2026"
          action={<button className="rounded-lg bg-[#6C63FF]/20 px-3 py-1 text-[11px] text-[#A29CFF]">View Finance</button>}
        >
          <div className="grid grid-cols-1 gap-2 min-[480px]:grid-cols-3">
            <Box label="Total Collection" value="₹24.8L" color="text-[#8B85FF]" />
            <Box label="Total Expenses" value="₹8.2L" color="text-orange-400" />
            <Box label="Net Balance" value="₹16.6L" color="text-[#8B85FF]" />
          </div>
          <div className="mt-4 flex h-48 items-end justify-between gap-2 border-b border-[#272D39] px-1">
            {months.map((m, i) => (
              <div key={m} className="flex flex-1 flex-col items-center gap-1">
                <div className="flex h-40 w-full items-end justify-center gap-1">
                  <div className="w-1/3 rounded-t bg-[#8B5CF6]" style={{ height: `${collection[i]}%` }} />
                  <div className="w-1/3 rounded-t bg-[#00C2B8]" style={{ height: `${expenses[i]}%` }} />
                </div>
                <span className="text-[10px] text-slate-500">{m}</span>
              </div>
            ))}
          </div>
          <div className="mt-2 flex gap-4 text-[10px] text-slate-400">
            <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-[#8B5CF6]" />Collection</span>
            <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-[#00C2B8]" />Expenses</span>
          </div>
        </Card>
      </div>

      {/* Maintenance + Complaints */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[2fr_3fr]">
        <Card title="Maintenance Collection" sub="September 2026 Billing Cycle">
          <Ring value={90.6} color="#8B5CF6" label="Collected" size={120} />
          <div className="mt-4 flex flex-col gap-2 text-[11px]">
            {[['Collected', '₹24.8L', '#00C2B8'], ['Pending', '₹2.4L', '#F59E0B'], ['Overdue', '₹82K', '#EF4444']].map(([l, v, c]) => (
              <div key={l} className="flex items-center justify-between rounded-lg border border-[#272D39] bg-white/[0.03] px-3 py-2">
                <span className="flex items-center gap-2 text-slate-300"><i className="h-1.5 w-1.5 rounded-full" style={{ background: c }} />{l}</span>
                <span className="font-medium">{v}</span>
              </div>
            ))}
          </div>
          <p className="mb-1 mt-4 text-[10px] text-slate-400">Collection trend · last 6 months</p>
          <Curve d="M0,60 C40,50 60,70 100,40 S170,30 210,50 S270,20 300,15" color="#8B5CF6" fill />
          <div className="mt-3"><LinkBtn>View Billing →</LinkBtn></div>
        </Card>

        <Card
          title="Member Complaints" sub="Help Desk Status for Today"
          action={<button className="flex items-center gap-1 text-[11px] text-slate-300">View All Complaints <ArrowRight className="h-3 w-3" /></button>}
        >
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            <Box label="Open" value="5" color="text-blue-400" />
            <Box label="In Progress" value="4" color="text-orange-400" />
            <Box label="Resolved Today" value="8" color="text-emerald-400" />
            <Box label="Escalated" value="3" color="text-red-400" />
          </div>
          <div className="mt-3 rounded-lg border border-[#272D39] bg-white/[0.02] p-2">
            <Curve d="M0,45 C50,40 80,30 120,40 S190,55 230,40 S280,35 300,38" />
            <div className="flex justify-between text-[9px] text-slate-500">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => <span key={d}>{d}</span>)}
            </div>
          </div>
          <p className="mb-2 mt-4 text-[11px] font-semibold text-slate-300">Recent Complaints</p>
          <div className="flex flex-col gap-2">
            {complaints.map((c) => (
              <div key={c.t} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-[#272D39] bg-white/[0.03] px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold">{c.t}</p>
                  <p className="truncate text-[10px] text-slate-400">{c.s}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge tone={c.pt}>{c.p}</Badge>
                  <span className="hidden text-[10px] text-slate-500 sm:inline">{c.time}</span>
                  <Badge tone={c.stt}>{c.st}</Badge>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Parking + Security */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-[2fr_3fr]">
        <Card title="Parking" sub="Basement + Open Occupancy">
          <Ring value={96.3} color="#F59E0B" label="Occupied" size={120} />
          <div className="mt-4 grid grid-cols-2 gap-2">
            <Box label="Occupied" value="985/1,258" />
            <Box label="Available" value="40" />
            <Box label="Visitor Slots" value="12" />
            <Box label="Ev/Cars Slots" value="50" />
          </div>
          <p className="mt-3 text-[10px] text-orange-400">Only 38 slots free — consider releasing visitor overflow bay</p>
          <div className="mt-3"><LinkBtn>View Billing →</LinkBtn></div>
        </Card>

        <Card
          title="Security & visitors" sub="Live Gate Activity For 26 September"
          action={<Badge tone="green">All Gates Operational</Badge>}
        >
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            <Box label="Visitors" value="500" color="text-[#8B85FF]" />
            <Box label="Deliveries" value="150" color="text-orange-400" />
            <Box label="Staff Entries" value="100" color="text-[#00C2B8]" />
            <Box label="All Vehicles" value="50" color="text-red-400" />
          </div>
          <div className="mt-3 rounded-lg border border-[#272D39] bg-white/[0.02] p-2">
            <Curve d="M0,65 C40,60 70,55 110,50 S170,25 210,30 S270,45 300,25" fill />
            <div className="flex justify-between text-[9px] text-slate-500">
              {['10 AM', '12 PM', '2 PM', '4 PM', '6 PM', '8 PM'].map((t) => <span key={t}>{t}</span>)}
            </div>
          </div>
          <div className="mt-3"><LinkBtn>Open security Center →</LinkBtn></div>
        </Card>
      </div>

      {/* Amenity + Staff */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card title="Amenity Utilization" sub="Average Usage This Month">
          <div className="flex flex-col gap-3">
            {amenities.map(([l, v, c]) => <Progress key={l} label={l} value={v} color={c} />)}
          </div>
          <div className="mt-4"><LinkBtn>View Amenities →</LinkBtn></div>
        </Card>

        <Card title="Staff Attendance" sub="115 of 124 Staff Checked in today">
          <div className="grid grid-cols-3 gap-2">
            <Box label="Present" value="96%" color="text-emerald-400" />
            <Box label="Absent" value="4%" color="text-red-400" />
            <Box label="On leave" value="2%" color="text-orange-400" />
          </div>
          <div className="mt-3 flex flex-col gap-2">
            {staff.map(([c, n]) => (
              <div key={n} className="flex items-center justify-between rounded-lg border border-[#272D39] bg-white/[0.03] px-3 py-2 text-xs">
                <span className="flex items-center gap-3">
                  <span className="rounded bg-white/5 px-1.5 py-0.5 text-[9px] tracking-widest text-slate-400">{c}</span>{n}
                </span>
                <span className="flex items-center gap-2 text-[10px] text-slate-400">42/44 <Badge tone="green">96%</Badge></span>
              </div>
            ))}
          </div>
          <div className="mt-3"><LinkBtn>Open security Center →</LinkBtn></div>
        </Card>
      </div>

      {/* Attention + Activity */}
      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card
          title="Attention Required" sub="# AMC Contracts Expiring Soon"
          action={<span className="flex h-6 w-6 items-center justify-center rounded-full bg-orange-500/15 text-orange-400"><AlertTriangle className="h-3.5 w-3.5" /></span>}
        >
          <div className="flex flex-col gap-2">
            {amc.map(([t, s, tone]) => (
              <div key={t} className="flex items-center justify-between rounded-lg border border-orange-500/40 bg-white/[0.03] px-3 py-2">
                <div><p className="text-xs font-semibold">{t}</p><p className="text-[10px] text-slate-400">{s}</p></div>
                <Badge tone={tone}>expires in 12 days</Badge>
              </div>
            ))}
          </div>
          <div className="mt-3"><LinkBtn>Review Expiring contracts →</LinkBtn></div>
        </Card>

        <Card title="Recent Activity" sub="Live Operational Log">
          <div className="flex flex-col gap-4">
            {activity.map(([t, time, c]) => (
              <div key={t} className="flex gap-3">
                <i className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: c }} />
                <div><p className="text-xs">{t}</p><p className="text-[10px] text-slate-500">{time}</p></div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card title="Quick Actions" sub="Frequent Admin Operations">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-6">
          {quick.map(({ l, i: Icon }) => (
            <button key={l} className="flex items-center justify-center gap-2 rounded-lg border border-[#272D39] bg-white/[0.03] px-3 py-2.5 text-[11px] text-slate-300 transition-colors hover:bg-white/5">
              <Icon className="h-3.5 w-3.5 text-[#8B85FF]" /> {l}
            </button>
          ))}
        </div>
      </Card>
    </div>
  )
}