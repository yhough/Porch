"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, ChevronDown, X } from "lucide-react";
import { alerts } from "@/lib/mockData";

const alertConfig = {
  red: { bg: "#FEF2F2", border: "#FCA5A5", dot: "#EF4444", label: "URGENT" },
  amber: { bg: "#FEF9EC", border: "#FDE68A", dot: "#E8A020", label: "THIS WEEK" },
  green: { bg: "#ECFDF5", border: "#86EFAC", dot: "#4A7C59", label: "OPPORTUNITY" },
  blue: { bg: "#EFF6FF", border: "#93C5FD", dot: "#3B82F6", label: "DEADLINE" },
};

export default function AlertPanel() {
  const [collapsed, setCollapsed] = useState(false);
  const [dismissed, setDismissed] = useState<string[]>([]);

  const visible = alerts.filter(a => !dismissed.includes(a.id));

  return (
    <>
      {/* Desktop sticky sidebar */}
      <div className="hidden lg:block">
        <motion.div
          animate={{ width: collapsed ? 48 : 280 }}
          transition={{ type: "spring", damping: 28, stiffness: 260 }}
          className="fixed right-6 top-1/2 -translate-y-1/2 z-50 overflow-hidden rounded-[12px] bg-white border border-gray-200"
          style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.10)" }}
        >
          {/* Toggle */}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-between px-3 py-3 hover:bg-gray-50 transition-colors border-b border-gray-100"
          >
            <div className="flex items-center gap-2">
              <Bell size={16} className="text-[#1B2A4A] flex-shrink-0" />
              {!collapsed && (
                <span className="text-sm font-bold text-[#1B2A4A] whitespace-nowrap">
                  Alerts
                  {visible.length > 0 && (
                    <span className="ml-1.5 text-xs font-semibold px-1.5 py-0.5 rounded-full text-white" style={{ backgroundColor: "#EF4444" }}>
                      {visible.length}
                    </span>
                  )}
                </span>
              )}
            </div>
            {!collapsed && (
              <ChevronDown size={14} className="text-gray-400 rotate-90" />
            )}
          </button>

          {!collapsed && (
            <div className="p-3 space-y-2 max-h-[60vh] overflow-y-auto">
              {visible.length === 0 ? (
                <div className="text-xs text-gray-400 text-center py-4">All caught up!</div>
              ) : (
                visible.map((alert) => {
                  const cfg = alertConfig[alert.type];
                  return (
                    <motion.div
                      key={alert.id}
                      layout
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95, height: 0 }}
                      className="relative rounded-xl p-3 border text-xs"
                      style={{ backgroundColor: cfg.bg, borderColor: cfg.border }}
                    >
                      <button
                        onClick={() => setDismissed(d => [...d, alert.id])}
                        className="absolute top-2 right-2 p-0.5 rounded hover:bg-white/60 text-gray-400 transition-colors"
                      >
                        <X size={10} />
                      </button>
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cfg.dot }} />
                        <span className="font-bold text-[9px] tracking-wider" style={{ color: cfg.dot }}>
                          {cfg.label}
                        </span>
                      </div>
                      <div className="font-semibold text-[#1B2A4A] leading-tight mb-1 pr-4">{alert.title}</div>
                      <div className="text-gray-600 leading-relaxed mb-2">{alert.description}</div>
                      <button
                        className="text-xs font-bold underline-offset-2 hover:underline transition-colors"
                        style={{ color: cfg.dot }}
                      >
                        {alert.action} →
                      </button>
                    </motion.div>
                  );
                })
              )}
            </div>
          )}
        </motion.div>
      </div>

      {/* Mobile bottom sheet */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 z-50">
        <div className="bg-white border-t border-gray-200 rounded-t-[16px]" style={{ boxShadow: "0 -4px 24px rgba(0,0,0,0.10)" }}>
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Bell size={16} className="text-[#1B2A4A]" />
              <span className="font-bold text-sm text-[#1B2A4A]">
                Alerts
                {visible.length > 0 && (
                  <span className="ml-1.5 text-xs font-semibold px-1.5 py-0.5 rounded-full text-white" style={{ backgroundColor: "#EF4444" }}>
                    {visible.length}
                  </span>
                )}
              </span>
            </div>
          </div>
          <div className="flex gap-2 overflow-x-auto p-3 pb-safe">
            {visible.map((alert) => {
              const cfg = alertConfig[alert.type];
              return (
                <div
                  key={alert.id}
                  className="flex-shrink-0 w-56 rounded-xl border p-3 text-xs"
                  style={{ backgroundColor: cfg.bg, borderColor: cfg.border }}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: cfg.dot }} />
                    <span className="font-bold text-[9px] tracking-wider" style={{ color: cfg.dot }}>{cfg.label}</span>
                  </div>
                  <div className="font-semibold text-[#1B2A4A] leading-tight mb-1">{alert.title}</div>
                  <div className="text-gray-500 leading-relaxed text-[11px]">{alert.description}</div>
                  <button className="text-xs font-bold mt-2 underline-offset-2 hover:underline" style={{ color: cfg.dot }}>
                    {alert.action} →
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
}
