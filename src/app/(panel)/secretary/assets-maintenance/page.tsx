"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, type Variants } from "framer-motion";
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
  Eye,
  Trash2,
  CheckCircle2,
  Clock3,
  X,
  type LucideIcon,
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

/* ---------- Types ---------- */
type Tone = "green" | "orange" | "purple" | "red" | "blue" | "gray";
type AStatus = "Active" | "Due" | "In Repair" | "Overdue";
type Priority = "Critical" | "High" | "Medium" | "Low";
type WStatus = "Pending" | "In Progress" | "Escalated" | "Completed";

type Asset = {
  id: string;
  n: string;
  cat: string;
  loc: string;
  last: string;
  next: string;
  st: AStatus;
};

type WorkOrder = {
  id: string;
  t: string;
  a: string;
  v: string;
  p: Priority;
  s: WStatus;
};

// Upcoming service (date is the short label, full is the long date, iso is used for sorting)
type Service = {
  id: number;
  date: string;
  full: string;
  iso: string;
  t: string;
  place: string;
  c: string;
};

type Amc = {
  id: number;
  t: string;
  v: string;
  d: string;
  i: LucideIcon;
  c: string;
};

type LogEntry = { id: number; asset: string; note: string; date: string };

// State of the three-dot dropdown (which row is open and where to draw it)
type RowMenu = { id: string; top: number; left: number };

// Which popup is open (null = none)
type ModalState =
  | { type: "viewAsset"; asset: Asset }
  | { type: "deleteAsset"; asset: Asset }
  | { type: "allAssets" }
  | { type: "allServices" }
  | { type: "allOrders" }
  | { type: "service"; svc: Service }
  | { type: "order"; mode: "order" | "issue"; preset?: string }
  | { type: "schedule"; preset?: { t: string; place: string } }
  | { type: "amc" }
  | { type: "log" }
  | null;

// Dropdown size used for positioning
const MENU_WIDTH = 190;
const MENU_HEIGHT = 262;

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

// Asset register table (initial data)
const initialAssets: Asset[] = [
  { id: "AST-001", n: "Lift - Tower A", cat: "Elevator", loc: "Tower A", last: "02 Oct 2026", next: "02 Nov 2026", st: "Active" },
  { id: "AST-002", n: "Diesel Generator", cat: "Electrical", loc: "Basement", last: "25 Sep 2026", next: "10 Oct 2026", st: "Due" },
  { id: "AST-003", n: "Water Pump - 2", cat: "Plumbing", loc: "Pump Room", last: "15 Sep 2026", next: "15 Oct 2026", st: "In Repair" },
  { id: "AST-004", n: "CCTV Network", cat: "Security", loc: "Main Gate", last: "28 Aug 2026", next: "28 Oct 2026", st: "Active" },
  { id: "AST-005", n: "Lift - Tower B", cat: "Elevator", loc: "Tower B", last: "10 Jul 2026", next: "05 Oct 2026", st: "Overdue" },
];

// Upcoming maintenance schedule (initial data)
const initialSchedule: Service[] = [
  { id: 1, date: "10 Oct", full: "10 Oct 2026", iso: "2026-10-10", t: "Generator Servicing", place: "Basement", c: "#F59E0B" },
  { id: 2, date: "12 Oct", full: "12 Oct 2026", iso: "2026-10-12", t: "Fire Extinguisher Check", place: "All Towers", c: "#EF4444" },
  { id: 3, date: "15 Oct", full: "15 Oct 2026", iso: "2026-10-15", t: "Water Pump Inspection", place: "Pump Room", c: "#3B82F6" },
  { id: 4, date: "18 Oct", full: "18 Oct 2026", iso: "2026-10-18", t: "Clubhouse AC Service", place: "Clubhouse", c: "#00C2B8" },
];

// Work orders table (initial data)
const initialOrders: WorkOrder[] = [
  { id: "WO-107", t: "Lift not working", a: "Lift - Tower B", v: "Otis Services", p: "Critical", s: "Escalated" },
  { id: "WO-106", t: "Motor replacement", a: "Water Pump - 2", v: "AquaTech", p: "High", s: "In Progress" },
  { id: "WO-105", t: "Battery change", a: "Generator", v: "PowerCare", p: "Medium", s: "Pending" },
  { id: "WO-104", t: "Camera realignment", a: "CCTV Network", v: "SecureIt", p: "Low", s: "Completed" },
];

