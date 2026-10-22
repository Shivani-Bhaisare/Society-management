import { z } from 'zod'

/* ---------- Limits ---------- */
export const MAX_TITLE = 80
export const MAX_PARTY = 60
export const MAX_REFERENCE = 30
export const MAX_NOTES = 500
export const MAX_AMOUNT = 100000000 // 10 crore
export const MAX_FILE_MB = 10

// Local date (YYYY-MM-DD), so the date does not shift because of the timezone
export const todayISO = () => {
  const d = new Date()
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .split('T')[0]
}

/* ---------- Fields ---------- */
const titleField = z
  .string()
  .trim()
  .min(1, 'Transaction title is required')
  .min(3, 'Title must be at least 3 characters')
  .max(MAX_TITLE, `Title can be max ${MAX_TITLE} characters`)

const amountField = z
  .string()
  .min(1, 'Amount is required')
  .regex(/^\d+(\.\d{1,2})?$/, 'Enter a valid amount (max 2 decimal places)')
  .refine((v) => Number(v) > 0, 'Amount must be greater than 0')
  .refine((v) => Number(v) <= MAX_AMOUNT, 'Amount is too large')

const dateField = z
  .string()
  .min(1, 'Date is required')
  .refine((v) => v <= todayISO(), 'Date cannot be in the future')

/* ---------- Schemas ---------- */

// "Save as Draft": only the title is checked
export const transactionDraftSchema = z.object({
  title: titleField,
})

// "Add Transaction": full validation
export const transactionSchema = z
  .object({
    type: z.enum(['Income', 'Expense']),
    title: titleField,
    category: z.string().min(1, 'Category is required'),
    amount: amountField,
    date: dateField,
    paymentMode: z.string().min(1, 'Payment mode is required'),
    reference: z.string().trim(),
    party: z.string().trim(),
    wing: z.string(),
    notes: z.string().max(MAX_NOTES, `Notes can be max ${MAX_NOTES} characters`),
    status: z.string().min(1, 'Status is required'),
  })
  .superRefine((d, ctx) => {
    // Reference no. is required for every payment mode except Cash
    if (d.paymentMode !== 'Cash' && !d.reference) {
      ctx.addIssue({
        code: 'custom',
        path: ['reference'],
        message: `Reference no. is required for ${d.paymentMode}`,
      })
    } else if (d.reference && !/^[A-Za-z0-9\-/@._]{3,30}$/.test(d.reference)) {
      ctx.addIssue({
        code: 'custom',
        path: ['reference'],
        message: 'Use 3-30 characters: letters, numbers, - / @ . _',
      })
    }

    // Party is optional, but if filled it must be valid
    if (d.party && d.party.length < 2) {
      ctx.addIssue({
        code: 'custom',
        path: ['party'],
        message: 'Name must be at least 2 characters',
      })
    }
  })

export type TransactionFormValues = z.infer<typeof transactionSchema>

/* ---------- Receipt file ---------- */
// Returns an error message, or '' if the file is fine
export function validateReceipt(f: File): string {
  if (!/\.(pdf|jpe?g|png)$/i.test(f.name)) {
    return 'Only PDF, JPG, PNG files are allowed'
  }
  if (f.size > MAX_FILE_MB * 1024 * 1024) {
    return `File must be ${MAX_FILE_MB} MB or smaller`
  }
  return ''
}