"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import {
  Search,
  Plus,
  Eye,
  Pencil,
  EllipsisVertical,
  Building2,
  Star,
  Store,
  CheckCircle2,
  FileClock,
  TimerReset,
  ChevronDown,
  Phone,
  Trash2,
  Clock3,
  Ban,
  X,
  type LucideIcon,
} from "lucide-react";
import { Card, Badge } from "@/Components/ui";
import AddVendorModal, {
  type VendorPayload,
} from "@/Components/AddVendorModal";

/* ---------- Animation ---------- */

// Smooth "expo-out" curve: starts fast, settles softly
const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

// Replays every time a section enters the screen (set once: true to play only once)
const VIEWPORT = { once: false, amount: 0.15 };

// Container: children appear one after another
const container: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
};

// Each child fades in while moving up and scaling slightly
const item: Variants = {
  hidden: { opacity: 0, y: 30, scale: 0.97 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.7, ease: EASE },
  },
};

/* ---------- Types ---------- */
// Match the modal's options
type Service =
  | "Security"
  | "Plumbing"
  | "Electrical"
  | "Housekeeping"
  | "Gardening"
  | "Lift / Elevator"
  | "Pest Control"
  | "Painting"
  | "Other";
type State = "Active" | "Pending" | "Inactive" | "Expired";

type VendorRow = {
  id: number;
  name: string;
  service: Service;
  phone: string;
  contract: string; // e.g. "2026 - 2027"
  rating: number; // 0 = not rated
  status: State;
  endDate?: string; // contract end (YYYY-MM-DD), only for new vendors
  isNew?: boolean; // added via the modal
};

// State of the three-dot dropdown (which row is open and where to draw it)
type RowMenu = { id: number; top: number; left: number };

// Dropdown size used for positioning
const MENU_WIDTH = 184;
const MENU_HEIGHT = 210;

/* ---------- Data (replace with API later) ---------- */
const initialVendors: VendorRow[] = [
  {
    id: 1,
    name: "ABC Security Services",
    service: "Security",
    phone: "98765 43210",
    contract: "2026 - 2027",
    rating: 4.5,
    status: "Active",
  },
  {
    id: 2,
    name: "XYZ Plumbing Co.",
    service: "Plumbing",
    phone: "98765 12345",
    contract: "2026 - 2027",
    rating: 4.2,
    status: "Active",
  },
  {
    id: 3,
    name: "Sunrise Electricals",
    service: "Electrical",
    phone: "87654 21098",
    contract: "2026 - 2027",
    rating: 4.0,
    status: "Active",
  },
  {
    id: 4,
    name: "Fresh Care Pest Control",
    service: "Pest Control",
    phone: "86543 12098",
    contract: "2026 - 2027",
    rating: 3.8,
    status: "Pending",
  },
];

const services: Service[] = [
  "Security",
  "Plumbing",
  "Electrical",
  "Housekeeping",
  "Gardening",
  "Lift / Elevator",
  "Pest Control",
  "Painting",
  "Other",
];
const states: State[] = ["Active", "Pending", "Inactive", "Expired"];

const statusTone: Record<State, "green" | "orange" | "red" | "gray"> = {
  Active: "green",
  Pending: "orange",
  Inactive: "gray",
  Expired: "red",
};

// Icon + hover colour of each status option in the three-dot dropdown
const statusIcon: Record<State, { icon: LucideIcon; cls: string }> = {
  Active: { icon: CheckCircle2, cls: "hover:text-emerald-400" },
  Pending: { icon: Clock3, cls: "hover:text-amber-400" },
  Inactive: { icon: Ban, cls: "hover:text-slate-200" },
  Expired: { icon: TimerReset, cls: "hover:text-red-400" },
};

/* ---------- Shared styles (same as dashboard) ---------- */
const th =
  "bg-white/4 px-2 py-2 font-medium first:rounded-l-md last:rounded-r-md";
const td = "border-t border-[#272D39] px-2 py-2.5";
const field =
  "w-full appearance-none rounded-lg border border-[#272D39] bg-[#10131A] px-3 py-2 pr-8 text-xs text-slate-200 outline-none placeholder:text-slate-500 focus:border-[#A29CFF]/60";

/* ---------- Small pieces ---------- */
/* IMAGE: vendor logo/photo (32x32). Later use <Image fill className="object-cover" />
   (keep "relative overflow-hidden rounded-lg" on the parent) */
