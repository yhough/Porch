import { NextResponse } from "next/server";

// Force dynamic — never pre-render at build time
export const dynamic = "force-dynamic";

// Simple in-process cache — survives for the lifetime of the server process
let cachedGeoJson: unknown = null;
let cachedAt = 0;
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 h

// ArcGIS REST — same source used by NycDistrictMap client-side
const ARCGIS_URL =
  "https://services5.arcgis.com/GfwWNkhOj9bNBqoJ/arcgis/rest/services/NYC_City_Council_Districts/FeatureServer/0/query?where=1%3D1&outFields=*&outSR=4326&f=geojson";

export async function GET() {
  const token = process.env.NYC_OPEN_DATA_TOKEN;
  void token; // not needed for ArcGIS

  if (cachedGeoJson && Date.now() - cachedAt < CACHE_TTL) {
    return NextResponse.json(cachedGeoJson, {
      headers: { "Cache-Control": "public, max-age=86400" },
    });
  }

  try {
    const res = await fetch(ARCGIS_URL, { next: { revalidate: 86400 } });
    if (!res.ok) throw new Error(`ArcGIS ${res.status}`);

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
