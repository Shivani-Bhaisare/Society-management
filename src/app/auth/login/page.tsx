'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Mail, Lock, Eye, EyeOff, CheckCircle2, Circle, ArrowRight } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)

  // Password validation rules
  const hasMinLength = password.length >= 8
  const hasUppercase = /[A-Z]/.test(password)
  const hasLowercase = /[a-z]/.test(password)
  const hasNumber = /[0-9]/.test(password)
  const hasSpecialChar = /[^A-Za-z0-9]/.test(password)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Frontend UI only - no backend logic
  }

  return (
  <div className="w-full bg-white rounded-xl sm:rounded-2xl shadow-xl p-5 sm:p-6 border border-slate-100 transition-all duration-300">

  {/* =========================================================
      CARD HEADER
      ========================================================= */}
  <div className="text-left mb-5">

    <h2 className="text-xl sm:text-[22px] font-bold tracking-tight text-slate-900 leading-tight">
      Login For Society
    </h2>

    <p className="mt-1.5 text-xs sm:text-sm text-slate-500">
      Access Your Society Workspace
    </p>

  </div>


  {/* =========================================================
      LOGIN FORM
      ========================================================= */}
  <form onSubmit={handleSubmit} className="space-y-4">


    {/* =======================================================
        EMAIL
        ======================================================= */}
    <div>

      <label
        htmlFor="email"
        className="block text-xs sm:text-[13px] font-medium text-slate-700 mb-1.5"
      >
        Email address
      </label>

      <div className="relative">

        {/* Email Icon */}
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
          <Mail className="h-4 w-4" />
        </div>

        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Example@gmail.com"
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
            pr-3
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

      </div>

    </div>


    {/* =======================================================
        PASSWORD
        ======================================================= */}
    <div>

      <label
        htmlFor="password"
        className="block text-xs sm:text-[13px] font-medium text-slate-700 mb-1.5"
      >
        Password
      </label>

      <div className="relative">

        {/* Lock Icon */}
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
          <Lock className="h-4 w-4" />
        </div>

        <input
          id="password"
          type={showPassword ? "text" : "password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
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

        {/* Password Visibility */}
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="
            absolute
            inset-y-0
            right-0
            flex
            items-center
            pr-3
            text-slate-400
            hover:text-slate-600
            focus:outline-none
            transition
            cursor-pointer
          "
          aria-label={
            showPassword
              ? "Hide password"
              : "Show password"
          }
        >

          {showPassword ? (
            <EyeOff className="h-4 w-4" />
          ) : (
            <Eye className="h-4 w-4" />
          )}

        </button>

      </div>

    </div>


    {/* =======================================================
        REMEMBER ME + FORGOT PASSWORD
        ======================================================= */}
    <div className="flex items-center justify-between pt-0.5">

      <label className="flex items-center gap-2 cursor-pointer select-none">

        <input
          type="checkbox"
          checked={rememberMe}
          onChange={(e) => setRememberMe(e.target.checked)}
          className="
            h-3.5
            w-3.5
            rounded
            border-slate-300
            text-[#2563EB]
            focus:ring-[#2563EB]/30
            focus:ring-offset-0
            cursor-pointer
            accent-[#2563EB]
          "
        />

        <span className="text-xs sm:text-[13px] font-medium text-slate-600">
          Remember Me
        </span>

      </label>


      <Link
        href="/auth/forgot-password"
        className="
          text-xs
          sm:text-[13px]
          font-semibold
          text-[#2563EB]
          hover:text-[#1d4ed8]
          hover:underline
          transition
        "
      >
        Forgot Password?
      </Link>

    </div>


    {/* =======================================================
        LOGIN BUTTON
        ======================================================= */}
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

      <span>
        Login
      </span>

      <ArrowRight className="w-4 h-4" />

    </button>


    {/* =======================================================
        TERMS & PRIVACY
        ======================================================= */}
    <p className="pt-1 text-center text-[10px] sm:text-[11px] text-slate-500 leading-relaxed">

      By creating an account, you agree to the{" "}

      <Link
        href="#"
        className="font-medium text-[#2563EB] hover:underline"
      >
        Terms of use
      </Link>

      {" "}and{" "}

      <Link
        href="#"
        className="font-medium text-[#2563EB] hover:underline"
      >
        Privacy Policy
      </Link>

      .

    </p>

  </form>

</div>
  )
}
