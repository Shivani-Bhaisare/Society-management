"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import {
  FileBarChart,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  MoreVertical,
  Eye,
  Download,
  Trash2,
  X,
} from "lucide-react";
import { Card, Badge } from "@/Components/ui";
import AddGenerateReportModal, {
  type GenerateReportPayload,
} from "@/Components/AddGenerateReportModal";

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

type Report = {
  id: number;
  name: string;
  period: string;
  generatedBy: string;
  generatedOn: string;
  format: string;
  status: "Ready" | "Processing";
};

const initialReports: Report[] = [
  { id: 1, name: "General Ledger", period: "Apr 2025 - Mar 2026", generatedBy: "Rohit Sharma", generatedOn: "15 Apr 2025", format: "PDF", status: "Ready" },
  { id: 2, name: "Receivables Report", period: "Apr 2025 - Mar 2026", generatedBy: "Priya Singh", generatedOn: "12 Apr 2025", format: "PDF", status: "Ready" },
  { id: 3, name: "Payables Report", period: "Apr 2025 - Mar 2026", generatedBy: "Amit Kumar", generatedOn: "10 Apr 2025", format: "Excel", status: "Ready" },
  { id: 4, name: "Bank Reconciliation", period: "Oct 2025", generatedBy: "Rohit Sharma", generatedOn: "08 Nov 2025", format: "PDF", status: "Ready" },
  { id: 5, name: "Financial Statements", period: "Apr 2025 - Mar 2026", generatedBy: "Neha Gupta", generatedOn: "05 Apr 2025", format: "PDF", status: "Ready" },
];

const financialYears = ["2025-26", "2024-25", "2023-24"];
const reportTypes = [
  "All Reports",
  "General Ledger",
  "Receivables Report",
  "Payables Report",
  "Bank Reconciliation",
  "Financial Statements",
];

/* ---------- Helpers ---------- */

// "2025-04-01" -> "Apr 2025"
const monthYear = (v: string) =>
  new Date(`${v}T00:00:00`).toLocaleDateString("en-GB", {
    month: "short",
    year: "numeric",
  });

// Today as "27 Oct 2026"
const todayText = () =>
  new Date().toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

/* ---------- Shared styles (same as Residents) ---------- */

const th =
  "bg-white/4 px-2 py-2 font-medium first:rounded-l-md last:rounded-r-md";
const td = "border-t border-[#272D39] px-2 py-2.5";
const field =
  "w-full rounded-lg border border-[#272D39] bg-[#10131A] px-3 py-2 text-xs text-slate-200 outline-none placeholder:text-slate-500 focus:border-[#A29CFF]/60";

/* ---------- Row actions menu (3 dots) ---------- */

const MENU_W = 176; // menu width in px
const MENU_H = 128; // approx menu height, used to flip it upwards near the screen bottom

function RowActions({
  report,
  onView,
  onDownload,
  onDelete,
}: {
  report: Report;
  onView: () => void;
  onDownload: () => void;
  onDelete: () => void;
}) {
  const btnRef = useRef<HTMLButtonElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  const close = useCallback(() => setPos(null), []);

  // Open the menu next to the button (fixed position, so the table does not clip it)
  function toggle() {
    if (pos) return close();
    const r = btnRef.current?.getBoundingClientRect();
    if (!r) return;
    const left = Math.max(8, Math.min(r.right - MENU_W, window.innerWidth - MENU_W - 8));
    const openUp = r.bottom + MENU_H + 8 > window.innerHeight;
    const top = openUp ? r.top - MENU_H - 4 : r.bottom + 4;
    setPos({ top, left });
  }

  // Close on Esc, scroll or resize while the menu is open
  useEffect(() => {
    if (!pos) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [pos, close]);

  const ready = report.status === "Ready";

  const itemCls =
    "flex w-full cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-left text-[11px] transition-colors hover:bg-white/5 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent";

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        aria-label="Actions"
        aria-haspopup="menu"
        aria-expanded={!!pos}
        onClick={toggle}
        className={`cursor-pointer rounded-md p-1 text-slate-400 hover:bg-white/5 ${pos ? "bg-white/5 text-white" : ""}`}
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {pos &&
        createPortal(
          <>
            {/* Transparent backdrop: click outside closes the menu */}
            <div className="fixed inset-0 z-90" onClick={close} />
            <div
              role="menu"
              style={{ top: pos.top, left: pos.left, width: MENU_W }}
              className="fixed z-91 rounded-lg border border-[#272D39] bg-[#10131A] p-1 text-white shadow-2xl"
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => { close(); onView(); }}
                className={itemCls}
              >
                <Eye className="h-3.5 w-3.5 text-slate-400" /> View Details
              </button>
              <button
                type="button"
                role="menuitem"
                disabled={!ready}
                title={ready ? "" : "Report is still processing"}
                onClick={() => { close(); onDownload(); }}
                className={itemCls}
              >
                <Download className="h-3.5 w-3.5 text-slate-400" /> Download
              </button>
              <div className="my-1 h-px bg-[#272D39]" />
              <button
                type="button"
                role="menuitem"
                onClick={() => { close(); onDelete(); }}
                className={`${itemCls} text-red-400`}
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
            </div>
          </>,
          document.body,
        )}
    </>
  );
}

