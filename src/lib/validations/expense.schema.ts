// src/lib/validations/expense.schema.ts
import { z } from 'zod'
import { requiredText, requiredSelect, amount, optionalPhone } from './common'

// Validation rules for the Add Expense form
export const expenseSchema = z
  .object({
    title: requiredText('Expense title is required'),
    category: requiredSelect('Please select a category'),
    expenseDate: requiredSelect('Expense date is required'),
    dueDate: z.string(),
    description: requiredText('Description is required'),
    vendor: requiredSelect('Please select a vendor'),
    vendorContact: optionalPhone,
    baseAmount: amount(),
    paymentStatus: z.string(),
    paymentDate: z.string(),
  })
  // Cross-field rules
  .superRefine((v, ctx) => {
    if (v.dueDate && v.expenseDate && v.dueDate < v.expenseDate)
      ctx.addIssue({ code: 'custom', path: ['dueDate'], message: 'Due date cannot be before expense date' })
    if (v.paymentStatus === 'Paid' && !v.paymentDate)
      ctx.addIssue({ code: 'custom', path: ['paymentDate'], message: 'Payment date is required for paid expenses' })
  })