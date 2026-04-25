"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence, useInView } from "framer-motion";
import { signOut, useSession } from "next-auth/react";
import { ISSUES, PARTIES } from "@/lib/onboardingData";
import {
  getTaxBreakdown, repIsAligned, placeMatchedIssues, cardRelevanceScore,
  inferRepIssues, type TaxBreakdown,
} from "@/lib/personalization";
import { detectCity, CITY_CONFIGS, type CityId } from "@/lib/cities";
import dynamic from "next/dynamic";
import {
  NEIGHBORHOOD,
  BOARD_VACANCIES,
  localOfficials,
} from "@/lib/mockData";

// ─── Live-data types ──────────────────────────────────────────────────────────
interface LiveRep {
  id: string;
  name: string;
  role: string;
  roleLabel: string;
  party: string;
  phone: string | null;
  email: string | null;
  url: string | null;
  photoUrl: string | null;
  level: string;
  initials: string;
  color: string;
  office: string;
  recentBills?: Array<{
    id: string; identifier: string; title: string;
    updatedAt: string; status: string; subjects: string[];
  }>;
}

interface LivePlace {
  id: string;
  name: string;
  category: string;
  icon: string;
  address: string;
  rating: number | null;
  isOpen: boolean | null;
  lat: number;
  lng: number;
  distanceMi: string;
}

/** Row from USASpending `spending_by_award` (field keys match API). */
interface FederalAwardRow {
  internal_id?: number;
  "Award ID"?: string;
  "Recipient Name"?: string;
  "Award Amount"?: number;
  "Awarding Agency"?: string;
  "Awarding Sub Agency"?: string;
  "Start Date"?: string;
  "End Date"?: string;
  Description?: string;
  "Award Type"?: string;
  generated_internal_id?: string;
}

// ─── Permit / civic-action types ─────────────────────────────────────────────
interface PermitComment {
  id: string;
  author: string;
  neighborhood: string;
  text: string;
  time: string;
  isNew?: boolean;
}

interface PermitData {
  id: string;
  address: string;
  city: string;
  type: string;
  board: string;
  title: string;
  distanceBlocks: number;
  plainEnglish: string;
  whyItMatters: Record<string, string>;
  commentDeadline: string;
  voteDate: string;
  officialUrl: string;
  totalCommentCount: number;
  comments: PermitComment[];
  distanceMi?: number;
}

/** Mapbox Geocoding API feature (subset). */
interface MapboxSuggestFeature {
  id: string;
  place_name: string;
  center: [number, number];
  place_type?: string[];
}

/** Normalized ACS 5-year profile from `/api/census`. */
interface CensusSnapshot {
  name: string;
  population: number | null;
  medianHouseholdIncome: number | null;
  medianHomeValue: number | null;
  medianGrossRent: number | null;
  ownerOccupied: number | null;
  renterOccupied: number | null;
  renterSharePercent: number | null;
  vintage: number;
  dataset: string;
}

const WardMap = dynamic(() => import("@/components/WardMap"), { ssr: false });
const NycDistrictMap = dynamic(() => import("@/components/NycDistrictMap"), { ssr: false });


// ─── Color tokens ─────────────────────────────────────────────────────────────
const C = {
  bg:        "#F7F4EE",  // warm off-white
  navy:      "#1C2534",  // deep dark — primary text
  coral:     "#5A8060",  // dark sage — primary CTAs / action (was coral red)
  sage:      "#8BAF92",  // medium sage — soft accents, tags
  sky:       "#7B9BAF",  // muted blue — info accents
  yellow:    "#C4A878",  // warm amber — highlight word, alerts
  muted:     "#6B7A8D",  // muted text — nav links, subtitles
  faint:     "#8A9AB0",  // faint text — labels, placeholders
  border:    "#E5DFD5",  // all borders and dividers
  warmGray:  "#C8C4BC",  // separators
  footer:    "#3A4050",  // footer background
  sageLight: "#EEF4F0",  // light sage background tint
} as const;


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

