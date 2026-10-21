import type { ZodType } from 'zod'

// Returns a { field: message } object (empty object = no errors)
export function getErrors<T>(schema: ZodType<T>, data: unknown) {
  const result = schema.safeParse(data)
  const errors: Record<string, string> = {}
  if (!result.success) {
    result.error.issues.forEach((i) => {
      const key = String(i.path[0])
      if (!errors[key]) errors[key] = i.message
    })
  }
  return errors
}