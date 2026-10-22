import { z } from 'zod'

const ENTRY_TYPES = ['Visitor', 'Delivery', 'Cab', 'Vehicle'] as const

const NAME_LABEL: Record<(typeof ENTRY_TYPES)[number], string> = {
  Visitor: 'Visitor Name',
  Delivery: 'Delivery Person Name',
  Cab: 'Driver Name',
  Vehicle: 'Driver / Owner Name',
}

const MOBILE = /^[6-9]\d{9}$/
const VEHICLE_NO = /^[A-Z]{2}\d{2}[A-Z]{1,3}\d{4}$/
const FLAT_NO = /^[A-Za-z0-9][A-Za-z0-9 -]{0,9}$/

// Base fields are plain strings; all rules live in superRefine so that
// every error (type-dependent ones included) shows up together.
export const gateEntrySchema = z
  .object({
    type: z.enum(ENTRY_TYPES),
    name: z.string(),
    phone: z.string(),
    flat: z.string(),
    vehicleNo: z.string(),
    entryTime: z.string(),
    isBlacklisted: z.boolean(),
  })
  .superRefine((d, ctx) => {
    const add = (path: string, message: string) =>
      ctx.addIssue({ code: 'custom', path: [path], message })

    const phoneReq = d.type === 'Visitor' || d.type === 'Vehicle'
    const flatReq = d.type === 'Visitor' || d.type === 'Vehicle'
    const vehicleReq = d.type === 'Cab' || d.type === 'Vehicle'

    // Name
    const name = d.name.trim()
    if (!name) add('name', `${NAME_LABEL[d.type]} is required`)
    else if (name.length < 3) add('name', 'Name must be at least 3 characters')
    else if (name.length > 60) add('name', 'Name must be at most 60 characters')
    else if (!/^[A-Za-z][A-Za-z .'-]*$/.test(name)) add('name', 'Name can only contain letters')

    // Phone
    if (d.isBlacklisted) add('phone', 'This person is blacklisted. Entry restricted')
    else if (!d.phone && phoneReq) add('phone', 'Phone number is required')
    else if (d.phone && !MOBILE.test(d.phone)) add('phone', 'Enter a valid 10-digit mobile number')

    // Flat
    const flat = d.flat.trim()
    if (flatReq && !flat) add('flat', 'Flat number is required')
    else if (flat && !FLAT_NO.test(flat)) add('flat', 'Enter a valid flat number, e.g. A-204')

    // Vehicle number
    const vn = d.vehicleNo.replace(/\s/g, '')
    if (vehicleReq && !vn) add('vehicleNo', 'Vehicle number is required')
    else if (vn && !VEHICLE_NO.test(vn)) add('vehicleNo', 'Enter a valid number, e.g. MP04 AB 1234')

    // Entry time
    if (!d.entryTime) add('entryTime', 'Entry time is required')
  })