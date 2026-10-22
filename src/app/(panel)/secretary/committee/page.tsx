"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import {
  Users,
  Crown,
  NotebookPen,
  Wallet,
  Plus,
  MoreHorizontal,
  Phone,
  IndianRupee,
  Wrench,
  PartyPopper,
} from "lucide-react";
import { Card, Badge } from "@/Components/ui";
import AddCommitteeModal from "@/Components/AddCommitteeModal";

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
    label: "Total Members",
    value: "7",
    sub: "Executive committee",
    subC: "text-slate-400",
    icon: Users,
    c: "#3B82F6",
  },
  {
    label: "Chairman",
    value: "1",
    sub: "Ramesh Sharma",
    subC: "text-slate-400",
    icon: Crown,
    c: "#F59E0B",
  },
  {
    label: "Secretary",
    value: "1",
    sub: "Priya Verma",
    subC: "text-slate-400",
    icon: NotebookPen,
    c: "#8B5CF6",
  },
  {
    label: "Treasurer",
    value: "1",
    sub: "Amit Kumar",
    subC: "text-slate-400",
    icon: Wallet,
    c: "#00C2B8",
  },
];

type Role = "Chairman" | "Secretary" | "Treasurer" | "Member";

const members: {
  name: string;
  role: Role;
  phone: string;
  status: "Active" | "Inactive";
}[] = [
  {
    name: "Ramesh Sharma",
    role: "Chairman",
    phone: "+91 98765 43001",
    status: "Active",
  },
  {
    name: "Priya Verma",
    role: "Secretary",
    phone: "+91 98765 43002",
    status: "Active",
  },
  {
    name: "Amit Kumar",
    role: "Treasurer",
    phone: "+91 98765 43003",
    status: "Active",
  },
  {
    name: "Sunita Rao",
    role: "Member",
    phone: "+91 98765 43004",
    status: "Active",
  },
  {
    name: "Vikram Singh",
    role: "Member",
    phone: "+91 98765 43005",
    status: "Active",
  },
  {
    name: "Neha Bansal",
    role: "Member",
    phone: "+91 98765 43006",
    status: "Active",
  },
  {
    name: "Rajesh Patel",
    role: "Member",
    phone: "+91 98765 43007",
    status: "Active",
  },
];

const roleTone: Record<Role, "purple" | "blue" | "orange" | "gray"> = {
  Chairman: "purple",
  Secretary: "blue",
  Treasurer: "orange",
  Member: "gray",
};

const avatarColors = ["#3B82F6", "#8B5CF6", "#00C2B8", "#F59E0B", "#EF4444"];
const initials = (n: string) =>
  n
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

const committees = [
  { n: "Finance Committee", m: 3, i: IndianRupee, c: "#00C2B8" },
  { n: "Maintenance Committee", m: 2, i: Wrench, c: "#3B82F6" },
  { n: "Social Committee", m: 2, i: PartyPopper, c: "#8B5CF6" },
];

const th =
  "bg-white/4 px-2 py-2 font-medium first:rounded-l-md last:rounded-r-md";
const td = "border-t border-[#272D39] px-2 py-2.5";

/* ---------- Page ---------- */
export default function CommitteePage() {
  const [addOpen, setAddOpen] = useState(false);

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
          <h1 className="text-xl font-bold sm:text-2xl">Committee</h1>
          <p className="text-xs text-slate-400">
            Manage committee members and roles
          </p>
        </motion.div>

        {/* Add button: opens the drawer on click */}
        <motion.div variants={item}>
          <button
            type="button"
            onClick={() => setAddOpen(true)}
            className="flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-linear-to-r from-[#6C63FF] to-[#4DA3FF] px-4 py-2.5 text-xs font-semibold text-white transition hover:opacity-90 active:scale-95"
          >
            <Plus className="h-3.5 w-3.5" /> Add Member
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

      {/* Executive Committee */}
      <motion.div
        variants={item}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
      >
        <Card title="Executive Committee" sub="Current committee members">
          <div className="overflow-x-auto">
            <table className="w-full min-w-140 text-left text-[11px]">
              <thead className="text-slate-400">
                <tr>
                  <th className={th}>Name</th>
                  <th className={th}>Role</th>
                  <th className={th}>Phone</th>
                  <th className={th}>Status</th>
                  <th className={`${th} text-right`}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m, i) => {
                  const c = avatarColors[i % avatarColors.length];
                  return (
                    <tr key={m.phone} className="hover:bg-white/2">
                      <td className={td}>
                        <span className="flex items-center gap-2 font-medium">
                          <span
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                            style={{ background: `${c}26`, color: c }}
                          >
                            {initials(m.name)}
                          </span>
                          {m.name}
                        </span>
                      </td>
                      <td className={td}>
                        <Badge tone={roleTone[m.role]}>{m.role}</Badge>
                      </td>
                      <td className={`${td} text-slate-400`}>
                        <span className="flex items-center gap-1.5">
                          <Phone className="h-3 w-3 shrink-0 text-slate-500" />{" "}
                          {m.phone}
                        </span>
                      </td>
                      <td className={td}>
                        <Badge tone={m.status === "Active" ? "green" : "gray"}>
                          {m.status}
                        </Badge>
                      </td>
                      <td className={`${td} text-right`}>
                        <button
                          type="button"
                          aria-label={`Actions for ${m.name}`}
                          className="inline-flex h-7 w-7 cursor-pointer items-center justify-center rounded-md text-slate-400 hover:bg-white/5"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      </motion.div>

      {/* Committees & Roles */}
      <motion.div
        variants={container}
        initial="hidden"
        whileInView="show"
        viewport={VIEWPORT}
      >
        <Card
          title="Committees & Roles"
          sub="Sub-committees and their members"
          action={
            <Link
              href="/secretary/committee/groups"
              className="text-[11px] text-[#A29CFF] hover:underline"
            >
              View All
            </Link>
          }
        >
          <div className="grid grid-cols-1 gap-3 min-[480px]:grid-cols-2 lg:grid-cols-3">
            {committees.map(({ n, m, i: Icon, c }) => (
              <motion.div key={n} variants={item}>
                <Link
                  href="/secretary/committee/groups"
                  className="flex items-center gap-3 rounded-lg border border-[#272D39] bg-white/3 px-3 py-3 transition-colors hover:bg-white/5"
                >
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                    style={{ background: `${c}26`, color: c }}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-semibold">
                      {n}
                    </span>
                    <span className="block text-[10px] text-slate-400">
                      {m} Members
                    </span>
                  </span>
                </Link>
              </motion.div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Add Committee Member drawer */}
      <AddCommitteeModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSubmit={(data) => console.log("NEW MEMBER", data)}
      />
    </div>
  );
}