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

const EYE_APEX = { dx: 0, dy: -167 } // center ke seedha upar (dono side ki lines yahin milti hain)
const EYE_TOP = { dx: 333, dy: -94 } // upar wala corner
const EYE_SIDE = { dx: 426, dy: 22 } // side wala corner (center se thoda neeche)
const EYE_BOTTOM = { dx: 147, dy: 148 } // ring par milne wala point

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

const Ecosystem = () => {
  return (
    <section className="w-full bg-[#061024] py-12 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-[1440px] px-5 sm:px-10 lg:px-24">
        {/* Heading */}
        <div className="text-center">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-white/60">
            One Connected Ecosystem
          </p>

          <h2 className="mt-4 text-3xl font-bold leading-[1.1] tracking-tight text-white sm:text-4xl lg:text-[56px]">
            Everything Is Connected.
          </h2>

          <p className="mx-auto mt-5 max-w-[440px] text-xs leading-6 text-white/60 sm:text-sm">
            SocietyOS is not a collection of separate tools. Every module works
            from the same connected society data.
          </p>
        </div>

        {/* Desktop diagram (lg+) */}
        <div className="mt-8 hidden w-full lg:block">
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

            {/* Outer ring */}
            <ellipse
              cx={CX}
              cy={CY}
              rx={RX}
              ry={RY}
              stroke="#3B82F6"
              strokeOpacity="0.45"
              strokeWidth="1.2"
            />

            {/* Eye lines */}
            <g
              stroke="#3B82F6"
              strokeOpacity="0.5"
              strokeWidth="1.2"
              strokeLinejoin="round"
            >
              <polyline points={eyePoints('left')} />
              <polyline points={eyePoints('right')} />

              {/* bottom point se inner circle ki taraf jaati line */}
              <line
                x1={CX - EYE_BOTTOM.dx}
                y1={CY + EYE_BOTTOM.dy}
                x2={CX}
                y2={CY}
              />
              <line
                x1={CX + EYE_BOTTOM.dx}
                y1={CY + EYE_BOTTOM.dy}
                x2={CX}
                y2={CY}
              />
            </g>

            {/* Vertical axis */}
            <line
              x1={CX}
              y1="154"
              x2={CX}
              y2="610"
              stroke="#3B82F6"
              strokeOpacity="0.45"
              strokeWidth="1.2"
            />

            {/* Glow + inner circle */}
            <circle cx={CX} cy={CY} r="170" fill="url(#eco-glow)" />
            <circle
              cx={CX}
              cy={CY}
              r="102"
              fill="#071633"
              stroke="#3B6CF0"
              strokeOpacity="0.75"
              strokeWidth="1.5"
            />
            {/* Inner thin ring */}
            <circle
              cx={CX}
              cy={CY}
              r="91"
              stroke="#3B6CF0"
              strokeOpacity="0.35"
              strokeWidth="1"
            />

            {/* Center text */}
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

            {/* Nodes */}
            {nodes.map((n) => {
              const w = nodeWidth(n.label)
              return (
                <g key={n.label}>
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
                </g>
              )
            })}
          </svg>
        </div>

        {/* Mobile / tablet layout (below lg) */}
        <div className="mt-10 lg:hidden">
          <div className="mx-auto flex h-32 w-32 flex-col items-center justify-center rounded-full border border-blue-500/60 bg-[#071633] shadow-[0_0_60px_rgba(37,99,235,0.5)]">
            <span className="text-[8px] font-bold uppercase tracking-[0.25em] text-blue-500">
              One
            </span>
            <span className="text-lg font-bold text-white">SocietyOS</span>
            <span className="text-[7px] font-bold uppercase tracking-[0.25em] text-white/50">
              Gateway
            </span>
          </div>

          <ul className="mt-8 grid grid-cols-2 gap-2 min-[420px]:grid-cols-3 sm:grid-cols-4">
            {nodes.map((n) => (
              <li
                key={n.label}
                className="rounded border border-white/10 bg-[#0B1732] px-2 py-2.5 text-center text-[9px] font-bold uppercase tracking-wider text-white"
              >
                {n.label}
              </li>
            ))}
          </ul>
        </div>

        {/* Bottom flow line */}
        <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-[9px] text-white/50 sm:text-[10px] lg:mt-2">
          {flow.map((item, i) => (
            <li key={item} className="flex items-center gap-2">
              {item}
              {i < flow.length - 1 && (
                <FiArrowRight className="text-blue-500" aria-hidden="true" />
              )}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}
export default Ecosystem