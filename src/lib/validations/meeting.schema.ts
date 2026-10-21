import { z } from 'zod'
import { requiredText, requiredSelect } from './common'

// "09:30 PM" -> minutes since midnight (21:30 = 1290)
const toMinutes = (t: string) => {
  const m = /^(\d{2}):(\d{2}) (AM|PM)$/.exec(t)
  if (!m) return -1
  const h = Number(m[1]) % 12
  return (m[3] === 'PM' ? h + 12 : h) * 60 + Number(m[2])
}

// Today's date as YYYY-MM-DD (local time)
const todayStr = () => {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`
}

// Validation rules for the Schedule Meeting form
export const meetingSchema = z
  .object({
    title: requiredText('Meeting title is required')
      .min(3, 'Title must be at least 3 characters')
      .max(100, 'Title cannot be more than 100 characters'),
    type: requiredSelect('Please select a meeting type'),
    date: requiredSelect('Meeting date is required'),
    start: requiredSelect('Please select a start time'),
    end: requiredSelect('Please select an end time'),
    venue: requiredText('Venue or meeting link is required'),
    mode: requiredSelect('Please select a meeting mode'),
    organizer: requiredSelect('Please select an organizer'),
    agenda: requiredText('Agenda is required').min(10, 'Please write at least 10 characters'),
    reminder: requiredSelect('Please select a reminder'),
    status: requiredSelect('Please select a status'),
    // Extra value passed from the modal (not a form field)
    participantCount: z.number(),
  })
  // Cross-field rules
  .superRefine((v, ctx) => {
    if (v.date && v.date < todayStr())
      ctx.addIssue({ code: 'custom', path: ['date'], message: 'Meeting date cannot be in the past' })

    if (v.start && v.end && toMinutes(v.end) <= toMinutes(v.start))
      ctx.addIssue({ code: 'custom', path: ['end'], message: 'End time must be after start time' })

    // Today's meeting cannot start at a time that has already passed
    if (v.date === todayStr() && v.start) {
      const now = new Date()
      if (toMinutes(v.start) < now.getHours() * 60 + now.getMinutes())
        ctx.addIssue({ code: 'custom', path: ['start'], message: 'Start time cannot be in the past' })
    }

    if (v.participantCount === 0)
      ctx.addIssue({ code: 'custom', path: ['participants'], message: 'Select at least one participant' })
  })