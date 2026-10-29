"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion, type Variants } from "framer-motion";
import {
  Users,
  Crown,
  NotebookPen,
  Wallet,
  Plus,
  Phone,
  IndianRupee,
  Wrench,
  PartyPopper,
  Eye,
  Pencil,
  Power,
  Trash2,
  ChevronDown,
  CheckCircle2,
  X,
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

type Role = "Chairman" | "Secretary" | "Treasurer" | "Member";
type MemberStatus = "Active" | "Inactive";

type Member = {
  id: number;
  name: string;
  role: Role;
  phone: string;
  status: MemberStatus;
};

const initialMembers: Member[] = [
  { id: 1, name: "Ramesh Sharma", role: "Chairman", phone: "+91 98765 43001", status: "Active" },
  { id: 2, name: "Priya Verma", role: "Secretary", phone: "+91 98765 43002", status: "Active" },
  { id: 3, name: "Amit Kumar", role: "Treasurer", phone: "+91 98765 43003", status: "Active" },
  { id: 4, name: "Sunita Rao", role: "Member", phone: "+91 98765 43004", status: "Active" },
  { id: 5, name: "Vikram Singh", role: "Member", phone: "+91 98765 43005", status: "Active" },
  { id: 6, name: "Neha Bansal", role: "Member", phone: "+91 98765 43006", status: "Active" },
  { id: 7, name: "Rajesh Patel", role: "Member", phone: "+91 98765 43007", status: "Active" },
];

const roleOptions: Role[] = ["Chairman", "Secretary", "Treasurer", "Member"];

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

/* ---------- Shared styles ---------- */

const th =
  "bg-white/4 px-2 py-2 font-medium first:rounded-l-md last:rounded-r-md";
const td = "border-t border-[#272D39] px-2 py-2.5";
const field =
  "w-full rounded-lg border border-[#272D39] bg-[#10131A] px-3 py-2 text-xs text-slate-200 outline-none placeholder:text-slate-500 focus:border-[#A29CFF]/60";

// Small icon button used in the Actions column
const iconBtn = "cursor-pointer rounded-md p-1.5 transition active:scale-90";

/* ---------- Helpers ---------- */

// Keeps only digits of a phone number
const digitsOf = (v: string) => v.replace(/\D/g, "");

/* ---------- View Details popup ---------- */

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 border-t border-[#272D39] py-2 text-[11px] first:border-t-0">
      <span className="shrink-0 text-slate-400">{label}</span>
      <span className="min-w-0 break-words text-right font-medium text-slate-200">{value}</span>
    </div>
  );
}

type ViewMemberModalProps = {
  record: Member;
  onClose: () => void;
};

