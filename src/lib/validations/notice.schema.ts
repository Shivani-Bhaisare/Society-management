import { z } from 'zod'

/* ---------- Limits ---------- */

export const TITLE_MIN = 3
export const TITLE_MAX = 100
export const DESC_MIN = 10
export const DESC_MAX = 2000
export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB

// keep these same as the lists in AddNoticeModal.tsx
const NOTICE_TYPES = ['General', 'Maintenance', 'Event', 'Emergency', 'Meeting', 'Payment']
const AUDIENCES = ['All Residents', 'Owners only', 'Tenants only', 'Committee members']
const PRIORITIES = ['Low', 'Medium', 'High']

const ALLOWED_MIME = ['application/pdf', 'image/jpeg', 'image/png']

// Today's date as YYYY-MM-DD (local time), same format as <input type="date">
const todayStr = () => {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

const oneOf = (list: string[], msg: string) =>
  z.string().refine((v) => list.includes(v), msg)

/* ---------- Draft schema (Save as Draft: only basic fields) ---------- */

const base = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Notice title is required')
    .min(TITLE_MIN, `Title must be at least ${TITLE_MIN} characters`)
    .max(TITLE_MAX, `Title must be at most ${TITLE_MAX} characters`)
    .regex(/[a-zA-Z0-9]/, 'Title must contain at least one letter or number'),

  type: oneOf(NOTICE_TYPES, 'Please select a valid notice type'),

  priority: oneOf(PRIORITIES, 'Please select a valid priority'),

  audience: oneOf(AUDIENCES, 'Please select a valid audience'),

  // optional attachment
  file: z
    .custom<File | null>((f) => f === null || (typeof File !== 'undefined' && f instanceof File), 'Invalid file')
    .refine((f) => !f || /\.(pdf|jpe?g|png)$/i.test(f.name), 'Only PDF, JPG, PNG files are allowed')
    .refine((f) => !f || !f.type || ALLOWED_MIME.includes(f.type), 'Only PDF, JPG, PNG files are allowed')
    .refine((f) => !f || f.size > 0, 'File is empty')
    .refine((f) => !f || f.size <= MAX_FILE_SIZE, 'File must be 10 MB or less'),
})

export const noticeDraftSchema = base

/* ---------- Publish schema (all fields) ---------- */

export const noticeSchema = base
  .extend({
    // pass the plain text of the editor here (not the HTML)
    description: z
      .string()
      .trim()
      .min(1, 'Description is required')
      .min(DESC_MIN, `Description must be at least ${DESC_MIN} characters`)
      .max(DESC_MAX, `Description must be at most ${DESC_MAX} characters`),

    publishDate: z.string().min(1, 'Publish date is required'),

    expiryDate: z.string().min(1, 'Expiry date is required'),
  })
  .superRefine((d, ctx) => {
    // Expiry cannot be before publish date
    if (d.publishDate && d.expiryDate && d.expiryDate < d.publishDate) {
      ctx.addIssue({
        code: 'custom',
        path: ['expiryDate'],
        message: 'Expiry must be after publish date',
      })
    }
    // Expiry cannot be in the past
    else if (d.expiryDate && d.expiryDate < todayStr()) {
      ctx.addIssue({
        code: 'custom',
        path: ['expiryDate'],
        message: 'Expiry date cannot be in the past',
      })
    }
  })

export type NoticeInput = z.infer<typeof noticeSchema>