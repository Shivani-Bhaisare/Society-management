import { z } from 'zod'

// Required text (trimmed, must not be empty)
export const requiredText = (msg: string) => z.string().trim().min(1, msg)

// Required dropdown / date (a value must be selected)
export const requiredSelect = (msg: string) => z.string().min(1, msg)

// Required amount: must be greater than 0
export const amount = (msg = 'Enter a valid amount') =>
  z.string().refine((s) => parseFloat(s) > 0, msg)

// Optional phone: empty is fine, otherwise exactly 10 digits
export const optionalPhone = z
  .string()
  .refine((s) => !s || /^\d{10}$/.test(s), 'Enter a valid 10-digit number')

// Required phone: exactly 10 digits
export const phone = z.string().regex(/^\d{10}$/, 'Enter a valid 10-digit number')

// Optional email: empty is fine, otherwise a valid format
export const optionalEmail = z
  .string()
  .refine((s) => !s || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s), 'Enter a valid email address')

// Optional GSTIN: empty is fine, otherwise a valid 15-character GSTIN
export const optionalGstin = z
  .string()
  .refine(
    (s) => !s || /^\d{2}[A-Z]{5}\d{4}[A-Z][A-Z\d]Z[A-Z\d]$/.test(s),
    'Enter a valid 15-character GSTIN',
  )