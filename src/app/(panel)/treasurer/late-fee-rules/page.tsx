'use client'

import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion, type Variants } from 'framer-motion'
import {
  Plus, ChevronLeft, ChevronRight, Power, Trash2, EllipsisVertical, CheckCircle2, X,
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

// State of the three-dot dropdown (which row is open and where to draw it)
type RowMenu = { id: number; top: number; left: number }

// Dropdown size used for positioning (Status option + Delete)
const MENU_WIDTH = 184
const MENU_HEIGHT = 100

const initialRules: Rule[] = [
  { id: 1, name: 'Late Fee - Maintenance', head: 'Maintenance', grace: 5, feeType: 'Percentage', rate: 2, freq: 'Monthly', from: '2025-04-01', to: '2026-03-31', maxFee: 1000, active: true },
  { id: 2, name: 'Parking Penalty', head: 'Parking', grace: 3, feeType: 'Fixed', rate: 200, freq: 'One Time', from: '2025-04-01', to: '2026-03-31', maxFee: null, active: true },
  { id: 3, name: 'Interest Rule', head: 'Others', grace: 7, feeType: 'Interest', rate: 12, freq: 'Yearly', from: '2025-04-01', to: '2026-03-31', maxFee: null, active: false },
]

/* ---------- Shared styles (same as Secretary / Residents) ---------- */

const th = 'bg-white/4 px-2 py-2 font-medium first:rounded-l-md last:rounded-r-md'
const td = 'border-t border-[#272D39] px-2 py-2.5'

// Shared style of every plain item inside the 3-dot action menu
const menuBtn =
  'flex w-full cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-left text-slate-300 transition-colors hover:bg-white/5'

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

// Row actions: a single 3-dot button that opens the action menu
function Actions({
  rule,
  menuOpen,
  onMore,
}: {
  rule: Rule
  menuOpen: boolean
  onMore: (e: React.MouseEvent<HTMLButtonElement>) => void
}) {
  return (
    <button
      type="button"
      data-menu-btn
      title="More actions"
      aria-label={`Open actions menu for ${rule.name}`}
      aria-haspopup="menu"
      aria-expanded={menuOpen}
      onClick={onMore}
      className={`inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-[#272D39] text-slate-300 transition hover:bg-white/5 hover:text-white active:scale-90 ${
        menuOpen ? 'bg-white/5 text-white' : ''
      }`}
    >
      <EllipsisVertical className="h-3.5 w-3.5" />
    </button>
  )
}

/* ---------- Delete confirm popup ---------- */

type DeleteConfirmProps = {
  record: Rule
  onClose: () => void
  onConfirm: () => void
}

function DeleteConfirm({ record, onClose, onConfirm }: DeleteConfirmProps) {
  // Close on Esc + lock page scroll while the popup is open
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
      className="fixed inset-0 z-70 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.96 }}
        transition={{ duration: 0.3, ease: EASE }}
        className="w-full max-w-sm rounded-xl border border-[#272D39] bg-[#10131A] p-5 text-white shadow-2xl"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-500/15 text-red-400">
              <Trash2 className="h-4 w-4" />
            </span>
            <div>
              <h2 className="text-base font-bold">Delete Rule</h2>
              <p className="text-[11px] text-slate-400">This action cannot be undone.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="cursor-pointer rounded-md p-1.5 text-slate-400 hover:bg-white/5 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <p className="mt-4 text-xs text-slate-300">
          Are you sure you want to delete{' '}
          <span className="font-semibold text-white">{record.name}</span>?
        </p>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg border border-[#272D39] px-4 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/5 active:scale-95"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="cursor-pointer rounded-lg bg-red-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-red-600 active:scale-95"
          >
            Delete
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ---------- Page ---------- */
export default function LateFeeRulesPage() {
  const [rules, setRules] = useState<Rule[]>(initialRules)
  const [page, setPage] = useState(1)
  // Controls the Create Late Fee Rule drawer (open / closed)
  const [addOpen, setAddOpen] = useState(false)

  // Rule open in the Delete popup (null = closed)
  const [deleting, setDeleting] = useState<Rule | null>(null)
  // Small success message after an action
  const [toast, setToast] = useState('')

  // Three-dot dropdown state
  const [menu, setMenu] = useState<RowMenu | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // Hide the success message after 3 seconds
  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(''), 3000)
    return () => clearTimeout(t)
  }, [toast])

  // Close the dropdown on outside click, Escape key or page scroll
  useEffect(() => {
    if (!menu) return

    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      // Ignore clicks on the dropdown itself and on the three-dot buttons (they toggle on their own)
      if (menuRef.current?.contains(target) || target.closest('[data-menu-btn]')) return
      setMenu(null)
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenu(null)
    }
    const onScroll = () => setMenu(null)

    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('keydown', onKeyDown)
    window.addEventListener('scroll', onScroll, true)
    window.addEventListener('resize', onScroll)
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('scroll', onScroll, true)
      window.removeEventListener('resize', onScroll)
    }
  }, [menu])

  // Mark Active / Mark Inactive: flips the status (replace with an API call later)
  const toggleActive = (r: Rule) => {
    setMenu(null)
    setRules((prev) => prev.map((x) => (x.id === r.id ? { ...x, active: !x.active } : x)))
    setToast(`${r.name} is now ${r.active ? 'Inactive' : 'Active'}`)
  }

  // Delete: removes the rule (replace with an API call later)
  const handleDelete = () => {
    if (!deleting) return
    setRules((prev) => prev.filter((r) => r.id !== deleting.id))
    setToast(`${deleting.name} deleted`)
    setDeleting(null)
  }

  // Three-dot click: toggle the dropdown under the clicked button (flips up near the bottom of the screen)
  const toggleMenu = (e: React.MouseEvent<HTMLButtonElement>, id: number) => {
    if (menu?.id === id) {
      setMenu(null)
      return
    }
    const rect = e.currentTarget.getBoundingClientRect()
    const openUp = rect.bottom + MENU_HEIGHT + 8 > window.innerHeight
    setMenu({
      id,
      top: openUp ? rect.top - MENU_HEIGHT - 4 : rect.bottom + 4,
      left: Math.max(8, rect.right - MENU_WIDTH),
    })
  }

  // The rule the open dropdown belongs to
  const menuRule = menu ? rules.find((r) => r.id === menu.id) : null

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
                  <th className={`${th} text-center`}>Actions</th>
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

                    {/* Actions: single 3-dot button (same as Vendors) */}
                    <td className={`${td} text-center`}>
                      <Actions
                        rule={r}
                        menuOpen={menu?.id === r.id}
                        onMore={(e) => toggleMenu(e, r.id)}
                      />
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

      {/* Three-dot dropdown: fixed position so the table's overflow does not clip it */}
      {menu && menuRule && (
        <div
          ref={menuRef}
          role="menu"
          style={{ top: menu.top, left: menu.left, width: MENU_WIDTH }}
          className="fixed z-50 overflow-hidden rounded-lg border border-[#272D39] bg-[#10131A] p-1 text-[11px] shadow-xl shadow-black/40"
        >
          {/* Status option: the status the rule is not in right now */}
          <button
            type="button"
            role="menuitem"
            onClick={() => toggleActive(menuRule)}
            className={`${menuBtn} ${
              menuRule.active ? 'hover:text-slate-200' : 'hover:text-emerald-400'
            }`}
          >
            <Power className="h-3.5 w-3.5" /> Mark as {menuRule.active ? 'Inactive' : 'Active'}
          </button>

          {/* Divider */}
          <div className="my-1 border-t border-[#272D39]" />

          {/* Delete: opens the confirm popup */}
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setDeleting(menuRule)
              setMenu(null)
            }}
            className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-left text-red-400 transition-colors hover:bg-red-500/10"
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
        </div>
      )}

      {/* Create Late Fee Rule drawer (opens from the "Create Rule" button) */}
      <AddLateFeeRuleModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSave={handleSaveRule}
      />

      {/* Delete confirm popup */}
      <AnimatePresence>
        {deleting && (
          <DeleteConfirm
            key={deleting.id}
            record={deleting}
            onClose={() => setDeleting(null)}
            onConfirm={handleDelete}
          />
        )}
      </AnimatePresence>

      {/* Success message */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="fixed right-4 top-20 z-80 flex max-w-[90vw] items-center gap-2 rounded-lg border border-emerald-500/30 bg-[#10131A] px-4 py-3 text-xs text-emerald-400 shadow-xl"
          >
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}