function ViewMemberModal({ record, onClose }: ViewMemberModalProps) {
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
        className="max-h-[90vh] w-full max-w-sm overflow-y-auto rounded-xl border border-[#272D39] bg-[#10131A] p-4 text-white shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h2 className="text-sm font-bold">Member Details</h2>
            <p className="truncate text-[11px] text-slate-400">{record.name}</p>
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

        {/* Status */}
        <div className="mt-3 flex items-center justify-between rounded-lg border border-[#272D39] bg-white/3 px-3 py-2">
          <span className="text-[11px] text-slate-400">Status</span>
          <Badge tone={record.status === "Active" ? "green" : "gray"}>{record.status}</Badge>
        </div>

        {/* Details */}
        <div className="mt-2 rounded-lg border border-[#272D39] bg-white/3 px-3">
          <DetailRow label="Name" value={record.name} />
          <DetailRow label="Role" value={record.role} />
          <DetailRow label="Phone" value={record.phone} />
        </div>

        {/* Actions */}
        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="cursor-pointer rounded-lg border border-[#272D39] px-4 py-2 text-xs font-semibold text-slate-300 transition hover:bg-white/5 active:scale-95"
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/* ---------- Edit Member popup ---------- */

type EditMemberModalProps = {
  record: Member;
  members: Member[];
  onClose: () => void;
  onSubmit: (updated: Member) => void;
};

function EditMemberModal({ record, members, onClose, onSubmit }: EditMemberModalProps) {
  const [name, setName] = useState(record.name);
  const [role, setRole] = useState<Role>(record.role);
  const [phone, setPhone] = useState(record.phone);
  const [status, setStatus] = useState<MemberStatus>(record.status);
  const [error, setError] = useState("");

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const n = name.trim();
    const d = digitsOf(phone);

    if (!n) {
      setError("Please enter the member name.");
      return;
    }
    if (n.length < 3) {
      setError("Name must be at least 3 characters.");
      return;
    }
    if (n.length > 60) {
      setError("Name cannot be more than 60 characters.");
      return;
    }
    if (d.length < 10 || d.length > 12) {
      setError("Enter a valid phone number (10 to 12 digits).");
      return;
    }

    // Chairman / Secretary / Treasurer can belong to one member only
    if (role !== "Member") {
      const holder = members.find((m) => m.role === role && m.id !== record.id);
      if (holder) {
        setError(`${role} is already ${holder.name}. Change their role first.`);
        return;
      }
    }

    onSubmit({ ...record, name: n, role, phone: phone.trim(), status });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      onClick={onClose}
      className="fixed inset-0 z-70 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm"
    >
      <motion.form
        onSubmit={handleSubmit}
        onClick={(e) => e.stopPropagation()}
        initial={{ opacity: 0, y: 24, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 24, scale: 0.96 }}
        transition={{ duration: 0.3, ease: EASE }}
        className="max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl border border-[#272D39] bg-[#10131A] p-5 text-white shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-bold">Edit Member</h2>
            <p className="text-[11px] text-slate-400">
              Update the details of {record.name}
            </p>
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

        {/* Form fields */}
        <div className="mt-4 flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-[11px] text-slate-400">
            Name
            <input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError("");
              }}
              className={field}
              autoFocus
            />
          </label>

          <label className="flex flex-col gap-1 text-[11px] text-slate-400">
            Phone
            <input
              type="tel"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                setError("");
              }}
              placeholder="+91 98765 43000"
              className={field}
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-[11px] text-slate-400">
              Role
              <div className="relative">
                <select
                  value={role}
                  onChange={(e) => {
                    setRole(e.target.value as Role);
                    setError("");
                  }}
                  className={`${field} cursor-pointer appearance-none pr-8`}
                >
                  {roleOptions.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
              </div>
            </label>

            <label className="flex flex-col gap-1 text-[11px] text-slate-400">
              Status
              <div className="relative">
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as MemberStatus)}
                  className={`${field} cursor-pointer appearance-none pr-8`}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-500" />
              </div>
            </label>
          </div>

          {error && <p className="text-[11px] text-red-400">{error}</p>}
        </div>

        {/* Actions */}
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
            Save Changes
          </button>
        </div>
      </motion.form>
    </motion.div>
  );
}

/* ---------- Delete confirm popup ---------- */

type DeleteConfirmProps = {
  record: Member;
  onClose: () => void;
  onConfirm: () => void;
};

function DeleteConfirm({ record, onClose, onConfirm }: DeleteConfirmProps) {
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
        className="w-full max-w-sm rounded-xl border border-[#272D39] bg-[#10131A] p-5 text-white shadow-2xl"
      >
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-500/15 text-red-400">
            <Trash2 className="h-4 w-4" />
          </span>
          <div>
            <h2 className="text-base font-bold">Delete Member</h2>
            <p className="text-[11px] text-slate-400">
              This action cannot be undone.
            </p>
          </div>
        </div>

        <p className="mt-4 text-xs text-slate-300">
          Are you sure you want to remove{" "}
          <span className="font-semibold text-white">{record.name}</span>
          {record.role !== "Member" && <> ({record.role})</>} from the committee?
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
      </motion.div>
    </motion.div>
  );
}

