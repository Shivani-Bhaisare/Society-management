import { z } from 'zod'
import { isRealDate, MIN_YEAR } from './treasurerValidationHelpers'

/* ---------- Helpers ---------- */

// "2025-26" -> { from: "2025-04-01", to: "2026-03-31" } (Indian financial year)
export const fyRange = (fy: string) => {
  const start = Number(fy.slice(0, 4))
  return { from: `${start}-04-01`, to: `${start + 1}-03-31` }
}

// Checks a yyyy-mm-dd date and returns an error message, or '' when it is valid
const dateError = (value: string, label: string) => {
  if (!value) return `${label} is required`
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !isRealDate(value)) return `Enter a valid ${label.toLowerCase()}`
  if (Number(value.slice(0, 4)) < MIN_YEAR) return `Year must be ${MIN_YEAR} or later`
  return ''
}

/* ---------- Generate Report form ---------- */

// The allowed option lists are passed in, so the schema always matches the dropdowns
export const buildGenerateReportSchema = (options: {
  financialYears: string[]
  reportTypes: string[]
  branches: string[]
  formats: string[]
}) =>
  z
    .object({
      financialYear: z.string(),
      reportType: z.string(),
      branch: z.string(),
      dateFrom: z.string(), // yyyy-mm-dd
      dateTo: z.string(), // yyyy-mm-dd
      format: z.string(),
      notes: z.string(),
    })
    .superRefine((d, ctx) => {
      const add = (path: string, message: string) =>
        ctx.addIssue({ code: 'custom', path: [path], message })

      // Dropdowns: must be chosen and must be one of the listed options
      if (!d.financialYear) add('financialYear', 'Select a financial year')
      else if (!options.financialYears.includes(d.financialYear)) add('financialYear', 'Select a valid financial year')

      if (!d.reportType) add('reportType', 'Select a report type')
      else if (!options.reportTypes.includes(d.reportType)) add('reportType', 'Select a valid report type')

      if (!d.branch) add('branch', 'Select a branch')
      else if (!options.branches.includes(d.branch)) add('branch', 'Select a valid branch')

      if (!d.format) add('format', 'Select a report format')
      else if (!options.formats.includes(d.format)) add('format', 'Select a valid report format')

      // Date range
      const fromMsg = dateError(d.dateFrom, 'Start date')
      const toMsg = dateError(d.dateTo, 'End date')

      if (fromMsg || toMsg) {
        add('dateRange', fromMsg || toMsg)
      } else if (d.dateTo < d.dateFrom) {
        add('dateRange', 'End date cannot be before start date')
      } else if (/^\d{4}-\d{2}$/.test(d.financialYear)) {
        // Range must stay inside the chosen financial year
        const fy = fyRange(d.financialYear)
        if (d.dateFrom < fy.from || d.dateTo > fy.to) {
          add('dateRange', `Dates must be within financial year ${d.financialYear}`)
        }
      }

      // Notes (optional)
      if (d.notes.trim().length > 500) add('notes', 'Notes cannot be more than 500 characters')
    })

export type GenerateReportInput = z.infer<ReturnType<typeof buildGenerateReportSchema>>