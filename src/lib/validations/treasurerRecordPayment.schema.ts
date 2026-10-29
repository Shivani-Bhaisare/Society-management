import { z } from 'zod'

/* ---------- Options and limits (TODO: fetch these from the API later) ---------- */

export const PAYMENT_METHODS: string[] = ['Cash', 'Cheque', 'Bank Transfer', 'UPI', 'Card']

export const MAX_NOTES = 500
export const MAX_FILE_MB = 5
export const ALLOWED_FILE_TYPES: string[] = ['application/pdf', 'image/jpeg', 'image/png']

// Payment date cannot be older than this many days
const MAX_BACK_DAYS = 365

/* ---------- Date helpers ---------- */

// Checks that a "YYYY-MM-DD" string is a real calendar date (e.g. rejects 2025-02-31)
const isRealDate = (v: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return false
  const [y, m, d] = v.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d
}

// Formats a Date as yyyy-mm-dd (local time)
const toISO = (d: Date) => {
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

/* ---------- Schema (field level rules) ---------- */

export const treasurerRecordPaymentSchema = z.object({
  // Vendor and bill selection
  vendor: z.string().min(1, 'Select a vendor'),
  invoiceNo: z.string().min(1, 'Select an invoice / bill'),

  // Amount is kept as text, so wrong input like "abc" is caught
  amount: z
    .string()
    .trim()
    .min(1, 'Payment amount is required')
    .regex(/^\d+(\.\d{1,2})?$/, 'Enter a valid amount (up to 2 decimals)'),

  // Payment date, e.g. 2025-10-28
  paymentDate: z
    .string()
    .min(1, 'Payment date is required')
    .refine(isRealDate, 'Enter a valid payment date'),

  // Payment method must be one of the allowed options
  paymentMethod: z
    .string()
    .min(1, 'Select a payment method')
    .refine((v) => PAYMENT_METHODS.includes(v), 'Select a valid payment method'),

  // Reference ID (required rule for non-cash methods is in crossChecks below)
  referenceId: z.string().trim(),

  // Optional note
  notes: z.string().max(MAX_NOTES, `Notes must be ${MAX_NOTES} characters or less`),

  // Optional receipt file (only the details we need to check)
  receipt: z
    .object({
      name: z.string(),
      type: z.string(),
      size: z.number(),
    })
    .nullable(),

  // Values calculated from the selected bill
  vendorExists: z.boolean(),
  billExists: z.boolean(),
  outstanding: z.number(),
})

/* ---------- Types ---------- */

export type RecordPaymentValues = z.infer<typeof treasurerRecordPaymentSchema>

/* ---------- Rules that depend on other fields ---------- */

function crossChecks(v: RecordPaymentValues): Record<string, string> {
  const err: Record<string, string> = {}

  // Selected vendor and bill must exist in the list
  if (v.vendor && !v.vendorExists) err.vendor = 'Select a valid vendor'
  else if (v.invoiceNo && !v.billExists) err.invoiceNo = 'Select a valid invoice / bill'

  // A bill that is already fully paid cannot get another payment
  if (v.billExists && v.outstanding <= 0) {
    err.invoiceNo = 'This bill is already fully paid'
  }

  // Amount must be more than zero and not more than the outstanding balance
  if (/^\d+(\.\d{1,2})?$/.test(v.amount.trim())) {
    const num = Number(v.amount)
    if (num <= 0) {
      err.amount = 'Payment amount must be greater than 0'
    } else if (v.billExists && v.outstanding > 0 && num > v.outstanding) {
      err.amount = `Amount cannot be more than outstanding (₹ ${v.outstanding.toLocaleString('en-IN')})`
    }
  }

  // Payment date cannot be in the future or too old
  if (isRealDate(v.paymentDate)) {
    const todayStr = toISO(new Date())
    const oldest = new Date()
    oldest.setDate(oldest.getDate() - MAX_BACK_DAYS)

    if (v.paymentDate > todayStr) {
      err.paymentDate = 'Payment date cannot be in the future'
    } else if (v.paymentDate < toISO(oldest)) {
      err.paymentDate = 'Payment date cannot be older than 1 year'
    }
  }

  // Reference ID: required for every method except Cash, and checked for format when filled
  const ref = v.referenceId.trim()
  const needsRef = v.paymentMethod !== '' && v.paymentMethod !== 'Cash'
  if (needsRef && !ref) {
    err.referenceId = 'Reference ID is required for this payment method'
  } else if (ref) {
    if (ref.length < 6) err.referenceId = 'Reference ID must be at least 6 characters'
    else if (ref.length > 30) err.referenceId = 'Reference ID must be 30 characters or less'
    else if (!/^[A-Za-z0-9\-_/]+$/.test(ref)) {
      err.referenceId = 'Use only letters, numbers, -, _ and /'
    }
  }

  // Receipt file type and size
  if (v.receipt) {
    if (!ALLOWED_FILE_TYPES.includes(v.receipt.type)) {
      err.receipt = 'Only PDF, JPG and PNG files are allowed'
    } else if (v.receipt.size > MAX_FILE_MB * 1024 * 1024) {
      err.receipt = `File must be under ${MAX_FILE_MB}MB`
    }
  }

  return err
}

/* ---------- Helper used by the modal ---------- */

// Validates the whole form and returns { fieldName: "first error message" } (empty = valid)
export function validateRecordPayment(values: RecordPaymentValues): Record<string, string> {
  const errors: Record<string, string> = {}

  const result = treasurerRecordPaymentSchema.safeParse(values)
  if (!result.success) {
    for (const issue of result.error.issues) {
      const key = String(issue.path[0] ?? 'form')
      // Keep only the first error of each field
      if (!errors[key]) errors[key] = issue.message
    }
  }

  // Add the rules that depend on other fields (do not overwrite field errors)
  const extra = crossChecks(values)
  for (const key of Object.keys(extra)) {
    if (!errors[key]) errors[key] = extra[key]
  }

  return errors
}