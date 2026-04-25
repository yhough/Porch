"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import {
  MapPin, Search, ChevronDown, Menu, X, ArrowRight,
  Calendar, MessageSquare, Vote, Clock, Users, Leaf, Bell
} from "lucide-react";
import dynamic from "next/dynamic";
import RepresentativeCard from "@/components/RepresentativeCard";
import ResourceCard from "@/components/ResourceCard";
import BudgetChart from "@/components/BudgetChart";
import AlertPanel from "@/components/AlertPanel";
import {
  representatives,
  communityResources,
  upcomingEvents,
  openComments,
  recentVotes,
  alerts,
  highlightVolunteer,
  NEIGHBORHOOD,
} from "@/lib/mockData";

// Dynamically import map to avoid SSR issues
const MapLayer = dynamic(() => import("@/components/MapLayer"), { ssr: false });

const NAV_LINKS = [
  { href: "#map", label: "Your Map" },
  { href: "#reps", label: "Representatives" },
  { href: "#budget", label: "Budget" },
  { href: "#resources", label: "Resources" },
  { href: "#happening", label: "What's Happening" },
];

const resourceCategories = [
  { key: "Homeless Shelters", icon: "🏠" },
  { key: "Food Banks", icon: "🍎" },
  { key: "Food Pantries", icon: "🍎" },
  { key: "Animal Shelters", icon: "🐾" },
  { key: "Clothing Donations", icon: "👕" },
  { key: "Children & Family", icon: "👶" },
  { key: "Mental Health", icon: "🧠" },
  { key: "Legal Aid", icon: "⚖️" },
];

