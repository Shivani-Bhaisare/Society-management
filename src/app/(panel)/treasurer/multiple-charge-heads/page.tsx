"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import {
  ListChecks,
  CheckCircle2,
  Lock,
  SlidersHorizontal,
  Plus,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Pencil,
  Power,
  Trash2,
  EllipsisVertical,
  X,
} from "lucide-react";
import { Card, Badge } from "@/Components/ui";
import AddChargeHeadModal, {
  type AddChargeHeadPayload,
  type ChargeMethod,
} from "@/Components/AddChargeHeadModal";

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

/* ---------- Types + data (replace with API data later) ---------- */

type Charge = {
  id: number;
  name: string;
  method: ChargeMethod;
  value: number;
  frequency: string;
  status: "Active" | "Inactive";
};

// State of the three-dot dropdown (which row is open and where to draw it)
type RowMenu = { id: number; top: number; left: number };

// Dropdown size used for positioning (Edit + Status option + Delete)
const MENU_WIDTH = 184;
const MENU_HEIGHT = 140;

const initialCharges: Charge[] = [
  { id: 1, name: "Maintenance", method: "Fixed", value: 3000, frequency: "Monthly", status: "Active" },
  { id: 2, name: "Parking", method: "Fixed", value: 500, frequency: "Monthly", status: "Active" },
  { id: 3, name: "Penalty", method: "Percentage", value: 2, frequency: "Monthly", status: "Active" },
  { id: 4, name: "Club House", method: "Fixed", value: 1000, frequency: "Monthly", status: "Inactive" },
  { id: 5, name: "Water Charges", method: "Per Sq. Ft.", value: 10, frequency: "Monthly", status: "Active" },
];

// Options used in the Edit popup
const methodOptions: ChargeMethod[] = ["Fixed", "Percentage", "Per Sq. Ft."];
const frequencyOptions = ["Monthly", "Quarterly", "Half Yearly", "Yearly"];

/* ---------- Shared styles (same as Residents) ---------- */

const th =
  "bg-white/4 px-2 py-2 font-medium first:rounded-l-md last:rounded-r-md";
const td = "border-t border-[#272D39] px-2 py-2.5";
const field =
  "w-full rounded-lg border border-[#272D39] bg-[#10131A] px-3 py-2 text-xs text-slate-200 outline-none placeholder:text-slate-500 focus:border-[#A29CFF]/60";

// Shared style of every plain item inside the 3-dot action menu
const menuBtn =
  "flex w-full cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-left text-slate-300 transition-colors hover:bg-white/5";

/* ---------- Small helpers ---------- */

// Shows the amount in the format used by the table
function formatValue(c: Charge) {
  if (c.method === "Percentage") return `${c.value}%`;
  if (c.method === "Per Sq. Ft.") return `₹ ${c.value.toLocaleString("en-IN")} / sq.ft`;
  return `₹ ${c.value.toLocaleString("en-IN")}`;
}

// Row actions: a single 3-dot button that opens the action menu
function Actions({
  charge,
  menuOpen,
  onMore,
}: {
  charge: Charge;
  menuOpen: boolean;
  onMore: (e: React.MouseEvent<HTMLButtonElement>) => void;
}) {
  return (
    <button
      type="button"
      data-menu-btn
      title="More actions"
      aria-label={`Open actions menu for ${charge.name}`}
      aria-haspopup="menu"
      aria-expanded={menuOpen}
      onClick={onMore}
      className={`inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-[#272D39] text-slate-300 transition hover:bg-white/5 hover:text-white active:scale-90 ${
        menuOpen ? "bg-white/5 text-white" : ""
      }`}
    >
      <EllipsisVertical className="h-3.5 w-3.5" />
    </button>
  );
}

/* ---------- Edit Charge Head popup ---------- */

type EditChargeModalProps = {
  record: Charge;
  onClose: () => void;
  onSubmit: (updated: Charge) => void;
};

