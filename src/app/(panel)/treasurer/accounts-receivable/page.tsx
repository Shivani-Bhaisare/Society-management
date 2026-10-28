"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import {
  Wallet,
  AlertCircle,
  CalendarClock,
  TrendingUp,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
  CheckCircle2,
} from "lucide-react";
import { Card, Badge } from "@/Components/ui";

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
    label: "Total Outstanding",
    value: "₹ 2,48,000",
    sub: "Dues from all residents",
    subC: "text-slate-400",
    icon: Wallet,
    c: "#3B82F6",
  },
  {
    label: "Overdue",
    value: "₹ 1,12,000",
    sub: "Past due date",
    subC: "text-red-400",
    icon: AlertCircle,
    c: "#EF4444",
  },
  {
    label: "Due This Month",
    value: "₹ 76,000",
    sub: "Payable this month",
    subC: "text-slate-400",
    icon: CalendarClock,
    c: "#F59E0B",
  },
  {
    label: "Collection Rate",
    value: "87%",
    sub: "Collected so far",
    subC: "text-emerald-400",
    icon: TrendingUp,
    c: "#00C2B8",
  },
];

type Status = "Overdue" | "Paid" | "Partial";

type Receivable = {
  flat: string;
  wing: string;
  resident: string;
  billNo: string;
  billAmount: string;
  paidAmount: string;
  balanceDue: string;
  dueDate: string;
  status: Status;
};

const initialReceivables: Receivable[] = [
  { flat: "A-101", wing: "A", resident: "Rakesh Sharma", billNo: "MB-0001", billAmount: "₹ 3,700", paidAmount: "₹ 2,000", balanceDue: "₹ 1,700", dueDate: "10 Nov 2025", status: "Overdue" },
  { flat: "A-102", wing: "A", resident: "Priya Mehta", billNo: "MB-0002", billAmount: "₹ 3,200", paidAmount: "₹ 3,200", balanceDue: "₹ 0", dueDate: "10 Nov 2025", status: "Paid" },
  { flat: "B-201", wing: "B", resident: "Sandeep Kumar", billNo: "MB-0003", billAmount: "₹ 4,500", paidAmount: "₹ 2,000", balanceDue: "₹ 2,500", dueDate: "10 Nov 2025", status: "Overdue" },
  { flat: "B-202", wing: "B", resident: "Neha Gupta", billNo: "MB-0004", billAmount: "₹ 3,800", paidAmount: "₹ 3,800", balanceDue: "₹ 0", dueDate: "10 Nov 2025", status: "Paid" },
  { flat: "C-101", wing: "C", resident: "Amit Verma", billNo: "MB-0005", billAmount: "₹ 3,100", paidAmount: "₹ 1,400", balanceDue: "₹ 1,700", dueDate: "10 Nov 2025", status: "Partial" },
];

const wingOptions = ["All Wings", "A", "B", "C"];
const statusOptions = ["All Status", "Overdue", "Paid", "Partial"];
const paymentModes = ["Cash", "UPI", "Cheque", "Bank Transfer"];

const toneFor = (s: Status) =>
  s === "Paid" ? "green" : s === "Overdue" ? "red" : "orange";

/* ---------- Money helpers ---------- */

// "₹ 3,700" -> 3700
const toNumber = (v: string) => Number(v.replace(/[^\d.]/g, "")) || 0;

// 3700 -> "₹ 3,700" (Indian number format)
const toMoney = (n: number) => `₹ ${n.toLocaleString("en-IN")}`;

// Today's date as YYYY-MM-DD (for the date input)
const todayISO = () => new Date().toISOString().slice(0, 10);

/* ---------- Shared styles (same as Residents) ---------- */

const th =
  "bg-white/4 px-2 py-2 font-medium first:rounded-l-md last:rounded-r-md";
const td = "border-t border-[#272D39] px-2 py-2.5";
const field =
  "w-full rounded-lg border border-[#272D39] bg-[#10131A] px-3 py-2 text-xs text-slate-200 outline-none placeholder:text-slate-500 focus:border-[#A29CFF]/60";

/* ---------- Collect Payment popup ---------- */

type CollectModalProps = {
  record: Receivable;
  onClose: () => void;
  onSubmit: (amount: number) => void;
};

