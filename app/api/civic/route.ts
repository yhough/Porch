import { NextRequest, NextResponse } from "next/server";

// Map Google's machine role names to plain English
function humanRole(officeName: string, level: string, roles: string[]): string {
  const n = officeName.toLowerCase();
  if (n.includes("mayor"))                           return "Runs your city";
  if (n.includes("common council") || n.includes("city council")) return "Decides what gets built near you";
  if (n.includes("state assembly") || n.includes("assembly member")) return "Controls state housing & education laws";
  if (n.includes("state senator") && level === "state") return "Controls state budget & criminal law";
  if (n.includes("u.s. representative") || n.includes("representative in congress")) return "Controls federal funding for your area";
  if (n.includes("u.s. senator"))                    return "Controls federal legislation";
  if (n.includes("governor"))                        return "Runs New York State";
  if (n.includes("county"))                          return "Manages county services near you";
  if (n.includes("comptroller"))                     return "Audits how your tax money is spent";
  if (n.includes("attorney general"))                return "The state's top lawyer";
  if (n.includes("president") || n.includes("vice president")) return "Runs the federal government";
  const primary = roles?.[0] ?? "";
  if (primary === "legislatorUpperBody")             return "Legislator (upper chamber)";
  if (primary === "legislatorLowerBody")             return "Legislator (lower chamber)";
  if (primary === "headOfGovernment")                return "Head of government";
  return officeName;
}

const COLORS = ["#E8513A", "#F5C842", "#5BA4CF", "#4CAF82", "#9B59B6", "#E67E22"];

// Sort order: city first, then county, state, federal (most local = most actionable)
const LEVEL_ORDER: Record<string, number> = { city: 0, county: 1, state: 2, country: 3 };

export async function GET(req: NextRequest) {
  const address = req.nextUrl.searchParams.get("address");
  if (!address) {
    return NextResponse.json({ error: "address is required" }, { status: 400 });
  }

  const key = process.env.GOOGLE_CIVIC_INFO_API_KEY;
  if (!key) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  const url =
    `https://civicinfo.googleapis.com/civicinfo/v2/representatives` +
    `?address=${encodeURIComponent(address)}&key=${key}` +
    `&levels=country&levels=state&levels=county&levels=city`;

  try {
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json({ error: text }, { status: res.status });
    }

    const data = await res.json();
    const officialsRaw: any[] = data.officials ?? [];

    const officials = (data.offices ?? []).flatMap((office: any) => {
      const level = office.levels?.[0] ?? "country";
      const roles  = office.roles ?? [];
      return (office.officialIndices ?? []).map((idx: number) => {
        const o = officialsRaw[idx];
        if (!o) return null;
        const nameParts = (o.name ?? "").trim().split(" ");
        const initials  = nameParts.map((p: string) => p[0]).join("").slice(0, 2).toUpperCase();
        return {
          id:        `civic-${idx}`,
          name:      o.name ?? "",
          role:      office.name ?? "",
          roleLabel: humanRole(office.name ?? "", level, roles),
          party:     o.party ?? "",
          phone:     o.phones?.[0] ?? null,
          email:     o.emails?.[0] ?? null,
          url:       o.urls?.[0] ?? null,
          photoUrl:  o.photoUrl ?? null,
          level,
          initials,
          color:     COLORS[idx % COLORS.length],
          office:    office.name ?? "",
        };
      }).filter(Boolean);
    });

    const sorted = (officials as any[]).sort(
      (a, b) => (LEVEL_ORDER[a.level] ?? 99) - (LEVEL_ORDER[b.level] ?? 99)
    );

    return NextResponse.json({
      officials: sorted,
      normalizedAddress: data.normalizedInput ?? null,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
