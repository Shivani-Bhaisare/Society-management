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
  // TREASURER (names as per the design screens 30 to 42)
  // =========================
 treasurer: [
    {
      href: "/treasurer/dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
    },
    {
      href: "/treasurer/maintenance-bills",
      label: "Maintenance-bills",
      icon: Wrench,
    },
    {
  href: "/treasurer/multiple-charge-heads",
  label: "Multiple Charge Heads",
  icon: ReceiptText,
},
{
  href: "/treasurer/general-ledger",
  label: "General Ledger",
  icon: BookOpen,
},
{
  href: "/treasurer/accounts-receivable",
  label: "Accounts Receivable",
  icon: Wallet,
},
{
  href: "/treasurer/accounts-payable",
  label: "Accounts Payable",
  icon: CreditCard,
},
{
  href: "/treasurer/vendor-bills",
  label: "Vendor Bill Management",
  icon: Store,
},
{
  href: "/treasurer/late-fee-rules",
  label: "Late Fee Rules",
  icon: Gavel,
},
{
  href: "/treasurer/bank-reconciliation",
  label: "Bank Reconciliation",
  icon: Landmark,
},
{
  href: "/treasurer/income-expense",
  label: "Income / Expense",
  icon: BarChart3,
},
{
  href: "/treasurer/audit-reports",
  label: "Audit Reports",
  icon: FileText,
},
{
  href: "/treasurer/gst-tax",
  label: "GST / Tax Support",
  icon: Calculator,
},
{
  href: "/treasurer/sinking-fund",
  label: "Sinking / Reserve Funds",
  icon: PiggyBank,
},
  ]
};