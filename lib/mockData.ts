// ─── Mapbox token ─────────────────────────────────────────────────────────────
export const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

// ─── Neighborhood identity ─────────────────────────────────────────────────────
// Source: City of Ithaca official records
export const NEIGHBORHOOD = {
  name: "City of Ithaca",
  city: "Ithaca, NY",
  center: [-76.4969, 42.4440] as [number, number], // [lng, lat]
  address: "108 E Green St, Ithaca, NY 14850",      // City Hall
  wards: 5,
  electionDistricts: 15,
};

// ─── Ward descriptions ────────────────────────────────────────────────────────
// Source: City of Ithaca election district GeoJSON (2023)
export const ITHACA_WARDS = [
  { ward: 1, name: "Ward 1", description: "Downtown & Southside",  color: "#E8513A", legDist: "1"   },
  { ward: 2, name: "Ward 2", description: "West Hill & Heights",   color: "#F5C842", legDist: "2-3" },
  { ward: 3, name: "Ward 3", description: "South Hill & East Hill",color: "#4CAF82", legDist: "1,3" },
  { ward: 4, name: "Ward 4", description: "Cornell & Northeast",   color: "#5BA4CF", legDist: "4"   },
  { ward: 5, name: "Ward 5", description: "Fall Creek & Inlet",    color: "#9B59B6", legDist: "2,5" },
];

// ─── 2026 board/committee meeting schedule ────────────────────────────────────
// Source: Town of Ithaca "2026 Public Meetings Schedule and Notice to the Media"
export const MEETINGS_2026 = [
  {
    id: "tb",
    name: "Town Board",
    abbrev: "TB",
    location: "215 N Tioga St, Ithaca",
    schedule: "2nd Monday @ 5:30pm · 4th Monday @ 4:30pm",
    zoomId: "989 1095 8241",
    zoomUrl: "https://zoom.us/j/98910958241",
    youtubeUrl: "https://www.youtube.com/@TownofIthacaVideo",
    notes: "Year-end meeting Dec 30 @ 11am. No meeting May 25 (Memorial Day). Oct 5 moved up.",
    color: "#E8513A",
  },
  {
    id: "pb",
    name: "Planning Board",
    abbrev: "PB",
    location: "215 N Tioga St, Ithaca",
    schedule: "1st & 3rd Tuesday @ 6:30pm",
    zoomId: "836 4376 4382",
    zoomUrl: "https://zoom.us/j/83643764382",
    notes: "Jan 6 canceled. Nov 3 canceled (Election Day).",
    color: "#4CAF82",
  },
  {
    id: "zba",
    name: "Zoning Board of Appeals",
    abbrev: "ZBA",
    location: "215 N Tioga St, Ithaca",
    schedule: "4th Tuesday @ 6:00pm",
    zoomId: "852 5587 1576",
    zoomUrl: "https://zoom.us/j/85255871576",
    notes: "Exceptions: Oct 13, Nov 10, Dec 8.",
    color: "#F5C842",
  },
  {
    id: "coc",
    name: "Codes & Ordinances Committee",
    abbrev: "COC",
    location: "215 N Tioga St, Ithaca",
    schedule: "3rd Thursday @ 5:30pm",
    zoomId: "875 3139 3743",
    zoomUrl: "https://zoom.us/j/87531393743",
    notes: "Chair: Susie Gutenberger-Fitzpatrick. Reviewing subdivision land regulations in 2026.",
    color: "#5BA4CF",
  },
  {
    id: "cb",
    name: "Conservation Board",
    abbrev: "CB",
    location: "215 N Tioga St, Ithaca",
    schedule: "1st Thursday @ 4:00pm",
    zoomId: "675 059 3272",
    zoomUrl: "https://zoom.us/j/6750593272",
    notes: "Jan 15 at 5:30pm. Open to the public — looking for new members.",
    color: "#4CAF82",
  },
  {
    id: "ag",
    name: "Agriculture Committee",
    abbrev: "AG",
    location: "215 N Tioga St, Ithaca (Aurora Conference Room)",
    schedule: "Quarterly: Mar 31, Jul 28, Nov 24 @ 6pm",
    zoomId: "675 059 3272",
    zoomUrl: "https://zoom.us/j/6750593272",
    notes: "Chair: Matthew Stalker (AJ Teeter Farm). Town Board Liaison: Diana Sinton.",
    color: "#F5C842",
  },
  {
    id: "pw",
    name: "Public Works Committee",
    abbrev: "PW",
    location: "114 Seven Mile Dr, Ithaca",
    schedule: "3rd Tuesday @ 9:00am",
    zoomId: "816 9520 7215",
    zoomUrl: "https://zoom.us/j/81695207215",
    notes: "",
    color: "#9B59B6",
  },
  {
    id: "pc",
    name: "Planning Committee",
    abbrev: "PC",
    location: "215 N Tioga St, Ithaca",
    schedule: "3rd Thursday @ 3:00pm",
    zoomId: "675 059 3272",
    zoomUrl: "https://zoom.us/j/6750593272",
    notes: "Reviews Green New Deal Action Plan annually.",
    color: "#E8513A",
  },
  {
    id: "bc",
    name: "Budget Committee",
    abbrev: "BC",
    location: "215 N Tioga St, Ithaca",
    schedule: "4th Monday @ noon",
    zoomId: "506 3713 554",
    zoomUrl: "https://zoom.us/j/5063713554",
    notes: "No meeting May 25 (Memorial Day).",
    color: "#5BA4CF",
  },
];