function EditChargeModal({ record, onClose, onSubmit }: EditChargeModalProps) {
  const [name, setName] = useState(record.name);
  const [method, setMethod] = useState<ChargeMethod>(record.method);
  const [value, setValue] = useState(String(record.value));
  const [frequency, setFrequency] = useState(record.frequency);
  const [status, setStatus] = useState<Charge["status"]>(record.status);
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
    const num = Number(value);

    if (!name.trim()) {
      setError("Please enter the charge name.");
      return;
    }
    if (!num || num <= 0) {
      setError("Please enter a valid amount / rate.");
      return;
    }
    if (method === "Percentage" && num > 100) {
      setError("Percentage cannot be more than 100.");
      return;
    }

    onSubmit({
      ...record,
      name: name.trim(),
      method,
      value: num,
      frequency,
      status,
    });
  };

  // Frequency list always contains the current value (even if it is a custom one)
  const freqList = frequencyOptions.includes(frequency)
    ? frequencyOptions
    : [...frequencyOptions, frequency];

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
        className="w-full max-w-md rounded-xl border border-[#272D39] bg-[#10131A] p-5 text-white shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-bold">Edit Charge Head</h2>
            <p className="text-[11px] text-slate-400">
              Update the details of {record.name}
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
          <label className="flex flex-col gap-1 text-[11px] text-slate-400">
            Charge Name
            <input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError("");
              }}
              className={field}
              autoFocus
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-[11px] text-slate-400">
              Calculation Method
              <div className="relative">
                <select
                  value={method}
                  onChange={(e) => setMethod(e.target.value as ChargeMethod)}
                  className={`${field} cursor-pointer appearance-none pr-8`}
                >
                  {methodOptions.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
              </div>
            </label>

            <label className="flex flex-col gap-1 text-[11px] text-slate-400">
              {method === "Percentage" ? "Rate (%)" : "Amount / Rate (₹)"}
              <input
                type="number"
                min={0}
                value={value}
                onChange={(e) => {
                  setValue(e.target.value);
                  setError("");
                }}
                className={field}
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-[11px] text-slate-400">
              Frequency
              <div className="relative">
                <select
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                  className={`${field} cursor-pointer appearance-none pr-8`}
                >
                  {freqList.map((f) => (
                    <option key={f} value={f}>
                      {f}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
              </div>
            </label>

            <label className="flex flex-col gap-1 text-[11px] text-slate-400">
              Status
              <div className="relative">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as Charge["status"])}
                  className={`${field} cursor-pointer appearance-none pr-8`}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
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
  record: Charge;
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
            <h2 className="text-base font-bold">Delete Charge Head</h2>
            <p className="text-[11px] text-slate-400">
              This action cannot be undone.
            </p>
          </div>
        </div>

        <p className="mt-4 text-xs text-slate-300">
          Are you sure you want to delete{" "}
          <span className="font-semibold text-white">{record.name}</span>?
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
export default function MultipleChargeHeadsPage() {
  const [charges, setCharges] = useState<Charge[]>(initialCharges);
  const [open, setOpen] = useState(false);

  // Charge head open in the Edit popup / Delete popup (null = closed)
  const [editing, setEditing] = useState<Charge | null>(null);
  const [deleting, setDeleting] = useState<Charge | null>(null);
  // Small success message after an action
  const [toast, setToast] = useState("");

  // Three-dot dropdown state
  const [menu, setMenu] = useState<RowMenu | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Hide the success message after 3 seconds
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  // Close the dropdown on outside click, Escape key or page scroll
  useEffect(() => {
    if (!menu) return;

    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      // Ignore clicks on the dropdown itself and on the three-dot buttons (they toggle on their own)
      if (
        menuRef.current?.contains(target) ||
        target.closest("[data-menu-btn]")
      )
        return;
      setMenu(null);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenu(null);
    };
    const onScroll = () => setMenu(null);

    document.addEventListener("mousedown", onMouseDown);
    document.addEventListener("keydown", onKeyDown);
    window.addEventListener("scroll", onScroll, true);
    window.addEventListener("resize", onScroll);
    return () => {
      document.removeEventListener("mousedown", onMouseDown);
      document.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("scroll", onScroll, true);
      window.removeEventListener("resize", onScroll);
    };
  }, [menu]);

  // Summary numbers are calculated from the list
  const total = charges.length;
  const activeCount = charges.filter((c) => c.status === "Active").length;
  const fixedCount = charges.filter((c) => c.method === "Fixed").length;
  const variableCount = total - fixedCount;

  const stats = [
    {
      label: "Total Charge Heads",
      value: String(total),
      sub: "All configured charges",
      subC: "text-slate-400",
      icon: ListChecks,
      c: "#3B82F6",
    },
    {
      label: "Active",
      value: String(activeCount),
      sub: "Used in billing",
      subC: "text-emerald-400",
      icon: CheckCircle2,
      c: "#00C2B8",
    },
    {
      label: "Fixed Charges",
      value: String(fixedCount),
      sub: "Same amount every cycle",
      subC: "text-slate-400",
      icon: Lock,
      c: "#F59E0B",
    },
    {
      label: "Variable Charges",
      value: String(variableCount),
      sub: "Percentage / per sq. ft.",
      subC: "text-slate-400",
      icon: SlidersHorizontal,
      c: "#8B5CF6",
    },
  ];

  // Add the new charge head from the drawer to the table (replace with an API call later)
  const handleSave = (data: AddChargeHeadPayload) => {
    setCharges((prev) => [
      ...prev,
      {
        id: data.id,
        name: data.name,
        method: data.method,
        value: data.value,
        frequency: data.freq,
        status: data.active ? "Active" : "Inactive",
      },
    ]);
  };

  // Edit: save the changed details (replace with an API call later)
  const handleEdit = (updated: Charge) => {
    setCharges((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    setToast(`${updated.name} updated`);
    setEditing(null);
  };

  // Activate / Deactivate: flips the status (replace with an API call later)
  const toggleStatus = (c: Charge) => {
    const next: Charge["status"] = c.status === "Active" ? "Inactive" : "Active";
    setMenu(null);
    setCharges((prev) =>
      prev.map((x) => (x.id === c.id ? { ...x, status: next } : x)),
    );
    setToast(`${c.name} is now ${next}`);
  };

  // Delete: removes the charge head (replace with an API call later)
  const handleDelete = () => {
    if (!deleting) return;
    setCharges((prev) => prev.filter((c) => c.id !== deleting.id));
    setToast(`${deleting.name} deleted`);
    setDeleting(null);
  };

  // Three-dot click: toggle the dropdown under the clicked button (flips up near the bottom of the screen)
  const toggleMenu = (e: React.MouseEvent<HTMLButtonElement>, id: number) => {
    if (menu?.id === id) {
      setMenu(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const openUp = rect.bottom + MENU_HEIGHT + 8 > window.innerHeight;
    setMenu({
      id,
      top: openUp ? rect.top - MENU_HEIGHT - 4 : rect.bottom + 4,
      left: Math.max(8, rect.right - MENU_WIDTH),
    });
  };

  // The charge head the open dropdown belongs to
  const menuCharge = menu ? charges.find((c) => c.id === menu.id) : null;

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
            Charge Head Management
          </h1>
          <p className="text-xs text-slate-400">
            Configure and manage charge heads for maintenance billing
          </p>
        </motion.div>

        {/* Add button: opens the drawer on click */}
        <motion.div variants={item}>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-linear-to-r from-[#6C63FF] to-[#4DA3FF] px-4 py-2.5 text-xs font-semibold text-white transition hover:opacity-90 active:scale-95"
          >
            <Plus className="h-3.5 w-3.5" /> Add Charge Head
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

      {/* Charge heads table */}
      <motion.div
        variants={item}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
      >
        <Card
          title="Charge Heads"
          sub={`Total ${charges.length} charge heads`}
        >
          {/* Table scrolls sideways on small screens */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-160 text-left text-[11px]">
              <thead className="text-slate-400">
                <tr>
                  <th className={th}>#</th>
                  <th className={th}>Charge Name</th>
                  <th className={th}>Calculation Method</th>
                  <th className={th}>Amount / Rate</th>
                  <th className={th}>Frequency</th>
                  <th className={th}>Status</th>
                  <th className={`${th} text-center`}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {charges.map((c, i) => (
                  <motion.tr
                    key={c.id}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={VIEWPORT}
                    transition={{ duration: 0.5, ease: EASE, delay: i * 0.05 }}
                    className="hover:bg-white/2"
                  >
                    <td className={`${td} text-slate-400`}>{i + 1}</td>
                    <td className={`${td} font-medium`}>{c.name}</td>
                    <td className={`${td} text-slate-300`}>{c.method}</td>
                    <td className={`${td} whitespace-nowrap text-slate-300`}>
                      {formatValue(c)}
                    </td>
                    <td className={`${td} text-slate-400`}>{c.frequency}</td>
                    <td className={td}>
                      <Badge tone={c.status === "Active" ? "green" : "gray"}>
                        {c.status}
                      </Badge>
                    </td>

                    {/* Actions: single 3-dot button (same as Vendors) */}
                    <td className={`${td} text-center`}>
                      <Actions
                        charge={c}
                        menuOpen={menu?.id === c.id}
                        onMore={(e) => toggleMenu(e, c.id)}
                      />
                    </td>
                  </motion.tr>
                ))}

                {charges.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className={`${td} py-8 text-center text-slate-500`}
                    >
                      No charge heads found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-4 flex flex-col items-center justify-between gap-3 text-[11px] text-slate-400 sm:flex-row">
            <span>
              Showing 1-{charges.length} of {charges.length}
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

      {/* Three-dot dropdown: fixed position so the table's overflow does not clip it */}
      {menu && menuCharge && (
        <div
          ref={menuRef}
          role="menu"
          style={{ top: menu.top, left: menu.left, width: MENU_WIDTH }}
          className="fixed z-50 overflow-hidden rounded-lg border border-[#272D39] bg-[#10131A] p-1 text-[11px] shadow-xl shadow-black/40"
        >
          {/* Edit: opens the edit popup */}
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setEditing(menuCharge);
              setMenu(null);
            }}
            className={menuBtn}
          >
            <Pencil className="h-3.5 w-3.5" /> Edit
          </button>

          {/* Divider */}
          <div className="my-1 border-t border-[#272D39]" />

          {/* Status option: the status the charge head is not in right now */}
          <button
            type="button"
            role="menuitem"
            onClick={() => toggleStatus(menuCharge)}
            className={`${menuBtn} ${
              menuCharge.status === "Active"
                ? "hover:text-slate-200"
                : "hover:text-emerald-400"
            }`}
          >
            <Power className="h-3.5 w-3.5" /> Mark as{" "}
            {menuCharge.status === "Active" ? "Inactive" : "Active"}
          </button>

          {/* Divider */}
          <div className="my-1 border-t border-[#272D39]" />

          {/* Delete: opens the confirm popup */}
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setDeleting(menuCharge);
              setMenu(null);
            }}
            className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-left text-red-400 transition-colors hover:bg-red-500/10"
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
        </div>
      )}

      {/* Add Charge Head drawer */}
      <AddChargeHeadModal
        open={open}
        onClose={() => setOpen(false)}
        onSave={handleSave}
      />

      {/* Edit popup */}
      <AnimatePresence>
        {editing && (
          <EditChargeModal
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