function CollectModal({ record, onClose, onSubmit }: CollectModalProps) {
  const balance = toNumber(record.balanceDue);

  const [amount, setAmount] = useState(String(balance));
  const [mode, setMode] = useState(paymentModes[0]);
  const [date, setDate] = useState(todayISO());
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = Number(amount);

    if (!value || value <= 0) {
      setError("Please enter a valid amount.");
      return;
    }
    if (value > balance) {
      setError(`Amount cannot be more than the balance due (${toMoney(balance)}).`);
      return;
    }
    onSubmit(value);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
    >
      <motion.form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.96 }}
        transition={{ duration: 0.3, ease: EASE }}
        className="w-full max-w-md rounded-xl border border-[#272D39] bg-[#10131A] p-5 text-white shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-bold">Collect Payment</h2>
            <p className="text-[11px] text-slate-400">
              {record.flat} · {record.resident}
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

        {/* Bill summary */}
        <div className="mt-4 grid grid-cols-3 gap-2 rounded-lg border border-[#272D39] bg-white/3 p-3 text-[11px]">
          <div>
            <p className="text-slate-400">Bill No.</p>
            <p className="mt-0.5 font-semibold">{record.billNo}</p>
          </div>
          <div>
            <p className="text-slate-400">Bill Amount</p>
            <p className="mt-0.5 font-semibold">{record.billAmount}</p>
          </div>
          <div>
            <p className="text-slate-400">Balance Due</p>
            <p className="mt-0.5 font-semibold text-red-400">
              {record.balanceDue}
            </p>
          </div>
        </div>

        {/* Form fields */}
        <div className="mt-4 flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-[11px] text-slate-400">
            Amount (₹)
            <input
              type="number"
              min={1}
              max={balance}
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setError("");
              }}
              className={field}
              autoFocus
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-[11px] text-slate-400">
              Payment Mode
              <div className="relative">
                <select
                  value={mode}
                  onChange={(e) => setMode(e.target.value)}
                  className={`${field} cursor-pointer appearance-none pr-8`}
                >
                  {paymentModes.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
              </div>
            </label>

            <label className="flex flex-col gap-1 text-[11px] text-slate-400">
              Payment Date
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={`${field} scheme-dark`}
              />
            </label>
          </div>

          <label className="flex flex-col gap-1 text-[11px] text-slate-400">
            Reference / Note (optional)
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Cheque no., UPI ref, remark..."
              className={field}
            />
          </label>

          {error && <p className="text-[11px] text-red-400">{error}</p>}
        </div>

        {/* Actions */}
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg border border-[#272D39] px-4 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/5 active:scale-95"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="cursor-pointer rounded-lg bg-linear-to-r from-[#6C63FF] to-[#4DA3FF] px-4 py-2 text-xs font-semibold text-white transition hover:opacity-90 active:scale-95"
          >
            Collect Payment
          </button>
        </div>
      </motion.form>
    </motion.div>
  );
}

