import Image from 'next/image'
import Link from 'next/link'
import Button from '@/src/Components/Button'

const links = ['Home', 'Platform', 'Solutions', 'For Residents', 'For Management', 'Resources']

const Navbar = () => {
  return (
    <nav className="absolute top-0 left-0 z-20 w-full">
      <div className="mx-auto flex h-24 max-w-[1440px] items-center justify-between px-10">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2">
          <Image src="/logo (2).png" alt="Society OS" width={36} height={36} />
          <span className="text-xl font-semibold text-white">Society OS</span>
        </Link>

        {/* Links */}
        <ul className="hidden items-center gap-8 lg:flex">
          {links.map((item) => (
            <li key={item}>
              <Link href="#" className="text-sm text-white/80 hover:text-white">
                {item}
              </Link>
            </li>
          ))}
        </ul>

        {/* Right side */}
        <div className="flex items-center gap-5">
          <Link href="#" className="text-sm text-white/80 hover:text-white">
            Login
          </Link>
          <Button href="#">Book a Demo</Button>
        </div>
      </div>
    </nav>
  )
}

export default Navbar