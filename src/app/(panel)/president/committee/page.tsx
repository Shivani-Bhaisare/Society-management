"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { motion, type Variants } from "framer-motion";
import {
  Users,
  Crown,
  UserCheck,
  Clock,
  Layers,
  FileText,
  Search,
  SlidersHorizontal,
  Plus,
  Upload,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  User,
  Pencil,
  BadgeCheck,
  FolderOpen,
  UserX,
  LogOut,
} from "lucide-react";
import { Card, Badge } from "@/Components/ui";

/* ---------- Animation (same as residents / dashboard) ---------- */

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

/* ---------- Photos (files from the public folder) ---------- */

// Change the file names here if you want a different photo for a person.
// "/img8.png" means public/img8.png (keep the correct extension)
const PHOTOS: Record<string, string> = {
  "Rajesh Sharma": "/img20.jpg",
  "Pooja Dasai": "/img14.png",
  "Karan Rao": "/img22.jpg",
  "Nisha Bansal": "/img16.png",
  "Vivek Nair": "/img24.jpg",
};

/* ---------- Types ---------- */

type MemberStatus = "Active" | "Term Ending" | "Inactive";
type DocStatus = "Verified" | "Pending Review";

type Member = {
  id: number;
  name: string;
  sub: string;
  designation: string;
  unit: string;
  tower: string;
  phone: string;
  email: string;
  responsibilities: string[];
  termRange: string;
  termProgress: number; // 0 - 100
  status: MemberStatus;
  lastUpdated: string;
};

/* ---------- Data (replace with API data later) ---------- */

// Stat cards (same card design as the residents page)
const stats = [
  { label: "All Committee Members", value: "100", sub: "15 Former", subC: "text-emerald-400", icon: Users, c: "#6C63FF" },
  { label: "Office Bearers", value: "15", sub: "President To Treasurer", subC: "text-emerald-400", icon: Crown, c: "#3B82F6" },
  { label: "Active Members", value: "10", sub: "Within Current Term", subC: "text-emerald-400", icon: UserCheck, c: "#10B981" },
  { label: "Terms Ending Soon", value: "19", sub: "Within 30 Days", subC: "text-orange-400", icon: Clock, c: "#F59E0B" },
  { label: "Responsibility Coverage", value: "469", sub: "9 Areas Unassigned", subC: "text-orange-400", icon: Layers, c: "#00C2B8" },
  { label: "Committee Documents", value: "10", sub: "2 Pending Review", subC: "text-red-400", icon: FileText, c: "#94A3B8" },
];

// Office bearers shown in the leadership hierarchy
const leaders = [
  { name: "Rajesh Sharma", role: "PRESIDENT", unit: "A-1201 • Tower A", term: "Term 15 Apr 2025" },
  { name: "Pooja Dasai", role: "VICE PRESIDENT", unit: "B-1202 • Tower B", term: "Term 15 Apr 2025" },
  { name: "Karan Rao", role: "SECRETARY", unit: "L-1203 • Tower A", term: "Term 15 Apr 2025" },
  { name: "Nisha Bansal", role: "TREASURER", unit: "D-1204 • Tower A", term: "Term 15 Apr 2025" },
];

// Other committee members (pill row)
const committeeMembers = [
  { name: "Vivek Nair", role: "Joint Secretary" },
  { name: "Pooja Dasai", role: "Security" },
  { name: "Karan Rao", role: "Amenities" },
  { name: "Nisha Bansal", role: "Maintenance" },
];

