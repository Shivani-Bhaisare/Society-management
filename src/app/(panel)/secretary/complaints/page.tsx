"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { motion, type Variants } from "framer-motion";
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

/* ---------- Page ---------- */
export default function ComplaintsPage() {
  // Complaints data + modal state
  const [items, setItems] = useState<Complaint[]>(initialComplaints);
  const [added, setAdded] = useState(0); // how many new complaints were added
  const [showComplaintModal, setShowComplaintModal] = useState(false);

  // Filter state
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("All");
  const [category, setCategory] = useState("All");
  const [tower, setTower] = useState("All");
  const [priority, setPriority] = useState("All");

  // Category dropdown options (auto-updates when a new category is added)
  const categories = useMemo(
    () => Array.from(new Set(items.map((c) => c.category))),
    [items],
  );

  // Stat cards (Total and Open increase when a new complaint is added)
  const stats = [
    {
      label: "Total Complaints",
      value: String(BASE_TOTAL + added),
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

  // Apply search + all filters
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return items.filter(
      (c) =>
        (status === "All" || c.status === status) &&
        (category === "All" || c.category === category) &&
        (tower === "All" || c.tower === tower) &&
        (priority === "All" || c.priority === priority) &&
        (!s ||
          `${c.id} ${c.title} ${c.by} ${c.flat}`.toLowerCase().includes(s)),
    );
  }, [items, q, status, category, tower, priority]);

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
          value={category}
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
                          <Link
                            href={`/secretary/complaints/${c.id}`}
                            aria-label="View"
                            className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-white/5"
                          >
                            <Eye className="h-3.5 w-3.5" />
                          </Link>
                          <Link
                            href={`/secretary/complaints/${c.id}/edit`}
                            aria-label="Edit"
                            className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-white/5"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Link>
                          <button
                            type="button"
                            aria-label="More actions"
                            className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-white/5"
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
              Showing {list.length ? `1-${list.length}` : 0} of{" "}
              {BASE_TOTAL + added}
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

      {/* New Complaint modal */}
      <AddComplaintModal
        open={showComplaintModal}
        onClose={() => setShowComplaintModal(false)}
        onSave={handleSave}
      />
    </div>
  );
}