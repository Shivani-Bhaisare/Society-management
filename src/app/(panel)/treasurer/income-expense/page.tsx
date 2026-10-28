"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import {
  Wallet,
  Receipt,
  TrendingUp,
  Plus,
  Download,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  CalendarDays,
  CheckCircle2,
} from "lucide-react";
import { Card, Badge } from "@/Components/ui";
import AddIncomeEntryModal, { type IncomeEntryPayload } from "@/Components/AddIncomeEntryModal"; // adjust the path to your folder
import AddExpenseEntryModal, { type ExpenseEntryPayload } from "@/Components/AddExpenseEntryModal"; // adjust the path to your folder

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

/* ---------- Colours (hex, so they always render) ---------- */

const GREEN = "#10B981";
const BLUE = "#3B82F6";
const ORANGE = "#F59E0B";
const PURPLE = "#8B5CF6";
const RED = "#EF4444";

/* ---------- Data (replace with API data later) ---------- */

// Totals of the whole financial year (the table below shows only the latest entries)
const BASE_INCOME = 1250000;
const BASE_EXPENSE = 875000;
const BASE_TOTAL_ROWS = 56;

// Income vs Expenses (values in Lakh), 12 months of the financial year
const CHART_MAX = 8;
const chartTicks = [8, 6, 4, 2, 0];
const incomeExpense = [
  { m: "Apr", inc: 5.2, exp: 3.4 },
  { m: "May", inc: 6.1, exp: 4.0 },
  { m: "Jun", inc: 5.8, exp: 3.9 },
  { m: "Jul", inc: 6.6, exp: 4.4 },
  { m: "Aug", inc: 6.0, exp: 4.1 },
  { m: "Sep", inc: 7.0, exp: 4.6 },
  { m: "Oct", inc: 6.4, exp: 4.2 },
  { m: "Nov", inc: 7.2, exp: 4.8 },
  { m: "Dec", inc: 6.8, exp: 4.5 },
  { m: "Jan", inc: 7.5, exp: 5.0 },
  { m: "Feb", inc: 7.1, exp: 4.7 },
  { m: "Mar", inc: 7.8, exp: 5.3 },
];

// Expense breakdown groups (base % of the base expense, adds up to 100)
const breakdownBase = [
  { l: "Maintenance", pct: 30, c: BLUE },
  { l: "Security", pct: 25, c: GREEN },
  { l: "Utilities", pct: 20, c: ORANGE },
  { l: "Housekeeping", pct: 15, c: PURPLE },
  { l: "Others", pct: 10, c: "#F97316" },
];

// Expense form category -> breakdown group
function breakdownGroup(category: string) {
  switch (category) {
    case "Maintenance":
    case "Repairs":
      return "Maintenance";
    case "Security":
      return "Security";
    case "Electricity":
      return "Utilities";
    case "Housekeeping":
      return "Housekeeping";
    default:
      return "Others";
  }
}

type Type = "Income" | "Expense";

type Transaction = {
  id: number;
  date: string; // yyyy-mm-dd
  type: Type;
  category: string;
  description: string;
  amount: number;
  method: string;
};

const baseTransactions: Transaction[] = [
  { id: 1, date: "2025-04-01", type: "Income", category: "Maintenance Collection", description: "Maintenance Collection", amount: 5300, method: "Online" },
  { id: 2, date: "2025-04-07", type: "Expense", category: "Security", description: "Security Services", amount: 2500, method: "Bank Transfer" },
  { id: 3, date: "2025-04-12", type: "Income", category: "Parking", description: "Parking Fees", amount: 1200, method: "Cash" },
  { id: 4, date: "2025-04-15", type: "Expense", category: "Electricity", description: "Electricity Bill", amount: 3200, method: "Bank Transfer" },
];

const periods = [
  "01 Apr 2025 - 31 Mar 2026",
  "01 Apr 2024 - 31 Mar 2025",
  "01 Apr 2023 - 31 Mar 2024",
];

/* ---------- Helpers ---------- */

// 1250000 -> "₹ 12,50,000" (Indian number format)
const money = (n: number) => `₹ ${n.toLocaleString("en-IN")}`;

// "2025-04-01" -> "01 Apr 2025"
const formatDate = (d: string) =>
  d
    ? new Date(`${d}T00:00:00`).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "-";

// Makes one CSV cell safe (quotes, commas, new lines)
const csvCell = (v: string | number) => `"${String(v).replace(/"/g, '""')}"`;

/* ---------- Shared styles (same as Residents) ---------- */

const th =
  "bg-white/4 px-2 py-2 font-medium first:rounded-l-md last:rounded-r-md";