function FederalAwardCardInner({
  stripe,
  amount,
  recipient,
  agency,
  subAgency,
  desc,
  awardType,
}: {
  stripe: string;
  amount?: number;
  recipient: string;
  agency: string;
  subAgency?: string;
  desc?: string;
  awardType?: string;
}) {
  return (
    <div className="flex gap-3 items-start">
      <div className="w-1 rounded-full flex-shrink-0 self-stretch min-h-[48px]" style={{ backgroundColor: stripe }} />
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <span className="text-lg font-extrabold leading-tight" style={{ color: C.navy }}>{recipient}</span>
          {typeof amount === "number" && (
            <span className="text-base font-black tabular-nums flex-shrink-0" style={{ color: C.sage }}>
              ${amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
            </span>
          )}
        </div>
        <p className="text-xs font-bold mt-1" style={{ color: "#6B7280" }}>
          {agency}
          {subAgency && subAgency !== agency ? ` · ${subAgency}` : ""}
        </p>
        {awardType && (
          <span className="inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: stripe + "22", color: C.navy }}>
            {awardType}
          </span>
        )}
        {desc && (
          <p className="text-xs font-medium mt-2 leading-snug line-clamp-3" style={{ color: "#4B5563" }}>{desc}</p>
        )}
      </div>
    </div>
  );
}

// ─── Logo ─────────────────────────────────────────────────────────────────────
function PorchLogo() {
  return (
    <motion.img
      src="/logo.png"
      alt="Porch"
      animate={{ y: [0, -6, 0] }}
      transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut" }}
      style={{ height: "300px", width: "auto", objectFit: "contain" }}
    />
  );
}

// ─── SVG: Rep illustrated avatar ──────────────────────────────────────────────
function RepAvatar({ color, initials, size = 88 }: { color: string; initials: string; size?: number; photoUrl?: string | null }) {
  void color; // used only for background, kept for call-site compatibility
  // illustrated SVG avatar — no external photos
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

// ─── Card illustrations ────────────────────────────────────────────────────────
function CardIcon({ type }: { type: string }) {
  const fill = "rgba(255,255,255,0.16)";
  const stroke = "rgba(255,255,255,0.82)";
  const sw = 2.5;
  const cls = "w-[120px] h-[120px]";

  if (type === "garage") return (
    <svg className={cls} viewBox="0 0 120 120" fill="none" aria-hidden="true">
      <rect x="18" y="52" width="84" height="58" rx="3" fill={fill} stroke={stroke} strokeWidth={sw}/>
      <line x1="18" y1="78" x2="102" y2="78" stroke={stroke} strokeWidth={1.5} opacity="0.45"/>
      <rect x="27" y="58" width="15" height="16" rx="2" fill="rgba(255,255,255,0.2)"/>
      <rect x="52" y="58" width="15" height="16" rx="2" fill="rgba(255,255,255,0.2)"/>
      <rect x="77" y="58" width="15" height="16" rx="2" fill="rgba(255,255,255,0.2)"/>
      <circle cx="60" cy="29" r="19" fill={fill} stroke={stroke} strokeWidth={sw}/>
      <path d="M52 22h12a7 7 0 0 1 0 14H52V22z" stroke={stroke} strokeWidth={sw} strokeLinejoin="round" fill="none"/>
      <line x1="52" y1="36" x2="52" y2="43" stroke={stroke} strokeWidth={sw} strokeLinecap="round"/>
      <line x1="45" y1="45" x2="75" y2="14" stroke="rgba(255,180,180,0.9)" strokeWidth="3.5" strokeLinecap="round"/>
      <line x1="45" y1="14" x2="75" y2="45" stroke="rgba(255,180,180,0.9)" strokeWidth="3.5" strokeLinecap="round"/>
    </svg>
  );

  if (type === "construction") return (
    <svg className={cls} viewBox="0 0 120 120" fill="none" aria-hidden="true">
      <rect x="22" y="48" width="58" height="62" rx="2" fill={fill} stroke={stroke} strokeWidth={sw}/>
      <line x1="22" y1="72" x2="80" y2="72" stroke={stroke} strokeWidth={1.5} opacity="0.45"/>
      <line x1="22" y1="94" x2="80" y2="94" stroke={stroke} strokeWidth={1.5} opacity="0.45"/>
      <rect x="30" y="53" width="14" height="14" rx="2" fill="rgba(255,255,255,0.2)"/>
      <rect x="54" y="53" width="14" height="14" rx="2" fill="rgba(255,255,255,0.2)"/>
      <line x1="82" y1="110" x2="82" y2="18" stroke={stroke} strokeWidth={3.5} strokeLinecap="round"/>
      <line x1="82" y1="18" x2="108" y2="18" stroke={stroke} strokeWidth={3.5} strokeLinecap="round"/>
      <line x1="108" y1="18" x2="108" y2="42" stroke={stroke} strokeWidth={2} strokeDasharray="5 3" opacity="0.65"/>
      <line x1="82" y1="28" x2="98" y2="18" stroke={stroke} strokeWidth={1.5} opacity="0.55"/>
    </svg>
  );

  if (type === "vote") return (
    <svg className={cls} viewBox="0 0 120 120" fill="none" aria-hidden="true">
      <rect x="22" y="18" width="76" height="90" rx="5" fill={fill} stroke={stroke} strokeWidth={sw}/>
      <rect x="38" y="26" width="44" height="7" rx="3" fill="rgba(255,255,255,0.28)"/>
      <line x1="35" y1="46" x2="85" y2="46" stroke={stroke} strokeWidth={2} opacity="0.45"/>
      <line x1="35" y1="59" x2="85" y2="59" stroke={stroke} strokeWidth={2} opacity="0.45"/>
      <line x1="35" y1="72" x2="85" y2="72" stroke={stroke} strokeWidth={2} opacity="0.45"/>
      <rect x="30" y="82" width="20" height="20" rx="3" fill="rgba(255,255,255,0.2)" stroke={stroke} strokeWidth={2}/>
      <path d="M34 93l5 5 10-12" stroke="rgba(255,255,255,0.95)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  if (type === "housing") return (
    <svg className={cls} viewBox="0 0 120 120" fill="none" aria-hidden="true">
      <path d="M4 82 L4 56 L22 36 L40 56 L40 82 Z" fill={fill} stroke={stroke} strokeWidth={sw} strokeLinejoin="round"/>
      <rect x="12" y="65" width="20" height="17" rx="1" fill="rgba(255,255,255,0.2)"/>
      <path d="M36 82 L36 46 L60 20 L84 46 L84 82 Z" fill={fill} stroke={stroke} strokeWidth={sw} strokeLinejoin="round"/>
      <rect x="46" y="57" width="28" height="25" rx="1" fill="rgba(255,255,255,0.2)"/>
      <path d="M80 82 L80 56 L98 36 L116 56 L116 82 Z" fill={fill} stroke={stroke} strokeWidth={sw} strokeLinejoin="round"/>
      <rect x="88" y="65" width="20" height="17" rx="1" fill="rgba(255,255,255,0.2)"/>
      <line x1="0" y1="82" x2="120" y2="82" stroke={stroke} strokeWidth={1.8} opacity="0.4"/>
    </svg>
  );

  if (type === "council") return (
    <svg className={cls} viewBox="0 0 120 120" fill="none" aria-hidden="true">
      <rect x="52" y="18" width="48" height="24" rx="5" fill={fill} stroke={stroke} strokeWidth={sw}/>
      <rect x="57" y="18" width="20" height="24" rx="4" fill="rgba(255,255,255,0.1)" stroke={stroke} strokeWidth={1.5}/>
      <line x1="60" y1="42" x2="22" y2="92" stroke={stroke} strokeWidth={4.5} strokeLinecap="round"/>
      <rect x="18" y="94" width="64" height="16" rx="4" fill={fill} stroke={stroke} strokeWidth={sw}/>
      <line x1="100" y1="28" x2="114" y2="18" stroke={stroke} strokeWidth={1.5} opacity="0.5" strokeLinecap="round"/>
      <line x1="104" y1="40" x2="118" y2="40" stroke={stroke} strokeWidth={1.5} opacity="0.5" strokeLinecap="round"/>
    </svg>
  );

  if (type === "zoning") return (
    <svg className={cls} viewBox="0 0 120 120" fill="none" aria-hidden="true">
      <rect x="12" y="12" width="30" height="30" rx="3" fill="rgba(255,255,255,0.3)" stroke={stroke} strokeWidth={sw}/>
      <rect x="48" y="12" width="30" height="30" rx="3" fill={fill} stroke={stroke} strokeWidth={sw}/>
      <rect x="84" y="12" width="24" height="30" rx="3" fill={fill} stroke={stroke} strokeWidth={sw}/>
      <rect x="12" y="48" width="30" height="30" rx="3" fill={fill} stroke={stroke} strokeWidth={sw}/>
      <rect x="48" y="48" width="30" height="30" rx="3" fill="rgba(255,255,255,0.3)" stroke={stroke} strokeWidth={sw}/>
      <rect x="84" y="48" width="24" height="30" rx="3" fill="rgba(255,255,255,0.25)" stroke={stroke} strokeWidth={sw}/>
      <rect x="12" y="84" width="30" height="24" rx="3" fill={fill} stroke={stroke} strokeWidth={sw}/>
      <rect x="48" y="84" width="60" height="24" rx="3" fill={fill} stroke={stroke} strokeWidth={sw}/>
      <path d="M27 30 L27 20 M24 23 L27 20 L30 23" stroke="rgba(255,255,255,0.9)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );

  if (type === "community") return (
    <svg className={cls} viewBox="0 0 120 120" fill="none" aria-hidden="true">
      <circle cx="60" cy="28" r="15" fill={fill} stroke={stroke} strokeWidth={sw}/>
      <path d="M34 92 Q34 68 60 68 Q86 68 86 92" fill={fill} stroke={stroke} strokeWidth={sw} strokeLinejoin="round"/>
      <circle cx="22" cy="40" r="12" fill={fill} stroke={stroke} strokeWidth={1.8}/>
      <path d="M2 88 Q2 68 22 68 Q36 68 40 80" fill="none" stroke={stroke} strokeWidth={1.8}/>
      <circle cx="98" cy="40" r="12" fill={fill} stroke={stroke} strokeWidth={1.8}/>
      <path d="M118 88 Q118 68 98 68 Q84 68 80 80" fill="none" stroke={stroke} strokeWidth={1.8}/>
    </svg>
  );

  if (type === "transit") return (
    <svg className={cls} viewBox="0 0 120 120" fill="none" aria-hidden="true">
      <rect x="12" y="64" width="96" height="34" rx="9" fill={fill} stroke={stroke} strokeWidth={sw}/>
      <path d="M26 64 L36 42 L84 42 L94 64" fill={fill} stroke={stroke} strokeWidth={sw} strokeLinejoin="round"/>
      <circle cx="34" cy="100" r="11" fill={fill} stroke={stroke} strokeWidth={sw}/>
      <circle cx="34" cy="100" r="4.5" fill="rgba(255,255,255,0.28)"/>
      <circle cx="86" cy="100" r="11" fill={fill} stroke={stroke} strokeWidth={sw}/>
      <circle cx="86" cy="100" r="4.5" fill="rgba(255,255,255,0.28)"/>
      <line x1="8" y1="52" x2="112" y2="52" stroke={stroke} strokeWidth={3} strokeLinecap="round" opacity="0.7"/>
      <rect x="4" y="30" width="16" height="26" rx="3" fill={fill} stroke={stroke} strokeWidth={1.5}/>
      <path d="M76 14 C76 14 62 10 62 22 C62 28 68 32 76 32 C84 32 90 28 90 22 C90 10 76 14Z" fill="rgba(255,255,255,0.22)" stroke={stroke} strokeWidth={2}/>
      <line x1="76" y1="10" x2="76" y2="13" stroke={stroke} strokeWidth={2} strokeLinecap="round"/>
      <line x1="76" y1="31" x2="76" y2="34" stroke={stroke} strokeWidth={2} strokeLinecap="round"/>
    </svg>
  );

  if (type === "climate") return (
    <svg className={cls} viewBox="0 0 120 120" fill="none" aria-hidden="true">
      <rect x="34" y="52" width="52" height="58" rx="3" fill={fill} stroke={stroke} strokeWidth={sw}/>
      <line x1="34" y1="74" x2="86" y2="74" stroke={stroke} strokeWidth={1.5} opacity="0.4"/>
      <line x1="34" y1="94" x2="86" y2="94" stroke={stroke} strokeWidth={1.5} opacity="0.4"/>
      <rect x="42" y="57" width="13" height="13" rx="2" fill="rgba(255,255,255,0.2)"/>
      <rect x="65" y="57" width="13" height="13" rx="2" fill="rgba(255,255,255,0.2)"/>
      <path d="M60 50 C46 36 20 34 18 18 C32 16 54 24 62 42" fill="rgba(255,255,255,0.2)" stroke={stroke} strokeWidth={2}/>
      <path d="M18 18 C24 30 40 40 60 50" stroke={stroke} strokeWidth={2} strokeLinecap="round"/>
      <circle cx="94" cy="36" r="13" fill="rgba(255,220,80,0.25)" stroke="rgba(255,228,100,0.85)" strokeWidth={2}/>
      <line x1="94" y1="28" x2="94" y2="44" stroke="rgba(255,228,100,0.9)" strokeWidth={2} strokeLinecap="round"/>
      <line x1="86" y1="36" x2="102" y2="36" stroke="rgba(255,228,100,0.9)" strokeWidth={2} strokeLinecap="round"/>
    </svg>
  );

  // volunteer / default
  return (
    <svg className={cls} viewBox="0 0 120 120" fill="none" aria-hidden="true">
      <path d="M28 88 C22 76 16 60 24 46 C30 36 40 34 46 44 L55 62" stroke={stroke} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <path d="M92 88 C98 76 104 60 96 46 C90 36 80 34 74 44 L65 62" stroke={stroke} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <path d="M55 62 L65 62" stroke={stroke} strokeWidth={3.5} strokeLinecap="round"/>
      <path d="M60 40 C60 40 44 28 44 18 C44 12 50 8 60 16 C70 8 76 12 76 18 C76 28 60 40 60 40Z" fill="rgba(255,255,255,0.28)" stroke={stroke} strokeWidth={sw}/>
    </svg>
  );
}

type PulseCategoryId =
  | "education"
  | "environment"
  | "housing"
  | "governance"
  | "infrastructure"
  | "economy";

interface PulseItem {
  id: string;
  category: PulseCategoryId;
  /** Green card = positive civic trend; red = setback or risk. */
  trend: "positive" | "negative";
  icon: string;
  text: string;
  time: string;
}

const PULSE_CATEGORY_ORDER: PulseCategoryId[] = [
  "education",
  "environment",
  "housing",
  "governance",
  "infrastructure",
  "economy",
];

const PULSE_CATEGORY_LABELS: Record<PulseCategoryId, string> = {
  education: "Education",
  environment: "Environment & climate",
  housing: "Housing & neighborhoods",
  governance: "Governance & democracy",
  infrastructure: "Infrastructure & mobility",
  economy: "Economy & funding",
};

const PULSE_TREND_STYLES = {
  positive: {
    bg: "#ECFDF5",
    border: "#22C55E",
    badgeBg: "#DCFCE7",
    badgeText: "#166534",
    badgeLabel: "Positive trend",
  },
  negative: {
    bg: "#FEF2F2",
    border: "#F87171",
    badgeBg: "#FEE2E2",
    badgeText: "#991B1B",
    badgeLabel: "Negative trend",
  },
} as const;

const PULSE_ITEMS: PulseItem[] = [
  {
    id: "p-ed1",
    category: "education",
    trend: "positive",
    icon: "📚",
    text: "Ithaca City School District and partners continue expanding literacy supports and after-school access heading into the 2026–27 cycle.",
    time: "Spring 2026",
  },
  {
    id: "p8",
    category: "environment",
    trend: "positive",
    icon: "⚡",
    text: "Tompkins Green Energy Network (T-GEN) launched — community clean energy now available for Ithaca residents.",
    time: "Q1 2026",
  },
  {
    id: "p1",
    category: "housing",
    trend: "positive",
    icon: "🏗",
    text: "309 College Ave: 8-story, 77-unit mixed-use with retail proposed — adds housing supply downtown (fire station site would be redeveloped).",
    time: "Apr 28, 2026",
  },
  {
    id: "p3",
    category: "housing",
    trend: "positive",
    icon: "🏠",
    text: "IURA adopts 2026 HUD Action Plan — $1.17M for affordable housing, Ross House (10 units for homeless), and youth housing scholarships.",
    time: "Apr 23, 2026",
  },
  {
    id: "p7",
    category: "housing",
    trend: "positive",
    icon: "🏘",
    text: "Citywide PUD (Planned Unit Development) hearing held — zoning rewrite aligned with affordable housing goals.",
    time: "Apr 15, 2026",
  },
  {
    id: "p2",
    category: "governance",
    trend: "positive",
    icon: "📜",
    text: "Charter Revision Commission proposes even-year elections, decennial redistricting, and stronger Common Council budget levy authority.",
    time: "Apr 16, 2026",
  },
  {
    id: "p4",
    category: "governance",
    trend: "positive",
    icon: "⚖️",
    text: "City Council Code of Conduct adopted; Ethics Advisory Board holds inaugural meeting and reviews disclosure statements.",
    time: "Apr 22–27, 2026",
  },
  {
    id: "p5",
    category: "infrastructure",
    trend: "negative",
    icon: "🚧",
    text: "Seneca Street Parking Garage closed indefinitely — 1973 structure exceeded its lifespan; downtown parking squeezed until alternatives scale up.",
    time: "Apr 10, 2026",
  },
  {
    id: "p6",
    category: "economy",
    trend: "positive",
    icon: "💰",
    text: "Ithaca awarded $10 million NYS Downtown Revitalization Initiative grant for the MLK Jr. St corridor — housing, business, and public space investment.",
    time: "Apr 2026",
  },
];

function groupPulseByCategory(items: PulseItem[]) {
  const byCat = new Map<PulseCategoryId, PulseItem[]>();
  for (const id of PULSE_CATEGORY_ORDER) byCat.set(id, []);
  for (const item of items) {
    byCat.get(item.category)!.push(item);
  }
  return PULSE_CATEGORY_ORDER
    .filter((id) => (byCat.get(id) ?? []).length > 0)
    .map((id) => ({
      id,
      label: PULSE_CATEGORY_LABELS[id],
      items: byCat.get(id)!,
    }));
}

const PULSE_SECTIONS = groupPulseByCategory(PULSE_ITEMS);

const NYC_PULSE_ITEMS: PulseItem[] = [
  {
    id: "n-ed1",
    category: "education",
    trend: "positive",
    icon: "🏫",
    text: "NYC DOE expands 3-K for All and free pre-K seats — over 100,000 children enrolled citywide ahead of the 2025–26 school year.",
    time: "2025",
  },
  {
    id: "n4",
    category: "environment",
    trend: "positive",
    icon: "🌱",
    text: "Local Law 97 carbon caps take effect — larger buildings must cut emissions or pay $268/ton over limit. First fines assessed in 2025.",
    time: "2025",
  },
  {
    id: "n2",
    category: "housing",
    trend: "positive",
    icon: "🏘",
    text: "City of Yes for Housing Opportunity passed — NYC's largest upzoning in decades, enabling transit-oriented density and ADUs citywide.",
    time: "Dec 2024",
  },
  {
    id: "n7",
    category: "housing",
    trend: "positive",
    icon: "🏗",
    text: "NYCHA RAD conversion accelerating — public housing units transitioning to Section 8 platform to unlock capital repair funding.",
    time: "2025–2026",
  },
  {
    id: "n6",
    category: "governance",
    trend: "negative",
    icon: "⚖️",
    text: "Adams administration under ongoing federal investigation — deputy mayors managing day-to-day city operations.",
    time: "2025–2026",
  },
  {
    id: "n8",
    category: "governance",
    trend: "positive",
    icon: "🗳",
    text: "NYC mayoral primary 2025: open race, ranked-choice voting, candidates from all five boroughs — first open race since 2013.",
    time: "Jun 2025",
  },
  {
    id: "n1",
    category: "infrastructure",
    trend: "positive",
    icon: "🚗",
    text: "Congestion pricing active — $9 toll for passenger cars entering Manhattan below 60th St. MTA directing revenue to capital improvements.",
    time: "Jan 2025",
  },
  {
    id: "n5",
    category: "infrastructure",
    trend: "positive",
    icon: "🚇",
    text: "MTA Canarsie Tunnel repairs complete — L train fully restored after $800M flood remediation project following Hurricane Sandy.",
    time: "2025",
  },
  {
    id: "n3",
    category: "economy",
    trend: "positive",
    icon: "💰",
    text: "NYC FY2026 budget adopted at $114.5B — public education, housing, and shelter services are the top three spending categories.",
    time: "Jun 2025",
  },
];

const NYC_PULSE_SECTIONS = groupPulseByCategory(NYC_PULSE_ITEMS);

const ANON_COLORS = [C.coral, C.yellow, C.sage, C.sky, C.navy, "#9B59B6", "#E67E22"];

// ─── Profile types ────────────────────────────────────────────────────────────
interface UserProfile {
  id: string;
  name: string;
  email: string;
  onboarding: {
    completedAt: string;
    address: string;
    age: number | null;
    gender: string;
    ethnicity: string;
    income: string;
    issues: string[];
    party: string;
  } | null;
}

// ─── Profile avatar button (hero top-right) ───────────────────────────────────
function ProfileButton({ name, onClick }: { name: string; onClick: () => void }) {
  const initials = name.split(" ").filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  return (
    <button
      onClick={onClick}
      className="absolute top-4 right-4 z-20 w-11 h-11 rounded-full flex items-center justify-center font-extrabold text-sm transition-opacity hover:opacity-80"
      style={{
        backgroundColor: C.navy,
        color: "white",
        boxShadow: "0 2px 12px rgba(28,37,52,0.18)",
      }}
    >
      {initials}
    </button>
  );
}

// ─── Profile bottom sheet ─────────────────────────────────────────────────────
function ProfileSheet({ profile, onClose }: { profile: UserProfile; onClose: () => void }) {
  const ob = profile.onboarding;
  const initials = profile.name.split(" ").filter(Boolean).map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  const partyObj = ob?.party ? PARTIES.find((p) => p.id === ob.party) : null;
  const memberYear = new Date(
    profile.onboarding?.completedAt ?? Date.now()
  ).getFullYear();

  return (
    <>
      {/* Backdrop */}
      <motion.div
        key="profile-bg"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-40"
        style={{ backgroundColor: "rgba(0,0,0,0.48)" }}
      />

      {/* Sheet */}
      <motion.div
        key="profile-sheet"
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 32, stiffness: 320 }}
        className="fixed bottom-0 left-0 right-0 z-50 rounded-t-[32px] overflow-y-auto"
        style={{ backgroundColor: "white", maxHeight: "92vh", paddingBottom: "env(safe-area-inset-bottom,24px)", boxShadow: "0 -8px 48px rgba(28,37,52,0.20)" }}
      >
        {/* Handle — sits on top of the navy header */}
        <div className="flex justify-center pt-3 pb-0" style={{ backgroundColor: C.navy, borderRadius: "32px 32px 0 0" }}>
          <div className="w-10 h-1 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.25)" }} />
        </div>

        {/* Navy header block */}
        <div className="relative px-6 pt-4 pb-6" style={{ backgroundColor: C.navy }}>
          <button onClick={onClose}
            className="absolute top-3 right-4 w-8 h-8 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "rgba(255,255,255,0.12)" }}>
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
              <path d="M1 1l12 12M13 1L1 13" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
          </button>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full flex-shrink-0 flex items-center justify-center font-extrabold text-xl text-white"
              style={{ backgroundColor: C.sage, border: "3px solid rgba(255,255,255,0.2)", boxShadow: "0 4px 16px rgba(0,0,0,0.25)" }}>
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xl font-extrabold leading-tight truncate text-white">{profile.name}</p>
              <p className="text-sm mt-0.5 truncate" style={{ color: "rgba(255,255,255,0.6)" }}>{profile.email}</p>
              {ob?.completedAt && (
                <p className="text-xs mt-1 font-medium" style={{ color: "rgba(255,255,255,0.4)" }}>Member since {memberYear}</p>
              )}
            </div>
          </div>
        </div>

        {ob ? (
          <>
            <div style={{ height: 1, backgroundColor: C.border }} />

            {/* Location */}
            {ob.address && (
              <div className="px-6 py-4">
                <p className="text-[11px] font-bold uppercase tracking-widest mb-2" style={{ color: C.faint }}>Location</p>
                <div className="flex items-start gap-2">
                  <span className="text-base mt-0.5">📍</span>
                  <p className="text-sm font-semibold leading-snug" style={{ color: C.navy }}>{ob.address}</p>
                </div>
              </div>
            )}

            {/* Demographics */}
            {(ob.age || ob.gender || ob.ethnicity || ob.income) && (
              <>
                <div style={{ height: 1, backgroundColor: C.border }} />
                <div className="px-6 py-4">
                  <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: C.faint }}>About you</p>
                  <div className="flex flex-wrap gap-2">
                    {ob.age && (
                      <span className="px-3 py-1.5 rounded-full text-sm font-bold"
                        style={{ backgroundColor: C.sky + "18", color: C.sky }}>
                        {ob.age} yrs old
                      </span>
                    )}
                    {ob.gender && ob.gender !== "Prefer not to say" && (
                      <span className="px-3 py-1.5 rounded-full text-sm font-bold"
                        style={{ backgroundColor: C.sage + "22", color: C.coral }}>
                        {ob.gender}
                      </span>
                    )}
                    {ob.ethnicity && ob.ethnicity !== "Prefer not to say" && (
                      <span className="px-3 py-1.5 rounded-full text-sm font-bold"
                        style={{ backgroundColor: C.yellow + "28", color: "#7A6010" }}>
                        {ob.ethnicity}
                      </span>
                    )}
                    {ob.income && ob.income !== "Prefer not to say" && (
                      <span className="px-3 py-1.5 rounded-full text-sm font-bold"
                        style={{ backgroundColor: "#9B59B620", color: "#9B59B6" }}>
                        💵 {ob.income}
                      </span>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Issues */}
            {ob.issues.length > 0 && (
              <>
                <div style={{ height: 1, backgroundColor: C.border }} />
                <div className="px-6 py-4">
                  <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: C.faint }}>
                    Issues I care about
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {ob.issues.map((id) => {
                      const issue = ISSUES.find((i) => i.id === id);
                      if (!issue) return null;
                      return (
                        <span key={id} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold"
                          style={{ backgroundColor: C.coral + "16", color: C.coral }}>
                          {issue.icon} {issue.label}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </>
            )}

            {/* Party */}
            {partyObj && (
              <>
                <div style={{ height: 1, backgroundColor: C.border }} />
                <div className="px-6 py-4">
                  <p className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: C.faint }}>Party</p>
                  <span className="px-4 py-2 rounded-full text-sm font-extrabold"
                    style={{ backgroundColor: partyObj.color + "18", color: partyObj.color }}>
                    {partyObj.label}
                  </span>
                </div>
              </>
            )}
          </>
        ) : (
          <div className="px-6 py-8 text-center">
            <p className="text-sm font-medium mb-4" style={{ color: C.muted }}>
              You haven&apos;t set up your profile yet.
            </p>
            <a href="/onboarding"
              className="inline-block px-6 py-3 rounded-full font-bold text-white text-sm"
              style={{ backgroundColor: C.coral }}>
              Set up profile →
            </a>
          </div>
        )}

        {/* Actions */}
        <div style={{ height: 1, backgroundColor: C.border }} />
        <div className="px-6 pt-4 pb-6 flex flex-col gap-3">
          <a href="/onboarding"
            className="block w-full py-3.5 rounded-full font-bold text-center text-sm"
            style={{ border: `1.5px solid ${C.border}`, color: C.navy, backgroundColor: "white" }}>
            Edit profile
          </a>
          <button
            onClick={() => signOut({ callbackUrl: "/signin" })}
            className="w-full py-3.5 rounded-full font-bold text-sm"
            style={{ backgroundColor: "#FEF2F2", color: "#B91C1C" }}>
            Sign out
          </button>
        </div>
      </motion.div>
    </>
  );
}

