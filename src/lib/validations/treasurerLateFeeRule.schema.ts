import { z } from 'zod'

/* ---------- Options and limits (TODO: fetch these from the API later) ---------- */

export const CHARGE_HEADS: string[] = ['Maintenance', 'Parking', 'Water', 'Electricity', 'Clubhouse', 'Others']
export const FREQUENCIES: string[] = ['One Time', 'Daily', 'Weekly', 'Monthly', 'Quarterly', 'Yearly']
export const FEE_TYPES_LIST: string[] = ['Fixed', 'Percentage', 'Interest']
export const APPLY_TO_LIST: string[] = ['All', 'Selected']

export const MAX_NAME = 100
export const MAX_NOTES = 500

const MAX_GRACE_DAYS = 90 // grace period limit
const MAX_FIXED = 100000 // max fixed late fee amount
const MAX_PERCENT = 100 // max percentage
const MAX_INTEREST = 36 // max interest % per year
const MAX_UNITS = 50 // max units in "Selected units"
const MAX_BACK_DAYS = 365 // effective date cannot be older than this
const MAX_AHEAD_DAYS = 730 // effective date cannot be more than 2 years ahead

/* ---------- Regex ---------- */

const AMOUNT_RE = /^\d+(\.\d{1,2})?$/
const NAME_RE = /^[A-Za-z0-9 &().,\-/]+$/
const UNIT_RE = /^[A-Za-z0-9]+-?[A-Za-z0-9]*$/

/* ---------- Date helpers ---------- */

// Checks that a "YYYY-MM-DD" string is a real calendar date (e.g. rejects 2025-02-31)
const isRealDate = (v: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false
  const [y, m, d] = v.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d
}

// Formats a Date as yyyy-mm-dd (local time)
const toISO = (d: Date) => {
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

// Returns today +/- N days as yyyy-mm-dd
const daysFromToday = (n: number) => {
  const d = new Date()
  d.setDate(d.getDate() + n)
  return toISO(d)
}

/* ---------- Schema (field level rules) ---------- */

export const treasurerLateFeeRuleSchema = z.object({
  // Rule name, e.g. Maintenance Late Fee
  name: z
    .string()
    .trim()
    .min(1, 'Rule name is required')
    .min(3, 'Rule name must be at least 3 characters')
    .max(MAX_NAME, `Rule name must be ${MAX_NAME} characters or less`)
    .regex(NAME_RE, 'Only letters, numbers and basic symbols are allowed'),

  chargeHead: z
    .string()
    .min(1, 'Select a charge head')
    .refine((v) => CHARGE_HEADS.includes(v), 'Select a valid charge head'),

  // Grace period is kept as text, so wrong input is caught
  grace: z
    .string()
    .trim()
    .min(1, 'Enter grace period')
    .regex(/^\d+$/, 'Enter whole days only'),

  feeType: z.string().refine((v) => FEE_TYPES_LIST.includes(v), 'Select a valid fee type'),

  // Rate is kept as text, so wrong input like "abc" is caught
  rate: z
    .string()
    .trim()
    .min(1, 'Enter a rate / amount')
    .regex(AMOUNT_RE, 'Enter a valid number (up to 2 decimals)'),

  frequency: z.string().refine((v) => FREQUENCIES.includes(v), 'Select a valid frequency'),

  effectiveFrom: z
    .string()
    .min(1, 'Select a date')
    .refine(isRealDate, 'Enter a valid date'),

  applyTo: z.string().refine((v) => APPLY_TO_LIST.includes(v), 'Select a valid option'),
  units: z.string(),
  notes: z.string().max(MAX_NOTES, `Notes must be ${MAX_NOTES} characters or less`),
})

/* ---------- Types ---------- */

export type LateFeeRuleValues = z.infer<typeof treasurerLateFeeRuleSchema>

/* ---------- Rules that depend on other fields ---------- */

function crossChecks(v: LateFeeRuleValues): Record<string, string> {
  const err: Record<string, string> = {}

  // Grace period range
  if (/^\d+$/.test(v.grace.trim()) && Number(v.grace) > MAX_GRACE_DAYS) {
    err.grace = `Grace period cannot be more than ${MAX_GRACE_DAYS} days`
  }

  // Rate range depends on the fee type
  if (AMOUNT_RE.test(v.rate.trim())) {
    const num = Number(v.rate)
    if (num <= 0) {
      err.rate = 'Rate / amount must be greater than 0'
    } else if (v.feeType === 'Fixed' && num > MAX_FIXED) {
      err.rate = 'Amount cannot be more than ₹ 1,00,000'
    } else if (v.feeType === 'Percentage' && num > MAX_PERCENT) {
      err.rate = 'Percentage cannot be more than 100%'
    } else if (v.feeType === 'Interest' && num > MAX_INTEREST) {
      err.rate = 'Interest cannot be more than 36% per year'
    }
  }

  // Effective date: not too old and not too far ahead
  if (isRealDate(v.effectiveFrom)) {
    if (v.effectiveFrom < daysFromToday(-MAX_BACK_DAYS)) {
      err.effectiveFrom = 'Date cannot be older than 1 year'
    } else if (v.effectiveFrom > daysFromToday(MAX_AHEAD_DAYS)) {
      err.effectiveFrom = 'Date cannot be more than 2 years ahead'
    }
  }

  // Selected units: at least one, valid format, no duplicates
  if (v.applyTo === 'Selected') {
    const list = v.units
      .split(',')
      .map((u) => u.trim())
      .filter(Boolean)

    if (list.length === 0) {
      err.units = 'Enter at least one unit'
    } else if (list.length > MAX_UNITS) {
      err.units = `You can add up to ${MAX_UNITS} units`
    } else if (list.some((u) => !UNIT_RE.test(u) || u.length > 10)) {
      err.units = 'Use unit numbers like A-101, B-204 separated by commas'
    } else if (new Set(list.map((u) => u.toUpperCase())).size !== list.length) {
      err.units = 'Remove duplicate units'
    }
  }

  return err
}

/* ---------- Helper used by the modal ---------- */

// Validates the whole form and returns { fieldName: "first error message" } (empty = valid)
export function validateLateFeeRule(values: LateFeeRuleValues): Record<string, string> {
  const errors: Record<string, string> = {}

  const result = treasurerLateFeeRuleSchema.safeParse(values)
  if (!result.success) {
    for (const issue of result.error.issues) {
      const key = String(issue.path[0] ?? 'form')
      // Keep only the first error of each field
      if (!errors[key]) errors[key] = issue.message
    }
  }

  // Add the rules that depend on other fields (do not overwrite field errors)
  const extra = crossChecks(values)
  for (const key of Object.keys(extra)) {
    if (!errors[key]) errors[key] = extra[key]
  }

  return errors
}