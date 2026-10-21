"use client";

import { useMemo, useState } from "react";
import { motion, type Variants } from "framer-motion";
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

/* ---------- Small pieces ---------- */
/* IMAGE: staff photo (32x32). Shows initials if there is no photo */
function Avatar({ src, name }: { src: string; name: string }) {
  if (!src) {
    return (
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#272D39] bg-[#6C63FF]/25 text-[10px] font-bold text-[#A29CFF]">
        {initials(name)}
      </span>
    );
  }
  return (
    <img
      src={src}
      alt={name}
      width={32}
      height={32}
      className="h-8 w-8 shrink-0 rounded-full border border-[#272D39] object-cover"
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

function Actions() {
  return (
    <div className="flex items-center gap-0.5 text-slate-400">
      <button
        type="button"
        aria-label="View"
        className="rounded-md p-1.5 hover:bg-white/5 hover:text-white"
      >
        <Eye className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        aria-label="Edit"
        className="rounded-md p-1.5 hover:bg-white/5 hover:text-white"
      >
        <Pencil className="h-3.5 w-3.5" />
      </button>
      <button
        type="button"
        aria-label="More"
        className="rounded-md p-1.5 hover:bg-white/5 hover:text-white"
      >
        <EllipsisVertical className="h-3.5 w-3.5" />
      </button>
    </div>
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

      {/* Stat cards (same card size as Dashboard cards) */}
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
        className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-3"
      >
        {stats.map(({ label, value, icon: Icon, c }) => (
          <motion.div
            key={label}
            variants={item}
            className="relative min-h-[129px] overflow-hidden rounded-xl border border-[#272D39] bg-[#10131A] p-4"
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
                      <Actions />
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
              <Actions />
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
    </div>
  );
}