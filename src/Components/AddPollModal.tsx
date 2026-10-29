'use client'

import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  X, FileText, CalendarDays, ChevronDown, Plus, XCircle, Link2, CircleDot,
  Users, ListChecks, Settings, Megaphone, Vote, Info, TextCursorInput,
} from 'lucide-react'
import { pollSchema } from '@/lib/validations/poll.schema'

/* ---------- Config ---------- */

// TODO: fetch from API later
const DEFAULT_RESOLUTIONS = [
  'Maintenance Fund Increase',
  'Clubhouse Renovation',
  'Security Staff Enhancement',
]

const POLL_TYPES = ['Single Choice', 'Multiple Choice', 'Yes / No']
const VOTERS = ['All eligible residents', 'Owners only', 'Tenants only', 'Committee members']

const MIN_OPTIONS = 2
const MAX_OPTIONS = 10

type Vals = Record<string, string>

const INITIAL: Vals = {
  title: '', resolution: '', description: '', type: 'Single Choice',
  votingStart: '', votingEnd: '', voters: 'All eligible residents',
}

export type PollPayload = {
  id: number
  title: string
  resolution: string
  description: string
  type: 'single' | 'multiple' | 'yesno'
  options: string[]
  votingStart: string
  votingEnd: string
  eligibleVoters: string
  allowVoteChanges: boolean
  anonymousVoting: boolean
}

const noScrollbar =
  '[scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden'

/* ---------- Styles ---------- */
/* bg: #10131A | input bg: #0B0E14 | border: #272D39 | accent: #6C63FF / #A29CFF */

const inputCls = (icon = false, error = false) =>
  `w-full rounded-md border bg-[#0B0E14] py-2 text-[11px] text-white outline-none transition-colors placeholder:text-slate-500 focus:border-[#6C63FF] sm:py-2.5 sm:text-xs ${
    error ? 'border-red-500/60' : 'border-[#272D39]'
  } ${icon ? 'pl-8 pr-2.5' : 'px-2.5'}`

function Field({
  label, hint, error, className = '', children,
}: {
  label: string
  hint?: string
  error?: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={`min-w-0 ${className}`}>
      <label className="mb-1 block text-[10px] text-slate-400 sm:text-[11px]">
        {label} {hint && <span className="text-slate-500">({hint})</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-[9px] text-red-400 sm:text-[10px]">{error}</p>}
    </div>
  )
}

function IconInput({
  icon: Icon, error, ...props
}: { icon: React.ElementType; error?: boolean } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-500" />
      <input {...props} className={inputCls(true, error)} />
    </div>
  )
}

