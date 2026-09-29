'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Mail, ArrowRight, ArrowLeft } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const router = useRouter()

  const handleSendOtp = (e: React.FormEvent) => {
    e.preventDefault()
    // Frontend navigation only
    router.push('/auth/otp')
  }

  return (
  <div className="w-full bg-white rounded-xl sm:rounded-2xl shadow-xl p-5 sm:p-6 border border-slate-100 transition-all duration-300">

  {/* Card Header */}
  <div className="text-left mb-5">
    <h2 className="text-lg sm:text-[15px] font-bold tracking-tight text-slate-900 leading-tight">
      Forgot Password For Society
    </h2>

    <p className="mt-1.5 text-xs sm:text-sm text-slate-500">
      Access Your Society Workspace
    </p>
  </div>


  {/* Form */}
  <form onSubmit={handleSendOtp} className="space-y-4">

    {/* Email Address */}
    <div>
      <label
        htmlFor="forgot-email"
        className="block text-xs sm:text-[13px] font-medium text-slate-700 mb-1.5"
      >
        Email address
      </label>

      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
          <Mail className="h-4 w-4" />
        </div>

        <input
          id="forgot-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Example@gmail.com"
          required
          className="
            block w-full
            rounded-lg
            border border-slate-200
            bg-slate-50/60
            py-2.5 pl-10 pr-3
            text-xs sm:text-sm
            text-slate-900
            placeholder:text-slate-400
            focus:border-[#2563EB]
            focus:bg-white
            focus:outline-none
            focus:ring-2
            focus:ring-[#2563EB]/10
            transition
          "
        />
      </div>

      <p className="mt-2 text-[10px] sm:text-[11px] text-slate-500 leading-relaxed">
        We will send a 6-digit verification code to this email
        to reset your society account password.
      </p>
    </div>


    {/* Send OTP */}
    <button
      type="submit"
      className="
        w-full
        flex items-center justify-center gap-1.5
        rounded-lg
        bg-[#2563EB]
        hover:bg-[#1d4ed8]
        text-white
        py-2.5 px-4
        text-sm font-semibold
        shadow-md shadow-blue-600/20
        hover:shadow-blue-600/30
        active:scale-[0.99]
        transition-all duration-200
        cursor-pointer
      "
    >
      <span>Send OTP</span>
      <ArrowRight className="w-4 h-4" />
    </button>


    {/* Back to Login */}
    <div className="pt-1 text-center">
      <Link
        href="/auth/login"
        className="
          inline-flex items-center gap-1.5
          text-xs sm:text-[13px]
          font-semibold
          text-slate-600
          hover:text-[#2563EB]
          transition-colors
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
