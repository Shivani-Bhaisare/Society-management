'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  User,
  Building2,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Check,
  ArrowRight,
  ArrowLeft,
  Phone,
  ChevronDown,
  Info,
  AlertCircle,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react'

/* ---------- Types ---------- */

type FormState = {
  fullName: string
  organization: string
  email: string
  countryCode: string
  mobile: string
  password: string
  confirmPassword: string
  terms: boolean
  privacy: boolean
  updates: boolean
}

type Errors = Partial<Record<keyof FormState, string>>

// All fields start empty (country code defaults to India)
const initialState: FormState = {
  fullName: '',
  organization: '',
  email: '',
  countryCode: '+91',
  mobile: '',
  password: '',
  confirmPassword: '',
  terms: false,
  privacy: false,
  updates: false,
}

// Country code options (flag + code)
const countryCodes = [
  { code: '+91', flag: '🇮🇳' },
  { code: '+1', flag: '🇺🇸' },
  { code: '+44', flag: '🇬🇧' },
  { code: '+61', flag: '🇦🇺' },
  { code: '+971', flag: '🇦🇪' },
  { code: '+65', flag: '🇸🇬' },
]

// Step content (number badge, section title and subtitle)
const steps = [
  {
    no: '01',
    label: 'Details',
    section: 'Personal & business information',
    subtitle: 'Use your work details for invoices and verification',
  },
  {
    no: '02',
    label: 'Security',
    section: 'Account Security',
    subtitle: 'Choose a strong password to protect your workspace',
  },
  {
    no: '03',
    label: 'Consent',
    section: 'Terms & consent',
    subtitle: 'Review and accept to continue',
  },
]

/* ---------- Validation patterns ---------- */

