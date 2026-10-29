import { z } from 'zod'

/* ---------- Options and limits (TODO: fetch these from the API later) ---------- */

export const VENDOR_CATEGORIES: string[] = [
  'Maintenance', 'Security', 'Housekeeping', 'Electricity', 'Plumbing', 'Gardening', 'Administration',
]
export const TAX_RATES: string[] = ['0%', '5%', '12%', '18%', '28%']
export const PAYMENT_MODES: string[] = ['Cash', 'Cheque', 'Bank Transfer', 'UPI', 'Card']
export const BANK_CASH_ACCOUNTS: string[] = ['Cash in Hand', 'HDFC Bank - 1234567890', 'SBI Bank - 9876543210']
export const COST_CENTERS: string[] = ['Maintenance', 'Security', 'Housekeeping', 'Electricity', 'Administration']
export const ACCOUNTS: string[] = [
  'Lift Maintenance',
  'Maintenance Expenses A/c',
  'Electricity Expenses A/c',
  'Security Expenses A/c',
  'Housekeeping Expenses A/c',
  'Accounts Payable A/c',
]

export const MAX_DESC = 500
export const MAX_NOTES = 500
export const MAX_FILE_MB = 10
export const MAX_FILES = 5
export const ALLOWED_FILE_TYPES: string[] = ['application/pdf', 'image/jpeg', 'image/png']

const MAX_AMOUNT = 10000000 // max bill amount (1 crore)
const MAX_BACK_DAYS = 365 // invoice date cannot be older than this

/* ---------- Regex ---------- */

const AMOUNT_RE = /^\d+(\.\d{1,2})?$/
const CODE_RE = /^[A-Za-z0-9\-_/.]+$/

/* ---------- Helpers ---------- */

// "15,000.50" -> 15000.5 (anything that is not a number becomes 0)
const toNum = (v: string) => Number(v.replace(/[^0-9.]/g, '')) || 0

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

// Allows an empty value or a value that passes the check (used for optional fields)
const optional = (check: (v: string) => boolean) => (v: string) => v === '' || check(v)

const inr = (n: number) => n.toLocaleString('en-IN', { maximumFractionDigits: 2 })

/* ---------- Schema (field level format rules) ---------- */

export const treasurerVendorBillSchema = z.object({
  vendor: z.string(),
  vendorExists: z.boolean(),
  category: z.string().refine(optional((v) => VENDOR_CATEGORIES.includes(v)), 'Select a valid category'),

  // Invoice number, e.g. INV-2026-0458
  invoiceNo: z
    .string()
    .trim()
    .refine(optional((v) => v.length >= 3), 'Invoice number must be at least 3 characters')
    .refine(optional((v) => v.length <= 30), 'Invoice number must be 30 characters or less')
    .refine(optional((v) => CODE_RE.test(v)), 'Use only letters, numbers, -, _, / and .'),

  // Reference / PO number (optional)
  reference: z
    .string()
    .trim()
    .refine(optional((v) => v.length <= 30), 'Reference must be 30 characters or less')
    .refine(optional((v) => CODE_RE.test(v)), 'Use only letters, numbers, -, _, / and .'),

  invoiceDate: z.string().refine(optional(isRealDate), 'Enter a valid invoice date'),
  dueDate: z.string().refine(optional(isRealDate), 'Enter a valid due date'),

  // Bill title (required rule is in validateVendorBill below)
  title: z
    .string()
    .trim()
    .refine(optional((v) => v.length >= 3), 'Bill title must be at least 3 characters')
    .refine(optional((v) => v.length <= 100), 'Bill title must be 100 characters or less'),

  description: z
    .string()
    .trim()
    .refine(optional((v) => v.length >= 5), 'Description must be at least 5 characters')
    .refine(optional((v) => v.length <= MAX_DESC), `Description must be ${MAX_DESC} characters or less`),

  // Amounts are kept as text, so wrong input like "abc" is caught
  amount: z.string().trim().refine(optional((v) => AMOUNT_RE.test(v)), 'Enter a valid amount (up to 2 decimals)'),
  taxRate: z.string().refine((v) => TAX_RATES.includes(v), 'Select a valid tax rate'),
  discount: z.string().trim().refine(optional((v) => AMOUNT_RE.test(v)), 'Enter a valid discount (up to 2 decimals)'),

  paymentMode: z.string().refine(optional((v) => PAYMENT_MODES.includes(v)), 'Select a valid payment mode'),
  bankAccount: z.string().refine(optional((v) => BANK_CASH_ACCOUNTS.includes(v)), 'Select a valid account'),
  costCenter: z.string().refine(optional((v) => COST_CENTERS.includes(v)), 'Select a valid cost center'),

  // Ledger lines (detailed checks are in checkLines below)
  lines: z.array(
    z.object({
      account: z.string(),
      description: z.string(),
      debit: z.string(),
      credit: z.string(),
    }),
  ),

  notes: z.string().max(MAX_NOTES, `Notes must be ${MAX_NOTES} characters or less`),

  // Attached files (only the details we need to check)
  files: z.array(z.object({ name: z.string(), type: z.string(), size: z.number() })),
})

/* ---------- Types ---------- */

export type VendorBillValues = z.infer<typeof treasurerVendorBillSchema>
export type VendorBillMode = 'draft' | 'submit'

/* ---------- Ledger lines check ---------- */

