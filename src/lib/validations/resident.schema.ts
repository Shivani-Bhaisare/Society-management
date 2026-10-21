import { z } from 'zod'
import { requiredText, requiredSelect, phone, optionalPhone } from './common'

// Required email
const requiredEmail = z
  .string()
  .trim()
  .min(1, 'Email address is required')
  .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Enter a valid email address')

// Validation rules for the Add Resident form
export const residentSchema = z
  .object({
    name: requiredText('Full name is required').min(2, 'Name must be at least 2 characters'),
    email: requiredEmail,
    phone: phone.refine((s) => s !== '', 'Phone number is required'),
    type: requiredSelect('Please select resident type'),
    tower: requiredSelect('Please select a tower'),
    unit: requiredSelect('Please select a unit / flat number'),
    moveIn: requiredSelect('Move-in date is required'),
    status: requiredSelect('Please select resident status'),
    occupation: z.string(),
    // optional: empty is fine, otherwise a whole number from 0 to 50
    family: z
      .string()
      .refine((s) => !s || (/^\d+$/.test(s) && Number(s) <= 50), 'Enter a number between 0 and 50'),
    // optional: empty is fine, otherwise Indian format like MP09AB1234
    vehicle: z
      .string()
      .refine(
        (s) => !s || /^[A-Z]{2}\d{2}[A-Z]{1,3}\d{4}$/.test(s.replace(/[\s-]/g, '').toUpperCase()),
        'Enter a valid vehicle number (e.g. MP09AB1234)',
      ),
    emergency: optionalPhone,
  })
  // Cross-field rule
  .superRefine((v, ctx) => {
    if (v.emergency && v.emergency === v.phone)
      ctx.addIssue({
        code: 'custom',
        path: ['emergency'],
        message: 'Emergency contact cannot be the same as phone number',
      })
  })