"use client";

import { useMemo, useState } from "react";
import { motion, type Variants } from "framer-motion";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Scale,
  Search,
  Download,
  FileText,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { Card } from "@/Components/ui";

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
    label: "Total Debits",
    value: "₹ 12,45,000",
    sub: "All debit entries",
    subC: "text-slate-400",
    icon: ArrowDownCircle,
    c: "#3B82F6",
  },
  {
    label: "Total Credits",
    value: "₹ 12,40,000",
    sub: "All credit entries",
    subC: "text-emerald-400",
    icon: ArrowUpCircle,
    c: "#00C2B8",
  },
  {
    label: "Balance",
    value: "₹ 5,000",
    sub: "Debits minus credits",
    subC: "text-slate-400",
    icon: Scale,
    c: "#8B5CF6",
  },
];

type Entry = {
  date: string;
  voucher: string;
  account: string;
  description: string;
  debit: string;
  credit: string;
  balance: string;
};

const entries: Entry[] = [
  { date: "01 Apr 2025", voucher: "JV-001", account: "Bank - HDFC", description: "Opening Balance", debit: "3,00,000", credit: "-", balance: "3,00,000" },
  { date: "05 Apr 2025", voucher: "JV-002", account: "Maintenance Income", description: "Maintenance Collection", debit: "-", credit: "5,300", balance: "3,05,300" },
  { date: "08 Apr 2025", voucher: "PV-001", account: "Vendor Payment", description: "Lift Maintenance", debit: "12,300", credit: "-", balance: "2,93,000" },
  { date: "12 Apr 2025", voucher: "JV-004", account: "Bank - HDFC", description: "Resident Payment", debit: "-", credit: "9,000", balance: "3,02,000" },
  { date: "15 Apr 2025", voucher: "JV-005", account: "Reserve Fund", description: "Reserve Fund Contribution", debit: "10,300", credit: "-", balance: "3,15,000" },
];

const financialYears = ["2025-26", "2024-25", "2023-24"];
const dateRanges = [
  "01 Apr 2025 - 31 Mar 2026",
  "01 Apr 2024 - 31 Mar 2025",
  "01 Apr 2023 - 31 Mar 2024",
];
const accountOptions = [
  "All Accounts",
  "Bank - HDFC",
  "Maintenance Income",
  "Vendor Payment",
  "Reserve Fund",
];

/* ---------- Export helpers ---------- */

// Column headings used in both the Excel (CSV) file and the PDF report
const EXPORT_HEADERS = [
  "Date",
  "Voucher No.",
  "Account",
  "Description",
  "Debit",
  "Credit",
  "Balance",
];

// Turns one entry into a row of text values (same order as EXPORT_HEADERS)
const toRow = (e: Entry) => [
  e.date,
  e.voucher,
  e.account,
  e.description,
  e.debit,
  e.credit,
  e.balance,
];

// CSV: wrap every value in quotes (values like "3,00,000" contain commas)
const csvCell = (v: string) => `"${v.replace(/"/g, '""')}"`;

// HTML: escape special characters so the PDF page never breaks
const esc = (v: string) =>
  v
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/* ---------- Shared styles (same as Residents) ---------- */

const th =
  "bg-white/4 px-2 py-2 font-medium first:rounded-l-md last:rounded-r-md";
const td = "border-t border-[#272D39] px-2 py-2.5";
const field =
  "w-full rounded-lg border border-[#272D39] bg-[#10131A] px-3 py-2 text-xs text-slate-200 outline-none placeholder:text-slate-500 focus:border-[#A29CFF]/60";

