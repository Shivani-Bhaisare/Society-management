"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import {
  Wallet,
  AlertCircle,
  CalendarClock,
  CheckCircle2,
  Search,
  Calendar,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
} from "lucide-react";
import { Card, Badge } from "@/Components/ui";
import RecordPaymentModal, {
  type RecordPaymentPayload,
} from "@/Components/RecordPaymentModal";

/* ---------- Animation ---------- */

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const VIEWPORT = { once: false, amount: 0.15 };

const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
};

const item: Variants = {
  hidden: { opacity: 0, y: 30, scale: 0.97 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.7, ease: EASE },
  },
};

/* ---------- Data (replace with API data later) ---------- */

const stats = [
  {
    label: "Total Payable",
    value: "₹ 3,45,000",
    sub: "Owed to all vendors",
    subC: "text-slate-400",
    icon: Wallet,
    c: "#3B82F6",
  },
  {
    label: "Overdue",
    value: "₹ 1,20,000",
    sub: "Past due date",
    subC: "text-red-400",
    icon: AlertCircle,
    c: "#EF4444",
  },
  {
    label: "Due Soon",
    value: "₹ 75,000",
    sub: "Payable in the next 7 days",
    subC: "text-slate-400",
    icon: CalendarClock,
    c: "#F59E0B",
  },
  {
    label: "Paid This Month",
    value: "₹ 1,50,000",
    sub: "Payments completed",
    subC: "text-emerald-400",
    icon: CheckCircle2,
    c: "#00C2B8",
  },
];

type Status = "Pending" | "Overdue" | "Approved" | "Partially Paid" | "Paid";

type Payable = {
  vendor: string;
  invoiceNo: string;
  billDate: string;
  dueDate: string;
  amount: string;
  balance: string;
  status: Status;
};

const initialPayables: Payable[] = [
  { vendor: "ABC Elevator Services", invoiceNo: "V-001", billDate: "01 Oct 2025", dueDate: "10 Oct 2025", amount: "₹ 12,000", balance: "₹ 12,000", status: "Pending" },
  { vendor: "SkyLine Plumbing", invoiceNo: "V-002", billDate: "05 Oct 2025", dueDate: "15 Oct 2025", amount: "₹ 8,500", balance: "₹ 8,500", status: "Overdue" },
  { vendor: "Power Solutions", invoiceNo: "V-003", billDate: "10 Oct 2025", dueDate: "20 Oct 2025", amount: "₹ 6,800", balance: "₹ 6,800", status: "Pending" },
  { vendor: "Garden Care", invoiceNo: "V-004", billDate: "12 Oct 2025", dueDate: "22 Oct 2025", amount: "₹ 4,500", balance: "₹ 4,500", status: "Approved" },
  { vendor: "Security Services", invoiceNo: "V-005", billDate: "15 Oct 2025", dueDate: "25 Oct 2025", amount: "₹ 7,200", balance: "₹ 0", status: "Paid" },
];

const vendorOptions = [
  "All Vendors",
  "ABC Elevator Services",
  "SkyLine Plumbing",
  "Power Solutions",
  "Garden Care",
  "Security Services",
];
const statusOptions = ["All Status", "Pending", "Overdue", "Approved", "Partially Paid", "Paid"];
const dateRanges = [
  "01 Oct 2025 - 31 Oct 2025",
  "01 Sep 2025 - 30 Sep 2025",
  "01 Aug 2025 - 31 Aug 2025",
];

const toneFor = (s: Status) =>
  s === "Paid" || s === "Approved"
    ? "green"
    : s === "Overdue"
      ? "red"
      : "orange";

/* ---------- Money helpers ---------- */

// "₹ 12,000" -> 12000
const toNumber = (v: string) => Number(v.replace(/[^\d.]/g, "")) || 0;

// 12000 -> "₹ 12,000" (Indian number format)
const toMoney = (n: number) => `₹ ${n.toLocaleString("en-IN")}`;

/* ---------- Shared styles (same as Residents) ---------- */

const th =
  "bg-white/4 px-2 py-2 font-medium first:rounded-l-md last:rounded-r-md";
const td = "border-t border-[#272D39] px-2 py-2.5";
const field =
  "w-full rounded-lg border border-[#272D39] bg-[#10131A] px-3 py-2 text-xs text-slate-200 outline-none placeholder:text-slate-500 focus:border-[#A29CFF]/60";

/* ---------- View Bill popup (small, centered) ---------- */

// One detail row (label on the left, value on the right).
// Defined outside the popup so it is not re-created on every render.
function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-[#272D39] py-2 text-[11px] first:border-t-0">
      <span className="text-slate-400">{label}</span>
      <span className="text-right font-medium text-slate-200">{value}</span>
    </div>
  );
}

type ViewBillDrawerProps = {
  bill: Payable;
  onClose: () => void;
};

