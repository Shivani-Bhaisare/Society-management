import {
  LayoutDashboard, Building2, Users, UsersRound, Landmark, Receipt,
  CreditCard, ShieldCheck, ParkingCircle, MessageSquareWarning,
  Sparkles, UserCheck,
  Megaphone, CalendarDays, FileText, Wallet,
  type LucideIcon,
} from 'lucide-react'

export type Role = 'president' | 'secretary' | 'treasurer'

type NavLink = { href: string; label: string; icon: LucideIcon }

export const roleMenus: Record<Role, NavLink[]> = {
  president: [
    { href: '/president/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/president/society-master', label: 'Society Master', icon: Building2 },
    { href: '/president/residents', label: 'Residents', icon: Users },
    { href: '/president/committee', label: 'Committee', icon: UsersRound },
    { href: '/president/finance', label: 'Finance & Accounting', icon: Landmark },
    { href: '/president/billing', label: 'Maintenance & Billing', icon: Receipt },
    { href: '/president/payments', label: 'Payments', icon: CreditCard },
    { href: '/president/visitors', label: 'Visitors & Security', icon: ShieldCheck },
    { href: '/president/parking', label: 'Parking', icon: ParkingCircle },
    { href: '/president/complaints', label: 'Complaints', icon: MessageSquareWarning },
    { href: '/president/amenities', label: 'Amenities', icon: Sparkles },
    { href: '/president/staff', label: 'Staff', icon: UserCheck },
  ],
  secretary: [
    { href: '/secretary/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/secretary/notices', label: 'Notices', icon: Megaphone },
    { href: '/secretary/meetings', label: 'Meetings', icon: CalendarDays },
    { href: '/secretary/documents', label: 'Documents', icon: FileText },
  ],
  treasurer: [
    { href: '/treasurer/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/treasurer/billing', label: 'Billing', icon: Receipt },
    { href: '/treasurer/payments', label: 'Payments', icon: CreditCard },
    { href: '/treasurer/expenses', label: 'Expenses', icon: Wallet },
  ],
}