/* ---------- Page ---------- */
export default function GeneralLedgerPage() {
  const [year, setYear] = useState(financialYears[0]);
  const [range, setRange] = useState(dateRanges[0]);
  const [account, setAccount] = useState(accountOptions[0]);
  const [q, setQ] = useState("");

  // Filter rows by account and search text
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return entries.filter(
      (e) =>
        (account === "All Accounts" || e.account === account) &&
        (!s || `${e.voucher} ${e.account} ${e.description}`.toLowerCase().includes(s)),
    );
  }, [account, q]);

  /* ----- Export Excel: downloads the visible rows as a .csv file (opens in Excel) ----- */
  const exportExcel = () => {
    if (list.length === 0) return;

    const lines = [EXPORT_HEADERS, ...list.map(toRow)].map((row) =>
      row.map(csvCell).join(","),
    );

    // "\uFEFF" (BOM) makes Excel read special characters correctly
    const blob = new Blob(["\uFEFF" + lines.join("\r\n")], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `general-ledger-${year}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  /* ----- Export PDF: opens a clean report in the print dialog (choose "Save as PDF") ----- */
  const exportPDF = () => {
    if (list.length === 0) return;

    const rowsHtml = list
      .map((e) => {
        const r = toRow(e);
        return `<tr>${r
          .map((v, i) => `<td class="${i >= 4 ? "num" : ""}">${esc(v)}</td>`)
          .join("")}</tr>`;
      })
      .join("");

    const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>General Ledger ${esc(year)}</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: Arial, Helvetica, sans-serif; color: #111; padding: 24px; }
    h1 { font-size: 20px; margin: 0 0 4px; }
    .meta { font-size: 12px; color: #555; margin: 0 0 16px; line-height: 1.6; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; }
    th { background: #f1f1f5; }
    .num { text-align: right; }
    th.num { text-align: right; }
    @page { margin: 12mm; }
  </style>
</head>
<body>
  <h1>General Ledger</h1>
  <p class="meta">
    Financial Year: ${esc(year)}<br />
    Period: ${esc(range)}<br />
    Account: ${esc(account)}<br />
    Total entries: ${list.length}
  </p>
  <table>
    <thead>
      <tr>${EXPORT_HEADERS.map(
        (h, i) => `<th class="${i >= 4 ? "num" : ""}">${esc(h)}</th>`,
      ).join("")}</tr>
    </thead>
    <tbody>${rowsHtml}</tbody>
  </table>
</body>
</html>`;

    // Hidden iframe (no popup blocker problem)
    const iframe = document.createElement("iframe");
    iframe.style.cssText =
      "position:fixed;right:0;bottom:0;width:0;height:0;border:0;";
    document.body.appendChild(iframe);

    const win = iframe.contentWindow;
    const doc = win?.document;
    if (!win || !doc) {
      iframe.remove();
      return;
    }

    doc.open();
    doc.write(html);
    doc.close();

    win.onafterprint = () => iframe.remove();
    setTimeout(() => {
      win.focus();
      win.print();
    }, 250);
    // Safety cleanup if the browser never fires "afterprint"
    setTimeout(() => iframe.remove(), 60000);
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
          <h1 className="text-xl font-bold sm:text-2xl">General Ledger</h1>
          <p className="text-xs text-slate-400">
            Track all financial transactions
          </p>
        </motion.div>

        {/* Export buttons */}
        <motion.div variants={item} className="flex gap-2">
          <button
            type="button"
            onClick={exportExcel}
            className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-[#272D39] px-4 py-2.5 text-xs font-semibold text-slate-300 transition hover:bg-white/5 active:scale-95"
          >
            <Download className="h-3.5 w-3.5" /> Export Excel
          </button>
          <button
            type="button"
            onClick={exportPDF}
            className="flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-linear-to-r from-[#6C63FF] to-[#4DA3FF] px-4 py-2.5 text-xs font-semibold text-white transition hover:opacity-90 active:scale-95"
          >
            <FileText className="h-3.5 w-3.5" /> Export PDF
          </button>
        </motion.div>
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
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className={`${field} cursor-pointer appearance-none pr-8`}
          >
            {financialYears.map((y) => (
              <option key={y} value={y}>
                Financial Year: {y}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
        </div>

        <div className="relative">
          <select
            value={range}
            onChange={(e) => setRange(e.target.value)}
            className={`${field} cursor-pointer appearance-none pr-8`}
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
          <select
            value={account}
            onChange={(e) => setAccount(e.target.value)}
            className={`${field} cursor-pointer appearance-none pr-8`}
          >
            {accountOptions.map((a) => (
              <option key={a} value={a}>
                {a}
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

      {/* Ledger table */}
      <motion.div
        variants={item}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
      >
        <Card title="Ledger Entries" sub={`Total ${list.length} entries`}>
          {/* Table scrolls sideways on small screens */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-180 text-left text-[11px]">
              <thead className="text-slate-400">
                <tr>
                  <th className={th}>Date</th>
                  <th className={th}>Voucher No.</th>
                  <th className={th}>Account</th>
                  <th className={th}>Description</th>
                  <th className={`${th} text-right`}>Debit</th>
                  <th className={`${th} text-right`}>Credit</th>
                  <th className={`${th} text-right`}>Balance</th>
                </tr>
              </thead>
              <tbody>
                {list.map((e, i) => (
                  <motion.tr
                    key={e.voucher}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={VIEWPORT}
                    transition={{ duration: 0.5, ease: EASE, delay: i * 0.05 }}
                    className="hover:bg-white/2"
                  >
                    <td className={`${td} whitespace-nowrap text-slate-400`}>
                      {e.date}
                    </td>
                    <td className={`${td} font-medium`}>{e.voucher}</td>
                    <td className={`${td} text-slate-300`}>{e.account}</td>
                    <td className={`${td} text-slate-300`}>{e.description}</td>
                    <td className={`${td} text-right text-slate-300`}>
                      {e.debit}
                    </td>
                    <td className={`${td} text-right text-slate-300`}>
                      {e.credit}
                    </td>
                    <td className={`${td} text-right font-medium`}>
                      {e.balance}
                    </td>
                  </motion.tr>
                ))}

                {list.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className={`${td} py-8 text-center text-slate-500`}
                    >
                      No entries found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-4 flex flex-col items-center justify-between gap-3 text-[11px] text-slate-400 sm:flex-row">
            <span>Showing 1-{list.length} of 200</span>
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