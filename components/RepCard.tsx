"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Phone, Mail, ChevronRight, AlertTriangle } from "lucide-react";
import { AvatarNikki, AvatarMia, AvatarBarbara, AvatarLayla } from "./RepAvatar";

const AVATARS: Record<string, React.FC<{ size?: number; className?: string }>> = {
  "1": AvatarNikki,
  "2": AvatarMia,
  "3": AvatarBarbara,
  "4": AvatarLayla,
};

const CARD_COLORS: Record<string, { bg: string; badge: string; pill: string }> = {
  "1": { bg: "#FFF0ED", badge: "#E8513A", pill: "#FFDDD7" },
  "2": { bg: "#EDFAF4", badge: "#4CAF82", pill: "#C8F0DC" },
  "3": { bg: "#EDF5FB", badge: "#5BA4CF", pill: "#C8E3F5" },
  "4": { bg: "#FFFBEB", badge: "#F5C842", pill: "#FFF0A0" },
};

interface Rep {
  id: string;
  name: string;
  role: string;
  controls: string[];
  donorAlert: string | null;
  votes: { label: string; aligned: boolean }[];
  phone: string;
  email: string;
  attendance: number;
  topDonors: { name: string; amount: number }[];
  fullVotes: { date: string; bill: string; aligned: boolean; description: string }[];
}

