# Porch

**Your neighborhood has a story. Find out what it is.**

Porch is a mobile-first civic dashboard that connects residents to the decisions, officials, and money shaping their neighborhood — right now. Type an address, and Porch tells you who represents you, where your tax dollars go, what permits are active nearby, and how to get involved.

---

## What it does

### Address-first experience
Every section of the app is anchored to a real address. Type yours into the hero search bar and Porch detects your city, geocodes the location, and loads city-specific data for everything below: your council district, your elected officials, nearby permits, federal grants in your area, and volunteer opportunities.

### Multi-city support
Porch currently supports two cities with full feature parity:

- **Ithaca, NY** — 5 wards, Common Council, Tompkins County
- **New York City** — 51 council districts, all five boroughs, NYC DOB permits, congestion pricing, Local Law 97

City detection is automatic based on the searched address. All APIs, maps, tax breakdowns, and civic content switch instantly.

### District map
- **Ithaca**: Custom SVG projection map rendering GeoJSON ward boundaries with pan/zoom, ward labels, and a search marker
- **NYC**: Leaflet.js map with CARTO light tiles, all 51 council district boundaries from the official NYC ArcGIS REST service, district number pin labels at official coordinates (sourced from `council.nyc.gov/map-widget`), and click-to-popup with council member name and direct link

### Elected officials
Live data from the **Open States v3 API** for state legislators. Displays party alignment, recent bills, inferred issue positions, and contact info. Officials are sorted by alignment with the user's stated party and issues from onboarding.

### Nearby permits & civic actions
- **Ithaca**: Local JSON data (`data/permits.json`) with haversine distance filtering
- **NYC**: Live from the **NYC DOB permit issuances dataset** (Socrata open data, `data.cityofnewyork.us`) — filters for New Building, Major Alteration, and Demolition permits within ~0.5 miles using a bounding box query, then re-sorted by exact haversine distance

Each permit opens a bottom sheet with plain-English explanation, "why it matters" angles across housing/transit/environment/economics, a public comment countdown, a vote date timer, and a link to the official DOB/city portal.

### Census snapshot
**ACS 5-year estimates** via the Census Bureau API. Displays population, median household income, median home value, median gross rent, owner/renter split, and renter share percentage. Ithaca uses place code `38077`; NYC uses `51000` (state `36` for both).

### Federal spending
**USASpending.gov `spending_by_award` API** — shows the 12 largest federal grants flowing into your city, sorted by dollar amount. Ithaca filters by `city: Ithaca`; NYC by `city: New York`. Clicking a grant opens the official USASpending award page.

### Tax breakdown
Interactive rent slider that estimates how a household's tax dollars are allocated across federal, NY state, FICA, and local taxes — computed from 2024 federal brackets, NY state brackets, and Tompkins County / NYC local rates. Displayed as an animated radial chart.

### Pulse feed
City-specific news items organized into a 3-column category grid (Education, Infrastructure, Housing, Governance, Environment, Economy). Each city has its own set of pulse items with live dates and source links.

### Volunteer & community resources
Nearby food banks, shelters, community centers, legal aid, and other civic organizations surfaced via the **Google Places API**. The volunteer hero card links to city-specific organizations (Foodnet in Ithaca, City Harvest in NYC).

### Civic engagement score
A gamified progress bar that rewards real engagement actions:

| Action | Points |
|---|---|
| Search your address | +5 |
| Click a card update link | +5 |
| Open a permit sheet | +5 |
| Click a volunteer sign-up | +10 |
| View an official's profile | +3 |
| Click a federal grant | +3 |

Six levels: Observer → Informed → Active Resident → Engaged Citizen → Community Advocate → Community Leader. Score persists in `localStorage`. A toast pops up from the progress bar each time points are earned.

