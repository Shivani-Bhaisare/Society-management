import Image from 'next/image'
import { Bell, CheckCircle2, Check } from 'lucide-react'

const features = [
  'Pre-approved Visitors',
  'Instant Entry Notifications',
  'Visitor Logs',
  'Delivery Tracking',
  'Staff Entry',
  'Vehicle Records',
  'Digital Gate Passes',
  'Emergency Alerts',
]

const Security = () => {
  return (
    <section className="w-full bg-[#081121] py-16">
      <div className="mx-auto grid max-w-[1440px] items-center gap-12 px-10 lg:grid-cols-2 lg:px-24">
        {/* Left: image */}
        <div className="relative mx-auto w-full max-w-[520px]">
          <div className="relative h-[460px] overflow-hidden rounded-tl-[24px] rounded-tr-[24px] rounded-bl-[24px] rounded-br-[90px]">
            <Image
              src="/img2 (3).png"
              alt="Security guard at society gate"
              fill
              sizes="(min-width: 1024px) 520px, 100vw"
              className="object-cover"
            />
          </div>

          {/* Floating notification card (image ke top-right par) */}
          <div className="absolute right-4 top-4 flex items-center gap-3 rounded-lg bg-white px-3 py-2 shadow-lg">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#E5ECFB]">
              <Bell size={14} className="text-[#2563EB]" />
            </div>
            <div>
              <p className="text-[8px] text-gray-400">Entry approved</p>
              <p className="text-[10px] font-semibold text-[#0B1220]">
                Visitor at Gate 01
              </p>
            </div>
            <CheckCircle2 size={14} className="text-green-500" />
          </div>
        </div>

        {/* Right: content */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-white/80">
            Security
          </p>

          <h2 className="mt-4 max-w-[460px] text-4xl font-bold leading-[1.1] text-white lg:text-5xl">
            Know Who Enters. Know Who Leaves.
          </h2>

          <p className="mt-5 max-w-[440px] text-sm leading-6 text-white/70">
            Digitize visitor, delivery, staff and vehicle entry while keeping
            residents informed in real time.
          </p>

          <ul className="mt-8 grid max-w-[460px] grid-cols-2 gap-x-8">
            {features.map((item) => (
              <li
                key={item}
                className="flex items-center gap-2 border-b border-white/10 py-3 text-xs text-white/80"
              >
                <Check size={12} className="shrink-0 text-[#2563EB]" />
                {item}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}

export default Security