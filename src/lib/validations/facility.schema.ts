import { z } from 'zod'

// "06:00 AM" -> minutes from midnight
const toMinutes = (t: string) => {
  const [hm, ap] = t.split(' ')
  const [h, m] = hm.split(':').map(Number)
  return (h % 12) * 60 + m + (ap === 'PM' ? 720 : 0)
}

export const facilitySchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Facility name is required')
      .min(3, 'Name must be at least 3 characters')
      .max(60, 'Name must be at most 60 characters'),
    category: z.string().min(1, 'Select a category'),
    description: z.string().max(500, 'Description must be at most 500 characters'),
    location: z.string(),
    capacity: z
      .string()
      .refine(
        (v) => v === '' || (/^\d+$/.test(v) && Number(v) >= 1 && Number(v) <= 10000),
        'Enter a valid number (1 - 10000)',
      ),
    openingTime: z.string(),
    closingTime: z.string(),
    days: z.array(z.string()).min(1, 'Select at least one day'),
    bookingRequired: z.boolean(),
    charges: z.string(),
    rules: z.string().max(500, 'Rules must be at most 500 characters'),
    mFrom: z.string(),
    mTo: z.string(),
  })
  .superRefine((d, ctx) => {
    if (toMinutes(d.closingTime) <= toMinutes(d.openingTime)) {
      ctx.addIssue({
        code: 'custom',
        path: ['closingTime'],
        message: 'Closing time must be after opening time',
      })
    }
    if (d.bookingRequired && d.charges && !/^\d+(\.\d{1,2})?$/.test(d.charges)) {
      ctx.addIssue({ code: 'custom', path: ['charges'], message: 'Enter a valid amount' })
    }
    if (d.mFrom && d.mTo && d.mTo < d.mFrom) {
      ctx.addIssue({ code: 'custom', path: ['mTo'], message: 'End date must be after start date' })
    }
  })