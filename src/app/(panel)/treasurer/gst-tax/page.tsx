
"use client";

import { useState } from "react";
import { motion, type Variants } from "framer-motion";
import {
  Receipt,
  Percent,
  Landmark,
  BadgePercent,
  FileBarChart,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Card, Badge } from "@/Components/ui";
import AddGenerateTaxReportModal, {
  type GenerateTaxReportPayload,
} from "@/Components/AddGenerateTaxReportModal";

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

const tabs = [
  "Tax Configuration",
  "Tax Summary",
  "Tax Transactions",
] as const;

type Tab = (typeof tabs)[number];

// Tax settings shown on the Tax Configuration tab
const settings = [
  { label: "Tax Type", value: "GST (India)" },
  { label: "GSTIN", value: "27ABCDE1234F1Z5" },
  { label: "Tax Rate", value: "18%" },
  { label: "Effective Date", value: "01 Apr 2025" },
  { label: "SAC / HSN Code", value: "9991" },
];

const chargeHeads = ["Maintenance", "Parking", "Club House"];

// Tax summary rows
const summary = [
  { label: "Total Tax Collected", value: "₹ 1,80,000" },
  { label: "CGST (9%)", value: "₹ 90,000" },
  { label: "SGST (9%)", value: "₹ 90,000" },
  { label: "Input Tax Credit", value: "₹ 75,000" },
];

// Stat cards shown on the Tax Summary tab
const stats = [
  {
    label: "Total Tax Collected",
    value: "₹ 1,80,000",
    sub: "CGST + SGST",
    subC: "text-slate-400",
    icon: Receipt,
    c: "#3B82F6",
  },
  {
    label: "CGST (9%)",
    value: "₹ 90,000",
    sub: "Central GST",
    subC: "text-slate-400",
    icon: Percent,
    c: "#00C2B8",
  },
  {
    label: "SGST (9%)",
    value: "₹ 90,000",
    sub: "State GST",
    subC: "text-slate-400",
    icon: Landmark,
    c: "#8B5CF6",
  },
  {
    label: "Input Tax Credit",
    value: "₹ 75,000",
    sub: "Available to claim",
    subC: "text-emerald-400",
    icon: BadgePercent,
    c: "#F59E0B",
  },
];

type Txn = {
  id: number;
  date: string;
  invoice: string;
  head: string;
  taxable: string;
  tax: string;
  status: "Collected" | "Pending";
};

const transactions: Txn[] = [
  {
    id: 1,
    date: "01 Apr 2025",
    invoice: "MB-0001",
    head: "Maintenance",
    taxable: "₹ 3,000",
    tax: "₹ 540",
    status: "Collected",
  },
  {
    id: 2,
    date: "01 Apr 2025",
    invoice: "MB-0002",
    head: "Parking",
    taxable: "₹ 500",
    tax: "₹ 90",
    status: "Collected",
  },
  {
    id: 3,
    date: "05 Apr 2025",
    invoice: "MB-0003",
    head: "Club House",
    taxable: "₹ 1,000",
    tax: "₹ 180",
    status: "Pending",
  },
  {
    id: 4,
    date: "10 Apr 2025",
    invoice: "MB-0004",
    head: "Maintenance",
    taxable: "₹ 3,000",
    tax: "₹ 540",
    status: "Collected",
  },
];

/* ---------- Shared styles (same as Residents) ---------- */

const th =
  "bg-white/4 px-2 py-2 font-medium first:rounded-l-md last:rounded-r-md";

const td = "border-t border-[#272D39] px-2 py-2.5";

/* ---------- Page ---------- */