### Authentication
NextAuth.js with a credential provider backed by a local `data/users.json` file and `bcryptjs` password hashing. New users are prompted through an onboarding flow (issues, party, income, address, age) that personalizes the entire dashboard.

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS + inline design tokens |
| Animation | Framer Motion |
| Maps (Ithaca) | Custom SVG projection (no dependencies) |
| Maps (NYC) | Leaflet.js + CARTO light tiles |
| Geocoding | Mapbox Geocoding API v5 |
| Auth | NextAuth.js v4 |
| Charts | Recharts |
| Icons | Custom inline SVG |

### External APIs

| API | Used for |
|---|---|
| Mapbox Geocoding | Address autocomplete, lat/lng resolution, city detection |
| Open States v3 | State legislators by lat/lng |
| Census ACS 5-year | Population, income, housing stats |
| USASpending.gov | Federal grants and awards |
| NYC DOB (Socrata) | Building permits (New Building, Alteration, Demolition) |
| NYC ArcGIS REST | Council district GeoJSON boundaries |
| Google Places | Nearby civic organizations and resources |

---

## Getting started

### Prerequisites
- Node.js 18+
- npm

### 1. Clone and install

```bash
git clone <repo-url>
cd Porch
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env.local` and fill in your keys:

```bash
cp .env.example .env.local
```

```env
# Required
NEXT_PUBLIC_MAPBOX_TOKEN=pk.your_mapbox_token_here
CENSUS_API_KEY=your_census_api_key_here
NEXTAUTH_SECRET=any_random_string_at_least_32_chars
NEXTAUTH_URL=http://localhost:3000

# Optional — app works without these but features degrade gracefully
OPEN_STATES_API_KEY=your_open_states_key_here
PLACES_API_KEY=your_google_places_key_here
NYC_OPEN_DATA_TOKEN=your_socrata_app_token_here
```

