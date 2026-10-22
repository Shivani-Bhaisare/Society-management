import { z } from 'zod'

const MOBILE = /^[6-9]\d{9}$/

export const staffSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Staff name is required')
      .min(3, 'Name must be at least 3 characters')
      .max(60, 'Name must be at most 60 characters')
      .regex(/^[A-Za-z][A-Za-z .'-]*$/, 'Name can only contain letters'),
    phone: z
      .string()
      .min(1, 'Contact number is required')
      .regex(MOBILE, 'Enter a valid 10-digit mobile number'),
    email: z
      .string()
      .trim()
      .refine((v) => v === '' || /^\S+@\S+\.\S+$/.test(v), 'Enter a valid email address')
      .refine((v) => v.length <= 100, 'Email must be at most 100 characters'),
    role: z.string().min(1, 'Role is required'),
    department: z.string().min(1, 'Department is required'),
    joiningDate: z.string().min(1, 'Joining date is required'),
    emergencyPhone: z
      .string()
      .refine((v) => v === '' || MOBILE.test(v), 'Enter a valid 10-digit mobile number'),
  })
  .superRefine((d, ctx) => {
    if (d.emergencyPhone && d.phone && d.emergencyPhone === d.phone) {
      ctx.addIssue({
        code: 'custom',
        path: ['emergencyPhone'],
        message: 'Emergency number must be different from contact number',
      })
    }
  })