// ─── Board/committee vacancies ─────────────────────────────────────────────────
// Source: Town of Ithaca "Board and Committee Opportunities" (2026)
export const BOARD_VACANCIES = [
  {
    id: "v-pb",
    board: "Planning Board",
    description:
      "Reviews land use, development, subdivisions, site plans, and special permits. 7 regular members + 2 alternates. 7-year term for regular members.",
    meetingSchedule: "1st & 3rd Tuesday @ 6:30pm",
    stipend: true,
    residencyRequired: "Town of Ithaca",
    contact: "Town Clerk · (607) 273-1721 · prosa@town.ithaca.ny.us",
    applyUrl: "#",
    urgency: "open" as const,
  },
  {
    id: "v-zba",
    board: "Zoning Board of Appeals",
    description:
      "Quasi-judicial board ensuring zoning compliance and granting variances. 5 regular + 2 alternates. Knowledge of municipal law helpful but not required.",
    meetingSchedule: "4th Tuesday @ 6pm",
    stipend: true,
    residencyRequired: "Town of Ithaca",
    contact: "Town Clerk · (607) 273-1721 · prosa@town.ithaca.ny.us",
    applyUrl: "#",
    urgency: "open" as const,
  },
  {
    id: "v-cb",
    board: "Conservation Board",
    description:
      "Safeguards natural and scenic resources. Works with Town Board and Planning Board on environmental concerns — development projects, deer management, invasive species, water quality.",
    meetingSchedule: "1st Thursday @ 4pm",
    stipend: false,
    residencyRequired: "Town of Ithaca",
    contact: "Michael Smith, Senior Planner · (607) 273-1747 · msmith@townithacany.gov",
    applyUrl: "#",
    urgency: "looking" as const,
  },
];

