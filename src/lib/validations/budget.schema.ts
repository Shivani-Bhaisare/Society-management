import { z } from 'zod'
import { requiredText, requiredSelect } from './common'

// Validation rules for the Create Budget form
export const budgetSchema = z
  .object({
    name: requiredText('Budget name is required'),
    period: requiredSelect('Please select a period'),
    startDate: requiredSelect('Start date is required'),
    endDate: requiredSelect('End date is required'),
    financialYear: requiredSelect('Please select a financial year'),
    approver: z.string(),
    // Extra values passed from the modal (not form fields)
    rowCount: z.number(),
    approval: z.boolean(),
  })
  .superRefine((v, ctx) => {
    if (v.startDate && v.endDate && v.endDate < v.startDate)
      ctx.addIssue({ code: 'custom', path: ['endDate'], message: 'End date cannot be before start date' })
    if (v.rowCount === 0)
      ctx.addIssue({ code: 'custom', path: ['rows'], message: 'Add at least one category' })
    if (v.approval && !v.approver)
      ctx.addIssue({ code: 'custom', path: ['approver'], message: 'Please select an approver' })
  })