// Returns one error message for the ledger lines, or '' when everything is fine
function checkLines(lines: VendorBillValues['lines'], mode: VendorBillMode): string {
  let used = 0
  let totalDebit = 0
  let totalCredit = 0

  for (let i = 0; i < lines.length; i++) {
    const l = lines[i]
    const n = i + 1
    const hasValue = l.account || l.description.trim() || l.debit || l.credit
    if (!hasValue) continue // empty line is ignored

    if (!l.account) return `Line ${n}: select an account`
    if (l.description.trim().length > 100) return `Line ${n}: description must be 100 characters or less`
    if (l.debit && !AMOUNT_RE.test(l.debit)) return `Line ${n}: enter a valid debit amount`
    if (l.credit && !AMOUNT_RE.test(l.credit)) return `Line ${n}: enter a valid credit amount`

    const d = toNum(l.debit)
    const c = toNum(l.credit)
    if (d > 0 && c > 0) return `Line ${n}: enter either debit or credit, not both`
    if (d <= 0 && c <= 0) return `Line ${n}: enter a debit or credit amount`

    used += 1
    totalDebit += d
    totalCredit += c
  }

  if (mode === 'submit') {
    if (used === 0) return 'Add at least one ledger line with an account and an amount'
    // Double entry: total debit must be equal to total credit
    if (Math.round(totalDebit * 100) !== Math.round(totalCredit * 100)) {
      return `Total debit (₹ ${inr(totalDebit)}) must be equal to total credit (₹ ${inr(totalCredit)})`
    }
  }
  return ''
}

/* ---------- Helper used by the modal ---------- */

// Validates the form and returns { fieldName: "first error message" } (empty = valid)
// "draft" needs only vendor + title. "submit" needs every required field.
export function validateVendorBill(values: VendorBillValues, mode: VendorBillMode): Record<string, string> {
  const errors: Record<string, string> = {}
  const add = (key: string, msg: string) => {
    if (!errors[key]) errors[key] = msg
  }

  // 1) Format rules from the schema
  const result = treasurerVendorBillSchema.safeParse(values)
  if (!result.success) {
    for (const issue of result.error.issues) add(String(issue.path[0] ?? 'form'), issue.message)
  }

  // 2) Required fields (draft and submit)
  if (!values.vendor) add('vendor', 'Select a vendor')
  else if (!values.vendorExists) add('vendor', 'Select a valid vendor')
  if (!values.title.trim()) add('title', 'Bill title is required')

  // 3) Required fields (only when submitting)
  if (mode === 'submit') {
    if (!values.category) add('category', 'Select a category')
    if (!values.invoiceNo.trim()) add('invoiceNo', 'Invoice number is required')
    if (!values.invoiceDate) add('invoiceDate', 'Invoice date is required')
    if (!values.dueDate) add('dueDate', 'Due date is required')
    if (!values.description.trim()) add('description', 'Description is required')
    if (!values.amount.trim()) add('amount', 'Bill amount is required')
  }

  // 4) Invoice date: not in the future and not too old
  if (isRealDate(values.invoiceDate)) {
    const oldest = new Date()
    oldest.setDate(oldest.getDate() - MAX_BACK_DAYS)
    if (values.invoiceDate > toISO(new Date())) add('invoiceDate', 'Invoice date cannot be in the future')
    else if (values.invoiceDate < toISO(oldest)) add('invoiceDate', 'Invoice date cannot be older than 1 year')
  }

  // 5) Due date: not before the invoice date and within 1 year of it
  if (isRealDate(values.invoiceDate) && isRealDate(values.dueDate)) {
    if (values.dueDate < values.invoiceDate) {
      add('dueDate', 'Due date cannot be before invoice date')
    } else {
      const [y, m, d] = values.invoiceDate.split('-').map(Number)
      const limit = toISO(new Date(y + 1, m - 1, d))
      if (values.dueDate > limit) add('dueDate', 'Due date must be within 1 year of the invoice date')
    }
  }

  // 6) Amount range, and discount must not be more than the bill total
  const subtotal = AMOUNT_RE.test(values.amount.trim()) ? Number(values.amount) : 0
  if (AMOUNT_RE.test(values.amount.trim())) {
    if (subtotal <= 0) add('amount', 'Bill amount must be greater than 0')
    else if (subtotal > MAX_AMOUNT) add('amount', 'Bill amount cannot be more than ₹ 1,00,00,000')
  }
  if (AMOUNT_RE.test(values.discount.trim()) && subtotal > 0) {
    const rate = Number(values.taxRate.replace('%', '')) || 0
    const gst = Math.round(subtotal * rate) / 100
    if (Number(values.discount) > subtotal + gst) add('discount', 'Discount is more than the bill total')
  }

  // 7) A payment mode needs a bank / cash account
  if (values.paymentMode && !values.bankAccount) add('bankAccount', 'Select a bank or cash account')

  // 8) Ledger lines
  const lineError = checkLines(values.lines, mode)
  if (lineError) add('lines', lineError)

  // 9) Files: count, type and size
  if (values.files.length > MAX_FILES) {
    add('files', `You can attach up to ${MAX_FILES} files`)
  } else {
    for (const f of values.files) {
      if (!ALLOWED_FILE_TYPES.includes(f.type)) {
        add('files', 'Only PDF, JPG and PNG files are allowed')
      } else if (f.size > MAX_FILE_MB * 1024 * 1024) {
        add('files', `Each file must be under ${MAX_FILE_MB}MB`)
      }
    }
  }

  return errors
}