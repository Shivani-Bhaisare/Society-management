import Image from 'next/image'
import { FiClock, FiMapPin, FiArrowRight, FiCheckCircle } from 'react-icons/fi'
import { LuBuilding2 } from "react-icons/lu";
import Button from '../Components/Button'
const tags = [
  'Clubhouse',
  'Swimming Pool',
  'Gym',
  'Sports Court',
  'Community Hall',
  'Guest Room',
]
const Amenities = () => {
  return (
    <section className="relative w-full overflow-hidden bg-[#081121]">
      {/* Background image */}
      <Image
        src="/img3 (2).png"
        alt=""
        fill
        priority={false}
        sizes="100vw"
        className="object-cover"
      />

      {/* Dark overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#081121]/80 via-[#081121]/60 to-[#081121]/80 lg:bg-gradient-to-r lg:from-[#081121]/85 lg:via-[#081121]/50 lg:to-[#081121]/10" />

      <div className="relative mx-auto grid max-w-[1440px] items-center gap-10 px-5 py-12 sm:px-10 sm:py-16 lg:min-h-[560px] lg:grid-cols-[1fr_380px] lg:gap-16 lg:px-24 lg:py-20">
        {/* Left content */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-white/80">
            Amenities &amp; Facilities
          </p>

          <h2 className="mt-4 max-w-[560px] text-3xl font-bold leading-[1.1] tracking-tight text-white sm:text-4xl lg:text-5xl">
            Make Community Spaces Easier to Manage.
          </h2>

          <p className="mt-5 max-w-[480px] text-xs leading-6 text-white/70 sm:text-sm">
            Manage shared facilities, bookings, schedules and availability
            without conflicts.
          </p>

          {/* Tags */}
          <ul className="mt-6 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <li
                key={tag}
                className="rounded-md border border-white/20 bg-white/10 px-2.5 py-1 text-[9px] font-medium uppercase tracking-wider text-white/80 backdrop-blur-sm sm:text-[10px]"
              >
                {tag}
              </li>
            ))}
          </ul>
        </div>

        {/* Booking card */}
        <article className="w-full max-w-[420px] rounded-2xl bg-white p-4 shadow-2xl shadow-black/30 sm:p-[18px] lg:max-w-none">
          <div className="rounded-xl border border-slate-200/70 bg-[#FDFDFB] p-4 sm:p-5">
            {/* Header */}
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-100 text-base text-blue-600">
                  <LuBuilding2 aria-hidden="true" />
                </span>
                <div>
                  <p className="text-[8px] font-semibold uppercase tracking-wider text-blue-600">
                    Clubhouse
                  </p>
                  <h3 className="text-sm font-semibold text-[#081121]">
                    Private event
                  </h3>
                </div>
              </div>

              <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1.5 text-[8px] font-bold uppercase tracking-wider text-emerald-600">
                <FiCheckCircle className="text-[11px]" aria-hidden="true" />
                Available
              </span>
            </div>

            {/* Date panel */}
            <div className="mt-4 rounded-xl border border-slate-200/70 bg-[#FAFAF7] p-4">
              <p className="text-sm text-slate-500">Saturday September</p>
              <p className="mt-2 text-4xl font-bold leading-none text-[#081121]">
                24
              </p>

              <ul className="mt-4 space-y-2.5 text-[11px] text-slate-600">
                <li className="flex items-center gap-2">
                  <FiClock className="text-blue-600" aria-hidden="true" />
                  6:00 PM – 9:00 PM
                </li>
                <li className="flex items-center gap-2">
                  <FiMapPin className="text-blue-600" aria-hidden="true" />
                  Main Clubhouse
                </li>
              </ul>
            </div>

            {/* Button */}
            <Button
              href="#"
              variant="primary"
              className="mt-4 w-full justify-center py-3.5 uppercase tracking-wider"
            >
              Book now
              <FiArrowRight aria-hidden="true" />
            </Button>
          </div>
        </article>
      </div>
    </section>
  )
}

export default Amenities