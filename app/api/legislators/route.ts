import { NextRequest, NextResponse } from "next/server";

const OS_BASE = "https://v3.openstates.org";
const COLORS  = ["#5BA4CF", "#4CAF82", "#E8513A", "#9B59B6", "#E67E22", "#F5C842", "#1B2A4A", "#5BA4CF"];

function roleLabel(title: string, chamber: string): string {
  if (title?.toLowerCase().includes("assembly"))     return "Controls state housing & education laws";
  if (title?.toLowerCase().includes("senator") && chamber === "upper") return "Controls state budget & criminal law";
  if (title?.toLowerCase().includes("representative")) return "Controls federal funding for your area";
  if (title?.toLowerCase().includes("senator") && chamber !== "upper") return "Controls federal legislation";
  return title ?? "State legislator";
}

function level(chamber: string): string {
  if (chamber === "upper" || chamber === "lower") return "state";
  return "country";
}

export async function GET(req: NextRequest) {
  const lat = req.nextUrl.searchParams.get("lat") ?? "42.4440";
  const lng = req.nextUrl.searchParams.get("lng") ?? "-76.4969";

  const apiKey = process.env.OPEN_STATES_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  const headers: HeadersInit = { "X-API-KEY": apiKey };

  try {
    const geoRes = await fetch(
      `${OS_BASE}/people.geo?lat=${lat}&lng=${lng}&include=links`,
      { headers, next: { revalidate: 86400 } }
    );

    if (!geoRes.ok) {
      const text = await geoRes.text();
      return NextResponse.json({ error: text }, { status: geoRes.status });
    }

    const geoData = await geoRes.json();
    const people: any[] = geoData.results ?? [];

    // Fetch recent sponsored bills for each legislator in parallel
    const officials = await Promise.all(
      people.slice(0, 8).map(async (person, idx) => {
        let recentBills: any[] = [];
        try {
          const billsRes = await fetch(
            `${OS_BASE}/bills?jurisdiction=ny&sponsor_id=${encodeURIComponent(person.id)}&sort=updated_desc&per_page=6`,
            { headers, next: { revalidate: 3600 } }
          );
          if (billsRes.ok) {
            const bd = await billsRes.json();
            recentBills = (bd.results ?? []).slice(0, 6).map((b: any) => ({
              id:         b.id,
              identifier: b.identifier,
              title:      b.title,
              updatedAt:  b.updated_at,
              status:     b.latest_action_description ?? "",
              subjects:   (b.subject ?? []).slice(0, 3),
            }));
          }
        } catch {
          // bills fetch failed — proceed without them
        }

        const nameParts = (person.name ?? "").trim().split(" ");
        const initials  = nameParts.map((p: string) => p[0]).join("").slice(0, 2).toUpperCase();
        const chamber   = person.current_role?.org_classification ?? "";
        const district  = person.current_role?.district ?? "";
        const title     = person.current_role?.title ?? "";
        const rl        = level(chamber);

        return {
          id:          person.id,
          name:        person.name,
          role:        district ? `${title} — District ${district}` : title,
          roleLabel:   roleLabel(title, chamber),
          party:       person.party ?? "",
          phone:       null,
          email:       null,
          url:         person.links?.[0]?.url ?? null,
          photoUrl:    person.image ?? null,
          level:       rl,
          initials,
          color:       COLORS[idx % COLORS.length],
          office:      title,
          recentBills,
        };
      })
    );

    return NextResponse.json({ officials });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
