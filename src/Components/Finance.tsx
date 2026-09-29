import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

const bars = [40, 55, 45, 68, 58, 75, 64, 82]

const stats = [
  { label: 'Pending', value: '₹2.4L' },
  { label: 'Expenses', value: '₹11.2L' },
  { label: 'Vendor Payments', value: 'Organized' },
]

const Finance = () => {
  return (
    <section className="w-full bg-[#F9F6F2] py-12 sm:py-16">
      <div className="mx-auto grid max-w-[1440px] items-center gap-10 px-5 sm:px-10 lg:grid-cols-2 lg:gap-12 lg:px-24">
        {/* Left: collection card */}
        <div className="mx-auto w-full max-w-[440px] rounded-2xl border border-gray-200 bg-[#F8F8F5] p-3 sm:p-4 lg:mx-0">
          <div className="relative rounded-xl bg-white p-5 shadow-sm">
            {/* Badge */}
            <span className="absolute right-0 top-4 flex items-center gap-1 rounded-l-full bg-[#DCFCE7] px-3 py-1 text-[8px] font-semibold uppercase text-green-600">
              <ArrowRight size={8} /> Collection on track
            </span>

            <p className="text-xs uppercase text-gray-500">Monthly Collection</p>
            <p className="mt-1 text-2xl font-bold text-[#0B1220]">₹18.25</p>

            {/* Bar chart */}
            <div className="mt-6 flex h-40 items-end justify-between gap-2 sm:h-44">
              {bars.map((h, i) => (
                <div
                  key={i}
                  style={{ height: `${h}%` }}
                  className="flex-1 rounded-t-sm bg-gradient-to-t from-[#2563EB] to-[#4F8BFF]"
                />
              ))}
            </div>

            {/* Stats */}
            <div className="mt-4 grid grid-cols-3 gap-2 border-t border-gray-100 pt-3">
              {stats.map((s) => (
                <div key={s.label}>
                  <p className="text-[8px] text-gray-400">{s.label}</p>
                  <p className="mt-0.5 text-[11px] font-semibold text-[#0B1220]">
                    {s.value}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: content */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#0B1220]">
            Finance &amp; Accounting
          </p>

          <h2 className="mt-4 max-w-[460px] text-3xl font-bold leading-[1.1] text-[#0B1220] sm:text-4xl lg:text-5xl">
            Bring Financial Clarity to Your Society.
          </h2>

          <p className="mt-5 max-w-[480px] text-sm leading-6 text-gray-500">
            Automate maintenance billing, payment collection and resident
            payment records without relying on manual spreadsheets.
          </p>

          <Link
            href="#"
            className="mt-6 inline-flex items-center gap-1.5 text-xs font-semibold text-[#2563EB]"
          >
            Explore Financial Management <ArrowRight size={12} />
          </Link>
        </div>
      </div>
    </section>
  )
}

export default Finance