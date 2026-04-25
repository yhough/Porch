import { NextRequest, NextResponse } from "next/server";

interface ResourceEntry {
  id: string; name: string; category: string;
  lat: number; lng: number; address: string;
  hoursToday?: string; isOpenNow?: boolean | null;
  phone?: string | null; languages?: string[]; capacity?: string | null;
}

// Curated Ithaca community resources — always available, no API key required
const ITHACA_RESOURCES = [
  // ── Shelters ──────────────────────────────────────────────────────────────
  {
    id: "r1", name: "Salvation Army Ithaca Corps", category: "shelters",
    lat: 42.4360, lng: -76.5002, address: "203 N Albany St",
    hoursToday: "Mon–Fri 9am–5pm", isOpenNow: true,
    phone: "(607) 272-6963", languages: ["English", "Spanish"], capacity: "Call ahead",
  },
  {
    id: "r2", name: "Ithaca Rescue Mission", category: "shelters",
    lat: 42.4345, lng: -76.5018, address: "401 W State St",
    hoursToday: "Open 24/7", isOpenNow: true,
    phone: "(607) 273-2847", languages: ["English"], capacity: "18 beds",
  },
  {
    id: "r3", name: "Family & Children's Service", category: "shelters",
    lat: 42.4432, lng: -76.4988, address: "318 S Plain St",
    hoursToday: "Mon–Fri 8:30am–5pm", isOpenNow: true,
    phone: "(607) 273-7494", languages: ["English", "Spanish"], capacity: null,
  },

  // ── Food ──────────────────────────────────────────────────────────────────
  {
    id: "r4", name: "Loaves & Fishes", category: "food",
    lat: 42.4413, lng: -76.5092, address: "709 W Buffalo St",
    hoursToday: "Mon–Fri 11:30am–1pm", isOpenNow: true,
    phone: "(607) 273-3350", languages: ["English"], capacity: null,
  },
  {
    id: "r5", name: "Tompkins Community Action Pantry", category: "food",
    lat: 42.4338, lng: -76.4993, address: "305 S Plain St",
    hoursToday: "Mon–Fri 9am–5pm", isOpenNow: true,
    phone: "(607) 272-5063", languages: ["English", "Spanish", "Nepali"], capacity: null,
  },
  {
    id: "r6", name: "Friendship Donations Network", category: "food",
    lat: 42.4458, lng: -76.5008, address: "133 N Fulton St",
    hoursToday: "Tue & Thu 1–3pm", isOpenNow: false,
    phone: "(607) 275-9817", languages: ["English"], capacity: null,
  },

  // ── Animals ───────────────────────────────────────────────────────────────
  {
    id: "r7", name: "SPCA of Tompkins County", category: "animals",
    lat: 42.4622, lng: -76.4762, address: "1640 Hanshaw Rd",
    hoursToday: "Mon–Sat 10am–6pm", isOpenNow: true,
    phone: "(607) 257-1822", languages: ["English"], capacity: null,
  },
  {
    id: "r8", name: "SPCA Low-Cost Spay/Neuter Clinic", category: "animals",
    lat: 42.4620, lng: -76.4758, address: "1640 Hanshaw Rd",
    hoursToday: "By appointment", isOpenNow: null,
    phone: "(607) 257-1822", languages: ["English"], capacity: null,
  },

  // ── Childcare ─────────────────────────────────────────────────────────────
  {
    id: "r9", name: "Franziska Racker Centers", category: "childcare",
    lat: 42.4583, lng: -76.4825, address: "3226 Wilkins Rd",
    hoursToday: "Mon–Fri 7am–6pm", isOpenNow: true,
    phone: "(607) 272-5891", languages: ["English"], capacity: null,
  },
  {
    id: "r10", name: "Learning Web Youth Programs", category: "childcare",
    lat: 42.4428, lng: -76.4996, address: "301 W Court St",
    hoursToday: "Mon–Fri 9am–5pm", isOpenNow: true,
    phone: "(607) 273-7474", languages: ["English", "Spanish"], capacity: null,
  },
  {
    id: "r11", name: "Head Start / McGraw House", category: "childcare",
    lat: 42.4418, lng: -76.5012, address: "401 W Court St",
    hoursToday: "Mon–Fri 7:30am–5:30pm", isOpenNow: true,
    phone: "(607) 272-7960", languages: ["English", "Spanish", "Nepali"], capacity: null,
  },

  // ── Clinics ───────────────────────────────────────────────────────────────
  {
    id: "r12", name: "Cayuga Medical Center", category: "clinics",
    lat: 42.4522, lng: -76.4958, address: "101 Dates Dr",
    hoursToday: "Emergency — Open 24/7", isOpenNow: true,
    phone: "(607) 274-4011", languages: ["English", "Spanish"], capacity: null,
  },
  {
    id: "r13", name: "Planned Parenthood Ithaca", category: "clinics",
    lat: 42.4385, lng: -76.5060, address: "620 W Clinton St",
    hoursToday: "Mon–Fri 8am–5pm", isOpenNow: true,
    phone: "(607) 273-1526", languages: ["English", "Spanish"], capacity: null,
  },
  {
    id: "r14", name: "Ithaca Free Clinic", category: "clinics",
    lat: 42.4440, lng: -76.4960, address: "Ithaca, NY",
    hoursToday: "Wed evenings 6–9pm", isOpenNow: false,
    phone: null, languages: ["English", "Spanish"], capacity: "Walk-in welcome",
  },

  // ── Faith / Community orgs ────────────────────────────────────────────────
  {
    id: "r15", name: "Southside Community Center", category: "faith",
    lat: 42.4342, lng: -76.5000, address: "305 S Plain St",
    hoursToday: "Mon–Fri 9am–9pm, Sat 10am–5pm", isOpenNow: true,
    phone: "(607) 273-8364", languages: ["English", "Spanish"], capacity: null,
  },
  {
    id: "r16", name: "Greater Ithaca Activities Center (GIAC)", category: "faith",
    lat: 42.4422, lng: -76.5022, address: "301 W Court St",
    hoursToday: "Mon–Fri 7am–10pm", isOpenNow: true,
    phone: "(607) 273-8364", languages: ["English", "Spanish", "Nepali"], capacity: null,
  },
  {
    id: "r17", name: "First Baptist Community Outreach", category: "faith",
    lat: 42.4446, lng: -76.5005, address: "309 N Albany St",
    hoursToday: "Sun 10am; see website for events", isOpenNow: null,
    phone: "(607) 272-1478", languages: ["English"], capacity: null,
  },
];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = parseFloat(searchParams.get("lat") ?? "42.4440");
  const lng = parseFloat(searchParams.get("lng") ?? "-76.4969");
  const key = process.env.PLACES_API_KEY;

  if (!key) {
    return NextResponse.json({ resources: ITHACA_RESOURCES, source: "curated" });
  }

  // Google Places nearbysearch — augments curated data when API key is present
  const TYPE_MAP: Record<string, string> = {
    lodging: "shelters", food: "food", church: "faith",
    veterinary_care: "animals", school: "childcare", hospital: "clinics",
  };

  const liveResults: ResourceEntry[] = [];

  await Promise.allSettled(
    Object.keys(TYPE_MAP).map(async (type) => {
      try {
        const url =
          `https://maps.googleapis.com/maps/api/place/nearbysearch/json` +
          `?location=${lat},${lng}&radius=3000&type=${type}&key=${key}`;
        const res = await fetch(url);
        if (!res.ok) return;
        const data = await res.json();
        for (const place of (data.results ?? []).slice(0, 4)) {
          liveResults.push({
            id: place.place_id,
            name: place.name,
            category: TYPE_MAP[type] as typeof ITHACA_RESOURCES[0]["category"],
            lat: place.geometry.location.lat,
            lng: place.geometry.location.lng,
            address: place.vicinity ?? "",
            hoursToday: place.opening_hours?.open_now !== undefined
              ? (place.opening_hours.open_now ? "Open now" : "Closed now")
              : "Call to confirm",
            isOpenNow: place.opening_hours?.open_now ?? null,
            phone: null,
            languages: ["English", "Spanish"],
            capacity: null,
          });
        }
      } catch { /* ignore per-type failures */ }
    })
  );

  const merged = liveResults.length > 0 ? liveResults : ITHACA_RESOURCES;
  return NextResponse.json({ resources: merged, source: liveResults.length > 0 ? "google" : "curated" });
}