// ─── Live countdown ticker ────────────────────────────────────────────────────
function Countdown({ deadline, className, style }: { deadline: string; className?: string; style?: React.CSSProperties }) {
  const [text, setText] = useState("");
  const [urgent, setUrgent] = useState(false);
  useEffect(() => {
    function tick() {
      const diff = new Date(deadline).getTime() - Date.now();
      if (diff <= 0) { setText("Closed"); setUrgent(false); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setText(`${h}h ${m.toString().padStart(2, "0")}m ${s.toString().padStart(2, "0")}s`);
      setUrgent(diff < 6 * 3600000);
    }
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [deadline]);
  return (
    <span className={className} style={{ color: urgent ? C.coral : undefined, ...style }}>
      {text}
    </span>
  );
}

// ─── Permit bottom sheet ───────────────────────────────────────────────────────
function PermitBottomSheet({
  permit,
  userIssues,
  userName,
  onClose,
}: {
  permit: PermitData;
  userIssues: string[];
  userName: string;
  onClose: () => void;
}) {
  const [comments,     setComments]     = useState<PermitComment[]>(permit.comments);
  const [totalCount,   setTotalCount]   = useState(permit.totalCommentCount);
  const [commentText,  setCommentText]  = useState("");
  const [submitting,   setSubmitting]   = useState(false);
  const [submitted,    setSubmitted]    = useState(false);
  const [voteDays,     setVoteDays]     = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    fetch(`/api/permits/${permit.id}/comments`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) { setComments(d.comments); setTotalCount(d.totalCommentCount); } })
      .catch(() => {});
  }, [permit.id]);

  useEffect(() => {
    const id = setInterval(() => {
      const diff = new Date(permit.voteDate).getTime() - Date.now();
      setVoteDays(diff > 0 ? Math.ceil(diff / 86400000) : 0);
    }, 60000);
    setVoteDays(Math.ceil((new Date(permit.voteDate).getTime() - Date.now()) / 86400000));
    return () => clearInterval(id);
  }, [permit.voteDate]);

  const whyKey    = userIssues.find(i => permit.whyItMatters[i]) ?? "default";
  const whyMsg    = permit.whyItMatters[whyKey];
  const issueObj  = ISSUES.find(i => i.id === whyKey);
  const voteLabel = new Date(permit.voteDate).toLocaleDateString("en-US", { month: "short", day: "numeric" });

  const handleSubmit = async () => {
    if (!commentText.trim() || submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/permits/${permit.id}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          author: userName || "You",
          neighborhood: "Your neighborhood",
          text: commentText.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setComments(prev => [data.comment, ...prev]);
        setTotalCount(data.totalCommentCount);
        setCommentText("");
        setSubmitted(true);
      }
    } catch {}
    setSubmitting(false);
  };

  return (
    <>
      <motion.div key="permit-bg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} className="fixed inset-0 z-40"
        style={{ backgroundColor: "rgba(0,0,0,0.52)" }} />

      <motion.div key="permit-sheet"
        initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 34, stiffness: 320 }}
        className="fixed bottom-0 left-0 right-0 z-50 rounded-t-[32px] overflow-y-auto"
        style={{ backgroundColor: C.bg, maxHeight: "94vh", paddingBottom: "env(safe-area-inset-bottom,24px)" }}>

        {/* Handle */}
        <div className="flex justify-center pt-3 pb-0" style={{ backgroundColor: C.navy, borderRadius: "32px 32px 0 0" }}>
          <div className="w-10 h-1 rounded-full" style={{ backgroundColor: "rgba(255,255,255,0.22)" }} />
        </div>

        {/* Navy header */}
        <div className="relative px-5 pt-4 pb-5" style={{ backgroundColor: C.navy }}>
          <button onClick={onClose}
            className="absolute top-3 right-4 w-8 h-8 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "rgba(255,255,255,0.12)" }}>
            <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
              <path d="M1 1l12 12M13 1L1 13" stroke="white" strokeWidth="2" strokeLinecap="round" />
            </svg>
          </button>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-[11px] font-extrabold px-2.5 py-1 rounded-full"
              style={{ backgroundColor: C.coral, color: "white" }}>
              {permit.type}
            </span>
            <span className="text-[11px] font-semibold"
              style={{ color: "rgba(255,255,255,0.55)" }}>
              {permit.distanceBlocks} blocks away
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-white leading-tight">{permit.address}</h2>
          <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.6)" }}>{permit.board}</p>
        </div>

        <div className="px-5 py-5 space-y-4">

          {/* Plain English */}
          <div className="rounded-[20px] p-4" style={{ backgroundColor: "white", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
            <p className="text-[10px] font-extrabold uppercase tracking-wider mb-2" style={{ color: C.sage }}>
              What&apos;s actually happening
            </p>
            <p className="text-sm font-medium leading-relaxed" style={{ color: C.navy }}>
              {permit.plainEnglish}
            </p>
            <a href={permit.officialUrl} target="_blank" rel="noreferrer"
              className="inline-flex items-center gap-1 mt-3 text-xs font-bold"
              style={{ color: C.sky }}>
              Read official documents ↗
            </a>
          </div>

          {/* Why it matters to you */}
          <div className="rounded-[20px] p-4" style={{ backgroundColor: C.sage + "14", border: `1.5px solid ${C.sage}30` }}>
            <p className="text-[10px] font-extrabold uppercase tracking-wider mb-2" style={{ color: C.sage }}>
              {issueObj ? `${issueObj.icon} Why this matters for ${issueObj.label}` : "Why this matters to you"}
            </p>
            <p className="text-sm font-medium leading-relaxed" style={{ color: C.navy }}>
              {whyMsg}
            </p>
          </div>

          {/* Comment deadline countdown */}
          <div className="rounded-[20px] p-4" style={{ backgroundColor: C.coral + "0F", border: `1.5px solid ${C.coral}30` }}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] font-extrabold uppercase tracking-wider" style={{ color: C.coral }}>
                  Comment window closes in
                </p>
                <Countdown
                  deadline={permit.commentDeadline}
                  className="text-2xl font-black tabular-nums"
                  style={{ color: C.coral }}
                />
              </div>
              <div className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: C.coral + "1A" }}>
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke={C.coral} strokeWidth="2" />
                  <path d="M12 6v6l4 2" stroke={C.coral} strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
            </div>
          </div>

          {/* Comment input */}
          <div className="rounded-[20px] p-4" style={{ backgroundColor: "white", boxShadow: "0 2px 10px rgba(0,0,0,0.05)" }}>
            <p className="text-[10px] font-extrabold uppercase tracking-wider mb-3" style={{ color: C.navy }}>
              Your comment · goes on the official city record
            </p>
            <textarea
              ref={textareaRef}
              value={commentText}
              onChange={e => setCommentText(e.target.value)}
              placeholder="What do you think about this project? What should the Planning Board consider?"
              rows={3}
              className="w-full text-sm resize-none rounded-[14px] p-3 outline-none"
              style={{
                backgroundColor: C.bg,
                border: `1.5px solid ${C.border}`,
                color: C.navy,
                fontFamily: "inherit",
              }}
            />
            <button
              onClick={handleSubmit}
              disabled={!commentText.trim() || submitting}
              className="w-full mt-3 py-3.5 rounded-full font-extrabold text-sm transition-opacity"
              style={{
                backgroundColor: commentText.trim() ? C.coral : "#E5E7EB",
                color: commentText.trim() ? "white" : "#9CA3AF",
              }}>
              {submitting ? "Submitting…" : "Submit comment →"}
            </button>
          </div>

          {/* Success state */}
          <AnimatePresence>
            {submitted && (
              <motion.div key="success"
                initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }}
                className="rounded-[20px] p-4 flex items-center gap-3"
                style={{ backgroundColor: C.sage + "18", border: `1.5px solid ${C.sage}40` }}>
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: C.sage }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="M5 13l4 4L19 7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-extrabold" style={{ color: C.navy }}>Comment submitted ✓</p>
                  <p className="text-xs mt-0.5" style={{ color: "#6B7280" }}>
                    It&apos;s now on the official city record for the May 26 vote.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Comment thread */}
          <div>
            <p className="text-xs font-extrabold mb-3" style={{ color: C.navy }}>
              {totalCount} comments from your neighborhood
            </p>
            <div className="space-y-3">
              {comments.map((c, i) => (
                <motion.div key={c.id}
                  initial={c.isNew ? { opacity: 0, y: -10 } : false}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i === 0 && c.isNew ? 0 : i * 0.04 }}
                  className="rounded-[16px] p-3.5"
                  style={{
                    backgroundColor: c.isNew ? C.sage + "14" : "white",
                    border: c.isNew ? `1.5px solid ${C.sage}40` : `1px solid ${C.border}`,
                    boxShadow: "0 1px 6px rgba(0,0,0,0.04)",
                  }}>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-extrabold text-white flex-shrink-0"
                        style={{ backgroundColor: c.isNew ? C.sage : C.sky }}>
                        {c.author.charAt(0)}
                      </div>
                      <span className="text-xs font-bold" style={{ color: C.navy }}>
                        {c.author}
                        {c.neighborhood ? (
                          <span className="font-normal ml-1" style={{ color: "#9CA3AF" }}>· {c.neighborhood}</span>
                        ) : null}
                      </span>
                    </div>
                    <span className="text-[10px]" style={{ color: "#9CA3AF" }}>
                      {c.isNew ? "✓ On official record" : c.time}
                    </span>
                  </div>
                  <p className="text-sm leading-snug" style={{ color: "#374151" }}>{c.text}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Vote countdown */}
          <div className="rounded-[20px] p-4 flex items-center gap-4"
            style={{ backgroundColor: C.navy, boxShadow: "0 4px 16px rgba(28,37,52,0.18)" }}>
            <div className="flex-1">
              <p className="text-[10px] font-extrabold uppercase tracking-wider mb-1" style={{ color: "rgba(255,255,255,0.55)" }}>
                Board vote
              </p>
              <p className="text-white font-extrabold text-lg leading-tight">
                {voteLabel} · {permit.board.split(" ")[0]} Board
              </p>
              <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.55)" }}>
                Public comments close first
              </p>
            </div>
            <div className="text-center flex-shrink-0">
              <div className="text-4xl font-black text-white leading-none">{voteDays}</div>
              <div className="text-[10px] font-bold mt-0.5" style={{ color: "rgba(255,255,255,0.55)" }}>days</div>
            </div>
          </div>

        </div>
      </motion.div>
    </>
  );
}

