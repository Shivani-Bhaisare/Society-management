'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mail, ArrowLeft, RotateCcw } from 'lucide-react'

export default function OtpPage() {
  const router = useRouter()
  const [email] = useState('Example@gmail.com')
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', ''])
  const [resendTimer, setResendTimer] = useState(45)
  const inputRefs = useRef<(HTMLInputElement | null)[]>([])

  // Resend countdown timer
  useEffect(() => {
    if (resendTimer > 0) {
      const interval = setInterval(() => {
        setResendTimer((prev) => prev - 1)
      }, 1000)
      return () => clearInterval(interval)
    }
  }, [resendTimer])

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus()
  }, [])

  const handleChange = (index: number, value: string) => {
    // Only accept numeric digit
    const cleaned = value.replace(/[^0-9]/g, '')
    if (!cleaned && value !== '') return

    const newOtp = [...otp]
    newOtp[index] = cleaned.slice(-1) // Take the last character entered
    setOtp(newOtp)

    // Move to next box if digit was entered
    if (cleaned && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        // Current is empty, move back and clear previous
        const newOtp = [...otp]
        newOtp[index - 1] = ''
        setOtp(newOtp)
        inputRefs.current[index - 1]?.focus()
      } else {
        const newOtp = [...otp]
        newOtp[index] = ''
        setOtp(newOtp)
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus()
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus()
    }
  }

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').trim()
    const numericChars = pastedData.replace(/[^0-9]/g, '').slice(0, 6).split('')

    if (numericChars.length > 0) {
      const newOtp = ['', '', '', '', '', '']
      numericChars.forEach((char, idx) => {
        newOtp[idx] = char
      })
      setOtp(newOtp)

      const nextFocusIdx = Math.min(numericChars.length, 5)
      inputRefs.current[nextFocusIdx]?.focus()
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Frontend navigation to reset-password
    router.push('/auth/reset-password')
  }

  const handleResend = () => {
    if (resendTimer === 0) {
      setResendTimer(45)
    }
  }

  return (
    <div className="w-full bg-white rounded-xl sm:rounded-2xl shadow-xl p-5 sm:p-6 border border-slate-100 transition-all duration-300">
      {/* =========================================================
          CARD HEADER
          ========================================================= */}
      <div className="text-left mb-5">
        <h2 className="text-xl sm:text-[22px] font-bold tracking-tight text-slate-900 leading-tight">
          Forgot Password For Society
        </h2>
        <p className="mt-1.5 text-xs sm:text-sm text-slate-500">
          Access Your Society Workspace
        </p>
      </div>

      {/* =========================================================
          FORM
          ========================================================= */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Email display field */}
        <div>
          <label
            htmlFor="otp-email"
            className="block text-xs sm:text-[13px] font-medium text-slate-700 mb-1.5"
          >
            Email address
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Mail className="h-4 w-4" />
            </div>
            <input
              id="otp-email"
              type="email"
              value={email}
              readOnly
              className="block w-full rounded-lg border border-slate-200 bg-slate-100/70 py-2.5 pl-10 pr-3 text-xs sm:text-sm font-medium text-slate-600 select-none cursor-default"
            />
          </div>
        </div>

        {/* OTP Input Section */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="block text-xs sm:text-[13px] font-medium text-slate-700">
              OTP
            </label>
            <span className="text-[11px] sm:text-xs text-slate-500">
              Enter 6-digit code
            </span>
          </div>

          {/* 6 Individual Digit Boxes */}
          <div className="grid grid-cols-6 gap-2">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el
                }}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                className="h-10 sm:h-11 w-full text-center text-base sm:text-lg font-bold text-slate-900 rounded-lg border border-slate-200 bg-slate-50/60 focus:border-[#2563EB] focus:bg-white focus:outline-none focus:ring-3 focus:ring-[#2563EB]/10 transition"
              />
            ))}
          </div>

          {/* Resend Option */}
          <div className="mt-2.5 flex items-center justify-between text-[11px] sm:text-xs text-slate-500">
            <span>Didn&apos;t receive code?</span>
            {resendTimer > 0 ? (
              <span className="font-semibold text-slate-600">
                Resend in {resendTimer}s
              </span>
            ) : (
              <button
                type="button"
                onClick={handleResend}
                className="inline-flex items-center gap-1 font-semibold text-[#2563EB] hover:text-[#1d4ed8] hover:underline cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Resend OTP</span>
              </button>
            )}
          </div>
        </div>

        {/* Action Buttons: Cancel and Change Password */}
        <div className="pt-1 flex flex-col sm:flex-row items-center gap-2.5">
          <Link
            href="/auth/forgot-password"
            className="w-full sm:w-1/2 order-2 sm:order-1 flex items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 py-2.5 px-3 text-xs sm:text-sm font-semibold transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Cancel</span>
          </Link>

          <button
            type="submit"
            className="w-full sm:w-1/2 order-1 sm:order-2 flex items-center justify-center gap-1.5 rounded-lg bg-[#2563EB] hover:bg-[#1d4ed8] text-white py-2.5 px-3 text-xs sm:text-sm font-semibold shadow-md shadow-blue-600/20 hover:shadow-blue-600/30 active:scale-[0.99] transition-all duration-200 cursor-pointer"
          >
            <span>Change Password</span>
          </button>
        </div>
      </form>
    </div>
  )
}
