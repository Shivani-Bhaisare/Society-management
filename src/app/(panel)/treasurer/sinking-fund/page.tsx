"use client";

import { useMemo, useState } from "react";
import { motion, type Variants } from "framer-motion";
import {
  Landmark,
  Wallet,
  PiggyBank,
  TrendingDown,
  Plus,
  Search,
  ArrowUp,
  ArrowDown,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
} from "lucide-react";
import { Card, Badge } from "@/Components/ui";
import AddReserveFundModal, { type AddReserveFundPayload } from "@/Components/AddReserveFundModal"; // adjust the path to your folder

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

/* ---------- Colours (hex, so they always render) ---------- */

const BLUE = "#3B82F6";
const GREEN = "#10B981";
const PURPLE = "#8B5CF6";
const RED = "#EF4444";
const ORANGE = "#F59E0B";

/* ---------- Data (replace with API data later) ---------- */

// Top summary cards.
// up = arrow direction, good = green (true) or red (false)
const stats = [
  { label: "Total Funds", value: "3", sub: "2 Active | 1 Inactive", pct: "", up: true, good: true, icon: Landmark, c: BLUE },
  { label: "Total Balance", value: "₹ 48,75,000", sub: "vs last year", pct: "12%", up: true, good: true, icon: Wallet, c: GREEN },
  { label: "Total Contributions", value: "₹ 16,50,000", sub: "vs last year", pct: "8%", up: true, good: true, icon: PiggyBank, c: PURPLE },
  { label: "Total Utilization", value: "₹ 7,25,000", sub: "vs last year", pct: "5%", up: false, good: true, icon: TrendingDown, c: RED },
];

// Fund distribution (pct values add up to 100)
const distribution = [
  { l: "Sinking Fund", amount: "₹ 22,50,000", pct: 46, c: BLUE },
  { l: "Lift Replacement", amount: "₹ 12,00,000", pct: 25, c: "#818CF8" },
  { l: "Painting Fund", amount: "₹ 8,75,000", pct: 18, c: GREEN },
  { l: "Club House Fund", amount: "₹ 5,50,000", pct: 11, c: PURPLE },
];

// Contributions vs Utilization (values in Lakh), 12 months
const CHART_MAX = 8;
const chartTicks = [8, 6, 4, 2, 0];
const monthly = [
  { m: "Jan", con: 3.6, uti: 2.0 },
  { m: "Feb", con: 3.9, uti: 2.3 },
  { m: "Mar", con: 3.2, uti: 1.5 },
  { m: "Apr", con: 4.0, uti: 2.1 },
  { m: "May", con: 4.4, uti: 2.4 },
  { m: "Jun", con: 4.8, uti: 3.0 },
  { m: "Jul", con: 4.8, uti: 2.5 },
  { m: "Aug", con: 4.6, uti: 2.7 },
  { m: "Sep", con: 5.0, uti: 2.9 },
  { m: "Oct", con: 5.4, uti: 3.1 },
  { m: "Nov", con: 4.4, uti: 2.6 },
  { m: "Dec", con: 5.2, uti: 3.5 },
];

// Recent activity feed
const activity = [
  { title: "Contribution received", sub: "Sinking Fund - ₹ 50,000", date: "12 Nov 2025", c: GREEN },
  { title: "Utilization recorded", sub: "Lift Replacement - ₹ 2,00,000", date: "08 Nov 2025", c: ORANGE },
  { title: "Contribution received", sub: "Painting Fund - ₹ 75,000", date: "05 Nov 2025", c: GREEN },
  { title: "Fund created", sub: "Club House Fund", date: "01 Nov 2025", c: BLUE },
];

type Fund = {
  id: number;
  name: string;
  purpose: string;
  opening: string;
  contributions: string;
  utilization: string;
  closing: string;
  target: string;
  status: "Active" | "Inactive";
};