**Where to get keys:**
- **Mapbox**: [mapbox.com](https://mapbox.com) — free tier covers development
- **Census**: [api.census.gov/data/key_signup.html](https://api.census.gov/data/key_signup.html) — free
- **Open States**: [openstates.org/accounts/signup](https://openstates.org/accounts/signup) — free tier
- **Google Places**: [console.cloud.google.com](https://console.cloud.google.com) — Places API (New)
- **NYC Open Data**: [data.cityofnewyork.us](https://data.cityofnewyork.us) — app token increases rate limits, not required

### 3. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You'll be redirected to `/signin`. Create an account at `/signup` and complete onboarding.

### Vercel / production

NextAuth will log **`[NO_SECRET]`** and return **500** on `/api/auth/*` if no secret is set when `NODE_ENV=production`.

1. In Vercel: **Project → Settings → Environment Variables**, add:
   - **`NEXTAUTH_SECRET`** — generate locally with `openssl rand -base64 32` (at least 32 characters). Apply to **Production** (and Preview if you use auth there).
   - **`NEXTAUTH_URL`** — your public URL with no trailing slash, e.g. `https://your-app.vercel.app` or your custom domain. Set at least for **Production**.
2. Optional alias: you can use **`AUTH_SECRET`** instead of `NEXTAUTH_SECRET` (same value); the app reads either.
3. Add any other keys from `.env.example` (Mapbox, Census, etc.) the same way.
4. **Redeploy** (Deployments → … → Redeploy) so new variables are picked up.

---

## Project structure

```
app/
  page.tsx                  # Main dashboard (single-page, ~2900 lines)
  layout.tsx
  onboarding/               # Multi-step onboarding flow
  signin/ signup/           # Auth pages
  api/
    auth/                   # NextAuth route handler
    census/                 # ACS 5-year proxy
    federal-spending/       # USASpending.gov proxy
    legislators/            # Open States proxy
    permits/                # Ithaca permit data + haversine filter
    places/                 # Google Places proxy
    nyc/
      permits/              # NYC DOB Socrata live query
      geojson/              # NYC council district GeoJSON proxy
      meetings/             # NYC council meetings
    civic/                  # Civic comment/engagement endpoints
    user/                   # Profile and onboarding persistence

components/
  WardMap.tsx               # SVG projection map (Ithaca wards + NYC fallback)
  NycDistrictMap.tsx        # Leaflet map for all 51 NYC council districts
  SessionProvider.tsx

lib/
  cities.ts                 # CityConfig, UrgentCard, PulseItem types + Ithaca/NYC data
  personalization.ts        # Tax calculations, rep alignment, issue inference
  mockData.ts               # Ithaca local officials, board vacancies, neighborhood constants
  onboardingData.ts         # Issues list, party options
  auth.ts                   # NextAuth config
  users.ts                  # User CRUD against data/users.json

data/
  permits.json              # Ithaca permit data (scraped)
  users.json                # Local user store
  civic.json                # Civic engagement records
```

---

## Challenges

### Making location search work across cities
The original implementation used Mapbox's `bbox` parameter to restrict geocoding results to a bounding box around Ithaca. This silently excluded every NYC address from results — the search box would accept input and spin but never resolve. The fix was to switch from `bbox` (a hard geographic filter) to `proximity` (a ranking bias), so Ithaca searches still rank first when ambiguous, but any valid US address resolves correctly.

### Stale webpack chunk cache causing runtime crashes
After making multiple simultaneous file changes, Next.js's compiled module IDs would desync from the on-disk `.next` cache. The symptom was a runtime `TypeError: __webpack_modules__[moduleId] is not a function` — the app loaded but immediately crashed. This happened twice during development and both times required a full `rm -rf .next` to resolve. No code change can fix it; the cache just needs to be rebuilt clean.

### Leaflet in Next.js App Router (SSR incompatibility)
Leaflet directly accesses `window` and `document` on import, which throws during server-side rendering in Next.js. The fix is two-part: wrap the component in `dynamic(() => import(...), { ssr: false })` at the call site, and move the `import("leaflet")` call inside a `useEffect` so it only runs in the browser. The default marker icon path also breaks under webpack because Leaflet resolves it at build time — required manually overriding `_getIconUrl` and setting absolute unpkg CDN URLs for the marker images.

### Extracting NYC council data from the official widget
The NYC Council's map widget (`council.nyc.gov/map-widget`) doesn't expose a public API — it's a WordPress page with inline JavaScript. We needed district label coordinates and council member names for all 51 districts. The approach was to `curl` the page source, parse the embedded JavaScript object (`districtLabelCoordinates` and `popupData.MemberN`), and hardcode the extracted values into `NycDistrictMap.tsx`. This makes the data stable (it doesn't break if the widget changes) but requires a manual update when council members change after elections.

### City-aware data fetching without redundant re-fetches
The census and federal spending sections need to re-fetch when the user searches a different city, but shouldn't re-fetch on every render or when the section scrolls into view after an initial load. Using a simple boolean `started` ref wasn't enough because the city could change after the first fetch. The solution was a `lastFetchedCity` ref that tracks which city the data was last loaded for — a new fetch only triggers when `detectedCity !== lastFetchedCity.current`.

### Designing without real photos
Early versions used Unsplash CDN URLs as card backgrounds. The constraint to remove all external photos pushed toward a more intentional visual system: per-card gradients derived from the design token palette, paired with purpose-built inline SVG illustrations (10 types: garage, construction, vote, housing, council, zoning, community, transit, climate, volunteer). The SVG approach ended up being more cohesive with the app's design language than photos were.

### Personalizing a single-page dashboard
The dashboard needs to feel relevant to both a first-time visitor and someone who has completed onboarding and stated specific issues and a party affiliation. The solution was a scoring layer (`lib/personalization.ts`) that runs silently over all content — urgent cards are re-sorted by relevance score, aligned officials are surfaced first, issue-matched places get a highlight border, and tax breakdowns use the actual income from the user's profile. The same data serves everyone; personalization is a presentation layer on top.

---

## License

MIT