export default function GstTaxPage() {
  const [tab, setTab] = useState<Tab>("Tax Configuration");

  // Generate Report modal state
  const [openReport, setOpenReport] = useState(false);

  // Handle report generation
  function handleGenerateReport(data: GenerateTaxReportPayload) {
    // TODO: Connect your report generation API here.
    console.log(data);
  }

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
          <h1 className="text-xl font-bold sm:text-2xl">
            Tax Configuration &amp; Reports
          </h1>
          <p className="text-xs text-slate-400">
            Manage GST settings and view tax reports
          </p>
        </motion.div>

        {/* Generate Report button */}
        <motion.div variants={item}>
          <button
            type="button"
            onClick={() => setOpenReport(true)}
            className="flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-linear-to-r from-[#6C63FF] to-[#4DA3FF] px-4 py-2.5 text-xs font-semibold text-white transition hover:opacity-90 active:scale-95"
          >
            <FileBarChart className="h-3.5 w-3.5" />
            Generate Report
          </button>
        </motion.div>
      </motion.div>

      {/* Tabs */}
      <motion.div
        variants={item}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
        className="flex gap-1 overflow-x-auto rounded-xl border border-[#272D39] bg-[#10131A] p-1"
      >
        {tabs.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={`shrink-0 cursor-pointer rounded-lg px-4 py-2 text-xs font-semibold transition ${
              tab === t
                ? "bg-linear-to-r from-[#6C63FF] to-[#4DA3FF] text-white"
                : "text-slate-400 hover:bg-white/5"
            }`}
          >
            {t}
          </button>
        ))}
      </motion.div>

      {/* Tab 1: Tax settings + summary */}
      {tab === "Tax Configuration" && (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 gap-4 xl:grid-cols-5"
        >
          {/* Tax settings */}
          <motion.div
            variants={item}
            className="h-full xl:col-span-3 [&>*]:h-full"
          >
            <Card title="Tax Settings" sub="Current GST configuration">
              <div className="grid grid-cols-1 gap-4 min-[480px]:grid-cols-2">
                {settings.map(({ label, value }) => (
                  <div key={label} className="flex flex-col gap-1">
                    <span className="text-[11px] text-slate-400">
                      {label}
                    </span>
                    <span className="text-xs font-semibold">{value}</span>
                  </div>
                ))}

                <div className="flex flex-col gap-1">
                  <span className="text-[11px] text-slate-400">Status</span>
                  <span>
                    <Badge tone="green">Active</Badge>
                  </span>
                </div>

                <div className="flex flex-col gap-1.5 min-[480px]:col-span-2">
                  <span className="text-[11px] text-slate-400">
                    Applicable Charge Heads
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {chargeHeads.map((h) => (
                      <Badge key={h} tone="blue">
                        {h}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </motion.div>

          {/* Tax summary */}
          <motion.div
            variants={item}
            className="h-full xl:col-span-2 [&>*]:h-full"
          >
            <Card title="Tax Summary" sub="Current financial year">
              <div className="flex flex-col">
                {summary.map(({ label, value }, i) => (
                  <div
                    key={label}
                    className={`flex items-center justify-between py-3 text-xs ${
                      i > 0 ? "border-t border-[#272D39]" : ""
                    }`}
                  >
                    <span className="text-slate-400">{label}</span>
                    <span className="font-bold">{value}</span>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        </motion.div>
      )}

      {/* Tab 2: Tax summary stat cards */}
      {tab === "Tax Summary" && (
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
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
                <span className="truncate text-xs font-semibold">
                  {label}
                </span>
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
      )}

      {/* Tab 3: Tax transactions table */}
      {tab === "Tax Transactions" && (
        <motion.div variants={item} initial="hidden" animate="show">
          <Card
            title="Tax Transactions"
            sub={`Total ${transactions.length} transactions`}
          >
            {/* Table scrolls sideways on small screens */}
            <div className="overflow-x-auto">
              <table className="w-full min-w-160 text-left text-[11px]">
                <thead className="text-slate-400">
                  <tr>
                    <th className={th}>Date</th>
                    <th className={th}>Invoice No.</th>
                    <th className={th}>Charge Head</th>
                    <th className={`${th} text-right`}>Taxable Amount</th>
                    <th className={`${th} text-right`}>Tax (18%)</th>
                    <th className={th}>Status</th>
                  </tr>
                </thead>

                <tbody>
                  {transactions.map((t, i) => (
                    <motion.tr
                      key={t.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        duration: 0.5,
                        ease: EASE,
                        delay: i * 0.05,
                      }}
                      className="hover:bg-white/2"
                    >
                      <td className={`${td} whitespace-nowrap text-slate-400`}>
                        {t.date}
                      </td>

                      <td className={`${td} font-medium`}>{t.invoice}</td>

                      <td className={`${td} text-slate-300`}>{t.head}</td>

                      <td className={`${td} text-right text-slate-300`}>
                        {t.taxable}
                      </td>

                      <td className={`${td} text-right text-slate-300`}>
                        {t.tax}
                      </td>

                      <td className={td}>
                        <Badge
                          tone={
                            t.status === "Collected" ? "green" : "orange"
                          }
                        >
                          {t.status}
                        </Badge>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="mt-4 flex flex-col items-center justify-between gap-3 text-[11px] text-slate-400 sm:flex-row">
              <span>
                Showing 1-{transactions.length} of {transactions.length}
              </span>

              <div className="flex items-center gap-1">
                <button
                  type="button"
                  aria-label="Previous"
                  className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-[#272D39] hover:bg-white/5"
                >
                  <ChevronLeft className="h-3.5 w-3.5" />
                </button>

                <button
                  type="button"
                  className="h-7 w-7 cursor-pointer rounded-md border border-transparent bg-linear-to-br from-[#6C63FF] to-[#4DA3FF] text-[11px] font-semibold text-white"
                >
                  1
                </button>

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
      )}

      {/* Generate Report Modal */}
      <AddGenerateTaxReportModal
        open={openReport}
        onClose={() => setOpenReport(false)}
        onGenerate={handleGenerateReport}
      />
    </div>
  );
}
