export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

interface SearchConfig {
  keyword: string;
  category: string;
  icon: string;
}

const SEARCHES: SearchConfig[] = [
  { keyword: "food bank",          category: "Food Banks",        icon: "🍎" },
  { keyword: "food pantry",        category: "Food Pantries",     icon: "🍎" },
  { keyword: "homeless shelter",   category: "Shelters",          icon: "🏠" },
  { keyword: "animal shelter",     category: "Animal Shelters",   icon: "🐾" },
  { keyword: "community center",   category: "Community Centers", icon: "🤝" },
  { keyword: "legal aid",          category: "Legal Aid",         icon: "⚖️" },
  { keyword: "mental health",      category: "Mental Health",     icon: "🧠" },
  { keyword: "clothing donation",  category: "Clothing Drives",   icon: "👕" },
];

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R  = 6371;
  const dL = ((lat2 - lat1) * Math.PI) / 180;
  const dG = ((lng2 - lng1) * Math.PI) / 180;
  const a  =
    Math.sin(dL / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dG / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function kmToMi(km: number) {
  return (km * 0.621371).toFixed(1);
}

export async function GET(req: NextRequest) {
  const lat = parseFloat(req.nextUrl.searchParams.get("lat") ?? "42.4440");
  const lng = parseFloat(req.nextUrl.searchParams.get("lng") ?? "-76.4969");
  const radius = req.nextUrl.searchParams.get("radius") ?? "8000";

  const key = process.env.PLACES_API_KEY;
  if (!key) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  try {
    const batches = await Promise.all(
      SEARCHES.map(async (s) => {
        const url =
          `https://maps.googleapis.com/maps/api/place/nearbysearch/json` +
          `?location=${lat},${lng}&radius=${radius}` +
          `&keyword=${encodeURIComponent(s.keyword)}&key=${key}`;

        const res = await fetch(url, { next: { revalidate: 3600 } });
        if (!res.ok) return [];
        const data = await res.json();

        return (data.results ?? []).slice(0, 3).map((p: any) => {
          const pLat = p.geometry?.location?.lat ?? lat;
          const pLng = p.geometry?.location?.lng ?? lng;
          const km   = haversineKm(lat, lng, pLat, pLng);
          return {
            id:       p.place_id,
            name:     p.name,
            category: s.category,
            icon:     s.icon,
            address:  p.vicinity ?? "",
            rating:   p.rating ?? null,
            isOpen:   p.opening_hours?.open_now ?? null,
            lat:      pLat,
            lng:      pLng,
            distanceMi: `${kmToMi(km)} mi`,
          };
        });
      })
    );

    // Flatten + deduplicate by place_id
    const seen  = new Set<string>();
    const places = batches.flat().filter((p) => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });

    // Sort by distance
    places.sort((a, b) => parseFloat(a.distanceMi) - parseFloat(b.distanceMi));

    return NextResponse.json({ places });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
