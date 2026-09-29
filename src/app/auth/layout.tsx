import Image from 'next/image'
import Link from 'next/link'
import { Star, ShieldCheck, Zap, Users, Building, ArrowLeft } from 'lucide-react'

export const metadata = {
  title: 'Society OS - Authentication',
  description: 'Access and manage your modern residential society workspace.',
}

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
<div className="min-h-screen w-full bg-[#021024] flex flex-col lg:flex-row overflow-x-hidden font-sans text-slate-800 antialiased selection:bg-blue-600 selection:text-white relative">

  {/* =========================================================
      TOP-RIGHT BACK TO HOME
      ========================================================= */}
  <div className="fixed top-3 right-3 sm:top-4 sm:right-5 lg:top-5 lg:right-6 z-50">
    <Link
      href="/"
      className="
        group
        inline-flex
        items-center
        gap-1.5
        rounded-full
        border border-white/15
        bg-white/10
        px-3
        py-1.5
        text-[10px]
        sm:text-xs
        font-medium
        text-slate-200
        backdrop-blur-md
        shadow-lg
        transition-all
        duration-200
        hover:border-blue-400/40
        hover:bg-white/20
        hover:text-white
        active:scale-95
      "
    >
      <ArrowLeft
        className="
          h-3.5
          w-3.5
          text-slate-300
          transition-transform
          duration-200
          group-hover:-translate-x-0.5
          group-hover:text-blue-400
        "
      />

      <span>
        Back to Home
      </span>
    </Link>
  </div>


  {/* =========================================================
      LEFT AUTH PANEL
      ========================================================= */}
  <div
    className="
      w-full
      lg:w-[42%]
      xl:w-[40%]
      flex
      flex-col
      justify-between
      px-4
      py-4
      sm:px-6
      sm:py-5
      lg:px-7
      lg:py-6
      xl:px-8
      xl:py-7
      min-h-screen
      relative
      z-10
      bg-[#021024]
    "
  >

    {/* =======================================================
        HEADER
        ======================================================= */}
    <header className="flex items-center">

      <Link
        href="/"
        className="
          group
          flex
          items-center
          gap-2
          transition-transform
          duration-200
          hover:scale-[1.01]
          focus:outline-none
        "
      >

        {/* Logo */}
        <div
          className="
            relative
            flex
            h-8
            w-8
            items-center
            justify-center
            rounded-lg
            bg-white/10
            p-1
            backdrop-blur-md
            border
            border-white/15
            shadow-inner
            transition
            group-hover:bg-white/20
          "
        >
          <Image
            src="/logo (2).png"
            alt="Society OS"
            width={27}
            height={27}
            className="object-contain"
            priority
          />
        </div>

        {/* Brand */}
        <span
          className="
            text-base
            sm:text-lg
            font-bold
            tracking-tight
            text-white
          "
        >
          Society OS
        </span>

      </Link>

    </header>


    {/* =======================================================
        AUTH FORM
        ======================================================= */}
    <main
      className="
        my-auto
        py-4
        sm:py-5
        flex
        flex-col
        items-center
        justify-center
        w-full
      "
    >

      <div className="w-full max-w-[390px]">

        {children}

      </div>

    </main>


    {/* =======================================================
        SMALL FOOTER
        ======================================================= */}
    <div className="h-1" />

  </div>


  {/* =========================================================
      RIGHT HERO PANEL
      ========================================================= */}
  <div
    className="
      relative
      hidden
      lg:flex
      lg:w-[58%]
      xl:w-[60%]
      flex-col
      justify-between
      px-7
      py-7
      xl:px-9
      xl:py-8
      min-h-screen
      overflow-hidden
      bg-[#021329]
      select-none
    "
  >

    {/* =======================================================
        BACKGROUND IMAGE
        ======================================================= */}
    <Image
      src="/loginbg.png"
      alt="Society OS Community"
      fill
      priority
      sizes="(max-width: 1024px) 100vw, 60vw"
      className="object-cover object-center"
    />


    {/* =======================================================
        DARK OVERLAY
        ======================================================= */}
    <div className="absolute inset-0 bg-gradient-to-r from-[#021024] via-[#021024]/70 to-[#021024]/35" />

    <div className="absolute inset-0 bg-gradient-to-t from-[#021024]/90 via-transparent to-[#021024]/35" />


    {/* =======================================================
        AMBIENT LIGHT
        ======================================================= */}
    <div
      className="
        absolute
        -top-14
        -right-24
        w-64
        h-64
        bg-blue-600/15
        rounded-full
        blur-3xl
        pointer-events-none
      "
    />

    <div
      className="
        absolute
        -bottom-20
        right-1/4
        w-56
        h-56
        bg-cyan-500/10
        rounded-full
        blur-3xl
        pointer-events-none
      "
    />


    {/* =======================================================
        HERO CONTENT
        ======================================================= */}
    <div
      className="
        relative
        z-10
        max-w-md
        my-auto
        py-4
      "
    >

      {/* Welcome Badge */}
      <div
        className="
          inline-flex
          text-[9px]
          sm:text-[10px]
          font-semibold
          uppercase
          tracking-[0.16em]
          text-[#60A5FA]
          mb-2.5
          bg-blue-500/10
          px-2.5
          py-1
          rounded-md
          border
          border-blue-400/20
        "
      >
        Welcome Back
      </div>


      {/* Main Heading */}
      <h1
        className="
          text-3xl
          lg:text-[34px]
          xl:text-[40px]
          font-semibold
          tracking-tight
          text-white
          leading-[1.08]
        "
      >
        Your Society in
        <br />

        <span
          className="
            text-transparent
            bg-clip-text
            bg-gradient-to-r
            from-[#3B82F6]
            via-[#60A5FA]
            to-[#93C5FD]
          "
        >
          Good Hands.
        </span>
      </h1>


      {/* Description */}
      <p
        className="
          mt-2.5
          text-xs
          lg:text-[13px]
          leading-relaxed
          text-slate-200/85
          max-w-sm
        "
      >
        Society OS gives our committee a clear view of what matters,
        without the spreadsheet chaos.
      </p>

    </div>


    {/* =======================================================
        TESTIMONIAL
        ======================================================= */}
  <div
  className="
    absolute
    left-6
    right-6
    bottom-6
    xl:left-8
    xl:right-8
    xl:bottom-8
  "
>
  <div className="relative z-10 w-full max-w-2xl">
    <div className="relative pl-3.5 sm:pl-4">

      {/* Vertical Line */}
      <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-white/80" />

      {/* Quote */}
      <div
        className="
          mb-2
          text-[30px]
          sm:text-[36px]
          leading-[0.5]
          font-serif
          font-semibold
          text-white
        "
      >
        ❝
      </div>

      {/* Testimonial */}
      <p
        className="
          max-w-xl
          text-[16px]
          sm:text-[18px]
          lg:text-[20px]
          font-medium
          leading-[1.4]
          tracking-[-0.015em]
          text-white
        "
      >
        Society OS gives our committee a clear view of what matters,
        without the spreadsheet chaos.
      </p>

      {/* Committee Members */}
      <div className="mt-3.5 flex items-center gap-2.5">

        {/* Avatars */}
        <div className="flex items-center -space-x-2">
          <div className="h-7 w-7 overflow-hidden rounded-full border-2 border-white/90 bg-slate-700 shadow-sm">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80"
              alt="Committee Member 1"
              className="h-full w-full object-cover"
            />
          </div>

          <div className="h-7 w-7 overflow-hidden rounded-full border-2 border-white/90 bg-slate-700 shadow-sm">
            <img
              src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80"
              alt="Committee Member 2"
              className="h-full w-full object-cover"
            />
          </div>

          <div className="h-7 w-7 overflow-hidden rounded-full border-2 border-white/90 bg-slate-700 shadow-sm">
            <img
              src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=120&auto=format&fit=crop&q=80"
              alt="Committee Member 3"
              className="h-full w-full object-cover"
            />
          </div>
        </div>

        {/* Separator */}
        <span className="h-px w-2.5 bg-white/80" />

        {/* Label */}
        <span
          className="
            text-[15px]
            sm:text-[17px]
            lg:text-[18px]
            font-medium
            tracking-[-0.01em]
            text-white
          "
        >
          Committee Members
        </span>

      </div>
    </div>
  </div>
</div>

  </div>

</div>
  )
}
