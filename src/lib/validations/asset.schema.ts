import { z } from 'zod'

export const assetSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Asset name is required')
      .min(3, 'Name must be at least 3 characters')
      .max(60, 'Name must be at most 60 characters'),
    category: z.string().min(1, 'Select a category'),
    location: z.string().min(1, 'Select a location'),
    purchaseDate: z
      .string()
      .min(1, 'Purchase date is required')
      .refine((d) => d <= new Date().toISOString().split('T')[0], 'Purchase date cannot be in the future'),
    purchaseCost: z
      .string()
      .min(1, 'Purchase cost is required')
      .regex(/^\d+(\.\d{1,2})?$/, 'Enter a valid amount')
      .refine((v) => Number(v) > 0, 'Cost must be greater than 0'),
    vendor: z.string().min(1, 'Select a vendor'),
    warrantyStart: z.string(),
    warrantyEnd: z.string(),
    amcOn: z.boolean(),
    amcVendor: z.string(),
    contractStart: z.string(),
    contractEnd: z.string(),
    frequency: z.string().min(1, 'Select a frequency'),
    lastService: z.string(),
    nextService: z.string(),
    status: z.string().min(1, 'Select a status'),
  })
  .superRefine((d, ctx) => {
    const add = (path: string, message: string) =>
      ctx.addIssue({ code: 'custom', path: [path], message })

    if (d.warrantyStart && d.warrantyEnd && d.warrantyEnd < d.warrantyStart) {
      add('warrantyEnd', 'End must be after start')
    }

    if (d.amcOn) {
      if (!d.amcVendor) add('amcVendor', 'Select an AMC vendor')
      if (!d.contractStart) add('contractStart', 'Start date is required')
      if (!d.contractEnd) add('contractEnd', 'End date is required')
      if (d.contractStart && d.contractEnd && d.contractEnd < d.contractStart) {
        add('contractEnd', 'End must be after start')
      }
    }

    if (d.lastService && d.nextService && d.nextService < d.lastService) {
      add('nextService', 'Must be after last service')
    }
  })