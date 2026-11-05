'use client'

import { useState } from 'react'
import { motion, type Variants } from 'framer-motion'
import {
  Users,
  Database,
  BarChart3,
  Headphones,
  Lock,
  Check,
  Pencil,
  Mail,
  UserCheck,
  type LucideIcon,
} from 'lucide-react'

/* ---------- Animation (same style as Residents.tsx) ---------- */

// Row of cards: cards appear one after another
const rowVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.2 } },
}

// Whole card: rises up with a small zoom, then children appear one by one
const cardVariants: Variants = {
  hidden: { opacity: 0, y: 80, scale: 0.9 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.8,
      ease: 'easeOut',
      staggerChildren: 0.12,
      delayChildren: 0.3,
    },
  },
}

// Each block inside the card fades in while moving up
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: 'easeOut' } },
}

// Feature list: rows appear one after another
const listVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1 } },
}

/* ---------- Data (replace with API / selected plan later) ---------- */

type Plan = {
  id: string
  name: string
  desc: string
  color: string // top section background color
  badgeYearly: string // badge text for yearly billing
  badgeMonthly: string // badge text for monthly billing
  yearlyHeaderPrice: number // big price shown for yearly billing
  yearlyNote: string // small text under the price (yearly billing)
  monthlyPrice: number // price for monthly billing
  yearlyTotal: number // yearly amount before discount
  discountPercent: number
  lineLabel: string // first line of the price breakup
  note: string // small note at the bottom
  features: { label: string; icon: LucideIcon }[]
}

const PLANS: Plan[] = [
  {
    id: 'starter',
    name: 'Starter',
    desc: 'For small societies getting started.',
    color: '#0C1930',
    badgeYearly: 'Starter Annual',
    badgeMonthly: 'Starter Monthly',
    yearlyHeaderPrice: 15,
    yearlyNote: '$182/yr',
    monthlyPrice: 19,
    yearlyTotal: 228,
    discountPercent: 20,
    lineLabel: 'Starter × 5 seats',
    note: '14-day free trial · No charge until Feb 14, 2027',
    features: [
      { label: 'Up to 5 seats', icon: Users },
      { label: '50 GB Storage', icon: Database },
      { label: 'Basic Reports', icon: BarChart3 },
      { label: 'Email Support', icon: Mail },
    ],
  },
  {
    id: 'growth',
    name: 'Growth',
    desc: 'For scaling teams that need automation and control.',
    color: '#0C1930',
    badgeYearly: 'Growth Annual · Popular',
    badgeMonthly: 'Growth Monthly · Popular',
    yearlyHeaderPrice: 49,
    yearlyNote: '$588/yr',
    monthlyPrice: 49,
    yearlyTotal: 588,
    discountPercent: 20,
    lineLabel: 'Growth × 25 seats',
    note: '14-day free trial · No charge until Feb 14, 2027',
    features: [
      { label: 'Up to 25 seats included', icon: Users },
      { label: '500 GB Secure Storage', icon: Database },
      { label: 'Advanced Analytics & Reports', icon: BarChart3 },
      { label: 'Priority Support + SLA', icon: Headphones },
      { label: 'SSO / SAML & Audit Logs', icon: Lock },
    ],
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    desc: 'For large communities needing full control.',
    color: '#0C1930',
    badgeYearly: 'Best for large societies',
    badgeMonthly: 'Best for large societies',
    yearlyHeaderPrice: 79,
    yearlyNote: '$950/yr',
    monthlyPrice: 99,
    yearlyTotal: 1188,
    discountPercent: 20,
    lineLabel: 'Enterprise × unlimited seats',
    note: 'Custom onboarding · No charge until Feb 14, 2027',
    features: [
      { label: 'Unlimited seats', icon: Users },
      { label: '2 TB Storage', icon: Database },
      { label: 'Custom Analytics + API', icon: BarChart3 },
      { label: 'Dedicated Manager', icon: UserCheck },
      { label: '24/7 Support, SSO', icon: Headphones },
    ],
  },
]

