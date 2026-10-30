"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import {
  Search,
  Plus,
  Eye,
  Pencil,
  EllipsisVertical,
  Users,
  UserCheck,
  Briefcase,
  CalendarX,
  ChevronDown,
  CheckCircle2,
  Trash2,
  X,
} from "lucide-react";
import { Card, Badge } from "@/Components/ui";
import AddStaffModal, { type StaffPayload } from "@/Components/AddStaffModal";

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
type Dept =
  | "Security"
  | "Housekeeping"
  | "Front Office"
  | "Maintenance"
  | "Gardening"
  | "Parking"
  | "Admin";
type Shift = "Morning" | "Day" | "Evening" | "Night";
type State = "Active" | "On Leave" | "Inactive";

type StaffRow = {
  id: number;
  name: string;
  role: string;
  dept: Dept;
  shift: Shift;
  phone: string;
  status: State;
  img: string; // if empty, initials are shown
  isNew?: boolean; // added via the modal
};

/* ---------- Data (replace with API later) ---------- */
const initialStaff: StaffRow[] = [
  {
    id: 1,
    name: "Ramesh Kumar",
    role: "Security",
    dept: "Security",
    shift: "Night",
    phone: "98765 43210",
    status: "Active",
    img: "/img20.jpg",
  },
  {
    id: 2,
    name: "Suresh Yadav",
    role: "Cleaner",
    dept: "Housekeeping",
    shift: "Morning",
    phone: "98765 12345",
    status: "Active",
    img: "/img21.jpg",
  },
  {
    id: 3,
    name: "Pooja Singh",
    role: "Receptionist",
    dept: "Front Office",
    shift: "Day",
    phone: "87654 32109",
    status: "Active",
    img: "/img26.jpg",
  },
  {
    id: 4,
    name: "Vikram Patel",
    role: "Maintenance",
    dept: "Maintenance",
    shift: "Day",
    phone: "86543 21098",
    status: "On Leave",
    img: "/img23.jpg",
  },
];

const depts: Dept[] = [
  "Security",
  "Housekeeping",
  "Front Office",
  "Maintenance",
  "Gardening",
  "Parking",
  "Admin",
];
const shifts: Shift[] = ["Morning", "Day", "Evening", "Night"];
const states: State[] = ["Active", "On Leave", "Inactive"];

const statusTone: Record<State, "green" | "orange" | "gray"> = {
  Active: "green",
  "On Leave": "orange",
  Inactive: "gray",
};

/* ---------- Shared styles (same as dashboard) ---------- */
const th =
  "bg-white/[0.04] px-2 py-2 font-medium first:rounded-l-md last:rounded-r-md";
const td = "border-t border-[#272D39] px-2 py-2.5";
const field =
  "w-full appearance-none rounded-lg border border-[#272D39] bg-[#10131A] px-3 py-2 pr-8 text-xs text-slate-200 outline-none placeholder:text-slate-500 focus:border-[#A29CFF]/60";

const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("") || "ST";

// "98765 43210" -> "9876543210" (digits only, used in the Edit popup)
const phoneDigits = (v: string) => v.replace(/\D/g, "");

// "9876543210" -> "98765 43210" (format used in the table)
const formatPhone = (digits: string) =>
  `${digits.slice(0, 5)} ${digits.slice(5)}`;

