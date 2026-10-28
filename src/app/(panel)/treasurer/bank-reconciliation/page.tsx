"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import {
  CheckCircle2,
  XCircle,
  Scale,
  Upload,
  Zap,
  Link2,
  Unlink,
  BadgeCheck,
  Eye,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  X,
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

type Status = "Matched" | "Unmatched";

type Transaction = {
  id: number;
  date: string;
  description: string;
  bankAmount: number;
  ledgerAmount: number | null; // null = not in ledger yet
  status: Status;
};

const initialTransactions: Transaction[] = [
  { id: 1, date: "01 Oct 2025", description: "Resident Payment", bankAmount: 3700, ledgerAmount: 3700, status: "Matched" },
  { id: 2, date: "03 Oct 2025", description: "Bank Charges", bankAmount: 250, ledgerAmount: null, status: "Unmatched" },
  { id: 3, date: "05 Oct 2025", description: "Vendor Payment", bankAmount: 12000, ledgerAmount: 12000, status: "Matched" },
  { id: 4, date: "08 Oct 2025", description: "Maintenance Collection", bankAmount: 5300, ledgerAmount: 5300, status: "Matched" },
  { id: 5, date: "10 Oct 2025", description: "Interest Credit", bankAmount: 1250, ledgerAmount: 1250, status: "Matched" },
];

// Summary numbers of the whole statement (the table shows only the first page)
const BASE_MATCHED = 45;
const BASE_UNMATCHED = 5;
const BASE_DIFFERENCE = 2350;

const bankAccounts = ["HDFC Bank - 1234", "SBI Bank - 5678", "ICICI Bank - 9012"];
const statementPeriods = [
  "01 Oct 2025 - 31 Oct 2025",
  "01 Sep 2025 - 30 Sep 2025",
  "01 Aug 2025 - 31 Aug 2025",
];

/* ---------- Money helper ---------- */

// 12000 -> "12,000" (Indian number format)
const fmt = (n: number) => n.toLocaleString("en-IN");

/* ---------- Shared styles (same as Residents) ---------- */

const th =
  "bg-white/4 px-2 py-2 font-medium first:rounded-l-md last:rounded-r-md";
const td = "border-t border-[#272D39] px-2 py-2.5";
const field =
  "w-full rounded-lg border border-[#272D39] bg-[#10131A] px-3 py-2 text-xs text-slate-200 outline-none placeholder:text-slate-500 focus:border-[#A29CFF]/60";

// Small icon button used in the Actions column
const iconBtn = "cursor-pointer rounded-md p-1.5 transition active:scale-90";

/* ---------- View Details popup ---------- */

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-[#272D39] py-2 text-[11px] first:border-t-0">
      <span className="text-slate-400">{label}</span>
      <span className="text-right font-medium text-slate-200">{value}</span>
    </div>
  );
}

type ViewTxnModalProps = {
  record: Transaction;
  onClose: () => void;
};

function ViewTxnModal({ record, onClose }: ViewTxnModalProps) {
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

  const difference =
    record.ledgerAmount === null
      ? record.bankAmount
      : Math.abs(record.bankAmount - record.ledgerAmount);

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
            <h2 className="text-sm font-bold">Transaction Details</h2>
            <p className="truncate text-[11px] text-slate-400">
              {record.description} · {record.date}
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
          <Badge tone={record.status === "Matched" ? "green" : "red"}>
            {record.status}
          </Badge>
        </div>

        {/* Amounts */}
        <div className="mt-2 rounded-lg border border-[#272D39] bg-white/3 px-3">
          <DetailRow label="Date" value={record.date} />
          <DetailRow label="Bank Description" value={record.description} />
          <DetailRow label="Bank Amount" value={`₹ ${fmt(record.bankAmount)}`} />
          <DetailRow
            label="Ledger Amount"
            value={record.ledgerAmount === null ? "-" : `₹ ${fmt(record.ledgerAmount)}`}
          />
          <DetailRow label="Difference" value={`₹ ${fmt(difference)}`} />
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

/* ---------- Match Transaction popup ---------- */

type MatchTxnModalProps = {
  record: Transaction;
  onClose: () => void;
  onSubmit: (id: number, ledgerAmount: number) => void;
};

function MatchTxnModal({ record, onClose, onSubmit }: MatchTxnModalProps) {
  const [ledger, setLedger] = useState(String(record.bankAmount));
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
    const num = Number(ledger);

    if (!num || num <= 0) {
      setError("Please enter a valid ledger amount.");
      return;
    }
    if (num !== record.bankAmount) {
      setError(
        `Ledger amount must be equal to the bank amount (₹ ${fmt(record.bankAmount)}) to match.`,
      );
      return;
    }

    onSubmit(record.id, num);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
      className="fixed inset-0 z-70 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
    >
      <motion.form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.96 }}
        transition={{ duration: 0.3, ease: EASE }}
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl border border-[#272D39] bg-[#10131A] p-5 text-white shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-bold">Match Transaction</h2>
            <p className="text-[11px] text-slate-400">
              Match this bank entry with the ledger
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

        {/* Bank entry summary */}
        <div className="mt-4 rounded-lg border border-[#272D39] bg-white/3 px-3">
          <DetailRow label="Date" value={record.date} />
          <DetailRow label="Bank Description" value={record.description} />
          <DetailRow label="Bank Amount" value={`₹ ${fmt(record.bankAmount)}`} />
        </div>

        {/* Ledger amount */}
        <div className="mt-3 flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-[11px] text-slate-400">
            Ledger Amount (₹)
            <input
              type="number"
              min={0}
              value={ledger}
              onChange={(e) => {
                setLedger(e.target.value);
                setError("");
              }}
              className={field}
              autoFocus
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
            Match
          </button>
        </div>
      </motion.form>
    </motion.div>
  );
}

