import type { IconType } from 'react-icons'
import {
  FiArrowRight,
  FiFileText,
  FiHome,
  FiLock,
  FiShield,
  FiUser,
  FiUsers,
} from 'react-icons/fi'

type Role = {
  no: string
  title: string
  desc: string
  icon: IconType
}

const roles: Role[] = [
  {
    no: '01',
    title: 'Society Admin',
    desc: 'Manage the entire community — units, residents, staff, finance and operations from a single admin view.',
    icon: FiHome,
  },
  {
    no: '02',
    title: 'Committee',
    desc: 'Governance, approvals and decisions. Full visibility into society financials and operations.',
    icon: FiShield,
  },
  {
    no: '03',
    title: 'Resident',
    desc: 'Payments, visitors, complaints and community services — all from one simple interface.',
    icon: FiUser,
  },
  {
    no: '04',
    title: 'Security',
    desc: 'Gate management, visitor approvals, vehicle entry and incident reporting.',
    icon: FiLock,
  },
  {
    no: '05',
    title: 'Staff & Vendors',
    desc: 'Tasks, attendance, service history and operational responsibilities in one place.',
    icon: FiUsers,
  },
  {
    no: '06',
    title: 'Resident',
    desc: 'Payments, visitors, complaints and community services — all from one simple interface.',
    icon: FiFileText,
  },
]

const RoleExperience = () => {
  return (
    <section className="w-full bg-[#FDFDFC] py-12 sm:py-14 lg:py-16">
      <div className="mx-auto max-w-[1440px] px-5 sm:px-10 lg:px-24">
        {/* Heading */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 sm:text-[11px]">
            Role-Based Experience
          </p>

          <h2 className="mt-3 text-3xl font-bold leading-[1.1] tracking-tight text-[#0B1330] sm:text-4xl lg:mt-4 lg:text-[56px]">
            One Platform.
            <br />
            Different Experiences
          </h2>

          <p className="mt-4 max-w-[520px] text-xs leading-5 text-slate-500 sm:text-sm lg:mt-5">
            Every person gets the tools and information they need for their
            role.
          </p>
        </div>

        {/* Cards */}
        <ul className="mt-8 grid grid-cols-1 gap-4 sm:mt-10 md:grid-cols-2 lg:grid-cols-3 lg:gap-5">
          {roles.map(({ no, title, desc, icon: Icon }) => (
            <li
              key={no}
              className="group relative rounded-xl border border-gray-200 bg-[#FAFAF5] p-5 transition hover:border-blue-200 hover:bg-white hover:shadow-[0_8px_30px_rgba(37,99,235,0.08)]"
            >
              {/* Number */}
              <span className="absolute right-4 top-4 text-[10px] font-medium text-[#2563EB]">
                {no}
              </span>

              {/* Icon box */}
              <div className="flex h-12 w-12 items-center justify-center rounded-bl-[12px] rounded-tr-[12px] bg-[#E5ECFB]">
                <Icon size={20} className="text-[#2563EB]" aria-hidden="true" />
              </div>

              {/* Title */}
              <h3 className="mt-4 text-sm font-semibold text-[#2563EB]">
                {title}
              </h3>

              {/* Description */}
              <p className="mt-2 text-xs leading-5 text-gray-500">{desc}</p>

              {/* Explore link */}
              <a
                href="#"
                className="mt-4 inline-flex items-center gap-1 text-[11px] font-semibold text-[#2563EB]"
              >
                Explore
                <FiArrowRight
                  size={12}
                  className="transition-transform group-hover:translate-x-1"
                  aria-hidden="true"
                />
              </a>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export default RoleExperience