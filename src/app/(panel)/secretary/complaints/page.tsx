"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import {
  Plus,
  Search,
  ChevronDown,
  CalendarDays,
  Eye,
  Pencil,
  MoreVertical,
  RotateCcw,
  ClipboardList,
  CircleAlert,
  Loader,
  CircleCheck,
  Clock3,
  ChevronLeft,
  ChevronRight,
  Trash2,
  CheckCircle2,
  X,
} from "lucide-react";
import { Card, Badge } from "@/Components/ui";
import AddComplaintModal, {
  type ComplaintPayload,
} from "@/Components/AddComplaintModal";

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

/* ---------- Data (replace with API data later) ---------- */

// Stat cards show API totals (the table only holds the current page's data)
const BASE_TOTAL = 24;
const BASE_OPEN = 8;

type Priority = "Urgent" | "High" | "Medium" | "Low";
type CStatus = "Open" | "In Progress" | "Resolved" | "Overdue";

type Complaint = {
  id: string;
  title: string;
  by: string;
  flat: string;
  tower: string;
  category: string;
  priority: Priority;
  date: string;
  assigned: string;
  status: CStatus;
};

// State of the three-dot dropdown (which row is open and where to draw it)
type RowMenu = { id: string; top: number; left: number };

// Dropdown size used for positioning
const MENU_WIDTH = 176;
const MENU_HEIGHT = 160;

// Complaints list (initial data)
const initialComplaints: Complaint[] = [
  {
    id: "CMP-024",
    title: "Water Leakage",
    by: "Rahul Sharma",
    flat: "A-302",
    tower: "A",
    category: "Plumbing",
    priority: "High",
    date: "03 Oct 2026",
    assigned: "Ramesh Kumar",
    status: "Open",
  },
  {
    id: "CMP-023",
    title: "Lift Issue",
    by: "Amit Singh",
    flat: "B-201",
    tower: "B",
    category: "Lift",
    priority: "Medium",
    date: "04 Oct 2026",
    assigned: "Vendor",
    status: "In Progress",
  },
  {
    id: "CMP-022",
    title: "Noise Complaint",
    by: "Sneha Patel",
    flat: "C-102",
    tower: "C",
    category: "Noise",
    priority: "Low",
    date: "05 Oct 2026",
    assigned: "Society",
    status: "Resolved",
  },
  {
    id: "CMP-021",
    title: "Garbage Not Collected",
    by: "Rohit Verma",
    flat: "D-404",
    tower: "D",
    category: "Housekeeping",
    priority: "Medium",
    date: "05 Oct 2026",
    assigned: "Housekeeping",
    status: "In Progress",
  },
  {
    id: "CMP-020",
    title: "Street Light Not Working",
    by: "Neha Gupta",
    flat: "E-105",
    tower: "E",
    category: "Electrical",
    priority: "High",
    date: "28 Sep 2026",
    assigned: "Electrician",
    status: "Overdue",
  },
  {
    id: "CMP-019",
    title: "Parking Slot Dispute",
    by: "Anjali Verma",
    flat: "F-203",
    tower: "F",
    category: "Parking",
    priority: "Medium",
    date: "30 Sep 2026",
    assigned: "Society",
    status: "Open",
  },
];

// Badge tones for priority and status
const priorityTone: Record<Priority, "red" | "orange" | "green"> = {
  Urgent: "red",
  High: "red",
  Medium: "orange",
  Low: "green",
};
const statusTone: Record<CStatus, "orange" | "purple" | "green" | "red"> = {
  Open: "orange",
  "In Progress": "purple",
  Resolved: "green",
  Overdue: "red",
};

const statuses: CStatus[] = ["Open", "In Progress", "Resolved", "Overdue"];
const towers = ["A", "B", "C", "D", "E", "F"];
const priorities: Priority[] = ["Urgent", "High", "Medium", "Low"];

// Icon + hover colour of each status option in the three-dot dropdown
const statusIcon: Record<
  CStatus,
  { icon: React.ElementType; cls: string }
> = {
  Open: { icon: CircleAlert, cls: "hover:text-amber-400" },
  "In Progress": { icon: Loader, cls: "hover:text-[#A29CFF]" },
  Resolved: { icon: CircleCheck, cls: "hover:text-emerald-400" },
  Overdue: { icon: Clock3, cls: "hover:text-red-400" },
};

// Avatar colours (cycled by row index) and initials helper
const avatarColors = ["#3B82F6", "#8B5CF6", "#00C2B8", "#F59E0B", "#EF4444"];
const initials = (n: string) =>
  n
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });

