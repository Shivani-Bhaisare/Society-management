import { z } from 'zod'
import { isRealDate, MIN_YEAR } from './treasurerValidationHelpers'
import { fyRange } from './treasurerGenerateReport.schema'

/* ---------- Helpers ---------- */

// Checks a yyyy-mm-dd date and returns an error message, or '' when it is valid
const dateError = (value: string, label: string) => {
  if (!value) return `${label} is required`
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !isRealDate(value)) return `Enter a valid ${label.toLowerCase()}`
  if (Number(value.slice(0, 4)) < MIN_YEAR) return `Year must be ${MIN_YEAR} or later`
  return ''
}

/* ---------- Generate Tax Report form ---------- */

// The allowed option lists are passed in, so the schema always matches the dropdowns
export const buildGenerateTaxReportSchema = (options: {
  reportTypes: string[]
  financialYears: string[]
  periodTypes: readonly string[]
  quarters: string[]
  chargeHeads: string[]
  taxRates: string[]
  statuses: string[]
  formats: string[]
}) =>
  z
    .object({
      reportType: z.string(),
      financialYear: z.string(),
      periodType: z.string(),
      month: z.string(), // yyyy-mm (Monthly only)
      quarter: z.string(), // Quarterly only
      dateFrom: z.string(), // yyyy-mm-dd (Custom only)
      dateTo: z.string(), // yyyy-mm-dd (Custom only)
      chargeHead: z.string(),
      taxRate: z.string(),
      status: z.string(),
      format: z.string(),
      notes: z.string(),
    })
    .superRefine((d, ctx) => {
      const add = (path: string, message: string) =>
        ctx.addIssue({ code: 'custom', path: [path], message })

      // Small helper for the plain dropdowns: must be chosen and must be a listed option
      const checkList = (path: string, value: string, list: readonly string[], label: string) => {
        if (!value) add(path, `Select a ${label}`)
        else if (!list.includes(value)) add(path, `Select a valid ${label}`)
      }

      checkList('reportType', d.reportType, options.reportTypes, 'report type')
      checkList('financialYear', d.financialYear, options.financialYears, 'financial year')
      checkList('periodType', d.periodType, options.periodTypes, 'period type')
      checkList('chargeHead', d.chargeHead, options.chargeHeads, 'charge head')
      checkList('taxRate', d.taxRate, options.taxRates, 'tax rate')
      checkList('status', d.status, options.statuses, 'status')
      checkList('format', d.format, options.formats, 'report format')

      // Financial year limits (used by month and custom range)
      const fy = /^\d{4}-\d{2}$/.test(d.financialYear) ? fyRange(d.financialYear) : null

      // Monthly: month must be inside the financial year
      if (d.periodType === 'Monthly') {
        if (!d.month) {
          add('month', 'Select a month')
        } else if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(d.month)) {
          add('month', 'Enter a valid month')
        } else if (Number(d.month.slice(0, 4)) < MIN_YEAR) {
          add('month', `Year must be ${MIN_YEAR} or later`)
        } else if (fy && (d.month < fy.from.slice(0, 7) || d.month > fy.to.slice(0, 7))) {
          add('month', `Month must be within financial year ${d.financialYear}`)
        }
      }

      // Quarterly: quarter must be one of the listed quarters
      if (d.periodType === 'Quarterly') {
        checkList('quarter', d.quarter, options.quarters, 'quarter')
      }

      // Custom: valid dates, correct order, inside the financial year
      if (d.periodType === 'Custom') {
        const fromMsg = dateError(d.dateFrom, 'Start date')
        const toMsg = dateError(d.dateTo, 'End date')

        if (fromMsg || toMsg) {
          add('dateRange', fromMsg || toMsg)
        } else if (d.dateTo < d.dateFrom) {
          add('dateRange', 'End date cannot be before start date')
        } else if (fy && (d.dateFrom < fy.from || d.dateTo > fy.to)) {
          add('dateRange', `Dates must be within financial year ${d.financialYear}`)
        }
      }

      // Notes (optional)
      if (d.notes.trim().length > 500) add('notes', 'Notes cannot be more than 500 characters')
    })

export type GenerateTaxReportInput = z.infer<ReturnType<typeof buildGenerateTaxReportSchema>>