// ─── Upcoming public meetings & events ───────────────────────────────────────
// Source: cityofithacany.gov/Calendar.aspx (scraped Apr 25, 2026)
// and Town of Ithaca meeting notices (Apr 2026)
export const upcomingEvents = [
  {
    id: "e0",
    type: "community",
    title: "Daffodil Dash",
    description:
      "Annual fun run through Cass Park, Ithaca Children's Garden, and surrounding areas. All ages and paces welcome.",
    attendance: "Cass Park, Ithaca",
    zoomUrl: null,
    date: new Date("2026-04-25T09:00:00"),
    location: "Cass Park, Ithaca",
  },
  {
    id: "e0b",
    type: "community",
    title: "4-H Duck Race",
    description:
      "Annual rubber duck race on the inlet. Family friendly community event benefiting local 4-H programs.",
    attendance: "Thompson Triangle Park & 615 Willow Ave",
    zoomUrl: null,
    date: new Date("2026-04-25T10:00:00"),
    location: "Thompson Triangle Park, Ithaca",
  },
  {
    id: "e0c",
    type: "community",
    title: "Big Red Marching Band Spring Concert",
    description:
      "Cornell's Big Red Marching Band performs a free outdoor spring concert on the Ithaca Commons.",
    attendance: "Ithaca Commons — free and open to all",
    zoomUrl: null,
    date: new Date("2026-04-26T12:00:00"),
    location: "Ithaca Commons",
  },
  {
    id: "e1",
    type: "meeting",
    title: "Ethics Advisory Board Meeting",
    description:
      "City of Ithaca Ethics Advisory Board regular meeting. Open to the public.",
    attendance: "Council Chambers, City Hall, 108 E Green St",
    zoomUrl: null,
    date: new Date("2026-04-27T15:30:00"),
    location: "Council Chambers, City Hall",
  },
  {
    id: "e1b",
    type: "meeting",
    title: "Town Board Study Session — Green New Deal report",
    description:
      "Sustainability Planner Hilary Swartwood presents the 2025–2026 GND Action Plan progress. Includes Fire Dept quarterly report. Consent agenda: appoint Gideon Casper to Planning Board.",
    attendance: "215 N Tioga St or Zoom · ID 989 1095 8241",
    zoomUrl: "https://zoom.us/j/98910958241",
    date: new Date("2026-04-27T16:30:00"),
    location: "Town Hall, 215 N Tioga St",
  },
  {
    id: "e2",
    type: "meeting",
    title: "Planning and Development Board Meeting",
    description:
      "City of Ithaca Planning and Development Board reviews permits, development proposals, and site plans. Public may attend and comment.",
    attendance: "City Hall 3rd Floor Council Chambers, 108 E Green St",
    zoomUrl: null,
    date: new Date("2026-04-28T18:00:00"),
    location: "City Hall, 108 E Green St",
  },
  {
    id: "e3",
    type: "meeting",
    title: "Special Committee on Wrongful Discharge & Labor Protections",
    description:
      "City Common Council special committee meeting on workplace protections. Open to the public.",
    attendance: "Council Chambers, City Hall",
    zoomUrl: null,
    date: new Date("2026-04-29T18:00:00"),
    location: "Council Chambers, City Hall",
  },
  {
    id: "e3b",
    type: "community",
    title: "LACS School Trip Bake Sale Fundraiser",
    description:
      "Local Alternative Community School fundraiser on the Ithaca Commons. Support local students and grab some treats.",
    attendance: "Ithaca Commons",
    zoomUrl: null,
    date: new Date("2026-04-30T12:45:00"),
    location: "Ithaca Commons",
  },
  {
    id: "e4",
    type: "meeting",
    title: "Codes & Ordinances Committee",
    description:
      "Review of 2026 COC work plan and continued review of revised Subdivision of Land regulations (Article VI). Public can attend.",
    attendance: "Town Hall or Zoom · ID 875 3139 3743",
    zoomUrl: "https://zoom.us/j/87531393743",
    date: new Date("2026-05-21T17:30:00"),
    location: "Town Hall, 215 N Tioga St",
  },
];

