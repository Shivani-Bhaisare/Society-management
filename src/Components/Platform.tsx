"use client";

import Link from "next/link";
import { motion, type Variants } from "framer-motion";
import {
  ArrowRight,
  ShieldCheck,
  IndianRupee,
  CircleDollarSign,
  Headphones,
  Car,
  CalendarDays,
  ClipboardCheck,
  Bell,
} from "lucide-react";
import { HiOutlineUserGroup } from "react-icons/hi";

const modules = [
  {
    title: "Society & Resident Management",
    desc: "Centralize unit records, ownership details and resident profiles in a structured digital directory.",
    icon: HiOutlineUserGroup,
  },
  {
    title: "Security & Visitor Management",
    desc: "Digitize gate entries, pre-approvals, visitor logs and delivery tracking in real time.",
    icon: ShieldCheck,
  },
  {
    title: "Maintenance & Billing",
    desc: "Automate maintenance billing cycles, collection tracking and digital receipts.",
    icon: IndianRupee,
  },
  {
    title: "Accounting & Finance",
    desc: "Track income, expenses, vendor payments and financial records from one place.",
    icon: CircleDollarSign,
  },
  {
    title: "Complaints & Helpdesk",
    desc: "Structured complaint tracking with category assignment, staff routing and resolution status.",
    icon: Headphones,
  },
  {
    title: "Parking & Vehicles",
    desc: "Manage parking allocations, vehicle registrations and visitor parking digitally.",
    icon: Car,
  },
  {
    title: "Amenities & Facilities",
    desc: "Booking management for clubhouses, gyms, pools and shared community spaces.",
    icon: CalendarDays,
  },
  {
    title: "Staff & Vendor Management",
    desc: "Profiles, attendance, contracts and service history for staff and service providers.",
    icon: ClipboardCheck,
  },
  {
    title: "Communication & Community",
    desc: "Targeted notices, announcements and updates across resident groups and security teams.",
    icon: Bell,
  },
];

// Header block: label, heading and paragraph appear one after another
const header: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.15 } },
};

// Text fades in while moving up
const fadeUp: Variants = {
  hidden: { opacity: 0, y: 30 },
  show: { opacity: 1, y: 0, transition: { duration: 0.7, ease: "easeOut" } },
};

// Cards grid: cards pop in one by one
const grid: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
};

const card: Variants = {
  hidden: { opacity: 0, y: 40, scale: 0.95 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.6, ease: "easeOut" },
  },
};

const Platform = () => {
  return (
    <section
      id="platform"
      className="w-full overflow-hidden bg-[#F8FAFD] py-16"
    >
      <div className="mx-auto max-w-[1440px] px-10 lg:px-24">
        {/* Header: replays every time it enters the screen (scroll up or down) */}
        <motion.div
          variants={header}
          initial="hidden"
          whileInView="show"
          viewport={{ once: false, amount: 0.5 }}
        >
          {/* Small label */}
          <motion.p
            variants={fadeUp}
            className="text-[10px] font-semibold uppercase tracking-widest text-[#0B1220]"
          >
            The Complete Platform
          </motion.p>

          {/* Heading */}
          <motion.h2
            variants={fadeUp}
            className="mt-4 max-w-[560px] text-4xl font-bold leading-[1.1] text-[#0B1220] lg:text-5xl"
          >
            One Platform. Every Part of Society Operations.
          </motion.h2>

          {/* Paragraph */}
          <motion.p
            variants={fadeUp}
            className="mt-5 max-w-[420px] text-sm leading-6 text-gray-500"
          >
            SocietyOS connects the operational systems behind a modern
            residential community.
          </motion.p>
        </motion.div>

        {/* Cards grid: also replays on every scroll */}
        <motion.div
          variants={grid}
          initial="hidden"
          whileInView="show"
          viewport={{ once: false, amount: 0.15 }}
          className="mt-10 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3"
        >
          {modules.map(({ title, desc, icon: Icon }, index) => (
            <motion.div
              key={title}
              variants={card}
              className="group relative rounded-xl border border-gray-200 bg-[#FAFAF5] p-5 transition-all duration-300 hover:-translate-y-2 hover:border-[#2563EB]/40 hover:shadow-xl hover:shadow-[#2563EB]/10"
            >
              {/* Number */}
              <span className="absolute right-4 top-4 text-[10px] font-medium text-[#2563EB]">
                {String(index + 1).padStart(2, "0")}
              </span>

              {/* Icon box: turns blue and the icon turns white on card hover */}
              <div className="flex h-12 w-12 items-center justify-center rounded-bl-[12px] rounded-tr-[12px] bg-[#E5ECFB] transition-colors duration-300 group-hover:bg-[#2563EB]">
                <Icon
                  size={20}
                  className="text-[#2563EB] transition-colors duration-300 group-hover:text-white"
                  strokeWidth={1.5}
                />
              </div>

              {/* Title */}
              <h3 className="mt-4 text-sm font-semibold text-[#2563EB]">
                {title}
              </h3>

              {/* Description */}
              <p className="mt-2 text-xs leading-5 text-gray-500">{desc}</p>

              {/* Explore link: arrow moves right on card hover */}
              <Link
                href="#"
                className="mt-4 inline-flex items-center gap-1 text-[11px] font-semibold text-[#2563EB]"
              >
                Explore
                <ArrowRight
                  size={12}
                  className="transition-transform duration-300 group-hover:translate-x-1"
                />
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Platform;
