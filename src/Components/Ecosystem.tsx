'use client'

import { motion, type Variants } from 'framer-motion'
import { FiArrowRight } from 'react-icons/fi'

const nodes = [
  { label: 'Society', x: 720, y: 94 },
  { label: 'Units', x: 306, y: 215 },
  { label: 'Committee', x: 1134, y: 215 },
  { label: 'Residents', x: 153, y: 338 },
  { label: 'Finance', x: 1287, y: 338 },
  { label: 'Vehicles', x: 190, y: 524 },
  { label: 'Visitors', x: 466, y: 524 },
  { label: 'Complaints', x: 974, y: 524 },
  { label: 'Documents', x: 1250, y: 524 },
  { label: 'Parking', x: 350, y: 618 },
  { label: 'Staff', x: 1090, y: 618 },
  { label: 'Operations', x: 720, y: 638 },
]

const CX = 720
const CY = 374

// Ring
const RX = 241
const RY = 188

const EYE_APEX = { dx: 0, dy: -167 } // straight above the center (both side lines meet here)
const EYE_TOP = { dx: 333, dy: -94 } // upper corner
const EYE_SIDE = { dx: 426, dy: 22 } // side corner (slightly below the center)
const EYE_BOTTOM = { dx: 147, dy: 148 } // point where the lines meet the ring

const flow = [
  'One Society',
  'One Platform',
  'One Database',
  'Every Operation Connected.',
]

const NODE_H = 34
const nodeWidth = (label: string) => label.length * 8.4 + 32

const pt = (side: 'left' | 'right', d: { dx: number; dy: number }) => {
  const s = side === 'left' ? -1 : 1
  return `${CX + s * d.dx},${CY + d.dy}`
}

const eyePoints = (side: 'left' | 'right') =>
  [EYE_APEX, EYE_TOP, EYE_SIDE, EYE_BOTTOM, EYE_TOP]
    .map((d) => pt(side, d))
    .join(' ')

/* ---------- Animation variants ---------- */

// Heading block: label, heading and paragraph appear one after another
const header: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.15 } },
}

// Text fades in while moving up
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: 'easeOut' } },
}

// Diagram wrapper: only passes "hidden" / "show" down to the SVG parts.
// Every part below has its own delay, so the ecosystem is built step by step.
const diagram: Variants = {
  hidden: {},
  show: {},
}

// Lines and the ring are "drawn" (pathLength 0 -> 1) after the given delay
const draw = (delay: number): Variants => ({
  hidden: { pathLength: 0, opacity: 0 },
  show: {
    pathLength: 1,
    opacity: 1,
    transition: { duration: 1.2, ease: 'easeInOut', delay },
  },
})

// Simple fade in after the given delay (glow, center text)
const fade = (delay: number): Variants => ({
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { duration: 0.8, ease: 'easeOut', delay } },
})

// Center circle: scales up from its own center
const centerCircle: Variants = {
  hidden: { opacity: 0, scale: 0.4 },
  show: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.8, ease: 'easeOut', delay: 1.1 },
  },
}

// Nodes: pop in one by one (index is passed through "custom")
const nodeVariant: Variants = {
  hidden: { opacity: 0, scale: 0.5 },
  show: (i: number) => ({
    opacity: 1,
    scale: 1,
    transition: { duration: 0.5, ease: 'easeOut', delay: 1.9 + i * 0.12 },
  }),
}

// Makes SVG elements scale from their own center instead of the SVG corner
const fromCenter = { transformBox: 'fill-box', transformOrigin: 'center' } as const

// Mobile: center circle and node chips
const mobileWrap: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06, delayChildren: 0.3 } },
}

const mobileCenter: Variants = {
  hidden: { opacity: 0, scale: 0.5 },
  show: { opacity: 1, scale: 1, transition: { duration: 0.7, ease: 'easeOut' } },
}

const mobileChip: Variants = {
  hidden: { opacity: 0, y: 16, scale: 0.8 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
}

// Bottom flow line: items appear one after another
const flowList: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.2, delayChildren: 0.3 } },
}

