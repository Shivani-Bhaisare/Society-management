import { z } from 'zod'

/* ---------- Options (TODO: fetch these from the API later) ---------- */

// Labels of the calculation types (same labels as CALC_TYPES in the modal)
export const CALC_LABELS: string[] = ['Fixed Amount', 'Percentage', 'Per Sq. Ft.']
export const FREQUENCIES: string[] = ['Monthly', 'Quarterly', 'Half Yearly', 'Yearly']
export const APPLICABLE_TO: string[] = ['All Flats', 'Selected Wings', 'Selected Flats']
export const TAX_OPTIONS: string[] = ['As applicable', 'No Tax', 'GST 18%']
export const WINGS: string[] = ['A', 'B', 'C']
export const FLATS: string[] = ['A-101', 'A-102', 'B-201', 'B-202', 'C-101']

/* ---------- Limits ---------- */

const MAX_FIXED = 1000000 // max amount for Fixed Amount
const MAX_PER_SQFT = 1000 // max rate for Per Sq. Ft.
const MAX_PERCENT = 100 // max rate for Percentage

/* ---------- Schema (field level rules) ---------- */

export const treasurerChargeHeadSchema = z.object({
  // Charge name, e.g. Maintenance
  name: z
    .string()
    .trim()
    .min(1, 'Charge name is required')
    .min(2, 'Charge name must be at least 2 characters')
    .max(50, 'Charge name must be 50 characters or less')
    .regex(/^[A-Za-z0-9 &().\-/]+$/, 'Only letters, numbers and basic symbols are allowed'),

  // Charge code, e.g. CHG-001
  code: z
    .string()
    .trim()
    .min(1, 'Charge code is required')
    .max(20, 'Charge code must be 20 characters or less')
    .regex(/^[A-Za-z0-9-]+$/, 'Use only letters, numbers and hyphen (-)'),

  // Calculation type label, e.g. Fixed Amount
  calc: z.string().refine((v) => CALC_LABELS.includes(v), 'Select a valid calculation type'),

  // Amount is kept as text here, so wrong input like "abc" is caught
  amount: z
    .string()
    .trim()
    .min(1, 'Amount / rate is required')
    .regex(/^\d+(\.\d{1,2})?$/, 'Enter a valid number (up to 2 decimals)'),

  freq: z.string().refine((v) => FREQUENCIES.includes(v), 'Select a valid frequency'),
  appliesTo: z.string().refine((v) => APPLICABLE_TO.includes(v), 'Select a valid option'),
  tax: z.string().refine((v) => TAX_OPTIONS.includes(v), 'Select a valid tax option'),

  // Selected wings / flats (checked again in crossChecks below)
  wings: z.array(z.string()),
  flats: z.array(z.string()),

  // Optional note
  description: z.string().max(200, 'Description must be 200 characters or less'),
})

/* ---------- Types ---------- */

export type ChargeHeadValues = z.infer<typeof treasurerChargeHeadSchema>

/* ---------- Which fields belong to which step ---------- */

export const STEP_FIELDS: Record<number, string[]> = {
  1: ['name', 'code', 'calc', 'amount', 'freq', 'appliesTo', 'tax'],
  2: ['wings', 'flats'],
  3: ['description'],
}

/* ---------- Rules that depend on other fields ---------- */

function crossChecks(v: ChargeHeadValues): Record<string, string> {
  const err: Record<string, string> = {}

  // Amount range depends on the calculation type
  if (/^\d+(\.\d{1,2})?$/.test(v.amount.trim())) {
    const num = Number(v.amount)
    if (num <= 0) {
      err.amount = 'Amount / rate must be greater than 0'
    } else if (v.calc === 'Percentage' && num > MAX_PERCENT) {
      err.amount = 'Percentage cannot be more than 100'
    } else if (v.calc === 'Fixed Amount' && num > MAX_FIXED) {
      err.amount = 'Amount cannot be more than ₹ 10,00,000'
    } else if (v.calc === 'Per Sq. Ft.' && num > MAX_PER_SQFT) {
      err.amount = 'Rate cannot be more than ₹ 1,000 per sq. ft.'
    }
  }

  // Wings are required only for "Selected Wings"
  if (v.appliesTo === 'Selected Wings') {
    if (v.wings.length === 0) err.wings = 'Select at least one wing'
    else if (v.wings.some((w) => !WINGS.includes(w))) err.wings = 'Select a valid wing'
  }

  // Flats are required only for "Selected Flats"
  if (v.appliesTo === 'Selected Flats') {
    if (v.flats.length === 0) err.flats = 'Select at least one flat'
    else if (v.flats.some((f) => !FLATS.includes(f))) err.flats = 'Select a valid flat'
  }

  return err
}

/* ---------- Helpers used by the modal ---------- */

// Validates the whole form and returns { fieldName: "first error message" } (empty = valid)
export function validateChargeHead(values: ChargeHeadValues): Record<string, string> {
  const errors: Record<string, string> = {}

  const result = treasurerChargeHeadSchema.safeParse(values)
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

// Validates only the fields of one step
export function validateChargeHeadStep(
  step: number,
  values: ChargeHeadValues,
): Record<string, string> {
  const all = validateChargeHead(values)
  const fields = STEP_FIELDS[step] ?? []
  const errors: Record<string, string> = {}
  for (const key of fields) {
    if (all[key]) errors[key] = all[key]
  }
  return errors
}

// Returns the first step (1 to 3) that has an error, or 0 if everything is valid
export function firstInvalidStep(values: ChargeHeadValues): number {
  const all = validateChargeHead(values)
  for (const step of [1, 2, 3]) {
    if (STEP_FIELDS[step].some((key) => all[key])) return step
  }
  return 0
}