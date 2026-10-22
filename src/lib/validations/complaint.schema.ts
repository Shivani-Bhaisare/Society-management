import { z } from 'zod'

export const complaintSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, 'Complaint title is required')
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title must be at most 100 characters'),
  resident: z.string().min(1, 'Select a resident'),
  flat: z.string().min(1, 'Select a flat'),
  tower: z.string().optional(),
  category: z.string().min(1, 'Select a category'),
  priority: z.enum(['Low', 'Medium', 'High', 'Urgent']),
  date: z
    .string()
    .min(1, 'Date is required')
    .refine((d) => d <= new Date().toISOString().split('T')[0], 'Date cannot be in the future'),
  assignedTo: z.string().optional(),
  description: z
    .string()
    .trim()
    .min(1, 'Description is required')
    .min(10, 'Description must be at least 10 characters')
    .max(1000, 'Description must be at most 1000 characters'),
})