// ─── Open public comment periods ─────────────────────────────────────────────
// Source: Town of Ithaca COC memo (Apr 1, 2026) and GND action plan (Apr 27, 2026)
export const openComments = [
  {
    id: "c1",
    title: "Subdivision of Land Regulations — Codes & Ordinances Review",
    description:
      "The Codes & Ordinances Committee is reviewing all of Article VI of the Town's subdivision regulations. This shapes how land gets divided into new parcels and what developers must provide. Public may attend any COC meeting and submit written comment.",
    deadline: new Date("2026-06-19T17:30:00"),
    commentUrl: "https://www.townithacany.gov",
    urgent: false,
  },
  {
    id: "c2",
    title: "Green New Deal Action Plan 2025–2026 — Public Input",
    description:
      "Town Sustainability Planner Hilary Swartwood is taking input on the next GND action cycle. CCA launched, net-zero energy code adopted, but vehicle fleet emissions off track. Your feedback helps set 2027–2028 priorities.",
    deadline: new Date("2026-06-30T17:00:00"),
    commentUrl: "https://www.townithacany.gov",
    urgent: false,
  },
  {
    id: "c3",
    title: "South Hill Rec Way Trail Extension — Community Feedback",
    description:
      "The Town hired an engineering firm for concept design to extend the South Hill Rec Way from Burns Rd to Banks Rd. A Friends of the Trail work group meets regularly. Share what you want to see along this corridor.",
    deadline: new Date("2026-08-27T17:00:00"),
    commentUrl: "https://www.townithacany.gov",
    urgent: false,
  },
];

// ─── Recent votes / actions ────────────────────────────────────────────────────
// Source: Town of Ithaca Board resolutions and GND annual report (Apr 27, 2026)
export const recentVotes = [
  {
    id: "v1",
    title: "Net-Zero Energy Code for New Construction",
    description:
      "Town Board adopted net-zero appendices to the Ithaca Energy Code Supplement (IECS), requiring all new commercial and residential construction to achieve net-zero emissions.",
    date: "2025",
    result: "PASSED",
    aligned: true,
    votes: [{ name: "Town Board (unanimous)", yes: true }],
  },
  {
    id: "v2",
    title: "Deconstruction Resolution — Waste Reduction",
    description:
      "Town Board passed a non-binding resolution supporting deconstruction (careful disassembly of buildings for material reuse) rather than demolition. Next step: apply for CROWD technical assistance.",
    date: "Mar 2026",
    result: "PASSED",
    aligned: true,
    votes: [{ name: "Town Board", yes: true }],
  },
  {
    id: "v3",
    title: "Community Choice Aggregation (CCA) Launch",
    description:
      "Tompkins Green Energy Network (T-GEN) launched in Q1 2026 — a CCA + Own Your Power program giving residents access to regionally sourced renewable electricity.",
    date: "Q1 2026",
    result: "LAUNCHED",
    aligned: true,
    votes: [
      { name: "Town Board", yes: true },
      { name: "City of Ithaca", yes: true },
    ],
  },
  {
    id: "v4",
    title: "Planning Board Appointment — Gideon Casper",
    description:
      "Town Board voted to appoint Gideon Casper (429 Bostwick Rd) to the Planning Board, filling a vacancy from a resignation. Term runs through December 31, 2029.",
    date: "Apr 27, 2026",
    result: "APPROVED",
    aligned: true,
    votes: [{ name: "Town Board", yes: true }],
  },
];

