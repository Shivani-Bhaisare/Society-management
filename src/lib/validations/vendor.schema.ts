import { z } from 'zod'

export const vendorSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Vendor name is required')
      .min(3, 'Name must be at least 3 characters')
      .max(80, 'Name must be at most 80 characters'),
    service: z.string().min(1, 'Service type is required'),
    phone: z
      .string()
      .min(1, 'Contact number is required')
      .regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number'),
    email: z
      .string()
      .trim()
      .refine((v) => v === '' || /^\S+@\S+\.\S+$/.test(v), 'Enter a valid email address')
      .refine((v) => v.length <= 100, 'Email must be at most 100 characters'),
    gst: z
      .string()
      .refine(
        (v) => v === '' || /^\d{2}[A-Z]{5}\d{4}[A-Z]\d[A-Z\d][A-Z\d]$/.test(v),
        'Enter a valid 15-character GSTIN',
      ),
    pan: z
      .string()
      .refine((v) => v === '' || /^[A-Z]{5}\d{4}[A-Z]$/.test(v), 'Enter a valid 10-character PAN'),
    contractStart: z.string().min(1, 'Start date is required'),
    contractEnd: z.string().min(1, 'End date is required'),
  })
  .superRefine((d, ctx) => {
    if (d.contractStart && d.contractEnd && d.contractEnd < d.contractStart) {
      ctx.addIssue({
        code: 'custom',
        path: ['contractEnd'],
        message: 'End date must be after start date',
      })
    }
  })