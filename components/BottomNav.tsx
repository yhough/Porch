"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";

const NAV_ITEMS = [
  {
    id: "home",
    label: "Home",
    href: "#home",
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z"
          fill={active ? "#E8513A" : "none"}
          stroke={active ? "#E8513A" : "#9CA3AF"}
          strokeWidth="2" strokeLinejoin="round" />
        <path d="M9 21V12h6v9" stroke={active ? "white" : "#9CA3AF"} strokeWidth="2" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    id: "map",
    label: "Map",
    href: "#map",
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M9 3L3 6v15l6-3 6 3 6-3V3l-6 3-6-3z"
          fill={active ? "#E8513A" : "none"}
          stroke={active ? "#E8513A" : "#9CA3AF"}
          strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        <path d="M9 3v15M15 6v15" stroke={active ? "white" : "#9CA3AF"} strokeWidth="2" />
      </svg>
    ),
  },
  {
    id: "people",
    label: "People",
    href: "#people",
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <circle cx="9" cy="7" r="4" fill={active ? "#E8513A" : "none"} stroke={active ? "#E8513A" : "#9CA3AF"} strokeWidth="2" />
        <path d="M3 21v-2a4 4 0 014-4h4a4 4 0 014 4v2" stroke={active ? "#E8513A" : "#9CA3AF"} strokeWidth="2" strokeLinecap="round" />
        <circle cx="19" cy="7" r="3" fill={active ? "#E8513A" : "none"} stroke={active ? "#E8513A" : "#9CA3AF"} strokeWidth="2" />
        <path d="M22 21v-1.5a3 3 0 00-2-2.83" stroke={active ? "#E8513A" : "#9CA3AF"} strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "money",
    label: "Money",
    href: "#money",
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <rect x="2" y="6" width="20" height="13" rx="3"
          fill={active ? "#E8513A" : "none"}
          stroke={active ? "#E8513A" : "#9CA3AF"}
          strokeWidth="2" />
        <circle cx="12" cy="12.5" r="2.5" fill={active ? "white" : "#9CA3AF"} />
        <path d="M6 12.5h.01M18 12.5h.01" stroke={active ? "white" : "#9CA3AF"} strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: "help",
    label: "Help",
    href: "#help",
    icon: (active: boolean) => (
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
        <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"
          fill={active ? "#E8513A" : "none"}
          stroke={active ? "#E8513A" : "#9CA3AF"}
          strokeWidth="2" strokeLinejoin="round" />
      </svg>
    ),
  },
];

export default function BottomNav() {
  const [active, setActive] = useState("home");

  useEffect(() => {
    const sections = NAV_ITEMS.map(n => document.getElementById(n.id)).filter(Boolean) as HTMLElement[];
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) setActive(entry.target.id);
        });
      },
      { threshold: 0.4 }
    );
    sections.forEach(s => observer.observe(s));
    return () => observer.disconnect();
  }, []);

  const handleNav = (href: string, id: string) => {
    setActive(id);
    const el = document.getElementById(id);
    el?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-[100] bg-white border-t border-gray-100"
      style={{
        boxShadow: "0 -4px 24px rgba(0,0,0,0.08)",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      <div className="max-w-lg mx-auto px-2 flex items-center justify-around h-[68px]">
        {NAV_ITEMS.map((item) => {
          const isActive = active === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNav(item.href, item.id)}
              className="flex flex-col items-center justify-center gap-1 flex-1 h-full relative transition-opacity"
              aria-label={item.label}
            >
              {isActive && (
                <motion.div
                  layoutId="nav-pill"
                  className="absolute top-2 inset-x-2 h-8 rounded-pill"
                  style={{ backgroundColor: "#FFF0ED" }}
                  transition={{ type: "spring", damping: 30, stiffness: 320 }}
                />
              )}
              <div className="relative z-10">
                {item.icon(isActive)}
              </div>
              <span
                className="relative z-10 text-[11px] font-bold hidden sm:block"
                style={{ color: isActive ? "#E8513A" : "#9CA3AF" }}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