// ─── Verified local officials ─────────────────────────────────────────────────
// These are real people with real roles and real public contact info.
// Used as the always-available layer; state + federal officials come from OpenStates API.
// Sources: cityofithacany.gov staff directory, Ithaca Voice, Tompkins Chamber (verified Apr 2026)
export const localOfficials = [
  {
    id: "local-mayor",
    name: "Robert Cantelmo",
    role: "Mayor — City of Ithaca",
    roleLabel: "Chief elected officer — leads housing, climate & economic development",
    party: "Democratic",
    phone: "(607) 274-6501",
    email: "mayoroffice@cityofithacany.gov",
    url: "https://www.cityofithacany.gov",
    photoUrl: null,
    level: "city",
    initials: "RC",
    color: "#E8513A",
    office: "Mayor, City of Ithaca",
    recentBills: [
      { id: "rc-1", identifier: "DRI Grant", title: "$10M NYS Downtown Revitalization Initiative grant secured for MLK Jr. St corridor", updatedAt: "Apr 2026", status: "Awarded", subjects: ["Economic Development", "Housing"] },
      { id: "rc-2", identifier: "Good-Cause Eviction", title: "Good-cause eviction protections adopted — prevents unjust tenant removals", updatedAt: "2024", status: "Enacted", subjects: ["Housing", "Tenant Rights"] },
      { id: "rc-3", identifier: "STR Regulation", title: "Short-term rental regulations enacted to protect housing supply", updatedAt: "2024", status: "Enacted", subjects: ["Housing", "Zoning"] },
    ],
  },
  {
    id: "local-city-manager",
    name: "Dominick Recckio",
    role: "Acting City Manager — City of Ithaca",
    roleLabel: "Runs day-to-day city operations under council-manager government",
    party: "",
    phone: "(607) 274-6511",
    email: "drecckio@cityofithacany.gov",
    url: "https://www.cityofithacany.gov",
    photoUrl: null,
    level: "city",
    initials: "DR",
    color: "#5BA4CF",
    office: "Acting City Manager, City of Ithaca",
    recentBills: [],
  },
  {
    id: "local-council-1a",
    name: "Kayla Matos",
    role: "1st Ward Alderperson",
    roleLabel: "Represents Downtown & Southside on Common Council",
    party: "Democratic",
    phone: null,
    email: null,
    url: "https://www.cityofithacany.gov",
    photoUrl: null,
    level: "city",
    initials: "KM",
    color: "#4CAF82",
    office: "Common Council, Ward 1",
    recentBills: [],
  },
  {
    id: "local-council-1b",
    name: "Jorge Defendini",
    role: "1st Ward Alderperson",
    roleLabel: "Represents Downtown & Southside on Common Council",
    party: "Democratic",
    phone: null,
    email: null,
    url: "https://www.cityofithacany.gov",
    photoUrl: null,
    level: "city",
    initials: "JD",
    color: "#4CAF82",
    office: "Common Council, Ward 1",
    recentBills: [],
  },
  {
    id: "local-council-2a",
    name: "Kris Haines-Sharp",
    role: "2nd Ward Alderperson",
    roleLabel: "Represents Fall Creek & Downtown on Common Council",
    party: "Democratic",
    phone: null,
    email: null,
    url: "https://www.cityofithacany.gov",
    photoUrl: null,
    level: "city",
    initials: "KH",
    color: "#F5C842",
    office: "Common Council, Ward 2",
    recentBills: [],
  },
  {
    id: "local-council-2b",
    name: "Joe Kirby",
    role: "2nd Ward Alderperson",
    roleLabel: "Represents Fall Creek & Downtown on Common Council",
    party: "Democratic",
    phone: null,
    email: null,
    url: "https://www.cityofithacany.gov",
    photoUrl: null,
    level: "city",
    initials: "JK",
    color: "#F5C842",
    office: "Common Council, Ward 2",
    recentBills: [],
  },
  {
    id: "local-council-3a",
    name: "David Shapiro",
    role: "3rd Ward Alderperson",
    roleLabel: "Represents South Hill & Belle Sherman on Common Council",
    party: "Democratic",
    phone: null,
    email: null,
    url: "https://www.cityofithacany.gov",
    photoUrl: null,
    level: "city",
    initials: "DS",
    color: "#9B59B6",
    office: "Common Council, Ward 3",
    recentBills: [],
  },
  {
    id: "local-council-3b",
    name: "Pat Sewell",
    role: "3rd Ward Alderperson",
    roleLabel: "Represents South Hill & Belle Sherman on Common Council",
    party: "Democratic",
    phone: null,
    email: null,
    url: "https://www.cityofithacany.gov",
    photoUrl: null,
    level: "city",
    initials: "PS",
    color: "#9B59B6",
    office: "Common Council, Ward 3",
    recentBills: [],
  },
  {
    id: "local-council-4a",
    name: "Patrick Kuehl",
    role: "4th Ward Alderperson",
    roleLabel: "Represents Collegetown & Cornell area on Common Council",
    party: "Democratic",
    phone: null,
    email: null,
    url: "https://www.cityofithacany.gov",
    photoUrl: null,
    level: "city",
    initials: "PK",
    color: "#E8513A",
    office: "Common Council, Ward 4",
    recentBills: [],
  },
  {
    id: "local-council-4b",
    name: "Robin Trumble",
    role: "4th Ward Alderperson",
    roleLabel: "Represents Collegetown & Cornell area on Common Council",
    party: "Democratic",
    phone: null,
    email: null,
    url: "https://www.cityofithacany.gov",
    photoUrl: null,
    level: "city",
    initials: "RT",
    color: "#E8513A",
    office: "Common Council, Ward 4",
    recentBills: [],
  },
  {
    id: "local-council-5a",
    name: "Margaret Fabrizio",
    role: "5th Ward Alderperson",
    roleLabel: "Represents Cayuga Heights & Cornell on Common Council",
    party: "Democratic",
    phone: null,
    email: null,
    url: "https://www.cityofithacany.gov",
    photoUrl: null,
    level: "city",
    initials: "MF",
    color: "#5BA4CF",
    office: "Common Council, Ward 5",
    recentBills: [],
  },
  {
    id: "local-council-5b",
    name: "Hannah Shvets",
    role: "5th Ward Alderperson",
    roleLabel: "Represents Cayuga Heights & Cornell on Common Council",
    party: "Democratic",
    phone: null,
    email: null,
    url: "https://www.cityofithacany.gov",
    photoUrl: null,
    level: "city",
    initials: "HS",
    color: "#5BA4CF",
    office: "Common Council, Ward 5",
    recentBills: [],
  },
  {
    id: "local-county",
    name: "Tompkins County Legislature",
    role: "Tompkins County Legislature",
    roleLabel: "Controls county budget, roads, health, and social services",
    party: "",
    phone: "(607) 274-5434",
    email: "legislature@tompkins-co.org",
    url: "https://www.tompkinscountyny.gov/legislature",
    photoUrl: null,
    level: "county",
    initials: "TC",
    color: "#F5C842",
    office: "Tompkins County Legislature",
    recentBills: [],
  },
];

