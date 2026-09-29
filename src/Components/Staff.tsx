import Image from 'next/image'
import { FiCheck } from 'react-icons/fi'

const features = [
  'Staff Profiles',
  'Attendance',
  'Tasks',
  'Vendor Records',
  'Contracts',
  'Documents',
  'Service History',
  'Renewal Reminders',
]

const people = [
  {
    type: 'Security',
    role: 'Security Guard',
    name: 'Raj Kumar',
    status: 'Morning Shift - On Duty',
    image: '/img5 (2).png',
  },
  {
    type: 'Staff',
    role: 'Maintenance',
    name: 'Suresh Patel',
    status: 'Morning Shift - On Duty',
    image: '/img5 (2).png',
  },
  {
    type: 'Vendor',
    role: 'AMC Vendor',
    name: 'Abhishek Kumar',
    status: 'Contract active',
    image: '/img5 (2).png',
  },
]

const Staff = () => {
  return (
    <section className="w-full bg-[#FDFDFB] py-12 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-[1440px] px-5 sm:px-10 lg:px-24">
        {/* Top row */}
        <div className="grid items-end gap-10 lg:grid-cols-2 lg:gap-16">
          {/* Left content */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-slate-500">
              Staff &amp; Vendor Management
            </p>

            <h2 className="mt-4 max-w-[520px] text-3xl font-bold leading-[1.1] tracking-tight text-[#081121] sm:text-4xl lg:text-5xl">
              Know Your People. Manage Your Operations..
            </h2>

            <p className="mt-5 max-w-[440px] text-xs leading-6 text-slate-500 sm:text-sm">
              Keep staff, service providers and vendors organized with clear
              records, responsibilities and service history.
            </p>
          </div>

          {/* Features */}
          <ul className="grid w-full max-w-[460px] grid-cols-1 gap-x-8 min-[420px]:grid-cols-2 lg:ml-auto">
            {features.map((item) => (
              <li
                key={item}
                className="flex items-center gap-2 border-b border-slate-300 py-3 text-[11px] font-medium text-[#081121] sm:text-xs"
              >
                <FiCheck
                  className="shrink-0 text-blue-600"
                  aria-hidden="true"
                />
                {item}
              </li>
            ))}
          </ul>
        </div>

        {/* Cards */}
        <div className="mt-10 grid grid-cols-1 gap-4 sm:mt-14 sm:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          {people.map((person) => (
            <article
              key={person.name}
              className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg shadow-black/5"
            >
              <div className="relative aspect-[4/2.7] w-full">
                <Image
                  src={person.image}
                  alt={`${person.name}, ${person.role}`}
                  fill
                  sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                  className="object-cover"
                />
              </div>

              <div className="p-3.5 sm:p-4">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[8px] font-bold uppercase tracking-wider text-blue-600">
                    {person.type}
                  </span>
                  <span className="text-[9px] text-slate-400">
                    {person.role}
                  </span>
                </div>

                <h3 className="mt-2 text-sm font-semibold text-[#081121]">
                  {person.name}
                </h3>

                <p className="mt-2 flex items-center gap-1.5 text-[9px] text-slate-500">
                  <span
                    className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-500"
                    aria-hidden="true"
                  />
                  {person.status}
                </p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Staff