const funds: Fund[] = [
  { id: 1, name: "Sinking Fund", purpose: "Major repairs & future capital expenses", opening: "₹ 15,00,000", contributions: "₹ 7,50,000", utilization: "₹ 1,00,000", closing: "₹ 21,50,000", target: "₹ 50,00,000", status: "Active" },
  { id: 2, name: "Lift Replacement Fund", purpose: "Lift maintenance & replacement", opening: "₹ 8,00,000", contributions: "₹ 4,20,000", utilization: "₹ 2,00,000", closing: "₹ 10,20,000", target: "₹ 25,00,000", status: "Active" },
  { id: 3, name: "Painting Fund", purpose: "Building painting & repairs", opening: "₹ 5,50,000", contributions: "₹ 2,80,000", utilization: "₹ 1,25,000", closing: "₹ 6,05,000", target: "₹ 15,00,000", status: "Active" },
  { id: 4, name: "Club House Fund", purpose: "Club house maintenance", opening: "₹ 2,00,000", contributions: "₹ 1,50,000", utilization: "₹ 0", closing: "₹ 3,50,000", target: "₹ 10,00,000", status: "Inactive" },
];

const fundOptions = ["All Funds", ...funds.map((f) => f.name)];
const statusOptions = ["Status", "Active", "Inactive"];

/* ---------- Shared styles (same as Residents) ---------- */

const th =
  "bg-white/4 px-2 py-2 font-medium first:rounded-l-md last:rounded-r-md";
const td = "border-t border-[#272D39] px-2 py-2.5";
const field =
  "w-full rounded-lg border border-[#272D39] bg-[#10131A] px-3 py-2 text-xs text-slate-200 outline-none placeholder:text-slate-500 focus:border-[#A29CFF]/60";

/* ---------- Small helpers ---------- */

// Up / down trend chip (green = good, red = bad)
function Trend({ pct, up, good }: { pct: string; up: boolean; good: boolean }) {
  if (!pct) return null;
  const Arrow = up ? ArrowUp : ArrowDown;
  return (
    <span
      className="inline-flex items-center gap-0.5 font-semibold"
      style={{ color: good ? "#34D399" : "#F87171" }}
    >
      <Arrow className="h-3 w-3" /> {pct}
    </span>
  );
}

// Donut chart drawn with SVG circles (no chart library needed)
function Donut({
  segments,
  size = 160,
  stroke = 18,
  children,
}: {
  segments: { pct: number; c: string }[];
  size?: number;
  stroke?: number;
  children?: React.ReactNode;
}) {
  const r = 50 - stroke / 2; // viewBox is 100x100
  let offset = 0;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
        <circle
          cx="50"
          cy="50"
          r={r}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={stroke}
        />
        {segments.map((s, idx) => {
          const el = (
            <circle
              key={idx}
              cx="50"
              cy="50"
              r={r}
              fill="none"
              stroke={s.c}
              strokeWidth={stroke}
              pathLength={100}
              strokeDasharray={`${s.pct} ${100 - s.pct}`}
              strokeDashoffset={-offset}
            />
          );
          offset += s.pct;
          return el;
        })}
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        {children}
      </div>
    </div>
  );
}