// ─── Live alerts ──────────────────────────────────────────────────────────────
// Source: cityofithacany.gov news feed and calendar (scraped Apr 25, 2026)
export const alerts = [
  {
    id: "a1",
    type: "red" as const,
    title: "Seneca Street Garage is CLOSED",
    description:
      "Closed April 10 for safety — the 1973 structure exceeded its lifespan. Long-term redevelopment planning underway. Use Green Street or Cayuga Street garages instead.",
    action: "Read update",
    url: "https://www.cityofithacany.gov/CivicAlerts.aspx?AID=1402",
  },
  {
    id: "a2",
    type: "amber" as const,
    title: "Thurston Ave closed Apr 27–May 1",
    description:
      "500 block of Thurston Ave closed for asphalt repair. Detour via Waite Ave. Contact: Hank Bennett (607) 272-1718.",
    action: "See detour",
    url: "https://www.cityofithacany.gov/CivicAlerts.aspx?AID=1401",
  },
  {
    id: "a3",
    type: "green" as const,
    title: "Ithaca wins $10 million state grant",
    description:
      "NYS Downtown Revitalization Initiative awarded $10M for the MLK Jr. St / West State St corridor — new housing, business, and public spaces coming.",
    action: "Read more",
    url: "https://www.cityofithacany.gov/CivicAlerts.aspx?AID=1400",
  },
  {
    id: "a4",
    type: "blue" as const,
    title: "Planning & Development Board — April 28 @ 6pm",
    description:
      "City Hall 3rd Floor Council Chambers, 108 E Green St. Open to the public. Submit public comment at cityofithacany.gov.",
    action: "Attend or comment",
    url: "https://www.cityofithacany.gov/Calendar.aspx?EID=6566",
  },
];