function Logo() {
  return (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-dashed border-[#272D39] bg-white/4 text-slate-500">
      <Building2 className="h-4 w-4" />
    </span>
  );
}

// Shows "--" if the rating is 0
function Rating({ value }: { value: number }) {
  if (!value) return <span className="text-slate-500">--</span>;
  return (
    <span className="flex items-center gap-1 text-slate-300">
      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
      {value.toFixed(1)}
    </span>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
}) {
  return (
    <div className="relative">
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={field}
      >
        <option value="All" className="bg-[#10131A]">
          All {label}
        </option>
        {options.map((o) => (
          <option key={o} value={o} className="bg-[#10131A]">
            {o}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
    </div>
  );
}

// Action icons of one vendor (View / Edit / three dot), used in both the table and the phone cards
function Actions({
  vendor,
  menuOpen,
  onView,
  onEdit,
  onMore,
}: {
  vendor: VendorRow;
  menuOpen: boolean;
  onView: () => void;
  onEdit: () => void;
  onMore: (e: React.MouseEvent<HTMLButtonElement>) => void;
}) {
  return (
    <div className="flex items-center gap-0.5 text-slate-400">
      {/* View: opens the details popup */}
      <button
        type="button"
        title="View Details"
        aria-label="View"
        onClick={onView}
        className="cursor-pointer rounded-md p-1.5 transition hover:bg-white/5 hover:text-white active:scale-90"
      >
        <Eye className="h-3.5 w-3.5" />
      </button>
      {/* Edit: opens the edit popup */}
      <button
        type="button"
        title="Edit"
        aria-label="Edit"
        onClick={onEdit}
        className="cursor-pointer rounded-md p-1.5 transition hover:bg-white/5 hover:text-[#A29CFF] active:scale-90"
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>
      {/* Three dot: opens the actions dropdown (call / change status / delete) */}
      <button
        type="button"
        data-menu-btn
        title="More actions"
        aria-label={`More actions for ${vendor.name}`}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        onClick={onMore}
        className={`cursor-pointer rounded-md p-1.5 transition hover:bg-white/5 hover:text-white active:scale-90 ${
          menuOpen ? "bg-white/5 text-slate-200" : ""
        }`}
      >
        <EllipsisVertical className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

/* ---------- View Details popup ---------- */

// One detail row (label on the left, value on the right)
function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-[#272D39] py-2 text-[11px] first:border-t-0">
      <span className="shrink-0 text-slate-400">{label}</span>
      <span className="text-right font-medium text-slate-200">{value}</span>
    </div>
  );
}

function ViewVendorModal({
  record,
  onClose,
}: {
  record: VendorRow;
  onClose: () => void;
}) {
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
          <div className="flex min-w-0 items-center gap-3">
            <Logo />
            <div className="min-w-0">
              <h2 className="text-sm font-bold">Vendor Details</h2>
              <p className="truncate text-[11px] text-slate-400">
                {record.name}
              </p>
            </div>
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
          <Badge tone={statusTone[record.status]}>{record.status}</Badge>
        </div>

        {/* Details */}
        <div className="mt-2 rounded-lg border border-[#272D39] bg-white/3 px-3">
          <DetailRow label="Vendor No." value={`#${record.id}`} />
          <DetailRow label="Name" value={record.name} />
          <DetailRow label="Service" value={record.service} />
          <DetailRow label="Contact" value={record.phone} />
          <DetailRow label="Contract" value={record.contract} />
          {record.endDate && (
            <DetailRow label="Contract End" value={record.endDate} />
          )}
          <DetailRow
            label="Rating"
            value={record.rating ? record.rating.toFixed(1) : "--"}
          />
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

/* ---------- Edit Vendor popup ---------- */

function EditVendorModal({
  record,
  onClose,
  onSubmit,
}: {
  record: VendorRow;
  onClose: () => void;
  onSubmit: (updated: VendorRow) => void;
}) {
  const [name, setName] = useState(record.name);
  const [vService, setVService] = useState<Service>(record.service);
  const [phone, setPhone] = useState(record.phone);
  const [contract, setContract] = useState(record.contract);
  const [rating, setRating] = useState(String(record.rating));
  const [vStatus, setVStatus] = useState<State>(record.status);
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
    const digits = phone.replace(/\D/g, "");
    const ratingNum = Number(rating);
    if (name.trim().length < 3) {
      setError("Name must be at least 3 characters.");
      return;
    }
    if (digits.length !== 10) {
      setError("Phone number must be 10 digits.");
      return;
    }
    if (!contract.trim()) {
      setError("Please enter the contract period.");
      return;
    }
    if (rating.trim() === "" || Number.isNaN(ratingNum) || ratingNum < 0 || ratingNum > 5) {
      setError("Rating must be a number between 0 and 5.");
      return;
    }
    onSubmit({
      ...record,
      name: name.trim(),
      service: vService,
      phone: `${digits.slice(0, 5)} ${digits.slice(5)}`, // same format as the table: "98765 43210"
      contract: contract.trim(),
      rating: Math.round(ratingNum * 10) / 10,
      status: vStatus,
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
            <h2 className="text-base font-bold">Edit Vendor</h2>
            <p className="text-[11px] text-slate-400">
              Update the details of this vendor
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
            Vendor Name
            <input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError("");
              }}
              className={`${field} pr-3`}
              autoFocus
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-[11px] text-slate-400">
              Service
              <div className="relative">
                <select
                  value={vService}
                  onChange={(e) => setVService(e.target.value as Service)}
                  className={`${field} cursor-pointer`}
                >
                  {services.map((s) => (
                    <option key={s} value={s} className="bg-[#10131A]">
                      {s}
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
                  value={vStatus}
                  onChange={(e) => setVStatus(e.target.value as State)}
                  className={`${field} cursor-pointer`}
                >
                  {states.map((s) => (
                    <option key={s} value={s} className="bg-[#10131A]">
                      {s}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
              </div>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-[11px] text-slate-400">
              Phone
              <input
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setError("");
                }}
                placeholder="e.g. 98765 43210"
                className={`${field} pr-3`}
              />
            </label>

            <label className="flex flex-col gap-1 text-[11px] text-slate-400">
              Contract
              <input
                value={contract}
                onChange={(e) => {
                  setContract(e.target.value);
                  setError("");
                }}
                placeholder="e.g. 2026 - 2027"
                className={`${field} pr-3`}
              />
            </label>
          </div>

          <label className="flex flex-col gap-1 text-[11px] text-slate-400">
            Rating (0 - 5, use 0 for not rated)
            <input
              type="number"
              min={0}
              max={5}
              step={0.1}
              value={rating}
              onChange={(e) => {
                setRating(e.target.value);
                setError("");
              }}
              className={`${field} pr-3`}
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
            Save Changes
          </button>
        </div>
      </motion.form>
    </motion.div>
  );
}

/* ---------- Delete confirm popup ---------- */

function DeleteVendorConfirm({
  record,
  onClose,
  onConfirm,
}: {
  record: VendorRow;
  onClose: () => void;
  onConfirm: () => void;
}) {
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
            <h2 className="text-base font-bold">Delete Vendor</h2>
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
export default function VendorsPage() {
  const [vendors, setVendors] = useState<VendorRow[]>(initialVendors);
  const [showVendorModal, setShowVendorModal] = useState(false);

  const [q, setQ] = useState("");
  const [service, setService] = useState("All");
  const [status, setStatus] = useState("All");
  const [contract, setContract] = useState("All");

  // Vendor open in the View / Edit / Delete popup (null = closed)
  const [viewing, setViewing] = useState<VendorRow | null>(null);
  const [editing, setEditing] = useState<VendorRow | null>(null);
  const [deleting, setDeleting] = useState<VendorRow | null>(null);
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

  // Add the new vendor from the modal to the list
  function handleSave(p: VendorPayload) {
    const row: VendorRow = {
      id: p.id,
      name: p.name,
      service: p.service as Service,
      phone: `${p.phone.slice(0, 5)} ${p.phone.slice(5)}`,
      contract: `${p.contractStart.slice(0, 4)} - ${p.contractEnd.slice(0, 4)}`,
      rating: p.rating,
      status: p.status as State,
      endDate: p.contractEnd,
      isNew: true,
    };
    setVendors((prev) => [row, ...prev]);
    // TODO: add the API call here (along with the p.contractFile upload)
    console.log("New vendor:", p);
  }

  // Edit: save the changed details (replace with an API call later)
  const handleEdit = (updated: VendorRow) => {
    setVendors((prev) => prev.map((v) => (v.id === updated.id ? updated : v)));
    setToast(`"${updated.name}" updated`);
    setEditing(null);
  };

  // Three-dot status option: changes only the status (replace with an API call later)
  const changeStatus = (v: VendorRow, next: State) => {
    setMenu(null);
    setVendors((prev) =>
      prev.map((x) => (x.id === v.id ? { ...x, status: next } : x)),
    );
    setToast(`"${v.name}" is now ${next}`);
  };

  // Delete: removes the vendor (replace with an API call later)
  const handleDelete = () => {
    if (!deleting) return;
    setVendors((prev) => prev.filter((v) => v.id !== deleting.id));
    setToast(`"${deleting.name}" deleted`);
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

  // The vendor the open dropdown belongs to
  const menuVendor = menu ? vendors.find((v) => v.id === menu.id) : null;

  // Contract filter options: only the contract years present in the vendors are shown
  const contracts = useMemo(
    () => Array.from(new Set(vendors.map((v) => v.contract))).sort(),
    [vendors],
  );

  // If the selected contract no longer exists (after edit / delete), fall back to "All"
  const activeContract =
    contract === "All" || contracts.includes(contract) ? contract : "All";

  // Stat cards: demo numbers + newly added vendors (remove this once the API is in place)
  const stats = useMemo(() => {
    const added = vendors.filter((v) => v.isNew);
    const expiring = added.filter((v) => {
      if (!v.endDate) return false;
      const days = (new Date(v.endDate).getTime() - Date.now()) / 86_400_000;
      return days >= 0 && days <= 30;
    });
    return [
      {
        label: "Total Vendors",
        value: String(12 + added.length),
        icon: Store,
        c: "#3B82F6",
      },
      {
        label: "Active Vendors",
        value: String(9 + added.filter((v) => v.status === "Active").length),
        icon: CheckCircle2,
        c: "#10B981",
      },
      {
        label: "Pending Contracts",
        value: String(2 + added.filter((v) => v.status === "Pending").length),
        icon: FileClock,
        c: "#F59E0B",
      },
      {
        label: "Expiring Soon",
        value: String(1 + expiring.length),
        icon: TimerReset,
        c: "#EF4444",
      },
    ];
  }, [vendors]);

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return vendors.filter(
      (v) =>
        (service === "All" || v.service === service) &&
        (status === "All" || v.status === status) &&
        (activeContract === "All" || v.contract === activeContract) &&
        (term === "" ||
          v.name.toLowerCase().includes(term) ||
          v.service.toLowerCase().includes(term)),
    );
  }, [vendors, q, service, status, activeContract]);

  return (
    <div className="mx-auto flex w-full max-w-350 flex-col gap-4">
      {/* Header */}
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
        className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
      >
        <motion.div variants={item}>
          <h1 className="text-xl font-bold sm:text-2xl">Vendors</h1>
          <p className="text-xs text-slate-400">
            Manage external vendors and contracts
          </p>
        </motion.div>
        {/* Primary button: gradient #6C63FF -> #4DA3FF */}
        <motion.div variants={item}>
          <button
            type="button"
            onClick={() => setShowVendorModal(true)}
            className="flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-linear-to-r from-[#6C63FF] to-[#4DA3FF] px-4 py-2.5 text-xs font-semibold text-white transition hover:opacity-90 active:scale-95"
          >
            <Plus className="h-3.5 w-3.5" /> Add Vendor
          </button>
        </motion.div>
      </motion.div>

      {/* Stat cards (same card size as President dashboard cards) */}
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
        className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 lg:grid-cols-4"
      >
        {stats.map(({ label, value, icon: Icon, c }) => (
          <motion.div
            key={label}
            variants={item}
            className="relative min-h-32.25 overflow-hidden rounded-xl border border-[#272D39] bg-[#10131A] p-4"
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
        className="grid grid-cols-1 gap-2 rounded-xl border border-[#272D39] bg-[#10131A] p-3 min-[480px]:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]"
      >
        <div className="relative min-[480px]:col-span-2 lg:col-span-1">
          <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search vendors..."
            className={`${field} pl-9 pr-3`}
          />
        </div>
        <Select
          label="Service"
          value={service}
          onChange={setService}
          options={services}
        />
        <Select
          label="Status"
          value={status}
          onChange={setStatus}
          options={states}
        />
        <Select
          label="Contract"
          value={activeContract}
          onChange={setContract}
          options={contracts}
        />
      </motion.div>

      {/* Desktop / tablet: table */}
      <motion.div
        variants={item}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
        className="hidden md:block"
      >
        <Card title="All Vendors" sub={`${list.length} vendors`}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-180 text-left text-[11px]">
              <thead className="text-slate-400">
                <tr>
                  <th className={th}>Vendor</th>
                  <th className={th}>Service</th>
                  <th className={th}>Contact</th>
                  <th className={th}>Contract</th>
                  <th className={th}>Rating</th>
                  <th className={th}>Status</th>
                  <th className={th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.map((v) => (
                  <tr key={v.id} className="hover:bg-white/2">
                    <td className={td}>
                      <span className="flex items-center gap-3">
                        <Logo />
                        <span className="font-medium">{v.name}</span>
                      </span>
                    </td>
                    <td className={`${td} text-slate-400`}>{v.service}</td>
                    <td className={`${td} text-slate-400`}>{v.phone}</td>
                    <td className={`${td} text-slate-400`}>{v.contract}</td>
                    <td className={td}>
                      <Rating value={v.rating} />
                    </td>
                    <td className={td}>
                      <Badge tone={statusTone[v.status]}>{v.status}</Badge>
                    </td>
                    <td className={td}>
                      <Actions
                        vendor={v}
                        menuOpen={menu?.id === v.id}
                        onView={() => setViewing(v)}
                        onEdit={() => setEditing(v)}
                        onMore={(e) => toggleMenu(e, v.id)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </motion.div>

      {/* Phone: cards */}
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
        className="flex flex-col gap-3 md:hidden"
      >
        {list.map((v) => (
          <motion.div
            key={v.id}
            variants={item}
            className="rounded-xl border border-[#272D39] bg-[#10131A] p-4"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-3">
                <Logo />
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold">{v.name}</p>
                  <p className="truncate text-[10px] text-slate-400">
                    {v.service}
                  </p>
                </div>
              </div>
              <Badge tone={statusTone[v.status]}>{v.status}</Badge>
            </div>

            <dl className="mt-3 grid grid-cols-3 gap-2 text-[10px]">
              <div>
                <dt className="text-slate-500">Contact</dt>
                <dd className="mt-0.5 text-slate-300">{v.phone}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Contract</dt>
                <dd className="mt-0.5 text-slate-300">{v.contract}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Rating</dt>
                <dd className="mt-0.5">
                  <Rating value={v.rating} />
                </dd>
              </div>
            </dl>

            <div className="mt-3 flex justify-end border-t border-[#272D39] pt-2">
              <Actions
                vendor={v}
                menuOpen={menu?.id === v.id}
                onView={() => setViewing(v)}
                onEdit={() => setEditing(v)}
                onMore={(e) => toggleMenu(e, v.id)}
              />
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Empty state */}
      {list.length === 0 && (
        <div className="rounded-xl border border-dashed border-[#272D39] p-10 text-center text-xs text-slate-400">
          No vendors found.
        </div>
      )}

      {/* Three-dot dropdown: fixed position so the table's overflow does not clip it */}
      {menu && menuVendor && (
        <div
          ref={menuRef}
          role="menu"
          style={{ top: menu.top, left: menu.left, width: MENU_WIDTH }}
          className="fixed z-50 overflow-hidden rounded-lg border border-[#272D39] bg-[#10131A] p-1 text-[11px] shadow-xl shadow-black/40"
        >
          {/* Call vendor: opens the phone dialer */}
          <a
            href={`tel:${menuVendor.phone.replace(/\D/g, "")}`}
            role="menuitem"
            onClick={() => setMenu(null)}
            className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-slate-300 transition-colors hover:bg-white/5"
          >
            <Phone className="h-3.5 w-3.5" /> Call Vendor
          </a>

          {/* Divider */}
          <div className="my-1 border-t border-[#272D39]" />

          {/* Status options: every status except the current one */}
          {states
            .filter((s) => s !== menuVendor.status)
            .map((s) => {
              const { icon: StatusIcon, cls } = statusIcon[s];
              return (
                <button
                  key={s}
                  type="button"
                  role="menuitem"
                  onClick={() => changeStatus(menuVendor, s)}
                  className={`flex w-full cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-left text-slate-300 transition-colors hover:bg-white/5 ${cls}`}
                >
                  <StatusIcon className="h-3.5 w-3.5" /> Mark as {s}
                </button>
              );
            })}

          {/* Divider */}
          <div className="my-1 border-t border-[#272D39]" />

          {/* Delete: opens the confirm popup */}
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setDeleting(menuVendor);
              setMenu(null);
            }}
            className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-left text-red-400 transition-colors hover:bg-red-500/10"
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
        </div>
      )}

      {/* Add Vendor modal (outside the motion wrappers) */}
      <AddVendorModal
        open={showVendorModal}
        onClose={() => setShowVendorModal(false)}
        onSave={handleSave}
      />

      {/* View Details popup */}
      <AnimatePresence>
        {viewing && (
          <ViewVendorModal
            key={viewing.id}
            record={viewing}
            onClose={() => setViewing(null)}
          />
        )}
      </AnimatePresence>

      {/* Edit popup */}
      <AnimatePresence>
        {editing && (
          <EditVendorModal
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
          <DeleteVendorConfirm
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