/* ---------- Small pieces ---------- */
/* IMAGE: staff photo (32x32). Shows initials if there is no photo */
function Avatar({
  src,
  name,
  size = "h-8 w-8",
}: {
  src: string;
  name: string;
  size?: string;
}) {
  if (!src) {
    return (
      <span
        className={`flex ${size} shrink-0 items-center justify-center rounded-full border border-[#272D39] bg-[#6C63FF]/25 text-[10px] font-bold text-[#A29CFF]`}
      >
        {initials(name)}
      </span>
    );
  }
  return (
    <img
      src={src}
      alt={name}
      className={`${size} shrink-0 rounded-full border border-[#272D39] object-cover`}
    />
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

// Row actions: View, Edit and the 3-dot menu button (handlers come from the page)
function Actions({
  row,
  menuOpen,
  onView,
  onEdit,
  onMore,
}: {
  row: StaffRow;
  menuOpen: boolean;
  onView: (r: StaffRow) => void;
  onEdit: (r: StaffRow) => void;
  onMore: (e: React.MouseEvent<HTMLButtonElement>, r: StaffRow) => void;
}) {
  return (
    <div className="flex items-center gap-0.5 text-slate-400">
      <button
        type="button"
        aria-label="View"
        title="View"
        onClick={() => onView(row)}
        className="cursor-pointer rounded-md p-1.5 hover:bg-white/5 hover:text-white"
      >
        <Eye className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        aria-label="Edit"
        title="Edit"
        onClick={() => onEdit(row)}
        className="cursor-pointer rounded-md p-1.5 hover:bg-white/5 hover:text-white"
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        aria-label="More"
        title="More"
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        onClick={(e) => onMore(e, row)}
        className={`cursor-pointer rounded-md p-1.5 hover:bg-white/5 hover:text-white ${
          menuOpen ? "bg-white/5 text-white" : ""
        }`}
      >
        <EllipsisVertical className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

/* ---------- View Staff popup ---------- */

// One detail row (label on the left, value on the right)
function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-[#272D39] py-2 text-[11px] first:border-t-0">
      <span className="text-slate-400">{label}</span>
      <span className="text-right font-medium text-slate-200">{value}</span>
    </div>
  );
}

function ViewStaffModal({
  record,
  onClose,
}: {
  record: StaffRow;
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
            <Avatar src={record.img} name={record.name} size="h-11 w-11" />
            <div className="min-w-0">
              <h2 className="truncate text-sm font-bold">{record.name}</h2>
              <p className="truncate text-[11px] text-slate-400">{record.role}</p>
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
          <DetailRow label="Staff ID" value={`#${record.id}`} />
          <DetailRow label="Role" value={record.role} />
          <DetailRow label="Department" value={record.dept} />
          <DetailRow label="Shift" value={record.shift} />
          <DetailRow label="Contact" value={record.phone} />
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

/* ---------- Edit Staff popup ---------- */

function EditStaffModal({
  record,
  onClose,
  onSubmit,
}: {
  record: StaffRow;
  onClose: () => void;
  onSubmit: (updated: StaffRow) => void;
}) {
  const [name, setName] = useState(record.name);
  const [role, setRole] = useState(record.role);
  const [dept, setDept] = useState<Dept>(record.dept);
  const [shift, setShift] = useState<Shift>(record.shift);
  const [phone, setPhone] = useState(phoneDigits(record.phone));
  const [status, setStatus] = useState<State>(record.status);
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

  // Validate the form and send the updated row back to the page
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (name.trim().length < 2) {
      setError("Name must be at least 2 characters.");
      return;
    }
    if (role.trim().length < 2) {
      setError("Role must be at least 2 characters.");
      return;
    }
    if (phone.length !== 10) {
      setError("Phone number must be 10 digits.");
      return;
    }

    onSubmit({
      ...record,
      name: name.trim(),
      role: role.trim(),
      dept,
      shift,
      phone: formatPhone(phone),
      status,
    });
  };

  // Small select used inside this popup (label + custom chevron)
  const popupSelect = (
    label: string,
    value: string,
    onChange: (v: string) => void,
    options: readonly string[],
  ) => (
    <label className="flex flex-col gap-1 text-[11px] text-slate-400">
      {label}
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${field} cursor-pointer`}
        >
          {options.map((o) => (
            <option key={o} value={o} className="bg-[#10131A]">
              {o}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
      </div>
    </label>
  );

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
            <h2 className="text-base font-bold">Edit Staff</h2>
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
            Full Name
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
              Role
              <input
                value={role}
                onChange={(e) => {
                  setRole(e.target.value);
                  setError("");
                }}
                className={`${field} pr-3`}
              />
            </label>

            <label className="flex flex-col gap-1 text-[11px] text-slate-400">
              Phone Number
              <input
                value={phone}
                inputMode="numeric"
                maxLength={10}
                onChange={(e) => {
                  setPhone(phoneDigits(e.target.value));
                  setError("");
                }}
                placeholder="10 digit number"
                className={`${field} pr-3`}
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {popupSelect("Department", dept, (v) => setDept(v as Dept), depts)}
            {popupSelect("Shift", shift, (v) => setShift(v as Shift), shifts)}
          </div>

          {popupSelect("Status", status, (v) => setStatus(v as State), states)}

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

function DeleteStaffConfirm({
  record,
  onClose,
  onConfirm,
}: {
  record: StaffRow;
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
            <h2 className="text-base font-bold">Delete Staff</h2>
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
export default function StaffPage() {
  const [staff, setStaff] = useState<StaffRow[]>(initialStaff);
  const [showStaffModal, setShowStaffModal] = useState(false);

  const [q, setQ] = useState("");
  const [dept, setDept] = useState("All");
  const [shift, setShift] = useState("All");
  const [status, setStatus] = useState("All");

  // 3-dot menu: which row is open and where to show it on the screen
  const [menu, setMenu] = useState<{
    id: number;
    right: number;
    top?: number;
    bottom?: number;
  } | null>(null);
  // Staff member open in the View / Edit / Delete popup (null = closed)
  const [viewing, setViewing] = useState<StaffRow | null>(null);
  const [editing, setEditing] = useState<StaffRow | null>(null);
  const [deleting, setDeleting] = useState<StaffRow | null>(null);
  // Small success message after an action
  const [toast, setToast] = useState("");

  // Hide the success message after 3 seconds
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  // Close the 3-dot menu on Esc, scroll or window resize
  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(null);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    window.addEventListener("resize", close);
    window.addEventListener("scroll", close, true);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", close);
      window.removeEventListener("scroll", close, true);
    };
  }, [menu]);

  // Add the new staff member from the modal to the list
  function handleSave(p: StaffPayload) {
    const row: StaffRow = {
      id: p.id,
      name: p.name,
      role: p.role,
      dept: p.department as Dept,
      shift: p.shift,
      phone: `${p.phone.slice(0, 5)} ${p.phone.slice(5)}`,
      status: p.status as State,
      // Local URL for preview for now. After the API is connected, the server's photo URL will go here
      img: p.photo ? URL.createObjectURL(p.photo) : "",
      isNew: true,
    };
    setStaff((prev) => [row, ...prev]);
    // TODO: add the API call here (along with the p.photo / p.idFile upload)
    console.log("New staff:", p);
  }

  // Opens the 3-dot menu next to the clicked button (flips up near the bottom)
  const openMenu = (e: React.MouseEvent<HTMLButtonElement>, r: StaffRow) => {
    if (menu?.id === r.id) {
      setMenu(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const right = window.innerWidth - rect.right;
    const spaceBelow = window.innerHeight - rect.bottom;

    if (spaceBelow < 200) {
      setMenu({ id: r.id, right, bottom: window.innerHeight - rect.top + 4 });
    } else {
      setMenu({ id: r.id, right, top: rect.bottom + 4 });
    }
  };

  // The staff member whose 3-dot menu is open
  const menuStaff = staff.find((s) => s.id === menu?.id) ?? null;

  // Edit: save the changed details (replace with an API call later)
  const handleEdit = (updated: StaffRow) => {
    setStaff((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    setToast(`${updated.name} updated`);
    setEditing(null);
  };

  // Mark as: changes only the status (replace with an API call later)
  const changeStatus = (s: StaffRow, next: State) => {
    setStaff((prev) =>
      prev.map((x) => (x.id === s.id ? { ...x, status: next } : x)),
    );
    setToast(`${s.name} is now ${next}`);
    setMenu(null);
  };

  // Delete: removes the staff member (replace with an API call later)
  const handleDelete = () => {
    if (!deleting) return;
    setStaff((prev) => prev.filter((s) => s.id !== deleting.id));
    setToast(`${deleting.name} deleted`);
    setDeleting(null);
  };

  // Stat cards: demo numbers + newly added staff (remove this once the API is in place)
  const stats = useMemo(() => {
    const added = staff.filter((s) => s.isNew);
    return [
      {
        label: "Total Staff",
        value: String(32 + added.length),
        icon: Users,
        c: "#3B82F6",
      },
      {
        label: "Active",
        value: String(28 + added.filter((s) => s.status === "Active").length),
        icon: UserCheck,
        c: "#10B981",
      },
      { label: "On Duty", value: "18", icon: Briefcase, c: "#8B5CF6" },
      {
        label: "On Leave",
        value: String(4 + added.filter((s) => s.status === "On Leave").length),
        icon: CalendarX,
        c: "#F59E0B",
      },
    ];
  }, [staff]);

  const list = useMemo(() => {
    const term = q.trim().toLowerCase();
    return staff.filter(
      (s) =>
        (dept === "All" || s.dept === dept) &&
        (shift === "All" || s.shift === shift) &&
        (status === "All" || s.status === status) &&
        (term === "" ||
          s.name.toLowerCase().includes(term) ||
          s.role.toLowerCase().includes(term)),
    );
  }, [staff, q, dept, shift, status]);

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-4">
      {/* Header */}
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
        className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
      >
        <motion.div variants={item}>
          <h1 className="text-xl font-bold sm:text-2xl">Staff</h1>
          <p className="text-xs text-slate-400">
            Manage society staff and attendance
          </p>
        </motion.div>
        {/* Primary button: gradient #6C63FF -> #4DA3FF */}
        <motion.div variants={item}>
          <button
            type="button"
            onClick={() => setShowStaffModal(true)}
            className="flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-linear-to-r from-[#6C63FF] to-[#4DA3FF] px-4 py-2.5 text-xs font-semibold text-white transition hover:opacity-90 active:scale-95"
          >
            <Plus className="h-3.5 w-3.5" /> Add Staff
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
              className="absolute inset-x-0 bottom-0 h-[3px]"
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
            placeholder="Search staff..."
            className={`${field} pl-9 pr-3`}
          />
        </div>
        <Select
          label="Department"
          value={dept}
          onChange={setDept}
          options={depts}
        />
        <Select
          label="Shift"
          value={shift}
          onChange={setShift}
          options={shifts}
        />
        <Select
          label="Status"
          value={status}
          onChange={setStatus}
          options={states}
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
        <Card title="All Staff" sub={`${list.length} staff members`}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-[11px]">
              <thead className="text-slate-400">
                <tr>
                  <th className={th}>Staff</th>
                  <th className={th}>Role</th>
                  <th className={th}>Department</th>
                  <th className={th}>Shift</th>
                  <th className={th}>Contact</th>
                  <th className={th}>Status</th>
                  <th className={th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.map((s) => (
                  <tr key={s.id} className="hover:bg-white/[0.02]">
                    <td className={td}>
                      <span className="flex items-center gap-3">
                        <Avatar src={s.img} name={s.name} />
                        <span className="font-medium">{s.name}</span>
                      </span>
                    </td>
                    <td className={`${td} text-slate-400`}>{s.role}</td>
                    <td className={`${td} text-slate-400`}>{s.dept}</td>
                    <td className={`${td} text-slate-400`}>{s.shift}</td>
                    <td className={`${td} text-slate-400`}>{s.phone}</td>
                    <td className={td}>
                      <Badge tone={statusTone[s.status]}>{s.status}</Badge>
                    </td>
                    <td className={td}>
                      <Actions
                        row={s}
                        menuOpen={menu?.id === s.id}
                        onView={setViewing}
                        onEdit={setEditing}
                        onMore={openMenu}
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
      {/* FIX: each card animates on its own (own initial/whileInView), so newly added or
          re-filtered cards never get stuck hidden waiting for the parent container */}
      <div className="flex flex-col gap-3 md:hidden">
        {list.map((s) => (
          <motion.div
            key={s.id}
            variants={item}
            initial="hidden"
            whileInView="show"
            viewport={VIEWPORT}
            className="rounded-xl border border-[#272D39] bg-[#10131A] p-4"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-3">
                <Avatar src={s.img} name={s.name} />
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold">{s.name}</p>
                  <p className="truncate text-[10px] text-slate-400">
                    {s.role}
                  </p>
                </div>
              </div>
              <Badge tone={statusTone[s.status]}>{s.status}</Badge>
            </div>

            <dl className="mt-3 grid grid-cols-3 gap-2 text-[10px]">
              <div>
                <dt className="text-slate-500">Department</dt>
                <dd className="mt-0.5 text-slate-300">{s.dept}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Shift</dt>
                <dd className="mt-0.5 text-slate-300">{s.shift}</dd>
              </div>
              <div>
                <dt className="text-slate-500">Contact</dt>
                <dd className="mt-0.5 text-slate-300">{s.phone}</dd>
              </div>
            </dl>

            <div className="mt-3 flex justify-end border-t border-[#272D39] pt-2">
              <Actions
                row={s}
                menuOpen={menu?.id === s.id}
                onView={setViewing}
                onEdit={setEditing}
                onMore={openMenu}
              />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Empty state */}
      {list.length === 0 && (
        <div className="rounded-xl border border-dashed border-[#272D39] p-10 text-center text-xs text-slate-400">
          No staff members found.
        </div>
      )}

      {/* Add Staff modal (outside the motion wrappers) */}
      <AddStaffModal
        open={showStaffModal}
        onClose={() => setShowStaffModal(false)}
        onSave={handleSave}
      />

      {/* 3-dot menu (fixed position, so the table scroll area never cuts it) */}
      <AnimatePresence>
        {menu && menuStaff && (
          <>
            {/* Invisible layer: click anywhere outside to close the menu */}
            <div
              className="fixed inset-0 z-60"
              onClick={() => setMenu(null)}
              aria-hidden="true"
            />
            <motion.div
              role="menu"
              initial={{ opacity: 0, scale: 0.95, y: -4 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -4 }}
              transition={{ duration: 0.15, ease: EASE }}
              style={{ top: menu.top, bottom: menu.bottom, right: menu.right }}
              className="fixed z-70 w-48 origin-top-right overflow-hidden rounded-lg border border-[#272D39] bg-[#10131A] p-1 text-xs shadow-2xl"
            >
              {/* Mark as: only the statuses this staff member does not have yet */}
              {states
                .filter((st) => st !== menuStaff.status)
                .map((st) => (
                  <button
                    key={st}
                    type="button"
                    role="menuitem"
                    onClick={() => changeStatus(menuStaff, st)}
                    className="flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-left text-slate-300 transition hover:bg-white/5 hover:text-white"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> Mark as {st}
                  </button>
                ))}

              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setDeleting(menuStaff);
                  setMenu(null);
                }}
                className="flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-left text-red-400 transition hover:bg-red-500/10"
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* View popup */}
      <AnimatePresence>
        {viewing && (
          <ViewStaffModal
            key={viewing.id}
            record={viewing}
            onClose={() => setViewing(null)}
          />
        )}
      </AnimatePresence>

      {/* Edit popup */}
      <AnimatePresence>
        {editing && (
          <EditStaffModal
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
          <DeleteStaffConfirm
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