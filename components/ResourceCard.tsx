"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MapPin, Clock, Users, X, Phone, ExternalLink } from "lucide-react";

interface Resource {
  id: string;
  category: string;
  icon: string;
  name: string;
  address: string;
  distance: string;
  hours: { today: string; isOpen: boolean };
  volunteerNeeds: string;
  capacity: number | null;
  maxCapacity: number | null;
  volunteerDesc: string;
  timeCommitment: string;
  trainingRequired: boolean;
  phone: string;
  signupUrl: string;
}

interface ResourceCardProps {
  resource: Resource;
}

export default function ResourceCard({ resource }: ResourceCardProps) {
  const [showModal, setShowModal] = useState(false);

  const capacityPct = resource.capacity && resource.maxCapacity
    ? (resource.capacity / resource.maxCapacity) * 100
    : null;

  const capacityColor = capacityPct
    ? capacityPct > 85 ? "#E06B5A" : capacityPct > 65 ? "#E8A020" : "#4A7C59"
    : "#4A7C59";

  return (
    <>
      <motion.div
        whileHover={{ y: -2, boxShadow: "0 8px 32px rgba(0,0,0,0.10)" }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        className="bg-white rounded-[12px] border border-gray-100 p-5 flex flex-col gap-3 cursor-default"
        style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.04)" }}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-[#1B2A4A] text-base leading-tight truncate">{resource.name}</h3>
            <span className="inline-flex items-center gap-1 mt-1 text-xs font-medium px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
              {resource.icon} {resource.category}
            </span>
          </div>
        </div>

        {/* Address + hours */}
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5 text-xs text-gray-500">
            <MapPin size={11} className="shrink-0" />
            <span className="truncate">{resource.address}</span>
            <span className="shrink-0 text-gray-400">· {resource.distance}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <Clock size={11} className="shrink-0 text-gray-400" />
            <span className={`font-medium ${resource.hours.isOpen ? "text-[#4A7C59]" : "text-gray-400"}`}>
              {resource.hours.isOpen ? "Open now" : "Closed"}
            </span>
            <span className="text-gray-400">· {resource.hours.today}</span>
          </div>
        </div>

        {/* Capacity bar (shelters only) */}
        {capacityPct !== null && (
          <div>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="text-gray-500 font-medium">Capacity</span>
              <span className="font-semibold" style={{ color: capacityColor }}>
                {resource.capacity}/{resource.maxCapacity}
              </span>
            </div>
            <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${capacityPct}%` }}
                transition={{ duration: 0.8, ease: "easeOut", delay: 0.2 }}
                className="h-full rounded-full"
                style={{ backgroundColor: capacityColor }}
              />
            </div>
          </div>
        )}

        {/* Volunteer needs */}
        <div className="bg-[#FAF9F6] rounded-lg p-3">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1B2A4A] mb-1">
            <Users size={11} />
            Needs volunteers
          </div>
          <p className="text-xs text-gray-600 leading-relaxed">{resource.volunteerNeeds}</p>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2 pt-1">
          <a
            href={`https://maps.google.com/?q=${encodeURIComponent(resource.address)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-center text-xs font-semibold py-2 rounded-lg border border-gray-200 text-[#1B2A4A] hover:border-[#1B2A4A] hover:bg-[#1B2A4A] hover:text-white transition-all duration-150"
          >
            Get directions
          </a>
          <button
            onClick={() => setShowModal(true)}
            className="flex-1 text-xs font-semibold py-2 rounded-lg text-white transition-all duration-150 hover:opacity-90"
            style={{ backgroundColor: "#4A7C59" }}
          >
            Volunteer →
          </button>
        </div>
      </motion.div>

      {/* Volunteer modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-4"
            style={{ backgroundColor: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 12 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 12 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="bg-white rounded-[12px] w-full max-w-md p-6 relative"
              style={{ boxShadow: "0 24px 64px rgba(0,0,0,0.20)" }}
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setShowModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors"
              >
                <X size={16} />
              </button>

              <div className="mb-4">
                <span className="text-2xl">{resource.icon}</span>
                <h3 className="font-bold text-[#1B2A4A] text-xl mt-2">{resource.name}</h3>
                <p className="text-sm text-gray-500 mt-0.5">{resource.category}</p>
              </div>

              <div className="space-y-4">
                <p className="text-sm text-gray-700 leading-relaxed">{resource.volunteerDesc}</p>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[#FAF9F6] rounded-lg p-3">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Time</div>
                    <div className="text-sm font-medium text-[#1B2A4A]">{resource.timeCommitment}</div>
                  </div>
                  <div className="bg-[#FAF9F6] rounded-lg p-3">
                    <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Training</div>
                    <div className="text-sm font-medium text-[#1B2A4A]">
                      {resource.trainingRequired ? "Required (provided)" : "Not required"}
                    </div>
                  </div>
                </div>

                <div className="border-t border-gray-100 pt-4 flex gap-3">
                  <a
                    href={`tel:${resource.phone}`}
                    className="flex-1 flex items-center justify-center gap-2 text-sm font-semibold py-3 rounded-lg border border-gray-200 text-[#1B2A4A] hover:border-[#1B2A4A] transition-colors"
                  >
                    <Phone size={14} />
                    Call to sign up
                  </a>
                  <a
                    href={resource.signupUrl}
                    className="flex-1 flex items-center justify-center gap-2 text-sm font-semibold py-3 rounded-lg text-white transition-opacity hover:opacity-90"
                    style={{ backgroundColor: "#4A7C59" }}
                  >
                    <ExternalLink size={14} />
                    Sign up online
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
