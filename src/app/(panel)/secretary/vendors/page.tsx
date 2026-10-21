"use client";

import { useMemo, useState } from "react";
import { motion, type Variants } from "framer-motion";
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
export default function VendorsPage() {
  const [vendors, setVendors] = useState<VendorRow[]>(initialVendors);
  const [showVendorModal, setShowVendorModal] = useState(false);

  const [q, setQ] = useState("");
  const [service, setService] = useState("All");
  const [status, setStatus] = useState("All");
  const [contract, setContract] = useState("All");

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

  // Contract filter options: only the contract years present in the vendors are shown
  const contracts = useMemo(
    () => Array.from(new Set(vendors.map((v) => v.contract))).sort(),
    [vendors],
  );

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
        (contract === "All" || v.contract === contract) &&
        (term === "" ||
          v.name.toLowerCase().includes(term) ||
          v.service.toLowerCase().includes(term)),
    );
  }, [vendors, q, service, status, contract]);

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
          value={contract}
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
              <Actions />
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

      {/* Add Vendor modal (outside the motion wrappers) */}
      <AddVendorModal
        open={showVendorModal}
        onClose={() => setShowVendorModal(false)}
        onSave={handleSave}
      />
    </div>
  );
}