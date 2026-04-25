"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Phone, Mail, ChevronRight, Calendar, AlertTriangle } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface Rep {
  id: string;
  name: string;
  role: string;
  initials: string;
  borderColor: string;
  jurisdictionType: string;
  controls: string[];
  donorAlert: string | null;
  votes: { label: string; aligned: boolean }[];
  phone: string;
  email: string;
  attendance: number;
  topDonors: { name: string; amount: number }[];
  fullVotes: { date: string; bill: string; aligned: boolean; description: string }[];
}

interface RepresentativeCardProps {
  rep: Rep;
}

export default function RepresentativeCard({ rep }: RepresentativeCardProps) {
  const [showPanel, setShowPanel] = useState(false);

  return (
    <>
      <motion.div
        whileHover={{ y: -3, boxShadow: "0 12px 40px rgba(0,0,0,0.12)" }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        className="relative bg-white rounded-[12px] border border-gray-100 overflow-hidden cursor-pointer flex-shrink-0 w-72"
        style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)" }}
        onClick={() => setShowPanel(true)}
      >
        {/* Left border accent */}
        <div className="absolute left-0 top-0 bottom-0 w-1 rounded-l-[12px]" style={{ backgroundColor: rep.borderColor }} />

        <div className="p-5 pl-6">
          {/* Avatar + name */}
          <div className="flex items-start gap-3 mb-4">
            <div
              className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg text-white flex-shrink-0"
              style={{ backgroundColor: rep.borderColor }}
            >
              {rep.initials}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-[#1B2A4A] text-base leading-tight">{rep.name}</h3>
              <p className="text-xs text-gray-500 mt-0.5 leading-snug">{rep.role}</p>
            </div>
          </div>

          {/* Donor alert */}
          {rep.donorAlert && (
            <div className="flex items-center gap-1.5 mb-3 px-2.5 py-1.5 rounded-lg" style={{ backgroundColor: "#FEF3E0" }}>
              <AlertTriangle size={12} color="#E8A020" />
              <span className="text-xs font-semibold" style={{ color: "#B87010" }}>{rep.donorAlert}</span>
            </div>
          )}

          {/* Controls */}
          <div className="mb-4">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Controls</div>
            <ul className="space-y-1.5">
              {rep.controls.map((ctrl, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-gray-700 leading-snug">
                  <span className="mt-0.5 w-1 h-1 rounded-full bg-gray-300 flex-shrink-0" />
                  {ctrl}
                </li>
              ))}
            </ul>
          </div>

          {/* Vote pills */}
          <div className="mb-4">
            <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Recent votes</div>
            <div className="flex flex-col gap-1.5">
              {rep.votes.map((v, i) => (
                <div key={i} className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: v.aligned ? "#4A7C59" : "#E06B5A" }}
                  />
                  <span className="text-xs text-gray-600 leading-tight">{v.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">{rep.attendance}% attendance</span>
            <span className="text-xs font-semibold text-[#1B2A4A] flex items-center gap-0.5">
              Full record <ChevronRight size={12} />
            </span>
          </div>
        </div>
      </motion.div>

      {/* Detail panel */}
      <AnimatePresence>
        {showPanel && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[150]"
              style={{ backgroundColor: "rgba(0,0,0,0.4)", backdropFilter: "blur(3px)" }}
              onClick={() => setShowPanel(false)}
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 32, stiffness: 300 }}
              className="fixed right-0 top-0 bottom-0 z-[160] w-full max-w-lg bg-white overflow-y-auto"
              style={{ boxShadow: "-8px 0 40px rgba(0,0,0,0.16)" }}
            >
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-gray-100 px-6 py-4 flex items-center gap-3 z-10">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white"
                  style={{ backgroundColor: rep.borderColor }}
                >
                  {rep.initials}
                </div>
                <div className="flex-1">
                  <div className="font-bold text-[#1B2A4A] text-base">{rep.name}</div>
                  <div className="text-xs text-gray-500">{rep.role}</div>
                </div>
                <button
                  onClick={() => setShowPanel(false)}
                  className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="p-6 space-y-8">
                {/* Donor alert */}
                {rep.donorAlert && (
                  <div className="rounded-xl p-4 border" style={{ backgroundColor: "#FEF8EC", borderColor: "#F5D98A" }}>
                    <div className="flex items-start gap-2">
                      <AlertTriangle size={16} color="#B87010" className="mt-0.5 flex-shrink-0" />
                      <div>
                        <div className="font-semibold text-sm" style={{ color: "#92580A" }}>Donor conflict of interest</div>
                        <div className="text-xs text-yellow-800 mt-1">{rep.donorAlert} in the current election cycle may influence votes on housing and development.</div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Top donors chart */}
                <div>
                  <h4 className="font-bold text-[#1B2A4A] text-sm uppercase tracking-wide mb-3">Top Campaign Donors</h4>
                  <div className="space-y-2">
                    {rep.topDonors.map((d, i) => {
                      const max = rep.topDonors[0].amount;
                      return (
                        <div key={i}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-gray-700 font-medium">{d.name}</span>
                            <span className="text-gray-500">${d.amount.toLocaleString()}</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${(d.amount / max) * 100}%` }}
                              transition={{ duration: 0.6, delay: i * 0.08, ease: "easeOut" }}
                              className="h-full rounded-full"
                              style={{ backgroundColor: rep.borderColor }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Full voting record */}
                <div>
                  <h4 className="font-bold text-[#1B2A4A] text-sm uppercase tracking-wide mb-3">Full Voting Record</h4>
                  <div className="space-y-3">
                    {rep.fullVotes.map((v, i) => (
                      <div key={i} className="flex gap-3 p-3 rounded-xl bg-gray-50">
                        <div
                          className="w-1 rounded-full flex-shrink-0 self-stretch"
                          style={{ backgroundColor: v.aligned ? "#4A7C59" : "#E06B5A" }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="font-semibold text-xs text-[#1B2A4A] leading-tight">{v.bill}</span>
                            <span
                              className="text-xs font-bold px-2 py-0.5 rounded-full flex-shrink-0"
                              style={{
                                backgroundColor: v.aligned ? "#EAF4ED" : "#FDECEA",
                                color: v.aligned ? "#2E6B42" : "#C0392B",
                              }}
                            >
                              {v.aligned ? "✓" : "✗"}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 leading-relaxed">{v.description}</p>
                          <div className="text-xs text-gray-400 mt-1">{v.date}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Attendance */}
                <div>
                  <h4 className="font-bold text-[#1B2A4A] text-sm uppercase tracking-wide mb-2">Attendance</h4>
                  <div className="flex items-center gap-3">
                    <div className="relative w-14 h-14">
                      <svg viewBox="0 0 56 56" className="w-14 h-14 -rotate-90">
                        <circle cx="28" cy="28" r="22" fill="none" stroke="#F0F0F0" strokeWidth="6" />
                        <circle
                          cx="28" cy="28" r="22" fill="none"
                          stroke={rep.borderColor} strokeWidth="6"
                          strokeDasharray={`${(rep.attendance / 100) * 138.2} 138.2`}
                          strokeLinecap="round"
                        />
                      </svg>
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-bold text-[#1B2A4A]">{rep.attendance}%</span>
                      </div>
                    </div>
                    <div>
                      <div className="font-semibold text-[#1B2A4A] text-sm">{rep.attendance}% attendance rate</div>
                      <div className="text-xs text-gray-500">Current term · all scheduled votes</div>
                    </div>
                  </div>
                </div>

                {/* Contact */}
                <div>
                  <h4 className="font-bold text-[#1B2A4A] text-sm uppercase tracking-wide mb-3">Contact</h4>
                  <div className="flex gap-3">
                    <a
                      href={`tel:${rep.phone}`}
                      className="flex-1 flex items-center justify-center gap-2 text-sm font-semibold py-3 rounded-xl border border-gray-200 text-[#1B2A4A] hover:border-[#1B2A4A] hover:bg-[#1B2A4A] hover:text-white transition-all duration-150"
                    >
                      <Phone size={14} />
                      Call
                    </a>
                    <a
                      href={`mailto:${rep.email}`}
                      className="flex-1 flex items-center justify-center gap-2 text-sm font-semibold py-3 rounded-xl text-white transition-opacity hover:opacity-90"
                      style={{ backgroundColor: rep.borderColor }}
                    >
                      <Mail size={14} />
                      Email
                    </a>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