/* ---------- Page ---------- */
export default function BankReconciliationPage() {
  const [account, setAccount] = useState(bankAccounts[0]);
  const [period, setPeriod] = useState(statementPeriods[0]);
  const [txns, setTxns] = useState<Transaction[]>(initialTransactions);

  // Transaction open in the View / Match popup (null = closed)
  const [viewing, setViewing] = useState<Transaction | null>(null);
  const [matching, setMatching] = useState<Transaction | null>(null);
  // Small success message after an action
  const [toast, setToast] = useState("");

  // Hide the success message after 3 seconds
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  // Summary numbers change when a row is matched / unmatched
  const stats = useMemo(() => {
    const initialMatched = initialTransactions.filter((t) => t.status === "Matched").length;
    const matchedNow = txns.filter((t) => t.status === "Matched").length;

    const initialUnmatchedSum = initialTransactions
      .filter((t) => t.status === "Unmatched")
      .reduce((s, t) => s + t.bankAmount, 0);
    const unmatchedSumNow = txns
      .filter((t) => t.status === "Unmatched")
      .reduce((s, t) => s + t.bankAmount, 0);

    const matched = BASE_MATCHED + (matchedNow - initialMatched);
    const unmatched = BASE_UNMATCHED - (matchedNow - initialMatched);
    const difference = BASE_DIFFERENCE - initialUnmatchedSum + unmatchedSumNow;

    return [
      {
        label: "Matched",
        value: String(matched),
        sub: "Transactions matched",
        subC: "text-emerald-400",
        icon: CheckCircle2,
        c: "#00C2B8",
      },
      {
        label: "Unmatched",
        value: String(unmatched),
        sub: "Need attention",
        subC: "text-red-400",
        icon: XCircle,
        c: "#EF4444",
      },
      {
        label: "Difference",
        value: `₹ ${fmt(difference)}`,
        sub: "Bank vs ledger",
        subC: "text-slate-400",
        icon: Scale,
        c: "#8B5CF6",
      },
    ];
  }, [txns]);

  // Match: save the ledger amount and mark as Matched (replace with an API call later)
  const handleMatch = (id: number, ledgerAmount: number) => {
    const t = txns.find((x) => x.id === id);
    setTxns((prev) =>
      prev.map((x) => (x.id === id ? { ...x, ledgerAmount, status: "Matched" } : x)),
    );
    setToast(`${t?.description ?? "Transaction"} matched`);
    setMatching(null);
  };

  // Unmatch: remove the ledger link (replace with an API call later)
  const handleUnmatch = (t: Transaction) => {
    setTxns((prev) =>
      prev.map((x) =>
        x.id === t.id ? { ...x, ledgerAmount: null, status: "Unmatched" } : x,
      ),
    );
    setToast(`${t.description} is now Unmatched`);
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
        <Card title="Bank Transactions" sub={`Total ${txns.length} transactions`}>
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
                {txns.map((t, i) => (
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
                      {fmt(t.bankAmount)}
                    </td>
                    <td className={`${td} text-right text-slate-300`}>
                      {t.ledgerAmount === null ? "-" : fmt(t.ledgerAmount)}
                    </td>
                    <td className={td}>
                      <Badge tone={t.status === "Matched" ? "green" : "red"}>
                        {t.status}
                      </Badge>
                    </td>

                    {/* Actions: icons directly in the row */}
                    <td className={`${td} text-right`}>
                      <div className="flex items-center justify-end gap-0.5">
                        {/* View Details */}
                        <button
                          type="button"
                          title="View Details"
                          aria-label="View Details"
                          onClick={() => setViewing(t)}
                          className={`${iconBtn} text-slate-400 hover:bg-white/5 hover:text-white`}
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        {/* Match: only for unmatched transactions */}
                        {t.status === "Unmatched" && (
                          <button
                            type="button"
                            title="Match"
                            aria-label="Match"
                            onClick={() => setMatching(t)}
                            className={`${iconBtn} text-slate-400 hover:bg-emerald-500/10 hover:text-emerald-400`}
                          >
                            <Link2 className="h-4 w-4" />
                          </button>
                        )}

                        {/* Unmatch: only for matched transactions */}
                        {t.status === "Matched" && (
                          <button
                            type="button"
                            title="Unmatch"
                            aria-label="Unmatch"
                            onClick={() => handleUnmatch(t)}
                            className={`${iconBtn} text-slate-400 hover:bg-red-500/10 hover:text-red-400`}
                          >
                            <Unlink className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}

                {txns.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className={`${td} py-8 text-center text-slate-500`}
                    >
                      No transactions found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-4 flex flex-col items-center justify-between gap-3 text-[11px] text-slate-400 sm:flex-row">
            <span>Showing 1-{txns.length} of 50</span>
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

      {/* View Details popup */}
      <AnimatePresence>
        {viewing && (
          <ViewTxnModal
            key={viewing.id}
            record={viewing}
            onClose={() => setViewing(null)}
          />
        )}
      </AnimatePresence>

      {/* Match popup */}
      <AnimatePresence>
        {matching && (
          <MatchTxnModal
            key={matching.id}
            record={matching}
            onClose={() => setMatching(null)}
            onSubmit={handleMatch}
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