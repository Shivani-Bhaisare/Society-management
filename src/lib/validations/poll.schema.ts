import { z } from 'zod'

/* ---------- Limits ---------- */

export const TITLE_MIN = 3
export const TITLE_MAX = 100
export const DESC_MIN = 10
export const DESC_MAX = 1000
export const MIN_OPTIONS = 2
export const MAX_OPTIONS = 10
export const OPTION_MAX = 100

export const POLL_TYPES = ['Single Choice', 'Multiple Choice', 'Yes / No'] as const

// Today's date as YYYY-MM-DD (local time), same format as <input type="date">
const todayStr = () => {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

/* ---------- Poll schema ---------- */

export const pollSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, 'Poll title is required')
      .min(TITLE_MIN, `Title must be at least ${TITLE_MIN} characters`)
      .max(TITLE_MAX, `Title must be at most ${TITLE_MAX} characters`)
      .regex(/[a-zA-Z0-9]/, 'Title must contain at least one letter or number'),

    // optional field
    resolution: z.string().optional(),

    description: z
      .string()
      .trim()
      .min(1, 'Description is required')
      .min(DESC_MIN, `Description must be at least ${DESC_MIN} characters`)
      .max(DESC_MAX, `Description must be at most ${DESC_MAX} characters`),

    type: z.enum(POLL_TYPES, { message: 'Please select a valid poll type' }),

    // raw option inputs (empty extra options are allowed, they are ignored on save)
    options: z.array(z.string()).max(MAX_OPTIONS, `You can add up to ${MAX_OPTIONS} options`),

    votingStart: z.string().min(1, 'Start date is required'),

    votingEnd: z.string().min(1, 'End date is required'),

    voters: z.string().min(1, 'Please select eligible voters'),
  })
  .superRefine((d, ctx) => {
    // Options: first 2 are required, max length, no duplicates
    const seen = new Map<string, number>()
    d.options.forEach((raw, i) => {
      const o = raw.trim()

      if (!o) {
        if (i < MIN_OPTIONS) {
          ctx.addIssue({
            code: 'custom',
            path: ['options', i],
            message: `Option ${i + 1} is required`,
          })
        }
        return
      }

      if (o.length > OPTION_MAX) {
        ctx.addIssue({
          code: 'custom',
          path: ['options', i],
          message: `Option must be at most ${OPTION_MAX} characters`,
        })
      }

      const key = o.toLowerCase()
      if (seen.has(key)) {
        ctx.addIssue({
          code: 'custom',
          path: ['options', i],
          message: `Duplicate option (same as Option ${seen.get(key)! + 1})`,
        })
      } else {
        seen.set(key, i)
      }
    })

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

export type PollInput = z.infer<typeof pollSchema>