import { z } from 'zod'

/* ---------- Limits ---------- */

export const TITLE_MIN = 3
export const TITLE_MAX = 100
export const DESC_MIN = 10
export const DESC_MAX = 1000
export const MAX_FILES = 5
export const MAX_FILE_SIZE = 10 * 1024 * 1024 // 10 MB per file
export const MAX_TOTAL_SIZE = 25 * 1024 * 1024 // 25 MB total

const ALLOWED_MIME = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

// Today's date as YYYY-MM-DD (local time), same format as <input type="date">
const todayStr = () => {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

/* ---------- File schema ---------- */

const fileSchema = z
  .custom<File>((f) => typeof File !== 'undefined' && f instanceof File, 'Invalid file')
  .refine((f) => /\.(pdf|doc|docx)$/i.test(f.name), 'Only PDF, DOC, DOCX files are allowed')
  .refine((f) => !f.type || ALLOWED_MIME.includes(f.type), 'Only PDF, DOC, DOCX files are allowed')
  .refine((f) => f.size > 0, 'File is empty')
  .refine((f) => f.size <= MAX_FILE_SIZE, 'Each file must be 10 MB or less')

/* ---------- Resolution schema ---------- */

export const resolutionSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, 'Resolution title is required')
      .min(TITLE_MIN, `Title must be at least ${TITLE_MIN} characters`)
      .max(TITLE_MAX, `Title must be at most ${TITLE_MAX} characters`)
      .regex(/[a-zA-Z0-9]/, 'Title must contain at least one letter or number'),

    meeting: z.string().min(1, 'Please select a meeting'),

    date: z.string().min(1, 'Date is required'),

    description: z
      .string()
      .trim()
      .min(1, 'Description is required')
      .min(DESC_MIN, `Description must be at least ${DESC_MIN} characters`)
      .max(DESC_MAX, `Description must be at most ${DESC_MAX} characters`),

    proposedBy: z.string().min(1, 'Select a committee member'),

    votingStart: z.string().min(1, 'Start date is required'),

    votingEnd: z.string().min(1, 'End date is required'),

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
      )
      .default([]),
  })
  .superRefine((d, ctx) => {
    // Voting start cannot be in the past
    if (d.votingStart && d.votingStart < todayStr()) {
      ctx.addIssue({
        code: 'custom',
        path: ['votingStart'],
        message: 'Start date cannot be in the past',
      })
    }
    // Voting end cannot be before voting start
    if (d.votingStart && d.votingEnd && d.votingEnd < d.votingStart) {
      ctx.addIssue({
        code: 'custom',
        path: ['votingEnd'],
        message: 'End date must be after start date',
      })
    }
  })

export type ResolutionInput = z.infer<typeof resolutionSchema>