import { z } from 'zod'
import type { ZodType } from 'zod'
import { requiredText } from './common'

const thisYear = new Date().getFullYear()

// Required email
const requiredEmail = z
  .string()
  .trim()
  .min(1, 'Email is required')
  .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Enter a valid email')

// Optional number (3 to 15 chars, so 100 / 101 style helplines are allowed too)
const optionalNumber = (label: string) =>
  z.string().refine((s) => !s || /^[+\d][\d\s-]{2,14}$/.test(s), `${label}: enter a valid number`)

// Optional 10 digit mobile
const optionalMobile = (label: string) =>
  z.string().refine((s) => !s || /^\d{10}$/.test(s), `${label}: mobile must be 10 digits`)

// Optional email
const optionalEmail = (label: string) =>
  z
    .string()
    .refine((s) => !s || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s), `${label}: enter a valid email`)

// Optional whole number (0 or more)
const optionalWhole = (label: string) =>
  z.string().refine((s) => !s || /^\d+$/.test(s), `${label} must be a whole number`)

// One schema per step (index = step number in the modal)
export const profileSteps: ZodType[] = [
  // 0. Basic Details
  z.object({
    name: requiredText('Society name is required'),
    regNo: requiredText('Registration number is required'),
    year: z
      .string()
      .refine(
        (s) => !s || (/^\d{4}$/.test(s) && Number(s) >= 1900 && Number(s) <= thisYear),
        `Enter a year between 1900 and ${thisYear}`,
      ),
  }),

  // 1. Address & Location
  z.object({
    address: requiredText('Address is required'),
    city: requiredText('City is required'),
    state: requiredText('State is required'),
    pin: z
      .string()
      .trim()
      .min(1, 'PIN code is required')
      .regex(/^\d{6}$/, 'Enter a 6 digit PIN'),
  }),

  // 2. Contact Info
  z.object({
    email: requiredEmail,
    phone: z
      .string()
      .trim()
      .min(1, 'Contact number is required')
      .regex(/^[+\d][\d\s-]{7,}$/, 'Enter a valid number'),
    emergency: optionalNumber('Emergency contact'),
  }),

  // 3. Society Structure
  z.object({
    towers: optionalWhole('Total towers'),
    units: optionalWhole('Total units'),
    parking: optionalWhole('Total parking slots'),
  }),

  // 4. Rules & Regulations (only files, nothing to check here)
  z.object({}),

  // 5. Office Bearers
  z.object({
    presMobile: optionalMobile('President'),
    presEmail: optionalEmail('President'),
    secMobile: optionalMobile('Secretary'),
    secEmail: optionalEmail('Secretary'),
    treMobile: optionalMobile('Treasurer'),
    treEmail: optionalEmail('Treasurer'),
  }),

  // 6. Emergency Contacts
  z.object({
    security: optionalNumber('Security'),
    fire: optionalNumber('Fire Brigade'),
    ambulance: optionalNumber('Ambulance'),
    police: optionalNumber('Police'),
    manager: optionalNumber('Society Manager'),
    plumber: optionalNumber('Plumber'),
    electrician: optionalNumber('Electrician'),
  }),

  // 7. Notification Settings (toggles only, nothing to check here)
  z.object({}),
]