const td = "border-t border-[#272D39] px-2 py-2.5";

/* ---------- Donut chart drawn with SVG circles (no chart library needed) ---------- */

function Donut({
  segments,
  size = 160,
  stroke = 18,
  children,
}: {
  segments: { pct: number; c: string }[];
  size?: number;
  stroke?: number;
  children?: React.ReactNode;
}) {
  const r = 50 - stroke / 2; // viewBox is 100x100
  let offset = 0;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={stroke}
        />
        {segments.map((s, idx) => {
          const el = (
            <circle
              key={idx}
              cx="50"
              cy="50"
              r={r}
              fill="none"
              stroke={s.c}
              strokeWidth={stroke}
              pathLength={100}
              strokeDasharray={`${s.pct} ${100 - s.pct}`}
              strokeDashoffset={-offset}
            />
          );
          offset += s.pct;
          return el;
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {children}
      </div>
    </div>
  );
}

/* ---------- Page ---------- */
export default function IncomeExpensePage() {
  const [period, setPeriod] = useState(periods[0]);
  // Controls the Add Income / Add Expense modals (open / closed)
  const [incomeOpen, setIncomeOpen] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);
  // Entries added from the drawers (newest first)
  const [added, setAdded] = useState<Transaction[]>([]);
  // Small success message after an action
  const [toast, setToast] = useState("");

  // Hide the success message after 3 seconds
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  // Table rows: new entries on top, then the existing ones
  const list = useMemo(() => [...added, ...baseTransactions], [added]);

  // Totals = base totals + everything added from the drawers
  const totals = useMemo(() => {
    const inc = added.filter((t) => t.type === "Income").reduce((s, t) => s + t.amount, 0);
    const exp = added.filter((t) => t.type === "Expense").reduce((s, t) => s + t.amount, 0);
    return { income: BASE_INCOME + inc, expense: BASE_EXPENSE + exp };
  }, [added]);

  const surplus = totals.income - totals.expense;

  const stats = [
    {
      label: "Total Income",
      value: money(totals.income),
      sub: "All income received",
      subC: "text-emerald-400",
      icon: Wallet,
      c: GREEN,
    },
    {
      label: "Total Expenses",
      value: money(totals.expense),
      sub: "All expenses paid",
      subC: "text-red-400",
      icon: Receipt,
      c: RED,
    },
    {
      label: "Net Surplus",
      value: money(surplus),
      sub: "Income minus expenses",
      subC: surplus < 0 ? "text-red-400" : "text-slate-400",
      icon: TrendingUp,
      c: BLUE,
    },
  ];

  // Expense breakdown: base amount of each group + new expenses of that group
  const breakdown = useMemo(() => {
    const amounts = breakdownBase.map(({ l, pct, c }) => {
      const extra = added
        .filter((t) => t.type === "Expense" && breakdownGroup(t.category) === l)
        .reduce((s, t) => s + t.amount, 0);
      return { l, c, amount: (pct / 100) * BASE_EXPENSE + extra };
    });
    const total = amounts.reduce((s, a) => s + a.amount, 0) || 1;
    return amounts.map((a) => ({ ...a, pct: (a.amount / total) * 100 }));
  }, [added]);

  // Called when the Add Income drawer is saved (replace with an API call later)
  const handleSaveIncome = (data: IncomeEntryPayload) => {
    setAdded((prev) => [
      {
        id: data.id,
        date: data.date,
        type: "Income",
        category: data.category,
        description: data.title,
        amount: data.amount,
        method: data.method,
      },
      ...prev,
    ]);
    setToast(`${data.title} added to income`);
  };

  // Called when the Add Expense drawer is saved (replace with an API call later)
  const handleSaveExpense = (data: ExpenseEntryPayload) => {
    setAdded((prev) => [
      {
        id: data.id,
        date: data.date,
        type: "Expense",
        category: data.category,
        description: data.title,
        amount: data.amount,
        method: data.method,
      },
      ...prev,
    ]);
    setToast(`${data.title} added to expenses`);
  };

  // Export Report: downloads a CSV (summary + category breakdown + transactions)
  const handleExport = () => {
    const rows: (string | number)[][] = [
      ["Income & Expenses Report"],
      ["Period", period],
      [],
      ["Summary"],
      ["Total Income", totals.income],
      ["Total Expenses", totals.expense],
      ["Net Surplus", surplus],
      [],
      ["Expense Breakdown"],
      ["Category", "Amount", "Share %"],
      ...breakdown.map((b) => [b.l, Math.round(b.amount), b.pct.toFixed(1)]),
      [],
      ["Recent Transactions"],
      ["Date", "Type", "Category", "Description", "Amount", "Payment Method"],
      ...list.map((t) => [
        formatDate(t.date),
        t.type,
        t.category,
        t.description,
        t.amount,
        t.method || "-",
      ]),
    ];

    const csv = rows.map((r) => r.map(csvCell).join(",")).join("\r\n");
    // "\uFEFF" makes Excel read the file correctly
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `income-expense-${period.replace(/\s+/g, "").replace(/-/g, "_")}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    setToast("Report downloaded");
  };

  return (
    <div className="mx-auto flex w-full max-w-350 flex-col gap-4">
      {/* Heading + action buttons */}
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
        className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
      >
        <motion.div variants={item}>
          <h1 className="text-xl font-bold sm:text-2xl">Income &amp; Expenses</h1>
          <p className="text-xs text-slate-400">
            Track cash flow and category-wise spending
          </p>
        </motion.div>

        {/* Buttons: Add Income / Add Expense open their drawers, Export downloads a CSV */}
        <motion.div variants={item} className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setIncomeOpen(true)}
            className="flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-linear-to-r from-[#6C63FF] to-[#4DA3FF] px-4 py-2.5 text-xs font-semibold text-white transition hover:opacity-90 active:scale-95"
          >
            <Plus className="h-3.5 w-3.5" /> Add Income
          </button>
          <button
            type="button"
            onClick={() => setExpenseOpen(true)}
            className="flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-linear-to-r from-[#6C63FF] to-[#4DA3FF] px-4 py-2.5 text-xs font-semibold text-white transition hover:opacity-90 active:scale-95"
          >
            <Plus className="h-3.5 w-3.5" /> Add Expense
          </button>
          <button
            type="button"
            onClick={handleExport}
            className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-[#272D39] px-4 py-2.5 text-xs font-semibold text-slate-300 transition hover:bg-white/5 active:scale-95"
          >
            <Download className="h-3.5 w-3.5" /> Export Report
          </button>
        </motion.div>
      </motion.div>

      {/* Period selector */}
      <motion.div
        variants={item}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
        className="relative w-full sm:w-72"
      >
        <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
        <select
          value={period}
          onChange={(e) => setPeriod(e.target.value)}
          className="w-full cursor-pointer appearance-none rounded-lg border border-[#272D39] bg-[#10131A] py-2 pl-9 pr-9 text-xs font-medium text-slate-200 outline-none focus:border-[#A29CFF]/60"
        >
          {periods.map((p) => (
            <option key={p} value={p} className="bg-[#10131A]">
              {p}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
      </motion.div>

      {/* Stat cards (same card size as Residents) */}
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
        className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 lg:grid-cols-3"
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

      {/* Income vs Expenses + Expense Breakdown */}
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
        className="grid grid-cols-1 gap-4 xl:grid-cols-5"
      >
        {/* Income vs Expenses (bar chart) */}
        <motion.div variants={item} className="h-full xl:col-span-3 [&>*]:h-full">
          <Card
            title="Income vs Expenses"
            sub="Monthly comparison (in Lakh)"
            action={
              <span className="flex items-center gap-3 text-[10px] text-slate-400">
                <span className="flex items-center gap-1">
                  <i className="h-2 w-2 rounded-full" style={{ background: BLUE }} />{" "}
                  Income
                </span>
                <span className="flex items-center gap-1">
                  <i className="h-2 w-2 rounded-full" style={{ background: ORANGE }} />{" "}
                  Expenses
                </span>
              </span>
            }
          >
            {/* Horizontal scroll on very small screens so 12 months never get squashed */}
            <div className="overflow-x-auto pb-1">
              <div className="flex min-w-105 gap-2">
                {/* Y axis labels */}
                <div className="flex h-56 flex-col justify-between text-[10px] text-slate-500">
                  {chartTicks.map((t) => (
                    <span key={t} className="leading-none">
                      {t === 0 ? "0" : `${t}L`}
                    </span>
                  ))}
                </div>

                {/* Plot area */}
                <div className="flex-1">
                  <div className="relative h-56 border-b border-l border-[#272D39]">
                    {/* Horizontal grid lines */}
                    {chartTicks.slice(0, -1).map((t) => (
                      <span
                        key={t}
                        className="absolute inset-x-0 border-t border-dashed border-[#272D39]"
                        style={{ top: `${100 - (t / CHART_MAX) * 100}%` }}
                      />
                    ))}
                    {/* Bars */}
                    <div className="absolute inset-0 flex items-end justify-around px-1">
                      {incomeExpense.map(({ m, inc, exp }) => (
                        <div key={m} className="flex h-full items-end gap-0.75">
                          <motion.span
                            initial={{ height: 0 }}
                            whileInView={{ height: `${(inc / CHART_MAX) * 100}%` }}
                            viewport={VIEWPORT}
                            transition={{ duration: 0.8, ease: EASE }}
                            className="w-1.5 rounded-t-sm sm:w-2"
                            style={{ background: BLUE }}
                          />
                          <motion.span
                            initial={{ height: 0 }}
                            whileInView={{ height: `${(exp / CHART_MAX) * 100}%` }}
                            viewport={VIEWPORT}
                            transition={{ duration: 0.8, ease: EASE, delay: 0.1 }}
                            className="w-1.5 rounded-t-sm sm:w-2"
                            style={{ background: ORANGE }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* X axis labels */}
                  <div className="mt-1.5 flex justify-around px-1 text-[10px] text-slate-400">
                    {incomeExpense.map(({ m }) => (
                      <span key={m}>{m}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Expense Breakdown (donut) */}
        <motion.div variants={item} className="h-full xl:col-span-2 [&>*]:h-full">
          <Card title="Expense Breakdown" sub="Category-wise spending">
            <div className="flex flex-col items-center gap-5 min-[480px]:flex-row xl:flex-col 2xl:flex-row">
              <Donut
                segments={breakdown.map(({ pct, c }) => ({ pct, c }))}
                size={170}
                stroke={18}
              >
                <span className="text-lg font-bold">
                  ₹ {(totals.expense / 100000).toFixed(2)}L
                </span>
                <span className="text-[10px] text-slate-400">Total Expenses</span>
              </Donut>

              {/* Legend */}
              <div className="flex w-full min-w-0 flex-1 flex-col gap-3">
                {breakdown.map(({ l, pct, c }) => (
                  <div key={l} className="flex items-center gap-2 text-xs">
                    <i
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ background: c }}
                    />
                    <span className="min-w-0 flex-1 truncate text-slate-300">
                      {l}
                    </span>
                    <span className="shrink-0 font-semibold">{Math.round(pct)}%</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </motion.div>
      </motion.div>

      {/* Transactions table */}
      <motion.div
        variants={item}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
      >
        <Card title="Recent Transactions" sub={`Total ${list.length} transactions`}>
          {/* Table scrolls sideways on small screens */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-180 text-left text-[11px]">
              <thead className="text-slate-400">
                <tr>
                  <th className={th}>Date</th>
                  <th className={th}>Type</th>
                  <th className={th}>Category</th>
                  <th className={th}>Description</th>
                  <th className={`${th} text-right`}>Amount</th>
                  <th className={th}>Payment Method</th>
                </tr>
              </thead>
              <tbody>
                {list.map((t, i) => (
                  <motion.tr
                    key={t.id}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={VIEWPORT}
                    transition={{ duration: 0.5, ease: EASE, delay: i * 0.05 }}
                    className="hover:bg-white/2"
                  >
                    <td className={`${td} whitespace-nowrap text-slate-400`}>
                      {formatDate(t.date)}
                    </td>
                    <td className={td}>
                      <Badge tone={t.type === "Income" ? "green" : "orange"}>
                        {t.type}
                      </Badge>
                    </td>
                    <td className={`${td} text-slate-300`}>{t.category}</td>
                    <td className={`${td} font-medium`}>{t.description}</td>
                    <td className={`${td} whitespace-nowrap text-right text-slate-300`}>
                      {money(t.amount)}
                    </td>
                    <td className={`${td} text-slate-400`}>{t.method || "-"}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-4 flex flex-col items-center justify-between gap-3 text-[11px] text-slate-400 sm:flex-row">
            <span>
              Showing 1-{list.length} of {BASE_TOTAL_ROWS + added.length}
            </span>
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

      {/* Add Income drawer (opens from the "Add Income" button) */}
      <AddIncomeEntryModal
        open={incomeOpen}
        onClose={() => setIncomeOpen(false)}
        onSave={handleSaveIncome}
      />

      {/* Add Expense drawer (opens from the "Add Expense" button) */}
      <AddExpenseEntryModal
        open={expenseOpen}
        onClose={() => setExpenseOpen(false)}
        onSave={handleSaveExpense}
      />

      {/* Success message */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.3, ease: EASE }}
            className="fixed right-4 top-20 z-80 flex max-w-[90vw] items-center gap-2 rounded-lg border border-emerald-500/30 bg-[#10131A] px-4 py-3 text-xs text-emerald-400 shadow-xl"
          >
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}