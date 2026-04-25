"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Clock, X, Phone, ExternalLink, Users } from "lucide-react";

const CATEGORY_STYLES: Record<string, { bg: string; color: string; light: string }> = {
  "Homeless Shelters": { bg: "#5BA4CF", color: "white", light: "#EDF5FB" },
  "Food Banks":        { bg: "#4CAF82", color: "white", light: "#EDFAF4" },
  "Food Pantries":     { bg: "#4CAF82", color: "white", light: "#EDFAF4" },
  "Animal Shelters":   { bg: "#F5C842", color: "#92720A", light: "#FFFBEB" },
  "Clothing Donations":{ bg: "#E8513A", color: "white", light: "#FFF0ED" },
  "Children & Family": { bg: "#E8513A", color: "white", light: "#FFF0ED" },
  "Mental Health":     { bg: "#9B7FD4", color: "white", light: "#F5F0FF" },
  "Legal Aid":         { bg: "#1B2A4A", color: "white", light: "#EEF0F5" },
};

interface Resource {
  id: string; category: string; icon: string; name: string;
  address: string; distance: string;
  hours: { today: string; isOpen: boolean };
  volunteerNeeds: string; capacity: number | null; maxCapacity: number | null;
  volunteerDesc: string; timeCommitment: string; trainingRequired: boolean;
  phone: string; signupUrl: string;
}

