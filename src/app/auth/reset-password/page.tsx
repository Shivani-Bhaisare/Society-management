'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Lock, Eye, EyeOff, CheckCircle2, Circle, ArrowLeft, Check } from 'lucide-react'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  // Validation rules
  const hasMinLength = newPassword.length >= 8
  const hasUppercase = /[A-Z]/.test(newPassword)
  const hasLowercase = /[a-z]/.test(newPassword)
  const hasNumber = /[0-9]/.test(newPassword)
  const hasSpecialChar = /[^A-Za-z0-9]/.test(newPassword)
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!newPassword) {
      setErrorMessage('Password cannot be empty.')
      return
    }

    if (newPassword.length < 8) {
      setErrorMessage('Password should contain at least 8 characters.')
      return
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('Confirm password must match.')
      return
    }

    setErrorMessage('')
    setIsSuccess(true)
  }

  if (isSuccess) {
    return (
      <div className="w-full bg-white rounded-xl sm:rounded-2xl shadow-xl p-5 sm:p-6 border border-slate-100 text-center transition-all duration-300">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 mb-3 border border-emerald-100">
          <Check className="h-6 w-6 stroke-[2.5]" />
        </div>
        <h2 className="text-xl sm:text-[22px] font-bold tracking-tight text-slate-900 leading-tight">
          Password Reset Successful!
        </h2>
        <p className="mt-1.5 text-xs sm:text-sm text-slate-600 max-w-sm mx-auto leading-relaxed">
          Your Society OS password has been updated securely. You can now login with your new credentials.
        </p>

        <button
          type="button"
          onClick={() => router.push('/auth/login')}
          className="w-full mt-5 flex items-center justify-center gap-1.5 rounded-lg bg-[#2563EB] hover:bg-[#1d4ed8] text-white py-2.5 px-4 text-sm font-semibold shadow-md shadow-blue-600/20 hover:shadow-blue-600/30 active:scale-[0.99] transition-all duration-200 cursor-pointer"
        >
          <span>Continue to Login</span>
        </button>
      </div>
    )
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

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Error Alert */}
        {errorMessage && (
          <div className="rounded-lg bg-rose-50 border border-rose-200 p-2.5 text-xs text-rose-700 font-medium">
            {errorMessage}
          </div>
        )}

        {/* New Password Field */}
        <div>
          <label
            htmlFor="new-password"
            className="block text-xs sm:text-[13px] font-medium text-slate-700 mb-1.5"
          >
            New Password
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Lock className="h-4 w-4" />
            </div>
            <input
              id="new-password"
              type={showNewPassword ? 'text' : 'password'}
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value)
                if (errorMessage) setErrorMessage('')
              }}
              placeholder="••••••••"
              required
              className="
                block
                w-full
                rounded-lg
                border
                border-slate-200
                bg-slate-50/60
                py-2.5
                pl-10
                pr-10
                text-xs
                sm:text-sm
                text-slate-900
                placeholder:text-slate-400
                focus:border-[#2563EB]
                focus:bg-white
                focus:outline-none
                focus:ring-3
                focus:ring-[#2563EB]/10
                transition
              "
            />
            <button
              type="button"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 focus:outline-none transition cursor-pointer"
              aria-label={showNewPassword ? 'Hide password' : 'Show password'}
            >
              {showNewPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Confirm Password Field */}
        <div>
          <label
            htmlFor="confirm-password"
            className="block text-xs sm:text-[13px] font-medium text-slate-700 mb-1.5"
          >
            Confirm Password
          </label>
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
              <Lock className="h-4 w-4" />
            </div>
            <input
              id="confirm-password"
              type={showConfirmPassword ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value)
                if (errorMessage) setErrorMessage('')
              }}
              placeholder="••••••••"
              required
              className="
                block
                w-full
                rounded-lg
                border
                border-slate-200
                bg-slate-50/60
                py-2.5
                pl-10
                pr-10
                text-xs
                sm:text-sm
                text-slate-900
                placeholder:text-slate-400
                focus:border-[#2563EB]
                focus:bg-white
                focus:outline-none
                focus:ring-3
                focus:ring-[#2563EB]/10
                transition
              "
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 focus:outline-none transition cursor-pointer"
              aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
            >
              {showConfirmPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>

        {/* Live Requirement Checklist */}
        <div className="bg-slate-50/80 rounded-lg p-3 border border-slate-200/70 space-y-1.5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-1.5">
            Password Requirements:
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-xs">
            <div className={`flex items-center gap-1.5 ${hasMinLength ? 'text-emerald-600 font-medium' : 'text-slate-500'}`}>
              {hasMinLength ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              ) : (
                <Circle className="w-3.5 h-3.5 text-slate-300 shrink-0" />
              )}
              <span>8+ characters</span>
            </div>

            <div className={`flex items-center gap-1.5 ${hasUppercase ? 'text-emerald-600 font-medium' : 'text-slate-500'}`}>
              {hasUppercase ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              ) : (
                <Circle className="w-3.5 h-3.5 text-slate-300 shrink-0" />
              )}
              <span>One uppercase</span>
            </div>

            <div className={`flex items-center gap-1.5 ${hasLowercase ? 'text-emerald-600 font-medium' : 'text-slate-500'}`}>
              {hasLowercase ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              ) : (
                <Circle className="w-3.5 h-3.5 text-slate-300 shrink-0" />
              )}
              <span>One lowercase</span>
            </div>

            <div className={`flex items-center gap-1.5 ${hasNumber ? 'text-emerald-600 font-medium' : 'text-slate-500'}`}>
              {hasNumber ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              ) : (
                <Circle className="w-3.5 h-3.5 text-slate-300 shrink-0" />
              )}
              <span>One number</span>
            </div>

            <div className={`flex items-center gap-1.5 ${hasSpecialChar ? 'text-emerald-600 font-medium' : 'text-slate-500'}`}>
              {hasSpecialChar ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              ) : (
                <Circle className="w-3.5 h-3.5 text-slate-300 shrink-0" />
              )}
              <span>One special character</span>
            </div>

            <div className={`flex items-center gap-1.5 ${passwordsMatch ? 'text-emerald-600 font-medium' : 'text-slate-500'}`}>
              {passwordsMatch ? (
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              ) : (
                <Circle className="w-3.5 h-3.5 text-slate-300 shrink-0" />
              )}
              <span>Passwords match</span>
            </div>
          </div>
        </div>

        {/* Primary Save Button */}
        <button
          type="submit"
          className="
            w-full
            mt-1
            flex
            items-center
            justify-center
            gap-1.5
            rounded-lg
            bg-[#2563EB]
            hover:bg-[#1d4ed8]
            text-white
            py-2.5
            px-4
            text-sm
            font-semibold
            shadow-md
            shadow-blue-600/20
            hover:shadow-blue-600/30
            active:scale-[0.99]
            transition-all
            duration-200
            cursor-pointer
          "
        >
          <span>Save</span>
        </button>

        {/* Back Link */}
        <div className="pt-1.5 text-center">
          <Link
            href="/auth/login"
            className="
              inline-flex
              items-center
              gap-1.5
              text-xs
              sm:text-[13px]
              font-semibold
              text-slate-600
              hover:text-[#2563EB]
              transition
            "
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Login</span>
          </Link>
        </div>
      </form>
    </div>
  )
}
