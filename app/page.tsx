"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import dynamic from "next/dynamic";
import {
  representatives,
  budgetData,
  communityResources,
  NEIGHBORHOOD,
  equityComparison,
  BOARD_VACANCIES,
  MEETINGS_2026,
} from "@/lib/mockData";

const WardMap = dynamic(() => import("@/components/WardMap"), { ssr: false });

// ─── Color tokens ─────────────────────────────────────────────────────────────
const C = {
  coral:     "#E8513A",
  yellow:    "#F5C842",
  sage:      "#4CAF82",
  sky:       "#5BA4CF",
  bg:        "#FFFDF9",
  navy:      "#1B2A4A",
  sageLight: "#EDFAF4",
} as const;

const REP_COLORS = [C.coral, C.yellow, C.sky, C.sage];

const u = (id: string, w = 800) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&auto=format&fit=crop&q=80`;

const IMGS = {
  hero:      u("1480714378408-67cf0d13bc1b", 1400),
  building:  u("1486325212027-8081e485255e"),
  council:   u("1541872703-74c5e44368f9"),
  foodbank:  u("1593113598332-cd288d649433"),
  ballot:    u("1540910419892-4a36d2c3266c"),
  volunteer: u("1559027615-cd4628902d4a", 1200),
  animals:   u("1548199973-03cce0bbc87b"),
};

// ─── Count-up animation hook ──────────────────────────────────────────────────
function useCountUp(to: number, duration = 1.4) {
  const [val, setVal] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const triggered = useInView(ref, { once: true, amount: 0.5 });
  useEffect(() => {
    if (!triggered) return;
    let raf: number;
    const start = performance.now();
    const tick = (now: number) => {
      const pct = Math.min((now - start) / (duration * 1000), 1);
      const ease = 1 - Math.pow(1 - pct, 3);
      setVal(Math.round(ease * to));
      if (pct < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [triggered, to, duration]);
  return { val, ref };
}

// ─── Animated big stat card ───────────────────────────────────────────────────
function AnimatedStat({
  value, prefix = "", suffix = "", label, color, delay = 0,
}: {
  value: number; prefix?: string; suffix?: string;
  label: string; color: string; delay?: number;
}) {
  const { val, ref } = useCountUp(value, 1.4);
  return (
    <motion.div
      initial={{ opacity: 0, y: 28, scale: 0.92 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.5, delay, type: "spring", stiffness: 200, damping: 22 }}
      className="rounded-[28px] p-6 flex flex-col gap-1.5"
      style={{ backgroundColor: color + "18", border: `2px solid ${color}28` }}
    >
      <div className="text-5xl font-black tracking-tight leading-none" style={{ color }}>
        <span ref={ref}>{prefix}{val.toLocaleString()}{suffix}</span>
      </div>
      <div className="text-xs font-bold mt-1 leading-tight" style={{ color: C.navy + "99" }}>{label}</div>
    </motion.div>
  );
}

// ─── SVG: Floating hero character ─────────────────────────────────────────────
function HeroChar() {
  return (
    <div className="float inline-block">
      <svg width="150" height="170" viewBox="0 0 150 170" fill="none" aria-hidden="true">
        <ellipse cx="75" cy="162" rx="38" ry="8" fill="rgba(0,0,0,0.12)" />
        <rect x="55" y="122" width="14" height="34" rx="7" fill="#5C3D2E" />
        <rect x="77" y="122" width="14" height="34" rx="7" fill="#5C3D2E" />
        <ellipse cx="62" cy="157" rx="12" ry="6" fill="#1a1108" />
        <ellipse cx="84" cy="157" rx="12" ry="6" fill="#1a1108" />
        <rect x="47" y="82" width="52" height="48" rx="22" fill={C.coral} />
        <motion.g
          animate={{ rotate: [-12, 18, -12] }}
          transition={{ duration: 0.75, repeat: Infinity, ease: "easeInOut" }}
          style={{ transformOrigin: "47px 92px" }}
        >
          <path d="M47 92 Q22 72 33 52" stroke="#D4956A" strokeWidth="14" strokeLinecap="round" fill="none" />
          <circle cx="31" cy="48" r="11" fill="#D4956A" />
          <path d="M26 43 Q31 36 36 43" stroke="#C4855A" strokeWidth="3.5" strokeLinecap="round" fill="none" />
        </motion.g>
        <path d="M99 92 Q120 85 116 110" stroke="#D4956A" strokeWidth="14" strokeLinecap="round" fill="none" />
        <rect x="108" y="108" width="20" height="30" rx="5" fill={C.navy} />
        <rect x="110" y="111" width="16" height="23" rx="3" fill={C.sky} />
        <circle cx="73" cy="60" r="30" fill="#D4956A" />
        <path d="M45 52 Q50 30 73 28 Q96 30 101 52" fill="#2C1810" />
        <ellipse cx="73" cy="34" rx="26" ry="13" fill="#2C1810" />
        <circle cx="63" cy="58" r="5.5" fill="white" />
        <circle cx="83" cy="58" r="5.5" fill="white" />
        <circle cx="64" cy="59" r="3" fill="#2C1810" />
        <circle cx="84" cy="59" r="3" fill="#2C1810" />
        <circle cx="65" cy="57.5" r="1.2" fill="white" />
        <circle cx="85" cy="57.5" r="1.2" fill="white" />
        <path d="M64 69 Q73 78 82 69" stroke="#2C1810" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        <circle cx="56" cy="65" r="6" fill={C.coral} opacity="0.32" />
        <circle cx="90" cy="65" r="6" fill={C.coral} opacity="0.32" />
      </svg>
    </div>
  );
}

// ─── SVG: Rep illustrated avatar ──────────────────────────────────────────────
function RepAvatar({ color, initials, size = 88 }: { color: string; initials: string; size?: number }) {
  const hairColor = initials.charCodeAt(0) % 3 !== 2 ? "#2C1810" : "#8B4513";
  return (
    <svg width={size} height={size} viewBox="0 0 90 90" fill="none" aria-hidden="true">
      <ellipse cx="45" cy="82" rx="22" ry="14" fill="white" opacity="0.88" />
      <circle cx="45" cy="48" r="20" fill="#D4956A" />
      <path d="M27 44 Q30 26 45 24 Q60 26 63 44" fill={hairColor} />
      <ellipse cx="45" cy="28" rx="18" ry="10" fill={hairColor} />
      <circle cx="38.5" cy="47" r="4" fill="white" />
      <circle cx="51.5" cy="47" r="4" fill="white" />
      <circle cx="39.2" cy="47.8" r="2.4" fill="#2C1810" />
      <circle cx="52.2" cy="47.8" r="2.4" fill="#2C1810" />
      <circle cx="39.8" cy="46.8" r="1" fill="white" />
      <circle cx="52.8" cy="46.8" r="1" fill="white" />
      <path d="M38 56 Q45 63 52 56" stroke="#2C1810" strokeWidth="2" strokeLinecap="round" fill="none" />
      <circle cx="33" cy="52" r="5" fill={color} opacity="0.28" />
      <circle cx="57" cy="52" r="5" fill={color} opacity="0.28" />
    </svg>
  );
}

// ─── SVG: Animated neighborhood ───────────────────────────────────────────────
function NeighborhoodIllustration({ triggered }: { triggered: boolean }) {
  const buildings = [
    { label: "Schools",     color: C.navy,    x: 12,  w: 68, h: 88 },
    { label: "Police/Fire", color: "#E06B5A", x: 92,  w: 54, h: 70 },
    { label: "Housing",     color: C.sage,    x: 158, w: 58, h: 74 },
    { label: "Parks",       color: C.yellow,  x: 228, w: 50, h: 54 },
    { label: "Roads",       color: "#9B59B6", x: 290, w: 54, h: 64 },
  ];
  return (
    <svg viewBox="0 0 380 112" fill="none" className="w-full max-w-lg mx-auto block" aria-hidden="true">
      <rect width="380" height="112" rx="20" fill="#EDF5FB" />
      <motion.circle cx="348" cy="24" r="18" fill={C.yellow} opacity="0.65"
        initial={{ scale: 0.5, opacity: 0 }}
        animate={triggered ? { scale: 1, opacity: 0.65 } : { scale: 0.5, opacity: 0 }}
        transition={{ duration: 0.6 }} />
      <ellipse cx="70" cy="20" rx="24" ry="11" fill="white" opacity="0.85" />
      <ellipse cx="200" cy="14" rx="20" ry="10" fill="white" opacity="0.85" />
      <rect y="97" width="380" height="15" fill={C.sage} opacity="0.22" />
      <rect y="104" width="380" height="8" fill="#9B59B6" opacity="0.18" />
      {[30, 100, 170, 240, 310].map((x) => (
        <rect key={x} x={x} y="107" width="22" height="2" rx="1" fill="white" opacity="0.45" />
      ))}
      {buildings.map((b, i) => (
        <g key={b.label}>
          <motion.rect x={b.x} y={112 - b.h - 12} width={b.w} height={b.h} rx="5" fill={b.color}
            initial={{ opacity: 0.18, y: 10 }}
            animate={triggered ? { opacity: 1, y: 0 } : { opacity: 0.18, y: 10 }}
            transition={{ duration: 0.5, delay: i * 0.14, ease: "easeOut" }} />
          {[0, 1, 2].map((row) =>
            [0, 1].map((col) => (
              <motion.rect key={`${row}-${col}`}
                x={b.x + 9 + col * 17} y={112 - b.h - 12 + 12 + row * 22}
                width="11" height="13" rx="2" fill="white"
                initial={{ opacity: 0 }}
                animate={triggered ? { opacity: 0.75 } : { opacity: 0 }}
                transition={{ duration: 0.3, delay: i * 0.14 + 0.35 + row * 0.07 }} />
            ))
          )}
          <text x={b.x + b.w / 2} y="110" textAnchor="middle" fontSize="6.5" fontWeight="700"
            fill={b.color} fontFamily="Plus Jakarta Sans, system-ui">{b.label}</text>
        </g>
      ))}
    </svg>
  );
}

// ─── SVG: Bottom nav icons ─────────────────────────────────────────────────────
function IconHome({ active }: { active: boolean }) {
  const s = active ? "white" : "#9CA3AF";
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"
        fill={active ? "white" : "none"} stroke={s} strokeWidth="2" strokeLinecap="round" />
      <path d="M9 22V12h6v10" stroke={s} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function IconMap({ active }: { active: boolean }) {
  const s = active ? "white" : "#9CA3AF";
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M1 6l7-3 8 3 7-3v15l-7 3-8-3-7 3V6z"
        fill={active ? "white" : "none"} stroke={s} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M8 3v15M16 6v15" stroke={s} strokeWidth="1.5" />
    </svg>
  );
}
function IconPeople({ active }: { active: boolean }) {
  const s = active ? "white" : "#9CA3AF";
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="9" cy="7" r="4" fill={active ? "white" : "none"} stroke={s} strokeWidth="2" />
      <path d="M2 21c0-4 3.1-7 7-7s7 3 7 7" stroke={s} strokeWidth="2" strokeLinecap="round" />
      <path d="M16 3.13a4 4 0 010 7.75M22 21c0-3.5-2.2-6.5-6-7" stroke={s} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function IconMoney({ active }: { active: boolean }) {
  const s = active ? "white" : "#9CA3AF";
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="10" fill={active ? "white" : "none"} stroke={s} strokeWidth="2" />
      <path d="M12 6v2M12 16v2" stroke={s} strokeWidth="2" strokeLinecap="round" />
      <path d="M9 10.5a3 3 0 016 0c0 4-6 4-6 8h6" stroke={s} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
function IconHelp({ active }: { active: boolean }) {
  const s = active ? "white" : "#9CA3AF";
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"
        fill={active ? "white" : "none"} stroke={s} strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

// ─── Wavy section divider ─────────────────────────────────────────────────────
function WaveDivider({ fill, flip }: { fill: string; flip?: boolean }) {
  return (
    <div style={{ lineHeight: 0, transform: flip ? "scaleY(-1)" : undefined }}>
      <svg viewBox="0 0 1200 56" preserveAspectRatio="none"
        style={{ width: "100%", height: "36px", display: "block" }}>
        <path d="M0,28 C200,56 400,0 600,28 C800,56 1000,0 1200,28 L1200,56 L0,56 Z" fill={fill} />
      </svg>
    </div>
  );
}

// ─── Static content ────────────────────────────────────────────────────────────
const URGENT_CARDS = [
  { id: "u1", photo: IMGS.council,  badge: { text: "Today 4:30pm", bg: C.coral },
    title: "Town Board Study Session — Green New Deal annual report", cta: "Join Zoom →" },
  { id: "u2", photo: IMGS.building, badge: { text: "Comment open", bg: C.sky },
    title: "Subdivision rules under review — COC wants your input", cta: "Weigh in →" },
  { id: "u3", photo: IMGS.volunteer, badge: { text: "3 seats open", bg: C.yellow },
    title: "Planning Board, ZBA & Conservation Board need volunteers", cta: "Apply →" },
  { id: "u4", photo: IMGS.foodbank, badge: { text: "This weekend", bg: C.sage },
    title: "Foodnet needs food sorters and drivers — flexible hours", cta: "Sign up →" },
];

const VOL_TILES = [
  { label: "Foodnet",           shifts: "2 shifts open this weekend", photo: IMGS.foodbank, color: C.sage, catKey: "Food" },
  { label: "Tompkins SPCA",     shifts: "Foster families urgently needed", photo: IMGS.animals, color: C.sky, catKey: "Animal" },
];

const PULSE_ITEMS = [
  { id: "p1", icon: "⚡", text: "Tompkins Green Energy Network launched — Ithaca now has community clean energy", time: "Q1 2026",  color: C.sage },
  { id: "p2", icon: "🗳",  text: "Gideon Casper appointed to Planning Board — term through Dec 2029",              time: "Today",   color: C.coral },
  { id: "p3", icon: "🌿", text: "Town Board passed Deconstruction Resolution — buildings get reused, not bulldozed", time: "Mar 2026", color: C.yellow },
  { id: "p4", icon: "🛤",  text: "Engineering firm hired to extend South Hill Rec Way from Burns Rd to Banks Rd",   time: "Jan 2026", color: C.sky },
  { id: "p5", icon: "🏗",  text: "Net-zero energy code now required for all new construction in Ithaca",           time: "2025",     color: "#9B59B6" },
];

const ANON_COLORS = [C.coral, C.yellow, C.sage, C.sky, C.navy, "#9B59B6", "#E67E22"];

function roleLabel(jType: string) {
  if (jType === "City Council")   return "Decides what gets built near you";
  if (jType === "State Assembly") return "Controls state housing laws";
  if (jType === "U.S. Senate")    return "Controls federal funding";
  return "Runs your kids' schools";
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function Home() {
  const [address,   setAddress]   = useState("");
  const [searching, setSearching] = useState(false);
  const [searched,  setSearched]  = useState(false);
  const [activeNav, setActiveNav] = useState<"home"|"map"|"people"|"money"|"help">("home");
  const [openRepId, setOpenRepId] = useState<string | null>(null);
  const [openVolId, setOpenVolId] = useState<string | null>(null);
  const [rent,      setRent]      = useState(2500);
  const [liked,     setLiked]     = useState<Record<string, boolean>>({});

  const budgetRef       = useRef<HTMLElement>(null);
  const budgetTriggered = useInView(budgetRef, { once: true, amount: 0.2 });

  const openRep = representatives.find((r) => r.id === openRepId) ?? null;
  const openVol = communityResources.find((r) => r.id === openVolId) ?? null;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) return;
    setSearching(true);
    await new Promise((r) => setTimeout(r, 1400));
    setSearching(false);
    setSearched(true);
    setTimeout(() => document.getElementById("urgent")?.scrollIntoView({ behavior: "smooth" }), 300);
  };

  const annual    = rent * 12 * 0.012;
  const schoolTax = Math.round(annual * 0.31);
  const roadTax   = Math.round(annual * 0.09);
  const parkTax   = Math.round(annual * 0.08);

  // Suppress unused import warnings
  void budgetData; void equityComparison; void MEETINGS_2026;

  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: C.bg, paddingBottom: "90px" }}>

      {/* ══ SECTION 1: HERO ══════════════════════════════════════════════ */}
      <section id="home" className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0">
          <img src={IMGS.hero} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0"
            style={{ background: "linear-gradient(155deg,rgba(232,81,58,0.55) 0%,rgba(232,81,58,0.3) 45%,rgba(27,42,74,0.52) 100%)" }} />
        </div>

        <div className="relative z-10 text-center px-6 max-w-xl mx-auto w-full">
          <motion.div initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, ease: "easeOut" }}>
            <div className="flex justify-center mb-5"><HeroChar /></div>
            <h1 className="font-extrabold text-white leading-tight mb-4"
              style={{ fontSize: "clamp(36px,6vw,52px)", textShadow: "0 2px 24px rgba(0,0,0,0.28)" }}>
              Your neighborhood has a story.
              <br /><span style={{ color: C.yellow }}>Find out what it is.</span>
            </h1>
            <p className="text-lg mb-8 font-medium" style={{ color: "rgba(255,255,255,0.87)" }}>
              Type your Ithaca address to see your ward, who represents you, and where the money goes.
            </p>

            <form onSubmit={handleSearch} className="mb-6">
              <div className="flex rounded-full overflow-hidden" style={{ boxShadow: "0 8px 40px rgba(0,0,0,0.25)" }}>
                <input type="text" value={address} onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. 301 W Court St, Ithaca"
                  className="flex-1 px-6 text-base outline-none"
                  style={{ height: "56px", color: C.navy, backgroundColor: "white", minWidth: 0 }} />
                <button type="submit" disabled={searching}
                  className="flex-shrink-0 px-6 font-bold text-white hover:opacity-90 rounded-full"
                  style={{ backgroundColor: C.coral, height: "56px", fontSize: "15px" }}>
                  {searching
                    ? <span className="flex items-center gap-2">
                        <span className="inline-block w-4 h-4 rounded-full border-2 border-t-white animate-spin"
                          style={{ borderColor: "rgba(255,255,255,0.35)", borderTopColor: "white" }} />
                        Searching…
                      </span>
                    : "Show me →"}
                </button>
              </div>
            </form>

            <div className="flex flex-wrap gap-3 justify-center">
              {["🏛 4 officials", "💰 Your taxes", "🗺 5 wards"].map((t) => (
                <div key={t} className="px-4 py-2 rounded-full text-sm font-semibold"
                  style={{ backgroundColor: "rgba(255,255,255,0.2)", color: "white",
                           backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.3)" }}>
                  {t}
                </div>
              ))}
            </div>

            {searched && (
              <motion.div initial={{ opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }}
                className="mt-5 inline-flex items-center gap-2 px-5 py-3 rounded-full font-bold text-white"
                style={{ backgroundColor: C.sage }}>
                ✓ Found your neighborhood — scroll to explore
              </motion.div>
            )}
          </motion.div>
        </div>

        <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5"
          style={{ color: "rgba(255,255,255,0.7)" }}>
          <span className="text-xs font-semibold">Scroll to explore</span>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M4 6l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.div>
      </section>

      {/* ══ WARD MAP ═════════════════════════════════════════════════════ */}
      <section id="map" className="py-14 px-6">
        <div className="mb-6">
          <motion.h2 initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.4 }}
            className="text-3xl font-extrabold" style={{ color: C.navy }}>
            Your ward. Your voice. 🗺
          </motion.h2>
          <div className="mt-2 w-14 h-1.5 rounded-full" style={{ backgroundColor: C.coral }} />
          <p className="mt-2 text-base font-medium" style={{ color: "#6B7280" }}>
            Ithaca has 5 wards and 15 election districts. Tap yours.
          </p>
        </div>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.5 }}
          className="max-w-xl mx-auto"
          style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.08)", borderRadius: "24px" }}>
          <WardMap />
        </motion.div>
      </section>

      {/* ══ SECTION 2: URGENT CARDS ══════════════════════════════════════ */}
      <section id="urgent" className="py-14">
        <div className="px-6 mb-7">
          <motion.h2 initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.4 }}
            className="text-3xl font-extrabold" style={{ color: C.navy }}>
            Right now, near you 📍
          </motion.h2>
          <div className="mt-2 w-14 h-1.5 rounded-full" style={{ backgroundColor: C.coral }} />
        </div>

        <div className="flex gap-4 overflow-x-auto no-scrollbar pl-6 pr-6 pb-3">
          {URGENT_CARDS.map((card, i) => (
            <motion.div key={card.id}
              initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ delay: i * 0.09, duration: 0.4, ease: "easeOut" }}
              whileHover={{ y: -6, transition: { duration: 0.18 } }}
              className="relative flex-shrink-0 rounded-[24px] overflow-hidden cursor-pointer"
              style={{ width: "300px", height: "380px", boxShadow: "0 4px 20px rgba(0,0,0,0.11)" }}>
              <img src={card.photo} alt="" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0"
                style={{ background: "linear-gradient(to top,rgba(0,0,0,0.85) 0%,rgba(0,0,0,0.15) 60%,transparent 100%)" }} />
              <div className="absolute top-4 left-4">
                <span className="px-3 py-1.5 rounded-full text-xs font-bold text-white"
                  style={{ backgroundColor: card.badge.bg }}>{card.badge.text}</span>
              </div>
              <div className="absolute bottom-0 left-0 right-0 p-5">
                <h3 className="text-lg font-extrabold text-white leading-snug mb-4">{card.title}</h3>
                <button className="px-5 py-2.5 rounded-full text-sm font-bold transition-transform hover:scale-105"
                  style={{ backgroundColor: "white", color: C.navy }}>{card.cta}</button>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ══ SECTION 3: REPRESENTATIVES ═══════════════════════════════════ */}
      <WaveDivider fill="#FFF0ED" />
      <section id="people" className="py-14" style={{ backgroundColor: "#FFF0ED" }}>
        <div className="px-6 mb-2">
          <motion.h2 initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.4 }}
            className="text-3xl font-extrabold" style={{ color: C.navy }}>
            Who runs things around here 👥
          </motion.h2>
          <div className="mt-2 w-14 h-1.5 rounded-full" style={{ backgroundColor: C.coral }} />
          <p className="mt-2 text-base font-medium" style={{ color: "#9B7060" }}>
            Most people have never heard of them. That's kind of the problem.
          </p>
        </div>

        <div className="flex gap-4 overflow-x-auto no-scrollbar pl-6 pr-6 pb-3 mt-8">
          {representatives.map((rep, i) => {
            const color = REP_COLORS[i % REP_COLORS.length];
            return (
              <motion.div key={rep.id}
                initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: i * 0.1, type: "spring", stiffness: 240, damping: 22 }}
                whileHover={{ y: -6, transition: { duration: 0.18 } }}
                onClick={() => setOpenRepId(rep.id)}
                className="flex-shrink-0 cursor-pointer" style={{ width: "240px" }}>
                <div className="rounded-[24px] overflow-hidden"
                  style={{ backgroundColor: "white", boxShadow: "0 4px 24px rgba(0,0,0,0.09)" }}>
                  {rep.donorAlert && (
                    <div className="px-3 py-1.5 text-[11px] font-bold flex items-center gap-1"
                      style={{ backgroundColor: "#FEF3F2", color: "#B91C1C" }}>
                      ⚠ {rep.donorAlert}
                    </div>
                  )}
                  <div className="flex items-center justify-center" style={{ backgroundColor: color, height: "130px" }}>
                    <RepAvatar color={color} initials={rep.initials} size={84} />
                  </div>
                  <div className="p-5">
                    <div className="text-base font-extrabold leading-tight" style={{ color: C.navy }}>{rep.name}</div>
                    <div className="text-xs mt-1 font-medium" style={{ color: "#6B7280" }}>{roleLabel(rep.jurisdictionType)}</div>
                    {/* Vibe dots — pure visual, no labels */}
                    <div className="flex gap-2 mt-4">
                      {rep.votes.slice(0, 3).map((v, vi) => (
                        <motion.div key={vi}
                          initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }}
                          transition={{ delay: i * 0.1 + vi * 0.07, type: "spring", stiffness: 400 }}
                          className="w-5 h-5 rounded-full" title={v.label}
                          style={{ backgroundColor: v.aligned ? C.sage : C.coral }} />
                      ))}
                    </div>
                    <button className="mt-4 w-full py-3 rounded-full text-sm font-bold text-white hover:opacity-90"
                      style={{ backgroundColor: color }}>
                      See record →
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>
      <WaveDivider fill="#FFF0ED" flip />

      {/* ══ SECTION 4: BUDGET ════════════════════════════════════════════ */}
      <section id="money" className="py-14 px-6" ref={budgetRef}>
        <motion.h2 initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.4 }}
          className="text-3xl font-extrabold mb-2" style={{ color: C.navy }}>
          Your money. Their choices. 💸
        </motion.h2>
        <div className="mb-8 w-14 h-1.5 rounded-full" style={{ backgroundColor: C.coral }} />

        <div className="mb-10">
          <NeighborhoodIllustration triggered={budgetTriggered} />
        </div>

        {/* Big animated stat reveals — Ithaca FY2024 ~$75M / ~30k residents */}
        <div className="grid grid-cols-2 gap-4 max-w-xl mx-auto mb-10">
          <AnimatedStat value={1580} prefix="$" label="Public Safety / resident"  color="#E06B5A"   delay={0} />
          <AnimatedStat value={479}  prefix="$" label="Parks & Rec / resident"    color={C.sage}    delay={0.1} />
          <AnimatedStat value={862}  prefix="$" label="Public Works / resident"   color={C.sky}     delay={0.2} />
          <AnimatedStat value={383}  prefix="$" label="Community Dev / resident"  color="#9B59B6"   delay={0.3} />
        </div>

        {/* Rent calculator */}
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.5 }}
          className="rounded-[28px] p-6 max-w-xl mx-auto"
          style={{ backgroundColor: "white", boxShadow: "0 4px 20px rgba(0,0,0,0.07)" }}>
          <div className="text-xl font-extrabold mb-1" style={{ color: C.navy }}>What do YOU fund?</div>
          <div className="flex justify-between items-center mb-3">
            <span className="text-sm font-semibold" style={{ color: "#6B7280" }}>Monthly rent</span>
            <span className="text-2xl font-extrabold" style={{ color: C.coral }}>${rent.toLocaleString()}</span>
          </div>
          <input type="range" min="500" max="6000" step="100" value={rent}
            onChange={(e) => setRent(Number(e.target.value))} />
          <div className="mt-5 grid grid-cols-3 gap-3">
            {[
              { label: "Schools", amount: schoolTax, color: C.navy },
              { label: "Roads",   amount: roadTax,   color: "#9B59B6" },
              { label: "Parks 😬",amount: parkTax,   color: C.coral },
            ].map((row) => (
              <div key={row.label} className="rounded-[16px] p-3 text-center"
                style={{ backgroundColor: row.color + "12" }}>
                <div className="text-2xl font-extrabold" style={{ color: row.color }}>${row.amount}</div>
                <div className="text-[11px] font-semibold mt-0.5" style={{ color: "#6B7280" }}>{row.label}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ══ SECTION 5: VOLUNTEER ═════════════════════════════════════════ */}
      <WaveDivider fill="#EDFAF4" />
      <section id="help" className="py-14" style={{ backgroundColor: "#EDFAF4" }}>
        <div className="px-6 mb-6">
          <motion.h2 initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.4 }}
            className="text-3xl font-extrabold" style={{ color: C.navy }}>
            Your neighbors need you. 🤝
          </motion.h2>
          <div className="mt-2 w-14 h-1.5 rounded-full" style={{ backgroundColor: C.sage }} />
        </div>

        <div className="mx-6 mb-5">
          <motion.div initial={{ opacity: 0, scale: 0.96 }} whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }} transition={{ duration: 0.45 }}
            className="relative rounded-[24px] overflow-hidden"
            style={{ minHeight: "260px", boxShadow: "0 4px 20px rgba(0,0,0,0.10)" }}>
            <img src={IMGS.volunteer} alt="" className="absolute inset-0 w-full h-full object-cover" />
            <div className="absolute inset-0"
              style={{ background: "linear-gradient(155deg,rgba(76,175,130,0.82) 0%,rgba(76,175,130,0.55) 100%)" }} />
            <div className="relative z-10 p-6 flex flex-col justify-end" style={{ minHeight: "260px" }}>
              <div className="text-xs font-bold mb-1" style={{ color: "rgba(255,255,255,0.75)" }}>
                Most urgent this weekend
              </div>
              <h3 className="text-2xl font-extrabold text-white leading-tight mb-3">
                Foodnet needs 8 more volunteers this Saturday
              </h3>
              <div className="flex items-center gap-4">
                <button className="px-6 py-3 rounded-full font-bold hover:scale-105 transition-transform"
                  style={{ backgroundColor: "white", color: "#2E7D52" }}>
                  I'll be there →
                </button>
                <span className="text-xs" style={{ color: "rgba(255,255,255,0.7)" }}>
                  8,000+ Tompkins residents served each year
                </span>
              </div>
            </div>
          </motion.div>
        </div>

        <div className="px-6 grid grid-cols-2 gap-4">
          {VOL_TILES.map((tile, i) => {
            const res = communityResources.find((r) => r.category.toLowerCase().includes(tile.catKey.toLowerCase()));
            return (
              <motion.div key={tile.label}
                initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, type: "spring", stiffness: 200, damping: 22 }}
                whileHover={{ scale: 1.04, transition: { duration: 0.15 } }}
                onClick={() => res && setOpenVolId(res.id)}
                className="relative rounded-[20px] overflow-hidden cursor-pointer"
                style={{ height: "180px" }}>
                <img src={tile.photo} alt="" className="absolute inset-0 w-full h-full object-cover" />
                <div className="absolute inset-0"
                  style={{ background: `linear-gradient(to top,${tile.color}CC 0%,${tile.color}66 55%,${tile.color}22 100%)` }} />
                <div className="relative z-10 p-4 h-full flex flex-col justify-end">
                  <div className="text-base font-extrabold text-white">{tile.label}</div>
                  <div className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.82)" }}>{tile.shifts}</div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Board vacancies sub-section */}
        <div className="px-6 mt-8">
          <h3 className="text-xl font-extrabold mb-1" style={{ color: C.navy }}>
            Serve on a board 🏛
          </h3>
          <p className="text-sm mb-4" style={{ color: "#6B7280" }}>
            Real decisions. Real impact. No experience required.
          </p>
          <div className="space-y-3">
            {BOARD_VACANCIES.map((v, i) => (
              <motion.div key={v.id}
                initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, type: "spring", stiffness: 200, damping: 22 }}
                className="bg-white rounded-[20px] p-5 flex gap-4 items-start"
                style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }}>
                <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-extrabold text-sm text-white"
                  style={{ backgroundColor: v.urgency === "open" ? C.coral : C.sage }}>
                  {v.urgency === "open" ? "!" : "+"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-extrabold text-base" style={{ color: C.navy }}>{v.board}</span>
                    {v.stipend && (
                      <span className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: C.yellow + "30", color: "#92720A" }}>
                        Paid stipend
                      </span>
                    )}
                  </div>
                  <p className="text-sm leading-snug mb-2" style={{ color: "#6B7280" }}>{v.description}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xs font-medium" style={{ color: "#9CA3AF" }}>🕐 {v.meetingSchedule}</span>
                    <span className="text-xs font-medium" style={{ color: "#9CA3AF" }}>📍 {v.residencyRequired}</span>
                  </div>
                  <div className="mt-3">
                    <button className="text-sm font-bold px-4 py-2 rounded-full transition-transform hover:scale-105"
                      style={{ backgroundColor: C.coral, color: "white" }}>
                      Apply — {v.contact.split("·")[0].trim()}
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
      <WaveDivider fill="#EDFAF4" flip />

      {/* ══ SECTION 6: PULSE ═════════════════════════════════════════════ */}
      <section id="pulse" className="py-14 px-6">
        <motion.h2 initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.4 }}
          className="text-3xl font-extrabold mb-2" style={{ color: C.navy }}>
          {NEIGHBORHOOD.name} is waking up 🌱
        </motion.h2>
        <div className="mb-8 w-14 h-1.5 rounded-full" style={{ backgroundColor: C.sage }} />

        {/* Civic health ring */}
        <div className="flex flex-col items-center mb-10">
          <div className="relative" style={{ width: "172px", height: "172px" }}>
            <svg width="172" height="172" viewBox="0 0 172 172" aria-label="Civic health: 62 out of 100">
              <circle cx="86" cy="86" r="70" fill="none" stroke="#F3F4F6" strokeWidth="14" />
              <motion.circle cx="86" cy="86" r="70" fill="none" stroke={C.sage} strokeWidth="14"
                strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 70}`}
                transform="rotate(-90 86 86)"
                initial={{ strokeDashoffset: 2 * Math.PI * 70 }}
                whileInView={{ strokeDashoffset: 2 * Math.PI * 70 * (1 - 0.62) }}
                viewport={{ once: true }}
                transition={{ duration: 1.6, ease: "easeOut", delay: 0.3 }} />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-extrabold" style={{ color: C.navy }}>62</span>
              <span className="text-sm font-semibold" style={{ color: "#6B7280" }}>Getting there</span>
            </div>
          </div>
          <div className="flex -space-x-2 mt-4">
            {ANON_COLORS.map((color, i) => (
              <motion.div key={i} initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }}
                transition={{ delay: i * 0.07 + 0.5, type: "spring", stiffness: 280 }}
                className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-[10px] font-bold text-white"
                style={{ backgroundColor: color }}>
                {String.fromCharCode(65 + i)}
              </motion.div>
            ))}
          </div>
          <p className="text-xs mt-2 font-medium" style={{ color: "#9CA3AF" }}>
            Civic health · {NEIGHBORHOOD.name}
          </p>
        </div>

        {/* Compact notification chips */}
        <div className="space-y-2.5 max-w-lg mx-auto">
          {PULSE_ITEMS.map((item, i) => (
            <motion.div key={item.id}
              initial={{ opacity: 0, x: -16 }} whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07, duration: 0.35, ease: "easeOut" }}
              className="flex items-center gap-3 px-4 py-3.5 rounded-[16px] bg-white"
              style={{ boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
              <div className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-base"
                style={{ backgroundColor: item.color + "18" }}>
                {item.icon}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium leading-snug truncate" style={{ color: C.navy }}>{item.text}</p>
                <p className="text-[11px] mt-0.5" style={{ color: "#9CA3AF" }}>{item.time}</p>
              </div>
              <motion.button whileHover={{ scale: 1.3 }} whileTap={{ scale: 0.8 }}
                onClick={() => setLiked((p) => ({ ...p, [item.id]: !p[item.id] }))}
                className="flex-shrink-0" aria-label="React">
                <svg width="18" height="18" viewBox="0 0 20 20" fill="none">
                  <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                    fill={liked[item.id] ? C.coral : "none"}
                    stroke={liked[item.id] ? C.coral : "#D1D5DB"} strokeWidth="1.5" />
                </svg>
              </motion.button>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ══ REP BOTTOM SHEET ═════════════════════════════════════════════ */}
      <AnimatePresence>
        {openRepId && openRep && (
          <>
            <motion.div key="rep-bg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setOpenRepId(null)} className="fixed inset-0 z-40"
              style={{ backgroundColor: "rgba(0,0,0,0.48)" }} />
            <motion.div key="rep-sheet"
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 32, stiffness: 320 }}
              className="fixed bottom-0 left-0 right-0 z-50 overflow-y-auto rounded-t-[32px]"
              style={{ backgroundColor: C.bg, maxHeight: "90vh", paddingBottom: "env(safe-area-inset-bottom,24px)" }}>
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 rounded-full bg-gray-200" />
              </div>
              <div className="px-6 pb-4">
                <div className="flex items-start gap-4">
                  <RepAvatar
                    color={REP_COLORS[representatives.findIndex((r) => r.id === openRepId) % REP_COLORS.length]}
                    initials={openRep.initials} size={68} />
                  <div className="flex-1">
                    <h3 className="text-xl font-extrabold" style={{ color: C.navy }}>{openRep.name}</h3>
                    <p className="text-sm" style={{ color: "#6B7280" }}>{openRep.role}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="px-3 py-1 rounded-full text-xs font-bold"
                        style={{ backgroundColor: C.sageLight, color: "#2E7D52" }}>
                        {openRep.attendance}% attendance
                      </span>
                      {openRep.donorAlert && (
                        <span className="px-3 py-1 rounded-full text-xs font-bold"
                          style={{ backgroundColor: "#FEF3F2", color: "#B91C1C" }}>
                          ⚠ {openRep.donorAlert}
                        </span>
                      )}
                    </div>
                  </div>
                  <button onClick={() => setOpenRepId(null)}
                    className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: "#F3F4F6" }} aria-label="Close">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M1 1l12 12M13 1L1 13" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
              </div>
              <div style={{ height: 1, backgroundColor: "#F3F4F6" }} />
              <div className="px-6 py-5">
                <h4 className="text-base font-extrabold mb-4" style={{ color: C.navy }}>Voting history</h4>
                <div className="space-y-4">
                  {openRep.fullVotes.map((v, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className="w-3 h-3 rounded-full flex-shrink-0 mt-1"
                        style={{ backgroundColor: v.aligned ? C.sage : C.coral }} />
                      <div>
                        <p className="text-sm font-semibold" style={{ color: C.navy }}>{v.description}</p>
                        <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>{v.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ height: 1, backgroundColor: "#F3F4F6" }} />
              <div className="px-6 py-5">
                <h4 className="text-base font-extrabold mb-4" style={{ color: C.navy }}>Who funds their campaigns</h4>
                <div className="space-y-3">
                  {openRep.topDonors.map((d, i) => {
                    const pct = (d.amount / Math.max(...openRep.topDonors.map((x) => x.amount))) * 100;
                    return (
                      <div key={i}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="font-medium" style={{ color: "#374151" }}>{d.name}</span>
                          <span className="font-bold" style={{ color: C.navy }}>${d.amount.toLocaleString()}</span>
                        </div>
                        <div className="h-2 rounded-full" style={{ backgroundColor: "#F3F4F6" }}>
                          <motion.div className="h-full rounded-full" initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 0.65, delay: i * 0.1 }}
                            style={{ backgroundColor: C.coral }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
              <div className="px-6 pb-8 pt-2">
                <a href={`mailto:${openRep.email}`}
                  className="block w-full py-4 rounded-full font-bold text-white text-center hover:opacity-90"
                  style={{ backgroundColor: C.coral }}>
                  📧 Contact them
                </a>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ══ VOLUNTEER BOTTOM SHEET ═══════════════════════════════════════ */}
      <AnimatePresence>
        {openVolId && openVol && (
          <>
            <motion.div key="vol-bg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setOpenVolId(null)} className="fixed inset-0 z-40"
              style={{ backgroundColor: "rgba(0,0,0,0.48)" }} />
            <motion.div key="vol-sheet"
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 32, stiffness: 320 }}
              className="fixed bottom-0 left-0 right-0 z-50 overflow-y-auto rounded-t-[32px]"
              style={{ backgroundColor: C.bg, maxHeight: "80vh", paddingBottom: "env(safe-area-inset-bottom,24px)" }}>
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 rounded-full bg-gray-200" />
              </div>
              <div className="px-6 py-3">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div>
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-bold mb-2"
                      style={{ backgroundColor: openVol.hours.isOpen ? C.sageLight : "#FEF3F2",
                               color: openVol.hours.isOpen ? "#2E7D52" : "#B91C1C" }}>
                      {openVol.hours.isOpen ? "Open now" : "Closed"} · {openVol.hours.today}
                    </span>
                    <h3 className="text-xl font-extrabold" style={{ color: C.navy }}>{openVol.name}</h3>
                    <p className="text-sm mt-1" style={{ color: "#6B7280" }}>
                      {openVol.address} · {openVol.distance}
                    </p>
                  </div>
                  <button onClick={() => setOpenVolId(null)}
                    className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: "#F3F4F6" }} aria-label="Close">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M1 1l12 12M13 1L1 13" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
                <p className="text-sm leading-relaxed p-4 rounded-[16px] mb-4"
                  style={{ backgroundColor: "#F9FAFB", color: "#374151" }}>
                  {openVol.volunteerDesc}
                </p>
                <div className="grid grid-cols-2 gap-3 mb-5">
                  <div className="p-3 rounded-[12px]" style={{ backgroundColor: C.sageLight }}>
                    <div className="text-[11px] font-bold mb-0.5" style={{ color: "#2E7D52" }}>Time needed</div>
                    <div className="text-sm font-semibold" style={{ color: C.navy }}>{openVol.timeCommitment}</div>
                  </div>
                  <div className="p-3 rounded-[12px]" style={{ backgroundColor: "#FFF8F6" }}>
                    <div className="text-[11px] font-bold mb-0.5" style={{ color: "#6B7280" }}>Training</div>
                    <div className="text-sm font-semibold" style={{ color: C.navy }}>
                      {openVol.trainingRequired ? "Required (provided)" : "Not required"}
                    </div>
                  </div>
                </div>
                <a href={openVol.signupUrl}
                  className="block mb-3 w-full py-4 rounded-full font-bold text-white text-center hover:opacity-90"
                  style={{ backgroundColor: C.sage }}>
                  Sign up to volunteer →
                </a>
                <a href={`tel:${openVol.phone}`}
                  className="block w-full py-3 rounded-full font-semibold text-center"
                  style={{ backgroundColor: "#F3F4F6", color: C.navy }}>
                  {openVol.phone}
                </a>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ══ BOTTOM NAV ═══════════════════════════════════════════════════ */}
      <nav className="fixed bottom-0 left-0 right-0 z-30"
        style={{ backgroundColor: "white", boxShadow: "0 -4px 24px rgba(0,0,0,0.08)",
                 borderTopLeftRadius: "28px", borderTopRightRadius: "28px",
                 paddingBottom: "env(safe-area-inset-bottom,0px)" }}>
        <div className="flex justify-around items-center px-4 py-3">
          {(
            [
              { id: "home",   label: "Home",   href: "#home",   Icon: IconHome },
              { id: "map",    label: "Map",    href: "#map",    Icon: IconMap },
              { id: "people", label: "People", href: "#people", Icon: IconPeople },
              { id: "money",  label: "Money",  href: "#money",  Icon: IconMoney },
              { id: "help",   label: "Help",   href: "#help",   Icon: IconHelp },
            ] as { id: "home"|"map"|"people"|"money"|"help"; label: string; href: string; Icon: (p: { active: boolean }) => React.JSX.Element }[]
          ).map((item) => {
            const isActive = activeNav === item.id;
            return (
              <a key={item.id} href={item.href} onClick={() => setActiveNav(item.id)}
                className="flex flex-col items-center gap-0.5" aria-label={item.label}>
                <motion.div whileTap={{ scale: 0.8 }}
                  transition={{ type: "spring", stiffness: 400, damping: 18 }}
                  className="w-12 h-12 rounded-full flex items-center justify-center transition-colors duration-200"
                  style={{ backgroundColor: isActive ? C.coral : "transparent" }}>
                  <item.Icon active={isActive} />
                </motion.div>
                <span className="text-[11px] font-semibold hidden sm:block"
                  style={{ color: isActive ? C.coral : "#9CA3AF" }}>{item.label}</span>
              </a>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