// Letters, spaces, dots and apostrophes only (min 2 characters)
const NAME_REGEX = /^[A-Za-z][A-Za-z\s.'-]{1,}$/
// Standard email format
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
// Indian mobile number: 10 digits, must start with 6, 7, 8 or 9
const MOBILE_REGEX = /^[6-9]\d{9}$/

/* ---------- Shared styles ---------- */

const labelClass = 'block text-xs sm:text-[13px] font-medium text-slate-700 mb-1'

const inputBase =
  'block w-full rounded-lg border bg-slate-50/60 py-2 text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-3 transition'

// Border turns red when the field has an error
const inputClass = (error?: string) =>
  `${inputBase} ${
    error
      ? 'border-red-400 focus:border-red-500 focus:ring-red-500/10'
      : 'border-slate-200 focus:border-[#2563EB] focus:ring-[#2563EB]/10'
  }`

/* ---------- Small reusable pieces ---------- */

// Label + input + hint / error text (no asterisk on labels)
function Field({
  label,
  htmlFor,
  error,
  hint,
  children,
}: {
  label: string
  htmlFor: string
  error?: string
  hint?: string
  children: React.ReactNode
}) {
  return (
    <div className="min-w-0">
      <label htmlFor={htmlFor} className={labelClass}>
        {label}
      </label>
      {children}
      {error ? (
        <p className="mt-1 flex items-center gap-1 text-[11px] text-red-500">
          <AlertCircle className="h-3 w-3 shrink-0" />
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1 text-[11px] text-slate-400">{hint}</p>
      ) : null}
    </div>
  )
}

// Input with a left icon
function IconInput({
  icon: Icon,
  children,
}: {
  icon: React.ElementType
  children: React.ReactNode
}) {
  return (
    <div className="relative">
      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
        <Icon className="h-4 w-4" />
      </div>
      {children}
    </div>
  )
}

// Show / hide password button
function EyeToggle({ show, onToggle }: { show: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={show ? 'Hide password' : 'Show password'}
      className="absolute inset-y-0 right-0 flex cursor-pointer items-center pr-3 text-slate-400 transition hover:text-slate-600 focus:outline-none"
    >
      {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
    </button>
  )
}

// Bordered checkbox row used in the Terms & consent step
function ConsentRow({
  name,
  checked,
  onChange,
  error,
  children,
}: {
  name: string
  checked: boolean
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  error?: string
  children: React.ReactNode
}) {
  return (
    <div>
      <label
        className={`flex cursor-pointer select-none items-start gap-2.5 rounded-lg border px-3 py-2.5 text-[11px] leading-relaxed text-slate-600 transition sm:text-xs ${
          error
            ? 'border-red-400 bg-red-50/40'
            : checked
            ? 'border-[#2563EB]/30 bg-blue-50/50'
            : 'border-slate-200 bg-slate-50/60 hover:border-slate-300'
        }`}
      >
        <input
          type="checkbox"
          name={name}
          checked={checked}
          onChange={onChange}
          className="mt-0.5 h-3.5 w-3.5 shrink-0 cursor-pointer rounded border-slate-300 accent-[#2563EB]"
        />
        <span className="min-w-0">{children}</span>
      </label>
      {error && (
        <p className="mt-1 flex items-center gap-1 text-[11px] text-red-500">
          <AlertCircle className="h-3 w-3 shrink-0" />
          {error}
        </p>
      )}
    </div>
  )
}

/* ---------- Main form ---------- */

export default function RegisterForm() {
  const router = useRouter()
  const [step, setStep] = useState(0)
  const [form, setForm] = useState<FormState>(initialState)
  const [errors, setErrors] = useState<Errors>({})
  const [showPass, setShowPass] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)

  const isLast = step === steps.length - 1
  const isIndia = form.countryCode === '+91'

  // Update any field and clear its error
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, type } = e.target
    let value: string | boolean =
      type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value

    // Mobile: allow digits only (10 for India, 15 for other countries)
    if (name === 'mobile') {
      value = (value as string).replace(/\D/g, '').slice(0, isIndia ? 10 : 15)
    }

    // Name: block digits and special symbols while typing
    if (name === 'fullName') {
      value = (value as string).replace(/[^A-Za-z\s.'-]/g, '')
    }

    setForm((p) => {
      const next = { ...p, [name]: value }
      // When switching to India, trim mobile to 10 digits
      if (name === 'countryCode' && value === '+91') next.mobile = p.mobile.slice(0, 10)
      return next
    })
    setErrors((p) => ({ ...p, [name]: undefined, ...(name === 'countryCode' ? { mobile: undefined } : {}) }))
  }

  // Password rules for the checklist
  const rules = useMemo(
    () => [
      { label: '8+ characters', ok: form.password.length >= 8 },
      { label: 'Upper & lowercase', ok: /[a-z]/.test(form.password) && /[A-Z]/.test(form.password) },
      { label: 'One number', ok: /\d/.test(form.password) },
      { label: 'One symbol', ok: /[^A-Za-z0-9]/.test(form.password) },
    ],
    [form.password]
  )

  const score = rules.filter((r) => r.ok).length
  const strength =
    score <= 1
      ? { text: 'Weak', bar: 'bg-red-500', color: 'text-red-500' }
      : score <= 3
      ? { text: 'Fair', bar: 'bg-amber-500', color: 'text-amber-500' }
      : { text: 'Strong', bar: 'bg-emerald-500', color: 'text-emerald-600' }

  // Validate only the fields of the current step
  const validateStep = (s: number) => {
    const e: Errors = {}

    if (s === 0) {
      // Full name
      const name = form.fullName.trim()
      if (!name) e.fullName = 'Full name is required'
      else if (!NAME_REGEX.test(name)) e.fullName = 'Enter a valid name (letters only, min 2 characters)'

      // Organization
      const org = form.organization.trim()
      if (!org) e.organization = 'Organization name is required'
      else if (org.length < 2) e.organization = 'Organization name must be at least 2 characters'

      // Email
      const email = form.email.trim()
      if (!email) e.email = 'Email is required'
      else if (!EMAIL_REGEX.test(email)) e.email = 'Enter a valid email address'

      // Mobile number
      if (!form.mobile) e.mobile = 'Mobile number is required'
      else if (isIndia) {
        if (form.mobile.length !== 10) e.mobile = 'Enter a valid 10-digit mobile number'
        else if (!MOBILE_REGEX.test(form.mobile)) e.mobile = 'Mobile number must start with 6, 7, 8 or 9'
      } else if (form.mobile.length < 6) {
        e.mobile = 'Enter a valid mobile number'
      }
    }

    if (s === 1) {
      // Password
      if (!form.password) e.password = 'Password is required'
      else if (score < 4) e.password = 'Password does not meet all requirements'

      // Confirm password
      if (!form.confirmPassword) e.confirmPassword = 'Please confirm your password'
      else if (form.confirmPassword !== form.password) e.confirmPassword = 'Passwords do not match'
    }

    if (s === 2) {
      // Required consents
      if (!form.terms) e.terms = 'You must accept the Terms & Conditions'
      if (!form.privacy) e.privacy = 'You must accept the Privacy Policy'
    }

    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleBack = () => {
    setErrors({})
    setStep((s) => Math.max(0, s - 1))
  }

  // Enter key / button: go to next step, or submit on the last step
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateStep(step)) return

    if (!isLast) {
      setStep((s) => s + 1)
      return
    }

    setLoading(true)
    try {
      // TODO: call your register API here (send form.countryCode + form.mobile)
      await new Promise((r) => setTimeout(r, 800))

      // After a successful register, go straight to the Login page
      router.push('/auth/login')
    } finally {
      setLoading(false)
    }
  }

  return (
    // Card: fixed max height, so only the form area scrolls (not the page)
    <div className="flex max-h-[calc(100dvh-2rem)] w-full flex-col rounded-xl border border-slate-100 bg-white p-5 shadow-xl transition-all duration-300 sm:rounded-2xl sm:p-6">
      {/* ---------- Card header ---------- */}
      <div className="mb-3 flex shrink-0 items-start justify-between gap-3 text-left">
        <div>
          <h2 className="text-xl font-bold leading-tight tracking-tight text-slate-900 sm:text-[22px]">
            Create Your Account
          </h2>
          <p className="mt-1 text-xs text-slate-500 sm:text-sm">
            Get started with your selected plan.
          </p>
        </div>

        {/* Step pill */}
        <span className="flex shrink-0 items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-semibold text-emerald-600">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Step {step + 1} of {steps.length}
        </span>
      </div>

      {/* ---------- Progress bar ---------- */}
      <div className="mb-4 grid shrink-0 grid-cols-3 gap-1.5">
        {steps.map((s, i) => (
          <span
            key={s.label}
            className={`h-1 rounded-full transition-colors ${
              i <= step ? 'bg-[#2563EB]' : 'bg-slate-200'
            }`}
          />
        ))}
      </div>

      {/* ---------- Section header (number badge) ---------- */}
      <div className="mb-4 flex shrink-0 items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px] bg-[#0F1E38] text-xs font-bold text-white">
          {steps[step].no}
        </span>
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-slate-900">{steps[step].section}</h3>
          <p className="text-[11px] text-slate-500">{steps[step].subtitle}</p>
        </div>
      </div>

      {/* ---------- Form (scrollable area, scrollbar hidden) ---------- */}
      <form
        onSubmit={handleSubmit}
        noValidate
        className="-mx-1 min-h-0 flex-1 space-y-3 overflow-y-auto px-1 pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {/* ===== STEP 1: Personal & business information ===== */}
        {step === 0 && (
          <>
            <Field label="Full Name" htmlFor="fullName" error={errors.fullName}>
              <IconInput icon={User}>
                <input
                  id="fullName"
                  name="fullName"
                  value={form.fullName}
                  onChange={handleChange}
                  placeholder="Enter your full name"
                  autoComplete="name"
                  className={`${inputClass(errors.fullName)} pl-10 pr-3`}
                />
              </IconInput>
            </Field>

            <Field label="Business / Organization" htmlFor="organization" error={errors.organization}>
              <IconInput icon={Building2}>
                <input
                  id="organization"
                  name="organization"
                  value={form.organization}
                  onChange={handleChange}
                  placeholder="Enter organization name"
                  autoComplete="organization"
                  className={`${inputClass(errors.organization)} pl-10 pr-3`}
                />
              </IconInput>
            </Field>

            <Field
              label="Business Email"
              htmlFor="email"
              error={errors.email}
              hint="We'll send your receipt and invite links here."
            >
              <IconInput icon={Mail}>
                <input
                  id="email"
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="Enter your email address"
                  autoComplete="email"
                  className={`${inputClass(errors.email)} pl-10 pr-3`}
                />
              </IconInput>
            </Field>

            {/* Country code + Mobile number (code box on the left, smaller mobile input) */}
            <div className="grid grid-cols-[104px_minmax(0,1fr)] gap-3 sm:grid-cols-[120px_minmax(0,1fr)]">
              <Field label="Code" htmlFor="countryCode">
                <div className="relative">
                  <select
                    id="countryCode"
                    name="countryCode"
                    value={form.countryCode}
                    onChange={handleChange}
                    className={`${inputClass()} cursor-pointer appearance-none pl-3 pr-8`}
                  >
                    {countryCodes.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.flag} {c.code}
                      </option>
                    ))}
                  </select>
                  <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2.5 text-slate-400">
                    <ChevronDown className="h-4 w-4" />
                  </div>
                </div>
              </Field>

              <Field label="Mobile Number" htmlFor="mobile" error={errors.mobile}>
                <IconInput icon={Phone}>
                  <input
                    id="mobile"
                    type="tel"
                    inputMode="numeric"
                    name="mobile"
                    value={form.mobile}
                    onChange={handleChange}
                    maxLength={isIndia ? 10 : 15}
                    placeholder="Enter mobile number"
                    autoComplete="tel-national"
                    className={`${inputClass(errors.mobile)} pl-10 pr-3`}
                  />
                </IconInput>
              </Field>
            </div>
          </>
        )}

        {/* ===== STEP 2: Account security ===== */}
        {step === 1 && (
          <>
            <Field label="Create Password" htmlFor="password" error={errors.password}>
              <IconInput icon={Lock}>
                <input
                  id="password"
                  type={showPass ? 'text' : 'password'}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className={`${inputClass(errors.password)} pl-10 pr-10`}
                />
                <EyeToggle show={showPass} onToggle={() => setShowPass((v) => !v)} />
              </IconInput>
            </Field>

            <Field label="Confirm Password" htmlFor="confirmPassword" error={errors.confirmPassword}>
              <IconInput icon={Lock}>
                <input
                  id="confirmPassword"
                  type={showConfirm ? 'text' : 'password'}
                  name="confirmPassword"
                  value={form.confirmPassword}
                  onChange={handleChange}
                  placeholder="••••••••"
                  autoComplete="new-password"
                  className={`${inputClass(errors.confirmPassword)} pl-10 pr-10`}
                />
                <EyeToggle show={showConfirm} onToggle={() => setShowConfirm((v) => !v)} />
              </IconInput>
            </Field>

            {/* Strength meter */}
            <div>
              <div className="mb-1 flex items-center justify-between text-[11px]">
                <span className="text-slate-500">
                  Strength:{' '}
                  <span className={`font-semibold ${form.password ? strength.color : 'text-slate-400'}`}>
                    {form.password ? strength.text : '—'}
                  </span>
                </span>
                <span className="font-semibold text-slate-500">{score} / 4</span>
              </div>

              <div className="grid grid-cols-4 gap-1.5">
                {[0, 1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className={`h-1.5 rounded-full transition-colors ${
                      form.password && i < score ? strength.bar : 'bg-slate-200'
                    }`}
                  />
                ))}
              </div>

              {/* Rules checklist */}
              <ul className="mt-2 grid grid-cols-2 gap-x-3 gap-y-1">
                {rules.map((r) => (
                  <li
                    key={r.label}
                    className={`flex items-center gap-1.5 text-[11px] ${
                      r.ok ? 'text-emerald-600' : 'text-slate-400'
                    }`}
                  >
                    <Check className="h-3 w-3 shrink-0" /> {r.label}
                  </li>
                ))}
              </ul>
            </div>

            {/* Tip box */}
            <div className="flex items-start gap-2 rounded-lg border border-blue-100 bg-blue-50 p-2.5 text-[11px] leading-relaxed text-blue-600">
              <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <p>Tip: Use a passphrase with 3 random words for a password that&apos;s strong and memorable.</p>
            </div>
          </>
        )}

        {/* ===== STEP 3: Terms & consent ===== */}
        {step === 2 && (
          <div className="space-y-2.5">
            {/* Terms & Conditions (required) */}
            <ConsentRow name="terms" checked={form.terms} onChange={handleChange} error={errors.terms}>
              <span className="font-medium text-slate-800">I agree to the Terms &amp; Conditions</span>{' '}
              <span className="text-slate-400">— required to create your workspace.</span>{' '}
              <Link
                href="#"
                onClick={(e) => e.stopPropagation()}
                className="font-semibold text-[#2563EB] hover:text-[#1d4ed8] hover:underline"
              >
                View terms
              </Link>
            </ConsentRow>

            {/* Privacy Policy (required) */}
            <ConsentRow name="privacy" checked={form.privacy} onChange={handleChange} error={errors.privacy}>
              <span className="font-medium text-slate-800">I have read the Privacy Policy</span>{' '}
              <span className="text-slate-400">—</span>{' '}
              <Link
                href="#"
                onClick={(e) => e.stopPropagation()}
                className="font-semibold text-[#2563EB] hover:text-[#1d4ed8] hover:underline"
              >
                Read Policy
              </Link>
            </ConsentRow>

            {/* Product updates (optional) */}
            <ConsentRow name="updates" checked={form.updates} onChange={handleChange}>
              <span className="font-medium text-slate-800">Email me product updates and tips</span>{' '}
              <span className="text-slate-400">(optional). You can unsubscribe anytime.</span>
            </ConsentRow>
          </div>
        )}

        {/* ===== Buttons ===== */}
        <div className={`grid gap-2 ${step > 0 ? 'grid-cols-[96px_minmax(0,1fr)]' : 'grid-cols-1'}`}>
          {step > 0 && (
            <button
              type="button"
              onClick={handleBack}
              className="flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-[#2563EB] hover:bg-blue-50 hover:text-[#2563EB]"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </button>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white shadow-md shadow-blue-600/20 transition-all duration-200 hover:bg-[#1d4ed8] hover:shadow-blue-600/30 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-70"
          >
            <span>{isLast ? (loading ? 'Creating account...' : 'Create account & continue') : 'Next'}</span>
            {!loading && <ArrowRight className="h-4 w-4" />}
          </button>
        </div>

        {/* Sign in link */}
        <p className="text-center text-[10px] leading-relaxed text-slate-500 sm:text-[11px]">
          Already have an account?{' '}
          <Link href="/auth/login" className="font-medium text-[#2563EB] hover:underline">
            Sign in
          </Link>
        </p>

        {/* Trust badges (last step only, keeps other steps compact) */}
        {isLast && (
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-[10px] text-slate-400">
            <span className="flex items-center gap-1">
              <Lock className="h-3 w-3" /> 256-bit encrypted
            </span>
            <span className="flex items-center gap-1">
              <ShieldCheck className="h-3 w-3" /> GDPR &amp; CCPA ready
            </span>
            <span className="flex items-center gap-1">
              <RefreshCw className="h-3 w-3" /> Cancel anytime
            </span>
          </div>
        )}
      </form>
    </div>
  )
}