export default function RepCard({ rep }: { rep: Rep }) {
  const [open, setOpen] = useState(false);
  const Avatar = AVATARS[rep.id] || AvatarNikki;
  const colors = CARD_COLORS[rep.id] || CARD_COLORS["1"];

  const jurisdictionShort = rep.role.split("—")[0].trim();

  return (
    <>
      <motion.div
        whileHover={{ y: -4, boxShadow: "0 12px 36px rgba(0,0,0,0.12)" }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="flex-shrink-0 w-72 rounded-card bg-white border border-black/[0.04] overflow-hidden cursor-pointer select-none"
        style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}
        onClick={() => setOpen(true)}
      >
        {/* Color header band */}
        <div className="h-3 w-full" style={{ backgroundColor: colors.badge }} />

        <div className="p-5">
          {/* Avatar + name */}
          <div className="flex items-start gap-4 mb-4">
            <div className="flex-shrink-0">
              <Avatar size={72} className="rounded-full ring-4 ring-white drop-shadow-md" />
            </div>
            <div className="flex-1 pt-1">
              <h3 className="font-bold text-[#1B2A4A] text-lg leading-tight">{rep.name}</h3>
              <span
                className="inline-block mt-1 text-xs font-semibold px-3 py-1 rounded-pill"
                style={{ backgroundColor: colors.pill, color: colors.badge === "#F5C842" ? "#92720A" : colors.badge }}
              >
                {jurisdictionShort}
              </span>
            </div>
          </div>

          {/* Donor alert */}
          {rep.donorAlert && (
            <div
              className="flex items-center gap-2 mb-3 px-3 py-2 rounded-2xl text-xs font-semibold"
              style={{ backgroundColor: "#FFF8E7" }}
            >
              <AlertTriangle size={13} color="#E8A020" />
              <span style={{ color: "#A06010" }}>{rep.donorAlert}</span>
            </div>
          )}

          {/* Plain English controls */}
          <div className="mb-4 rounded-2xl p-3" style={{ backgroundColor: colors.bg }}>
            <div className="text-xs font-bold uppercase tracking-wider mb-2" style={{ color: colors.badge === "#F5C842" ? "#92720A" : colors.badge }}>
              They decide
            </div>
            <ul className="space-y-1.5">
              {rep.controls.slice(0, 2).map((c, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-[#1B2A4A]">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: colors.badge === "#F5C842" ? "#E8A020" : colors.badge }} />
                  {c}
                </li>
              ))}
            </ul>
          </div>

          {/* Vote pills */}
          <div className="flex flex-wrap gap-1.5 mb-4">
            {rep.votes.map((v, i) => (
              <span
                key={i}
                className="text-xs font-semibold px-2.5 py-1 rounded-pill"
                style={{
                  backgroundColor: v.aligned ? "#EDFAF4" : "#FFF0ED",
                  color: v.aligned ? "#2A7A4A" : "#C03020",
                }}
              >
                {v.aligned ? "✓" : "✗"} {v.label}
              </span>
            ))}
          </div>

          <button
            className="w-full flex items-center justify-center gap-2 py-3 rounded-pill text-sm font-bold text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: colors.badge === "#F5C842" ? "#E8A020" : colors.badge }}
          >
            See full record <ChevronRight size={15} />
          </button>
        </div>
      </motion.div>

      {/* Full detail sheet */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[150]"
              style={{ backgroundColor: "rgba(0,0,0,0.45)", backdropFilter: "blur(4px)" }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 36, stiffness: 340 }}
              className="fixed bottom-0 left-0 right-0 z-[160] bg-white overflow-y-auto rounded-t-[32px]"
              style={{ maxHeight: "90vh", boxShadow: "0 -8px 40px rgba(0,0,0,0.18)" }}
            >
              {/* Drag handle */}
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-10 h-1 rounded-pill bg-gray-200" />
              </div>

              {/* Header */}
              <div
                className="px-6 pt-4 pb-6"
                style={{ background: `linear-gradient(135deg, ${colors.bg} 0%, white 100%)` }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                    <Avatar size={72} className="rounded-full drop-shadow-md" />
                    <div>
                      <h2 className="font-bold text-[#1B2A4A] text-2xl">{rep.name}</h2>
                      <p className="text-base text-gray-500 mt-0.5">{rep.role}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setOpen(false)}
                    className="p-2 rounded-full bg-black/[0.06] hover:bg-black/10 transition-colors mt-1"
                  >
                    <X size={18} className="text-gray-600" />
                  </button>
                </div>

                {rep.donorAlert && (
                  <div className="mt-4 flex items-center gap-2 px-4 py-3 rounded-2xl" style={{ backgroundColor: "#FFF8E7" }}>
                    <AlertTriangle size={16} color="#E8A020" className="flex-shrink-0" />
                    <p className="text-sm font-semibold" style={{ color: "#A06010" }}>
                      {rep.donorAlert} — this may influence their votes on housing
                    </p>
                  </div>
                )}
              </div>

              <div className="px-6 pb-10 space-y-8">
                {/* What they do, plain English */}
                <div>
                  <h3 className="font-bold text-xl text-[#1B2A4A] mb-3">What they actually control</h3>
                  <div className="space-y-3">
                    {rep.controls.map((c, i) => (
                      <div key={i} className="flex items-start gap-3 p-4 rounded-2xl bg-[#FFFDF9]">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 text-base"
                          style={{ backgroundColor: colors.pill }}>
                          {["🏘", "🏗", "🌿"][i] || "📋"}
                        </div>
                        <p className="text-base text-[#1B2A4A] leading-snug">{c}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Voting record */}
                <div>
                  <h3 className="font-bold text-xl text-[#1B2A4A] mb-3">How they voted</h3>
                  <div className="space-y-3">
                    {rep.fullVotes.map((v, i) => (
                      <div key={i} className="p-4 rounded-2xl" style={{ backgroundColor: v.aligned ? "#EDFAF4" : "#FFF2F0" }}>
                        <div className="flex items-start gap-3">
                          <span className="text-2xl">{v.aligned ? "✅" : "❌"}</span>
                          <div>
                            <div className="font-semibold text-base text-[#1B2A4A] mb-1">{v.bill}</div>
                            <p className="text-sm text-gray-600 leading-relaxed">{v.description}</p>
                            <div className="text-xs text-gray-400 mt-2">{v.date}</div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Top donors */}
                <div>
                  <h3 className="font-bold text-xl text-[#1B2A4A] mb-3">Who funds their campaign</h3>
                  <div className="space-y-3">
                    {rep.topDonors.map((d, i) => {
                      const max = rep.topDonors[0].amount;
                      return (
                        <div key={i}>
                          <div className="flex justify-between text-sm mb-1.5">
                            <span className="font-semibold text-[#1B2A4A]">{d.name}</span>
                            <span className="text-gray-500">${d.amount.toLocaleString()}</span>
                          </div>
                          <div className="h-3 rounded-pill bg-gray-100 overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${(d.amount / max) * 100}%` }}
                              transition={{ duration: 0.5, delay: i * 0.08 }}
                              className="h-full rounded-pill"
                              style={{ backgroundColor: colors.badge === "#F5C842" ? "#E8A020" : colors.badge }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Attendance */}
                <div className="p-5 rounded-card" style={{ backgroundColor: colors.bg }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-bold text-xl text-[#1B2A4A]">{rep.attendance}%</div>
                      <div className="text-sm text-gray-500">shows up to vote</div>
                    </div>
                    <div className="w-20 h-20 rounded-full flex items-center justify-center"
                      style={{ background: `conic-gradient(${colors.badge === "#F5C842" ? "#E8A020" : colors.badge} ${rep.attendance * 3.6}deg, #E5E7EB 0deg)` }}>
                      <div className="w-14 h-14 rounded-full bg-white flex items-center justify-center">
                        <span className="text-xs font-bold text-[#1B2A4A]">{rep.attendance}%</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contact */}
                <div className="grid grid-cols-2 gap-3 pb-4">
                  <a
                    href={`tel:${rep.phone}`}
                    className="flex items-center justify-center gap-2 py-4 rounded-card font-bold text-base border-2 text-[#1B2A4A] hover:bg-gray-50 transition-colors"
                    style={{ borderColor: "#E5E7EB" }}
                  >
                    <Phone size={17} /> Call
                  </a>
                  <a
                    href={`mailto:${rep.email}`}
                    className="flex items-center justify-center gap-2 py-4 rounded-card font-bold text-base text-white transition-opacity hover:opacity-90"
                    style={{ backgroundColor: colors.badge === "#F5C842" ? "#E8A020" : colors.badge }}
                  >
                    <Mail size={17} /> Email
                  </a>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