export default function ResourceCard({ resource }: { resource: Resource }) {
  const [showModal, setShowModal] = useState(false);
  const style = CATEGORY_STYLES[resource.category] || CATEGORY_STYLES["Legal Aid"];

  const capacityPct = resource.capacity && resource.maxCapacity
    ? Math.round((resource.capacity / resource.maxCapacity) * 100) : null;

  return (
    <>
      <motion.div
        whileHover={{ y: -4, boxShadow: "0 12px 36px rgba(0,0,0,0.12)" }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        className="bg-white rounded-card border border-black/[0.04] overflow-hidden flex flex-col"
        style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}
      >
        {/* Color band top */}
        <div className="h-2" style={{ backgroundColor: style.bg }} />

        <div className="p-5 flex flex-col flex-1 gap-3">
          {/* Icon + category badge */}
          <div className="flex items-center justify-between">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl"
              style={{ backgroundColor: style.light }}
            >
              {resource.icon}
            </div>
            <span
              className="text-xs font-bold px-3 py-1.5 rounded-pill"
              style={{ backgroundColor: style.light, color: style.bg === "#F5C842" ? "#92720A" : style.bg }}
            >
              {resource.category}
            </span>
          </div>

          {/* Name */}
          <h3 className="font-bold text-[#1B2A4A] text-lg leading-snug">{resource.name}</h3>

          {/* Address */}
          <div className="flex items-center gap-1.5 text-sm text-gray-500">
            <MapPin size={13} className="flex-shrink-0" />
            <span className="truncate">{resource.address}</span>
            <span className="flex-shrink-0 font-semibold" style={{ color: style.bg === "#F5C842" ? "#92720A" : style.bg }}>
              · {resource.distance}
            </span>
          </div>

          {/* Open/closed status */}
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: resource.hours.isOpen ? "#4CAF82" : "#D1D5DB" }}
            />
            <span className={`text-sm font-semibold ${resource.hours.isOpen ? "text-[#2A7A4A]" : "text-gray-400"}`}>
              {resource.hours.isOpen ? "Open now" : "Closed"}
            </span>
            <span className="text-sm text-gray-400">· {resource.hours.today}</span>
          </div>

          {/* Capacity bar */}
          {capacityPct !== null && (
            <div>
              <div className="flex justify-between text-xs font-semibold mb-1.5">
                <span className="text-gray-500">Capacity</span>
                <span style={{ color: capacityPct > 85 ? "#E8513A" : capacityPct > 65 ? "#E8A020" : "#4CAF82" }}>
                  {resource.capacity}/{resource.maxCapacity} beds
                </span>
              </div>
              <div className="h-2.5 rounded-pill bg-gray-100 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${capacityPct}%` }}
                  transition={{ duration: 0.7, ease: "easeOut" }}
                  className="h-full rounded-pill"
                  style={{
                    backgroundColor: capacityPct > 85 ? "#E8513A" : capacityPct > 65 ? "#F5C842" : "#4CAF82"
                  }}
                />
              </div>
            </div>
          )}

          {/* Volunteer needs snippet */}
          <div className="p-3 rounded-2xl flex-1" style={{ backgroundColor: style.light }}>
            <div className="flex items-center gap-1.5 text-xs font-bold mb-1.5" style={{ color: style.bg === "#F5C842" ? "#92720A" : style.bg }}>
              <Users size={12} /> Needs volunteers
            </div>
            <p className="text-sm text-gray-700 leading-relaxed line-clamp-2">{resource.volunteerNeeds}</p>
          </div>

          {/* CTA buttons */}
          <div className="flex gap-2 pt-1">
            <a
              href={`https://maps.google.com/?q=${encodeURIComponent(resource.address)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 text-center text-sm font-bold py-3 rounded-pill border-2 border-gray-200 text-[#1B2A4A] hover:border-[#1B2A4A] transition-colors"
            >
              Directions
            </a>
            <button
              onClick={() => setShowModal(true)}
              className="flex-1 text-sm font-bold py-3 rounded-pill text-white transition-opacity hover:opacity-90"
              style={{ backgroundColor: style.bg === "#F5C842" ? "#E8A020" : style.bg }}
            >
              Volunteer →
            </button>
          </div>
        </div>
      </motion.div>

      {/* Volunteer modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-0 sm:p-4"
            style={{ backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ y: 60, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 60, opacity: 0 }}
              transition={{ type: "spring", damping: 34, stiffness: 320 }}
              className="bg-white w-full sm:max-w-md rounded-t-[32px] sm:rounded-card overflow-hidden"
              style={{ boxShadow: "0 -8px 40px rgba(0,0,0,0.18)" }}
              onClick={e => e.stopPropagation()}
            >
              {/* Drag handle on mobile */}
              <div className="flex justify-center pt-3 sm:hidden">
                <div className="w-10 h-1 rounded-pill bg-gray-200" />
              </div>

              {/* Color header */}
              <div className="h-2 w-full" style={{ backgroundColor: style.bg }} />

              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="text-3xl mb-2">{resource.icon}</div>
                    <h3 className="font-bold text-[#1B2A4A] text-xl">{resource.name}</h3>
                    <p className="text-sm text-gray-500 mt-0.5">{resource.category}</p>
                  </div>
                  <button onClick={() => setShowModal(false)}
                    className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors">
                    <X size={18} className="text-gray-500" />
                  </button>
                </div>

                <p className="text-base text-gray-700 leading-relaxed mb-5">{resource.volunteerDesc}</p>

                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="p-4 rounded-2xl" style={{ backgroundColor: style.light }}>
                    <div className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: style.bg === "#F5C842" ? "#92720A" : style.bg }}>
                      Time needed
                    </div>
                    <div className="text-sm font-semibold text-[#1B2A4A]">{resource.timeCommitment}</div>
                  </div>
                  <div className="p-4 rounded-2xl" style={{ backgroundColor: style.light }}>
                    <div className="text-xs font-bold uppercase tracking-wide mb-1" style={{ color: style.bg === "#F5C842" ? "#92720A" : style.bg }}>
                      Training
                    </div>
                    <div className="text-sm font-semibold text-[#1B2A4A]">
                      {resource.trainingRequired ? "✓ Provided" : "Not required"}
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <a href={`tel:${resource.phone}`}
                    className="flex-1 flex items-center justify-center gap-2 py-4 rounded-pill font-bold text-[#1B2A4A] border-2 border-gray-200 hover:border-gray-400 transition-colors">
                    <Phone size={16} /> Call
                  </a>
                  <a href={resource.signupUrl}
                    className="flex-1 flex items-center justify-center gap-2 py-4 rounded-pill font-bold text-white transition-opacity hover:opacity-90"
                    style={{ backgroundColor: style.bg === "#F5C842" ? "#E8A020" : style.bg }}>
                    <ExternalLink size={16} /> Sign up
                  </a>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
