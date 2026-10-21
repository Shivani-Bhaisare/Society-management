import { z } from 'zod'

/* ---------- Limits ---------- */

export const SUBJECT_MIN = 3
export const SUBJECT_MAX = 150
export const MSG_MIN = 10
export const MSG_MAX = 2000
export const MAX_FILES = 5
export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB per file
export const MAX_TOTAL_SIZE = 25 * 1024 * 1024 // 25 MB total

// keep these same as the lists in AddCommunicationModal.tsx
const AUDIENCES = ['All Residents', 'Owners only', 'Tenants only', 'Committee members']
const PRIORITIES = ['Low', 'Normal', 'High', 'Urgent']
const CHANNELS = ['App', 'Email', 'SMS'] as const

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

/* ---------- File schema ---------- */

const fileSchema = z
  .custom<File>((f) => typeof File !== 'undefined' && f instanceof File, 'Invalid file')
  .refine((f) => /\.(pdf|jpe?g|png)$/i.test(f.name), 'Only PDF, JPG, PNG files are allowed')
  .refine((f) => !f.type || ALLOWED_MIME.includes(f.type), 'Only PDF, JPG, PNG files are allowed')
  .refine((f) => f.size > 0, 'File is empty')
  .refine((f) => f.size <= MAX_FILE_SIZE, 'Each file must be 10 MB or less')

/* ---------- Draft schema (Save as Draft: only basic fields) ---------- */

const base = z.object({
  subject: z
    .string()
    .trim()
    .min(1, 'Subject is required')
    .min(SUBJECT_MIN, `Subject must be at least ${SUBJECT_MIN} characters`)
    .max(SUBJECT_MAX, `Subject must be at most ${SUBJECT_MAX} characters`)
    .regex(/[a-zA-Z0-9]/, 'Subject must contain at least one letter or number'),

  audience: oneOf(AUDIENCES, 'Please select a valid audience'),

  priority: oneOf(PRIORITIES, 'Please select a valid priority'),

  files: z
    .array(fileSchema)
    .max(MAX_FILES, `You can attach up to ${MAX_FILES} files`)
    .refine(
      (arr) => arr.reduce((sum, f) => sum + f.size, 0) <= MAX_TOTAL_SIZE,
      'Total size of all files must be 25 MB or less',
    )
    .refine(
      (arr) => new Set(arr.map((f) => `${f.name}-${f.size}`)).size === arr.length,
      'Duplicate files are not allowed',
    ),
})

export const communicationDraftSchema = base

/* ---------- Send schema (all fields) ---------- */

export const communicationSchema = base
  .extend({
    // pass the plain text of the editor here (not the HTML)
    message: z
      .string()
      .trim()
      .min(1, 'Message is required')
      .min(MSG_MIN, `Message must be at least ${MSG_MIN} characters`)
      .max(MSG_MAX, `Message must be at most ${MSG_MAX} characters`),

    channels: z.array(z.enum(CHANNELS)).min(1, 'Select at least one channel'),

    schedule: z.enum(['now', 'later']),

    date: z.string(),

    time: z.string(),
  })
  .superRefine((d, ctx) => {
    if (d.schedule !== 'later') return

    // Date
    if (!d.date) {
      ctx.addIssue({ code: 'custom', path: ['date'], message: 'Date is required' })
    } else if (d.date < todayStr()) {
      ctx.addIssue({ code: 'custom', path: ['date'], message: 'Date cannot be in the past' })
    }

    // Time
    if (!d.time) {
      ctx.addIssue({ code: 'custom', path: ['time'], message: 'Time is required' })
    } else if (d.date === todayStr()) {
      const nowHM = new Date().toTimeString().slice(0, 5)
      if (d.time <= nowHM) {
        ctx.addIssue({ code: 'custom', path: ['time'], message: 'Time must be in the future' })
      }
    }
  })

export type CommunicationInput = z.infer<typeof communicationSchema>