function CountdownTimer({ date }: { date: Date }) {
  const [timeLeft, setTimeLeft] = useState("");
  useEffect(() => {
    const calc = () => {
      const diff = date.getTime() - Date.now();
      if (diff <= 0) { setTimeLeft("Now"); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setTimeLeft(d > 0 ? `${d}d ${h}h` : h > 0 ? `${h}h ${m}m` : `${m}m`);
    };
    calc();
    const id = setInterval(calc, 30000);
    return () => clearInterval(id);
  }, [date]);
  return <span>{timeLeft}</span>;
}

function SectionHeader({ eyebrow, title, subtitle }: { eyebrow: string; title: string; subtitle?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 16 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="mb-10"
    >
      <div className="text-xs font-bold tracking-[0.12em] uppercase text-[#E8A020] mb-2">{eyebrow}</div>
      <h2 className="text-3xl md:text-4xl font-black text-[#1B2A4A] leading-tight">{title}</h2>
      {subtitle && <p className="text-base text-gray-500 mt-3 max-w-2xl leading-relaxed">{subtitle}</p>}
    </motion.div>
  );
}

export default function Home() {
  const [address, setAddress] = useState("");
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [mobileNav, setMobileNav] = useState(false);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) return;
    setSearching(true);
    await new Promise(r => setTimeout(r, 1200));
    setSearching(false);
    setSearched(true);
    setTimeout(() => {
      document.getElementById("map")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 300);
  };

  const filteredResources = activeCategory
    ? communityResources.filter(r => r.category === activeCategory)
    : communityResources;

  return (
    <div className="min-h-screen" style={{ backgroundColor: "#FAF9F6" }}>

      {/* ── Sticky Nav ─────────────────────────────── */}
      <header className="fixed top-0 left-0 right-0 z-[100] backdrop-blur-md border-b border-white/40" style={{ backgroundColor: "rgba(250,249,246,0.88)" }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <a href="#" className="flex items-center gap-2 font-black text-xl text-[#1B2A4A]">
            <span className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-sm font-black" style={{ backgroundColor: "#E8A020" }}>P</span>
            Porch
          </a>

          <nav className="hidden md:flex items-center gap-6">
            {NAV_LINKS.map(l => (
              <a key={l.href} href={l.href} className="text-sm font-medium text-gray-600 hover:text-[#1B2A4A] transition-colors">
                {l.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-1.5 text-xs font-medium text-gray-500 border border-gray-200 rounded-full px-3 py-1.5 bg-white">
              <div className="w-1.5 h-1.5 rounded-full bg-[#4A7C59] animate-pulse" />
              {NEIGHBORHOOD.name}, Oakland
            </div>
            <button className="md:hidden p-1.5 rounded-lg hover:bg-gray-100" onClick={() => setMobileNav(v => !v)}>
              {mobileNav ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>

        {/* Mobile nav */}
        <AnimatePresence>
          {mobileNav && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-gray-100 bg-white"
            >
              {NAV_LINKS.map(l => (
                <a key={l.href} href={l.href} onClick={() => setMobileNav(false)}
                  className="block px-4 py-3 text-sm font-medium text-[#1B2A4A] hover:bg-gray-50 border-b border-gray-50 last:border-0"
                >
                  {l.label}
                </a>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* ── Hero ───────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-14">
        {/* Background map texture */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100'%3E%3Crect width='100' height='100' fill='none'/%3E%3Cpath d='M0 50h100M50 0v100' stroke='%231B2A4A' stroke-width='0.5'/%3E%3Ccircle cx='50' cy='50' r='3' fill='%231B2A4A'/%3E%3Ccircle cx='0' cy='0' r='2' fill='%231B2A4A'/%3E%3Ccircle cx='100' cy='0' r='2' fill='%231B2A4A'/%3E%3Ccircle cx='0' cy='100' r='2' fill='%231B2A4A'/%3E%3Ccircle cx='100' cy='100' r='2' fill='%231B2A4A'/%3E%3C/svg%3E")`,
            backgroundSize: "60px 60px",
          }}
        />

        {/* Gradient blobs */}
        <div className="absolute top-1/4 -left-20 w-80 h-80 rounded-full opacity-20 blur-3xl" style={{ backgroundColor: "#E8A020" }} />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 rounded-full opacity-15 blur-3xl" style={{ backgroundColor: "#1B2A4A" }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 rounded-full opacity-10 blur-3xl" style={{ backgroundColor: "#4A7C59" }} />

        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold mb-6 border"
              style={{ backgroundColor: "rgba(74,124,89,0.1)", borderColor: "rgba(74,124,89,0.2)", color: "#2E6B42" }}>
              <div className="w-1.5 h-1.5 rounded-full bg-[#4A7C59] animate-pulse" />
              Live data · Temescal, Oakland CA
            </div>

            <h1 className="text-5xl md:text-7xl font-black text-[#1B2A4A] leading-[1.04] tracking-tight mb-6">
              Your neighborhood,
              <br />
              <span style={{ color: "#E8A020" }}>finally legible.</span>
            </h1>

            <p className="text-lg md:text-xl text-gray-600 mb-10 max-w-2xl mx-auto leading-relaxed">
              Enter your address to see who represents you, where your taxes go, and how to get involved in Oakland.
            </p>

            <form onSubmit={handleSearch} className="max-w-lg mx-auto">
              <div className="relative">
                <motion.div
                  animate={searching ? { scale: [1, 1.01, 1] } : {}}
                  transition={{ duration: 0.6, repeat: searching ? Infinity : 0 }}
                  className="relative"
                >
                  <div className="absolute left-4 top-1/2 -translate-y-1/2">
                    <MapPin size={18} className="text-gray-400" />
                  </div>
                  <input
                    type="text"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    placeholder="4218 Telegraph Ave, Oakland, CA"
                    className="w-full pl-11 pr-36 py-4 text-base rounded-2xl border-2 border-transparent outline-none text-[#1B2A4A] placeholder-gray-400 transition-all duration-200"
                    style={{
                      backgroundColor: "white",
                      boxShadow: "0 4px 24px rgba(0,0,0,0.10)",
                    }}
                    onFocus={e => { e.currentTarget.style.borderColor = "#E8A020"; }}
                    onBlur={e => { e.currentTarget.style.borderColor = "transparent"; }}
                  />
                  <button
                    type="submit"
                    disabled={searching}
                    className="absolute right-2 top-1/2 -translate-y-1/2 px-5 py-2.5 rounded-xl font-bold text-white text-sm transition-all duration-150 hover:opacity-90 disabled:opacity-70 flex items-center gap-2"
                    style={{ backgroundColor: "#1B2A4A" }}
                  >
                    {searching ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Search size={14} />
                    )}
                    {searching ? "Looking up…" : "Show me"}
                  </button>
                </motion.div>
              </div>
              <p className="text-xs text-gray-400 mt-3">Try: "5205 Telegraph Ave" or any Oakland address</p>
            </form>

            {searched && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold text-white"
                style={{ backgroundColor: "#4A7C59" }}
              >
                ✓ Found your district — scroll down to explore
              </motion.div>
            )}
          </motion.div>

          {/* Stats row */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
            className="grid grid-cols-3 gap-4 mt-16 max-w-xl mx-auto"
          >
            {[
              { num: "4", label: "Representatives" },
              { num: "8", label: "Local resources" },
              { num: "$2,155", label: "Spent per resident" },
            ].map((s, i) => (
              <div key={i} className="text-center">
                <div className="text-2xl font-black text-[#1B2A4A]">{s.num}</div>
                <div className="text-xs text-gray-500 mt-0.5">{s.label}</div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-gray-400"
        >
          <span className="text-xs font-medium">Scroll to explore</span>
          <ChevronDown size={18} />
        </motion.div>
      </section>

      {/* ── Map Section ────────────────────────────── */}
      <section id="map" className="py-20 px-4 max-w-7xl mx-auto">
        <SectionHeader
          eyebrow="Your political map"
          title="See your district at a glance"
          subtitle="Toggle layers to see upcoming meetings, development permits, and community resources near you."
        />
        <MapLayer />
      </section>

      {/* ── Representatives ────────────────────────── */}
      <section id="reps" className="py-20" style={{ backgroundColor: "#F3F2EF" }}>
        <div className="max-w-7xl mx-auto px-4">
          <SectionHeader
            eyebrow="Your representatives"
            title="Who speaks for Temescal"
            subtitle="Four elected officials shape decisions that directly affect your neighborhood. Click any card to see their full voting record, donors, and contact info."
          />
          <div className="flex gap-5 overflow-x-auto pb-4 -mx-4 px-4 rep-scroll">
            {representatives.map((rep, i) => (
              <motion.div
                key={rep.id}
                initial={{ opacity: 0, x: 24 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.4, delay: i * 0.08, ease: "easeOut" }}
              >
                <RepresentativeCard rep={rep} />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Budget ─────────────────────────────────── */}
      <section id="budget" className="py-20 px-4 max-w-7xl mx-auto">
        <SectionHeader
          eyebrow="Where your money goes"
          title="Oakland's $2.1B city budget, simplified"
          subtitle="Every year, Oakland spends your tax dollars across seven major categories. See how Temescal compares to the city average — and calculate your personal contribution."
        />
        <BudgetChart />
      </section>

      {/* ── Community Resources ────────────────────── */}
      <section id="resources" className="py-20" style={{ backgroundColor: "#F3F2EF" }}>
        <div className="max-w-7xl mx-auto px-4">
          <SectionHeader
            eyebrow="Community resources"
            title="Where neighbors help neighbors"
            subtitle="Eight types of local services — from emergency shelters to legal aid — all within reach of Temescal."
          />

          {/* Volunteer highlight */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="mb-10 rounded-[12px] overflow-hidden"
            style={{ backgroundColor: "#4A7C59" }}
          >
            <div className="p-5 md:p-6 flex flex-col md:flex-row md:items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-2xl flex-shrink-0">
                🐾
              </div>
              <div className="flex-1">
                <div className="text-xs font-bold tracking-wider uppercase text-white/70 mb-1">Volunteer this weekend · Highest need nearby</div>
                <div className="text-lg font-bold text-white leading-tight">{highlightVolunteer.name}</div>
                <div className="text-sm text-white/80 mt-0.5">{highlightVolunteer.volunteerNeeds}</div>
              </div>
              <div className="flex gap-3 flex-shrink-0">
                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(highlightVolunteer.address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 rounded-xl text-sm font-semibold text-[#4A7C59] bg-white hover:bg-gray-50 transition-colors"
                >
                  Get directions
                </a>
                <button className="px-4 py-2.5 rounded-xl text-sm font-semibold border-2 border-white text-white hover:bg-white/10 transition-colors">
                  Sign up →
                </button>
              </div>
            </div>
          </motion.div>

          {/* Category filter */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-8 -mx-4 px-4">
            <button
              onClick={() => setActiveCategory(null)}
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-150"
              style={{
                backgroundColor: activeCategory === null ? "#1B2A4A" : "white",
                borderColor: activeCategory === null ? "#1B2A4A" : "#E5E7EB",
                color: activeCategory === null ? "white" : "#374151",
              }}
            >
              All
            </button>
            {resourceCategories.map(cat => (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key === activeCategory ? null : cat.key)}
                className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-150"
                style={{
                  backgroundColor: activeCategory === cat.key ? "#1B2A4A" : "white",
                  borderColor: activeCategory === cat.key ? "#1B2A4A" : "#E5E7EB",
                  color: activeCategory === cat.key ? "white" : "#374151",
                }}
              >
                {cat.icon} {cat.key}
              </button>
            ))}
          </div>

          {/* Resource grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <AnimatePresence mode="popLayout">
              {filteredResources.map((resource, i) => (
                <motion.div
                  key={resource.id}
                  layout
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.25, delay: i * 0.04, ease: "easeOut" }}
                >
                  <ResourceCard resource={resource} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* ── What's Happening Now ────────────────────── */}
      <section id="happening" className="py-20 px-4 max-w-7xl mx-auto pb-32 lg:pb-20">
        <SectionHeader
          eyebrow="What's happening now"
          title="Decisions being made this week"
          subtitle="Public meetings, open comment periods, and recent votes — translated from bureaucratic to plain English."
        />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Upcoming meetings */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Calendar size={16} className="text-[#1B2A4A]" />
              <h3 className="font-bold text-[#1B2A4A] text-base">Upcoming Meetings</h3>
            </div>
            <div className="space-y-3">
              {upcomingEvents.map((ev, i) => (
                <motion.div
                  key={ev.id}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.07, duration: 0.35 }}
                  className="bg-white rounded-[12px] border border-gray-100 p-4"
                  style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h4 className="font-bold text-[#1B2A4A] text-sm leading-tight">{ev.title}</h4>
                    <div className="flex-shrink-0 text-xs font-bold px-2 py-1 rounded-full text-white flex items-center gap-1"
                      style={{ backgroundColor: "#1B2A4A" }}>
                      <Clock size={10} />
                      <CountdownTimer date={ev.date} />
                    </div>
                  </div>
                  <p className="text-xs text-gray-600 leading-relaxed mb-2">{ev.description}</p>
                  <div className="text-xs text-gray-400 flex items-center gap-1 mb-3">
                    <MapPin size={10} />
                    {ev.location}
                  </div>
                  <div className="text-xs font-medium text-[#4A7C59]">
                    ↗ {ev.attendance}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Open comment periods */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare size={16} className="text-[#E8A020]" />
              <h3 className="font-bold text-[#1B2A4A] text-base">Open Comment Periods</h3>
            </div>
            <div className="space-y-3">
              {openComments.map((c, i) => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.07 + 0.1, duration: 0.35 }}
                  className="bg-white rounded-[12px] border border-gray-100 p-4"
                  style={{
                    boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                    borderColor: c.urgent ? "#FDE68A" : "#F3F4F6",
                  }}
                >
                  {c.urgent && (
                    <div className="text-xs font-bold text-[#B87010] mb-2 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#E8A020] pulse-amber" />
                      Closes soon
                    </div>
                  )}
                  <h4 className="font-bold text-[#1B2A4A] text-sm leading-tight mb-2">{c.title}</h4>
                  <p className="text-xs text-gray-600 leading-relaxed mb-3">{c.description}</p>
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock size={10} />
                      Deadline: <CountdownTimer date={c.deadline} />
                    </div>
                    <button
                      className="text-xs font-bold px-3 py-1.5 rounded-lg text-white transition-opacity hover:opacity-90"
                      style={{ backgroundColor: "#E8A020" }}
                    >
                      Comment →
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Recent votes */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Vote size={16} className="text-[#4A7C59]" />
              <h3 className="font-bold text-[#1B2A4A] text-base">Recent Votes Near You</h3>
            </div>
            <div className="space-y-3">
              {recentVotes.map((v, i) => (
                <motion.div
                  key={v.id}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.07 + 0.2, duration: 0.35 }}
                  className="bg-white rounded-[12px] border border-gray-100 p-4"
                  style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.05)" }}
                >
                  <div className="flex items-start gap-2 mb-2">
                    <div
                      className="w-1.5 h-full min-h-[40px] rounded-full flex-shrink-0"
                      style={{ backgroundColor: v.aligned ? "#4A7C59" : "#E06B5A" }}
                    />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-[#1B2A4A] text-sm leading-tight mb-1">{v.title}</h4>
                      <span
                        className="inline-block text-xs font-bold px-2 py-0.5 rounded-full mb-2"
                        style={{
                          backgroundColor: v.aligned ? "#EAF4ED" : "#FDECEA",
                          color: v.aligned ? "#2E6B42" : "#C0392B",
                        }}
                      >
                        {v.result}
                      </span>
                      <p className="text-xs text-gray-600 leading-relaxed mb-3">{v.description}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {v.votes.map((vv, j) => (
                          <span
                            key={j}
                            className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{
                              backgroundColor: vv.yes ? "#EAF4ED" : "#FDECEA",
                              color: vv.yes ? "#2E6B42" : "#C0392B",
                            }}
                          >
                            {vv.name} {vv.yes ? "✓" : "✗"}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-400 mt-2">{v.date}</div>
                </motion.div>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* ── Footer ─────────────────────────────────── */}
      <footer className="border-t border-gray-200 py-10 px-4" style={{ backgroundColor: "#1B2A4A" }}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg flex items-center justify-center text-[#1B2A4A] text-sm font-black bg-[#E8A020]">P</span>
            <span className="font-bold text-white text-lg">Porch</span>
            <span className="text-white/40 text-sm">· Temescal, Oakland CA</span>
          </div>
          <p className="text-white/40 text-xs text-center">
            All data is illustrative and drawn from publicly available Oakland city records, meeting agendas, and campaign finance disclosures.
          </p>
          <div className="flex items-center gap-4 text-xs text-white/40">
            <a href="#" className="hover:text-white/80 transition-colors">About</a>
            <a href="#" className="hover:text-white/80 transition-colors">Data sources</a>
            <a href="#" className="hover:text-white/80 transition-colors">Feedback</a>
          </div>
        </div>
      </footer>

      {/* ── Alert Panel ────────────────────────────── */}
      <AlertPanel />
    </div>
  );
}
