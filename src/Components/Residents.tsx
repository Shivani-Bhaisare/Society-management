import Image from 'next/image'

const Residents = () => {
  return (
    <section className="w-full bg-[#081121] py-12 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-[1440px] px-5 text-center sm:px-10 lg:px-24">
        {/* Small label */}
        <p className="text-[10px] font-semibold uppercase tracking-widest text-white/80">
          For Residents
        </p>

        {/* Heading */}
        <h2 className="mx-auto mt-4 max-w-[760px] text-3xl font-bold leading-[1.1] text-white sm:text-4xl lg:text-5xl">
          Everything Residents Need.
          <span className="block">Right at Their Fingertips.</span>
        </h2>

        {/* Paragraph */}
        <p className="mx-auto mt-5 max-w-[460px] text-xs leading-6 text-white/70 sm:text-sm">
          Give residents one simple place to manage everyday community
          activities.
        </p>

        {/* Phones image */}
        <div className="relative mx-auto mt-10 aspect-[1024/420] w-full max-w-[1024px] sm:mt-14">
          <Image
            src="/phones.png"
            alt="SocietyOS resident app screens"
            fill
            sizes="(min-width: 1024px) 1024px, 100vw"
            className="object-contain"
          />
        </div>
      </div>
    </section>
  )
}

export default Residents