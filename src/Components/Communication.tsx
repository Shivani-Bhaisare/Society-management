import {
  FiBell,
  FiCheck,
  FiSmartphone,
  FiMessageSquare,
  FiMail,
  FiMessageCircle,
} from 'react-icons/fi'

const audience = [
  { label: 'All Residents', active: true },
  { label: 'Tower A', active: false },
  { label: 'Committee', active: false },
  { label: 'Security', active: false },
]

const channels = [
  { label: 'Push', icon: FiSmartphone, active: true },
  { label: 'SMS', icon: FiMessageSquare, active: false },
  { label: 'Email', icon: FiMail, active: false },
  { label: 'WhatsApp', icon: FiMessageCircle, active: false },
]

const Communication = () => {
  return (
    <section className="w-full bg-[#F8FAFD] py-12 sm:py-16 lg:py-20">
      <div className="mx-auto grid max-w-[1440px] items-center gap-10 px-5 sm:px-10 lg:grid-cols-[1.15fr_1fr] lg:gap-16 lg:px-24">
        {/* Notice card (desktop par left, mobile par neeche) */}
        <article className="order-2 w-full rounded-xl border border-slate-200 bg-white p-4 shadow-lg shadow-black/5 sm:p-5 lg:order-1">
          {/* Header */}
          <div className="flex items-center justify-between gap-3">
            <p className="flex items-center gap-2 text-[8px] font-semibold uppercase tracking-wider text-blue-600">
              <FiBell aria-hidden="true" />
              Society Notice
            </p>
            <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-0.5 text-[8px] font-medium text-slate-500">
              Draft
            </span>
          </div>

          <h3 className="mt-4 text-base font-semibold leading-snug text-[#081121] sm:text-lg">
            Water supply maintenance scheduled for Sunday.
          </h3>

          <p className="mt-2 text-[10px] leading-5 text-slate-500 sm:text-[11px]">
            Water supply will be paused between 10:00 AM and 12:00 PM for
            scheduled maintenance.
          </p>

          {/* Send to */}
          <div className="mt-5 border-t border-slate-200 pt-4">
            <p className="text-[8px] font-semibold uppercase tracking-wider text-slate-400">
              Send to
            </p>

            <ul className="mt-2.5 flex flex-wrap gap-2">
              {audience.map(({ label, active }) => (
                <li
                  key={label}
                  className={`inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-[10px] font-medium ${
                    active
                      ? 'border-blue-200 bg-blue-100 text-blue-600'
                      : 'border-slate-200 bg-white text-slate-600'
                  }`}
                >
                  {active && <FiCheck aria-hidden="true" />}
                  {label}
                </li>
              ))}
            </ul>
          </div>

          {/* Channels */}
          <div className="mt-4 border-t border-slate-200 pt-4">
            <p className="text-[8px] font-semibold uppercase tracking-wider text-slate-400">
              Channels
            </p>

            <ul className="mt-2.5 flex flex-wrap gap-2">
              {channels.map(({ label, icon: Icon, active }) => (
                <li
                  key={label}
                  className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-medium ${
                    active
                      ? 'border-blue-200 bg-blue-100 text-blue-600'
                      : 'border-slate-200 bg-white text-slate-600'
                  }`}
                >
                  <Icon aria-hidden="true" />
                  {label}
                </li>
              ))}
            </ul>
          </div>
        </article>

        {/* Text content (desktop par right, mobile par upar) */}
        <div className="order-1 lg:order-2">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
            Communication
          </p>

          <h2 className="mt-4 max-w-[420px] text-3xl font-bold leading-[1.1] tracking-tight text-[#081121] sm:text-4xl lg:text-5xl">
            Keep the Whole Community in Sync.
          </h2>

          <p className="mt-5 max-w-[420px] text-xs leading-6 text-slate-500 sm:text-sm">
            Send important updates to the right residents, teams and groups
            without relying on scattered communication channels.
          </p>
        </div>
      </div>
    </section>
  )
}

export default Communication