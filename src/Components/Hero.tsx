import Image from 'next/image'
import { ArrowRight, ArrowDown } from 'lucide-react'
import Button from '../Components/Button'

// Diagram ka apna 700 x 700 box hai. Hub ka center (350, 350) hai.
const HUB = { x: 350, y: 350, r: 78 }

// Hub ke around rings (radius)
const RINGS = [
  { r: 175, opacity: 0.22 },
  { r: 265, opacity: 0.16 },
  { r: 340, opacity: 0.1 },
]

const nodes = [
  { label: 'Residents', x: 345, y: 183, w: 94 },
  { label: 'Community', x: 191, y: 266, w: 100 },
  { label: 'Security', x: 518, y: 266, w: 88 },
  { label: 'Facilities', x: 202, y: 446, w: 93 },
  { label: 'Finance', x: 504, y: 446, w: 81 },
  { label: 'Operations', x: 349, y: 529, w: 102 },
]

// Blue glow dots (rings par baithe hue)
const glowDots = [
  { x: 357, y: 108 },
  { x: 140, y: 145 },
  { x: 494, y: 337 },
  { x: 650, y: 450 },
  { x: 350, y: 85 },
  { x: 615, y: 350 },
  { x: 118, y: 470 },
]

const NODE_H = 27

const Hero = () => {
  return (
    <section className="relative h-screen w-full overflow-hidden bg-[#000207]">
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

      {/* RIGHT SIDE: SocietyOS hub diagram + rings (sirf lg+ par) */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-0 top-1/2 hidden aspect-square w-[min(56vw,100vh)] -translate-y-1/2 lg:block"
      >
        <svg viewBox="0 0 700 700" className="h-full w-full" fill="none">
          <defs>
            <radialGradient id="hero-dot-glow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="hero-hub-glow" cx="50%" cy="50%" r="50%">
              <stop offset="60%" stopColor="#2563EB" stopOpacity="0.2" />
              <stop offset="100%" stopColor="#2563EB" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="hero-hub-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#141E36" />
              <stop offset="100%" stopColor="#080D1C" />
            </linearGradient>
          </defs>

          {/* Rings (hub ke around) */}
          {RINGS.map((ring) => (
            <circle
              key={ring.r}
              cx={HUB.x}
              cy={HUB.y}
              r={ring.r}
              stroke="#3B82F6"
              strokeOpacity={ring.opacity}
              strokeWidth="1"
            />
          ))}

          {/* Glow dots */}
          {glowDots.map((d) => (
            <g key={`${d.x}-${d.y}`}>
              <circle cx={d.x} cy={d.y} r="10" fill="url(#hero-dot-glow)" />
              <circle cx={d.x} cy={d.y} r="2.5" fill="#93C5FD" />
            </g>
          ))}

          {/* Center hub */}
          <circle
            cx={HUB.x}
            cy={HUB.y}
            r={HUB.r + 30}
            fill="url(#hero-hub-glow)"
          />
          <circle
            cx={HUB.x}
            cy={HUB.y}
            r={HUB.r}
            fill="url(#hero-hub-fill)"
            fillOpacity="0.95"
            stroke="#60A5FA"
            strokeOpacity="0.55"
            strokeWidth="1.4"
          />
          <text
            x={HUB.x}
            y={HUB.y - 22}
            textAnchor="middle"
            dominantBaseline="central"
            fill="#60A5FA"
            fontSize="7"
            fontWeight="700"
            letterSpacing="1.8"
          >
            ONE CONNECTED
          </text>
          <text
            x={HUB.x}
            y={HUB.y}
            textAnchor="middle"
            dominantBaseline="central"
            fill="#FFFFFF"
            fontSize="17"
            fontWeight="700"
          >
            SOCIETYOS
          </text>
          <text
            x={HUB.x}
            y={HUB.y + 24}
            textAnchor="middle"
            dominantBaseline="central"
            fill="#60A5FA"
            fontSize="7"
            fontWeight="700"
            letterSpacing="1.8"
          >
            DATABASE
          </text>

          {/* Node pills */}
          {nodes.map((n) => (
            <g key={n.label}>
              <rect
                x={n.x - n.w / 2}
                y={n.y - NODE_H / 2}
                width={n.w}
                height={NODE_H}
                rx="3"
                fill="#0A1120"
                fillOpacity="0.92"
                stroke="#60A5FA"
                strokeOpacity="0.25"
              />
              <circle
                cx={n.x - n.w / 2 + 11}
                cy={n.y}
                r="2.6"
                fill="#60A5FA"
              />
              <text
                x={n.x - n.w / 2 + 21}
                y={n.y}
                dominantBaseline="central"
                fill="#FFFFFF"
                fontSize="9"
                fontWeight="700"
                letterSpacing="1.1"
              >
                {n.label.toUpperCase()}
              </text>
            </g>
          ))}
        </svg>
      </div>

      {/* Content (pt-32 se text thoda niche aayega) */}
      <div className="relative z-10 mx-auto flex h-full max-w-[1440px] flex-col justify-center px-10 pt-32">
        {/* Eyebrow + heading (outline isi ke peeche hai) */}
        <div className="relative">
          {/* LEFT SIDE: text ke peeche wali rounded outline (sirf lg+ par) */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-9 -top-20 hidden h-[340px] w-[360px] rounded-[120px] border border-[#3B82F6]/25 lg:block"
          >
            <span className="absolute -left-[3px] top-[52px] h-1.5 w-1.5 rounded-full bg-[#3B82F6] shadow-[0_0_10px_3px_rgba(59,130,246,0.7)]" />
            <span className="absolute left-[300px] top-[250px] h-1.5 w-1.5 rounded-full bg-[#3B82F6] shadow-[0_0_10px_3px_rgba(59,130,246,0.7)]" />
          </div>

          <p className="relative text-xs font-medium uppercase tracking-widest text-white/80">
            The operating system for modern societies
          </p>

          <h1 className="relative mt-6 max-w-[720px] text-5xl font-bold uppercase leading-[1.1] text-white lg:text-6xl">
            Run your entire society from one connected platform.
          </h1>
        </div>

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