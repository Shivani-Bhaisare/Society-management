import { z } from 'zod'

/* ---------- Options (TODO: fetch these from the API later) ---------- */

export const WINGS: string[] = ['All Wings', 'A', 'B', 'C']
export const PLANS: string[] = ['Monthly Maintenance', 'Basic Plan']

/* ---------- Date helpers ---------- */

// Checks that a "YYYY-MM-DD" string is a real calendar date (e.g. rejects 2025-02-31)
const isRealDate = (v: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false
  const [y, m, d] = v.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d
}

// Checks that a "YYYY-MM" string is a valid month in a sensible year range
const isRealMonth = (v: string) => {
  if (!/^\d{4}-\d{2}$/.test(v)) return false
  const [y, m] = v.split('-').map(Number)
  return m >= 1 && m <= 12 && y >= 2000 && y <= 2100
}

/* ---------- Schema ---------- */

export const treasurerGenerateBillsSchema = z
  .object({
    // Billing month, e.g. 2025-04
    month: z
      .string()
      .min(1, 'Billing month is required')
      .refine(isRealMonth, 'Enter a valid billing month'),

    // Due date, e.g. 2025-04-10
    dueDate: z
      .string()
      .min(1, 'Due date is required')
      .refine(isRealDate, 'Enter a valid due date'),

    // Wing and charge plan must be one of the allowed options
    wing: z.string().refine((v) => WINGS.includes(v), 'Select a valid wing'),
    plan: z.string().refine((v) => PLANS.includes(v), 'Select a valid charge plan'),

    // Flat selection
    flatMode: z.enum(['all', 'selected']),
    pickedFlats: z.array(z.string()),

    // Counts and total calculated from the form
    headCount: z.number(),
    flatCount: z.number(),
    total: z.number(),
  })
  .superRefine((v, ctx) => {
    // Due date rules (only when both month and due date are valid)
    if (isRealMonth(v.month) && isRealDate(v.dueDate)) {
      if (v.dueDate < `${v.month}-01`) {
        ctx.addIssue({
          code: 'custom',
          path: ['dueDate'],
          message: 'Due date cannot be before the billing month',
        })
      } else {
        // Due date must be within 1 year after the billing month starts
        const [y, m] = v.month.split('-').map(Number)
        const limit = new Date(y + 1, m - 1, 1)
        const due = new Date(`${v.dueDate}T00:00:00`)
        if (due >= limit) {
          ctx.addIssue({
            code: 'custom',
            path: ['dueDate'],
            message: 'Due date must be within 1 year of the billing month',
          })
        }
      }
    }

    // At least one charge head
    if (v.headCount === 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['heads'],
        message: 'Select at least one charge head',
      })
    }

    // Flats: at least one flat must be picked, and the wing must have flats
    if (v.flatMode === 'selected' && v.pickedFlats.length === 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['flats'],
        message: 'Select at least one flat',
      })
    } else if (v.flatCount === 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['flats'],
        message: 'No flats found for this wing',
      })
    }

    // Total amount must be more than zero (checked only when heads and flats are fine)
    if (v.headCount > 0 && v.flatCount > 0 && v.total <= 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['total'],
        message: 'Total bill amount cannot be zero. Check the selected charge heads.',
      })
    }
  })

/* ---------- Types ---------- */

export type BillingValues = z.infer<typeof treasurerGenerateBillsSchema>

/* ---------- Helper used by the modal ---------- */

// Runs the schema and returns { fieldName: "first error message" } (empty object = valid)
export function validateBilling(values: BillingValues): Record<string, string> {
  const result = treasurerGenerateBillsSchema.safeParse(values)
  const errors: Record<string, string> = {}

  if (!result.success) {
    for (const issue of result.error.issues) {
      const key = String(issue.path[0] ?? 'form')
      // Keep only the first error of each field
      if (!errors[key]) errors[key] = issue.message
    }
  }

  return errors
}