// AMC / warranty expiry list (initial data)
const initialAmc: Amc[] = [
  { id: 1, t: "Lift AMC - Tower A", v: "Otis Services", d: "30 Oct 2026", i: Building2, c: "#EF4444" },
  { id: 2, t: "Generator AMC", v: "PowerCare", d: "15 Nov 2026", i: Zap, c: "#F59E0B" },
  { id: 3, t: "Pump AMC", v: "AquaTech", d: "05 Dec 2026", i: Droplets, c: "#3B82F6" },
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

// Quick actions (act = which popup the tile opens)
const quick = [
  { l: "Add Asset", i: Plus, c: "#3B82F6", act: "asset" },
  { l: "Create Work Order", i: FilePlus2, c: "#8B5CF6", act: "order" },
  { l: "Schedule Service", i: CalendarPlus, c: "#00C2B8", act: "schedule" },
  { l: "Report Issue", i: AlertTriangle, c: "#EF4444", act: "issue" },
  { l: "Upload AMC", i: Upload, c: "#94A3B8", act: "amc" },
  { l: "Service Log", i: ClipboardList, c: "#F59E0B", act: "log" },
] as const;

// Badge tones
const assetTone: Record<AStatus, Tone> = {
  Active: "green",
  Due: "orange",
  "In Repair": "purple",
  Overdue: "red",
};
const priorityTone: Record<Priority, Tone> = {
  Critical: "red",
  High: "orange",
  Medium: "blue",
  Low: "gray",
};
const workTone: Record<WStatus, Tone> = {
  Escalated: "red",
  "In Progress": "purple",
  Pending: "orange",
  Completed: "green",
};

// All statuses and priorities (used in the dropdown and forms)
const assetStatuses: AStatus[] = ["Active", "Due", "In Repair", "Overdue"];
const priorities: Priority[] = ["Critical", "High", "Medium", "Low"];

// Icon + hover colour of each status option in the three-dot dropdown
const statusIcon: Record<AStatus, { icon: LucideIcon; cls: string }> = {
  Active: { icon: CheckCircle2, cls: "hover:text-emerald-400" },
  Due: { icon: Clock3, cls: "hover:text-amber-400" },
  "In Repair": { icon: Wrench, cls: "hover:text-[#A29CFF]" },
  Overdue: { icon: AlertTriangle, cls: "hover:text-red-400" },
};

// Colours for newly scheduled services (cycled)
const scheduleColors = ["#F59E0B", "#EF4444", "#3B82F6", "#00C2B8", "#8B5CF6"];

// Shared table header / cell styles (same as dashboard)
const th =
  "bg-white/[0.04] px-2 py-2 font-medium first:rounded-l-md last:rounded-r-md";
const td = "border-t border-[#272D39] px-2 py-2.5";

// Shared form styles
const field =
  "w-full appearance-none rounded-lg border border-[#272D39] bg-[#10131A] px-3 py-2 text-xs text-slate-200 outline-none placeholder:text-slate-500 focus:border-[#A29CFF]/60";
const lbl = "flex flex-col gap-1 text-[11px] text-slate-400";
const menuItemCls =
  "flex w-full cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-left text-slate-300 transition-colors hover:bg-white/5";

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

/* ---------- Helpers ---------- */
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Today's date as "YYYY-MM-DD" (used as the minimum date in the forms)
const todayStr = () => {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

// "2026-10-30" -> "30 Oct 2026"
const fmtFull = (iso: string) => {
  const [y, m, d] = iso.split("-");
  return `${d} ${MONTHS[Number(m) - 1]} ${y}`;
};

// "2026-10-30" -> "30 Oct"
const fmtShort = (iso: string) => {
  const [, m, d] = iso.split("-");
  return `${d} ${MONTHS[Number(m) - 1]}`;
};

// Download the given assets as a CSV file (opens in Excel)
const downloadCsv = (rows: Asset[]) => {
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const header = ["Asset ID", "Name", "Category", "Location", "Last Service", "Next Service", "Status"];
  const lines = rows.map((a) => [a.id, a.n, a.cat, a.loc, a.last, a.next, a.st].map(esc).join(","));
  const csv = [header.map(esc).join(","), ...lines].join("\r\n");
  const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `asset-register-${todayStr()}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

/* ---------- Shared popup parts ---------- */

// Popup shell: dark overlay + panel + header + close button (Esc and outside click also close it)
function Modal({
  title,
  sub,
  onClose,
  width = "max-w-md",
  children,
}: {
  title: string;
  sub?: string;
  onClose: () => void;
  width?: string;
  children: React.ReactNode;
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
        className={`flex max-h-[90vh] w-full ${width} flex-col rounded-xl border border-[#272D39] bg-[#10131A] p-5 text-white shadow-2xl`}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-base font-bold">{title}</h2>
            {sub && <p className="truncate text-[11px] text-slate-400">{sub}</p>}
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

        {/* Content (scrolls when long) */}
        <div className="mt-4 min-h-0 flex-1 overflow-y-auto">{children}</div>
      </motion.div>
    </motion.div>
  );
}

// Select with a chevron icon
function Sel({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${field} cursor-pointer pr-8`}
      >
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

// Cancel + submit buttons used at the bottom of the forms
function FormActions({ onClose, submit }: { onClose: () => void; submit: string }) {
  return (
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
        {submit}
      </button>
    </div>
  );
}

// Single Close button used at the bottom of the view popups
function CloseRow({ onClose }: { onClose: () => void }) {
  return (
    <div className="mt-4 flex justify-end">
      <button
        type="button"
        onClick={onClose}
        className="cursor-pointer rounded-lg border border-[#272D39] px-4 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/5 active:scale-95"
      >
        Close
      </button>
    </div>
  );
}

// One detail row (label on the left, value on the right)
function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-[#272D39] py-2 text-[11px] first:border-t-0">
      <span className="shrink-0 text-slate-400">{label}</span>
      <span className="text-right font-medium text-slate-200">{value}</span>
    </div>
  );
}

/* ---------- Asset popups ---------- */

function ViewAssetModal({
  asset,
  orderCount,
  onClose,
}: {
  asset: Asset;
  orderCount: number;
  onClose: () => void;
}) {
  return (
    <Modal title="Asset Details" sub={asset.n} onClose={onClose} width="max-w-sm">
      {/* Status */}
      <div className="flex items-center justify-between rounded-lg border border-[#272D39] bg-white/3 px-3 py-2">
        <span className="text-[11px] text-slate-400">Status</span>
        <Badge tone={assetTone[asset.st]}>{asset.st}</Badge>
      </div>

      {/* Details */}
      <div className="mt-2 rounded-lg border border-[#272D39] bg-white/3 px-3">
        <DetailRow label="Asset ID" value={asset.id} />
        <DetailRow label="Name" value={asset.n} />
        <DetailRow label="Category" value={asset.cat} />
        <DetailRow label="Location" value={asset.loc} />
        <DetailRow label="Last Service" value={asset.last} />
        <DetailRow label="Next Service" value={asset.next} />
        <DetailRow label="Work Orders" value={String(orderCount)} />
      </div>

      <CloseRow onClose={onClose} />
    </Modal>
  );
}

function DeleteAssetConfirm({
  asset,
  onClose,
  onConfirm,
}: {
  asset: Asset;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <Modal title="Delete Asset" sub="This action cannot be undone." onClose={onClose} width="max-w-sm">
      <p className="text-xs text-slate-300">
        Are you sure you want to delete{" "}
        <span className="font-semibold text-white">{asset.n}</span> ({asset.id})?
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
    </Modal>
  );
}

// View All (Asset Register) popup
function AllAssetsModal({
  assets,
  onClose,
  onView,
}: {
  assets: Asset[];
  onClose: () => void;
  onView: (a: Asset) => void;
}) {
  return (
    <Modal title="All Assets" sub={`${assets.length} assets`} onClose={onClose} width="max-w-3xl">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-[11px]">
          <thead className="text-slate-400">
            <tr>
              <th className={th}>Asset ID</th>
              <th className={th}>Name</th>
              <th className={th}>Category</th>
              <th className={th}>Location</th>
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
                <td className={`${td} text-slate-400`}>{a.next}</td>
                <td className={td}>
                  <Badge tone={assetTone[a.st]}>{a.st}</Badge>
                </td>
                <td className={td}>
                  <button
                    type="button"
                    onClick={() => onView(a)}
                    className="cursor-pointer rounded-md border border-[#272D39] px-2.5 py-1 text-[10px] text-slate-300 hover:bg-white/5"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))}
            {assets.length === 0 && (
              <tr>
                <td colSpan={7} className={`${td} py-8 text-center text-slate-500`}>
                  No assets found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <CloseRow onClose={onClose} />
    </Modal>
  );
}

/* ---------- Service popups ---------- */

function ServiceModal({
  svc,
  onClose,
  onDone,
}: {
  svc: Service;
  onClose: () => void;
  onDone: () => void;
}) {
  return (
    <Modal title="Service Details" sub={svc.t} onClose={onClose} width="max-w-sm">
      <div className="rounded-lg border border-[#272D39] bg-white/3 px-3">
        <DetailRow label="Service" value={svc.t} />
        <DetailRow label="Date" value={svc.full} />
        <DetailRow label="Location" value={svc.place} />
      </div>

      <div className="mt-4 flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          className="cursor-pointer rounded-lg border border-[#272D39] px-4 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/5 active:scale-95"
        >
          Close
        </button>
        {/* Mark as done: removes the service from the list and adds a log entry */}
        <button
          type="button"
          onClick={onDone}
          className="cursor-pointer rounded-lg bg-linear-to-r from-[#6C63FF] to-[#4DA3FF] px-4 py-2 text-xs font-semibold text-white transition hover:opacity-90 active:scale-95"
        >
          Mark as Done
        </button>
      </div>
    </Modal>
  );
}

// View All (Upcoming Services) popup
function AllServicesModal({
  items,
  onClose,
  onView,
}: {
  items: Service[];
  onClose: () => void;
  onView: (s: Service) => void;
}) {
  return (
    <Modal title="All Upcoming Services" sub={`${items.length} scheduled`} onClose={onClose}>
      <div className="flex flex-col gap-3 rounded-lg border border-[#272D39] bg-white/3 p-3">
        {items.map((s) => (
          <div key={s.id} className="flex items-center gap-3">
            <i className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: s.c }} />
            <span className="w-14 shrink-0 text-[10px] text-slate-400">{s.date}</span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-semibold">{s.t}</p>
              <p className="truncate text-[10px] text-slate-400">{s.place}</p>
            </div>
            <button
              type="button"
              onClick={() => onView(s)}
              className="cursor-pointer rounded-md border border-[#272D39] px-2.5 py-1 text-[10px] text-slate-300 hover:bg-white/5"
            >
              View
            </button>
          </div>
        ))}
        {items.length === 0 && (
          <p className="py-6 text-center text-[11px] text-slate-500">No services scheduled</p>
        )}
      </div>
      <CloseRow onClose={onClose} />
    </Modal>
  );
}

// Schedule Service form
function ScheduleModal({
  preset,
  onClose,
  onSubmit,
}: {
  preset?: { t: string; place: string };
  onClose: () => void;
  onSubmit: (d: { t: string; place: string; iso: string }) => void;
}) {
  const [t, setT] = useState(preset?.t ?? "");
  const [place, setPlace] = useState(preset?.place ?? "");
  const [date, setDate] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (t.trim().length < 3) return setError("Service name must be at least 3 characters.");
    if (!place.trim()) return setError("Please enter the location.");
    if (!date) return setError("Please select a date.");
    if (date < todayStr()) return setError("Date cannot be in the past.");
    onSubmit({ t: t.trim(), place: place.trim(), iso: date });
  };

  return (
    <Modal title="Schedule Service" sub="Add a new maintenance service" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="flex flex-col gap-3">
          <label className={lbl}>
            Service Name
            <input
              value={t}
              onChange={(e) => { setT(e.target.value); setError(""); }}
              placeholder="e.g. Generator Servicing"
              className={field}
              autoFocus
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label className={lbl}>
              Location
              <input
                value={place}
                onChange={(e) => { setPlace(e.target.value); setError(""); }}
                placeholder="e.g. Basement"
                className={field}
              />
            </label>
            <label className={lbl}>
              Date
              <input
                type="date"
                min={todayStr()}
                value={date}
                onChange={(e) => { setDate(e.target.value); setError(""); }}
                className={`${field} scheme-dark`}
              />
            </label>
          </div>
          {error && <p className="text-[11px] text-red-400">{error}</p>}
        </div>
        <FormActions onClose={onClose} submit="Schedule" />
      </form>
    </Modal>
  );
}

/* ---------- Work order popups ---------- */

// View All (Work Orders) popup
function AllOrdersModal({ items, onClose }: { items: WorkOrder[]; onClose: () => void }) {
  return (
    <Modal title="All Work Orders" sub={`${items.length} work orders`} onClose={onClose} width="max-w-3xl">
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
            {items.map((w) => (
              <tr key={w.id}>
                <td className={`${td} text-slate-400`}>{w.id}</td>
                <td className={`${td} font-medium`}>{w.t}</td>
                <td className={`${td} text-slate-400`}>{w.a}</td>
                <td className={`${td} text-slate-400`}>{w.v}</td>
                <td className={td}>
                  <Badge tone={priorityTone[w.p]}>{w.p}</Badge>
                </td>
                <td className={td}>
                  <Badge tone={workTone[w.s]}>{w.s}</Badge>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={6} className={`${td} py-8 text-center text-slate-500`}>
                  No work orders found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <CloseRow onClose={onClose} />
    </Modal>
  );
}

// Create Work Order / Report Issue form (same fields, "issue" mode hides the vendor and adds a description)
function OrderForm({
  mode,
  assets,
  preset,
  onClose,
  onSubmit,
}: {
  mode: "order" | "issue";
  assets: Asset[];
  preset?: string;
  onClose: () => void;
  onSubmit: (d: { t: string; a: string; v: string; p: Priority }) => void;
}) {
  const isIssue = mode === "issue";
  const [t, setT] = useState("");
  const [asset, setAsset] = useState(preset ?? assets[0]?.n ?? "");
  const [vendor, setVendor] = useState("");
  const [priority, setPriority] = useState<Priority>("Medium");
  const [desc, setDesc] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (t.trim().length < 3) return setError("Title must be at least 3 characters.");
    if (!asset) return setError("Please select an asset.");
    onSubmit({
      t: t.trim(),
      a: asset,
      v: isIssue ? "Unassigned" : vendor.trim() || "Unassigned",
      p: priority,
    });
  };

  return (
    <Modal
      title={isIssue ? "Report Issue" : "Create Work Order"}
      sub={isIssue ? "Report a problem with an asset" : "Create a repair or vendor job"}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit}>
        <div className="flex flex-col gap-3">
          <label className={lbl}>
            {isIssue ? "Issue Title" : "Work Order Title"}
            <input
              value={t}
              onChange={(e) => { setT(e.target.value); setError(""); }}
              placeholder={isIssue ? "e.g. Strange noise from lift" : "e.g. Motor replacement"}
              className={field}
              autoFocus
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className={lbl}>
              Asset
              <Sel value={asset} onChange={setAsset} options={assets.map((a) => a.n)} />
            </label>
            <label className={lbl}>
              Priority
              <Sel value={priority} onChange={(v) => setPriority(v as Priority)} options={priorities} />
            </label>
          </div>

          {isIssue ? (
            <label className={lbl}>
              Description (optional)
              <textarea
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                rows={3}
                placeholder="Describe the issue..."
                className={`${field} resize-none`}
              />
            </label>
          ) : (
            <label className={lbl}>
              Vendor (optional)
              <input
                value={vendor}
                onChange={(e) => setVendor(e.target.value)}
                placeholder="e.g. Otis Services"
                className={field}
              />
            </label>
          )}

          {error && <p className="text-[11px] text-red-400">{error}</p>}
        </div>
        <FormActions onClose={onClose} submit={isIssue ? "Report Issue" : "Create"} />
      </form>
    </Modal>
  );
}

/* ---------- AMC + Service log popups ---------- */

// Upload AMC form
function AmcModal({
  assets,
  onClose,
  onSubmit,
}: {
  assets: Asset[];
  onClose: () => void;
  onSubmit: (d: { asset: string; vendor: string; iso: string; fileName: string }) => void;
}) {
  const [asset, setAsset] = useState(assets[0]?.n ?? "");
  const [vendor, setVendor] = useState("");
  const [date, setDate] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!asset) return setError("Please select an asset.");
    if (vendor.trim().length < 2) return setError("Please enter the vendor name.");
    if (!date) return setError("Please select the expiry date.");
    if (date < todayStr()) return setError("Expiry date cannot be in the past.");
    if (!file) return setError("Please choose the AMC file.");
    if (file.size > 5 * 1024 * 1024) return setError("File must be 5 MB or smaller.");
    onSubmit({ asset, vendor: vendor.trim(), iso: date, fileName: file.name });
  };

  return (
    <Modal title="Upload AMC" sub="Add an AMC / warranty document" onClose={onClose}>
      <form onSubmit={handleSubmit}>
        <div className="flex flex-col gap-3">
          <label className={lbl}>
            Asset
            <Sel value={asset} onChange={setAsset} options={assets.map((a) => a.n)} />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className={lbl}>
              Vendor
              <input
                value={vendor}
                onChange={(e) => { setVendor(e.target.value); setError(""); }}
                placeholder="e.g. Otis Services"
                className={field}
              />
            </label>
            <label className={lbl}>
              Expiry Date
              <input
                type="date"
                min={todayStr()}
                value={date}
                onChange={(e) => { setDate(e.target.value); setError(""); }}
                className={`${field} scheme-dark`}
              />
            </label>
          </div>

          <label className={lbl}>
            AMC File (PDF, JPG, PNG - max 5 MB)
            <input
              type="file"
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={(e) => { setFile(e.target.files?.[0] ?? null); setError(""); }}
              className={`${field} cursor-pointer file:mr-3 file:cursor-pointer file:rounded-md file:border-0 file:bg-white/10 file:px-2.5 file:py-1 file:text-[11px] file:text-slate-200`}
            />
          </label>

          {error && <p className="text-[11px] text-red-400">{error}</p>}
        </div>
        <FormActions onClose={onClose} submit="Upload" />
      </form>
    </Modal>
  );
}

// Service Log popup: list of entries + a small form to add a new entry
function LogModal({
  logs,
  assets,
  onClose,
  onAdd,
}: {
  logs: LogEntry[];
  assets: Asset[];
  onClose: () => void;
  onAdd: (asset: string, note: string) => void;
}) {
  const [asset, setAsset] = useState(assets[0]?.n ?? "");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!asset) return setError("Please select an asset.");
    if (note.trim().length < 3) return setError("Note must be at least 3 characters.");
    onAdd(asset, note.trim());
    setNote("");
    setError("");
  };

  return (
    <Modal title="Service Log" sub={`${logs.length} entries`} onClose={onClose} width="max-w-lg">
      {/* Add entry */}
      <form onSubmit={handleAdd} className="rounded-lg border border-[#272D39] bg-white/3 p-3">
        <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2">
          <label className={lbl}>
            Asset
            <Sel value={asset} onChange={setAsset} options={assets.map((a) => a.n)} />
          </label>
          <label className={lbl}>
            Note
            <input
              value={note}
              onChange={(e) => { setNote(e.target.value); setError(""); }}
              placeholder="e.g. Oil changed"
              className={field}
            />
          </label>
        </div>
        {error && <p className="mt-2 text-[11px] text-red-400">{error}</p>}
        <div className="mt-3 flex justify-end">
          <button
            type="submit"
            className="cursor-pointer rounded-lg bg-linear-to-r from-[#6C63FF] to-[#4DA3FF] px-4 py-2 text-xs font-semibold text-white transition hover:opacity-90 active:scale-95"
          >
            Add Entry
          </button>
        </div>
      </form>

      {/* Entries */}
      <div className="mt-3 flex flex-col gap-3 rounded-lg border border-[#272D39] bg-white/3 p-3">
        {logs.map((l) => (
          <div key={l.id} className="flex items-start gap-3">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-[#F59E0B]/15 text-[#F59E0B]">
              <ClipboardList className="h-3.5 w-3.5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold">{l.asset}</p>
              <p className="text-[10px] text-slate-400">{l.note}</p>
            </div>
            <span className="shrink-0 text-[10px] text-slate-500">{l.date}</span>
          </div>
        ))}
        {logs.length === 0 && (
          <p className="py-6 text-center text-[11px] text-slate-500">No log entries yet</p>
        )}
      </div>

      <CloseRow onClose={onClose} />
    </Modal>
  );
}

/* ---------- Page ---------- */
export default function AssetsMaintenancePage() {
  // Controls the Add Asset modal
  const [showAssetModal, setShowAssetModal] = useState(false);

  // Page data (replace with API data later)
  const [assets, setAssets] = useState<Asset[]>(initialAssets);
  const [schedule, setSchedule] = useState<Service[]>(initialSchedule);
  const [orders, setOrders] = useState<WorkOrder[]>(initialOrders);
  const [amc, setAmc] = useState<Amc[]>(initialAmc);
  const [logs, setLogs] = useState<LogEntry[]>(
    // Start the log from each asset's last service date
    initialAssets.map((a, i) => ({ id: i + 1, asset: a.n, note: "Service completed", date: a.last })),
  );

  // Filters (search + category + status)
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const [stat, setStat] = useState("All");

  // Popup that is open (null = closed) + success message
  const [modal, setModal] = useState<ModalState>(null);
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
      if (menuRef.current?.contains(target) || target.closest("[data-menu-btn]")) return;
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

  const close = () => setModal(null);

  // Apply search + category + status filters to the asset register
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return assets.filter(
      (a) =>
        (cat === "All" || a.cat === cat) &&
        (stat === "All" || a.st === stat) &&
        (!s || `${a.id} ${a.n} ${a.cat} ${a.loc}`.toLowerCase().includes(s)),
    );
  }, [assets, q, cat, stat]);

  // Add a new row to the service log (newest first)
  const addLog = (asset: string, note: string) =>
    setLogs((prev) => [{ id: Date.now(), asset, note, date: fmtFull(todayStr()) }, ...prev]);

  // Export: download the filtered asset register as CSV
  const handleExport = () => {
    if (list.length === 0) {
      setToast("No assets to export");
      return;
    }
    downloadCsv(list);
    setToast(`${list.length} assets exported`);
  };

  // Three-dot status option: changes only the status (replace with an API call later)
  const changeStatus = (a: Asset, next: AStatus) => {
    setMenu(null);
    setAssets((prev) => prev.map((x) => (x.id === a.id ? { ...x, st: next } : x)));
    addLog(a.n, `Status changed to ${next}`);
    setToast(`${a.n} is now ${next}`);
  };

  // Delete: removes the asset (replace with an API call later)
  const handleDeleteAsset = () => {
    if (modal?.type !== "deleteAsset") return;
    const { asset } = modal;
    setAssets((prev) => prev.filter((a) => a.id !== asset.id));
    setToast(`${asset.n} deleted`);
    close();
  };

  // Create Work Order / Report Issue: adds a Pending work order on top (replace with an API call later)
  const handleOrder = (
    d: { t: string; a: string; v: string; p: Priority },
    mode: "order" | "issue",
  ) => {
    const next =
      Math.max(0, ...orders.map((o) => parseInt(o.id.replace(/\D/g, ""), 10) || 0)) + 1;
    setOrders((prev) => [{ id: `WO-${next}`, ...d, s: "Pending" }, ...prev]);
    addLog(d.a, mode === "issue" ? `Issue reported: ${d.t}` : `Work order created: ${d.t}`);
    setToast(mode === "issue" ? "Issue reported" : `WO-${next} created`);
    close();
  };

  // Schedule Service: adds the service and keeps the list sorted by date (replace with an API call later)
  const handleSchedule = (d: { t: string; place: string; iso: string }) => {
    const svc: Service = {
      id: Date.now(),
      date: fmtShort(d.iso),
      full: fmtFull(d.iso),
      iso: d.iso,
      t: d.t,
      place: d.place,
      c: scheduleColors[schedule.length % scheduleColors.length],
    };
    setSchedule((prev) => [...prev, svc].sort((a, b) => a.iso.localeCompare(b.iso)));
    addLog(d.place, `Service scheduled: ${d.t} on ${svc.full}`);
    setToast(`"${d.t}" scheduled for ${svc.full}`);
    close();
  };

  // Mark a scheduled service as done: removes it and writes a log entry
  const handleServiceDone = (svc: Service) => {
    setSchedule((prev) => prev.filter((s) => s.id !== svc.id));
    addLog(svc.place, `${svc.t} completed`);
    setToast(`"${svc.t}" marked as done`);
    close();
  };

  // Upload AMC: adds to the AMC list (only the file name is kept, send the file with FormData to the API later)
  const handleAmc = (d: { asset: string; vendor: string; iso: string; fileName: string }) => {
    setAmc((prev) => [
      { id: Date.now(), t: `${d.asset} AMC`, v: d.vendor, d: fmtFull(d.iso), i: ShieldCheck, c: "#00C2B8" },
      ...prev,
    ]);
    addLog(d.asset, `AMC uploaded (${d.fileName})`);
    setToast(`AMC added for ${d.asset}`);
    close();
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

  // The asset the open dropdown belongs to
  const menuAsset = menu ? assets.find((a) => a.id === menu.id) : null;

  // Quick action tile click: opens the matching popup
  const runQuick = (act: (typeof quick)[number]["act"]) => {
    if (act === "asset") setShowAssetModal(true);
    else if (act === "order") setModal({ type: "order", mode: "order" });
    else if (act === "issue") setModal({ type: "order", mode: "issue" });
    else if (act === "schedule") setModal({ type: "schedule" });
    else if (act === "amc") setModal({ type: "amc" });
    else setModal({ type: "log" });
  };

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
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search asset, vendor, location..."
            className="w-full bg-transparent text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none"
          />
        </motion.div>

        {/* Category select */}
        <motion.div variants={item} className="relative">
          <select
            value={cat}
            onChange={(e) => setCat(e.target.value)}
            className="w-full appearance-none rounded-lg border border-[#272D39] bg-[#10131A] py-2 pl-3 pr-8 text-xs text-slate-300 transition-colors hover:border-[#A29CFF]/60 focus:border-[#A29CFF]/60 focus:outline-none sm:w-40"
          >
            <option value="All">All Categories</option>
            <option value="Elevator">Elevator</option>
            <option value="Electrical">Electrical</option>
            <option value="Plumbing">Plumbing</option>
            <option value="Security">Security</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        </motion.div>

        {/* Status select */}
        <motion.div variants={item} className="relative">
          <select
            value={stat}
            onChange={(e) => setStat(e.target.value)}
            className="w-full appearance-none rounded-lg border border-[#272D39] bg-[#10131A] py-2 pl-3 pr-8 text-xs text-slate-300 transition-colors hover:border-[#A29CFF]/60 focus:border-[#A29CFF]/60 focus:outline-none sm:w-36"
          >
            <option value="All">All Status</option>
            <option value="Active">Active</option>
            <option value="Due">Due</option>
            <option value="In Repair">In Repair</option>
            <option value="Overdue">Overdue</option>
          </select>
          <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
        </motion.div>

        {/* Export: downloads the filtered asset register as CSV */}
        <motion.button
          variants={item}
          type="button"
          onClick={handleExport}
          className="flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-[#272D39] bg-[#10131A] px-3 py-2 text-xs text-slate-300 transition-colors hover:border-[#A29CFF]/60 hover:bg-white/5"
        >
          <Download className="h-4 w-4" /> Export
        </motion.button>
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
              // View All: opens the all assets popup
              <button
                type="button"
                onClick={() => setModal({ type: "allAssets" })}
                className="cursor-pointer text-[11px] text-[#A29CFF] hover:underline"
              >
                View All
              </button>
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
                  {list.map((a) => (
                    <tr key={a.id}>
                      <td className={`${td} text-slate-400`}>{a.id}</td>
                      <td className={`${td} font-medium`}>{a.n}</td>
                      <td className={`${td} text-slate-400`}>{a.cat}</td>
                      <td className={`${td} text-slate-400`}>{a.loc}</td>
                      <td className={`${td} text-slate-400`}>{a.last}</td>
                      <td className={`${td} text-slate-400`}>{a.next}</td>
                      <td className={td}>
                        <Badge tone={assetTone[a.st]}>{a.st}</Badge>
                      </td>
                      <td className={td}>
                        {/* Three dot: opens the actions dropdown */}
                        <button
                          type="button"
                          data-menu-btn
                          aria-label="More actions"
                          aria-haspopup="menu"
                          aria-expanded={menu?.id === a.id}
                          onClick={(e) => toggleMenu(e, a.id)}
                          className={`cursor-pointer text-slate-500 hover:text-slate-300 ${
                            menu?.id === a.id ? "text-slate-200" : ""
                          }`}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}

                  {/* Empty state */}
                  {list.length === 0 && (
                    <tr>
                      <td colSpan={8} className={`${td} py-8 text-center text-slate-500`}>
                        No assets found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={item} className={cellClass}>
          <Card title="Quick Actions" sub="Frequent maintenance operations">
            <div className="grid grid-cols-3 gap-2">
              {quick.map(({ l, i: Icon, c, act }) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => runQuick(act)}
                  className="flex cursor-pointer flex-col items-center gap-1.5 rounded-lg border border-[#272D39] bg-white/[0.03] p-2.5 text-center transition-colors hover:bg-white/5"
                >
                  <span
                    className="flex h-8 w-8 items-center justify-center rounded-lg"
                    style={{ background: `${c}26`, color: c }}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="text-[10px] leading-tight text-slate-300">
                    {l}
                  </span>
                </button>
              ))}
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
              // View All: opens the all services popup
              <button
                type="button"
                onClick={() => setModal({ type: "allServices" })}
                className="cursor-pointer text-[11px] text-[#A29CFF] hover:underline"
              >
                View All
              </button>
            }
          >
            <div className="flex flex-col gap-3">
              {schedule.slice(0, 4).map((s) => (
                <div key={s.id} className="flex items-center gap-3">
                  <i
                    className="h-1.5 w-1.5 shrink-0 rounded-full"
                    style={{ background: s.c }}
                  />
                  <span className="w-12 shrink-0 text-[10px] text-slate-400">
                    {s.date}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-semibold">{s.t}</p>
                    <p className="truncate text-[10px] text-slate-400">
                      {s.place}
                    </p>
                  </div>
                  {/* View: opens the service details popup */}
                  <button
                    type="button"
                    onClick={() => setModal({ type: "service", svc: s })}
                    className="cursor-pointer rounded-md border border-[#272D39] px-2.5 py-1 text-[10px] text-slate-300 hover:bg-white/5"
                  >
                    View
                  </button>
                </div>
              ))}
              {schedule.length === 0 && (
                <p className="py-4 text-center text-[11px] text-slate-500">No services scheduled</p>
              )}
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
              {amc.map(({ id, t, v, d, i: Icon, c }) => (
                <div key={id} className="flex items-center gap-3">
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
              // View All: opens the all work orders popup
              <button
                type="button"
                onClick={() => setModal({ type: "allOrders" })}
                className="cursor-pointer text-[11px] text-[#A29CFF] hover:underline"
              >
                View All
              </button>
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
                  {orders.slice(0, 4).map((w) => (
                    <tr key={w.id}>
                      <td className={`${td} text-slate-400`}>{w.id}</td>
                      <td className={`${td} font-medium`}>{w.t}</td>
                      <td className={`${td} text-slate-400`}>{w.a}</td>
                      <td className={`${td} text-slate-400`}>{w.v}</td>
                      <td className={td}>
                        <Badge tone={priorityTone[w.p]}>{w.p}</Badge>
                      </td>
                      <td className={td}>
                        <Badge tone={workTone[w.s]}>{w.s}</Badge>
                      </td>
                    </tr>
                  ))}
                  {orders.length === 0 && (
                    <tr>
                      <td colSpan={6} className={`${td} py-8 text-center text-slate-500`}>
                        No work orders found
                      </td>
                    </tr>
                  )}
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

      {/* Three-dot dropdown: fixed position so the table's overflow does not clip it */}
      {menu && menuAsset && (
        <div
          ref={menuRef}
          role="menu"
          style={{ top: menu.top, left: menu.left, width: MENU_WIDTH }}
          className="fixed z-50 overflow-hidden rounded-lg border border-[#272D39] bg-[#10131A] p-1 text-[11px] shadow-xl shadow-black/40"
        >
          {/* View details */}
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setModal({ type: "viewAsset", asset: menuAsset });
              setMenu(null);
            }}
            className={menuItemCls}
          >
            <Eye className="h-3.5 w-3.5" /> View Details
          </button>

          {/* Create a work order for this asset */}
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setModal({ type: "order", mode: "order", preset: menuAsset.n });
              setMenu(null);
            }}
            className={menuItemCls}
          >
            <FilePlus2 className="h-3.5 w-3.5" /> Create Work Order
          </button>

          {/* Schedule a service for this asset */}
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setModal({
                type: "schedule",
                preset: { t: `${menuAsset.n} Service`, place: menuAsset.loc },
              });
              setMenu(null);
            }}
            className={menuItemCls}
          >
            <CalendarPlus className="h-3.5 w-3.5" /> Schedule Service
          </button>

          {/* Divider */}
          <div className="my-1 border-t border-[#272D39]" />

          {/* Status options: every status except the current one */}
          {assetStatuses
            .filter((s) => s !== menuAsset.st)
            .map((s) => {
              const { icon: StatusIcon, cls } = statusIcon[s];
              return (
                <button
                  key={s}
                  type="button"
                  role="menuitem"
                  onClick={() => changeStatus(menuAsset, s)}
                  className={`${menuItemCls} ${cls}`}
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
              setModal({ type: "deleteAsset", asset: menuAsset });
              setMenu(null);
            }}
            className="flex w-full cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-left text-red-400 transition-colors hover:bg-red-500/10"
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
        </div>
      )}

      {/* Add Asset modal (outside motion wrappers so whileInView doesn't affect it) */}
      <AddAssetModal
        open={showAssetModal}
        onClose={() => setShowAssetModal(false)}
        onSave={(a) => {
          console.log("New asset:", a); // add the API call here
          setShowAssetModal(false);
        }}
      />

      {/* Popups */}
      <AnimatePresence>
        {modal?.type === "viewAsset" && (
          <ViewAssetModal
            key={`view-${modal.asset.id}`}
            asset={modal.asset}
            orderCount={orders.filter((o) => o.a === modal.asset.n).length}
            onClose={close}
          />
        )}

        {modal?.type === "deleteAsset" && (
          <DeleteAssetConfirm
            key={`delete-${modal.asset.id}`}
            asset={modal.asset}
            onClose={close}
            onConfirm={handleDeleteAsset}
          />
        )}

        {modal?.type === "allAssets" && (
          <AllAssetsModal
            key="all-assets"
            assets={assets}
            onClose={close}
            onView={(a) => setModal({ type: "viewAsset", asset: a })}
          />
        )}

        {modal?.type === "allServices" && (
          <AllServicesModal
            key="all-services"
            items={schedule}
            onClose={close}
            onView={(s) => setModal({ type: "service", svc: s })}
          />
        )}

        {modal?.type === "service" && (
          <ServiceModal
            key={`service-${modal.svc.id}`}
            svc={modal.svc}
            onClose={close}
            onDone={() => handleServiceDone(modal.svc)}
          />
        )}

        {modal?.type === "allOrders" && (
          <AllOrdersModal key="all-orders" items={orders} onClose={close} />
        )}

        {modal?.type === "order" && (
          <OrderForm
            key={`order-${modal.mode}`}
            mode={modal.mode}
            assets={assets}
            preset={modal.preset}
            onClose={close}
            onSubmit={(d) => handleOrder(d, modal.mode)}
          />
        )}

        {modal?.type === "schedule" && (
          <ScheduleModal
            key="schedule"
            preset={modal.preset}
            onClose={close}
            onSubmit={handleSchedule}
          />
        )}

        {modal?.type === "amc" && (
          <AmcModal key="amc" assets={assets} onClose={close} onSubmit={handleAmc} />
        )}

        {modal?.type === "log" && (
          <LogModal
            key="log"
            logs={logs}
            assets={assets}
            onClose={close}
            onAdd={(asset, note) => {
              addLog(asset, note);
              setToast("Log entry added");
            }}
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