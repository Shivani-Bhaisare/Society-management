"use client";

import { useMemo, useState } from "react";
import { motion, type Variants } from "framer-motion";
import {
  Users,
  Home,
  KeyRound,
  Building2,
  Search,
  Filter,
  Plus,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { Card, Badge } from "@/Components/ui";
import AddResidentModal from "@/Components/AddResidentModal";

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
    label: "Total Residents",
    value: "186",
    sub: "Across 6 towers",
    subC: "text-slate-400",
    icon: Users,
    c: "#3B82F6",
  },
  {
    label: "Owners",
    value: "142",
    sub: "76% of residents",
    subC: "text-emerald-400",
    icon: Building2,
    c: "#00C2B8",
  },
  {
    label: "Tenants",
    value: "44",
    sub: "24% of residents",
    subC: "text-slate-400",
    icon: Home,
    c: "#8B5CF6",
  },
  {
    label: "Vacant Units",
    value: "12",
    sub: "Available for rent / sale",
    subC: "text-orange-400",
    icon: KeyRound,
    c: "#F59E0B",
  },
];

type Resident = {
  name: string;
  unit: string;
  tower: string;
  type: "Owner" | "Tenant";
  status: "Active" | "Inactive";
  phone: string;
};

const residents: Resident[] = [
  {
    name: "Rahul Sharma",
    unit: "A-101",
    tower: "A",
    type: "Owner",
    status: "Active",
    phone: "+91 98765 43210",
  },
  {
    name: "Priya Nair",
    unit: "B-202",
    tower: "B",
    type: "Tenant",
    status: "Active",
    phone: "+91 98765 43211",
  },
  {
    name: "Amit Singh",
    unit: "C-301",
    tower: "C",
    type: "Owner",
    status: "Active",
    phone: "+91 98765 43212",
  },
  {
    name: "Neha Gupta",
    unit: "D-105",
    tower: "D",
    type: "Owner",
    status: "Active",
    phone: "+91 98765 43213",
  },
  {
    name: "Suresh Patel",
    unit: "E-404",
    tower: "E",
    type: "Tenant",
    status: "Active",
    phone: "+91 98765 43214",
  },
  {
    name: "Anjali Verma",
    unit: "F-203",
    tower: "F",
    type: "Owner",
    status: "Active",
    phone: "+91 98765 43215",
  },
  {
    name: "Rohit Mehta",
    unit: "A-302",
    tower: "A",
    type: "Tenant",
    status: "Active",
    phone: "+91 98765 43216",
  },
  {
    name: "Sneha Iyer",
    unit: "B-103",
    tower: "B",
    type: "Owner",
    status: "Active",
    phone: "+91 98765 43217",
  },
];

const avatarColors = ["#3B82F6", "#8B5CF6", "#00C2B8", "#F59E0B", "#EF4444"];
const initials = (n: string) =>
  n
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const th =
  "bg-white/4 px-2 py-2 font-medium first:rounded-l-md last:rounded-r-md";
const td = "border-t border-[#272D39] px-2 py-2.5";
const field =
  "w-full rounded-lg border border-[#272D39] bg-[#10131A] px-3 py-2 text-xs text-slate-200 outline-none placeholder:text-slate-500 focus:border-[#A29CFF]/60";

/* ---------- Page ---------- */
export default function ResidentsPage() {
  const [q, setQ] = useState("");
  const [tower, setTower] = useState("All");
  const [status, setStatus] = useState("All");
  const [addOpen, setAddOpen] = useState(false);

  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return residents.filter(
      (r) =>
        (tower === "All" || r.tower === tower) &&
        (status === "All" || r.status === status) &&
        (!s || `${r.name} ${r.unit} ${r.phone}`.toLowerCase().includes(s)),
    );
  }, [q, tower, status]);

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
          <h1 className="text-xl font-bold sm:text-2xl">Residents</h1>
          <p className="text-xs text-slate-400">
            Manage society residents and their details
          </p>
        </motion.div>

        {/* Add button: opens the modal on click */}
        <motion.div variants={item}>
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-linear-to-r from-[#6C63FF] to-[#4DA3FF] px-4 py-2.5 text-xs font-semibold text-white transition hover:opacity-90 active:scale-95"
          >
            <Plus className="h-3.5 w-3.5" /> Add Resident
          </button>
        </motion.div>
      </motion.div>

      {/* Stat cards (same card size as President dashboard) */}
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
        className="grid grid-cols-1 gap-2 rounded-xl border border-[#272D39] bg-[#10131A] p-3 min-[480px]:grid-cols-2 lg:grid-cols-[1fr_160px_160px_auto]"
      >
        <div className="relative min-[480px]:col-span-2 lg:col-span-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by name, unit, phone..."
            className={`${field} pl-9`}
          />
        </div>

        <div className="relative">
          <select
            value={tower}
            onChange={(e) => setTower(e.target.value)}
            className={`${field} appearance-none pr-8`}
          >
            <option value="All">Tower: All</option>
            {["A", "B", "C", "D", "E", "F"].map((t) => (
              <option key={t} value={t}>
                Tower {t}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
        </div>

        <div className="relative">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className={`${field} appearance-none pr-8`}
          >
            <option value="All">Status: All</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
        </div>

        <button
          type="button"
          onClick={() => {
            setQ("");
            setTower("All");
            setStatus("All");
          }}
          className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-[#272D39] px-4 py-2 text-xs text-slate-300 hover:bg-white/5"
        >
          <Filter className="h-3.5 w-3.5" /> Reset
        </button>
      </motion.div>

      {/* Residents table */}
      <motion.div
        variants={item}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
      >
        <Card title="Residents List" sub={`Total ${list.length} residents`}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-160 text-left text-[11px]">
              <thead className="text-slate-400">
                <tr>
                  <th className={th}>Name</th>
                  <th className={th}>Unit No.</th>
                  <th className={th}>Tower</th>
                  <th className={th}>Type</th>
                  <th className={th}>Status</th>
                  <th className={th}>Phone</th>
                </tr>
              </thead>
              <tbody>
                {list.map((r, i) => {
                  const c = avatarColors[i % avatarColors.length];
                  return (
                    <tr key={r.unit} className="hover:bg-white/2">
                      <td className={td}>
                        <span className="flex items-center gap-2 font-medium">
                          <span
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                            style={{ background: `${c}26`, color: c }}
                          >
                            {initials(r.name)}
                          </span>
                          {r.name}
                        </span>
                      </td>
                      <td className={`${td} text-slate-300`}>{r.unit}</td>
                      <td className={`${td} text-slate-400`}>{r.tower}</td>
                      <td className={td}>
                        <Badge tone={r.type === "Owner" ? "blue" : "orange"}>
                          {r.type}
                        </Badge>
                      </td>
                      <td className={td}>
                        <Badge tone={r.status === "Active" ? "green" : "gray"}>
                          {r.status}
                        </Badge>
                      </td>
                      <td className={`${td} text-slate-400`}>{r.phone}</td>
                    </tr>
                  );
                })}

                {list.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className={`${td} py-8 text-center text-slate-500`}
                    >
                      No residents found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-4 flex flex-col items-center justify-between gap-3 text-[11px] text-slate-400 sm:flex-row">
            <span>Showing 1-{list.length} of 186</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
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
                className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-[#272D39] hover:bg-white/5"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Add Resident modal */}
      <AddResidentModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSubmit={(data) => console.log("NEW RESIDENT", data)}
      />
    </div>
  );
}