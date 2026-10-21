import { z } from 'zod'
import {
  requiredText, requiredSelect, amount, optionalPhone, optionalEmail, optionalGstin,
} from './common'

// Validation rules for the Add Bill form
export const billSchema = z
  .object({
    title: requiredText('Bill title is required'),
    billType: requiredSelect('Please select a bill type'),
    billNo: requiredText('Bill number is required'),
    issueDate: requiredSelect('Issue date is required'),
    dueDate: z.string(),
    description: requiredText('Description is required'),
    vendor: requiredSelect('Please select a vendor'),
    contact: optionalPhone,
    email: optionalEmail,
    gstin: optionalGstin,
    subtotal: amount(),
    tax: z.string(),
    discount: z.string(),
    amountPaid: z.string(),
    paymentStatus: z.string(),
    paymentDate: z.string(),
  })
  // Cross-field rules
  .superRefine((v, ctx) => {
    const num = (s: string) => parseFloat(s) || 0
    const total = Math.max(0, num(v.subtotal) + num(v.tax) - num(v.discount))

    if (v.dueDate && v.issueDate && v.dueDate < v.issueDate)
      ctx.addIssue({ code: 'custom', path: ['dueDate'], message: 'Due date cannot be before issue date' })
    if (num(v.discount) > num(v.subtotal) + num(v.tax))
      ctx.addIssue({ code: 'custom', path: ['discount'], message: 'Discount cannot be more than the bill amount' })
    if (num(v.amountPaid) > total)
      ctx.addIssue({ code: 'custom', path: ['amountPaid'], message: 'Amount paid cannot be more than the total' })
    if (v.paymentStatus === 'Paid' && !v.paymentDate)
      ctx.addIssue({ code: 'custom', path: ['paymentDate'], message: 'Payment date is required for paid bills' })
  })