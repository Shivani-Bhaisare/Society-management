import { z } from 'zod'
import { requiredText, requiredSelect, amount } from './common'

// Validation rules for the Add Expense form
export const expenseSchema = z.object({
  title: requiredText('Expense title is required'),
  category: requiredSelect('Please select a category'),
  vendor: requiredText('Vendor / payee name is required'),
  expenseDate: requiredSelect('Expense date is required'),
  amount: amount(),
  paymentMethod: requiredSelect('Please select a payment method'),
  description: requiredText('Description is required'),
})