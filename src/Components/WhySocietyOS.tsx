type Reason = {
  no: string
  title: string
  desc: string
}

const reasons: Reason[] = [
  {
    no: '01',
    title: 'One Source of Truth',
    desc: 'All society information — residents, finance, operations, security — lives in one connected system, not across tools.',
  },
  {
    no: '02',
    title: 'Less Manual Work',
    desc: 'Replace repetitive registers, spreadsheets and paper processes with structured digital workflows.',
  },
  {
    no: '03',
    title: 'Clearer Operations',
    desc: "Every team gets visibility into their responsibilities — without interfering with what doesn't belong to them.",
  },
  {
    no: '04',
    title: 'Better Resident Experience',
    desc: 'Make everyday community services — payments, visitors, complaints — simple and accessible for every resident.',
  },
]

const WhySocietyOS = () => {
  return (
    <section className="w-full bg-[#FDFDFC] py-12 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-[1440px] px-5 sm:px-10 lg:px-24">
        {/* Heading */}
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 sm:text-[11px]">
            Why SocietyOS
          </p>

          <h2 className="mt-3 max-w-[640px] text-3xl font-bold leading-[1.1] tracking-tight text-[#0B1330] sm:text-4xl lg:mt-4 lg:text-[56px]">
            Designed Around How Societies Actually Work.
          </h2>
        </div>

        {/* Cards */}
        <ul className="mt-8 grid grid-cols-1 gap-3 sm:mt-10 sm:grid-cols-2 lg:mt-12 lg:gap-4">
          {reasons.map(({ no, title, desc }) => (
            <li
              key={no}
              className="rounded-md bg-[#F8FAFD] p-5 transition hover:bg-[#F1F5FC] sm:p-6"
            >
              {/* Number */}
              <span className="block text-4xl font-light leading-none text-[#8FA8F5] sm:text-[44px]">
                {no}
              </span>

              {/* Title */}
              <h3 className="mt-4 text-[11px] font-semibold uppercase tracking-tight text-[#0B1330] sm:text-xs">
                {title}
              </h3>

              {/* Description */}
              <p className="mt-2 max-w-[460px] text-xs leading-5 text-slate-500">
                {desc}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export default WhySocietyOS