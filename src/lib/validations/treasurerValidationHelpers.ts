/* ---------- Shared helpers for the treasurer form schemas ---------- */

// Checks that "yyyy-mm-dd" is a real calendar date (e.g. rejects 2025-02-31)
export const isRealDate = (v: string) => {
  const [y, m, d] = v.split('-').map(Number)
  const dt = new Date(y, m - 1, d)
  return dt.getFullYear() === y && dt.getMonth() === m - 1 && dt.getDate() === d
}

// Today as yyyy-mm-dd (local time)
export const todayString = () => {
  const d = new Date()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${d.getFullYear()}-${m}-${day}`
}

// Turns zod issues into { fieldName: firstMessage } so the form can show them under each field
export const issuesToErrors = (issues: { path: PropertyKey[]; message: string }[]) => {
  const out: Record<string, string> = {}
  for (const issue of issues) {
    const key = String(issue.path[0] ?? 'form')
    if (!out[key]) out[key] = issue.message
  }
  return out
}

/* ---------- Common rules used by income + expense ---------- */

export const MAX_AMOUNT = 99999999 // 9,99,99,999
export const MIN_YEAR = 2000

// Returns an error message for an amount typed as text, or '' when it is valid
export const amountError = (value: string) => {
  if (!value.trim()) return 'Amount is required'
  if (!/^\d+(\.\d{1,2})?$/.test(value)) return 'Enter a valid amount (up to 2 decimal places)'
  const n = Number(value)
  if (!(n > 0)) return 'Amount must be greater than 0'
  if (n > MAX_AMOUNT) return 'Amount cannot be more than ₹ 9,99,99,999'
  return ''
}

// Returns an error message for a yyyy-mm-dd date (no future dates), or '' when it is valid
export const pastDateError = (value: string, label: string) => {
  if (!value) return `${label} is required`
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !isRealDate(value)) return `Enter a valid ${label.toLowerCase()}`
  if (Number(value.slice(0, 4)) < MIN_YEAR) return `Year must be ${MIN_YEAR} or later`
  if (value > todayString()) return `${label} cannot be in the future`
  return ''
}

// Letters, numbers, space and - / _ # . only (used for reference and invoice numbers)
export const REFERENCE_PATTERN = /^[A-Za-z0-9 \-/_#.]+$/