'use client'

import { useState } from 'react'
import { motion, type Variants } from 'framer-motion'
import {
  Plus, ChevronLeft, ChevronRight, Power, Trash2,
} from 'lucide-react'
import { Card, Badge } from '@/Components/ui'
import AddLateFeeRuleModal, { type AddLateFeeRulePayload } from '@/Components/AddLateFeeRuleModal' // adjust the path to your folder

/* ---------- Animation ---------- */

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]
const VIEWPORT = { once: false, amount: 0.15 }

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
}

const item: Variants = {
  hidden: { opacity: 0, y: 30, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.7, ease: EASE } },
}

/* ---------- Types + data (replace with API data later) ---------- */

type FeeType = 'Percentage' | 'Fixed' | 'Interest'

type Rule = {
  id: number
  name: string
  head: string
  grace: number
  feeType: FeeType
  rate: number
  freq: string
  from: string // yyyy-mm-dd
  to: string // yyyy-mm-dd
  maxFee: number | null
  active: boolean
}

const initialRules: Rule[] = [
  { id: 1, name: 'Late Fee - Maintenance', head: 'Maintenance', grace: 5, feeType: 'Percentage', rate: 2, freq: 'Monthly', from: '2025-04-01', to: '2026-03-31', maxFee: 1000, active: true },
  { id: 2, name: 'Parking Penalty', head: 'Parking', grace: 3, feeType: 'Fixed', rate: 200, freq: 'One Time', from: '2025-04-01', to: '2026-03-31', maxFee: null, active: true },
  { id: 3, name: 'Interest Rule', head: 'Others', grace: 7, feeType: 'Interest', rate: 12, freq: 'Yearly', from: '2025-04-01', to: '2026-03-31', maxFee: null, active: false },
]

/* ---------- Shared styles (same as Secretary / Residents) ---------- */

const th = 'bg-white/4 px-2 py-2 font-medium first:rounded-l-md last:rounded-r-md'
const td = 'border-t border-[#272D39] px-2 py-2.5'

// Small icon button used in the Actions column
const iconBtn = 'cursor-pointer rounded-md p-1.5 transition active:scale-90'

/* ---------- Small helpers ---------- */

// 2025-04-01 -> 01 Apr 2025
function formatDate(d: string) {
  if (!d) return '-'
  const dt = new Date(`${d}T00:00:00`)
  return dt.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
}

// Shows the rate in the format used by the table
function formatRate(r: Rule) {
  if (r.feeType === 'Fixed') return `₹ ${r.rate.toLocaleString('en-IN')}`
  if (r.feeType === 'Interest') return `${r.rate}% p.a.`
  return `${r.rate}%`
}

