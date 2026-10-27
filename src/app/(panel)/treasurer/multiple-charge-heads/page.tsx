"use client";

import { useState } from "react";
import { motion, type Variants } from "framer-motion";
import {
  ListChecks,
  CheckCircle2,
  Lock,
  SlidersHorizontal,
  Plus,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Card, Badge } from "@/Components/ui";
import AddChargeHeadModal, {
  type AddChargeHeadPayload,
  type ChargeMethod,
} from "@/Components/AddChargeHeadModal";

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

/* ---------- Types + data (replace with API data later) ---------- */

type Charge = {
  id: number;
  name: string;
  method: ChargeMethod;
  value: number;
  frequency: string;
  status: "Active" | "Inactive";
};

const initialCharges: Charge[] = [
  { id: 1, name: "Maintenance", method: "Fixed", value: 3000, frequency: "Monthly", status: "Active" },
  { id: 2, name: "Parking", method: "Fixed", value: 500, frequency: "Monthly", status: "Active" },
  { id: 3, name: "Penalty", method: "Percentage", value: 2, frequency: "Monthly", status: "Active" },
  { id: 4, name: "Club House", method: "Fixed", value: 1000, frequency: "Monthly", status: "Inactive" },
  { id: 5, name: "Water Charges", method: "Per Sq. Ft.", value: 10, frequency: "Monthly", status: "Active" },
];

/* ---------- Shared styles (same as Residents) ---------- */

const th =
  "bg-white/4 px-2 py-2 font-medium first:rounded-l-md last:rounded-r-md";
const td = "border-t border-[#272D39] px-2 py-2.5";

/* ---------- Small helpers ---------- */

// Shows the amount in the format used by the table
function formatValue(c: Charge) {
  if (c.method === "Percentage") return `${c.value}%`;
  if (c.method === "Per Sq. Ft.") return `₹ ${c.value.toLocaleString("en-IN")} / sq.ft`;
  return `₹ ${c.value.toLocaleString("en-IN")}`;
}

/* ---------- Page ---------- */
export default function MultipleChargeHeadsPage() {
  const [charges, setCharges] = useState<Charge[]>(initialCharges);
  const [open, setOpen] = useState(false);

  // Summary numbers are calculated from the list
  const total = charges.length;
  const activeCount = charges.filter((c) => c.status === "Active").length;
  const fixedCount = charges.filter((c) => c.method === "Fixed").length;
  const variableCount = total - fixedCount;

  const stats = [
    {
      label: "Total Charge Heads",
      value: String(total),
      sub: "All configured charges",
      subC: "text-slate-400",
      icon: ListChecks,
      c: "#3B82F6",
    },
    {
      label: "Active",
      value: String(activeCount),
      sub: "Used in billing",
      subC: "text-emerald-400",
      icon: CheckCircle2,
      c: "#00C2B8",
    },
    {
      label: "Fixed Charges",
      value: String(fixedCount),
      sub: "Same amount every cycle",
      subC: "text-slate-400",
      icon: Lock,
      c: "#F59E0B",
    },
    {
      label: "Variable Charges",
      value: String(variableCount),
      sub: "Percentage / per sq. ft.",
      subC: "text-slate-400",
      icon: SlidersHorizontal,
      c: "#8B5CF6",
    },
  ];

  // Add the new charge head from the drawer to the table (replace with an API call later)
  const handleSave = (data: AddChargeHeadPayload) => {
    setCharges((prev) => [
      ...prev,
      {
        id: data.id,
        name: data.name,
        method: data.method,
        value: data.value,
        frequency: data.freq,
        status: data.active ? "Active" : "Inactive",
      },
    ]);
  };

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
          <h1 className="text-xl font-bold sm:text-2xl">
            Charge Head Management
          </h1>
          <p className="text-xs text-slate-400">
            Configure and manage charge heads for maintenance billing
          </p>
        </motion.div>

        {/* Add button: opens the drawer on click */}
        <motion.div variants={item}>
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-linear-to-r from-[#6C63FF] to-[#4DA3FF] px-4 py-2.5 text-xs font-semibold text-white transition hover:opacity-90 active:scale-95"
          >
            <Plus className="h-3.5 w-3.5" /> Add Charge Head
          </button>
        </motion.div>
      </motion.div>

      {/* Stat cards (same card size as Residents) */}
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
            {/* Coloured accent line at the bottom of the card */}
            <span
              className="absolute inset-x-0 bottom-0 h-0.75"
              style={{ background: c }}
            />
          </motion.div>
        ))}
      </motion.div>

      {/* Charge heads table */}
      <motion.div
        variants={item}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
      >
        <Card
          title="Charge Heads"
          sub={`Total ${charges.length} charge heads`}
        >
          {/* Table scrolls sideways on small screens */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-160 text-left text-[11px]">
              <thead className="text-slate-400">
                <tr>
                  <th className={th}>#</th>
                  <th className={th}>Charge Name</th>
                  <th className={th}>Calculation Method</th>
                  <th className={th}>Amount / Rate</th>
                  <th className={th}>Frequency</th>
                  <th className={th}>Status</th>
                  <th className={`${th} text-right`}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {charges.map((c, i) => (
                  <motion.tr
                    key={c.id}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={VIEWPORT}
                    transition={{ duration: 0.5, ease: EASE, delay: i * 0.05 }}
                    className="hover:bg-white/2"
                  >
                    <td className={`${td} text-slate-400`}>{i + 1}</td>
                    <td className={`${td} font-medium`}>{c.name}</td>
                    <td className={`${td} text-slate-300`}>{c.method}</td>
                    <td className={`${td} whitespace-nowrap text-slate-300`}>
                      {formatValue(c)}
                    </td>
                    <td className={`${td} text-slate-400`}>{c.frequency}</td>
                    <td className={td}>
                      <Badge tone={c.status === "Active" ? "green" : "gray"}>
                        {c.status}
                      </Badge>
                    </td>
                    <td className={`${td} text-right`}>
                      <button
                        type="button"
                        aria-label="Actions"
                        className="cursor-pointer rounded-md p-1 text-slate-400 hover:bg-white/5"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-4 flex flex-col items-center justify-between gap-3 text-[11px] text-slate-400 sm:flex-row">
            <span>
              Showing 1-{charges.length} of {charges.length}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Previous"
                className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-[#272D39] hover:bg-white/5"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                className="h-7 w-7 cursor-pointer rounded-md border border-transparent bg-linear-to-br from-[#6C63FF] to-[#4DA3FF] text-[11px] font-semibold text-white"
              >
                1
              </button>
              <button
                type="button"
                aria-label="Next"
                className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md border border-[#272D39] hover:bg-white/5"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Add Charge Head drawer */}
      <AddChargeHeadModal
        open={open}
        onClose={() => setOpen(false)}
        onSave={handleSave}
      />
    </div>
  );
}