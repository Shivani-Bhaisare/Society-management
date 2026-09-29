import { Check } from 'lucide-react'

const features = [
  'Automated Billing',
  'Maintenance Charges',
  'Payment Tracking',
  'Outstanding Dues',
  'Digital Receipts',
  'Payment Reminders',
  'Multiple Payment Methods',
  'Collection Reports',
]

const steps = [
  'Bill Generated',
  'Resident Notified',
  'Payment',
  'Receipt',
  'Accounting',
]

const details = [
  { label: 'Unit', value: 'UPI • HDFC Bank' },
  { label: 'Receipt No.', value: '#SOC • 202484' },
  { label: 'Period', value: 'September 2026' },
]

const Billing = () => {
  return (
    <section className="w-full bg-white py-12 sm:py-16">
      <div className="mx-auto grid max-w-[1440px] items-center gap-10 px-5 sm:px-10 lg:grid-cols-2 lg:gap-12 lg:px-24">
        {/* Left: content */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-widest text-[#0B1220]">
            Maintenance &amp; Billing
          </p>

          <h2 className="mt-4 max-w-[460px] text-3xl font-bold leading-[1.1] text-[#0B1220] sm:text-4xl lg:text-5xl">
            Make Society Billing Simple.
          </h2>

          <p className="mt-5 max-w-[460px] text-sm leading-6 text-gray-500">
            Automate maintenance billing, payment collection and resident
            payment records without relying on manual spreadsheets.
          </p>

          <ul className="mt-8 grid max-w-[480px] grid-cols-1 gap-x-8 sm:grid-cols-2">
            {features.map((item) => (
              <li
                key={item}
                className="flex items-center gap-2 border-b border-gray-200 py-3 text-xs text-gray-700"
              >
                <Check size={12} className="shrink-0 text-[#2563EB]" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Right: billing card */}
        <div className="mx-auto w-full max-w-[440px] rounded-2xl border border-gray-200 bg-[#F8FAFD] p-3 sm:p-4 lg:ml-auto">
          <div className="relative rounded-xl bg-white p-5 shadow-sm">
            {/* Paid badge */}
            <span className="absolute right-0 top-4 rounded-l-full bg-[#DCFCE7] px-3 py-1 text-[9px] font-semibold text-green-600">
              ✓ PAID
            </span>

            <p className="text-[10px] uppercase text-gray-500">Unit</p>
            <p className="mt-1 text-lg font-semibold text-[#0B1220]">A-1204</p>

            <p className="mt-5 text-xs text-gray-500">Monthly Maintenance</p>
            <p className="mt-1 text-3xl font-bold text-[#0B1220]">₹4,850</p>

            {/* Details */}
            <div className="mt-5 border-t border-gray-200">
              {details.map((d) => (
                <div
                  key={d.label}
                  className="flex items-center justify-between py-2 text-[11px]"
                >
                  <span className="text-gray-500">{d.label}</span>
                  <span className="font-medium text-[#0B1220]">{d.value}</span>
                </div>
              ))}
            </div>

            {/* Progress steps */}
            <div className="mt-4 flex items-start justify-between">
              {steps.map((step, i) => (
                <div
                  key={step}
                  className="flex w-1/5 flex-col items-center gap-1.5 text-center"
                >
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#2563EB] text-[8px] font-semibold text-white">
                    {i + 1}
                  </span>
                  <span className="text-[7px] uppercase leading-tight text-gray-400 sm:text-[8px]">
                    {step}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Billing