/* ---------- Page ---------- */
export default function AccountsReceivablePage() {
  const [receivables, setReceivables] = useState<Receivable[]>(initialReceivables);
  const [wing, setWing] = useState("All Wings");
  const [status, setStatus] = useState("All Status");
  const [q, setQ] = useState("");

  // Row currently open in the Collect popup (null = popup closed)
  const [selected, setSelected] = useState<Receivable | null>(null);
  // Small success message after a payment is collected
  const [toast, setToast] = useState("");

  // Hide the success message after 3 seconds
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  // Filter rows by wing, status and search text
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return receivables.filter(
      (r) =>
        (wing === "All Wings" || r.wing === wing) &&
        (status === "All Status" || r.status === status) &&
        (!s || `${r.flat} ${r.resident} ${r.billNo}`.toLowerCase().includes(s)),
    );
  }, [receivables, wing, status, q]);

  // Saves the payment: updates paid amount, balance due and status of that bill
  const collectPayment = (amount: number) => {
    if (!selected) return;

    setReceivables((prev) =>
      prev.map((r) => {
        if (r.billNo !== selected.billNo) return r;

        const paid = toNumber(r.paidAmount) + amount;
        const balance = toNumber(r.billAmount) - paid;

        return {
          ...r,
          paidAmount: toMoney(paid),
          balanceDue: toMoney(balance),
          status: balance <= 0 ? "Paid" : "Partial",
        };
      }),
    );

    setToast(`${toMoney(amount)} collected from ${selected.resident} (${selected.flat})`);
    setSelected(null);
  };

  return (
    <div className="mx-auto flex w-full max-w-350 flex-col gap-4">
      {/* Heading */}
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
      >
        <motion.div variants={item}>
          <h1 className="text-xl font-bold sm:text-2xl">
            Receivables &amp; Outstanding Dues
          </h1>
          <p className="text-xs text-slate-400">
            Track resident dues and collect payments
          </p>
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
        className="grid grid-cols-1 gap-2 rounded-xl border border-[#272D39] bg-[#10131A] p-3 min-[480px]:grid-cols-2 lg:grid-cols-[160px_160px_1fr]"
      >
        <div className="relative">
          <select
            value={wing}
            onChange={(e) => setWing(e.target.value)}
            className={`${field} cursor-pointer appearance-none pr-8`}
          >
            {wingOptions.map((w) => (
              <option key={w} value={w}>
                {w === "All Wings" ? w : `Wing ${w}`}
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

        <div className="relative min-[480px]:col-span-2 lg:col-span-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by flat, resident, bill no..."
            className={`${field} pl-9`}
          />
        </div>
      </motion.div>

      {/* Receivables table */}
      <motion.div
        variants={item}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
      >
        <Card title="Outstanding Dues" sub={`Total ${list.length} records`}>
          {/* Table scrolls sideways on small screens */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-200 text-left text-[11px]">
              <thead className="text-slate-400">
                <tr>
                  <th className={th}>Flat No.</th>
                  <th className={th}>Resident Name</th>
                  <th className={th}>Bill No.</th>
                  <th className={th}>Bill Amount</th>
                  <th className={th}>Paid Amount</th>
                  <th className={th}>Balance Due</th>
                  <th className={th}>Due Date</th>
                  <th className={th}>Status</th>
                  <th className={`${th} text-right`}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.map((r, i) => (
                  <motion.tr
                    key={r.billNo}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={VIEWPORT}
                    transition={{ duration: 0.5, ease: EASE, delay: i * 0.05 }}
                    className="hover:bg-white/2"
                  >
                    <td className={`${td} font-medium`}>{r.flat}</td>
                    <td className={`${td} text-slate-300`}>{r.resident}</td>
                    <td className={`${td} text-slate-300`}>{r.billNo}</td>
                    <td className={`${td} whitespace-nowrap text-slate-300`}>
                      {r.billAmount}
                    </td>
                    <td className={`${td} whitespace-nowrap text-slate-300`}>
                      {r.paidAmount}
                    </td>
                    <td
                      className={`${td} whitespace-nowrap font-medium ${
                        toNumber(r.balanceDue) === 0
                          ? "text-slate-400"
                          : "text-red-400"
                      }`}
                    >
                      {r.balanceDue}
                    </td>
                    <td className={`${td} whitespace-nowrap text-slate-400`}>
                      {r.dueDate}
                    </td>
                    <td className={td}>
                      <Badge tone={toneFor(r.status)}>{r.status}</Badge>
                    </td>
                    <td className={`${td} text-right`}>
                      <button
                        type="button"
                        onClick={() => setSelected(r)}
                        disabled={toNumber(r.balanceDue) === 0}
                        className="cursor-pointer rounded-md bg-linear-to-r from-[#6C63FF] to-[#4DA3FF] px-3 py-1 text-[10px] font-semibold text-white transition hover:opacity-90 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:opacity-40 disabled:active:scale-100"
                      >
                        Collect
                      </button>
                    </td>
                  </motion.tr>
                ))}

                {list.length === 0 && (
                  <tr>
                    <td
                      colSpan={9}
                      className={`${td} py-8 text-center text-slate-500`}
                    >
                      No records found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-4 flex flex-col items-center justify-between gap-3 text-[11px] text-slate-400 sm:flex-row">
            <span>Showing 1-{list.length} of 100</span>
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

      {/* Collect Payment popup */}
      <AnimatePresence>
        {selected && (
          <CollectModal
            key={selected.billNo}
            record={selected}
            onClose={() => setSelected(null)}
            onSubmit={collectPayment}
          />
        )}
      </AnimatePresence>

      {/* Success message */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="fixed right-4 top-20 z-[80] flex max-w-[90vw] items-center gap-2 rounded-lg border border-emerald-500/30 bg-[#10131A] px-4 py-3 text-xs text-emerald-400 shadow-xl"
          >
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}