import { z } from 'zod'

/* ---------- Limits ---------- */
export const MAX_TITLE = 100
export const MAX_DESC = 300
export const MAX_MB = 10

export const CATEGORIES = ['Society', 'Legal', 'Finance', 'Meeting', 'Vendor', 'Maintenance'] as const
export const VISIBILITY = ['All Residents', 'Committee Members', 'Admin Only'] as const

export const ACCEPT = '.pdf,.doc,.docx,.xls,.xlsx,.jpg,.jpeg,.png'

// Local date (YYYY-MM-DD), so the date does not shift because of the timezone
export const todayISO = () => {
  const d = new Date()
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .split('T')[0]
}

/* ---------- Schema ---------- */
export const documentSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Document title is required')
    .min(3, 'Title must be at least 3 characters')
    .max(MAX_TITLE, `Title can be max ${MAX_TITLE} characters`),

  category: z
    .string()
    .min(1, 'Select a category')
    .refine((v) => (CATEGORIES as readonly string[]).includes(v), 'Select a valid category'),

  date: z
    .string()
    .min(1, 'Date is required')
    .refine((v) => v <= todayISO(), 'Date cannot be in the future'),

  visibility: z
    .string()
    .refine((v) => (VISIBILITY as readonly string[]).includes(v), 'Select a valid visibility'),

  description: z.string().max(MAX_DESC, `Description can be max ${MAX_DESC} characters`),
})

export type DocumentFormValues = z.infer<typeof documentSchema>

/* ---------- File ---------- */
// Returns an error message, or '' if the file is fine
export function validateDocumentFile(f: File): string {
  if (!/\.(pdf|docx?|xlsx?|jpe?g|png)$/i.test(f.name)) {
    return 'Only PDF, DOC, XLS, JPG, PNG files are allowed'
  }
  if (f.size === 0) {
    return 'This file is empty'
  }
  if (f.size > MAX_MB * 1024 * 1024) {
    return `File size must be under ${MAX_MB} MB`
  }
  return ''
}