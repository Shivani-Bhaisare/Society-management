import { z } from 'zod'
import { amountError, pastDateError, REFERENCE_PATTERN } from './treasurerValidationHelpers'

/* ---------- Add Income form ---------- */

export const incomeEntrySchema = z
  .object({
    title: z.string(),
    category: z.string(),
    amount: z.string(), // typed text, checked below
    date: z.string(), // yyyy-mm-dd
    method: z.string(),
    receivedFrom: z.string(),
    reference: z.string(),
    notes: z.string(),
  })
  .superRefine((d, ctx) => {
    const add = (path: string, message: string) =>
      ctx.addIssue({ code: 'custom', path: [path], message })

    // Title
    const title = d.title.trim()
    if (!title) add('title', 'Income title is required')
    else if (title.length < 3) add('title', 'Title must be at least 3 characters')
    else if (title.length > 100) add('title', 'Title cannot be more than 100 characters')

    // Category + payment method
    if (!d.category) add('category', 'Select a category')
    if (!d.method) add('method', 'Select a payment method')

    // Amount
    const amountMsg = amountError(d.amount)
    if (amountMsg) add('amount', amountMsg)

    // Date
    const dateMsg = pastDateError(d.date, 'Transaction date')
    if (dateMsg) add('date', dateMsg)

    // Received from (optional)
    if (d.receivedFrom.trim().length > 100) add('receivedFrom', 'Name cannot be more than 100 characters')

    // Reference (optional)
    const ref = d.reference.trim()
    if (ref && ref.length > 50) add('reference', 'Reference cannot be more than 50 characters')
    else if (ref && !REFERENCE_PATTERN.test(ref)) add('reference', 'Only letters, numbers and - / _ # are allowed')

    // Notes (optional)
    if (d.notes.trim().length > 500) add('notes', 'Notes cannot be more than 500 characters')
  })

export type IncomeEntryInput = z.infer<typeof incomeEntrySchema>