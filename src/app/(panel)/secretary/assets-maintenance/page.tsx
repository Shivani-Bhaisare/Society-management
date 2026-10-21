"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import {
  Package,
  Wrench,
  ShieldCheck,
  CalendarClock,
  AlertTriangle,
  Plus,
  Search,
  Download,
  ClipboardList,
  CalendarPlus,
  FilePlus2,
  Upload,
  Zap,
  Droplets,
  Settings,
  Building2,
  MoreVertical,
  IndianRupee,
  ChevronDown,
} from "lucide-react";
import { Card, Box, Badge, LinkBtn } from "@/Components/ui";
import AddAssetModal from "@/Components/AddAssetModal";

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

// Animated wrapper around Card: keeps the card filling the full grid cell height
const cellClass = "h-full [&>*]:h-full";

/* ---------- Data (replace with API later) ---------- */

// Top summary cards
const stats = [
  {
    label: "Total Assets",
    value: "64",
    sub: "58 Active · 6 Inactive",
    subC: "text-slate-400",
    icon: Package,
    c: "#3B82F6",
  },
  {
    label: "Under AMC",
    value: "22",
    sub: "3 expiring soon",
    subC: "text-orange-400",
    icon: ShieldCheck,
    c: "#00C2B8",
  },
  {
    label: "Maintenance Due",
    value: "9",
    sub: "4 this week",
    subC: "text-orange-400",
    icon: CalendarClock,
    c: "#F59E0B",
  },
  {
    label: "Open Work Orders",
    value: "7",
    sub: "2 Critical · 5 Normal",
    subC: "text-red-400",
    icon: Wrench,
    c: "#EF4444",
  },
  {
    label: "Maintenance Cost",
    value: "₹2.45 L",
    sub: "This month",
    subC: "text-emerald-400",
    icon: IndianRupee,
    c: "#8B5CF6",
  },
];

// Asset register table
const assets = [
  {
    id: "AST-001",
    n: "Lift - Tower A",
    cat: "Elevator",
    loc: "Tower A",
    last: "02 Oct 2026",
    next: "02 Nov 2026",
    st: "Active",
    stt: "green",
  },
  {
    id: "AST-002",
    n: "Diesel Generator",
    cat: "Electrical",
    loc: "Basement",
    last: "25 Sep 2026",
    next: "10 Oct 2026",
    st: "Due",
    stt: "orange",
  },
  {
    id: "AST-003",
    n: "Water Pump - 2",
    cat: "Plumbing",
    loc: "Pump Room",
    last: "15 Sep 2026",
    next: "15 Oct 2026",
    st: "In Repair",
    stt: "purple",
  },
  {
    id: "AST-004",
    n: "CCTV Network",
    cat: "Security",
    loc: "Main Gate",
    last: "28 Aug 2026",
    next: "28 Oct 2026",
    st: "Active",
    stt: "green",
  },
  {
    id: "AST-005",
    n: "Lift - Tower B",
    cat: "Elevator",
    loc: "Tower B",
    last: "10 Jul 2026",
    next: "05 Oct 2026",
    st: "Overdue",
    stt: "red",
  },
] as const;

// Upcoming maintenance schedule
const schedule = [
  ["10 Oct", "Generator Servicing", "Basement", "#F59E0B"],
  ["12 Oct", "Fire Extinguisher Check", "All Towers", "#EF4444"],
  ["15 Oct", "Water Pump Inspection", "Pump Room", "#3B82F6"],
  ["18 Oct", "Clubhouse AC Service", "Clubhouse", "#00C2B8"],
] as const;

// Work orders table
const workOrders = [
  {
    id: "WO-107",
    t: "Lift not working",
    a: "Lift - Tower B",
    v: "Otis Services",
    p: "Critical",
    pt: "red",
    s: "Escalated",
    st: "red",
  },
  {
    id: "WO-106",
    t: "Motor replacement",
    a: "Water Pump - 2",
    v: "AquaTech",
    p: "High",
    pt: "orange",
    s: "In Progress",
    st: "purple",
  },
  {
    id: "WO-105",
    t: "Battery change",
    a: "Generator",
    v: "PowerCare",
    p: "Medium",
    pt: "blue",
    s: "Pending",
    st: "orange",
  },
  {
    id: "WO-104",
    t: "Camera realignment",
    a: "CCTV Network",
    v: "SecureIt",
    p: "Low",
    pt: "gray",
    s: "Completed",
    st: "green",
  },
] as const;

// AMC / warranty expiry list
const amc = [
  {
    t: "Lift AMC - Tower A",
    v: "Otis Services",
    d: "30 Oct 2026",
    i: Building2,
    c: "#EF4444",
  },
  {
    t: "Generator AMC",
    v: "PowerCare",
    d: "15 Nov 2026",
    i: Zap,
    c: "#F59E0B",
  },
  { t: "Pump AMC", v: "AquaTech", d: "05 Dec 2026", i: Droplets, c: "#3B82F6" },
];