/* ---------- Small centered dialog (used for View + Delete) ---------- */

function Dialog({
  open,
  title,
  onClose,
  children,
  footer,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  // Close on Esc while the dialog is open
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={onClose}
          className="fixed inset-0 z-100 flex items-center justify-center bg-black/70 p-3 backdrop-blur-sm sm:p-6"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 12 }}
            transition={{ duration: 0.25, ease: EASE }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-sm overflow-hidden rounded-2xl border border-[#272D39] bg-[#10131A] text-white shadow-2xl"
          >
            <div className="flex items-center justify-between gap-3 border-b border-[#272D39] p-4">
              <h2 className="text-sm font-bold">{title}</h2>
              <button
                type="button"
                onClick={onClose}
                aria-label="Close"
                className="cursor-pointer rounded-lg p-1.5 text-slate-300 hover:bg-white/5 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="p-4">{children}</div>
            <div className="flex justify-end gap-2 border-t border-[#272D39] p-4">
              {footer}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}

/* ---------- Page ---------- */
export default function AuditReportsPage() {
  const [year, setYear] = useState(financialYears[0]);
  const [type, setType] = useState(reportTypes[0]);

  // Reports list (new reports are added here) + modal open state
  const [reports, setReports] = useState<Report[]>(initialReports);
  const [openGenerate, setOpenGenerate] = useState(false);

  // Row action dialogs
  const [viewing, setViewing] = useState<Report | null>(null);
  const [deleting, setDeleting] = useState<Report | null>(null);

  // Filter rows by report type
  const list = useMemo(
    () => reports.filter((r) => type === "All Reports" || r.name === type),
    [reports, type],
  );

  // Called when the Generate Report modal is submitted
  function handleGenerate(data: GenerateReportPayload) {
    // TODO: call the API here
    const newReport: Report = {
      id: data.id,
      name: data.reportType,
      period:
        monthYear(data.dateFrom) === monthYear(data.dateTo)
          ? monthYear(data.dateFrom)
          : `${monthYear(data.dateFrom)} - ${monthYear(data.dateTo)}`,
      generatedBy: "You",
      generatedOn: todayText(),
      format: data.format,
      status: "Processing",
    };

    // Newest report on top, and show all reports so the new row is visible
    setReports((prev) => [newReport, ...prev]);
    setType(reportTypes[0]);
  }

  // Download a report
  function handleDownload(r: Report) {
    // TODO: replace with the real file URL from the API (e.g. window.open(r.fileUrl))
    // For now a small placeholder text file is downloaded
    const text = [
      `Report: ${r.name}`,
      `Period: ${r.period}`,
      `Generated By: ${r.generatedBy}`,
      `Generated On: ${r.generatedOn}`,
      `Format: ${r.format}`,
    ].join("\n");
    const url = URL.createObjectURL(new Blob([text], { type: "text/plain" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = `${r.name.replace(/\s+/g, "-")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Delete a report after the user confirms
  function confirmDelete() {
    if (!deleting) return;
    // TODO: call the delete API here
    setReports((prev) => prev.filter((r) => r.id !== deleting.id));
    setDeleting(null);
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
            Audit &amp; Compliance Reports
          </h1>
          <p className="text-xs text-slate-400">
            Generate reports for audit and compliance
          </p>
        </motion.div>

        {/* Generate button (opens the Generate Report modal) */}
        <motion.div variants={item}>
          <button
            type="button"
            onClick={() => setOpenGenerate(true)}
            className="flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-linear-to-r from-[#6C63FF] to-[#4DA3FF] px-4 py-2.5 text-xs font-semibold text-white transition hover:opacity-90 active:scale-95"
          >
            <FileBarChart className="h-3.5 w-3.5" /> Generate Report
          </button>
        </motion.div>
      </motion.div>

      {/* Filters */}
      <motion.div
        variants={item}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
        className="grid grid-cols-1 gap-2 rounded-xl border border-[#272D39] bg-[#10131A] p-3 min-[480px]:grid-cols-2 lg:grid-cols-[200px_200px]"
      >
        <label className="flex flex-col gap-1 text-[11px] text-slate-400">
          <span>Financial Year</span>
          <span className="relative block">
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className={`${field} cursor-pointer appearance-none pr-8`}
            >
              {financialYears.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
          </span>
        </label>

        <label className="flex flex-col gap-1 text-[11px] text-slate-400">
          <span>Report Type</span>
          <span className="relative block">
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className={`${field} cursor-pointer appearance-none pr-8`}
            >
              {reportTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
          </span>
        </label>
      </motion.div>

      {/* Reports table */}
      <motion.div
        variants={item}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
      >
        <Card title="Generated Reports" sub={`Total ${list.length} reports`}>
          {/* Table scrolls sideways on small screens */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-180 text-left text-[11px]">
              <thead className="text-slate-400">
                <tr>
                  <th className={th}>Report Name</th>
                  <th className={th}>Period</th>
                  <th className={th}>Generated By</th>
                  <th className={th}>Generated On</th>
                  <th className={th}>Status</th>
                  <th className={`${th} text-right`}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.map((r, i) => (
                  <motion.tr
                    key={r.id}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={VIEWPORT}
                    transition={{ duration: 0.5, ease: EASE, delay: i * 0.05 }}
                    className="hover:bg-white/2"
                  >
                    <td className={`${td} font-medium`}>{r.name}</td>
                    <td className={`${td} text-slate-300`}>{r.period}</td>
                    <td className={`${td} text-slate-300`}>{r.generatedBy}</td>
                    <td className={`${td} whitespace-nowrap text-slate-400`}>
                      {r.generatedOn}
                    </td>
                    <td className={td}>
                      <Badge tone={r.status === "Ready" ? "green" : "orange"}>
                        {r.status}
                      </Badge>
                    </td>
                    <td className={`${td} text-right`}>
                      <RowActions
                        report={r}
                        onView={() => setViewing(r)}
                        onDownload={() => handleDownload(r)}
                        onDelete={() => setDeleting(r)}
                      />
                    </td>
                  </motion.tr>
                ))}

                {list.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className={`${td} py-8 text-center text-slate-500`}
                    >
                      No reports found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-4 flex flex-col items-center justify-between gap-3 text-[11px] text-slate-400 sm:flex-row">
            <span>Showing 1-{list.length} of 20</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Previous"
                className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-[#272D39] hover:bg-white/5"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              {[1, 2, 3, 4].map((p) => (
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

      {/* Generate Report modal */}
      <AddGenerateReportModal
        open={openGenerate}
        onClose={() => setOpenGenerate(false)}
        onGenerate={handleGenerate}
      />

      {/* View details dialog */}
      <Dialog
        open={!!viewing}
        title="Report Details"
        onClose={() => setViewing(null)}
        footer={
          <>
            <button
              type="button"
              onClick={() => setViewing(null)}
              className="cursor-pointer rounded-md border border-[#272D39] px-3.5 py-1.5 text-[11px] font-semibold text-white hover:bg-white/5"
            >
              Close
            </button>
            {viewing?.status === "Ready" && (
              <button
                type="button"
                onClick={() => handleDownload(viewing)}
                className="flex cursor-pointer items-center gap-1.5 rounded-md bg-linear-to-r from-[#6C63FF] to-[#4DA3FF] px-3.5 py-1.5 text-[11px] font-semibold text-white hover:opacity-90"
              >
                <Download className="h-3 w-3" /> Download
              </button>
            )}
          </>
        }
      >
        {viewing && (
          <div className="overflow-hidden rounded-md border border-[#272D39] bg-[#0B0E14]">
            {(
              [
                ["Report Name", viewing.name],
                ["Period", viewing.period],
                ["Generated By", viewing.generatedBy],
                ["Generated On", viewing.generatedOn],
                ["Format", viewing.format],
                ["Status", viewing.status],
              ] as const
            ).map(([label, value], i) => (
              <div
                key={label}
                className={`flex items-center justify-between gap-3 px-3 py-2.5 text-[11px] ${
                  i > 0 ? "border-t border-[#272D39]" : ""
                }`}
              >
                <span className="shrink-0 text-slate-400">{label}</span>
                <span className="min-w-0 break-words text-right font-medium">{value}</span>
              </div>
            ))}
          </div>
        )}
      </Dialog>

      {/* Delete confirm dialog */}
      <Dialog
        open={!!deleting}
        title="Delete Report"
        onClose={() => setDeleting(null)}
        footer={
          <>
            <button
              type="button"
              onClick={() => setDeleting(null)}
              className="cursor-pointer rounded-md border border-[#272D39] px-3.5 py-1.5 text-[11px] font-semibold text-white hover:bg-white/5"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={confirmDelete}
              className="flex cursor-pointer items-center gap-1.5 rounded-md bg-red-500 px-3.5 py-1.5 text-[11px] font-semibold text-white hover:bg-red-600"
            >
              <Trash2 className="h-3 w-3" /> Delete
            </button>
          </>
        }
      >
        <p className="text-[11px] leading-relaxed text-slate-300">
          Are you sure you want to delete{" "}
          <span className="font-semibold text-white">{deleting?.name}</span> (
          {deleting?.period})? This action cannot be undone.
        </p>
      </Dialog>
    </div>
  );
}