const flowItem: Variants = {
  hidden: { opacity: 0, x: -16 },
  show: { opacity: 1, x: 0, transition: { duration: 0.5, ease: 'easeOut' } },
}

const Ecosystem = () => {
  return (
    <section className="w-full overflow-hidden bg-[#061024] py-12 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-[1440px] px-5 sm:px-10 lg:px-24">
        {/* Heading: replays every time it enters the screen (scroll up or down) */}
        <motion.div
          variants={header}
          initial="hidden"
          whileInView="show"
          viewport={{ once: false, amount: 0.5 }}
          className="text-center"
        >
          <motion.p
            variants={fadeUp}
            className="text-[10px] font-semibold uppercase tracking-widest text-white/60"
          >
            One Connected Ecosystem
          </motion.p>

          <motion.h2
            variants={fadeUp}
            className="mt-4 text-3xl font-bold leading-[1.1] tracking-tight text-white sm:text-4xl lg:text-[56px]"
          >
            Everything Is Connected.
          </motion.h2>

          <motion.p
            variants={fadeUp}
            className="mx-auto mt-5 max-w-[440px] text-xs leading-6 text-white/60 sm:text-sm"
          >
            SocietyOS is not a collection of separate tools. Every module works
            from the same connected society data.
          </motion.p>
        </motion.div>

        {/* Desktop diagram (lg+): the ecosystem builds itself step by step */}
        <motion.div
          variants={diagram}
          initial="hidden"
          whileInView="show"
          viewport={{ once: false, amount: 0.35 }}
          className="mt-8 hidden w-full lg:block"
        >
          <svg
            viewBox="0 0 1440 660"
            className="h-auto w-full"
            fill="none"
            role="img"
            aria-label="SocietyOS connects society, units, residents, finance, documents, staff and operations"
          >
            <defs>
              <radialGradient id="eco-glow" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#2563EB" stopOpacity="0.6" />
                <stop offset="55%" stopColor="#2563EB" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#2563EB" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Step 1: outer ring is drawn first */}
            <motion.ellipse
              variants={draw(0)}
              cx={CX}
              cy={CY}
              rx={RX}
              ry={RY}
              stroke="#3B82F6"
              strokeOpacity="0.45"
              strokeWidth="1.2"
            />

            {/* Step 2: eye lines are drawn */}
            <g
              stroke="#3B82F6"
              strokeOpacity="0.5"
              strokeWidth="1.2"
              strokeLinejoin="round"
            >
              <motion.polyline variants={draw(0.4)} points={eyePoints('left')} />
              <motion.polyline variants={draw(0.4)} points={eyePoints('right')} />

              {/* Lines from the bottom points towards the inner circle */}
              <motion.line
                variants={draw(0.8)}
                x1={CX - EYE_BOTTOM.dx}
                y1={CY + EYE_BOTTOM.dy}
                x2={CX}
                y2={CY}
              />
              <motion.line
                variants={draw(0.8)}
                x1={CX + EYE_BOTTOM.dx}
                y1={CY + EYE_BOTTOM.dy}
                x2={CX}
                y2={CY}
              />
            </g>

            {/* Step 3: vertical axis is drawn */}
            <motion.line
              variants={draw(0.6)}
              x1={CX}
              y1="154"
              x2={CX}
              y2="610"
              stroke="#3B82F6"
              strokeOpacity="0.45"
              strokeWidth="1.2"
            />

            {/* Step 4: glow fades in, then the inner circle scales up */}
            <motion.circle
              variants={fade(1)}
              cx={CX}
              cy={CY}
              r="170"
              fill="url(#eco-glow)"
            />
            <motion.circle
              variants={centerCircle}
              style={fromCenter}
              cx={CX}
              cy={CY}
              r="102"
              fill="#071633"
              stroke="#3B6CF0"
              strokeOpacity="0.75"
              strokeWidth="1.5"
            />
            {/* Inner thin ring */}
            <motion.circle
              variants={centerCircle}
              style={fromCenter}
              cx={CX}
              cy={CY}
              r="91"
              stroke="#3B6CF0"
              strokeOpacity="0.35"
              strokeWidth="1"
            />

            {/* Step 5: center text fades in */}
            <motion.g variants={fade(1.5)}>
              <text
                x={CX}
                y={CY - 26}
                textAnchor="middle"
                fill="#3B82F6"
                fontSize="9"
                fontWeight="700"
                letterSpacing="2.5"
              >
                ONE
              </text>
              <text
                x={CX}
                y={CY + 2}
                textAnchor="middle"
                fill="#FFFFFF"
                fontSize="27"
                fontWeight="700"
              >
                SocietyOS
              </text>
              <text
                x={CX}
                y={CY + 28}
                textAnchor="middle"
                fill="#FFFFFF"
                fillOpacity="0.5"
                fontSize="8"
                fontWeight="700"
                letterSpacing="2.5"
              >
                GATEWAY
              </text>
            </motion.g>

            {/* Step 6: nodes pop in one by one around the ecosystem */}
            {nodes.map((n, i) => {
              const w = nodeWidth(n.label)
              return (
                <motion.g
                  key={n.label}
                  custom={i}
                  variants={nodeVariant}
                  style={fromCenter}
                >
                  <rect
                    x={n.x - w / 2}
                    y={n.y - NODE_H / 2}
                    width={w}
                    height={NODE_H}
                    rx="4"
                    fill="#0B1732"
                    stroke="#FFFFFF"
                    strokeOpacity="0.12"
                  />
                  <text
                    x={n.x}
                    y={n.y}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fill="#FFFFFF"
                    fontSize="11"
                    fontWeight="700"
                    letterSpacing="1.4"
                  >
                    {n.label.toUpperCase()}
                  </text>
                </motion.g>
              )
            })}
          </svg>
        </motion.div>

        {/* Mobile / tablet layout (below lg) */}
        <motion.div
          variants={mobileWrap}
          initial="hidden"
          whileInView="show"
          viewport={{ once: false, amount: 0.2 }}
          className="mt-10 lg:hidden"
        >
          <motion.div
            variants={mobileCenter}
            className="mx-auto flex h-32 w-32 flex-col items-center justify-center rounded-full border border-blue-500/60 bg-[#071633] shadow-[0_0_60px_rgba(37,99,235,0.5)]"
          >
            <span className="text-[8px] font-bold uppercase tracking-[0.25em] text-blue-500">
              One
            </span>
            <span className="text-lg font-bold text-white">SocietyOS</span>
            <span className="text-[7px] font-bold uppercase tracking-[0.25em] text-white/50">
              Gateway
            </span>
          </motion.div>

          <ul className="mt-8 grid grid-cols-2 gap-2 min-[420px]:grid-cols-3 sm:grid-cols-4">
            {nodes.map((n) => (
              <motion.li
                key={n.label}
                variants={mobileChip}
                className="rounded border border-white/10 bg-[#0B1732] px-2 py-2.5 text-center text-[9px] font-bold uppercase tracking-wider text-white"
              >
                {n.label}
              </motion.li>
            ))}
          </ul>
        </motion.div>

        {/* Bottom flow line: appears last, one item after another */}
        <motion.ul
          variants={flowList}
          initial="hidden"
          whileInView="show"
          viewport={{ once: false, amount: 0.8 }}
          className="mt-6 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[9px] text-white/50 sm:text-[10px] lg:mt-2"
        >
          {flow.map((item, i) => (
            <motion.li
              key={item}
              variants={flowItem}
              className="flex items-center gap-2"
            >
              {item}
              {i < flow.length - 1 && (
                <FiArrowRight className="text-blue-500" aria-hidden="true" />
              )}
            </motion.li>
          ))}
        </motion.ul>
      </div>
    </section>
  )
}

export default Ecosystem