/* ---------- Page ---------- */
export default function CommitteePage() {
  const [addOpen, setAddOpen] = useState(false);
  const [members, setMembers] = useState<Member[]>(initialMembers);

  // Member open in the View / Edit / Delete popup (null = closed)
  const [viewing, setViewing] = useState<Member | null>(null);
  const [editing, setEditing] = useState<Member | null>(null);
  const [deleting, setDeleting] = useState<Member | null>(null);
  // Small success message after an action
  const [toast, setToast] = useState("");

  // Hide the success message after 3 seconds
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  // Top cards are calculated from the members list
  const holder = (r: Role) => members.find((m) => m.role === r);
  const countOf = (r: Role) => members.filter((m) => m.role === r).length;

  const stats = [
    {
      label: "Total Members",
      value: String(members.length),
      sub: "Executive committee",
      subC: "text-slate-400",
      icon: Users,
      c: "#3B82F6",
    },
    {
      label: "Chairman",
      value: String(countOf("Chairman")),
      sub: holder("Chairman")?.name ?? "Not assigned",
      subC: "text-slate-400",
      icon: Crown,
      c: "#F59E0B",
    },
    {
      label: "Secretary",
      value: String(countOf("Secretary")),
      sub: holder("Secretary")?.name ?? "Not assigned",
      subC: "text-slate-400",
      icon: NotebookPen,
      c: "#8B5CF6",
    },
    {
      label: "Treasurer",
      value: String(countOf("Treasurer")),
      sub: holder("Treasurer")?.name ?? "Not assigned",
      subC: "text-slate-400",
      icon: Wallet,
      c: "#00C2B8",
    },
  ];

  // Edit: save the changed details (replace with an API call later)
  const handleEdit = (updated: Member) => {
    setMembers((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
    setToast(`${updated.name} updated`);
    setEditing(null);
  };

  // Activate / Deactivate: flips the status (replace with an API call later)
  const toggleStatus = (m: Member) => {
    const next: MemberStatus = m.status === "Active" ? "Inactive" : "Active";
    setMembers((prev) => prev.map((x) => (x.id === m.id ? { ...x, status: next } : x)));
    setToast(`${m.name} is now ${next}`);
  };

  // Delete: removes the member (replace with an API call later)
  const handleDelete = () => {
    if (!deleting) return;
    setMembers((prev) => prev.filter((m) => m.id !== deleting.id));
    setToast(`${deleting.name} removed`);
    setDeleting(null);
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
            <p className={`mt-1 truncate text-[10px] ${subC}`}>{sub}</p>
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
                    <tr key={m.id} className="hover:bg-white/2">
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

                      {/* Actions: icons directly in the row (no 3-dot menu) */}
                      <td className={`${td} text-right`}>
                        <div className="flex items-center justify-end gap-0.5">
                          {/* View Details */}
                          <button
                            type="button"
                            title="View Details"
                            aria-label={`View details of ${m.name}`}
                            onClick={() => setViewing(m)}
                            className={`${iconBtn} text-slate-400 hover:bg-white/5 hover:text-white`}
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          {/* Edit */}
                          <button
                            type="button"
                            title="Edit"
                            aria-label={`Edit ${m.name}`}
                            onClick={() => setEditing(m)}
                            className={`${iconBtn} text-slate-400 hover:bg-white/5 hover:text-[#A29CFF]`}
                          >
                            <Pencil className="h-4 w-4" />
                          </button>

                          {/* Activate / Deactivate */}
                          <button
                            type="button"
                            title={m.status === "Active" ? "Deactivate" : "Activate"}
                            aria-label={m.status === "Active" ? `Deactivate ${m.name}` : `Activate ${m.name}`}
                            onClick={() => toggleStatus(m)}
                            className={`${iconBtn} ${
                              m.status === "Active"
                                ? "text-emerald-400 hover:bg-emerald-500/10"
                                : "text-slate-500 hover:bg-white/5 hover:text-white"
                            }`}
                          >
                            <Power className="h-4 w-4" />
                          </button>

                          {/* Delete */}
                          <button
                            type="button"
                            title="Delete"
                            aria-label={`Delete ${m.name}`}
                            onClick={() => setDeleting(m)}
                            className={`${iconBtn} text-red-400 hover:bg-red-500/10`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {members.length === 0 && (
                  <tr>
                    <td
                      colSpan={5}
                      className={`${td} py-8 text-center text-slate-500`}
                    >
                      No members found
                    </td>
                  </tr>
                )}
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

      {/* View Details popup */}
      <AnimatePresence>
        {viewing && (
          <ViewMemberModal
            key={viewing.id}
            record={viewing}
            onClose={() => setViewing(null)}
          />
        )}
      </AnimatePresence>

      {/* Edit popup */}
      <AnimatePresence>
        {editing && (
          <EditMemberModal
            key={editing.id}
            record={editing}
            members={members}
            onClose={() => setEditing(null)}
            onSubmit={handleEdit}
          />
        )}
      </AnimatePresence>

      {/* Delete confirm popup */}
      <AnimatePresence>
        {deleting && (
          <DeleteConfirm
            key={deleting.id}
            record={deleting}
            onClose={() => setDeleting(null)}
            onConfirm={handleDelete}
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
            className="fixed right-4 top-20 z-80 flex max-w-[90vw] items-center gap-2 rounded-lg border border-emerald-500/30 bg-[#10131A] px-4 py-2.5 text-xs text-emerald-400 shadow-xl"
          >
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{toast}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}