function IconSelect({
  icon: Icon, placeholder, options, error, ...props
}: {
  icon: React.ElementType
  placeholder?: string
  options: string[]
  error?: boolean
} & React.SelectHTMLAttributes<HTMLSelectElement>) {
  const empty = !props.value
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-500" />
      <select
        {...props}
        className={`${inputCls(true, error)} appearance-none pr-7 ${empty ? 'text-slate-500' : ''}`}
      >
        {placeholder && (
          <option value="" className="bg-[#10131A] text-slate-400">{placeholder}</option>
        )}
        {options.map((o) => (
          <option key={o} value={o} className="bg-[#10131A] text-white">{o}</option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-400" />
    </div>
  )
}

function DateInput({
  error, value, ...props
}: { error?: boolean } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="relative">
      <CalendarDays className="pointer-events-none absolute left-2.5 top-1/2 h-3 w-3 -translate-y-1/2 text-slate-500" />
      <input
        type="date"
        value={value}
        {...props}
        className={`${inputCls(true, error)} scheme-dark ${value ? '' : 'text-slate-500'}`}
      />
    </div>
  )
}

function SectionHead({
  icon: Icon, title, sub, first = false,
}: { icon: React.ElementType; title: string; sub: string; first?: boolean }) {
  return (
    <div
      className={`mb-3 flex items-center gap-2.5 ${
        first ? '' : 'mt-5 border-t border-[#272D39] pt-4'
      }`}
    >
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#6C63FF]/20 text-[#A29CFF]">
        <Icon className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0">
        <h3 className="text-xs font-bold sm:text-sm">{title}</h3>
        <p className="text-[9px] text-slate-400 sm:text-[11px]">{sub}</p>
      </div>
    </div>
  )
}

function Toggle({
  title, desc, checked, onChange,
}: { title: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex min-w-0 flex-1 items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-white sm:text-xs">
          {title} <Info className="h-3 w-3 shrink-0 text-slate-500" />
        </div>
        <p className="mt-0.5 text-[9px] text-slate-400 sm:text-[10px]">{desc}</p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-5 w-9 shrink-0 cursor-pointer rounded-full border transition-colors ${
          checked ? 'border-[#6C63FF] bg-[#6C63FF]' : 'border-[#272D39] bg-[#0B0E14]'
        }`}
      >
        <span
          className={`absolute top-0.5 h-3.5 w-3.5 rounded-full bg-white transition-all ${
            checked ? 'left-4.5' : 'left-0.5'
          }`}
        />
      </button>
    </div>
  )
}

/* ---------- Drawer ---------- */

export default function AddPollModal({
  open, onClose, onSave, resolutions = DEFAULT_RESOLUTIONS,
}: {
  open: boolean
  onClose: () => void
  onSave?: (data: PollPayload) => void
  resolutions?: string[]
}) {
  return (
    <AnimatePresence>
      {open && <Body onClose={onClose} onSave={onSave} resolutions={resolutions} />}
    </AnimatePresence>
  )
}

function Body({
  onClose, onSave, resolutions,
}: {
  onClose: () => void
  onSave?: (data: PollPayload) => void
  resolutions: string[]
}) {
  const [v, setV] = useState<Vals>(INITIAL)
  const [options, setOptions] = useState<string[]>(['', ''])
  const [allowChanges, setAllowChanges] = useState(false)
  const [anonymous, setAnonymous] = useState(true)
  const [errors, setErrors] = useState<Record<string, string>>({})

  const today = new Date().toISOString().split('T')[0]

  // Lock background page scroll while the drawer is open + close on Esc
  useEffect(() => {
    const html = document.documentElement
    const body = document.body
    const prevHtml = html.style.overflow
    const prevBody = body.style.overflow
    html.style.overflow = 'hidden'
    body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => {
      html.style.overflow = prevHtml
      body.style.overflow = prevBody
      window.removeEventListener('keydown', onKey)
    }
  }, [onClose])

  const bind = (k: string) => ({
    value: v[k] ?? '',
    onChange: (
      e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>,
    ) => {
      const val = e.target.value
      setV((p) => ({ ...p, [k]: val }))
      setErrors((p) => ({ ...p, [k]: '' }))
    },
  })

  // When poll type changes: auto-fill options if it is Yes / No
  const onTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value
    setV((p) => ({ ...p, type: val }))
    if (val === 'Yes / No') setOptions(['Yes', 'No'])
  }

  const updateOption = (i: number, val: string) => {
    setOptions((p) => p.map((o, idx) => (idx === i ? val : o)))
    setErrors((p) => ({ ...p, [`opt${i}`]: '' }))
  }
  const addOption = () => options.length < MAX_OPTIONS && setOptions((p) => [...p, ''])
  const removeOption = (i: number) =>
    options.length > MIN_OPTIONS && setOptions((p) => p.filter((_, idx) => idx !== i))

  // Validation runs through poll.schema.ts
  function validate() {
    const result = pollSchema.safeParse({ ...v, options })
    const err: Record<string, string> = {}

    if (!result.success) {
      for (const issue of result.error.issues) {
        const [first, idx] = issue.path
        // option errors use the key opt0, opt1... (same as the existing UI)
        const key = first === 'options' && typeof idx === 'number' ? `opt${idx}` : String(first)
        if (!err[key]) err[key] = issue.message
      }
    }

    setErrors(err)
    return Object.keys(err).length === 0
  }

  function submit(ev: React.FormEvent<HTMLFormElement>) {
    ev.preventDefault()
    if (!validate()) return
    const typeMap: Record<string, PollPayload['type']> = {
      'Single Choice': 'single',
      'Multiple Choice': 'multiple',
      'Yes / No': 'yesno',
    }
    // TODO: add API call here
    onSave?.({
      id: Date.now(),
      title: v.title.trim(),
      resolution: v.resolution,
      description: v.description.trim(),
      type: typeMap[v.type],
      options: options.map((o) => o.trim()).filter(Boolean),
      votingStart: v.votingStart,
      votingEnd: v.votingEnd,
      eligibleVoters: v.voters,
      allowVoteChanges: allowChanges,
      anonymousVoting: anonymous,
    })
    onClose()
  }

  return createPortal(
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      onClick={onClose}
      className="fixed inset-0 z-100 flex justify-end bg-black/70 py-0 pl-0 backdrop-blur-sm sm:py-5 sm:pl-3"
    >
      <motion.form
        onSubmit={submit}
        noValidate
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        onClick={(e) => e.stopPropagation()}
        className="flex h-full w-full max-w-md flex-col overflow-hidden border border-r-0 border-[#272D39] bg-[#10131A] text-white shadow-2xl sm:rounded-l-2xl"
      >
        {/* Header */}
        <div className="flex shrink-0 items-start justify-between gap-3 p-3.5 pb-2 sm:p-4 sm:pb-2 lg:p-5 lg:pb-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-linear-to-br from-[#6C63FF] to-[#4DA3FF] sm:h-10 sm:w-10">
              <Megaphone className="h-4 w-4 text-white sm:h-5 sm:w-5" />
            </span>
            <div className="min-w-0">
              <h2 className="truncate text-sm font-bold text-white sm:text-base">Create New Poll</h2>
              <p className="text-[10px] text-slate-400 sm:text-xs">Set up a society poll and invite residents to vote</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="shrink-0 cursor-pointer rounded-lg p-1.5 text-slate-300 hover:bg-white/5 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className={`mt-2 min-h-0 flex-1 overflow-y-auto overscroll-contain px-3.5 text-white sm:px-4 lg:px-5 ${noScrollbar}`}>
          <div className="rounded-xl border border-[#272D39] p-3 sm:p-3.5 lg:p-4">
            {/* Section 1: Poll Details */}
            <SectionHead first icon={Vote} title="Poll Details" sub="Title, resolution, description and type" />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Poll Title" error={errors.title}>
                <IconInput
                  icon={FileText}
                  {...bind('title')}
                  error={!!errors.title}
                  placeholder="Enter poll title"
                />
              </Field>

              <Field label="Related Resolution" hint="Optional">
                <IconSelect
                  icon={Link2}
                  {...bind('resolution')}
                  placeholder="Select resolution"
                  options={resolutions}
                />
              </Field>
            </div>

            <div className="mt-3">
              <Field label="Poll Description" error={errors.description}>
                <div className="relative">
                  <FileText className="pointer-events-none absolute left-2.5 top-2.5 h-3 w-3 text-slate-500" />
                  <textarea
                    rows={4}
                    maxLength={1000}
                    {...bind('description')}
                    placeholder="Describe the poll and voting purpose..."
                    className={`${inputCls(true, !!errors.description)} resize-none ${noScrollbar}`}
                  />
                </div>
                <p className="mt-1 text-right text-[9px] text-slate-500 sm:text-[10px]">{v.description.length}/1000</p>
              </Field>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Poll Type">
                <IconSelect
                  icon={CircleDot}
                  value={v.type}
                  onChange={onTypeChange}
                  options={POLL_TYPES}
                />
              </Field>
            </div>

            {/* Section 2: Poll Options */}
            <SectionHead icon={ListChecks} title="Poll Options" sub={`Add 2 to ${MAX_OPTIONS} options`} />

            <div className="flex flex-col gap-3">
              {options.map((opt, i) => (
                <Field
                  key={i}
                  label={`Option ${i + 1}${i < MIN_OPTIONS ? ' *' : ''}`}
                  error={errors[`opt${i}`]}
                >
                  <div className="flex items-center gap-2">
                    <div className="min-w-0 flex-1">
                      <IconInput
                        icon={TextCursorInput}
                        value={opt}
                        onChange={(e) => updateOption(i, e.target.value)}
                        error={!!errors[`opt${i}`]}
                        placeholder={`Enter option ${i + 1}`}
                      />
                    </div>
                    <button
                      type="button"
                      onClick={() => removeOption(i)}
                      disabled={options.length <= MIN_OPTIONS}
                      aria-label="Remove option"
                      className="shrink-0 cursor-pointer text-red-400 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      <XCircle className="h-4 w-4" />
                    </button>
                  </div>
                </Field>
              ))}

              {options.length < MAX_OPTIONS && (
                <button
                  type="button"
                  onClick={addOption}
                  className="flex cursor-pointer items-center justify-center gap-1.5 rounded-md border border-dashed border-[#3A4152] bg-[#0B0E14] py-2 text-[11px] font-medium text-[#A29CFF] transition-colors hover:border-[#6C63FF] sm:py-2.5 sm:text-xs"
                >
                  <Plus className="h-3 w-3" /> Add Option
                </button>
              )}
            </div>

            {/* Section 3: Voting Schedule */}
            <SectionHead icon={CalendarDays} title="Voting Schedule" sub="Set the voting period and voters" />

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <Field label="Voting Start Date" error={errors.votingStart}>
                <DateInput {...bind('votingStart')} min={today} error={!!errors.votingStart} />
              </Field>

              <Field label="Voting End Date" error={errors.votingEnd}>
                <DateInput
                  {...bind('votingEnd')}
                  min={v.votingStart || today}
                  error={!!errors.votingEnd}
                />
              </Field>
            </div>

            <div className="mt-3">
              <Field label="Eligible Voters">
                <IconSelect icon={Users} {...bind('voters')} options={VOTERS} />
              </Field>
            </div>

            {/* Section 4: Settings */}
            <SectionHead icon={Settings} title="Settings" sub="Voting preferences" />

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <Toggle
                title="Allow vote changes"
                desc="Let voters change their vote before the poll ends"
                checked={allowChanges}
                onChange={setAllowChanges}
              />
              <div className="h-px w-full bg-[#272D39] sm:h-9 sm:w-px" />
              <Toggle
                title="Anonymous voting"
                desc="Hide voter identity from other residents"
                checked={anonymous}
                onChange={setAnonymous}
              />
            </div>
          </div>
          <div className="h-3" />
        </div>

        {/* Footer */}
        <div className="flex shrink-0 flex-col-reverse items-stretch justify-end gap-2 border-t border-[#272D39] p-3.5 sm:flex-row sm:items-center sm:p-4 lg:p-5">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-md border border-[#272D39] px-3.5 py-2 text-[11px] font-semibold text-white hover:bg-white/5 sm:py-1.5 sm:text-xs"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="flex cursor-pointer items-center justify-center gap-1.5 rounded-md bg-linear-to-r from-[#6C63FF] to-[#4DA3FF] px-4 py-2 text-[11px] font-semibold text-white hover:opacity-90 sm:py-1.5 sm:text-xs"
          >
            <Plus className="h-3 w-3" /> Create Poll
          </button>
        </div>
      </motion.form>
    </motion.div>,
    document.body,
  )
}