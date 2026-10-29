import { z } from 'zod'
import { isRealDate, MAX_AMOUNT, MIN_YEAR, REFERENCE_PATTERN } from './treasurerValidationHelpers'

/* ---------- Document file rules ---------- */

export const ALLOWED_FILE_TYPES = ['application/pdf', 'image/jpeg', 'image/png']
export const MAX_FILE_MB = 5
const MAX_FILE_SIZE = MAX_FILE_MB * 1024 * 1024

const MAX_YEAR = 2100

/* ---------- Helpers ---------- */

// Checks an amount typed as text and returns an error message, or '' when it is valid
const moneyError = (value: string, label: string) => {
  if (!value.trim()) return `${label} is required`
  if (!/^\d+(\.\d{1,2})?$/.test(value)) return 'Enter a valid amount (up to 2 decimal places)'
  const n = Number(value)
  if (!(n > 0)) return `${label} must be greater than 0`
  if (n > MAX_AMOUNT) return 'Amount cannot be more than ₹ 9,99,99,999'
  return ''
}

// Checks a yyyy-mm-dd date and returns an error message, or '' when it is valid
const dateError = (value: string, label: string) => {
  if (!value) return `${label} is required`
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !isRealDate(value)) return `Enter a valid ${label.toLowerCase()}`
  const year = Number(value.slice(0, 4))
  if (year < MIN_YEAR) return `Year must be ${MIN_YEAR} or later`
  if (year > MAX_YEAR) return `Year cannot be after ${MAX_YEAR}`
  return ''
}

/* ---------- Create Reserve Fund form ---------- */

// The allowed option lists are passed in, so the schema always matches the dropdowns
export const buildReserveFundSchema = (options: {
  fundTypes: string[]
  frequencies: string[]
  committees: string[]
}) =>
  z
    .object({
      name: z.string(),
      fundType: z.string(),
      targetAmount: z.string(), // typed text, checked below
      openingBalance: z.string(), // optional
      monthly: z.string(),
      frequency: z.string(),
      startDate: z.string(), // yyyy-mm-dd
      targetDate: z.string(), // yyyy-mm-dd
      committee: z.string(),
      bankReference: z.string(),
      description: z.string(),
      file: z.object({ type: z.string(), size: z.number() }).nullable(), // only the info we need to check
    })
    .superRefine((d, ctx) => {
      const add = (path: string, message: string) =>
        ctx.addIssue({ code: 'custom', path: [path], message })

      // Fund name
      const name = d.name.trim()
      if (!name) add('name', 'Fund name is required')
      else if (name.length < 3) add('name', 'Fund name must be at least 3 characters')
      else if (name.length > 100) add('name', 'Fund name cannot be more than 100 characters')

      // Dropdowns: must be chosen and must be one of the listed options
      const checkList = (path: string, value: string, list: string[], label: string) => {
        if (!value) add(path, `Select a ${label}`)
        else if (!list.includes(value)) add(path, `Select a valid ${label}`)
      }
      checkList('fundType', d.fundType, options.fundTypes, 'fund type')
      checkList('frequency', d.frequency, options.frequencies, 'contribution frequency')
      checkList('committee', d.committee, options.committees, 'committee')

      // Target amount
      const targetMsg = moneyError(d.targetAmount, 'Target amount')
      if (targetMsg) add('targetAmount', targetMsg)
      const target = targetMsg ? 0 : Number(d.targetAmount)

      // Opening balance (optional)
      const opening = d.openingBalance.trim()
      if (opening) {
        if (!/^\d+(\.\d{1,2})?$/.test(opening)) {
          add('openingBalance', 'Enter a valid amount (up to 2 decimal places)')
        } else if (Number(opening) > MAX_AMOUNT) {
          add('openingBalance', 'Amount cannot be more than ₹ 9,99,99,999')
        } else if (target > 0 && Number(opening) > target) {
          add('openingBalance', 'Cannot be more than the target amount')
        }
      }

      // Monthly contribution
      const monthlyMsg = moneyError(d.monthly, 'Contribution amount')
      if (monthlyMsg) add('monthly', monthlyMsg)
      else if (target > 0 && Number(d.monthly) > target) add('monthly', 'Cannot be more than the target amount')

      // Start date + target date
      const startMsg = dateError(d.startDate, 'Start date')
      if (startMsg) add('startDate', startMsg)

      const targetDateMsg = dateError(d.targetDate, 'Target date')
      if (targetDateMsg) add('targetDate', targetDateMsg)
      else if (!startMsg && d.targetDate <= d.startDate) add('targetDate', 'Must be after the start date')

      // Bank reference (optional)
      const ref = d.bankReference.trim()
      if (ref && ref.length > 50) add('bankReference', 'Reference cannot be more than 50 characters')
      else if (ref && !REFERENCE_PATTERN.test(ref)) add('bankReference', 'Only letters, numbers and - / _ # are allowed')

      // Description
      const desc = d.description.trim()
      if (!desc) add('description', 'Description is required')
      else if (desc.length < 10) add('description', 'Description must be at least 10 characters')
      else if (desc.length > 500) add('description', 'Description cannot be more than 500 characters')

      // Approval document (optional, but must be valid when added)
      if (d.file) {
        if (!ALLOWED_FILE_TYPES.includes(d.file.type)) add('file', 'Only PDF, JPG and PNG files are allowed')
        else if (d.file.size === 0) add('file', 'This file is empty')
        else if (d.file.size > MAX_FILE_SIZE) add('file', `File must be under ${MAX_FILE_MB}MB`)
      }
    })

export type ReserveFundInput = z.infer<ReturnType<typeof buildReserveFundSchema>>