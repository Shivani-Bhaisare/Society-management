import Image from 'next/image'

type Community = {
  label: string
  src: string
}

// Images public/ folder se aa rahi hain (spaces ko %20 se likha hai)
const communities: Community[] = [
  { label: 'Multi-Tower Communities', src: '/img6%20(2).png' },
  { label: 'RWAs', src: '/img7%20(2).png' },
  { label: 'Gated Communities', src: '/img8.png' },
  { label: 'Large Townships', src: '/img9.png' },
  { label: 'Residential Complexes', src: '/img10.png' },
  { label: 'Apartment Societies', src: '/img10.png' },
]

const Communities = () => {
  return (
    <section className="w-full bg-[#F8FAFD] py-12 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-[1440px] px-5 sm:px-10 lg:px-24">
        {/* Heading */}
        <div className="text-center">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-500 sm:text-[11px]">
            Built for Every Society
          </p>

          <h2 className="mx-auto mt-3 max-w-[720px] text-3xl font-bold leading-[1.1] tracking-tight text-[#0B1330] sm:text-4xl lg:mt-4 lg:text-[56px]">
            Built for Communities of Every Scale.
          </h2>

          <p className="mx-auto mt-4 max-w-[520px] text-xs leading-5 text-slate-500 sm:text-sm sm:leading-6 lg:mt-5">
            Whether you manage a single residential community or multiple
            properties, SocietyOS gives you a connected operational foundation.
          </p>
        </div>

        {/* Image grid */}
        <ul className="mt-8 grid grid-cols-1 gap-3 sm:mt-10 sm:grid-cols-2 lg:mt-14 lg:grid-cols-3 lg:gap-4">
          {communities.map(({ label, src }) => (
            <li
              key={label}
              className="group relative aspect-[16/10] overflow-hidden rounded-md sm:aspect-[4/3]"
            >
              <Image
                src={src}
                alt={label}
                fill
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />

              {/* Bottom gradient for label readability */}
              <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 to-transparent" />

              <span className="absolute bottom-3 left-3 text-[11px] font-medium text-white sm:bottom-3.5 sm:left-4 sm:text-xs">
                {label}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

export default Communities