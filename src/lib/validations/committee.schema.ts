import { z } from 'zod'
import { requiredText, requiredSelect, phone } from './common'

// Required email
const requiredEmail = z
  .string()
  .trim()
  .min(1, 'Email address is required')
  .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Enter a valid email address')

// Validation rules for the Add Committee Member form
export const committeeSchema = z
  .object({
    name: requiredText('Full name is required').min(2, 'Name must be at least 2 characters'),
    email: requiredEmail,
    phone,
    role: requiredSelect('Please select a committee role'),
    unit: z.string(),
    startDate: requiredSelect('Term start date is required'),
    endDate: requiredSelect('Term end date is required'),
    status: requiredSelect('Please select a status'),
    notes: z.string(),
  })
  // Cross-field rule
  .superRefine((v, ctx) => {
    if (v.startDate && v.endDate && v.endDate < v.startDate)
      ctx.addIssue({
        code: 'custom',
        path: ['endDate'],
        message: 'End date cannot be before start date',
      })
  })