/* ---------- Page ---------- */
export default function SinkingFundPage() {
  const [fund, setFund] = useState(fundOptions[0]);
  const [status, setStatus] = useState(statusOptions[0]);
  const [q, setQ] = useState("");
  // Controls the Create Reserve Fund drawer (open / closed)
  const [addOpen, setAddOpen] = useState(false);

  // Filter rows by fund, status and search text
  const list = useMemo(() => {
    const s = q.trim().toLowerCase();
    return funds.filter(
      (f) =>
        (fund === "All Funds" || f.name === fund) &&
        (status === "Status" || f.status === status) &&
        (!s || `${f.name} ${f.purpose}`.toLowerCase().includes(s)),
    );
  }, [fund, status, q]);

  // Called when the drawer form is saved
  const handleSaveFund = (data: AddReserveFundPayload) => {
    // TODO: call the API here, then refresh the funds table / stat cards
    console.log("Reserve fund saved:", data);
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
            Sinking / Reserve Fund Management
          </h1>
          <p className="text-xs text-slate-400">
            Track and manage sinking and reserve funds for future repairs and
            major expenses.
          </p>
        </motion.div>

        {/* Create button: opens the Create Reserve Fund drawer */}
        <motion.div variants={item}>
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-linear-to-r from-[#6C63FF] to-[#4DA3FF] px-4 py-2.5 text-xs font-semibold text-white transition hover:opacity-90 active:scale-95"
          >
            <Plus className="h-3.5 w-3.5" /> Create Fund
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
        {stats.map(({ label, value, sub, pct, up, good, icon: Icon, c }) => (
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
            <p className="mt-1 flex items-center gap-1.5 text-[10px] text-slate-400">
              <Trend pct={pct} up={up} good={good} />
              <span>{sub}</span>
            </p>
            {/* Coloured accent line at the bottom of the card */}
            <span
              className="absolute inset-x-0 bottom-0 h-0.75"
              style={{ background: c }}
            />
          </motion.div>
        ))}
      </motion.div>

      {/* Fund Distribution + Contributions vs Utilization + Recent Activity */}
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
        className="grid grid-cols-1 gap-4 xl:grid-cols-12"
      >
        {/* Fund distribution (donut) */}
        <motion.div variants={item} className="h-full xl:col-span-4 [&>*]:h-full">
          <Card title="Fund Distribution" sub="Share of total balance">
            <div className="flex flex-col items-center gap-5 min-[480px]:flex-row xl:flex-col 2xl:flex-row">
              <Donut
                segments={distribution.map(({ pct, c }) => ({ pct, c }))}
                size={170}
                stroke={18}
              >
                <span className="text-lg font-bold">₹ 48,75,000</span>
                <span className="text-[10px] text-slate-400">Total Balance</span>
              </Donut>

              {/* Legend */}
              <div className="flex w-full min-w-0 flex-1 flex-col gap-3">
                {distribution.map(({ l, amount, pct, c }) => (
                  <div key={l} className="flex items-center gap-2 text-xs">
                    <i
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ background: c }}
                    />
                    <span className="min-w-0 flex-1 truncate text-slate-300">
                      {l}
                    </span>
                    <span className="shrink-0 text-[10px] text-slate-400">
                      {amount}
                    </span>
                    <span className="w-8 shrink-0 text-right font-semibold">
                      {pct}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Contributions vs Utilization (bar chart) */}
        <motion.div variants={item} className="h-full xl:col-span-5 [&>*]:h-full">
          <Card
            title="Contributions vs Utilization"
            sub="Monthly comparison (in Lakh)"
            action={
              <span className="flex items-center gap-3 text-[10px] text-slate-400">
                <span className="flex items-center gap-1">
                  <i className="h-2 w-2 rounded-full" style={{ background: BLUE }} />{" "}
                  Contributions
                </span>
                <span className="flex items-center gap-1">
                  <i className="h-2 w-2 rounded-full" style={{ background: GREEN }} />{" "}
                  Utilization
                </span>
              </span>
            }
          >
            {/* Horizontal scroll on very small screens so 12 months never get squashed */}
            <div className="overflow-x-auto pb-1">
              <div className="flex min-w-105 gap-2">
                {/* Y axis labels */}
                <div className="flex h-56 flex-col justify-between text-[10px] text-slate-500">
                  {chartTicks.map((t) => (
                    <span key={t} className="leading-none">
                      {t === 0 ? "0" : `${t}L`}
                    </span>
                  ))}
                </div>

                {/* Plot area */}
                <div className="flex-1">
                  <div className="relative h-56 border-b border-l border-[#272D39]">
                    {/* Horizontal grid lines */}
                    {chartTicks.slice(0, -1).map((t) => (
                      <span
                        key={t}
                        className="absolute inset-x-0 border-t border-dashed border-[#272D39]"
                        style={{ top: `${100 - (t / CHART_MAX) * 100}%` }}
                      />
                    ))}
                    {/* Bars */}
                    <div className="absolute inset-0 flex items-end justify-around px-1">
                      {monthly.map(({ m, con, uti }) => (
                        <div key={m} className="flex h-full items-end gap-0.75">
                          <motion.span
                            initial={{ height: 0 }}
                            whileInView={{ height: `${(con / CHART_MAX) * 100}%` }}
                            viewport={VIEWPORT}
                            transition={{ duration: 0.8, ease: EASE }}
                            className="w-1.5 rounded-t-sm sm:w-2"
                            style={{ background: BLUE }}
                          />
                          <motion.span
                            initial={{ height: 0 }}
                            whileInView={{ height: `${(uti / CHART_MAX) * 100}%` }}
                            viewport={VIEWPORT}
                            transition={{ duration: 0.8, ease: EASE, delay: 0.1 }}
                            className="w-1.5 rounded-t-sm sm:w-2"
                            style={{ background: GREEN }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                  {/* X axis labels */}
                  <div className="mt-1.5 flex justify-around px-1 text-[10px] text-slate-400">
                    {monthly.map(({ m }) => (
                      <span key={m}>{m}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Recent activity */}
        <motion.div variants={item} className="h-full xl:col-span-3 [&>*]:h-full">
          <Card title="Recent Activity" sub="Latest fund movements">
            <div className="flex flex-col gap-4">
              {activity.map(({ title, sub, date, c }, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
                    style={{ background: `${c}26`, color: c }}
                  >
                    <Wallet className="h-4 w-4" />
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold">{title}</p>
                    <p className="truncate text-[10px] text-slate-400">{sub}</p>
                    <p className="text-[10px] text-slate-500">{date}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </motion.div>
      </motion.div>

      {/* Filters */}
      <motion.div
        variants={item}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
        className="grid grid-cols-1 gap-2 rounded-xl border border-[#272D39] bg-[#10131A] p-3 min-[480px]:grid-cols-2 lg:grid-cols-[180px_160px_1fr]"
      >
        <div className="relative">
          <select
            value={fund}
            onChange={(e) => setFund(e.target.value)}
            className={`${field} cursor-pointer appearance-none pr-8`}
          >
            {fundOptions.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
        </div>

        <div className="relative">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className={`${field} cursor-pointer appearance-none pr-8`}
          >
            {statusOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
        </div>

        <div className="relative min-[480px]:col-span-2 lg:col-span-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search fund..."
            className={`${field} pl-9`}
          />
        </div>
      </motion.div>

      {/* Funds table */}
      <motion.div
        variants={item}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
      >
        <Card title="Funds Overview" sub={`Total ${list.length} funds`}>
          {/* Table scrolls sideways on small screens */}
          <div className="overflow-x-auto">
            <table className="w-full min-w-250 text-left text-[11px]">
              <thead className="text-slate-400">
                <tr>
                  <th className={th}>#</th>
                  <th className={th}>Fund Name</th>
                  <th className={th}>Purpose</th>
                  <th className={th}>Opening Balance</th>
                  <th className={th}>Contributions</th>
                  <th className={th}>Utilization</th>
                  <th className={th}>Closing Balance</th>
                  <th className={th}>Target Amount</th>
                  <th className={th}>Status</th>
                  <th className={`${th} text-right`}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {list.map((f, i) => (
                  <motion.tr
                    key={f.id}
                    initial={{ opacity: 0, y: 10 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={VIEWPORT}
                    transition={{ duration: 0.5, ease: EASE, delay: i * 0.05 }}
                    className="hover:bg-white/2"
                  >
                    <td className={`${td} text-slate-400`}>{i + 1}</td>
                    <td className={`${td} font-medium`}>{f.name}</td>
                    <td className={`${td} max-w-44 text-slate-400`}>{f.purpose}</td>
                    <td className={`${td} whitespace-nowrap text-slate-300`}>
                      {f.opening}
                    </td>
                    <td className={`${td} whitespace-nowrap text-slate-300`}>
                      {f.contributions}
                    </td>
                    <td className={`${td} whitespace-nowrap text-slate-300`}>
                      {f.utilization}
                    </td>
                    <td className={`${td} whitespace-nowrap font-medium`}>
                      {f.closing}
                    </td>
                    <td className={`${td} whitespace-nowrap text-slate-400`}>
                      {f.target}
                    </td>
                    <td className={td}>
                      <Badge tone={f.status === "Active" ? "green" : "gray"}>
                        {f.status}
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

                {list.length === 0 && (
                  <tr>
                    <td
                      colSpan={10}
                      className={`${td} py-8 text-center text-slate-500`}
                    >
                      No funds found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="mt-4 flex flex-col items-center justify-between gap-3 text-[11px] text-slate-400 sm:flex-row">
            <span>
              Showing 1-{list.length} of {funds.length} funds
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

      {/* Create Reserve Fund drawer (opens from the "Create Fund" button) */}
      <AddReserveFundModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSave={handleSaveFund}
      />
    </div>
  );
}