// Shared table + form field styles
const th =
  "bg-white/[0.04] px-2 py-2 font-medium first:rounded-l-md last:rounded-r-md";
const td = "border-t border-[#272D39] px-2 py-2.5";
const field =
  "w-full appearance-none rounded-lg border border-[#272D39] bg-[#10131A] px-3 py-2 text-xs text-slate-200 outline-none placeholder:text-slate-500 focus:border-[#A29CFF]/60";

// Reusable select with a chevron icon
function Select({
  value,
  onChange,
  all,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  all: string;
  options: string[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${field} pr-8`}
      >
        <option value="All">{all}</option>
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
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

function ViewComplaintModal({
  record,
  onClose,
}: {
  record: Complaint;
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
          <div className="min-w-0">
            <h2 className="text-sm font-bold">Complaint Details</h2>
            <p className="truncate text-[11px] text-slate-400">
              {record.title}
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
          <Badge tone={statusTone[record.status]}>{record.status}</Badge>
        </div>

        {/* Priority */}
        <div className="mt-2 flex items-center justify-between rounded-lg border border-[#272D39] bg-white/3 px-3 py-2">
          <span className="text-[11px] text-slate-400">Priority</span>
          <Badge tone={priorityTone[record.priority]}>{record.priority}</Badge>
        </div>

        {/* Details */}
        <div className="mt-2 rounded-lg border border-[#272D39] bg-white/3 px-3">
          <DetailRow label="Complaint ID" value={record.id} />
          <DetailRow label="Title" value={record.title} />
          <DetailRow label="Raised By" value={record.by} />
          <DetailRow label="Flat" value={record.flat} />
          <DetailRow label="Tower" value={record.tower} />
          <DetailRow label="Category" value={record.category} />
          <DetailRow label="Date" value={record.date} />
          <DetailRow label="Assigned To" value={record.assigned} />
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

/* ---------- Edit Complaint popup ---------- */

function EditComplaintModal({
  record,
  onClose,
  onSubmit,
}: {
  record: Complaint;
  onClose: () => void;
  onSubmit: (updated: Complaint) => void;
}) {
  const [title, setTitle] = useState(record.title);
  const [category, setCategory] = useState(record.category);
  const [priority, setPriority] = useState<Priority>(record.priority);
  const [assigned, setAssigned] = useState(record.assigned);
  const [cStatus, setCStatus] = useState<CStatus>(record.status);
  const [date, setDate] = useState(record.date);
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
    if (title.trim().length < 3) {
      setError("Title must be at least 3 characters.");
      return;
    }
    if (!category.trim()) {
      setError("Please enter the category.");
      return;
    }
    if (!assigned.trim()) {
      setError("Please enter who the complaint is assigned to.");
      return;
    }
    if (!date.trim()) {
      setError("Please enter the date.");
      return;
    }
    onSubmit({
      ...record,
      title: title.trim(),
      category: category.trim(),
      priority,
      assigned: assigned.trim(),
      status: cStatus,
      date: date.trim(),
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
            <h2 className="text-base font-bold">Edit Complaint</h2>
            <p className="text-[11px] text-slate-400">
              Update the details of {record.id}
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
            Complaint Title
            <input
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setError("");
              }}
              className={field}
              autoFocus
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-[11px] text-slate-400">
              Category
              <input
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setError("");
                }}
                placeholder="e.g. Plumbing"
                className={field}
              />
            </label>

            <label className="flex flex-col gap-1 text-[11px] text-slate-400">
              Assigned To
              <input
                value={assigned}
                onChange={(e) => {
                  setAssigned(e.target.value);
                  setError("");
                }}
                placeholder="e.g. Ramesh Kumar"
                className={field}
              />
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-[11px] text-slate-400">
              Priority
              <div className="relative">
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value as Priority)}
                  className={`${field} cursor-pointer pr-8`}
                >
                  {priorities.map((p) => (
                    <option key={p} value={p}>
                      {p}
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
                  value={cStatus}
                  onChange={(e) => setCStatus(e.target.value as CStatus)}
                  className={`${field} cursor-pointer pr-8`}
                >
                  {statuses.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
              </div>
            </label>
          </div>

          <label className="flex flex-col gap-1 text-[11px] text-slate-400">
            Date
            <input
              value={date}
              onChange={(e) => {
                setDate(e.target.value);
                setError("");
              }}
              placeholder="e.g. 25 Oct 2026"
              className={field}
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

function DeleteComplaintConfirm({
  record,
  onClose,
  onConfirm,
}: {
  record: Complaint;
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
            <h2 className="text-base font-bold">Delete Complaint</h2>
            <p className="text-[11px] text-slate-400">
              This action cannot be undone.
            </p>
          </div>
        </div>

        <p className="mt-4 text-xs text-slate-300">
          Are you sure you want to delete{" "}
          <span className="font-semibold text-white">{record.title}</span> (
          {record.id})?
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
export default function ComplaintsPage() {
  // Complaints data + modal state
  const [items, setItems] = useState<Complaint[]>(initialComplaints);
  const [added, setAdded] = useState(0); // how many new complaints were added
  const [removed, setRemoved] = useState(0); // how many complaints were deleted
  const [showComplaintModal, setShowComplaintModal] = useState(false);

  // Complaint open in the View / Edit / Delete popup (null = closed)
  const [viewing, setViewing] = useState<Complaint | null>(null);
  const [editing, setEditing] = useState<Complaint | null>(null);
  const [deleting, setDeleting] = useState<Complaint | null>(null);
  // Small success message after an action
  const [toast, setToast] = useState("");

  // Three-dot dropdown state
  const [menu, setMenu] = useState<RowMenu | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Filter state
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("All");
  const [category, setCategory] = useState("All");
  const [tower, setTower] = useState("All");
  const [priority, setPriority] = useState("All");

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

  // Category dropdown options (auto-updates when a new category is added)
  const categories = useMemo(
    () => Array.from(new Set(items.map((c) => c.category))),
    [items],
  );

  // If the selected category no longer exists (after edit / delete), fall back to "All"
  const activeCategory =
    category === "All" || categories.includes(category) ? category : "All";

  // Total shown in the stat card and pagination (grows on add, shrinks on delete)
  const total = BASE_TOTAL + added - removed;

  // Stat cards (Total and Open increase when a new complaint is added)
  const stats = [
    {
      label: "Total Complaints",
      value: String(total),
      icon: ClipboardList,
      c: "#3B82F6",
    },
    {
      label: "Open",
      value: String(BASE_OPEN + added),
      icon: CircleAlert,
      c: "#F59E0B",
    },
    { label: "In Progress", value: "6", icon: Loader, c: "#8B5CF6" },
    { label: "Resolved", value: "9", icon: CircleCheck, c: "#10B981" },
    { label: "Overdue", value: "3", icon: Clock3, c: "#EF4444" },
  ];

  // Add the new complaint from the modal to the table
  function handleSave(c: ComplaintPayload) {
    const lastNo = Math.max(
      0,
      ...items.map((x) => parseInt(x.id.replace(/\D/g, ""), 10) || 0),
    );
    const newComplaint: Complaint = {
      id: `CMP-${String(lastNo + 1).padStart(3, "0")}`,
      title: c.title,
      by: c.resident,
      flat: c.flat,
      tower: c.tower ? c.tower.replace("Tower ", "") : c.flat.charAt(0),
      category: c.category,
      priority: c.priority,
      date: fmtDate(c.date),
      assigned: c.assignedTo || "Unassigned",
      status: "Open",
    };
    setItems((prev) => [newComplaint, ...prev]);
    setAdded((n) => n + 1);
  }

  // Edit: save the changed details (replace with an API call later)
  const handleEdit = (updated: Complaint) => {
    setItems((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
    setToast(`${updated.id} updated`);
    setEditing(null);
  };

  // Three-dot status option: changes only the status (replace with an API call later)
  const changeStatus = (c: Complaint, next: CStatus) => {
    setMenu(null);
    setItems((prev) =>
      prev.map((x) => (x.id === c.id ? { ...x, status: next } : x)),
    );
    setToast(`${c.id} is now ${next}`);
  };

  // Delete: removes the complaint (replace with an API call later)
  const handleDelete = () => {
    if (!deleting) return;
    setItems((prev) => prev.filter((c) => c.id !== deleting.id));
    setRemoved((n) => n + 1);
    setToast(`${deleting.id} deleted`);
    setDeleting(null);
  };

  // Three-dot click: toggle the dropdown under the clicked button (flips up near the bottom of the screen)
  const toggleMenu = (e: React.MouseEvent<HTMLButtonElement>, id: string) => {
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

  // The complaint the open dropdown belongs to
  const menuItem = menu ? items.find((c) => c.id === menu.id) : null;

  // Apply search + all filters
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return items.filter(
      (c) =>
        (status === "All" || c.status === status) &&
        (activeCategory === "All" || c.category === activeCategory) &&
        (tower === "All" || c.tower === tower) &&
        (priority === "All" || c.priority === priority) &&
        (!s ||
          `${c.id} ${c.title} ${c.by} ${c.flat}`.toLowerCase().includes(s)),
    );
  }, [items, q, status, activeCategory, tower, priority]);

  // Clear every filter
  const reset = () => {
    setQ("");
    setStatus("All");
    setCategory("All");
    setTower("All");
    setPriority("All");
  };

  return (
    <div className="mx-auto flex w-full max-w-[1400px] flex-col gap-4">
      {/* Heading */}
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
        className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"
      >
        <motion.div variants={item}>
          <h1 className="text-xl font-bold sm:text-2xl">Complaints</h1>
          <p className="text-xs text-slate-400">
            Track and manage resident complaints
          </p>
        </motion.div>

        {/* New button: opens the New Complaint modal */}
        <motion.div variants={item}>
          <button
            type="button"
            onClick={() => setShowComplaintModal(true)}
            className="flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-linear-to-r from-[#6C63FF] to-[#4DA3FF] px-4 py-2.5 text-xs font-semibold text-white transition hover:opacity-90 active:scale-95"
          >
            <Plus className="h-3.5 w-3.5" /> New Complaint
          </button>
        </motion.div>
      </motion.div>

      {/* Stat cards (same size as President dashboard cards) */}
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
            {/* Coloured accent line at the bottom of the card */}
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
        className="grid grid-cols-1 gap-2 rounded-xl border border-[#272D39] bg-[#10131A] p-3 min-[480px]:grid-cols-2 lg:grid-cols-3 xl:grid-cols-[1.5fr_repeat(4,1fr)_auto_auto]"
      >
        {/* Search */}
        <div className="relative min-[480px]:col-span-2 lg:col-span-3 xl:col-span-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search complaints..."
            className={`${field} pl-9`}
          />
        </div>
        <Select
          value={status}
          onChange={setStatus}
          all="All Status"
          options={statuses}
        />
        <Select
          value={activeCategory}
          onChange={setCategory}
          all="All Category"
          options={categories}
        />
        <Select
          value={tower}
          onChange={setTower}
          all="All Tower"
          options={towers}
        />
        <Select
          value={priority}
          onChange={setPriority}
          all="All Priority"
          options={priorities}
        />

        {/* Date range (UI only - connect to the API later) */}
        <button
          type="button"
          className="flex items-center justify-center gap-2 whitespace-nowrap rounded-lg border border-[#272D39] px-3 py-2 text-xs text-slate-300 hover:bg-white/5"
        >
          <CalendarDays className="h-3.5 w-3.5" /> Oct 1 - Oct 31
        </button>
        <button
          type="button"
          onClick={reset}
          className="flex items-center justify-center gap-2 rounded-lg border border-[#272D39] px-3 py-2 text-xs text-slate-300 hover:bg-white/5"
        >
          <RotateCcw className="h-3.5 w-3.5" /> Reset
        </button>
      </motion.div>

      {/* Table */}
      <motion.div
        variants={item}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
      >
        <Card title="All Complaints" sub={`${list.length} complaints`}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-[11px]">
              <thead className="text-slate-400">
                <tr>
                  <th className={th}>Complaint</th>
                  <th className={th}>Raised By</th>
                  <th className={th}>Category</th>
                  <th className={th}>Priority</th>
                  <th className={th}>Date</th>
                  <th className={th}>Assigned To</th>
                  <th className={th}>Status</th>
                  <th className={`${th} text-right`}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.map((c, i) => {
                  const col = avatarColors[i % avatarColors.length];
                  return (
                    <tr key={c.id} className="hover:bg-white/[0.02]">
                      <td className={td}>
                        <span className="block font-semibold">{c.title}</span>
                        <span className="block text-[10px] text-slate-500">
                          {c.id}
                        </span>
                      </td>
                      <td className={td}>
                        <span className="flex items-center gap-2">
                          {/* Avatar with initials */}
                          <span
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                            style={{ background: `${col}26`, color: col }}
                          >
                            {initials(c.by)}
                          </span>
                          <span>
                            <span className="block font-medium">{c.by}</span>
                            <span className="block text-[10px] text-slate-500">
                              {c.flat}
                            </span>
                          </span>
                        </span>
                      </td>
                      <td className={`${td} text-slate-300`}>{c.category}</td>
                      <td className={td}>
                        <Badge tone={priorityTone[c.priority]}>
                          {c.priority}
                        </Badge>
                      </td>
                      <td className={`${td} text-slate-400`}>{c.date}</td>
                      <td className={`${td} text-slate-300`}>{c.assigned}</td>
                      <td className={td}>
                        <Badge tone={statusTone[c.status]}>{c.status}</Badge>
                      </td>
                      <td className={`${td} text-right`}>
                        <span className="inline-flex items-center gap-0.5 text-slate-400">
                          {/* View: opens the details popup */}
                          <button
                            type="button"
                            title="View Details"
                            aria-label="View"
                            onClick={() => setViewing(c)}
                            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md transition hover:bg-white/5 hover:text-white active:scale-90"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </button>
                          {/* Edit: opens the edit popup */}
                          <button
                            type="button"
                            title="Edit"
                            aria-label="Edit"
                            onClick={() => setEditing(c)}
                            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md transition hover:bg-white/5 hover:text-[#A29CFF] active:scale-90"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          {/* Three dot: opens the actions dropdown (change status / delete) */}
                          <button
                            type="button"
                            data-menu-btn
                            title="More actions"
                            aria-label="More actions"
                            aria-haspopup="menu"
                            aria-expanded={menu?.id === c.id}
                            onClick={(e) => toggleMenu(e, c.id)}
                            className={`flex h-7 w-7 cursor-pointer items-center justify-center rounded-md transition hover:bg-white/5 active:scale-90 ${
                              menu?.id === c.id ? "bg-white/5 text-slate-200" : ""
                            }`}
                          >
                            <MoreVertical className="h-3.5 w-3.5" />
                          </button>
                        </span>
                      </td>
                    </tr>
                  );
                })}

                {/* Empty state */}
                {list.length === 0 && (
                  <tr>
                    <td
                      colSpan={8}
                      className={`${td} py-8 text-center text-slate-500`}
                    >
                      No complaints found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-4 flex flex-col items-center justify-between gap-3 text-[11px] text-slate-400 sm:flex-row">
            <span>
              Showing {list.length ? `1-${list.length}` : 0} of {total}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Previous page"
                className="flex h-7 w-7 items-center justify-center rounded-md border border-[#272D39] hover:bg-white/5"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              {[1, 2, 3].map((p) => (
                <button
                  key={p}
                  type="button"
                  className={`h-7 w-7 rounded-md border text-[11px] ${
                    p === 1
                      ? "border-transparent bg-gradient-to-br from-[#6C63FF] to-[#4DA3FF] font-semibold text-white" // Active page: Figma gradient
                      : "border-[#272D39] hover:bg-white/5"
                  }`}
                >
                  {p}
                </button>
              ))}
              <button
                type="button"
                aria-label="Next page"
                className="flex h-7 w-7 items-center justify-center rounded-md border border-[#272D39] hover:bg-white/5"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Three-dot dropdown: fixed position so the table's overflow does not clip it */}
      {menu && menuItem && (
        <div
          ref={menuRef}
          role="menu"
          style={{ top: menu.top, left: menu.left, width: MENU_WIDTH }}
          className="fixed z-50 overflow-hidden rounded-lg border border-[#272D39] bg-[#10131A] p-1 text-[11px] shadow-xl shadow-black/40"
        >
          {/* Status options: every status except the current one */}
          {statuses
            .filter((s) => s !== menuItem.status)
            .map((s) => {
              const { icon: StatusIcon, cls } = statusIcon[s];
              return (
                <button
                  key={s}
                  type="button"
                  role="menuitem"
                  onClick={() => changeStatus(menuItem, s)}
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
              setDeleting(menuItem);
              setMenu(null);
            }}
            className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-left text-red-400 transition-colors hover:bg-red-500/10"
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
        </div>
      )}

      {/* New Complaint modal */}
      <AddComplaintModal
        open={showComplaintModal}
        onClose={() => setShowComplaintModal(false)}
        onSave={handleSave}
      />

      {/* View Details popup */}
      <AnimatePresence>
        {viewing && (
          <ViewComplaintModal
            key={viewing.id}
            record={viewing}
            onClose={() => setViewing(null)}
          />
        )}
      </AnimatePresence>

      {/* Edit popup */}
      <AnimatePresence>
        {editing && (
          <EditComplaintModal
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
          <DeleteComplaintConfirm
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