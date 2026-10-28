"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import {
  FileText,
  Clock,
  CheckCircle2,
  Wallet,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Eye,
  Pencil,
  BadgeCheck,
  Trash2,
  X,
} from "lucide-react";
import { Card, Badge } from "@/Components/ui";
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

type Status = "Pending" | "Approved" | "Under Review" | "Paid" | "Draft";

type VendorBill = {
  id: number;
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

// Status choices inside the Edit popup (without "All Status")
const editStatusOptions: Status[] = ["Pending", "Approved", "Under Review", "Paid", "Draft"];

const toneFor = (s: Status) =>
  s === "Paid" || s === "Approved"
    ? "green"
    : s === "Pending"
      ? "orange"
      : "blue";

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

// Small icon button used in the Actions column
const iconBtn =
  "cursor-pointer rounded-md p-1.5 transition active:scale-90";

/* ---------- View Details popup ---------- */

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-[#272D39] py-2 text-[11px] first:border-t-0">
      <span className="text-slate-400">{label}</span>
      <span className="text-right font-medium text-slate-200">{value}</span>
    </div>
  );
}

type ViewBillModalProps = {
  record: VendorBill;
  onClose: () => void;
};

function ViewBillModal({ record, onClose }: ViewBillModalProps) {
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
            <h2 className="text-sm font-bold">Invoice Details</h2>
            <p className="truncate text-[11px] text-slate-400">
              {record.vendor} · {record.invoiceNo}
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
          <Badge tone={toneFor(record.status)}>{record.status}</Badge>
        </div>

        {/* Amount */}
        <div className="mt-2 rounded-lg border border-[#272D39] bg-white/3 px-3 py-2.5">
          <p className="text-[11px] text-slate-400">Invoice Amount</p>
          <p className="mt-0.5 text-lg font-bold">{record.amount}</p>
        </div>

        {/* Invoice details */}
        <div className="mt-2 rounded-lg border border-[#272D39] bg-white/3 px-3">
          <DetailRow label="Invoice No." value={record.invoiceNo} />
          <DetailRow label="Vendor" value={record.vendor} />
          <DetailRow label="Category" value={record.category} />
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

/* ---------- Edit Vendor Bill popup ---------- */

type EditBillModalProps = {
  record: VendorBill;
  onClose: () => void;
  onSubmit: (updated: VendorBill) => void;
};

function EditBillModal({ record, onClose, onSubmit }: EditBillModalProps) {
  const [invoiceNo, setInvoiceNo] = useState(record.invoiceNo);
  const [vendor, setVendor] = useState(record.vendor);
  const [category, setCategory] = useState(record.category === "-" ? "" : record.category);
  const [amount, setAmount] = useState(String(toNumber(record.amount)));
  const [status, setStatus] = useState<Status>(record.status);
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
    const num = Number(amount);

    if (!invoiceNo.trim()) {
      setError("Please enter the invoice number.");
      return;
    }
    if (!vendor.trim()) {
      setError("Please enter the vendor name.");
      return;
    }
    if (!num || num <= 0) {
      setError("Please enter a valid amount.");
      return;
    }

    onSubmit({
      ...record,
      invoiceNo: invoiceNo.trim(),
      vendor: vendor.trim(),
      category: category.trim() || "-",
      amount: toMoney(num),
      status,
    });
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
            <h2 className="text-base font-bold">Edit Vendor Bill</h2>
            <p className="text-[11px] text-slate-400">
              Update the details of {record.invoiceNo}
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

        {/* Form fields */}
        <div className="mt-4 flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-[11px] text-slate-400">
              Invoice No.
              <input
                value={invoiceNo}
                onChange={(e) => {
                  setInvoiceNo(e.target.value);
                  setError("");
                }}
                className={field}
                autoFocus
              />
            </label>

            <label className="flex flex-col gap-1 text-[11px] text-slate-400">
              Amount (₹)
              <input
                type="number"
                min={0}
                value={amount}
                onChange={(e) => {
                  setAmount(e.target.value);
                  setError("");
                }}
                className={field}
              />
            </label>
          </div>

          <label className="flex flex-col gap-1 text-[11px] text-slate-400">
            Vendor
            <input
              value={vendor}
              onChange={(e) => {
                setVendor(e.target.value);
                setError("");
              }}
              className={field}
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-[11px] text-slate-400">
              Category
              <input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="e.g. Plumbing"
                className={field}
              />
            </label>

            <label className="flex flex-col gap-1 text-[11px] text-slate-400">
              Status
              <div className="relative">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as Status)}
                  className={`${field} cursor-pointer appearance-none pr-8`}
                >
                  {editStatusOptions.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
              </div>
            </label>
          </div>

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
            Save Changes
          </button>
        </div>
      </motion.form>
    </motion.div>
  );
}

/* ---------- Delete confirm popup ---------- */

type DeleteConfirmProps = {
  record: VendorBill;
  onClose: () => void;
  onConfirm: () => void;
};