// ─── Civic engagement score ────────────────────────────────────────────────────
const CIVIC_LEVELS = [
  { min: 0,   label: "Observer",           emoji: "👀", color: "#6B7A8D" },
  { min: 12,  label: "Informed",           emoji: "📖", color: "#4A9EBC" },
  { min: 32,  label: "Active Resident",    emoji: "🙋", color: "#4CAF82" },
  { min: 70,  label: "Engaged Citizen",    emoji: "🗳️", color: "#C4A830" },
  { min: 120, label: "Community Advocate", emoji: "📢", color: "#E8694D" },
  { min: 200, label: "Community Leader",   emoji: "⭐", color: "#1C2534" },
] as const;

function civicLevel(score: number) {
  return [...CIVIC_LEVELS].reverse().find((l) => score >= l.min) ?? CIVIC_LEVELS[0];
}
function civicNextMin(score: number): number {
  return CIVIC_LEVELS.find((l) => l.min > score)?.min ?? CIVIC_LEVELS[CIVIC_LEVELS.length - 1].min;
}

function useCivicScore() {
  const [score, setScore] = useState(0);
  const [toast, setToast] = useState<{ pts: number; action: string } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const saved = parseInt(localStorage.getItem("porch_civic_score") ?? "0", 10);
    setScore(Number.isFinite(saved) ? saved : 0);
  }, []);

  const addPoints = useCallback((pts: number, action: string) => {
    setScore((prev) => {
      const next = prev + pts;
      localStorage.setItem("porch_civic_score", String(next));
      return next;
    });
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast({ pts, action });
    toastTimer.current = setTimeout(() => setToast(null), 2200);
  }, []);

  return { score, toast, addPoints };
}

