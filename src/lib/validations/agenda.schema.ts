import { z } from 'zod'
import { requiredText, requiredSelect } from './common'

// Validation rules for the Add Agenda form
export const agendaSchema = z.object({
  title: requiredText('Agenda title is required'),
  meeting: requiredSelect('Please select a meeting'),
  date: requiredSelect('Date is required'),
  priority: requiredSelect('Select priority'),
  description: requiredText('Description is required'),
  assignedTo: requiredSelect('Select a committee member'),
  status: z.string(),
})