function ViewBillDrawer({ bill, onClose }: ViewBillDrawerProps) {
  const total = toNumber(bill.amount);
  const balance = toNumber(bill.balance);
  const paid = Math.max(total - balance, 0);
  const percent = total > 0 ? Math.round((paid / total) * 100) : 0;

  // Close on Esc + lock page scroll while the popup is open
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
      className="fixed inset-0 z-70 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
    >
      <motion.div
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.96 }}
        transition={{ duration: 0.3, ease: EASE }}
        className="max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-xl border border-[#272D39] bg-[#10131A] p-4 text-white shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-sm font-bold">Bill Details</h2>
            <p className="truncate text-[11px] text-slate-400">
              {bill.vendor} · {bill.invoiceNo}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="cursor-pointer rounded-md p-1.5 text-slate-400 hover:bg-white/5 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Status */}
        <div className="mt-3 flex items-center justify-between rounded-lg border border-[#272D39] bg-white/3 px-3 py-2">
          <span className="text-[11px] text-slate-400">Status</span>
          <Badge tone={toneFor(bill.status)}>{bill.status}</Badge>
        </div>

        {/* Amount summary */}
        <div className="mt-2 grid grid-cols-3 gap-2 rounded-lg border border-[#272D39] bg-white/3 p-3 text-[11px]">
          <div>
            <p className="text-slate-400">Total</p>
            <p className="mt-0.5 font-semibold">{bill.amount}</p>
          </div>
          <div>
            <p className="text-slate-400">Paid</p>
            <p className="mt-0.5 font-semibold text-emerald-400">
              {toMoney(paid)}
            </p>
          </div>
          <div>
            <p className="text-slate-400">Balance</p>
            <p
              className={`mt-0.5 font-semibold ${
                balance === 0 ? "text-slate-400" : "text-red-400"
              }`}
            >
              {bill.balance}
            </p>
          </div>
        </div>

        {/* Payment progress */}
        <div className="mt-2 rounded-lg border border-[#272D39] bg-white/3 px-3 py-2.5">
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Payment progress</span>
            <span className="font-semibold">{percent}%</span>
          </div>
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/8">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${percent}%` }}
              transition={{ duration: 0.8, ease: EASE, delay: 0.15 }}
              className="h-full rounded-full bg-linear-to-r from-[#6C63FF] to-[#4DA3FF]"
            />
          </div>
        </div>

        {/* Bill details */}
        <div className="mt-2 rounded-lg border border-[#272D39] bg-white/3 px-3">
          <DetailRow label="Vendor Name" value={bill.vendor} />
          <DetailRow label="Invoice No." value={bill.invoiceNo} />
          <DetailRow label="Bill Date" value={bill.billDate} />
          <DetailRow label="Due Date" value={bill.dueDate} />
        </div>

        {/* Actions */}
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg border border-[#272D39] px-4 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/5 active:scale-95"
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ---------- Page ---------- */
export default function AccountsPayablePage() {
  const [payables, setPayables] = useState<Payable[]>(initialPayables);
  const [open, setOpen] = useState(false);

  // Invoice number of the bill open in the View popup (null = popup closed)
  const [viewInvoice, setViewInvoice] = useState<string | null>(null);

  const [vendor, setVendor] = useState(vendorOptions[0]);
  const [status, setStatus] = useState(statusOptions[0]);
  const [range, setRange] = useState(dateRanges[0]);
  const [q, setQ] = useState("");

  // Filter rows by vendor, status and search text
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return payables.filter(
      (p) =>
        (vendor === "All Vendors" || p.vendor === vendor) &&
        (status === "All Status" || p.status === status) &&
        (!s || `${p.vendor} ${p.invoiceNo}`.toLowerCase().includes(s)),
    );
  }, [payables, vendor, status, q]);

  // Always read the latest data of the bill being viewed
  const viewedBill = payables.find((p) => p.invoiceNo === viewInvoice) ?? null;

  // Update the matching bill after a payment is recorded (replace with an API call later)
  const handleSave = (data: RecordPaymentPayload) => {
    setPayables((prev) =>
      prev.map((p) =>
        p.vendor === data.vendor && p.invoiceNo === data.invoiceNo
          ? {
              ...p,
              balance: `₹ ${data.remainingBalance.toLocaleString("en-IN")}`,
              status: data.remainingBalance === 0 ? "Paid" : "Partially Paid",
            }
          : p,
      ),
    );
  };

  return (
    <div className="mx-auto flex w-full max-w-350 flex-col gap-4">
      {/* Heading */}
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
        className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
      >
        <motion.div variants={item}>
          <h1 className="text-xl font-bold sm:text-2xl">Payables</h1>
          <p className="text-xs text-slate-400">
            Track vendor payments and outstanding bills
          </p>
        </motion.div>

        {/* Record payment button: opens the drawer on click */}
        <motion.div variants={item}>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-linear-to-r from-[#6C63FF] to-[#4DA3FF] px-4 py-2.5 text-xs font-semibold text-white transition hover:opacity-90 active:scale-95"
          >
            Record Payment
          </button>
        </motion.div>
      </motion.div>

      {/* Stat cards (same card size as Residents) */}
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
        className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 lg:grid-cols-4"
      >
        {stats.map(({ label, value, sub, subC, icon: Icon, c }) => (
          <motion.div
            key={label}
            variants={item}
            className="relative overflow-hidden rounded-xl border border-[#272D39] bg-[#10131A] p-4"
          >
            <div className="flex items-center gap-2">
              <span
                className="flex h-8 w-8 items-center justify-center rounded-lg"
                style={{ background: `${c}26`, color: c }}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span className="truncate text-xs font-semibold">{label}</span>
            </div>
            <p className="mt-3 text-2xl font-bold">{value}</p>
            <p className={`mt-1 text-[10px] ${subC}`}>{sub}</p>
            {/* Coloured accent line at the bottom of the card */}
            <span
              className="absolute inset-x-0 bottom-0 h-0.75"
              style={{ background: c }}
            />
          </motion.div>
        ))}
      </motion.div>

      {/* Filters */}
      <motion.div
        variants={item}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
        className="grid grid-cols-1 gap-2 rounded-xl border border-[#272D39] bg-[#10131A] p-3 min-[480px]:grid-cols-2 lg:grid-cols-4"
      >
        <div className="relative">
          <select
            value={vendor}
            onChange={(e) => setVendor(e.target.value)}
            className={`${field} cursor-pointer appearance-none pr-8`}
          >
            {vendorOptions.map((v) => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
        </div>

        <div className="relative">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className={`${field} cursor-pointer appearance-none pr-8`}
          >
            {statusOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
        </div>

        <div className="relative">
          <Calendar className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
          <select
            value={range}
            onChange={(e) => setRange(e.target.value)}
            className={`${field} cursor-pointer appearance-none pl-9 pr-8`}
          >
            {dateRanges.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
        </div>

        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search..."
            className={`${field} pl-9`}
          />
        </div>
      </motion.div>

      {/* Payables table */}
      <motion.div
        variants={item}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
      >
        <Card title="Vendor Bills" sub={`Total ${list.length} bills`}>
          {/* Table scrolls sideways on small screens */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-200 text-left text-[11px]">
              <thead className="text-slate-400">
                <tr>
                  <th className={th}>Vendor Name</th>
                  <th className={th}>Invoice No.</th>
                  <th className={th}>Bill Date</th>
                  <th className={th}>Due Date</th>
                  <th className={th}>Amount</th>
                  <th className={th}>Balance</th>
                  <th className={th}>Status</th>
                  <th className={`${th} text-right`}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.map((p, i) => (
                  <motion.tr
                    key={p.invoiceNo}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={VIEWPORT}
                    transition={{ duration: 0.5, ease: EASE, delay: i * 0.05 }}
                    className="hover:bg-white/2"
                  >
                    <td className={`${td} font-medium`}>{p.vendor}</td>
                    <td className={`${td} text-slate-300`}>{p.invoiceNo}</td>
                    <td className={`${td} whitespace-nowrap text-slate-400`}>
                      {p.billDate}
                    </td>
                    <td className={`${td} whitespace-nowrap text-slate-400`}>
                      {p.dueDate}
                    </td>
                    <td className={`${td} whitespace-nowrap text-slate-300`}>
                      {p.amount}
                    </td>
                    <td
                      className={`${td} whitespace-nowrap font-medium ${
                        p.balance === "₹ 0" ? "text-slate-400" : "text-red-400"
                      }`}
                    >
                      {p.balance}
                    </td>
                    <td className={td}>
                      <Badge tone={toneFor(p.status)}>{p.status}</Badge>
                    </td>
                    <td className={`${td} text-right`}>
                      <button
                        type="button"
                        onClick={() => setViewInvoice(p.invoiceNo)}
                        className="cursor-pointer rounded-md border border-[#272D39] px-3 py-1 text-[10px] font-semibold text-slate-300 transition hover:bg-white/5 active:scale-95"
                      >
                        View
                      </button>
                    </td>
                  </motion.tr>
                ))}

                {list.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className={`${td} py-8 text-center text-slate-500`}
                    >
                      No bills found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-4 flex flex-col items-center justify-between gap-3 text-[11px] text-slate-400 sm:flex-row">
            <span>Showing 1-{list.length} of 16</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Previous"
                className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-[#272D39] hover:bg-white/5"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              {[1, 2, 3, 4, 5].map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`h-7 w-7 cursor-pointer rounded-md border text-[11px] ${
                    p === 1
                      ? "border-transparent bg-linear-to-br from-[#6C63FF] to-[#4DA3FF] font-semibold text-white"
                      : "border-[#272D39] hover:bg-white/5"
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                type="button"
                aria-label="Next"
                className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-[#272D39] hover:bg-white/5"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Record Payment drawer */}
      <RecordPaymentModal
        open={open}
        onClose={() => setOpen(false)}
        onSave={handleSave}
      />

      {/* View Bill popup */}
      <AnimatePresence>
        {viewedBill && (
          <ViewBillDrawer
            key={viewedBill.invoiceNo}
            bill={viewedBill}
            onClose={() => setViewInvoice(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}