// Cost by category (percent values drive the donut)
const categories = [
  ["Elevator", 35, "#3B82F6"],
  ["Electrical", 25, "#F59E0B"],
  ["Plumbing", 20, "#00C2B8"],
  ["Security", 12, "#8B5CF6"],
  ["Others", 8, "#EF4444"],
] as const;

// Monthly cost bars (height in %)
const monthly = [
  ["Jul", 55],
  ["Aug", 70],
  ["Sep", 45],
  ["Oct", 85],
] as const;

// Quick actions
const quick = [
  { l: "Add Asset", i: Plus, c: "#3B82F6", href: "/secretary/assets/new" },
  {
    l: "Create Work Order",
    i: FilePlus2,
    c: "#8B5CF6",
    href: "/secretary/assets/work-orders",
  },
  {
    l: "Schedule Service",
    i: CalendarPlus,
    c: "#00C2B8",
    href: "/secretary/assets/schedule",
  },
  {
    l: "Report Issue",
    i: AlertTriangle,
    c: "#EF4444",
    href: "/secretary/complaints",
  },
  { l: "Upload AMC", i: Upload, c: "#94A3B8", href: "/secretary/documents" },
  {
    l: "Service Log",
    i: ClipboardList,
    c: "#F59E0B",
    href: "/secretary/assets/logs",
  },
];

// Shared table header / cell styles (same as dashboard)
const th =
  "bg-white/[0.04] px-2 py-2 font-medium first:rounded-l-md last:rounded-r-md";
const td = "border-t border-[#272D39] px-2 py-2.5";

// Shared class for quick action tiles
const quickTile =
  "flex flex-col items-center gap-1.5 rounded-lg border border-[#272D39] bg-white/[0.03] p-2.5 text-center transition-colors hover:bg-white/5";

// Build the conic-gradient string for the donut chart
const donut = (() => {
  let acc = 0;
  return categories
    .map(([, v, c]) => {
      const from = acc;
      acc += v;
      return `${c} ${from}% ${acc}%`;
    })
    .join(", ");
})();

