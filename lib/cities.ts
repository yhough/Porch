// ─── City configuration ────────────────────────────────────────────────────────
export type CityId = "ithaca" | "nyc";

export interface PulseItem {
  id: string;
  icon: string;
  text: string;
  time: string;
  color: string;
}

export interface UrgentCard {
  id: string;
  gradient: string;
  iconType: string;
  badge: { text: string; bg: string };
  title: string;
  cta: string;
  url: string;
}

export interface CityConfig {
  id: CityId;
  name: string;                          // "City of Ithaca" | "New York City"
  displayName: string;                   // short label for UI
  state: string;
  center: [number, number];              // [lng, lat]
  districtLabel: string;                 // "Ward" | "Council District"
  districtCount: number;
  districtProp: string;                  // GeoJSON property key for district number
  geoJsonApiPath: string;                // internal API path to fetch GeoJSON
  colors: string[];                      // per-district or cycling palette
  getColor: (districtNum: number) => string;
  meetingsApiPath: string;
  permitsApiPath: string;
  pulseItems: PulseItem[];
  urgentCards: UrgentCard[];
}

// ─── Color palettes ───────────────────────────────────────────────────────────
const ITHACA_COLORS = ["#E8513A", "#F5C842", "#4CAF82", "#5BA4CF", "#9B59B6"];
const NYC_PALETTE   = [
  "#E8513A", "#F5C842", "#4CAF82", "#5BA4CF", "#9B59B6",
  "#E67E22", "#1ABC9C", "#E74C3C", "#3498DB", "#2ECC71",
];

// ─── City: Ithaca ─────────────────────────────────────────────────────────────
const ITHACA: CityConfig = {
  id: "ithaca",
  name: "City of Ithaca",
  displayName: "Ithaca",
  state: "NY",
  center: [-76.4969, 42.4440],
  districtLabel: "Ward",
  districtCount: 5,
  districtProp: "ward",
  geoJsonApiPath: "/ithaca-election-districts.geojson",
  colors: ITHACA_COLORS,
  getColor: (n) => ITHACA_COLORS[(n - 1) % ITHACA_COLORS.length],
  meetingsApiPath: "/api/ithaca/meetings",
  permitsApiPath: "/api/permits",
  pulseItems: [
    { id: "i1", icon: "🏗", text: "309 College Ave: 8-story, 77-unit mixed-use building proposed — old fire station to be demolished", time: "Apr 28, 2026", color: "#5BA4CF" },
    { id: "i2", icon: "📜", text: "Charter Revision Commission proposes moving Ithaca elections to even years and giving Common Council budget levy authority", time: "Apr 16, 2026", color: "#9B59B6" },
    { id: "i3", icon: "🏠", text: "IURA adopts 2026 HUD Action Plan — $1.17M for affordable housing, Ross House (10 units for homeless), and youth housing scholarships", time: "Apr 23, 2026", color: "#4CAF82" },
    { id: "i4", icon: "⚖️", text: "City Council Code of Conduct adopted and Ethics Advisory Board holds inaugural meeting", time: "Apr 22–27, 2026", color: "#F5C842" },
    { id: "i5", icon: "🚧", text: "Seneca Street Parking Garage closed indefinitely — 1973 structure exceeded its lifespan, redevelopment planned", time: "Apr 10, 2026", color: "#E8513A" },
    { id: "i6", icon: "💰", text: "Ithaca awarded $10 million NYS Downtown Revitalization Initiative grant for MLK Jr. St corridor", time: "Apr 2026", color: "#4CAF82" },
    { id: "i7", icon: "🏘", text: "Citywide PUD public hearing held — major zoning rewrite and affordable housing alignment underway", time: "Apr 15, 2026", color: "#5BA4CF" },
    { id: "i8", icon: "⚡", text: "Tompkins Green Energy Network (T-GEN) launched — community clean energy now available for Ithaca residents", time: "Q1 2026", color: "#6B7280" },
  ],
  urgentCards: [
    { id: "u1", gradient: "linear-gradient(145deg,#D35400 0%,#7B241C 100%)", iconType: "garage",       badge: { text: "🚨 Closed",         bg: "#5A8060" }, title: "Seneca Street Garage shut indefinitely — safety concerns. Use Green St or Cayuga St instead.",          cta: "Read update →",    url: "https://www.cityofithacany.gov/CivicAlerts.aspx?AID=1402" },
    { id: "u2", gradient: "linear-gradient(145deg,#1A6FA0 0%,#0D3B59 100%)", iconType: "construction", badge: { text: "🏗 New Proposal",  bg: "#7B9BAF" }, title: "309 College Ave: 8-story, 77-unit mixed-use proposed for Collegetown — old fire station to be demolished.", cta: "Planning Board →",  url: "https://www.cityofithaca.org/DocumentCenter/Index/1966" },
    { id: "u3", gradient: "linear-gradient(145deg,#7D3C98 0%,#4A235A 100%)", iconType: "vote",         badge: { text: "📜 Charter Vote",  bg: "#9B59B6" }, title: "Charter Revision Commission proposes moving city elections to even years — major governance change up for vote.", cta: "See changes →",   url: "https://www.cityofithacany.gov/AgendaCenter" },
    { id: "u4", gradient: "linear-gradient(145deg,#1E8449 0%,#0E5733 100%)", iconType: "housing",      badge: { text: "🏠 $1.17M Housing", bg: "#4CAF82" }, title: "IURA approves 2026 HUD Action Plan: $1.17M for affordable housing, homelessness services & community dev.", cta: "View plan →",      url: "https://www.cityofithacany.gov/AgendaCenter" },
    { id: "u5", gradient: "linear-gradient(145deg,#B7770D 0%,#784212 100%)", iconType: "council",      badge: { text: "🚦 Council Vote",  bg: "#C4A878" }, title: "Common Council weighing Home Rule Requests for school speed zones and red light cameras citywide.",      cta: "Attend meeting →", url: "https://www.youtube.com/@CityofIthacaPublicMeetings" },
  ],
};