/* ---------- Page ---------- */
export default function LateFeeRulesPage() {
  const [rules, setRules] = useState<Rule[]>(initialRules)
  const [page, setPage] = useState(1)
  // Controls the Create Late Fee Rule drawer (open / closed)
  const [addOpen, setAddOpen] = useState(false)

  // Row actions
  const toggleActive = (id: number) => {
    setRules((prev) => prev.map((r) => (r.id === id ? { ...r, active: !r.active } : r)))
  }
  const remove = (id: number) => {
    setRules((prev) => prev.filter((r) => r.id !== id))
  }

  // Called when the drawer form is saved: adds the new rule at the top of the table
  const handleSaveRule = (data: AddLateFeeRulePayload) => {
    // TODO: call the API here, then refresh the rules list
    const newRule: Rule = {
      id: data.id,
      name: data.name,
      head: data.chargeHead,
      grace: data.graceDays,
      feeType: data.feeType,
      rate: data.rate,
      freq: data.frequency,
      from: data.effectiveFrom,
      to: '',
      maxFee: null,
      active: data.active,
    }
    setRules((prev) => [newRule, ...prev])
    setPage(1)
  }

  return (
    <div className="mx-auto flex w-full max-w-350 flex-col gap-4">
      {/* Heading */}
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
        className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
      >
        <motion.div variants={item}>
          <h1 className="text-xl font-bold sm:text-2xl">Late Fee Configuration</h1>
          <p className="text-xs text-slate-400">Set rules for late payment interest and penalties</p>
        </motion.div>

        {/* Create button: opens the Create Late Fee Rule drawer */}
        <motion.div variants={item}>
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-linear-to-r from-[#6C63FF] to-[#4DA3FF] px-4 py-2.5 text-xs font-semibold text-white transition hover:opacity-90 active:scale-95"
          >
            <Plus className="h-3.5 w-3.5" /> Create Rule
          </button>
        </motion.div>
      </motion.div>

      {/* Saved rules table */}
      <motion.div
        variants={item}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
      >
        <Card title="Saved Rules" sub={`Total ${rules.length} rules`}>
          {/* Table scrolls sideways on small screens */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-200 text-left text-[11px]">
              <thead className="text-slate-400">
                <tr>
                  <th className={th}>Rule Name</th>
                  <th className={th}>Charge Head</th>
                  <th className={th}>Grace Period</th>
                  <th className={th}>Fee Type</th>
                  <th className={th}>Rate / Amount</th>
                  <th className={th}>Frequency</th>
                  <th className={th}>Effective From</th>
                  <th className={th}>Status</th>
                  <th className={`${th} text-right`}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {rules.map((r, i) => (
                  <motion.tr
                    key={r.id}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={VIEWPORT}
                    transition={{ duration: 0.5, ease: EASE, delay: i * 0.05 }}
                    className="hover:bg-white/2"
                  >
                    <td className={`${td} font-medium`}>{r.name}</td>
                    <td className={`${td} text-slate-300`}>{r.head}</td>
                    <td className={`${td} text-slate-400`}>{r.grace} days</td>
                    <td className={`${td} text-slate-300`}>{r.feeType}</td>
                    <td className={`${td} whitespace-nowrap text-slate-300`}>{formatRate(r)}</td>
                    <td className={`${td} text-slate-400`}>{r.freq}</td>
                    <td className={`${td} whitespace-nowrap text-slate-400`}>{formatDate(r.from)}</td>
                    <td className={td}>
                      <Badge tone={r.active ? 'green' : 'gray'}>{r.active ? 'Active' : 'Inactive'}</Badge>
                    </td>

                    {/* Actions: icons directly in the row (no 3-dot menu) */}
                    <td className={`${td} text-right`}>
                      <div className="flex items-center justify-end gap-0.5">
                        {/* Mark Active / Mark Inactive */}
                        <button
                          type="button"
                          title={r.active ? 'Mark Inactive' : 'Mark Active'}
                          aria-label={r.active ? 'Mark Inactive' : 'Mark Active'}
                          onClick={() => toggleActive(r.id)}
                          className={`${iconBtn} ${
                            r.active
                              ? 'text-emerald-400 hover:bg-emerald-500/10'
                              : 'text-slate-500 hover:bg-white/5 hover:text-white'
                          }`}
                        >
                          <Power className="h-4 w-4" />
                        </button>

                        {/* Delete */}
                        <button
                          type="button"
                          title="Delete"
                          aria-label="Delete"
                          onClick={() => remove(r.id)}
                          className={`${iconBtn} text-red-400 hover:bg-red-500/10`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}

                {rules.length === 0 && (
                  <tr>
                    <td colSpan={9} className={`${td} py-8 text-center text-slate-500`}>
                      No rules found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-4 flex flex-col items-center justify-between gap-3 text-[11px] text-slate-400 sm:flex-row">
            <span>Showing {rules.length ? `1-${rules.length}` : '0'} of {rules.length}</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Previous"
                onClick={() => setPage(1)}
                className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-[#272D39] hover:bg-white/5"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setPage(1)}
                className={`h-7 w-7 cursor-pointer rounded-md border text-[11px] ${
                  page === 1
                    ? 'border-transparent bg-linear-to-br from-[#6C63FF] to-[#4DA3FF] font-semibold text-white'
                    : 'border-[#272D39] hover:bg-white/5'
                }`}
              >
                1
              </button>
              <button
                type="button"
                aria-label="Next"
                className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-[#272D39] hover:bg-white/5"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Create Late Fee Rule drawer (opens from the "Create Rule" button) */}
      <AddLateFeeRuleModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSave={handleSaveRule}
      />
    </div>
  )
}