// Table members (each row has a different name, so each gets a different photo)
const members: Member[] = [
  {
    id: 1,
    name: "Rajesh Sharma",
    sub: "Flat • 3701",
    designation: "President",
    unit: "A-1245",
    tower: "Tower A • 12th",
    phone: "+91 8789598980",
    email: "priya.sharma@email.com",
    responsibilities: ["Resident Welfare", "Governance", "+2 more"],
    termRange: "15 Apr 2025 - 14 Apr 2026",
    termProgress: 70,
    status: "Active",
    lastUpdated: "08 Oct 2026",
  },
  {
    id: 2,
    name: "Pooja Dasai",
    sub: "Flat • 3701",
    designation: "Vice President",
    unit: "A-1245",
    tower: "Tower A • 12th",
    phone: "+91 8789598980",
    email: "priya.sharma@email.com",
    responsibilities: ["Resident Welfare", "Events", "+1 more"],
    termRange: "15 Apr 2025 - 14 Apr 2026",
    termProgress: 70,
    status: "Active",
    lastUpdated: "08 Oct 2026",
  },
  {
    id: 3,
    name: "Karan Rao",
    sub: "Flat • 3701",
    designation: "President",
    unit: "A-1245",
    tower: "Tower A • 12th",
    phone: "+91 8789598980",
    email: "priya.sharma@email.com",
    responsibilities: ["Meeting & Minutes", "Governance", "+1 more"],
    termRange: "15 Apr 2025 - 14 Apr 2026",
    termProgress: 92,
    status: "Term Ending",
    lastUpdated: "08 Oct 2026",
  },
  {
    id: 4,
    name: "Nisha Bansal",
    sub: "Flat • 3701",
    designation: "President",
    unit: "A-1245",
    tower: "Tower A • 12th",
    phone: "+91 8789598980",
    email: "priya.sharma@email.com",
    responsibilities: ["Billing Oversight", "Finance", "+1 more"],
    termRange: "15 Apr 2025 - 14 Apr 2026",
    termProgress: 70,
    status: "Active",
    lastUpdated: "08 Oct 2026",
  },
  {
    id: 5,
    name: "Vivek Nair",
    sub: "Flat • 3701",
    designation: "President",
    unit: "A-1245",
    tower: "Tower A • 12th",
    phone: "+91 8789598980",
    email: "priya.sharma@email.com",
    responsibilities: ["Housekeeping", "Amenities", "+2 more"],
    termRange: "15 Apr 2025 - 14 Apr 2026",
    termProgress: 40,
    status: "Inactive",
    lastUpdated: "08 Oct 2026",
  },
];

// Responsibility coverage list (area + assigned member initials)
const coverage: [string, string[]][] = [
  ["Governance", ["RS", "PD"]],
  ["Governance", ["RS", "PD"]],
  ["Finance", ["NB", "VN"]],
  ["Security", ["KR", "PD"]],
  ["Maintenance", ["NB", "RS"]],
  ["Amenities", ["KR", "VN"]],
  ["Events", ["PD", "RS"]],
  ["Legal", ["VN", "NB"]],
];

// Terms that are about to end
const expiring = [
  { name: "Nisha Bansal", text: "Term ends 31 Oct 2026", initials: "NB", c: "#8B5CF6" },
  { name: "Vivek Nair", text: "Term ends 31 Oct 2026", initials: "VN", c: "#F59E0B" },
];

// Committee documents
const documents: { name: string; date: string; status: DocStatus }[] = [
  { name: "Election Result 2025.pdf", date: "16 Apr 2025", status: "Verified" },
  { name: "Committee Appointment Letter.pdf", date: "16 Apr 2025", status: "Verified" },
  { name: "Bank Signatory Resolution.pdf", date: "16 Apr 2025", status: "Pending Review" },
  { name: "Office Bearer KYC Bundle.zip", date: "16 Apr 2025", status: "Pending Review" },
  { name: "Code of Conduct Acknowledgement.pdf", date: "16 Apr 2025", status: "Verified" },
];

/* ---------- Badge tones (same Badge component) ---------- */

const statusTone: Record<MemberStatus, "green" | "orange" | "gray"> = {
  Active: "green",
  "Term Ending": "orange",
  Inactive: "gray",
};

const docTone: Record<DocStatus, "green" | "orange"> = {
  Verified: "green",
  "Pending Review": "orange",
};