// ─── City: New York City ──────────────────────────────────────────────────────
const NYC: CityConfig = {
  id: "nyc",
  name: "New York City",
  displayName: "NYC",
  state: "NY",
  center: [-74.0060, 40.7128],
  districtLabel: "Council District",
  districtCount: 51,
  districtProp: "CounDist",
  geoJsonApiPath: "/api/nyc/geojson",
  colors: NYC_PALETTE,
  getColor: (n) => NYC_PALETTE[(n - 1) % NYC_PALETTE.length],
  meetingsApiPath: "/api/nyc/meetings",
  permitsApiPath: "/api/nyc/permits",
  pulseItems: [
    { id: "n1", icon: "🚗", text: "Congestion pricing now charging $9 for passenger cars entering Manhattan below 60th St — MTA using revenue for capital program", time: "Jan 2025", color: "#E8513A" },
    { id: "n2", icon: "🏘", text: "City of Yes for Housing Opportunity passed — NYC's largest upzoning in decades, adding transit-oriented and ADU housing citywide", time: "Dec 2024", color: "#4CAF82" },
    { id: "n3", icon: "💰", text: "NYC FY2026 budget adopted at $114.5B — public education, housing, and shelter services top spending categories", time: "Jun 2025", color: "#F5C842" },
    { id: "n4", icon: "🌱", text: "Local Law 97 carbon caps: first building fines assessed in 2025 — larger buildings must cut emissions or pay $268/ton over limit", time: "2025", color: "#4CAF82" },
    { id: "n5", icon: "🚇", text: "MTA Canarsie Tunnel repairs complete — L train fully restored after $800M flood remediation project", time: "2025", color: "#5BA4CF" },
    { id: "n6", icon: "⚖️", text: "Adams administration: ongoing federal investigation, deputy mayors managing day-to-day city operations", time: "2025–2026", color: "#9B59B6" },
    { id: "n7", icon: "🏗", text: "NYCHA RAD conversion accelerating — public housing units transitioning to Section 8 platform for capital repairs", time: "2025–2026", color: "#E67E22" },
    { id: "n8", icon: "🗳", text: "NYC mayoral primary 2025: open race, ranked-choice voting, multiple candidates from all five boroughs", time: "Jun 2025", color: "#5BA4CF" },
  ],
  urgentCards: [
    { id: "n-u1", gradient: "linear-gradient(145deg,#148F77 0%,#0A5745 100%)", iconType: "zoning",      badge: { text: "🏘 Zoning Change",  bg: "#4CAF82" }, title: "City of Yes upzoning now in effect — transit zones, ADUs, and office-to-residential conversions citywide.",             cta: "Find your zone →",     url: "https://zola.planning.nyc.gov/" },
    { id: "n-u2", gradient: "linear-gradient(145deg,#1A6FA0 0%,#0D3B59 100%)", iconType: "community",   badge: { text: "🗳 59 districts",    bg: "#5BA4CF" }, title: "Community Board meetings this month — each of 59 boards hears public comment on land use, permits, and services.", cta: "Find your board →",    url: "https://www.nyc.gov/site/manhattancb1/index.page" },
    { id: "n-u3", gradient: "linear-gradient(145deg,#C0392B 0%,#7B241C 100%)", iconType: "transit",     badge: { text: "🚗 $9 toll active",  bg: "#E8513A" }, title: "Congestion pricing toll active below 60th St in Manhattan — credits available for low-income drivers.",               cta: "Check exemptions →",   url: "https://congestionreliefzone.mta.info/" },
    { id: "n-u4", gradient: "linear-gradient(145deg,#1E8449 0%,#0E5733 100%)", iconType: "climate",     badge: { text: "🌱 LL97 fines",      bg: "#4CAF82" }, title: "Local Law 97 carbon fines issued — does your building comply? Check emissions status before 2026 deadline.",           cta: "Check your building →", url: "https://www.nyc.gov/site/buildings/index.page" },
  ],
};

// ─── Exports ─────────────────────────────────────────────────────────────────
export const CITY_CONFIGS: Record<CityId, CityConfig> = { ithaca: ITHACA, nyc: NYC };

/** Detect city from a Mapbox geocoding feature. */
export function detectCity(feature: { place_name?: string; context?: { id?: string; text?: string }[] } | null): CityId {
  if (!feature) return "ithaca";
  const name = (feature.place_name ?? "").toLowerCase();
  const ctx  = (feature.context ?? []).map(c => (c.text ?? "").toLowerCase());

  if (
    name.includes("brooklyn") ||
    name.includes("bronx") ||
    name.includes("queens") ||
    name.includes("staten island") ||
    name.includes("manhattan") ||
    name.includes("new york, new york") ||
    name.includes(", ny 1") && (
      ctx.includes("new york") || name.match(/\bnyc\b/) !== null
    ) ||
    ctx.some(t => t === "new york city" || t === "new york county" ||
                  t === "kings county" || t === "queens county" ||
                  t === "bronx county" || t === "richmond county")
  ) return "nyc";

  return "ithaca";
}

/** NYC borough from council district number. */
export function nycBorough(district: number): string {
  if (district >= 1  && district <= 10) return "Manhattan";
  if (district >= 11 && district <= 18) return "Bronx";
  if (district >= 19 && district <= 34) return "Queens";
  if (district >= 35 && district <= 48) return "Brooklyn";
  if (district >= 49 && district <= 51) return "Staten Island";
  return "NYC";
}
