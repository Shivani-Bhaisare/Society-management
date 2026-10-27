"use client";

import { useMemo, useState } from "react";
import { motion, type Variants } from "framer-motion";
import {
  FileText,
  Clock,
  CheckCircle2,
  Wallet,
  Plus,
  Search,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { Card, Badge } from "@/Components/ui";
// CHANGED: drawer import (router import removed, not needed anymore)
import AddVendorBillModal, { type AddVendorBillPayload } from "@/Components/AddVendorBillModal";

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
    label: "Total Bills",
    value: "18",
    sub: "All vendor invoices",
    subC: "text-slate-400",
    icon: FileText,
    c: "#3B82F6",
  },
  {
    label: "Pending Approval",
    value: "6",
    sub: "Waiting for review",
    subC: "text-orange-400",
    icon: Clock,
    c: "#F59E0B",
  },
  {
    label: "Approved",
    value: "9",
    sub: "Ready for payment",
    subC: "text-emerald-400",
    icon: CheckCircle2,
    c: "#00C2B8",
  },
  {
    label: "Paid",
    value: "3",
    sub: "Payments completed",
    subC: "text-slate-400",
    icon: Wallet,
    c: "#8B5CF6",
  },
];

// CHANGED: "Draft" added so drafts saved from the drawer can show in the table
type Status = "Pending" | "Approved" | "Under Review" | "Paid" | "Draft";

type VendorBill = {
  id: number; // CHANGED: unique id so new rows never share a key
  invoiceNo: string;
  vendor: string;
  category: string;
  amount: string;
  status: Status;
};

const initialBills: VendorBill[] = [
  { id: 1, invoiceNo: "INV-001", vendor: "ABC Elevator Services", category: "Maintenance", amount: "₹ 12,000", status: "Pending" },
  { id: 2, invoiceNo: "INV-002", vendor: "SkyLine Plumbing", category: "Plumbing", amount: "₹ 8,500", status: "Approved" },
  { id: 3, invoiceNo: "INV-003", vendor: "Power Solutions", category: "Electricity", amount: "₹ 6,800", status: "Under Review" },
  { id: 4, invoiceNo: "INV-004", vendor: "Garden Care", category: "Gardening", amount: "₹ 4,500", status: "Approved" },
  { id: 5, invoiceNo: "INV-005", vendor: "Security Services", category: "Security", amount: "₹ 7,200", status: "Paid" },
];

const statusOptions = ["All Status", "Pending", "Approved", "Under Review", "Paid", "Draft"];

const toneFor = (s: Status) =>
  s === "Paid" || s === "Approved"
    ? "green"
    : s === "Pending"
      ? "orange"
      : "blue";

/* ---------- Shared styles (same as Residents) ---------- */

const th =
  "bg-white/4 px-2 py-2 font-medium first:rounded-l-md last:rounded-r-md";
const td = "border-t border-[#272D39] px-2 py-2.5";
const field =
  "w-full rounded-lg border border-[#272D39] bg-[#10131A] px-3 py-2 text-xs text-slate-200 outline-none placeholder:text-slate-500 focus:border-[#A29CFF]/60";

/* ---------- Page ---------- */
export default function VendorBillsPage() {
  const [bills, setBills] = useState<VendorBill[]>(initialBills); // CHANGED: bills are now state
  const [open, setOpen] = useState(false); // CHANGED: drawer open / close
  const [status, setStatus] = useState(statusOptions[0]);
  const [q, setQ] = useState("");

  // Filter rows by status and search text
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return bills.filter(
      (b) =>
        (status === "All Status" || b.status === status) &&
        (!s || `${b.invoiceNo} ${b.vendor} ${b.category}`.toLowerCase().includes(s)),
    );
  }, [bills, status, q]);

  // CHANGED: add the saved bill to the table (replace with an API call later)
  const handleSave = (data: AddVendorBillPayload) => {
    setBills((prev) => [
      ...prev,
      {
        id: data.id,
        invoiceNo: data.invoiceNo || `INV-${String(prev.length + 1).padStart(3, "0")}`,
        vendor: data.vendor,
        category: data.category || "-",
        amount: `₹ ${data.totalPayable.toLocaleString("en-IN")}`,
        status: data.status,
      },
    ]);
    setStatus("All Status");
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
          <h1 className="text-xl font-bold sm:text-2xl">Vendor Bills</h1>
          <p className="text-xs text-slate-400">
            Upload, verify and approve vendor invoices
          </p>
        </motion.div>

        {/* Add button: opens the drawer on click */}
        <motion.div variants={item}>
          <button
            type="button"
            onClick={() => setOpen(true)} // CHANGED: opens the drawer
            className="flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-linear-to-r from-[#6C63FF] to-[#4DA3FF] px-4 py-2.5 text-xs font-semibold text-white transition hover:opacity-90 active:scale-95"
          >
            <Plus className="h-3.5 w-3.5" /> Add Vendor Bill
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
        className="grid grid-cols-1 gap-2 rounded-xl border border-[#272D39] bg-[#10131A] p-3 min-[480px]:grid-cols-2 lg:grid-cols-[180px_1fr]"
      >
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
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by invoice, vendor, category..."
            className={`${field} pl-9`}
          />
        </div>
      </motion.div>

      {/* Vendor bills table */}
      <motion.div
        variants={item}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
      >
        <Card title="Vendor Invoices" sub={`Total ${list.length} invoices`}>
          {/* Table scrolls sideways on small screens */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-160 text-left text-[11px]">
              <thead className="text-slate-400">
                <tr>
                  <th className={th}>Invoice No.</th>
                  <th className={th}>Vendor</th>
                  <th className={th}>Category</th>
                  <th className={th}>Amount</th>
                  <th className={th}>Status</th>
                  <th className={`${th} text-right`}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.map((b, i) => (
                  <motion.tr
                    key={b.id} // CHANGED: unique id key
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={VIEWPORT}
                    transition={{ duration: 0.5, ease: EASE, delay: i * 0.05 }}
                    className="hover:bg-white/2"
                  >
                    <td className={`${td} font-medium`}>{b.invoiceNo}</td>
                    <td className={`${td} text-slate-300`}>{b.vendor}</td>
                    <td className={`${td} text-slate-400`}>{b.category}</td>
                    <td className={`${td} whitespace-nowrap text-slate-300`}>
                      {b.amount}
                    </td>
                    <td className={td}>
                      <Badge tone={toneFor(b.status)}>{b.status}</Badge>
                    </td>
                    <td className={`${td} text-right`}>
                      <button
                        type="button"
                        aria-label="Actions"
                        className="cursor-pointer rounded-md p-1 text-slate-400 hover:bg-white/5"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </td>
                  </motion.tr>
                ))}

                {list.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className={`${td} py-8 text-center text-slate-500`}
                    >
                      No invoices found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-4 flex flex-col items-center justify-between gap-3 text-[11px] text-slate-400 sm:flex-row">
            <span>Showing 1-{list.length} of 18</span>
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

      {/* CHANGED: Add Vendor Bill drawer */}
      <AddVendorBillModal
        open={open}
        onClose={() => setOpen(false)}
        onSave={handleSave}
      />
    </div>
  );
}