/* ---------- Page ---------- */
export default function AssetsMaintenancePage() {
  // Controls the Add Asset modal
  const [showAssetModal, setShowAssetModal] = useState(false);

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
          <h1 className="text-xl font-bold sm:text-2xl">
            Assets &amp; Maintenance
          </h1>
          <p className="text-xs text-slate-400">
            Track society assets, services, AMC and work orders.
          </p>
        </motion.div>
        {/* Primary button: gradient #6C63FF -> #4DA3FF */}
        <motion.div variants={item}>
          <button
            type="button"
            onClick={() => setShowAssetModal(true)}
            className="flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-linear-to-r from-[#6C63FF] to-[#4DA3FF] px-4 py-2.5 text-xs font-semibold text-white transition hover:opacity-90 active:scale-95"
          >
            <Plus className="h-3.5 w-3.5" /> Add Asset
          </button>
        </motion.div>
      </motion.div>

      {/* Filters bar */}
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
        className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center"
      >
        {/* Search */}
        <motion.div
          variants={item}
          className="flex flex-1 items-center gap-2 rounded-lg border border-[#272D39] bg-[#10131A] px-3 py-2 transition-colors hover:border-[#A29CFF]/60 focus-within:border-[#A29CFF]/60 sm:min-w-[240px]"
        >
          <Search className="h-4 w-4 shrink-0 text-slate-500" />
          <input
            type="text"
            placeholder="Search asset, vendor, location..."
            className="w-full bg-transparent text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none"
          />
        </motion.div>

        {/* Category select */}
        <motion.div variants={item} className="relative">
          <select className="w-full appearance-none rounded-lg border border-[#272D39] bg-[#10131A] py-2 pl-3 pr-8 text-xs text-slate-300 transition-colors hover:border-[#A29CFF]/60 focus:border-[#A29CFF]/60 focus:outline-none sm:w-40">
            <option>All Categories</option>
            <option>Elevator</option>
            <option>Electrical</option>
            <option>Plumbing</option>
            <option>Security</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        </motion.div>

        {/* Status select */}
        <motion.div variants={item} className="relative">
          <select className="w-full appearance-none rounded-lg border border-[#272D39] bg-[#10131A] py-2 pl-3 pr-8 text-xs text-slate-300 transition-colors hover:border-[#A29CFF]/60 focus:border-[#A29CFF]/60 focus:outline-none sm:w-36">
            <option>All Status</option>
            <option>Active</option>
            <option>Due</option>
            <option>In Repair</option>
            <option>Overdue</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        </motion.div>

        {/* Export */}
        <motion.button
          variants={item}
          type="button"
          className="flex items-center justify-center gap-2 rounded-lg border border-[#272D39] bg-[#10131A] px-3 py-2 text-xs text-slate-300 transition-colors hover:border-[#A29CFF]/60 hover:bg-white/5"
        >
          <Download className="h-4 w-4" /> Export
        </motion.button>
      </motion.div>

      {/* Stat cards (same grid as Society page: same card width & height) */}
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
        className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-3"
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

      {/* Asset register + Quick actions */}
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
        className="grid grid-cols-1 gap-4 xl:grid-cols-3"
      >
        <motion.div variants={item} className="xl:col-span-2">
          <Card
            title="Asset Register"
            sub="All society assets and service dates"
            action={
              <Link
                href="/secretary/assets/all"
                className="text-[11px] text-[#A29CFF] hover:underline"
              >
                View All
              </Link>
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-[11px]">
                <thead className="text-slate-400">
                  <tr>
                    <th className={th}>Asset ID</th>
                    <th className={th}>Name</th>
                    <th className={th}>Category</th>
                    <th className={th}>Location</th>
                    <th className={th}>Last Service</th>
                    <th className={th}>Next Service</th>
                    <th className={th}>Status</th>
                    <th className={th} />
                  </tr>
                </thead>
                <tbody>
                  {assets.map((a) => (
                    <tr key={a.id}>
                      <td className={`${td} text-slate-400`}>{a.id}</td>
                      <td className={`${td} font-medium`}>{a.n}</td>
                      <td className={`${td} text-slate-400`}>{a.cat}</td>
                      <td className={`${td} text-slate-400`}>{a.loc}</td>
                      <td className={`${td} text-slate-400`}>{a.last}</td>
                      <td className={`${td} text-slate-400`}>{a.next}</td>
                      <td className={td}>
                        <Badge tone={a.stt}>{a.st}</Badge>
                      </td>
                      <td className={td}>
                        <button
                          type="button"
                          aria-label="More actions"
                          className="text-slate-500 hover:text-slate-300"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={item} className={cellClass}>
          <Card title="Quick Actions" sub="Frequent maintenance operations">
            <div className="grid grid-cols-3 gap-2">
              {quick.map(({ l, i: Icon, c, href }) => {
                const content = (
                  <>
                    <span
                      className="flex h-8 w-8 items-center justify-center rounded-lg"
                      style={{ background: `${c}26`, color: c }}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="text-[10px] leading-tight text-slate-300">
                      {l}
                    </span>
                  </>
                );

                // "Add Asset" opens the modal instead of navigating
                if (l === "Add Asset") {
                  return (
                    <button
                      key={l}
                      type="button"
                      onClick={() => setShowAssetModal(true)}
                      className={quickTile}
                    >
                      {content}
                    </button>
                  );
                }

                return (
                  <Link key={l} href={href} className={quickTile}>
                    {content}
                  </Link>
                );
              })}
            </div>
          </Card>
        </motion.div>
      </motion.div>

      {/* Schedule + Charts + AMC */}
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
        className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-4"
      >
        {/* Upcoming service schedule */}
        <motion.div variants={item} className={cellClass}>
          <Card
            title="Upcoming Services"
            sub="Scheduled maintenance"
            action={
              <Link
                href="/secretary/assets/schedule"
                className="text-[11px] text-[#A29CFF] hover:underline"
              >
                View All
              </Link>
            }
          >
            <div className="flex flex-col gap-3">
              {schedule.map(([date, t, place, c]) => (
                <div key={t} className="flex items-center gap-3">
                  <i
                    className="h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ background: c }}
                  />
                  <span className="w-12 shrink-0 text-[10px] text-slate-400">
                    {date}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold">{t}</p>
                    <p className="truncate text-[10px] text-slate-400">
                      {place}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="rounded-md border border-[#272D39] px-2.5 py-1 text-[10px] text-slate-300 hover:bg-white/5"
                  >
                    View
                  </button>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Monthly cost bar chart (pure CSS) */}
        <motion.div variants={item} className={cellClass}>
          <Card title="Monthly Maintenance Cost" sub="Last 4 months">
            <div className="flex h-36 items-end justify-around gap-3 border-b border-[#272D39] px-2">
              {monthly.map(([m, h]) => (
                <div
                  key={m}
                  className="flex h-full flex-1 flex-col items-center justify-end gap-1"
                >
                  <div
                    className="w-full max-w-[28px] rounded-t-md bg-[#00C2B8]"
                    style={{ height: `${h}%` }}
                  />
                </div>
              ))}
            </div>
            <div className="mt-2 flex justify-around text-[10px] text-slate-400">
              {monthly.map(([m]) => (
                <span key={m}>{m}</span>
              ))}
            </div>
          </Card>
        </motion.div>

        {/* Cost by category donut (conic-gradient) */}
        <motion.div variants={item} className={cellClass}>
          <Card title="Cost by Category" sub="Current financial year">
            <div className="flex flex-col items-center gap-4 min-[480px]:flex-row 2xl:flex-col">
              <div
                className="relative h-28 w-28 shrink-0 rounded-full"
                style={{ background: `conic-gradient(${donut})` }}
              >
                {/* Inner hole */}
                <div className="absolute inset-3 flex flex-col items-center justify-center rounded-full bg-[#10131A]">
                  <span className="text-sm font-bold">₹2.45 L</span>
                  <span className="text-[9px] text-slate-400">Total</span>
                </div>
              </div>
              <ul className="flex w-full flex-col gap-1.5">
                {categories.map(([n, v, c]) => (
                  <li key={n} className="flex items-center gap-2 text-[11px]">
                    <i
                      className="h-2 w-2 shrink-0 rounded-full"
                      style={{ background: c }}
                    />
                    <span className="flex-1 text-slate-300">{n}</span>
                    <span className="text-slate-400">{v}%</span>
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        </motion.div>

        {/* AMC expiry */}
        <motion.div variants={item} className={cellClass}>
          <Card
            title="AMC / Warranty Expiry"
            sub="Renew before expiry"
            action={<Badge tone="orange">3 Soon</Badge>}
          >
            <div className="flex flex-col gap-3">
              {amc.map(({ t, v, d, i: Icon, c }) => (
                <div key={t} className="flex items-center gap-3">
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                    style={{ background: `${c}26`, color: c }}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold">{t}</p>
                    <p className="truncate text-[10px] text-slate-400">{v}</p>
                  </div>
                  <span className="shrink-0 text-[10px] text-slate-500">
                    {d}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </motion.div>

      {/* Work orders + Cost summary */}
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
        className="grid grid-cols-1 gap-4 xl:grid-cols-3"
      >
        <motion.div variants={item} className="xl:col-span-2">
          <Card
            title="Work Orders"
            sub="Repairs and vendor jobs"
            action={
              <Link
                href="/secretary/assets/work-orders"
                className="text-[11px] text-[#A29CFF] hover:underline"
              >
                View All
              </Link>
            }
          >
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-[11px]">
                <thead className="text-slate-400">
                  <tr>
                    <th className={th}>ID</th>
                    <th className={th}>Title</th>
                    <th className={th}>Asset</th>
                    <th className={th}>Vendor</th>
                    <th className={th}>Priority</th>
                    <th className={th}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {workOrders.map((w) => (
                    <tr key={w.id}>
                      <td className={`${td} text-slate-400`}>{w.id}</td>
                      <td className={`${td} font-medium`}>{w.t}</td>
                      <td className={`${td} text-slate-400`}>{w.a}</td>
                      <td className={`${td} text-slate-400`}>{w.v}</td>
                      <td className={td}>
                        <Badge tone={w.pt}>{w.p}</Badge>
                      </td>
                      <td className={td}>
                        <Badge tone={w.st}>{w.s}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={item} className={cellClass}>
          <Card
            title="Maintenance Cost Summary"
            sub="October 2026"
            action={<Badge tone="blue">View Only</Badge>}
          >
            <div className="grid grid-cols-1 gap-2 min-[480px]:grid-cols-3 xl:grid-cols-1 2xl:grid-cols-3">
              <Box label="Budget" value="₹3,00,000" color="text-[#8B85FF]" />
              <Box label="Spent" value="₹2,45,000" color="text-emerald-400" />
              <Box label="Remaining" value="₹55,000" color="text-orange-400" />
            </div>
            {/* Overdue services alert row */}
            <div className="mt-3 flex items-center justify-between rounded-lg border border-red-500/40 bg-white/[0.03] px-3 py-2">
              <span className="flex items-center gap-2 text-xs font-semibold text-red-400">
                <AlertTriangle className="h-4 w-4" /> Overdue Services
              </span>
              <span className="text-sm font-bold text-red-400">2</span>
            </div>
            <div className="mt-3">
              <LinkBtn>View Reports →</LinkBtn>
            </div>
          </Card>
        </motion.div>
      </motion.div>

      {/* Add Asset modal (outside motion wrappers so whileInView doesn't affect it) */}
      <AddAssetModal
        open={showAssetModal}
        onClose={() => setShowAssetModal(false)}
        onSave={(a) => {
          console.log("New asset:", a); // add the API call here
          setShowAssetModal(false);
        }}
      />
    </div>
  );
}