// Money format: $1,234.00
const money = (n: number) =>
  `$${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

/* ---------- Single plan card (same design for every plan) ---------- */

function PlanCard({ plan }: { plan: Plan }) {
  // "monthly" or "yearly" billing
  const [billing, setBilling] = useState<'monthly' | 'yearly'>('yearly')
  const isYearly = billing === 'yearly'

  // Price calculation
  const subtotal = isYearly ? plan.yearlyTotal : plan.monthlyPrice
  const discount = isYearly ? (plan.yearlyTotal * plan.discountPercent) / 100 : 0
  const tax = 0
  const total = subtotal - discount + tax

  return (
    // Card column: 340px max width, full height so all cards match in a row
    <motion.div
      variants={cardVariants}
      className="mx-auto flex h-full w-full max-w-[340px] flex-col"
    >
      {/* =========================================================
          MAIN PLAN CARD (colored top + light bottom)
          ========================================================= */}
      <div
        className="flex h-full flex-col overflow-hidden rounded-[18px] shadow-xl"
        style={{ background: plan.color }}
      >
        {/* ---------- Colored top section ---------- */}
        <div className="shrink-0 px-3.5 pb-3 pt-3 text-white sm:px-4 sm:pt-3.5">
          {/* Badge + Edit plan button */}
          <motion.div
            variants={fadeUp}
            className="flex items-center justify-between gap-2"
          >
            <span className="flex items-center gap-1.5 rounded-full border border-white/15 bg-white/5 px-2 py-0.5 text-[9px] font-medium text-white sm:text-[10px]">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              {isYearly ? plan.badgeYearly : plan.badgeMonthly}
            </span>

            <button
              type="button"
              className="flex cursor-pointer items-center gap-1 rounded-lg border border-white/15 bg-white/5 px-2 py-0.5 text-[9px] font-medium text-white transition hover:bg-white/10 sm:text-[10px]"
            >
              <Pencil className="h-2.5 w-2.5" />
              Edit plan
            </button>
          </motion.div>

          {/* Plan name + price */}
          <motion.div
            variants={fadeUp}
            className="mt-2.5 flex items-start justify-between gap-3"
          >
            <div className="min-w-0">
              <h3 className="text-lg font-bold leading-tight sm:text-xl">
                {plan.name}
              </h3>
              <p className="mt-0.5 max-w-[150px] text-[9px] leading-snug text-slate-300 sm:text-[10px]">
                {plan.desc}
              </p>
            </div>

            <div className="shrink-0 text-right">
              <p className="text-xl font-bold leading-none sm:text-2xl">
                ${isYearly ? plan.yearlyHeaderPrice : plan.monthlyPrice}
                <span className="ml-0.5 text-[11px] font-normal text-slate-300">
                  /mo
                </span>
              </p>
              <p className="mt-1 text-[9px] leading-tight text-slate-300">
                {isYearly ? (
                  <>
                    billed annually ·
                    <br />
                    {plan.yearlyNote}
                  </>
                ) : (
                  'billed monthly'
                )}
              </p>
            </div>
          </motion.div>

          {/* Monthly / Yearly toggle */}
          <motion.div
            variants={fadeUp}
            className="mt-2.5 grid grid-cols-2 rounded-full bg-white/10 p-0.5"
          >
            <button
              type="button"
              onClick={() => setBilling('monthly')}
              className={`cursor-pointer rounded-full py-1 text-[10px] font-semibold transition sm:text-[11px] ${
                !isYearly ? 'bg-white' : 'text-slate-300'
              }`}
              style={!isYearly ? { color: plan.color } : undefined}
            >
              Monthly
            </button>

            <button
              type="button"
              onClick={() => setBilling('yearly')}
              className={`flex cursor-pointer items-center justify-center gap-1.5 rounded-full py-1 text-[10px] font-semibold transition sm:text-[11px] ${
                isYearly ? 'bg-white' : 'text-slate-300'
              }`}
              style={isYearly ? { color: plan.color } : undefined}
            >
              Yearly
              <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[8px] font-semibold text-emerald-600 sm:text-[9px]">
                -{plan.discountPercent}%
              </span>
            </button>
          </motion.div>
        </div>

        {/* ---------- Light bottom section ---------- */}
        <div className="flex flex-1 flex-col rounded-t-[18px] bg-[#FAFAF7] px-3.5 pb-3 pt-3 text-slate-900 sm:px-4">
          {/* Section label */}
          <motion.p
            variants={fadeUp}
            className="text-[8px] font-semibold uppercase tracking-widest text-slate-400 sm:text-[9px]"
          >
            Included in your plan
          </motion.p>

          {/* Feature list (rows appear one by one) */}
          <motion.ul
            variants={listVariants}
            className="mt-2 flex flex-col gap-1.5"
          >
            {plan.features.map(({ label, icon: Icon }) => (
              <motion.li
                key={label}
                variants={fadeUp}
                className="flex items-center gap-2"
              >
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-blue-50 text-[#2563EB]">
                  <Icon className="h-3 w-3" />
                </span>
                <span className="min-w-0 flex-1 truncate text-[10px] font-medium text-slate-700 sm:text-[11px]">
                  {label}
                </span>
                <Check className="h-3 w-3 shrink-0 text-emerald-500" />
              </motion.li>
            ))}
          </motion.ul>

          {/* Bottom block (pushed down so every card ends at the same level) */}
          <div className="mt-auto">
            {/* Divider */}
            <div className="my-2.5 border-t border-slate-200" />

            {/* Price breakup */}
            <motion.div
              variants={fadeUp}
              className="flex flex-col gap-1 text-[10px] sm:text-[11px]"
            >
              <div className="flex items-center justify-between text-slate-500">
                <span>{plan.lineLabel}</span>
                <span className="font-medium text-slate-800">{money(subtotal)}</span>
              </div>

              <div className="flex items-center justify-between text-slate-500">
                <span>Annual discount ({plan.discountPercent}%)</span>
                <span className="font-medium text-emerald-600">
                  {discount > 0 ? `-${money(discount)}` : money(0)}
                </span>
              </div>

              <div className="flex items-center justify-between text-slate-500">
                <span>Taxes &amp; fees (est.)</span>
                <span className="font-medium text-slate-800">{money(tax)}</span>
              </div>
            </motion.div>

            {/* Total due today */}
            <motion.div
              variants={fadeUp}
              className="mt-2 flex items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2"
            >
              <span className="text-[10px] font-semibold text-slate-900 sm:text-[11px]">
                Total due today
              </span>
              <span className="text-sm font-bold text-slate-900 sm:text-base">
                {money(total)}
              </span>
            </motion.div>

            {/* Free trial note */}
            <motion.p
              variants={fadeUp}
              className="mt-2 flex items-center justify-center gap-1.5 text-center text-[9px] text-slate-500 sm:text-[10px]"
            >
              <Lock className="h-3 w-3 shrink-0" />
              {plan.note}
            </motion.p>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

/* ---------- Component ---------- */

export default function PlanSummaryCard() {
  return (
    // Outer wrapper: centers the cards and keeps a gap from the parent div edges
    <div className="flex w-full justify-center px-4 py-6 sm:px-6 sm:py-8">
      {/* Cards row: 1 column on mobile, 3 columns on large screens.
          Animation replays every time it enters the screen (scroll up or down) */}
      <motion.div
        variants={rowVariants}
        initial="hidden"
        whileInView="show"
        viewport={{ once: false, amount: 0.15 }}
        className="grid w-full max-w-[1100px] grid-cols-1 items-stretch gap-5 lg:grid-cols-3"
      >
        {PLANS.map((plan) => (
          <PlanCard key={plan.id} plan={plan} />
        ))}
      </motion.div>
    </div>
  )
}