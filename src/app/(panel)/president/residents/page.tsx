"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, type Variants } from "framer-motion";
import {
  Users,
  Home,
  KeyRound,
  UserCheck,
  Clock,
  LogOut,
  Search,
  SlidersHorizontal,
  Plus,
  Upload,
  MoreVertical,
  Car,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  User,
  Pencil,
  CreditCard,
  DoorOpen,
  Archive,
} from "lucide-react";
import { Card, Progress, Badge, LinkBtn } from "@/Components/ui";

/* ---------- Animation (same as dashboard) ---------- */

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

/* ---------- Types ---------- */

type ResidentType = "Owner" | "Tenant" | "Co-Owner" | "Family Member";
type Verification = "Verified" | "Pending" | "Rejected";
type Status = "Active" | "Pending" | "Blocked";

type Resident = {
  id: number;
  name: string;
  sub: string;
  unit: string;
  tower: string;
  type: ResidentType;
  phone: string;
  email: string;
  family: number;
  vehicles: number;
  verification: Verification;
  status: Status;
  lastActivity: string;
};

/* ---------- Data (replace with API data later) ---------- */

const residents: Resident[] = [
  {
    id: 1,
    name: "Priya Sharma",
    sub: "Owner • RES-1284",
    unit: "A-1245",
    tower: "Tower A • 12th",
    type: "Owner",
    phone: "+91 8789598980",
    email: "priya.sharma@email.com",
    family: 4,
    vehicles: 2,
    verification: "Verified",
    status: "Active",
    lastActivity: "2 hours ago",
  },
  {
    id: 2,
    name: "Aarav Mehta",
    sub: "Tenant • RES-1285",
    unit: "A-1245",
    tower: "Tower A • 12th",
    type: "Tenant",
    phone: "+91 8789598980",
    email: "priya.sharma@email.com",
    family: 6,
    vehicles: 6,
    verification: "Pending",
    status: "Pending",
    lastActivity: "2 hours ago",
  },
  {
    id: 3,
    name: "Roshan Verma",
    sub: "Owner • RES-1286",
    unit: "A-1245",
    tower: "Tower A • 12th",
    type: "Co-Owner",
    phone: "+91 8789598980",
    email: "priya.sharma@email.com",
    family: 3,
    vehicles: 9,
    verification: "Rejected",
    status: "Blocked",
    lastActivity: "2 hours ago",
  },
  {
    id: 4,
    name: "Vikram Patel",
    sub: "Owner • RES-1287",
    unit: "A-1245",
    tower: "Tower A • 12th",
    type: "Family Member",
    phone: "+91 8789598980",
    email: "priya.sharma@email.com",
    family: 8,
    vehicles: 6,
    verification: "Verified",
    status: "Active",
    lastActivity: "2 hours ago",
  },
  {
    id: 5,
    name: "Ananya Singh",
    sub: "Owner • RES-1288",
    unit: "A-1245",
    tower: "Tower A • 12th",
    type: "Owner",
    phone: "+91 8789598980",
    email: "priya.sharma@email.com",
    family: 2,
    vehicles: 2,
    verification: "Verified",
    status: "Active",
    lastActivity: "2 hours ago",
  },
];

// Stat cards (same card design as the dashboard)
const stats = [
  { label: "Total Residents", value: "2,469", sub: "+25 This Month", subC: "text-emerald-400", icon: Users, c: "#6C63FF" },
  { label: "Owners", value: "1,469", sub: "60.1% Of Residents", subC: "text-emerald-400", icon: Home, c: "#3B82F6" },
  { label: "Tenants", value: "869", sub: "40.5% Of Residents", subC: "text-emerald-400", icon: KeyRound, c: "#00C2B8" },
  { label: "Active Residents", value: "1,869", sub: "95.5% Active", subC: "text-emerald-400", icon: UserCheck, c: "#10B981" },
  { label: "Pending Verify", value: "469", sub: "Needs Attention", subC: "text-orange-400", icon: Clock, c: "#F59E0B" },
  { label: "Moved Out", value: "69", sub: "This Month", subC: "text-slate-400", icon: LogOut, c: "#94A3B8" },
];

