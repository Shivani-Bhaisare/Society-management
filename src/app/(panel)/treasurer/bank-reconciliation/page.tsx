"use client";

import { useMemo, useState } from "react";
import { motion, type Variants } from "framer-motion";
import {
  CheckCircle2,
  XCircle,
  Scale,
  Upload,
  Zap,
  Link2,
  BadgeCheck,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
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
    label: "Matched",
    value: "45",
    sub: "Transactions matched",
    subC: "text-emerald-400",
    icon: CheckCircle2,
    c: "#00C2B8",
  },
  {
    label: "Unmatched",
    value: "5",
    sub: "Need attention",
    subC: "text-red-400",
    icon: XCircle,
    c: "#EF4444",
  },
  {
    label: "Difference",
    value: "₹ 2,350",
    sub: "Bank vs ledger",
    subC: "text-slate-400",
    icon: Scale,
    c: "#8B5CF6",
  },
];

type Status = "Matched" | "Unmatched";

type Transaction = {
  id: number;
  date: string;
  description: string;
  bankAmount: string;
  ledgerAmount: string;
  status: Status;
};

const transactions: Transaction[] = [
  { id: 1, date: "01 Oct 2025", description: "Resident Payment", bankAmount: "3,700", ledgerAmount: "3,700", status: "Matched" },
  { id: 2, date: "03 Oct 2025", description: "Bank Charges", bankAmount: "250", ledgerAmount: "-", status: "Unmatched" },
  { id: 3, date: "05 Oct 2025", description: "Vendor Payment", bankAmount: "12,000", ledgerAmount: "12,000", status: "Matched" },
  { id: 4, date: "08 Oct 2025", description: "Maintenance Collection", bankAmount: "5,300", ledgerAmount: "5,300", status: "Matched" },
  { id: 5, date: "10 Oct 2025", description: "Interest Credit", bankAmount: "1,250", ledgerAmount: "1,250", status: "Matched" },
];

const bankAccounts = ["HDFC Bank - 1234", "SBI Bank - 5678", "ICICI Bank - 9012"];
const statementPeriods = [
  "01 Oct 2025 - 31 Oct 2025",
  "01 Sep 2025 - 30 Sep 2025",
  "01 Aug 2025 - 31 Aug 2025",
];

/* ---------- Shared styles (same as Residents) ---------- */

const th =
  "bg-white/4 px-2 py-2 font-medium first:rounded-l-md last:rounded-r-md";
const td = "border-t border-[#272D39] px-2 py-2.5";
const field =
  "w-full rounded-lg border border-[#272D39] bg-[#10131A] px-3 py-2 text-xs text-slate-200 outline-none placeholder:text-slate-500 focus:border-[#A29CFF]/60";

/* ---------- Page ---------- */
export default function BankReconciliationPage() {
  const [account, setAccount] = useState(bankAccounts[0]);
  const [period, setPeriod] = useState(statementPeriods[0]);

  // Newest data first is not needed, show rows in the given order
  const list = useMemo(() => transactions, []);

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
          <h1 className="text-xl font-bold sm:text-2xl">Bank Reconciliation</h1>
          <p className="text-xs text-slate-400">
            Match bank transactions with ledger
          </p>
        </motion.div>
      </motion.div>

      {/* Filters + balances */}
      <motion.div
        variants={item}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
        className="grid grid-cols-1 gap-2 rounded-xl border border-[#272D39] bg-[#10131A] p-3 min-[480px]:grid-cols-2 lg:grid-cols-4"
      >
        <label className="flex flex-col gap-1 text-[11px] text-slate-400">
          <span>Bank Account</span>
          <span className="relative block">
            <select
              value={account}
              onChange={(e) => setAccount(e.target.value)}
              className={`${field} cursor-pointer appearance-none pr-8`}
            >
              {bankAccounts.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
          </span>
        </label>

        <label className="flex flex-col gap-1 text-[11px] text-slate-400">
          <span>Statement Period</span>
          <span className="relative block">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className={`${field} cursor-pointer appearance-none pr-8`}
            >
              {statementPeriods.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
          </span>
        </label>

        <div className="flex flex-col gap-1 text-[11px] text-slate-400">
          <span>Opening Balance</span>
          <p className="py-2 text-sm font-bold text-slate-200">₹ 2,50,000</p>
        </div>

        <div className="flex flex-col gap-1 text-[11px] text-slate-400">
          <span>Closing Balance</span>
          <p className="py-2 text-sm font-bold text-slate-200">₹ 3,80,000</p>
        </div>
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

      {/* Action buttons (connect your own actions here later) */}
      <motion.div
        variants={item}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
        className="flex flex-wrap gap-2"
      >
        <button
          type="button"
          className="flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-linear-to-r from-[#6C63FF] to-[#4DA3FF] px-4 py-2.5 text-xs font-semibold text-white transition hover:opacity-90 active:scale-95"
        >
          <Upload className="h-3.5 w-3.5" /> Upload Statement
        </button>
        <button
          type="button"
          className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-[#272D39] px-4 py-2.5 text-xs font-semibold text-slate-300 transition hover:bg-white/5 active:scale-95"
        >
          <Zap className="h-3.5 w-3.5" /> Auto Match
        </button>
        <button
          type="button"
          className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-[#272D39] px-4 py-2.5 text-xs font-semibold text-slate-300 transition hover:bg-white/5 active:scale-95"
        >
          <Link2 className="h-3.5 w-3.5" /> Match Manually
        </button>
        <button
          type="button"
          className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-[#272D39] px-4 py-2.5 text-xs font-semibold text-slate-300 transition hover:bg-white/5 active:scale-95"
        >
          <BadgeCheck className="h-3.5 w-3.5" /> Complete Reconciliation
        </button>
      </motion.div>

      {/* Transactions table */}
      <motion.div
        variants={item}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
      >
        <Card title="Bank Transactions" sub={`Total ${list.length} transactions`}>
          {/* Table scrolls sideways on small screens */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-160 text-left text-[11px]">
              <thead className="text-slate-400">
                <tr>
                  <th className={th}>Date</th>
                  <th className={th}>Bank Description</th>
                  <th className={`${th} text-right`}>Bank Amount</th>
                  <th className={`${th} text-right`}>Ledger Amount</th>
                  <th className={th}>Status</th>
                  <th className={`${th} text-right`}>Actions</th>
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
                      {t.date}
                    </td>
                    <td className={`${td} font-medium`}>{t.description}</td>
                    <td className={`${td} text-right text-slate-300`}>
                      {t.bankAmount}
                    </td>
                    <td className={`${td} text-right text-slate-300`}>
                      {t.ledgerAmount}
                    </td>
                    <td className={td}>
                      <Badge tone={t.status === "Matched" ? "green" : "red"}>
                        {t.status}
                      </Badge>
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
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-4 flex flex-col items-center justify-between gap-3 text-[11px] text-slate-400 sm:flex-row">
            <span>Showing 1-{list.length} of 50</span>
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
    </div>
  );
}