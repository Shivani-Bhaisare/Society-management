import { FiUsers, FiChevronRight } from 'react-icons/fi'

const steps = [
  'Resident',
  'Complaint',
  'Category',
  'Assigned Staff',
  'Work in Progress',
  'Resolved',
  'Feedback',
]

const Complaints = () => {
  return (
    <section className="w-full bg-[#FDFDFB] py-12 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-[1440px] px-5 sm:px-10 lg:px-24">
        {/* Small label */}
        <p className="text-[10px] font-semibold uppercase tracking-widest text-[#081121]">
          Complaints &amp; Helpdesk
        </p>

        {/* Heading */}
        <h2 className="mt-4 max-w-[560px] text-3xl font-bold leading-[1.1] tracking-tight text-[#081121] sm:text-4xl lg:text-5xl">
          From Complaint to Resolution.
        </h2>

        {/* Paragraph */}
        <p className="mt-5 max-w-[520px] text-xs leading-6 text-slate-500 sm:text-sm">
          Give residents a clear way to raise issues and give management a
          structured way to assign, track and resolve them.
        </p>

        {/* Steps */}
        <ol className="mt-10 grid grid-cols-1 gap-x-3 gap-y-8 min-[360px]:grid-cols-2 sm:mt-14 sm:grid-cols-4 lg:mt-16 lg:flex lg:items-start lg:justify-between lg:gap-2">
          {steps.map((label, i) => (
            <li
              key={label}
              className="relative flex min-w-0 flex-col items-center gap-3 text-center lg:flex-1"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-blue-100 text-lg text-blue-600 lg:h-12 lg:w-12 lg:text-xl">
                <FiUsers aria-hidden="true" />
              </div>

              <span className="text-[11px] font-semibold leading-tight text-[#081121] sm:text-xs">
                {label}
              </span>

              {/* Arrow: sirf desktop par, last item ke baad nahi */}
              {i < steps.length - 1 && (
                <FiChevronRight
                  aria-hidden="true"
                  className="absolute right-0 top-[14px] hidden translate-x-1/2 text-base text-slate-400 lg:block"
                />
              )}
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}

export default Complaints