// Data health bars (label, value, color)
const dataHealth = [
  ["Profile Completion", 94, "#00C2B8"],
  ["Verified Residents", 90, "#00C2B8"],
  ["Missing Documents", 24, "#00C2B8"],
  ["Missing Emergency contact", 14, "#00C2B8"],
] as const;

const recentActivity = [
  { name: "Priya Sharma", text: "Update Mobile Number", time: "5 min Ago" },
  { name: "Aarav Mehta", text: "Added New Vehicle", time: "5 min Ago" },
  { name: "Neha Kapoor", text: "Resident Verification Completed", time: "5 min Ago" },
  { name: "Rohan Verma", text: "Moved Into Tower C", time: "1 Hour Ago" },
];

/* ---------- Badge tones (same Badge component) ---------- */

const typeTone: Record<ResidentType, "blue" | "orange" | "purple" | "gray"> = {
  Owner: "blue",
  Tenant: "orange",
  "Co-Owner": "purple",
  "Family Member": "gray",
};

const verificationTone: Record<Verification, "green" | "orange" | "red"> = {
  Verified: "green",
  Pending: "orange",
  Rejected: "red",
};

const statusTone: Record<Status, "green" | "orange" | "red"> = {
  Active: "green",
  Pending: "orange",
  Blocked: "red",
};

/* ---------- Shared styles ---------- */

// Avatar colors and initials
const avatarColors = ["#3B82F6", "#8B5CF6", "#00C2B8", "#F59E0B", "#EF4444"];
const initials = (n: string) =>
  n
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

// Table header cell / body cell
const th =
  "bg-white/4 px-2 py-2 font-medium first:rounded-l-md last:rounded-r-md";
const td = "border-t border-[#272D39] px-2 py-2.5";

// Search input style
const field =
  "w-full rounded-lg border border-[#272D39] bg-[#10131A] px-3 py-2 text-xs text-slate-200 outline-none placeholder:text-slate-500 focus:border-[#A29CFF]/60";

// Action menu items (the last one is shown in red)
const menuItems = [
  { label: "View Profile", icon: User, danger: false },
  { label: "Edit Resident", icon: Pencil, danger: false },
  { label: "View Payment", icon: CreditCard, danger: false },
  { label: "Move Out", icon: DoorOpen, danger: false },
  { label: "Archive", icon: Archive, danger: true },
];

// Round avatar
function Avatar({ name, index = 0 }: { name: string; index?: number }) {
  const c = avatarColors[index % avatarColors.length];
  return (
    <span
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
      style={{ background: `${c}26`, color: c }}
    >
      {initials(name)}
    </span>
  );
}

/* ---------- Page ---------- */

