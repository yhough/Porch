import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const PERMITS_FILE = path.join(process.cwd(), "data", "permits.json");

function haversineMi(lat1: number, lng1: number, lat2: number, lng2: number) {
  const R = 3958.8;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const lat = parseFloat(searchParams.get("lat") ?? "0");
  const lng = parseFloat(searchParams.get("lng") ?? "0");

  try {
    const permits = JSON.parse(fs.readFileSync(PERMITS_FILE, "utf-8"));

    // Surface any permit within 1 mile (Ithaca is small — this covers the whole city)
    const nearby = permits
      .map((p: Record<string, unknown>) => {
        const dist = haversineMi(lat, lng, p.lat as number, p.lng as number);
        return { ...p, distanceMi: parseFloat(dist.toFixed(2)) };
      })
      .filter((p: Record<string, unknown>) => (p.distanceMi as number) < 1.0)
      .sort((a: Record<string, unknown>, b: Record<string, unknown>) => (a.distanceMi as number) - (b.distanceMi as number));

    return NextResponse.json({ permits: nearby });
  } catch {
    return NextResponse.json({ permits: [] });
  }
}