function DeleteConfirm({ record, onClose, onConfirm }: DeleteConfirmProps) {
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
        className="w-full max-w-sm rounded-xl border border-[#272D39] bg-[#10131A] p-5 text-white shadow-2xl"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-500/15 text-red-400">
            <Trash2 className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-base font-bold">Delete Vendor Bill</h2>
            <p className="text-[11px] text-slate-400">
              This action cannot be undone.
            </p>
          </div>
        </div>

        <p className="mt-4 text-xs text-slate-300">
          Are you sure you want to delete invoice{" "}
          <span className="font-semibold text-white">{record.invoiceNo}</span>{" "}
          of {record.vendor}?
        </p>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg border border-[#272D39] px-4 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/5 active:scale-95"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className="cursor-pointer rounded-lg bg-red-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-red-600 active:scale-95"
          >
            Delete
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ---------- Page ---------- */
export default function VendorBillsPage() {
  const [bills, setBills] = useState<VendorBill[]>(initialBills);
  const [open, setOpen] = useState(false); // Add Vendor Bill drawer open / close
  const [status, setStatus] = useState(statusOptions[0]);
  const [q, setQ] = useState("");

  // Bill open in the View / Edit / Delete popup (null = closed)
  const [viewing, setViewing] = useState<VendorBill | null>(null);
  const [editing, setEditing] = useState<VendorBill | null>(null);
  const [deleting, setDeleting] = useState<VendorBill | null>(null);
  // Small success message after an action
  const [toast, setToast] = useState("");

  // Hide the success message after 3 seconds
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  // Filter rows by status and search text
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return bills.filter(
      (b) =>
        (status === "All Status" || b.status === status) &&
        (!s || `${b.invoiceNo} ${b.vendor} ${b.category}`.toLowerCase().includes(s)),
    );
  }, [bills, status, q]);

  // Add the saved bill to the table (replace with an API call later)
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

  // Edit: save the changed details (replace with an API call later)
  const handleEdit = (updated: VendorBill) => {
    setBills((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
    setToast(`${updated.invoiceNo} updated`);
    setEditing(null);
  };

  // Approve / Mark as Paid: changes only the status (replace with an API call later)
  const changeStatus = (b: VendorBill, next: Status) => {
    setBills((prev) => prev.map((x) => (x.id === b.id ? { ...x, status: next } : x)));
    setToast(`${b.invoiceNo} is now ${next}`);
  };

  // Delete: removes the bill (replace with an API call later)
  const handleDelete = () => {
    if (!deleting) return;
    setBills((prev) => prev.filter((b) => b.id !== deleting.id));
    setToast(`${deleting.invoiceNo} deleted`);
    setDeleting(null);
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
            onClick={() => setOpen(true)}
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
                    key={b.id}
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

                    {/* Actions: icons directly in the row (no 3-dot menu) */}
                    <td className={`${td} text-right`}>
                      <div className="flex items-center justify-end gap-0.5">
                        {/* View Details */}
                        <button
                          type="button"
                          title="View Details"
                          aria-label="View Details"
                          onClick={() => setViewing(b)}
                          className={`${iconBtn} text-slate-400 hover:bg-white/5 hover:text-white`}
                        >
                          <Eye className="h-4 w-4" />
                        </button>

                        {/* Edit */}
                        <button
                          type="button"
                          title="Edit"
                          aria-label="Edit"
                          onClick={() => setEditing(b)}
                          className={`${iconBtn} text-slate-400 hover:bg-white/5 hover:text-[#A29CFF]`}
                        >
                          <Pencil className="h-4 w-4" />
                        </button>

                        {/* Approve: only for bills that are not approved / paid yet */}
                        {(b.status === "Pending" ||
                          b.status === "Under Review" ||
                          b.status === "Draft") && (
                          <button
                            type="button"
                            title="Approve"
                            aria-label="Approve"
                            onClick={() => changeStatus(b, "Approved")}
                            className={`${iconBtn} text-slate-400 hover:bg-emerald-500/10 hover:text-emerald-400`}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                          </button>
                        )}

                        {/* Mark as Paid: only for approved bills */}
                        {b.status === "Approved" && (
                          <button
                            type="button"
                            title="Mark as Paid"
                            aria-label="Mark as Paid"
                            onClick={() => changeStatus(b, "Paid")}
                            className={`${iconBtn} text-slate-400 hover:bg-[#8B5CF6]/10 hover:text-[#8B5CF6]`}
                          >
                            <BadgeCheck className="h-4 w-4" />
                          </button>
                        )}

                        {/* Delete */}
                        <button
                          type="button"
                          title="Delete"
                          aria-label="Delete"
                          onClick={() => setDeleting(b)}
                          className={`${iconBtn} text-red-400 hover:bg-red-500/10`}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
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

      {/* Add Vendor Bill drawer */}
      <AddVendorBillModal
        open={open}
        onClose={() => setOpen(false)}
        onSave={handleSave}
      />

      {/* View Details popup */}
      <AnimatePresence>
        {viewing && (
          <ViewBillModal
            key={viewing.id}
            record={viewing}
            onClose={() => setViewing(null)}
          />
        )}
      </AnimatePresence>

      {/* Edit popup */}
      <AnimatePresence>
        {editing && (
          <EditBillModal
            key={editing.id}
            record={editing}
            onClose={() => setEditing(null)}
            onSubmit={handleEdit}
          />
        )}
      </AnimatePresence>

      {/* Delete confirm popup */}
      <AnimatePresence>
        {deleting && (
          <DeleteConfirm
            key={deleting.id}
            record={deleting}
            onClose={() => setDeleting(null)}
            onConfirm={handleDelete}
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