export default function ResidentsPage() {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  // Open action menu (fixed position so the table scroll area never clips it)
  const [menu, setMenu] = useState<{
    id: number;
    top: number;
    left: number;
  } | null>(null);

  // Search by name, unit, phone, email or resident id
  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return residents;
    return residents.filter((r) =>
      [r.name, r.unit, r.phone, r.email, r.sub].some((v) =>
        v.toLowerCase().includes(q),
      ),
    );
  }, [query]);

  // Close the action menu on outside click, scroll or resize
  useEffect(() => {
    if (!menu) return;
    const close = () => setMenu(null);
    window.addEventListener("click", close);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => {
      window.removeEventListener("click", close);
      window.removeEventListener("scroll", close, true);
      window.removeEventListener("resize", close);
    };
  }, [menu]);

  const openMenu = (e: React.MouseEvent<HTMLButtonElement>, id: number) => {
    e.stopPropagation();
    if (menu?.id === id) return setMenu(null);
    const rect = e.currentTarget.getBoundingClientRect();
    // Menu is ~170px wide and ~190px tall; flip up if there is no room below
    const top =
      rect.bottom + 190 > window.innerHeight ? rect.top - 190 : rect.bottom + 6;
    setMenu({ id, top, left: rect.right - 170 });
  };

  const pages = [1, 2, 3, 4, 5];

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
            Manage residents, owners, tenants, family members and their
            connected society information
          </p>
          <p className="mt-1.5 flex items-center gap-2 text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Green Valley Residency
            </span>
            <span>•</span>
            <span>1,842 registered residents</span>
          </p>
        </motion.div>

        {/* Add Resident first, then Export */}
        <motion.div variants={item} className="flex items-center gap-2">
          <button
            type="button"
            className="flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-linear-to-r from-[#6C63FF] to-[#4DA3FF] px-4 py-2.5 text-xs font-semibold text-white transition hover:opacity-90 active:scale-95"
          >
            <Plus className="h-3.5 w-3.5" /> Add Resident
          </button>
          <button
            type="button"
            className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-[#272D39] px-4 py-2.5 text-xs text-slate-300 transition-colors hover:bg-white/5 active:scale-95"
          >
            <Upload className="h-3.5 w-3.5" /> Export
          </button>
        </motion.div>
      </motion.div>

      {/* Stat cards (same grid and card size as the dashboard) */}
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
              className="absolute inset-x-0 bottom-0 h-[3px]"
              style={{ background: c }}
            />
          </motion.div>
        ))}
      </motion.div>

      {/* Search + filters */}
      <motion.div
        variants={item}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
        className="grid grid-cols-1 gap-2 rounded-xl border border-[#272D39] bg-[#10131A] p-3 min-[480px]:grid-cols-[1fr_auto]"
      >
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by Name, Flat Number, Phone, Email, Resident ID..."
            className={`${field} pl-9`}
          />
        </div>

        <button
          type="button"
          className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-[#272D39] px-4 py-2 text-xs text-slate-300 hover:bg-white/5"
        >
          <SlidersHorizontal className="h-3.5 w-3.5" /> Filters
        </button>
      </motion.div>

      {/* Residents table (no checkboxes) */}
      <motion.div
        variants={item}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
      >
        <Card title="Residents List" sub={`Total ${list.length} residents`}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-250 text-left text-[11px]">
              <thead className="text-slate-400">
                <tr>
                  <th className={th}>Resident</th>
                  <th className={th}>Unit</th>
                  <th className={th}>Type</th>
                  <th className={th}>Contact</th>
                  <th className={th}>Family</th>
                  <th className={th}>Vehicles</th>
                  <th className={th}>Verification</th>
                  <th className={th}>Status</th>
                  <th className={th}>Last Activity</th>
                  <th className={`${th} text-center`}>Actions</th>
                </tr>
              </thead>

              <tbody>
                {list.map((r, i) => (
                  <tr key={r.id} className="hover:bg-white/2">
                    {/* Resident */}
                    <td className={td}>
                      <span className="flex items-center gap-2">
                        <Avatar name={r.name} index={i} />
                        <span className="leading-tight">
                          <span className="block font-medium">{r.name}</span>
                          <span className="block text-[10px] text-slate-400">
                            {r.sub}
                          </span>
                        </span>
                      </span>
                    </td>

                    {/* Unit */}
                    <td className={td}>
                      <span className="block leading-tight">
                        <span className="block text-slate-300">{r.unit}</span>
                        <span className="block text-[10px] text-slate-400">
                          {r.tower}
                        </span>
                      </span>
                    </td>

                    {/* Type */}
                    <td className={td}>
                      <Badge tone={typeTone[r.type]}>{r.type}</Badge>
                    </td>

                    {/* Contact */}
                    <td className={td}>
                      <span className="block leading-tight">
                        <span className="block text-slate-300">{r.phone}</span>
                        <span className="block max-w-35 break-all text-[10px] text-slate-400">
                          {r.email}
                        </span>
                      </span>
                    </td>

                    {/* Family */}
                    <td className={`${td} text-slate-300`}>
                      {r.family} Members
                    </td>

                    {/* Vehicles */}
                    <td className={`${td} text-slate-300`}>
                      <span className="flex items-center gap-1.5">
                        <Car className="h-3.5 w-3.5 text-slate-400" />
                        {r.vehicles} Vehicles
                      </span>
                    </td>

                    {/* Verification */}
                    <td className={td}>
                      <Badge tone={verificationTone[r.verification]}>
                        {r.verification}
                      </Badge>
                    </td>

                    {/* Status */}
                    <td className={td}>
                      <Badge tone={statusTone[r.status]}>{r.status}</Badge>
                    </td>

                    {/* Last activity */}
                    <td className={`${td} text-slate-400`}>
                      {r.lastActivity}
                    </td>

                    {/* Actions */}
                    <td className={`${td} text-center`}>
                      <button
                        type="button"
                        onClick={(e) => openMenu(e, r.id)}
                        aria-label="Open actions menu"
                        className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-[#272D39] text-slate-300 transition hover:bg-white/5 hover:text-white"
                      >
                        <MoreVertical className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}

                {list.length === 0 && (
                  <tr>
                    <td
                      colSpan={10}
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
            <span>Showing 1-{list.length} of 1,842 residents</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                aria-label="Previous page"
                className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-[#272D39] hover:bg-white/5"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>

              {pages.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPage(p)}
                  className={`h-7 w-7 cursor-pointer rounded-md border text-[11px] ${
                    p === page
                      ? "border-transparent bg-linear-to-br from-[#6C63FF] to-[#4DA3FF] font-semibold text-white"
                      : "border-[#272D39] hover:bg-white/5"
                  }`}
                >
                  {p}
                </button>
              ))}

              <span className="px-1 text-slate-500">..</span>

              <button
                type="button"
                onClick={() => setPage(74)}
                className={`h-7 min-w-7 cursor-pointer rounded-md border px-1.5 text-[11px] ${
                  page === 74
                    ? "border-transparent bg-linear-to-br from-[#6C63FF] to-[#4DA3FF] font-semibold text-white"
                    : "border-[#272D39] hover:bg-white/5"
                }`}
              >
                74
              </button>

              <button
                type="button"
                onClick={() => setPage((p) => Math.min(74, p + 1))}
                aria-label="Next page"
                className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-[#272D39] hover:bg-white/5"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Data health + recent activity */}
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
        className="grid grid-cols-1 gap-4 xl:grid-cols-2"
      >
        {/* Resident data health */}
        <motion.div variants={item} className="min-w-0 [&>*]:h-full">
          <Card
            title="Resident Data Health"
            sub="Completeness and accuracy across the directory"
          >
            <div className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
              {dataHealth.map(([l, v, c]) => (
                <Progress key={l} label={l} value={v} color={c} />
              ))}
            </div>
            <div className="mt-4">
              <LinkBtn>Review Data Quality →</LinkBtn>
            </div>
          </Card>
        </motion.div>

        {/* Recent resident activity */}
        <motion.div variants={item} className="min-w-0 [&>*]:h-full">
          <Card
            title="Recent Resident Activity"
            sub="Latest Updates Across Resident Records"
            action={
              <button className="flex items-center gap-1 text-[11px] text-slate-300">
                View All Activity <ArrowRight className="h-3 w-3" />
              </button>
            }
          >
            <div className="flex flex-col gap-2">
              {recentActivity.map((a, i) => (
                <div
                  key={a.name}
                  className="flex items-center gap-3 rounded-lg border border-[#272D39] bg-white/3 px-3 py-2"
                >
                  <Avatar name={a.name} index={i} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold">{a.name}</p>
                    <p className="truncate text-[10px] text-slate-400">
                      {a.text}
                    </p>
                  </div>
                  <span className="shrink-0 text-[10px] text-slate-500">
                    {a.time}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </motion.div>

      {/* Action dropdown (fixed, outside the scroll area) */}
      {menu && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{ top: menu.top, left: menu.left }}
          className="fixed z-60 w-42.5 overflow-hidden rounded-lg border border-[#272D39] bg-[#161A23] p-1 shadow-2xl"
        >
          {menuItems.map(({ label, icon: Icon, danger }) => (
            <button
              key={label}
              type="button"
              onClick={() => setMenu(null)}
              className={`flex w-full cursor-pointer items-center gap-2 rounded-md px-3 py-2 text-left text-xs font-medium transition ${
                danger
                  ? "text-red-400 hover:bg-red-500/10"
                  : "text-slate-300 hover:bg-white/5 hover:text-white"
              }`}
            >
              <Icon className="h-3.5 w-3.5" />
              {label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}