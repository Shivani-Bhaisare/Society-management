import Link from 'next/link'

type ButtonProps = {
  children: React.ReactNode
  href?: string
  variant?: 'primary' | 'outline'
  className?: string
}

const styles = {
  primary: 'bg-[#2563EB] text-white hover:bg-[#1f57e0]',
  outline: 'border border-white/30 bg-white/5 text-white hover:bg-white/10',
}

const Button = ({
  children,
  href = '#',
  variant = 'primary',
  className = '',
}: ButtonProps) => {
  return (
    <Link
      href={href}
      className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition ${styles[variant]} ${className}`}
    >
      {children}
    </Link>
  )
}

export default Button