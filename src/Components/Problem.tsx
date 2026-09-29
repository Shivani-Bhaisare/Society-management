const problems = [
  'Visitor records kept in physical registers.',
  'Maintenance tracked across multiple spreadsheets.',
  'Complaints buried in WhatsApp group chats.',
  'Staff information scattered across loose files.',
  'Residents unsure about their payment status.',
  'Vendor documents difficult to locate and verify.',
  'Committee members juggling multiple tools.',
]

const Problem = () => {
  return (
    <section className="w-full bg-[#081121] py-14">
      <div className="mx-auto max-w-[1440px] px-10 lg:px-24">
        {/* Small label */}
        <p className="text-[10px] font-medium uppercase tracking-widest text-white/80">
          The Problem
        </p>

        {/* Heading */}
        <h2 className="mt-4 max-w-[520px] text-4xl font-bold leading-[1.1] text-white lg:text-5xl">
          Society Management Shouldn’t Feel Fragmented.
        </h2>

        {/* Paragraph */}
        <p className="mt-4 max-w-[420px] text-sm leading-6 text-white/80">
          The daily work of a society is connected. The tools used to run it
          rarely are.
        </p>

        {/* Bullet list */}
        <ul className="mt-5 space-y-2.5">
          {problems.map((item) => (
            <li
              key={item}
              className="flex items-center gap-3 text-xs text-white/70"
            >
              <span className="h-1 w-1 shrink-0 rounded-full bg-[#2563EB]" />
              {item}
            </li>
          ))}
        </ul>

        {/* Bottom line with left border */}
        <p className="mt-5 border-l border-white/30 pl-3 text-xs font-medium text-white">
          SocietyOS brings these workflows together.
        </p>
      </div>
    </section>
  )
}

export default Problem