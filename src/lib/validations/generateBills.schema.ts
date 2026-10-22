import { z } from 'zod'

// Draft saves skip every check; "Generate Bills" runs them all.
export const generateBillsSchema = z
  .object({
    isDraft: z.boolean(),
    amount: z.string(),
    dueDate: z.string(),
  })
  .superRefine((d, ctx) => {
    if (d.isDraft) return

    const add = (path: string, message: string) =>
      ctx.addIssue({ code: 'custom', path: [path], message })

    // Amount
    if (!d.amount) add('amount', 'Amount is required')
    else if (!/^\d+(\.\d{1,2})?$/.test(d.amount)) add('amount', 'Enter a valid amount (max 2 decimals)')
    else if (Number(d.amount) <= 0) add('amount', 'Amount must be greater than 0')

    // Due date
    const today = new Date().toISOString().split('T')[0]
    if (!d.dueDate) add('dueDate', 'Due date is required')
    else if (d.dueDate < today) add('dueDate', 'Due date cannot be in the past')
  })