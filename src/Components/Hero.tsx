import Image from 'next/image'
import { ArrowRight, ArrowDown } from 'lucide-react'
import Button from '../Components/Button'

const Hero = () => {
  return (
    <section className="relative h-screen w-full overflow-hidden bg-[#00020700]">
      {/* Background image (poori screen par fit) */}
      <Image
        src="/image1 (2).png"
        alt="Modern residential society"
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />

      {/* Dark gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#000207] via-[#000207]/70 to-transparent" />

      {/* Content (pt-32 se text thoda niche aayega) */}
      <div className="relative z-10 mx-auto flex h-full max-w-[1440px] flex-col justify-center px-10 pt-32">
        <p className="text-xs font-medium uppercase tracking-widest text-white/80">
          The operating system for modern societies
        </p>

        <h1 className="mt-6 max-w-[720px] text-5xl font-bold uppercase leading-[1.1] text-white lg:text-6xl">
          Run your entire society from one connected platform.
        </h1>

        <p className="mt-8 max-w-[600px] text-sm uppercase leading-6 text-white/80">
          Society OS brings residents, security, finance, maintenance, visitors,
          amenities and everyday operations together in one intelligent platform.
        </p>

        <div className="mt-8 flex flex-wrap gap-2">
          <Button href="#">
            Book a Demo <ArrowRight size={16} />
          </Button>
          <Button href="#" variant="outline">
            Explore SocietyOS <ArrowDown size={16} />
          </Button>
        </div>

        {/* Teen circles + text */}
        <div className="mt-6 flex items-center gap-3">
          <div className="flex -space-x-1">
            <span className="h-3.5 w-3.5 rounded-full bg-[#2563EB]" />
            <span className="h-3.5 w-3.5 rounded-full bg-[#F59E0B]" />
            <span className="h-3.5 w-3.5 rounded-full bg-[#22C55E]" />
          </div>
          <p className="text-xs text-white/60">
            Built for societies, communities and RWAs.
          </p>
        </div>
      </div>
    </section>
  )
}

export default Hero