// Progress bar color by member status
const termColor: Record<MemberStatus, string> = {
  Active: "#3B82F6",
  "Term Ending": "#F59E0B",
  Inactive: "#64748B",
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

// Table header cell / body cell (same as residents page)
const th =
  "bg-white/4 px-2 py-2 font-medium first:rounded-l-md last:rounded-r-md";
const td = "border-t border-[#272D39] px-2 py-2.5";

// Search input style
const field =
  "w-full rounded-lg border border-[#272D39] bg-[#10131A] px-3 py-2 text-xs text-slate-200 outline-none placeholder:text-slate-500 focus:border-[#A29CFF]/60";

// Small chip used for responsibilities
const chip =
  "whitespace-nowrap rounded-md border border-[#272D39] bg-white/5 px-1.5 py-0.5 text-[10px] text-slate-300";

// Action menu items (the last one is shown in red)
const menuItems = [
  { label: "View Profile", icon: User, danger: false },
  { label: "Edit Member", icon: Pencil, danger: false },
  { label: "Change Designation", icon: BadgeCheck, danger: false },
  { label: "View Documents", icon: FolderOpen, danger: false },
  { label: "Deactivate Member", icon: UserX, danger: false },
  { label: "Remove Committee", icon: LogOut, danger: true },
];

// Round avatar: shows the photo from the public folder,
// falls back to colored initials if there is no photo or it fails to load
function Avatar({
  name,
  index = 0,
  size = "h-7 w-7",
}: {
  name: string;
  index?: number;
  size?: string;
}) {
  const [failed, setFailed] = useState(false);
  const c = avatarColors[index % avatarColors.length];
  const src = PHOTOS[name];

  return (
    <span
      className={`relative flex ${size} shrink-0 items-center justify-center overflow-hidden rounded-full text-[10px] font-bold`}
      style={{ background: `${c}26`, color: c }}
    >
      {src && !failed ? (
        <Image
          src={src}
          alt={name}
          fill
          sizes="40px"
          onError={() => setFailed(true)}
          className="object-cover"
        />
      ) : (
        initials(name)
      )}
    </span>
  );
}

/* ---------- Page ---------- */

export default function CommitteePage() {
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(1);
  // Open action menu (fixed position so the table scroll area never clips it)
  const [menu, setMenu] = useState<{
    id: number;
    top: number;
    left: number;
  } | null>(null);

  // Search by name, designation, unit, responsibility or committee id
  const list = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return members;
    return members.filter((m) =>
      [m.name, m.designation, m.unit, m.sub, ...m.responsibilities].some((v) =>
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
    // Menu is ~170px wide and ~230px tall; flip up if there is no room below
    const top =
      rect.bottom + 230 > window.innerHeight ? rect.top - 230 : rect.bottom + 6;
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
          <h1 className="text-xl font-bold sm:text-2xl">Committee Master</h1>
          <p className="text-xs text-slate-400">
            Manage the society&apos;s committee structure, designations,
            responsibilities, tenure and related documents.
          </p>
          <p className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Managing Committee 2025–2026
            </span>
            <span>•</span>
            <span>Elected 15 Apr 2025</span>
          </p>
        </motion.div>

        {/* Add Member first, then Export */}
        <motion.div variants={item} className="flex items-center gap-2">
          <button
            type="button"
            className="flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-linear-to-r from-[#6C63FF] to-[#4DA3FF] px-4 py-2.5 text-xs font-semibold text-white transition hover:opacity-90 active:scale-95"
          >
            <Plus className="h-3.5 w-3.5" /> Add Member
          </button>
          <button
            type="button"
            className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-[#272D39] px-4 py-2.5 text-xs text-slate-300 transition-colors hover:bg-white/5 active:scale-95"
          >
            <Upload className="h-3.5 w-3.5" /> Export
          </button>
        </motion.div>
      </motion.div>

      {/* Stat cards (same grid and card size as the residents page) */}
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
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
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

      {/* Leadership hierarchy */}
      <motion.div
        variants={item}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
      >
        <Card
          title="Leadership Hierarchy"
          sub="Office bearers of the current managing committee"
          action={
            <button
              type="button"
              className="flex items-center gap-1 text-[11px] text-slate-300 hover:text-white"
            >
              View All Members <ArrowRight className="h-3 w-3" />
            </button>
          }
        >
          {/* Office bearer cards */}
          <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 xl:grid-cols-4">
            {leaders.map((l, i) => (
              <div
                key={l.role}
                className="rounded-xl border border-[#272D39] bg-white/3 p-3"
              >
                <div className="flex items-start gap-3">
                  <Avatar name={l.name} index={i} size="h-10 w-10" />
                  <div className="min-w-0 flex-1 leading-tight">
                    <p className="truncate text-xs font-semibold">{l.name}</p>
                    <p className="mt-0.5 truncate text-[9px] font-semibold tracking-wider text-[#8B85FF]">
                      {l.role}
                    </p>
                    <p className="mt-0.5 truncate text-[10px] text-slate-400">
                      {l.unit}
                    </p>
                  </div>
                  <Badge tone="green">Active</Badge>
                </div>
                <p className="mt-3 border-t border-[#272D39] pt-2 text-[10px] text-slate-400">
                  {l.term}
                </p>
              </div>
            ))}
          </div>

          {/* Committee members pill row */}
          <div className="mt-3 flex flex-col gap-2 rounded-xl border border-[#272D39] bg-white/3 p-3 sm:flex-row sm:items-center">
            <span className="shrink-0 text-xs font-semibold">
              Committee Members :-
            </span>
            <div className="flex flex-wrap gap-2">
              {committeeMembers.map((m, i) => (
                <span
                  key={m.name}
                  className="flex items-center gap-2 rounded-full bg-white py-1 pl-1 pr-3 text-[#10131A]"
                >
                  <Avatar name={m.name} index={i} size="h-6 w-6" />
                  <span className="leading-tight">
                    <span className="block text-[10px] font-semibold">
                      {m.name}
                    </span>
                    <span className="block text-[9px] text-slate-500">
                      {m.role}
                    </span>
                  </span>
                </span>
              ))}
            </div>
          </div>
        </Card>
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
            placeholder="Search by name, designation, unit, responsibility, committee ID..."
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

      {/* Committee members table */}
      <motion.div
        variants={item}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
      >
        <Card title="Committee Members" sub={`Total ${list.length} members`}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-300 text-left text-[11px]">
              <thead className="text-slate-400">
                <tr>
                  <th className={th}>Committee Member</th>
                  <th className={th}>Designation</th>
                  <th className={th}>Unit</th>
                  <th className={th}>Contact</th>
                  <th className={th}>Responsibilities</th>
                  <th className={th}>Term</th>
                  <th className={th}>Status</th>
                  <th className={th}>Last Updated</th>
                  <th className={`${th} text-center`}>Actions</th>
                </tr>
              </thead>

              <tbody>
                {list.map((m, i) => (
                  <tr key={m.id} className="hover:bg-white/2">
                    {/* Committee member */}
                    <td className={td}>
                      <span className="flex items-center gap-2">
                        <Avatar name={m.name} index={i} />
                        <span className="leading-tight">
                          <span className="block font-medium">{m.name}</span>
                          <span className="block text-[10px] text-slate-400">
                            {m.sub}
                          </span>
                        </span>
                      </span>
                    </td>

                    {/* Designation */}
                    <td className={td}>
                      <span className="whitespace-nowrap rounded-md bg-white px-2 py-1 text-[10px] font-semibold text-[#10131A]">
                        {m.designation}
                      </span>
                    </td>

                    {/* Unit */}
                    <td className={td}>
                      <span className="block leading-tight">
                        <span className="block text-slate-300">{m.unit}</span>
                        <span className="block text-[10px] text-slate-400">
                          {m.tower}
                        </span>
                      </span>
                    </td>

                    {/* Contact */}
                    <td className={td}>
                      <span className="block leading-tight">
                        <span className="block text-slate-300">{m.phone}</span>
                        <span className="block max-w-35 break-all text-[10px] text-slate-400">
                          {m.email}
                        </span>
                      </span>
                    </td>

                    {/* Responsibilities */}
                    <td className={td}>
                      <span className="flex max-w-40 flex-wrap gap-1">
                        {m.responsibilities.map((r) => (
                          <span key={r} className={chip}>
                            {r}
                          </span>
                        ))}
                      </span>
                    </td>

                    {/* Term + progress */}
                    <td className={td}>
                      <span className="block min-w-32.5 leading-tight">
                        <span className="block text-slate-300">
                          {m.termRange}
                        </span>
                        <span className="mt-1.5 block h-1 w-full overflow-hidden rounded-full bg-white/10">
                          <span
                            className="block h-full rounded-full"
                            style={{
                              width: `${m.termProgress}%`,
                              background: termColor[m.status],
                            }}
                          />
                        </span>
                      </span>
                    </td>

                    {/* Status */}
                    <td className={td}>
                      <Badge tone={statusTone[m.status]}>{m.status}</Badge>
                    </td>

                    {/* Last updated */}
                    <td className={`${td} text-slate-400`}>{m.lastUpdated}</td>

                    {/* Actions */}
                    <td className={`${td} text-center`}>
                      <button
                        type="button"
                        onClick={(e) => openMenu(e, m.id)}
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
                      colSpan={9}
                      className={`${td} py-8 text-center text-slate-500`}
                    >
                      No committee members found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-4 flex flex-col items-center justify-between gap-3 text-[11px] text-slate-400 sm:flex-row">
            <span>Showing 1-{list.length} of 100 members</span>
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

      {/* Responsibility coverage + tenure tracking + documents */}
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
        className="grid grid-cols-1 gap-4 xl:grid-cols-3"
      >
        {/* Responsibility coverage */}
        <motion.div variants={item} className="min-w-0 [&>*]:h-full">
          <Card
            title="Responsibility Coverage"
            sub="Operational areas mapped to active members"
          >
            <div className="flex flex-col">
              {coverage.map(([area, people], i) => (
                <div
                  key={`${area}-${i}`}
                  className="flex items-center justify-between border-b border-[#272D39] py-2 text-xs last:border-b-0"
                >
                  <span className="text-slate-300">{area}</span>
                  <span className="flex -space-x-1.5">
                    {people.map((p, j) => (
                      <span
                        key={p + j}
                        className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-[#10131A] text-[9px] font-bold"
                        style={{
                          background: `${avatarColors[(i + j) % avatarColors.length]}33`,
                          color: avatarColors[(i + j) % avatarColors.length],
                        }}
                      >
                        {p}
                      </span>
                    ))}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Tenure tracking */}
        <motion.div variants={item} className="min-w-0 [&>*]:h-full">
          <Card
            title="Tenure Tracking"
            sub="Current term progress and upcoming expiries"
          >
            {/* Term progress */}
            <div className="rounded-lg border border-[#272D39] bg-white/3 p-3">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-semibold">Committee term 2025–2026</span>
                <span className="text-slate-400">55% elapsed</span>
              </div>
              <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-[#3B82F6]"
                  style={{ width: "55%" }}
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-[10px] text-slate-400">
                <span>15 Apr 2025</span>
                <span>Next election due Apr 2026</span>
              </div>
            </div>

            {/* Terms ending soon */}
            <div className="mt-3 flex flex-col gap-2">
              {expiring.map((e) => (
                <div
                  key={e.name}
                  className="flex items-center gap-3 rounded-lg bg-white px-3 py-2 text-[#10131A]"
                >
                  <span
                    className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                    style={{ background: `${e.c}33`, color: e.c }}
                  >
                    {e.initials}
                  </span>
                  <span className="min-w-0 flex-1 leading-tight">
                    <span className="block truncate text-xs font-semibold">
                      {e.name}
                    </span>
                    <span className="block truncate text-[10px] text-orange-500">
                      {e.text}
                    </span>
                  </span>
                  <button
                    type="button"
                    className="cursor-pointer rounded-md border border-slate-300 px-2.5 py-1 text-[10px] font-medium transition hover:bg-slate-100"
                  >
                    Renew
                  </button>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Committee documents */}
        <motion.div variants={item} className="min-w-0 [&>*]:h-full">
          <Card
            title="Committee Documents"
            sub="Appointment and governance records"
          >
            <div className="flex flex-col gap-2">
              {documents.map((d) => (
                <div
                  key={d.name}
                  className="flex items-center gap-3 rounded-lg border border-[#272D39] bg-white/3 px-3 py-2"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-[#3B82F6]/15 text-[#3B82F6]">
                    <FileText className="h-3.5 w-3.5" />
                  </span>
                  <span className="min-w-0 flex-1 leading-tight">
                    <span className="block truncate text-[11px] font-semibold">
                      {d.name}
                    </span>
                    <span className="block text-[10px] text-slate-400">
                      {d.date}
                    </span>
                  </span>
                  <Badge tone={docTone[d.status]}>{d.status}</Badge>
                </div>
              ))}
            </div>

            <button
              type="button"
              className="mt-3 flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-white px-4 py-2.5 text-xs font-semibold text-[#10131A] transition hover:opacity-90 active:scale-95"
            >
              <Plus className="h-3.5 w-3.5" /> Upload Documents
            </button>
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