import { z } from 'zod'
import { amountError, pastDateError, REFERENCE_PATTERN } from './treasurerValidationHelpers'

/* ---------- Bill / receipt file rules ---------- */

export const ALLOWED_FILE_TYPES = ['image/png', 'image/jpeg', 'application/pdf']
export const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5 MB

/* ---------- Add Expense form ---------- */

export const expenseEntrySchema = z
  .object({
    title: z.string(),
    category: z.string(),
    amount: z.string(), // typed text, checked below
    date: z.string(), // yyyy-mm-dd
    status: z.string(),
    paidTo: z.string(),
    method: z.string(),
    invoiceNo: z.string(),
    notes: z.string(),
    file: z.object({ type: z.string(), size: z.number() }).nullable(), // only the info we need to check
  })
  .superRefine((d, ctx) => {
    const add = (path: string, message: string) =>
      ctx.addIssue({ code: 'custom', path: [path], message })

    // Title
    const title = d.title.trim()
    if (!title) add('title', 'Expense title is required')
    else if (title.length < 3) add('title', 'Title must be at least 3 characters')
    else if (title.length > 100) add('title', 'Title cannot be more than 100 characters')

    // Category + payment status
    if (!d.category) add('category', 'Select a category')
    if (!d.status) add('status', 'Select a payment status')

    // Amount
    const amountMsg = amountError(d.amount)
    if (amountMsg) add('amount', amountMsg)

    // Date
    const dateMsg = pastDateError(d.date, 'Expense date')
    if (dateMsg) add('date', dateMsg)

    // Paid to / vendor
    const paidTo = d.paidTo.trim()
    if (!paidTo) add('paidTo', 'Vendor or recipient name is required')
    else if (paidTo.length < 2) add('paidTo', 'Name must be at least 2 characters')
    else if (paidTo.length > 100) add('paidTo', 'Name cannot be more than 100 characters')

    // Payment method is needed once some money is paid (Paid / Partial)
    if ((d.status === 'Paid' || d.status === 'Partial') && !d.method) {
      add('method', 'Select a payment method for paid expenses')
    }

    // Invoice number (optional)
    const inv = d.invoiceNo.trim()
    if (inv && inv.length > 50) add('invoiceNo', 'Invoice number cannot be more than 50 characters')
    else if (inv && !REFERENCE_PATTERN.test(inv)) add('invoiceNo', 'Only letters, numbers and - / _ # are allowed')

    // Notes (optional)
    if (d.notes.trim().length > 500) add('notes', 'Notes cannot be more than 500 characters')

    // Bill / receipt (optional, but must be valid when added)
    if (d.file) {
      if (!ALLOWED_FILE_TYPES.includes(d.file.type)) add('file', 'Only PNG, JPG or PDF files are allowed')
      else if (d.file.size > MAX_FILE_SIZE) add('file', 'File size cannot be more than 5 MB')
      else if (d.file.size === 0) add('file', 'This file is empty')
    }
  })

export type ExpenseEntryInput = z.infer<typeof expenseEntrySchema>