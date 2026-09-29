import {
  ShieldCheck,
  CircleDollarSign,
  Users,
  Gauge,
  MessageSquare,
  Building2,
} from 'lucide-react'

const items = [
  { label: 'Security', icon: ShieldCheck },
  { label: 'Finance', icon: CircleDollarSign },
  { label: 'Residents', icon: Users },
  { label: 'Operations', icon: Gauge },
  { label: 'Community', icon: MessageSquare },
  { label: 'Facilities', icon: Building2 },
]

const Features = () => {
  return (
    <section className="w-full bg-white py-16">
      <div className="mx-auto max-w-[1440px] px-10 text-center">
        {/* Heading */}
        <h2 className="text-4xl font-bold text-[#0B1220] lg:text-5xl">
          Everything Your Society Needs.
          <br />
          {/* <span className="text-[#2563EB]">Connected in One Place</span> */}
          <span className="mt-2 block text-[#2563EB]">Connected in One Place</span>
        </h2>
        {/* Paragraph */}
        <p className="mx-auto mt-6 max-w-[560px] text-sm leading-6 text-gray-600">
          From the gate to the accounts office, from maintenance requests to
          resident communication — SocietyOS connects the people, processes and
          information that keep a community running.
        </p>

        {/* Icons row */}
        <div className="mt-14 flex flex-wrap items-start justify-center gap-4 lg:gap-8">
          {items.map(({ label, icon: Icon }) => (
            <div key={label} className="flex flex-col items-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-gray-200 bg-gray-50">
                <Icon size={24} className="text-[#2563EB]" strokeWidth={1.5} />
              </div>
              <span className="text-xs font-medium uppercase tracking-wide text-[#0B1220]">
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Features