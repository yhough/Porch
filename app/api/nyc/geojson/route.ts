import { NextResponse } from "next/server";

// Simple in-process cache — survives for the lifetime of the server process
let cachedGeoJson: unknown = null;
let cachedAt = 0;
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 h

const SOCRATA_URL =
  "https://data.cityofnewyork.us/resource/yusd-j4xi.geojson?$limit=60";

export async function GET() {
  const token = process.env.NYC_OPEN_DATA_TOKEN;

  if (cachedGeoJson && Date.now() - cachedAt < CACHE_TTL) {
    return NextResponse.json(cachedGeoJson, {
      headers: { "Cache-Control": "public, max-age=86400" },
    });
  }

  try {
    const headers: Record<string, string> = { Accept: "application/json" };
    if (token) headers["X-App-Token"] = token;

    const res = await fetch(SOCRATA_URL, { headers, next: { revalidate: 86400 } });
    if (!res.ok) throw new Error(`Socrata ${res.status}`);

    const raw = await res.json();

    // Normalise: Socrata returns a GeoJSON FeatureCollection but with the
    // district number in "coundist" (lowercase) or "CounDist" depending on
    // the endpoint version. We normalise to "CounDist".
    if (raw?.features) {
      raw.features = raw.features.map((f: { properties?: Record<string, unknown> }) => {
        const p = f.properties ?? {};
        const cd = p.coundist ?? p.CounDist ?? p.councildist ?? null;
        return { ...f, properties: { ...p, CounDist: cd !== null ? Number(cd) : null } };
      });
    }

    cachedGeoJson = raw;
    cachedAt = Date.now();

    return NextResponse.json(raw, {
      headers: { "Cache-Control": "public, max-age=86400" },
    });
  } catch (err) {
    console.error("NYC GeoJSON fetch failed:", err);
    return NextResponse.json({ error: "Could not load NYC district boundaries" }, { status: 502 });
  }
}