function CivicScoreBar({ score, toast }: { score: number; toast: { pts: number; action: string } | null }) {
  const level = civicLevel(score);
  const nextMin = civicNextMin(score);
  const levelStart = level.min;
  const pct = nextMin > levelStart
    ? Math.min(100, ((score - levelStart) / (nextMin - levelStart)) * 100)
    : 100;

  return (
    <div
      className="fixed left-0 right-0 z-30 px-4"
      style={{
        bottom: "72px",
        paddingTop: "8px",
        paddingBottom: "8px",
        background: "rgba(255,255,255,0.96)",
        borderTop: "1px solid rgba(0,0,0,0.06)",
        backdropFilter: "blur(10px)",
      }}
    >
      <AnimatePresence>
        {toast && (
          <motion.div
            key="civic-toast"
            initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22 }}
            className="absolute left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-[11px] font-bold text-white whitespace-nowrap"
            style={{ bottom: "calc(100% + 4px)", backgroundColor: level.color, boxShadow: `0 2px 8px ${level.color}55` }}
          >
            +{toast.pts} pts · {toast.action}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-2.5">
        <span className="text-lg leading-none select-none">{level.emoji}</span>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-baseline mb-1">
            <span className="text-[11px] font-extrabold tracking-wide" style={{ color: level.color }}>
              {level.label}
            </span>
            <span className="text-[10px] font-medium" style={{ color: "#9CA3AF" }}>
              {score} pts{pct < 100 ? ` · next at ${nextMin}` : " · max level"}
            </span>
          </div>
          <div className="rounded-full overflow-hidden" style={{ height: 5, backgroundColor: "#F3F4F6" }}>
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: level.color }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.55, ease: "easeOut" }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────────
export default function Home() {
  const [address,        setAddress]        = useState("");
  const [suggestions,     setSuggestions]     = useState<MapboxSuggestFeature[]>([]);
  const [suggestOpen,    setSuggestOpen]    = useState(false);
  const [suggestLoading, setSuggestLoading] = useState(false);
  const [suggestHighlight, setSuggestHighlight] = useState(-1);
  const suggestTimerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suggestAbortRef   = useRef<AbortController | null>(null);
  const skipSuggestEffect = useRef(false);
  const searchComboRef    = useRef<HTMLDivElement>(null);
  const [searching,      setSearching]      = useState(false);
  const [searched,       setSearched]       = useState(false);
  const [initLoading,    setInitLoading]    = useState(true);
  const [activeNav,      setActiveNav]      = useState<"home"|"map"|"people"|"money"|"help">("home");
  const [rent,           setRent]           = useState(2500);
  const [liked,          setLiked]          = useState<Record<string, boolean>>({});
  const [profileOpen,    setProfileOpen]    = useState(false);
  const [userProfile,    setUserProfile]    = useState<UserProfile | null>(null);
  const { data: session } = useSession();
  const { score: civicScore, toast: civicToast, addPoints } = useCivicScore();

  // Live API data
  const [liveReps,         setLiveReps]         = useState<LiveRep[]>([]);
  const [openLiveRepId,    setOpenLiveRepId]     = useState<string | null>(null);
  const [livePlaces,       setLivePlaces]        = useState<LivePlace[]>([]);
  const [openLivePlaceId,  setOpenLivePlaceId]   = useState<string | null>(null);
  const [searchedAddress,  setSearchedAddress]   = useState<string>("");

  // Multi-city
  const [detectedCity,     setDetectedCity]      = useState<CityId>("ithaca");
  const [searchCoords,     setSearchCoords]      = useState<{ lat: number; lng: number } | null>(null);

  // Permit / civic-action flow
  const [nearbyPermit,     setNearbyPermit]      = useState<PermitData | null>(null);
  const [permitSheetOpen,  setPermitSheetOpen]   = useState(false);

  const budgetRef       = useRef<HTMLElement>(null);
  const budgetTriggered = useInView(budgetRef, { once: true, amount: 0.2 });

  const federalBlockRef = useRef<HTMLDivElement>(null);
  const federalVisible  = useInView(federalBlockRef, { once: true, amount: 0.12 });
  const lastFederalCity = useRef<CityId | null>(null);
  const [federalRows,    setFederalRows]    = useState<FederalAwardRow[]>([]);
  const [federalLoading, setFederalLoading] = useState(false);
  const [federalError,   setFederalError]   = useState<string | null>(null);

  const loadFederalSpending = useCallback(async (city: CityId = "ithaca") => {
    setFederalLoading(true);
    setFederalError(null);
    try {
      const res = await fetch(`/api/federal-spending?city=${city}`);
      const data = await res.json();
      if (!res.ok) {
        const msg = typeof data.error === "string" ? data.error : "Could not load federal spending";
        throw new Error(msg);
      }
      setFederalRows(Array.isArray(data.results) ? data.results : []);
    } catch (e) {
      setFederalError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setFederalLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!federalVisible) return;
    if (lastFederalCity.current === detectedCity) return;
    lastFederalCity.current = detectedCity;
    setFederalRows([]);
    loadFederalSpending(detectedCity);
  }, [federalVisible, detectedCity, loadFederalSpending]);

  const lastCensusCity = useRef<CityId | null>(null);
  const [censusData,    setCensusData]    = useState<CensusSnapshot | null>(null);
  const [censusLoading, setCensusLoading] = useState(false);
  const [censusError,   setCensusError]   = useState<string | null>(null);

  const loadCensus = useCallback(async (city: CityId = "ithaca") => {
    setCensusLoading(true);
    setCensusError(null);
    try {
      const res = await fetch(`/api/census?city=${city}`);
      const data = await res.json();
      if (!res.ok) {
        const msg = typeof data.error === "string" ? data.error : "Could not load Census data";
        throw new Error(msg);
      }
      setCensusData(data as CensusSnapshot);
    } catch (e) {
      setCensusError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setCensusLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!budgetTriggered) return;
    if (lastCensusCity.current === detectedCity) return;
    lastCensusCity.current = detectedCity;
    setCensusData(null);
    loadCensus(detectedCity);
  }, [budgetTriggered, detectedCity, loadCensus]);

  const openLiveRep   = liveReps.find((r) => r.id === openLiveRepId) ?? null;
  const openLivePlace = livePlaces.find((p) => p.id === openLivePlaceId) ?? null;

  // ── Shared fetch logic ───────────────────────────────────────────────────────
  const fetchForAddress = async (_addr: string, lat: number, lng: number, cityId?: CityId) => {
    const merged: LiveRep[] = cityId !== "nyc" ? [...localOfficials] : [];

    const [legRes, placesRes] = await Promise.allSettled([
      fetch(`/api/legislators?lat=${lat}&lng=${lng}`),
      fetch(`/api/places?lat=${lat}&lng=${lng}`),
    ]);

    if (legRes.status === "fulfilled" && legRes.value.ok) {
      const legOfficials: LiveRep[] = (await legRes.value.json()).officials ?? [];
      merged.push(...legOfficials);
    }

    setLiveReps(merged);

    if (placesRes.status === "fulfilled" && placesRes.value.ok) {
      setLivePlaces((await placesRes.value.json()).places ?? []);
    }
  };

  // ── Fetch user profile ────────────────────────────────────────────────────────
  useEffect(() => {
    fetch("/api/user/profile")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d) setUserProfile(d); })
      .catch(() => {});
  }, []);

  // ── Auto-fetch for Ithaca on mount ───────────────────────────────────────────
  useEffect(() => {
    const [lng, lat] = NEIGHBORHOOD.center;
    fetchForAddress(NEIGHBORHOOD.address, lat, lng)
      .catch(console.error)
      .finally(() => setInitLoading(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onDoc = (ev: MouseEvent) => {
      if (!searchComboRef.current?.contains(ev.target as Node)) setSuggestOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  const discoverNearbyPermit = async (lat: number, lng: number, cityId?: CityId) => {
    const city = cityId ?? detectedCity;
    const apiPath = CITY_CONFIGS[city].permitsApiPath;
    try {
      const permitRes = await fetch(`${apiPath}?lat=${lat}&lng=${lng}`);
      if (permitRes.ok) {
        const { permits } = await permitRes.json();
        if (permits?.length > 0) setNearbyPermit(permits[0]);
        else setNearbyPermit(null);
      }
    } catch {
      /* ignore */
    }
  };

  // ── Mapbox address autocomplete (debounced) ────────────────────────────────
  useEffect(() => {
    if (skipSuggestEffect.current) {
      skipSuggestEffect.current = false;
      return;
    }
    const q = address.trim();
    const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
    if (suggestTimerRef.current) clearTimeout(suggestTimerRef.current);

    if (!token || q.length < 2) {
      setSuggestions([]);
      setSuggestLoading(false);
      return;
    }

    suggestTimerRef.current = setTimeout(async () => {
      suggestAbortRef.current?.abort();
      const ac = new AbortController();
      suggestAbortRef.current = ac;
      setSuggestLoading(true);
      const [proxLng, proxLat] = NEIGHBORHOOD.center;
      try {
        const url =
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json` +
          `?access_token=${token}&country=us&limit=8&autocomplete=true` +
          `&proximity=${proxLng},${proxLat}` +
          `&types=address,poi,place,locality,neighborhood`;
        const res = await fetch(url, { signal: ac.signal });
        const data = res.ok ? await res.json() : null;
        const feats = (data?.features ?? []) as MapboxSuggestFeature[];
        setSuggestions(feats);
        setSuggestHighlight(-1);
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        setSuggestions([]);
      } finally {
        setSuggestLoading(false);
      }
    }, 260);

    return () => {
      if (suggestTimerRef.current) clearTimeout(suggestTimerRef.current);
    };
  }, [address]);

  const pickSuggestion = async (feature: MapboxSuggestFeature) => {
    skipSuggestEffect.current = true;
    const [lng, lat] = feature.center;
    const formatted = feature.place_name;
    const city = detectCity(feature);
    setAddress(formatted);
    setSuggestions([]);
    setSuggestOpen(false);
    setSuggestHighlight(-1);
    setDetectedCity(city);
    setSearchCoords({ lat, lng });
    setSearching(true);
    addPoints(5, "Searched your address");
    try {
      setSearchedAddress(formatted);
      await fetchForAddress(formatted, lat, lng, city);
      await discoverNearbyPermit(lat, lng, city);
    } catch (err) {
      console.error(err);
    } finally {
      setSearching(false);
      setSearched(true);
      setTimeout(() => document.getElementById("urgent")?.scrollIntoView({ behavior: "smooth" }), 300);
    }
  };

  // ── Address search ───────────────────────────────────────────────────────────
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.trim()) return;

    if (suggestHighlight >= 0 && suggestions[suggestHighlight]) {
      await pickSuggestion(suggestions[suggestHighlight]);
      return;
    }

    setSuggestOpen(false);
    setSuggestions([]);
    setSearching(true);

    try {
      const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
      let lng: number;
      let lat: number;
      let formatted: string;
      let resolvedCity: CityId = "ithaca";
      if (token) {
        const [proxLng, proxLat] = NEIGHBORHOOD.center;
        const geoRes = await fetch(
          `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address.trim())}.json` +
          `?access_token=${token}&limit=1&country=us&proximity=${proxLng},${proxLat}`
        );
        const geoData = geoRes.ok ? await geoRes.json() : null;
        const f0 = geoData?.features?.[0] as MapboxSuggestFeature | undefined;
        if (f0?.center) {
          [lng, lat] = f0.center;
          formatted = f0.place_name ?? address.trim();
          resolvedCity = detectCity(f0);
          setDetectedCity(resolvedCity);
        } else {
          [lng, lat] = NEIGHBORHOOD.center;
          formatted = address.trim();
        }
      } else {
        [lng, lat] = NEIGHBORHOOD.center;
        formatted = address.trim();
      }
      setSearchCoords({ lat, lng });
      setSearchedAddress(formatted);
      await fetchForAddress(formatted, lat, lng, resolvedCity);
      await discoverNearbyPermit(lat, lng, resolvedCity);
    } catch (err) {
      console.error(err);
    }

    setSearching(false);
    setSearched(true);
    setTimeout(() => document.getElementById("urgent")?.scrollIntoView({ behavior: "smooth" }), 300);
  };

  const onAddressKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSuggestOpen(true);
      setSuggestHighlight((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSuggestOpen(true);
      setSuggestHighlight((i) => Math.max(i - 1, 0));
    } else if (e.key === "Escape") {
      setSuggestOpen(false);
      setSuggestHighlight(-1);
    }
  };

  const annual    = rent * 12 * 0.012;
  const schoolTax = Math.round(annual * 0.31);
  const roadTax   = Math.round(annual * 0.09);
  const parkTax   = Math.round(annual * 0.08);

  // ── Personalization ──────────────────────────────────────────────────────────
  const ob             = userProfile?.onboarding;
  const userIssues     = ob?.issues ?? [];
  const userPartyId    = ob?.party ?? "";
  const taxBreakdown   = ob?.income ? getTaxBreakdown(ob.income) : null;

  const sortedReps = [...liveReps].sort((a, b) => {
    const aMatch = repIsAligned(a.party, userPartyId) ? 1 : 0;
    const bMatch = repIsAligned(b.party, userPartyId) ? 1 : 0;
    return bMatch - aMatch;
  });

  const sortedPlaces = [...livePlaces].sort((a, b) => {
    const aScore = placeMatchedIssues(a.category, a.name, userIssues).length;
    const bScore = placeMatchedIssues(b.category, b.name, userIssues).length;
    return bScore - aScore;
  });

  const cityConfig      = CITY_CONFIGS[detectedCity];
  const cityUrgentCards = cityConfig.urgentCards;
  const cityPulseItems  = cityConfig.pulseItems;

  const sortedUrgentCards = [...cityUrgentCards].sort((a, b) =>
    cardRelevanceScore(b.title, userIssues) - cardRelevanceScore(a.title, userIssues)
  );

  const alignedRepCount = liveReps.filter((r) => repIsAligned(r.party, userPartyId)).length;


  return (
    <div className="min-h-screen font-sans" style={{ backgroundColor: C.bg, paddingBottom: "144px" }}>

      {/* ══ SECTION 1: HERO ══════════════════════════════════════════════ */}
      <section id="home" className="relative flex items-center justify-center overflow-hidden"
        style={{ backgroundColor: C.bg, height: "100dvh", minHeight: "100vh" }}>
        {session?.user && (
          <ProfileButton name={session.user.name ?? "U"} onClick={() => setProfileOpen(true)} />
        )}

        {/* Decorative background blobs — no image */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-40 -right-32 w-[560px] h-[560px]"
            style={{ background: "radial-gradient(circle at 40% 40%, rgba(139,175,146,0.20) 0%, transparent 65%)" }} />
          <div className="absolute -bottom-32 -left-32 w-[420px] h-[420px]"
            style={{ background: "radial-gradient(circle at 60% 60%, rgba(196,168,120,0.14) 0%, transparent 65%)" }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px]"
            style={{ background: "radial-gradient(circle at 50% 50%, rgba(139,175,146,0.06) 0%, transparent 60%)" }} />
          {/* Thin sage accent line at top */}
          <div className="absolute top-0 left-0 right-0 h-[3px]"
            style={{ background: `linear-gradient(90deg, ${C.sage}, ${C.coral}, ${C.yellow})` }} />
        </div>

        <div className="relative z-10 text-center px-6 max-w-xl mx-auto w-full">
          <motion.div initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, ease: "easeOut" }}>
            <div
              className="mb-8 sm:mb-10 md:mb-12 -mt-20 sm:-mt-24 md:-mt-32 lg:-mt-36 text-3xl font-black tracking-tight"
              style={{ color: C.navy, letterSpacing: "-0.02em" }}
            >
              porch<span style={{ color: C.coral }}>.</span>
            </div>
            <h1 className="font-extrabold leading-tight mb-2 mt-3 sm:mt-4"
              style={{ fontSize: "clamp(26px,5vw,42px)", color: C.navy }}>
              Your neighborhood has a story.
              <br /><span style={{ color: C.yellow }}>Find out what it is.</span>
            </h1>
            <p className="text-sm mb-4 font-medium" style={{ color: C.muted }}>
              Type your address to see your district, who represents you, and where the money goes.
            </p>

            <form onSubmit={handleSearch} className="mb-4">
              <div ref={searchComboRef} className="relative">
                <div className="flex rounded-full overflow-hidden"
                  style={{ boxShadow: "0 4px 24px rgba(28,37,52,0.12)", border: `1.5px solid ${C.border}` }}>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => {
                      setAddress(e.target.value);
                      setSuggestOpen(true);
                    }}
                    onFocus={() => {
                      if (suggestions.length > 0) setSuggestOpen(true);
                    }}
                    onKeyDown={onAddressKeyDown}
                    autoComplete="off"
                    aria-autocomplete="list"
                    aria-expanded={suggestOpen && suggestions.length > 0}
                    aria-controls="address-suggestions"
                    placeholder={detectedCity === "nyc" ? "e.g. 350 Jay St, Brooklyn" : "e.g. 301 W Court St, Ithaca"}
                    className="flex-1 px-6 text-base outline-none"
                    style={{ height: "56px", color: C.navy, backgroundColor: "white", minWidth: 0 }}
                  />
                  <button type="submit" disabled={searching}
                    className="flex-shrink-0 px-6 font-bold text-white hover:opacity-90 rounded-full"
                    style={{ backgroundColor: C.coral, height: "56px", fontSize: "15px" }}>
                    {searching
                      ? <span className="flex items-center gap-2">
                          <span className="inline-block w-4 h-4 rounded-full border-2 animate-spin"
                            style={{ borderColor: "rgba(255,255,255,0.35)", borderTopColor: "white" }} />
                          Searching…
                        </span>
                      : "Show me →"}
                  </button>
                </div>

                {suggestOpen && (suggestions.length > 0 || suggestLoading) && (
                  <ul
                    id="address-suggestions"
                    role="listbox"
                    className="absolute left-0 right-0 top-[calc(100%+8px)] z-50 rounded-[22px] overflow-hidden max-h-[min(320px,45vh)] overflow-y-auto"
                    style={{
                      backgroundColor: "white",
                      border: `1.5px solid ${C.border}`,
                      boxShadow: "0 12px 40px rgba(28,37,52,0.14)",
                    }}
                  >
                    {suggestLoading && suggestions.length === 0 && (
                      <li className="px-4 py-3 text-sm font-semibold animate-pulse" style={{ color: C.muted }}>
                        Looking up addresses…
                      </li>
                    )}
                    {suggestions.map((f, i) => {
                      const types = f.place_type?.length ? f.place_type.join(" · ") : "Location";
                      const active = i === suggestHighlight;
                      return (
                        <li key={f.id} role="option" aria-selected={active}
                          className="border-b last:border-b-0" style={{ borderColor: C.border }}>
                          <button
                            type="button"
                            className="w-full text-left px-4 py-3 transition-colors"
                            style={{
                              backgroundColor: active ? C.sage + "22" : "transparent",
                            }}
                            onMouseDown={(ev) => ev.preventDefault()}
                            onMouseEnter={() => setSuggestHighlight(i)}
                            onClick={() => { void pickSuggestion(f); }}
                          >
                            <div className="text-sm font-extrabold leading-snug" style={{ color: C.navy }}>{f.place_name}</div>
                            <div className="text-[11px] font-bold mt-0.5 uppercase tracking-wide" style={{ color: C.faint }}>
                              {types}
                            </div>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </form>

            <div className="flex flex-wrap gap-3 justify-center">
              {[
                `🏛 ${liveReps.length > 0 ? `${liveReps.length} real officials` : "Your officials"}`,
                "💰 Your tax breakdown",
                detectedCity === "nyc" ? "🗺 51 council districts" : "🗺 5 wards & 15 districts",
              ].map((t) => (
                <div key={t} className="px-4 py-2 rounded-full text-sm font-semibold"
                  style={{ backgroundColor: "white", color: C.muted, border: `1px solid ${C.border}` }}>
                  {t}
                </div>
              ))}
            </div>

            {searched && (
              <motion.div initial={{ opacity: 0, scale: 0.88 }} animate={{ opacity: 1, scale: 1 }}
                className="mt-5 inline-flex items-center gap-2 px-5 py-3 rounded-full font-bold text-white"
                style={{ backgroundColor: C.coral }}>
                ✓ {liveReps.length > 0 ? `Found ${liveReps.length} officials for ${searchedAddress.split(",")[0]}` : "Loading your officials…"} — scroll down
              </motion.div>
            )}

            {/* ── Nearby permit alert ──────────────────────────────────── */}
            <AnimatePresence>
              {searched && nearbyPermit && (
                <motion.button
                  key="permit-banner"
                  initial={{ opacity: 0, y: 14, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: 0.4, type: "spring", stiffness: 280, damping: 26 }}
                  onClick={() => { setPermitSheetOpen(true); addPoints(5, "Viewed permit"); }}
                  className="w-full mt-3 rounded-[20px] p-4 text-left flex items-center gap-3"
                  style={{
                    backgroundColor: "white",
                    border: `2px solid ${C.coral}44`,
                    boxShadow: `0 4px 20px ${C.coral}22`,
                  }}>
                  <div className="relative flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: C.coral + "14" }}>
                    <span className="absolute w-10 h-10 rounded-full animate-ping opacity-20"
                      style={{ backgroundColor: C.coral }} />
                    <span className="text-lg">🏗</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-extrabold leading-tight mb-0.5" style={{ color: C.coral }}>
                      Active proposal · {nearbyPermit.distanceBlocks} blocks away
                    </p>
                    <p className="text-sm font-bold leading-tight truncate" style={{ color: C.navy }}>
                      {nearbyPermit.address}
                    </p>
                    <p className="text-[11px] mt-0.5" style={{ color: "#9CA3AF" }}>
                      Comment closes in&nbsp;
                      <Countdown deadline={nearbyPermit.commentDeadline}
                        className="font-bold" style={{ color: C.coral }} />
                    </p>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="flex-shrink-0">
                    <path d="M6 3l5 5-5 5" stroke={C.coral} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </motion.button>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5"
          style={{ color: C.muted }}>
          <span className="text-xs font-semibold">Scroll to explore</span>
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
            <path d="M4 6l5 5 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </motion.div>
      </section>

      {/* ══ FOR-YOU STRIP (personalized) ════════════════════════════════ */}
      {ob && (
        <section className="px-6 py-8">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            {/* Greeting + issues */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider mb-0.5" style={{ color: C.coral }}>
                  Personalized for you
                </p>
                <h2 className="text-xl font-extrabold leading-tight" style={{ color: C.navy }}>
                  {ob.address
                    ? `Your view · ${ob.address.split(",")[0]}`
                    : `Your personalized view`}
                </h2>
              </div>
              {userPartyId && userPartyId !== "none" && (() => {
                const p = PARTIES.find((x) => x.id === userPartyId);
                return p ? (
                  <span className="px-3 py-1 rounded-full text-xs font-extrabold flex-shrink-0"
                    style={{ backgroundColor: p.color + "18", color: p.color }}>
                    {p.label}
                  </span>
                ) : null;
              })()}
            </div>

            {/* Stat cards row */}
            <div className="grid grid-cols-3 gap-3 mb-4">
              {/* Tax card */}
              <div className="rounded-[20px] p-4 flex flex-col gap-1"
                style={{ backgroundColor: C.coral + "10", border: `1.5px solid ${C.coral}22` }}>
                <span className="text-xs font-bold" style={{ color: C.coral }}>Est. taxes/yr</span>
                <span className="text-2xl font-black leading-none" style={{ color: C.navy }}>
                  {taxBreakdown
                    ? `$${Math.round(taxBreakdown.total / 1000)}k`
                    : "—"}
                </span>
                <span className="text-[10px] font-semibold leading-tight" style={{ color: "#9CA3AF" }}>
                  {taxBreakdown
                    ? `${taxBreakdown.effectiveRate}% effective rate`
                    : "Set income to see"}
                </span>
              </div>

              {/* Aligned reps card */}
              <div className="rounded-[20px] p-4 flex flex-col gap-1"
                style={{ backgroundColor: C.sky + "12", border: `1.5px solid ${C.sky}22` }}>
                <span className="text-xs font-bold" style={{ color: C.sky }}>Aligned reps</span>
                <span className="text-2xl font-black leading-none" style={{ color: C.navy }}>
                  {initLoading ? "—" : `${alignedRepCount}/${liveReps.length}`}
                </span>
                <span className="text-[10px] font-semibold leading-tight" style={{ color: "#9CA3AF" }}>
                  share your values
                </span>
              </div>

              {/* Issue matches card */}
              <div className="rounded-[20px] p-4 flex flex-col gap-1"
                style={{ backgroundColor: C.sage + "12", border: `1.5px solid ${C.sage}22` }}>
                <span className="text-xs font-bold" style={{ color: C.sage }}>Issue matches</span>
                <span className="text-2xl font-black leading-none" style={{ color: C.navy }}>
                  {initLoading ? "—"
                    : sortedPlaces.filter((p) =>
                        placeMatchedIssues(p.category, p.name, userIssues).length > 0
                      ).length}
                </span>
                <span className="text-[10px] font-semibold leading-tight" style={{ color: "#9CA3AF" }}>
                  nearby places
                </span>
              </div>
            </div>

            {/* Issue chips */}
            {userIssues.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {userIssues.map((id) => {
                  const issue = ISSUES.find((i) => i.id === id);
                  if (!issue) return null;
                  return (
                    <span key={id}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-bold"
                      style={{ backgroundColor: C.navy + "08", color: C.navy }}>
                      {issue.icon} {issue.label}
                    </span>
                  );
                })}
              </div>
            )}
          </motion.div>
        </section>
      )}

      {/* ══ WARD MAP ═════════════════════════════════════════════════════ */}
      <section id="map" className="py-14 px-6">
        <div className="mb-6">
          <motion.h2 initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.4 }}
            className="text-3xl font-extrabold" style={{ color: C.navy }}>
            {detectedCity === "nyc" ? "Your council district. 🗺" : "Your ward. Your voice. 🗺"}
          </motion.h2>
          <div className="mt-2 w-14 h-1.5 rounded-full" style={{ backgroundColor: C.coral }} />
          <p className="mt-2 text-base font-medium" style={{ color: "#6B7280" }}>
            {detectedCity === "nyc"
              ? "NYC has 51 council districts. Tap yours to explore."
              : "Ithaca has 5 wards and 15 election districts. Tap yours."}
          </p>
        </div>
        <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.5 }}
          className="max-w-xl mx-auto"
          style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.08)", borderRadius: "24px" }}>
          {detectedCity === "nyc" ? (
            <NycDistrictMap
              searchLat={searchCoords?.lat}
              searchLng={searchCoords?.lng}
            />
          ) : (
            <WardMap
              cityId={detectedCity}
              searchLat={searchCoords?.lat}
              searchLng={searchCoords?.lng}
            />
          )}
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
          {sortedUrgentCards.map((card, i) => {
            const isRelevant = userIssues.length > 0 && cardRelevanceScore(card.title, userIssues) > 0;
            return (
              <motion.div key={card.id}
                initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ delay: i * 0.09, duration: 0.4, ease: "easeOut" }}
                whileHover={{ y: -6, transition: { duration: 0.18 } }}
                className="relative flex-shrink-0 rounded-[24px] overflow-hidden cursor-pointer"
                style={{ width: "300px", height: "380px", background: card.gradient, boxShadow: isRelevant ? `0 4px 24px ${C.coral}44` : "0 4px 20px rgba(0,0,0,0.18)" }}>
                {/* Illustration */}
                <div className="absolute inset-x-0 top-0 flex items-center justify-center" style={{ height: "210px" }}>
                  <CardIcon type={card.iconType} />
                </div>
                {/* Bottom text overlay */}
                <div className="absolute inset-0"
                  style={{ background: "linear-gradient(to top,rgba(0,0,0,0.72) 0%,rgba(0,0,0,0.12) 48%,transparent 100%)" }} />
                <div className="absolute top-4 left-4 flex items-center gap-2 flex-wrap">
                  <span className="px-3 py-1.5 rounded-full text-xs font-bold text-white"
                    style={{ backgroundColor: "rgba(0,0,0,0.32)", backdropFilter: "blur(6px)" }}>{card.badge.text}</span>
                  {isRelevant && (
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-extrabold"
                      style={{ backgroundColor: C.coral, color: "white" }}>
                      ★ For you
                    </span>
                  )}
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <h3 className="text-lg font-extrabold text-white leading-snug mb-4">{card.title}</h3>
                  {card.url ? (
                    <a href={card.url} target="_blank" rel="noreferrer"
                      onClick={() => addPoints(5, "Read update")}
                      className="inline-block px-5 py-2.5 rounded-full text-sm font-bold transition-transform hover:scale-105"
                      style={{ backgroundColor: "white", color: C.navy }}>{card.cta}</a>
                  ) : (
                    <button onClick={() => addPoints(5, "Read update")}
                      className="px-5 py-2.5 rounded-full text-sm font-bold transition-transform hover:scale-105"
                      style={{ backgroundColor: "white", color: C.navy }}>{card.cta}</button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ══ SECTION 3: REPRESENTATIVES ═══════════════════════════════════ */}
      <WaveDivider fill="#EEF4F0" />
      <section id="people" className="py-14" style={{ backgroundColor: "#EEF4F0" }}>
        <div className="px-6 mb-2">
          <motion.h2 initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.4 }}
            className="text-3xl font-extrabold" style={{ color: C.navy }}>
            Who runs things around here 👥
          </motion.h2>
          <div className="mt-2 w-14 h-1.5 rounded-full" style={{ backgroundColor: C.coral }} />
          <p className="mt-2 text-base font-medium" style={{ color: C.muted }}>
            {ob && userPartyId && userPartyId !== "none" && alignedRepCount > 0
              ? `${alignedRepCount} of ${liveReps.length} officials share your party — shown first.`
              : "Most people have never heard of them. That's kind of the problem."}
          </p>
        </div>

        {/* Live indicator */}
        <div className="px-6 mb-4 flex items-center gap-2">
          <div className="pulse-dot w-2 h-2 rounded-full" style={{ backgroundColor: C.sage }} />
          <span className="text-xs font-semibold" style={{ color: C.sage }}>
            {initLoading
              ? "Loading your officials…"
              : `Live · ${liveReps.length} officials for ${(searchedAddress || NEIGHBORHOOD.address).split(",")[0]}`}
          </span>
        </div>

        <div className="flex gap-4 overflow-x-auto no-scrollbar pl-6 pr-6 pb-3 mt-4">
          {initLoading
            ? [0, 1, 2, 3].map((i) => (
                <div key={i} className="flex-shrink-0 rounded-[24px] animate-pulse bg-gray-100"
                  style={{ width: 240, height: 300 }} />
              ))
            : sortedReps.map((rep, i) => {
                const color = rep.color;
                const PARTY_COLORS: Record<string, string> = { Democratic: C.sky, Republican: C.coral, Independent: C.sage };
                const partyColor = PARTY_COLORS[rep.party] ?? "#9B59B6";
                const aligned = repIsAligned(rep.party, userPartyId);
                const repIssues = inferRepIssues(rep.recentBills ?? [], rep.role);
                const matchedIssues = repIssues.filter((id) => userIssues.includes(id));
                const hasIssueMatch = matchedIssues.length > 0;
                return (
                  <motion.div key={rep.id}
                    initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ delay: Math.min(i * 0.07, 0.5), type: "spring", stiffness: 240, damping: 22 }}
                    whileHover={{ y: -6, transition: { duration: 0.18 } }}
                    onClick={() => { setOpenLiveRepId(rep.id); addPoints(3, "Viewed official"); }}
                    className="flex-shrink-0 cursor-pointer" style={{ width: "240px" }}>
                    <div className="rounded-[24px] overflow-hidden"
                      style={{
                        backgroundColor: "white",
                        boxShadow: aligned ? `0 4px 24px ${partyColor}44` : "0 4px 24px rgba(0,0,0,0.09)",
                        outline: aligned ? `2px solid ${partyColor}44` : "none",
                      }}>
                      <div className="flex items-center justify-center relative" style={{ backgroundColor: color, height: "130px" }}>
                        <RepAvatar color={color} initials={rep.initials} size={84} photoUrl={rep.photoUrl} />
                        {aligned && (
                          <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-extrabold text-white"
                            style={{ backgroundColor: partyColor }}>
                            ★ Aligned
                          </span>
                        )}
                        {!aligned && hasIssueMatch && (
                          <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-extrabold text-white"
                            style={{ backgroundColor: C.coral }}>
                            ★ {matchedIssues.length} match{matchedIssues.length > 1 ? "es" : ""}
                          </span>
                        )}
                      </div>
                      <div className="p-5">
                        <div className="text-base font-extrabold leading-tight" style={{ color: C.navy }}>{rep.name}</div>
                        <div className="text-xs mt-1 font-medium" style={{ color: "#6B7280" }}>{rep.roleLabel}</div>
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {rep.party && (
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold"
                              style={{ backgroundColor: partyColor + "20", color: partyColor }}>
                              {rep.party}
                            </span>
                          )}
                          {rep.level && (
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold"
                              style={{ backgroundColor: C.navy + "10", color: C.navy }}>
                              {rep.level}
                            </span>
                          )}
                        </div>
                        {repIssues.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-3">
                            {repIssues.map((id) => {
                              const meta = ISSUES.find((x) => x.id === id);
                              const isMatch = userIssues.includes(id);
                              return (
                                <span key={id}
                                  className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                                  style={{
                                    backgroundColor: isMatch ? C.coral + "22" : "#F3F4F6",
                                    color: isMatch ? C.coral : "#6B7280",
                                    border: isMatch ? `1px solid ${C.coral}44` : "none",
                                  }}>
                                  {meta?.icon} {meta?.label ?? id}
                                </span>
                              );
                            })}
                          </div>
                        )}
                        <button className="mt-4 w-full py-3 rounded-full text-sm font-bold text-white hover:opacity-90"
                          style={{ backgroundColor: color }}>
                          See details →
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })
          }
        </div>
      </section>
      <WaveDivider fill="#EEF4F0" flip />

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

        {/* Big animated stat reveals */}
        <div className="grid grid-cols-2 gap-4 max-w-xl mx-auto mb-10">
          {detectedCity === "nyc" ? (
            <>
              <AnimatedStat value={1349} prefix="$" label="Public Safety / resident"   color="#E06B5A"  delay={0} />
              <AnimatedStat value={90}   prefix="$" label="Parks & Rec / resident"     color={C.sage}   delay={0.1} />
              <AnimatedStat value={289}  prefix="$" label="Sanitation / resident"      color={C.sky}    delay={0.2} />
              <AnimatedStat value={1530} prefix="$" label="Social Services / resident" color="#9B59B6"  delay={0.3} />
            </>
          ) : (
            <>
              <AnimatedStat value={1580} prefix="$" label="Public Safety / resident"  color="#E06B5A"  delay={0} />
              <AnimatedStat value={479}  prefix="$" label="Parks & Rec / resident"    color={C.sage}   delay={0.1} />
              <AnimatedStat value={862}  prefix="$" label="Public Works / resident"   color={C.sky}    delay={0.2} />
              <AnimatedStat value={383}  prefix="$" label="Community Dev / resident"  color="#9B59B6"  delay={0.3} />
            </>
          )}
        </div>

        {/* U.S. Census Bureau — ACS 5-year (Ithaca city) */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.45 }}
          className="rounded-[28px] p-6 max-w-xl mx-auto mb-10"
          style={{ backgroundColor: "white", boxShadow: "0 4px 20px rgba(0,0,0,0.07)" }}
        >
          <div className="flex items-start justify-between gap-3 mb-1">
            <h3 className="text-xl font-extrabold leading-tight" style={{ color: C.navy }}>
              {detectedCity === "nyc" ? "New York City by the numbers 📊" : "Ithaca by the numbers 📊"}
            </h3>
            <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full flex-shrink-0"
              style={{ backgroundColor: C.sage + "28", color: C.navy }}>
              Census
            </span>
          </div>
          <p className="text-sm font-medium mb-5" style={{ color: "#6B7280" }}>
            American Community Survey (5-year), {censusData?.vintage ?? 2022} — city limits. Source:{" "}
            <a href="https://data.census.gov" target="_blank" rel="noreferrer" className="underline font-bold" style={{ color: C.sky }}>
              data.census.gov
            </a>
            .
          </p>

          {censusLoading && (
            <div className="grid grid-cols-2 gap-3" aria-busy="true" aria-label="Loading Census data">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="rounded-[20px] h-24 animate-pulse" style={{ backgroundColor: "#F3F4F6" }} />
              ))}
            </div>
          )}

          {!censusLoading && censusError && (
            <div className="rounded-[20px] p-5" style={{ backgroundColor: "#FEF9F3", border: `1px solid ${C.yellow}55` }}>
              <p className="text-sm font-bold mb-1" style={{ color: C.navy }}>Couldn&apos;t load Census data</p>
              <p className="text-xs font-medium mb-4" style={{ color: "#6B7280" }}>{censusError}</p>
              <button
                type="button"
                onClick={() => loadCensus(detectedCity)}
                className="px-5 py-2.5 rounded-full text-sm font-bold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: C.coral }}
              >
                Try again
              </button>
            </div>
          )}

          {!censusLoading && !censusError && censusData && (
            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  label: "Population",
                  value: censusData.population != null ? censusData.population.toLocaleString() : "—",
                  sub: censusData.name.replace(", New York", ""),
                },
                {
                  label: "Median household income",
                  value: censusData.medianHouseholdIncome != null
                    ? `$${censusData.medianHouseholdIncome.toLocaleString()}`
                    : "—",
                  sub: "Per year",
                },
                {
                  label: "Median gross rent",
                  value: censusData.medianGrossRent != null
                    ? `$${censusData.medianGrossRent.toLocaleString()}`
                    : "—",
                  sub: "Per month",
                },
                {
                  label: "Median home value",
                  value: censusData.medianHomeValue != null
                    ? `$${censusData.medianHomeValue.toLocaleString()}`
                    : "—",
                  sub: "Owner-occupied units",
                },
              ].map((cell) => (
                <div key={cell.label} className="rounded-[20px] p-4"
                  style={{ backgroundColor: C.bg, border: `1px solid ${C.border}` }}>
                  <div className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: C.faint }}>
                    {cell.label}
                  </div>
                  <div className="text-xl font-black leading-tight" style={{ color: C.navy }}>{cell.value}</div>
                  <div className="text-[11px] font-semibold mt-1" style={{ color: C.muted }}>{cell.sub}</div>
                </div>
              ))}
              {censusData.renterSharePercent != null && (
                <div className="col-span-2 rounded-[20px] p-4"
                  style={{ backgroundColor: C.sky + "14", border: `1px solid ${C.sky}33` }}>
                  <div className="text-[10px] font-bold uppercase tracking-wide mb-1" style={{ color: C.navy }}>
                    Renter households
                  </div>
                  <div className="text-lg font-extrabold" style={{ color: C.navy }}>
                    {censusData.renterSharePercent}% of occupied housing is rented
                  </div>
                  {censusData.renterOccupied != null && censusData.ownerOccupied != null && (
                    <div className="text-xs font-medium mt-1" style={{ color: C.muted }}>
                      {censusData.renterOccupied.toLocaleString()} renters · {censusData.ownerOccupied.toLocaleString()} owners
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </motion.div>

        {/* Federal spending (USASpending.gov) */}
        <motion.div
          ref={federalBlockRef}
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.45 }}
          className="rounded-[28px] p-6 max-w-xl mx-auto mb-10"
          style={{ backgroundColor: "white", boxShadow: "0 4px 20px rgba(0,0,0,0.07)" }}
        >
          <div className="flex items-start justify-between gap-3 mb-1">
            <h3 className="text-xl font-extrabold leading-tight" style={{ color: C.navy }}>
              {detectedCity === "nyc" ? "Federal money in NYC 🇺🇸" : "Federal money in Ithaca 🇺🇸"}
            </h3>
            <span className="text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full flex-shrink-0"
              style={{ backgroundColor: C.sky + "22", color: C.navy }}>
              Live data
            </span>
          </div>
          <p className="text-sm font-medium mb-5" style={{ color: "#6B7280" }}>
            Largest federal grants with work performed in {detectedCity === "nyc" ? "New York City" : "Ithaca, NY"} (2019–2025). Source:{" "}
            <a href="https://www.usaspending.gov" target="_blank" rel="noreferrer" className="underline font-bold" style={{ color: C.sky }}>
              USAspending.gov
            </a>
            .
          </p>

          {federalLoading && (
            <div className="space-y-3" aria-busy="true" aria-label="Loading federal spending">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="rounded-[20px] h-[88px] animate-pulse" style={{ backgroundColor: "#F3F4F6" }} />
              ))}
            </div>
          )}

          {!federalLoading && federalError && (
            <div className="rounded-[20px] p-5" style={{ backgroundColor: "#FEF2F2", border: `1px solid ${C.coral}44` }}>
              <p className="text-sm font-bold mb-1" style={{ color: C.coral }}>Couldn&apos;t load federal data</p>
              <p className="text-xs font-medium mb-4" style={{ color: "#7F1D1D" }}>{federalError}</p>
              <button
                type="button"
                onClick={() => loadFederalSpending(detectedCity)}
                className="px-5 py-2.5 rounded-full text-sm font-bold text-white transition-opacity hover:opacity-90"
                style={{ backgroundColor: C.coral }}
              >
                Try again
              </button>
            </div>
          )}

          {!federalLoading && !federalError && federalRows.length === 0 && (
            <p className="text-sm font-medium py-6 text-center" style={{ color: "#9CA3AF" }}>
              No grant awards matched this search.
            </p>
          )}

          {!federalLoading && !federalError && federalRows.length > 0 && (
            <ul className="space-y-3 max-h-[min(520px,55vh)] overflow-y-auto pr-1 no-scrollbar">
              {federalRows.map((row, idx) => {
                const amount = row["Award Amount"];
                const recipient = row["Recipient Name"] ?? "—";
                const agency = row["Awarding Agency"] ?? "—";
                const subAgency = row["Awarding Sub Agency"];
                const desc = row.Description;
                const awardType = row["Award Type"];
                const awardUrl = row.generated_internal_id
                  ? `https://www.usaspending.gov/award/${row.generated_internal_id}`
                  : null;
                const stripe = [C.coral, C.sage, C.sky, C.yellow, "#9B59B6"][idx % 5];
                return (
                  <li key={`${row.internal_id ?? row["Award ID"] ?? idx}`}>
                    {awardUrl ? (
                      <a href={awardUrl} target="_blank" rel="noreferrer"
                        onClick={() => addPoints(3, "Read federal grant")}
                        className="block rounded-[20px] p-4 text-left transition-transform hover:scale-[1.01] active:scale-[0.99]"
                        style={{ backgroundColor: "#FAFAFA", border: `1px solid ${stripe}33`, boxShadow: "0 2px 12px rgba(0,0,0,0.04)" }}>
                        <FederalAwardCardInner
                          stripe={stripe}
                          amount={amount}
                          recipient={recipient}
                          agency={agency}
                          subAgency={subAgency}
                          desc={desc}
                          awardType={awardType}
                        />
                      </a>
                    ) : (
                      <div className="rounded-[20px] p-4" style={{ backgroundColor: "#FAFAFA", border: `1px solid ${stripe}33` }}>
                        <FederalAwardCardInner
                          stripe={stripe}
                          amount={amount}
                          recipient={recipient}
                          agency={agency}
                          subAgency={subAgency}
                          desc={desc}
                          awardType={awardType}
                        />
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </motion.div>

        {/* ── Income tax breakdown (personalized) ── */}
        {taxBreakdown && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }} transition={{ duration: 0.5 }}
            className="rounded-[28px] p-6 max-w-xl mx-auto mb-6"
            style={{ backgroundColor: C.navy, color: "white", boxShadow: "0 8px 32px rgba(27,42,74,0.22)" }}
          >
            <div className="flex items-start justify-between mb-1">
              <p className="text-xs font-bold uppercase tracking-wider opacity-60">Your income estimate</p>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full"
                style={{ backgroundColor: "rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.8)" }}>
                {ob?.income}
              </span>
            </div>
            <p className="text-3xl font-black mb-1">
              ~${taxBreakdown.total.toLocaleString()}
              <span className="text-base font-semibold opacity-60 ml-1">/yr total taxes</span>
            </p>
            <p className="text-sm opacity-60 mb-6">
              {taxBreakdown.effectiveRate}% effective rate · take-home ~${Math.round(taxBreakdown.takeHome / 12).toLocaleString()}/mo
            </p>

            {/* Tax bars */}
            <div className="space-y-3 mb-6">
              {[
                { label: "Federal income tax", amount: taxBreakdown.federal,  color: C.coral },
                { label: "NY state income tax", amount: taxBreakdown.stateNY, color: C.yellow },
                { label: "Social Security & Medicare", amount: taxBreakdown.fica, color: C.sky },
                { label: detectedCity === "nyc" ? "Local / NYC" : "Local / Tompkins Co.", amount: taxBreakdown.local, color: C.sage },
              ].map(({ label, amount, color }) => (
                <div key={label}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-semibold opacity-80">{label}</span>
                    <span className="font-extrabold">${amount.toLocaleString()}</span>
                  </div>
                  <div className="h-2 rounded-full w-full" style={{ backgroundColor: "rgba(255,255,255,0.1)" }}>
                    <motion.div
                      className="h-2 rounded-full"
                      style={{ backgroundColor: color }}
                      initial={{ width: 0 }}
                      whileInView={{ width: `${(amount / taxBreakdown.income) * 100}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Where local taxes go */}
            <div className="pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.12)" }}>
              <p className="text-xs font-bold uppercase tracking-wider opacity-60 mb-3">
                Your ~${taxBreakdown.local.toLocaleString()} in local taxes funds
              </p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: "🏫 Schools",      amount: taxBreakdown.localSchools },
                  { label: "🚔 Public Safety", amount: taxBreakdown.localSafety },
                  { label: "🛣️ Roads",         amount: taxBreakdown.localRoads },
                  { label: "🌳 Parks",         amount: taxBreakdown.localParks },
                ].map(({ label, amount }) => (
                  <div key={label} className="rounded-[14px] px-3 py-2.5"
                    style={{ backgroundColor: "rgba(255,255,255,0.08)" }}>
                    <p className="text-xs font-semibold opacity-70">{label}</p>
                    <p className="text-lg font-extrabold">${amount.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

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
      <WaveDivider fill="#F0EDE8" />
      <section id="help" className="py-14" style={{ backgroundColor: "#F0EDE8" }}>
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
            style={{ minHeight: "260px", background: "linear-gradient(145deg,#1E8449 0%,#0A3D1F 100%)", boxShadow: "0 4px 20px rgba(0,0,0,0.16)" }}>
            {/* Illustration */}
            <div className="absolute right-4 top-0 flex items-center justify-center" style={{ height: "100%" }}>
              <CardIcon type="volunteer" />
            </div>
            <div className="absolute inset-0"
              style={{ background: "linear-gradient(90deg,rgba(0,0,0,0.55) 0%,transparent 70%)" }} />
            <div className="relative z-10 p-6 flex flex-col justify-end" style={{ minHeight: "260px" }}>
              {detectedCity === "nyc" ? (
                <>
                  <div className="text-xs font-bold mb-1" style={{ color: "rgba(255,255,255,0.72)" }}>
                    Volunteer opportunities
                  </div>
                  <h3 className="text-2xl font-extrabold text-white leading-tight mb-3">
                    City Harvest needs food rescue volunteers this week
                  </h3>
                  <div className="flex items-center gap-4">
                    <a href="https://www.cityharvest.org/volunteer/" target="_blank" rel="noreferrer"
                      onClick={() => addPoints(10, "Volunteered!")}
                      className="px-6 py-3 rounded-full font-bold hover:scale-105 transition-transform inline-block"
                      style={{ backgroundColor: "white", color: C.coral }}>
                      Sign up →
                    </a>
                    <span className="text-xs" style={{ color: "rgba(255,255,255,0.7)" }}>
                      1.5M+ New Yorkers face food insecurity
                    </span>
                  </div>
                </>
              ) : (
                <>
                  <div className="text-xs font-bold mb-1" style={{ color: "rgba(255,255,255,0.72)" }}>
                    Most urgent this weekend
                  </div>
                  <h3 className="text-2xl font-extrabold text-white leading-tight mb-3">
                    Foodnet needs 8 more volunteers this Saturday
                  </h3>
                  <div className="flex items-center gap-4">
                    <button onClick={() => addPoints(10, "Volunteered!")}
                      className="px-6 py-3 rounded-full font-bold hover:scale-105 transition-transform"
                      style={{ backgroundColor: "white", color: C.coral }}>
                      I'll be there →
                    </button>
                    <span className="text-xs" style={{ color: "rgba(255,255,255,0.7)" }}>
                      8,000+ Tompkins residents served each year
                    </span>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </div>

        {/* Live places indicator */}
        <div className="px-6 mb-2 flex items-center gap-2">
          <div className="pulse-dot w-2 h-2 rounded-full" style={{ backgroundColor: C.sage }} />
          <span className="text-xs font-semibold" style={{ color: C.sage }}>
            {initLoading ? "Loading nearby places…" : `Live · ${livePlaces.length} places near ${(searchedAddress || NEIGHBORHOOD.city).split(",")[0]}`}
          </span>
        </div>

        <div className="px-6 grid grid-cols-2 gap-4">
          {initLoading
            ? [0, 1, 2, 3].map((i) => (
                <div key={i} className="rounded-[20px] animate-pulse bg-gray-100" style={{ height: 180 }} />
              ))
            : sortedPlaces.slice(0, 6).map((place, i) => {
                const colors = [C.sage, C.sky, C.coral, C.yellow, "#9B59B6", "#E67E22"];
                const color  = colors[i % colors.length];
                const matched = placeMatchedIssues(place.category, place.name, userIssues);
                const isMatch = matched.length > 0;
                return (
                  <motion.div key={place.id}
                    initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08, type: "spring", stiffness: 200, damping: 22 }}
                    whileHover={{ scale: 1.04, transition: { duration: 0.15 } }}
                    onClick={() => setOpenLivePlaceId(place.id)}
                    className="rounded-[20px] cursor-pointer flex flex-col justify-between"
                    style={{
                      height: 180,
                      backgroundColor: color + "18",
                      border: isMatch ? `2px solid ${color}` : `2px solid ${color}28`,
                      boxShadow: isMatch ? `0 4px 16px ${color}30` : "none",
                    }}>
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <div className="flex items-start justify-between mb-2">
                          <span className="text-3xl">{place.icon}</span>
                          {isMatch && (
                            <span className="text-[9px] font-extrabold px-2 py-0.5 rounded-full"
                              style={{ backgroundColor: color, color: "white" }}>
                              ★ For you
                            </span>
                          )}
                        </div>
                        <div className="text-sm font-extrabold leading-snug" style={{ color: C.navy }}>{place.name}</div>
                      </div>
                      <div>
                        <div className="text-xs font-semibold mt-1" style={{ color }}>{place.category}</div>
                        <div className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>
                          {place.distanceMi} away
                          {place.isOpen === true  && " · Open now"}
                          {place.isOpen === false && " · Closed"}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })
          }
        </div>

        {/* Board vacancies / civic opportunities sub-section */}
        <div className="px-6 mt-8">
          <h3 className="text-xl font-extrabold mb-1" style={{ color: C.navy }}>
            Serve your community 🏛
          </h3>
          <p className="text-sm mb-4" style={{ color: "#6B7280" }}>
            Real decisions. Real impact. No experience required.
          </p>
          <div className="space-y-3">
            {(detectedCity === "nyc"
              ? [
                  {
                    id: "nyc-cb",
                    board: "Community Board Member",
                    description: "Each of NYC's 59 community boards reviews land use, permits, and local services. Members are volunteer appointments — apply through your borough president or ask your council member to nominate you.",
                    meetingSchedule: "Monthly public hearings",
                    stipend: false,
                    contact: "nyc.gov/cau",
                    urgency: "open",
                    residencyRequired: "District resident",
                  },
                  {
                    id: "nyc-pb",
                    board: "Participatory Budgeting",
                    description: "NYC Council lets residents vote on how to spend $1M per district. Join your council member's committee to propose projects, outreach to neighbors, and help run the vote.",
                    meetingSchedule: "Fall cycle, annual",
                    stipend: false,
                    contact: "council.nyc.gov",
                    urgency: "open",
                    residencyRequired: "District resident, 11+",
                  },
                  {
                    id: "nyc-ccrb",
                    board: "Civilian Complaint Review Board",
                    description: "Independent board that investigates NYPD misconduct. Compensated member positions are filled by appointment from the Mayor and City Council — applications reviewed on a rolling basis.",
                    meetingSchedule: "Monthly + committee meetings",
                    stipend: true,
                    contact: "nyc.gov/ccrb",
                    urgency: "open",
                    residencyRequired: "NYC resident",
                  },
                ]
              : BOARD_VACANCIES
            ).map((v, i) => (
              <motion.div key={v.id}
                initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, type: "spring", stiffness: 200, damping: 22 }}
                className="bg-white rounded-[20px] p-5 flex gap-4 items-start"
                style={{ boxShadow: "0 4px 16px rgba(0,0,0,0.06)" }}>
                <div className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center font-extrabold text-sm text-white"
                  style={{ backgroundColor: C.coral }}>
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
      <WaveDivider fill="#F0EDE8" flip />

      {/* ══ SECTION 6: PULSE ═════════════════════════════════════════════ */}
      <section id="pulse" className="py-14 px-6">
        <motion.h2 initial={{ opacity: 0, x: -20 }} whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }} transition={{ duration: 0.4 }}
          className="text-3xl font-extrabold mb-2" style={{ color: C.navy }}>
          {cityConfig.name} is waking up 🌱
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
            Civic health · {cityConfig.name}
          </p>
        </div>

        {/* 3-column pulse grid */}
        <div
          className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-x-5 gap-y-10 items-start"
          aria-label="Neighborhood pulse by category"
        >
          {(detectedCity === "nyc" ? NYC_PULSE_SECTIONS : PULSE_SECTIONS).map((section, si) => (
            <div key={section.id} className="min-w-0 flex flex-col">
              <h3
                className="text-sm font-extrabold uppercase tracking-wider mb-3 pb-2 border-b-2"
                style={{ color: C.navy, borderColor: C.border }}
              >
                {section.label}
              </h3>
              <div className="space-y-2.5 flex-1">
                {section.items.map((item, i) => {
                  const ts = PULSE_TREND_STYLES[item.trend];
                  return (
                    <motion.div key={item.id}
                      initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true }}
                      transition={{ delay: si * 0.04 + i * 0.04, duration: 0.35, ease: "easeOut" }}
                      className="flex items-start gap-2.5 px-3 py-3 rounded-[14px] border-2"
                      style={{
                        backgroundColor: ts.bg,
                        borderColor: ts.border,
                        boxShadow: "0 2px 12px rgba(28,37,52,0.06)",
                      }}>
                      <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-sm"
                        style={{ backgroundColor: "rgba(255,255,255,0.85)", border: `1px solid ${ts.border}55` }}>
                        {item.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="inline-block text-[9px] font-extrabold uppercase tracking-wide px-1.5 py-0.5 rounded-full mb-1"
                          style={{ backgroundColor: ts.badgeBg, color: ts.badgeText }}>
                          {ts.badgeLabel}
                        </span>
                        <p className="text-xs font-medium leading-snug" style={{ color: C.navy }}>{item.text}</p>
                        <p className="text-[10px] mt-1 font-semibold" style={{ color: C.faint }}>{item.time}</p>
                      </div>
                      <motion.button whileHover={{ scale: 1.12 }} whileTap={{ scale: 0.88 }}
                        onClick={() => setLiked((p) => ({ ...p, [item.id]: !p[item.id] }))}
                        className="flex-shrink-0 mt-0.5" aria-label="React">
                        <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                          <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
                            fill={liked[item.id] ? ts.border : "none"}
                            stroke={liked[item.id] ? ts.border : "#D1D5DB"} strokeWidth="1.5" />
                        </svg>
                      </motion.button>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ══ LIVE REP BOTTOM SHEET ════════════════════════════════════════ */}
      <AnimatePresence>
        {openLiveRepId && openLiveRep && (
          <>
            <motion.div key="lrep-bg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setOpenLiveRepId(null)} className="fixed inset-0 z-40"
              style={{ backgroundColor: "rgba(0,0,0,0.48)" }} />
            <motion.div key="lrep-sheet"
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 32, stiffness: 320 }}
              className="fixed bottom-0 left-0 right-0 z-50 overflow-y-auto rounded-t-[32px]"
              style={{ backgroundColor: C.bg, maxHeight: "90vh", paddingBottom: "env(safe-area-inset-bottom,24px)" }}>
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 rounded-full bg-gray-200" />
              </div>
              <div className="px-6 pb-4">
                <div className="flex items-start gap-4">
                  <RepAvatar color={openLiveRep.color} initials={openLiveRep.initials} size={68} photoUrl={openLiveRep.photoUrl} />
                  <div className="flex-1">
                    <h3 className="text-xl font-extrabold" style={{ color: C.navy }}>{openLiveRep.name}</h3>
                    <p className="text-sm" style={{ color: "#6B7280" }}>{openLiveRep.role}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {openLiveRep.party && (
                        <span className="px-3 py-1 rounded-full text-xs font-bold"
                          style={{ backgroundColor: C.sageLight, color: C.coral }}>
                          {openLiveRep.party}
                        </span>
                      )}
                      <span className="px-3 py-1 rounded-full text-xs font-bold"
                        style={{ backgroundColor: "#F3F4F6", color: "#6B7280" }}>
                        {openLiveRep.level} level
                      </span>
                    </div>
                  </div>
                  <button onClick={() => setOpenLiveRepId(null)}
                    className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: "#F3F4F6" }} aria-label="Close">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M1 1l12 12M13 1L1 13" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* What they control */}
              <div style={{ height: 1, backgroundColor: "#F3F4F6" }} />
              <div className="px-6 py-5">
                <p className="text-sm font-semibold px-4 py-3 rounded-[14px]"
                  style={{ backgroundColor: "#F9FAFB", color: "#374151" }}>
                  {openLiveRep.roleLabel}
                </p>
              </div>

              {/* Core values inferred from bills + role */}
              {(() => {
                const repIssues = inferRepIssues(openLiveRep.recentBills ?? [], openLiveRep.role);
                if (repIssues.length === 0) return null;
                const matched = repIssues.filter((id) => userIssues.includes(id));
                return (
                  <>
                    <div style={{ height: 1, backgroundColor: "#F3F4F6" }} />
                    <div className="px-6 py-5">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-base font-extrabold" style={{ color: C.navy }}>Core values</h4>
                        {matched.length > 0 && (
                          <span className="px-2.5 py-1 rounded-full text-[11px] font-extrabold text-white"
                            style={{ backgroundColor: C.coral }}>
                            ★ {matched.length} match{matched.length > 1 ? "es" : ""} with you
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {repIssues.map((id) => {
                          const meta = ISSUES.find((x) => x.id === id);
                          const isMatch = userIssues.includes(id);
                          return (
                            <span key={id}
                              className="px-3 py-1.5 rounded-full text-sm font-bold"
                              style={{
                                backgroundColor: isMatch ? C.coral + "18" : "#F3F4F6",
                                color: isMatch ? C.coral : "#374151",
                                border: isMatch ? `1.5px solid ${C.coral}55` : "1.5px solid transparent",
                              }}>
                              {meta?.icon} {meta?.label ?? id}
                            </span>
                          );
                        })}
                      </div>
                      {matched.length === 0 && userIssues.length > 0 && (
                        <p className="text-xs mt-3" style={{ color: "#9CA3AF" }}>
                          No overlap with your selected issues — but they may still represent your neighborhood.
                        </p>
                      )}
                    </div>
                  </>
                );
              })()}

              {/* Real bills from OpenStates */}
              {openLiveRep.recentBills && openLiveRep.recentBills.length > 0 && (
                <>
                  <div style={{ height: 1, backgroundColor: "#F3F4F6" }} />
                  <div className="px-6 py-5">
                    <h4 className="text-base font-extrabold mb-4" style={{ color: C.navy }}>
                      Recent bills sponsored
                    </h4>
                    <div className="space-y-3">
                      {openLiveRep.recentBills.map((b, i) => (
                        <div key={b.id} className="flex items-start gap-3">
                          <div className="w-3 h-3 rounded-full flex-shrink-0 mt-1.5"
                            style={{ backgroundColor: i % 2 === 0 ? C.sky : C.sage }} />
                          <div>
                            <p className="text-xs font-bold" style={{ color: C.coral }}>{b.identifier}</p>
                            <p className="text-sm font-medium leading-snug" style={{ color: C.navy }}>{b.title}</p>
                            {b.status && (
                              <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>{b.status}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {/* Contact */}
              <div className="px-6 pb-8 pt-2 flex flex-col gap-3">
                {openLiveRep.email && (
                  <a href={`mailto:${openLiveRep.email}`}
                    className="block w-full py-4 rounded-full font-bold text-white text-center hover:opacity-90"
                    style={{ backgroundColor: C.coral }}>
                    📧 Email {openLiveRep.name.split(" ").pop()}
                  </a>
                )}
                {openLiveRep.phone && (
                  <a href={`tel:${openLiveRep.phone}`}
                    className="block w-full py-3 rounded-full font-semibold text-center"
                    style={{ backgroundColor: "#F3F4F6", color: C.navy }}>
                    📞 {openLiveRep.phone}
                  </a>
                )}
                {openLiveRep.url && (
                  <a href={openLiveRep.url} target="_blank" rel="noreferrer"
                    className="block w-full py-3 rounded-full font-semibold text-center"
                    style={{ backgroundColor: "#F3F4F6", color: C.navy }}>
                    🌐 Official website
                  </a>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ══ LIVE PLACE BOTTOM SHEET ══════════════════════════════════════ */}
      <AnimatePresence>
        {openLivePlaceId && openLivePlace && (
          <>
            <motion.div key="lplace-bg" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setOpenLivePlaceId(null)} className="fixed inset-0 z-40"
              style={{ backgroundColor: "rgba(0,0,0,0.48)" }} />
            <motion.div key="lplace-sheet"
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
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{openLivePlace.icon}</span>
                      <span className="px-3 py-1 rounded-full text-xs font-bold"
                        style={{ backgroundColor: openLivePlace.isOpen === true ? C.sageLight : openLivePlace.isOpen === false ? "#FEF3F2" : "#F3F4F6",
                                 color: openLivePlace.isOpen === true ? "#2E7D52" : openLivePlace.isOpen === false ? "#B91C1C" : "#6B7280" }}>
                        {openLivePlace.isOpen === true ? "Open now" : openLivePlace.isOpen === false ? "Closed" : "Hours unknown"}
                      </span>
                    </div>
                    <h3 className="text-xl font-extrabold" style={{ color: C.navy }}>{openLivePlace.name}</h3>
                    <p className="text-sm mt-1" style={{ color: "#6B7280" }}>
                      {openLivePlace.address} · {openLivePlace.distanceMi}
                    </p>
                    {openLivePlace.rating && (
                      <p className="text-xs mt-1 font-semibold" style={{ color: C.yellow }}>
                        ★ {openLivePlace.rating.toFixed(1)}
                      </p>
                    )}
                  </div>
                  <button onClick={() => setOpenLivePlaceId(null)}
                    className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ backgroundColor: "#F3F4F6" }} aria-label="Close">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <path d="M1 1l12 12M13 1L1 13" stroke="#6B7280" strokeWidth="2" strokeLinecap="round" />
                    </svg>
                  </button>
                </div>
                <a href={`https://maps.google.com/?q=${encodeURIComponent(openLivePlace.name + " " + openLivePlace.address)}`}
                  target="_blank" rel="noreferrer"
                  className="block mb-3 w-full py-4 rounded-full font-bold text-white text-center hover:opacity-90"
                  style={{ backgroundColor: C.coral }}>
                  🗺 Get directions
                </a>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ══ PROFILE SHEET ════════════════════════════════════════════════ */}
      <AnimatePresence>
        {profileOpen && userProfile && (
          <ProfileSheet profile={userProfile} onClose={() => setProfileOpen(false)} />
        )}
      </AnimatePresence>

      {/* ══ PERMIT / CIVIC-ACTION SHEET ══════════════════════════════════ */}
      <AnimatePresence>
        {permitSheetOpen && nearbyPermit && (
          <PermitBottomSheet
            permit={nearbyPermit}
            userIssues={userIssues}
            userName={session?.user?.name ?? userProfile?.name ?? ""}
            onClose={() => setPermitSheetOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* ══ CIVIC SCORE BAR ══════════════════════════════════════════════ */}
      <CivicScoreBar score={civicScore} toast={civicToast} />

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
