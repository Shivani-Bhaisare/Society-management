import {
  LayoutDashboard,
  Building2,
  Users,
  UsersRound,
  Landmark,
  Receipt,
  CreditCard,
  ShieldCheck,
  ParkingCircle,
  MessageSquareWarning,
  Sparkles,
  UserCheck,
  Megaphone,
  CalendarDays,
  FileText,
  Wallet,
  ListChecks,
  Gavel,
  Vote,
  Send,
  Dumbbell,
  Store,
  BarChart3,
  Bot,
  Wrench,
  ReceiptText,
  Calculator,
  // Icons used by the treasurer menu
  BookOpen,
  PieChart,
  PiggyBank,
  ClipboardCheck,
  type LucideIcon,
} from "lucide-react";

export type Role = "president" | "secretary" | "treasurer";

type NavLink = {
  href: string;
  label: string;
  icon: LucideIcon;
  // Optional small text shown under the label (used by the treasurer menu)
  desc?: string;
};

export const roleMenus: Record<Role, NavLink[]> = {
  // =========================
  // PRESIDENT
  // =========================
  president: [
    {
      href: "/president/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      href: "/president/society-master",
      label: "Society Master",
      icon: Building2,
    },
    {
      href: "/president/residents",
      label: "Residents",
      icon: Users,
    },
    {
      href: "/president/committee",
      label: "Committee",
      icon: UsersRound,
    },
    {
      href: "/president/finance",
      label: "Finance & Accounting",
      icon: Landmark,
    },
    {
      href: "/president/billing",
      label: "Maintenance & Billing",
      icon: Receipt,
    },
    {
      href: "/president/payments",
      label: "Payments",
      icon: CreditCard,
    },
    {
      href: "/president/visitors",
      label: "Visitors & Security",
      icon: ShieldCheck,
    },
    {
      href: "/president/parking",
      label: "Parking",
      icon: ParkingCircle,
    },
    {
      href: "/president/complaints",
      label: "Complaints",
      icon: MessageSquareWarning,
    },
    {
      href: "/president/amenities",
      label: "Amenities",
      icon: Sparkles,
    },
    {
      href: "/president/staff",
      label: "Staff",
      icon: UserCheck,
    },
  ],

  // =========================
  // SECRETARY
  // =========================
  secretary: [
    {
      href: "/secretary/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      href: "/secretary/society",
      label: "Society",
      icon: Building2,
    },
    {
      href: "/secretary/residents",
      label: "Residents",
      icon: Users,
    },
    {
      href: "/secretary/committee",
      label: "Committee",
      icon: UsersRound,
    },
    {
      href: "/secretary/meetings",
      label: "Meetings",
      icon: CalendarDays,
    },
    {
      href: "/secretary/agenda",
      label: "Agenda",
      icon: ListChecks,
    },
    {
      href: "/secretary/resolutions",
      label: "Resolutions",
      icon: Gavel,
    },
    {
      href: "/secretary/voting",
      label: "Voting",
      icon: Vote,
    },
    {
      href: "/secretary/notices",
      label: "Notices",
      icon: Megaphone,
    },
    {
      href: "/secretary/communication",
      label: "Communication",
      icon: Send,
    },
    {
      href: "/secretary/complaints",
      label: "Complaints",
      icon: MessageSquareWarning,
    },
    {
      href: "/secretary/facilities",
      label: "Facilities",
      icon: Dumbbell,
    },
    {
      href: "/secretary/assets-maintenance",
      label: "Assets & Maintenance",
      icon: Wrench,
    },
    {
      href: "/secretary/staff",
      label: "Staff",
      icon: UserCheck,
    },
    {
      href: "/secretary/vendors",
      label: "Vendors",
      icon: Store,
    },
    {
      href: "/secretary/security-gate",
      label: "Security / Gate",
      icon: ShieldCheck,
    },
    {
      href: "/secretary/maintenance-billing",
      label: "Maintenance & Billing",
      icon: ReceiptText,
    },
    {
      href: "/secretary/accounting",
      label: "Accounting",
      icon: Calculator,
    },
    {
      href: "/secretary/documents",
      label: "Documents",
      icon: FileText,
    },
    {
      href: "/secretary/reports",
      label: "Reports",
      icon: BarChart3,
    },
    {
      href: "/secretary/ai-assistant",
      label: "AI Assistant",
      icon: Bot,
    },
  ],

  // =========================
  // TREASURER (same order, names and icons as the design)
  // =========================
  treasurer: [
    {
      href: "/treasurer/dashboard",
      label: "Dashboard",
      desc: "Overall financial summary",
      icon: LayoutDashboard,
    },
    {
      href: "/treasurer/maintenance-collection",
      label: "Maintenance Collection",
      desc: "Monthly bills, collections and dues",
      icon: Receipt,
    },
    {
      href: "/treasurer/income",
      label: "Income",
      desc: "All society income sources",
      icon: Wallet,
    },
    {
      href: "/treasurer/expenses",
      label: "Expenses",
      desc: "Expenses, bills and payments made",
      icon: CreditCard,
    },
    {
      href: "/treasurer/invoices-bills",
      label: "Invoices & Bills",
      desc: "Generate and manage invoices",
      icon: FileText,
    },
    {
      href: "/treasurer/payments",
      label: "Payments & Bank Transactions",
      desc: "Payment history and bank reconciliation",
      icon: Landmark,
    },
    {
      href: "/treasurer/accounting-ledger",
      label: "Accounting & Ledger",
      desc: "Ledger, journal, cash book and bank book",
      icon: BookOpen,
    },
    {
      href: "/treasurer/budget",
      label: "Budget Management",
      desc: "Planned vs actual budget",
      icon: BarChart3,
    },
    {
      href: "/treasurer/funds",
      label: "Funds & Reserves",
      desc: "Sinking fund, repair fund and reserve fund",
      icon: PiggyBank,
    },
    {
      href: "/treasurer/expense-approval",
      label: "Expense Approvals",
      desc: "Approve or reject expenses",
      icon: ClipboardCheck,
    },
    {
      href: "/treasurer/defaulters",
      label: "Defaulters & Outstanding",
      desc: "Overdue flats and pending dues",
      icon: Users,
    },
    {
      href: "/treasurer/financial-reports",
      label: "Financial Reports & Audit",
      desc: "Financial statements and audit reports",
      icon: PieChart,
    },
  ],
};