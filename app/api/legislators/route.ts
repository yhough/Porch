import { NextRequest, NextResponse } from "next/server";

const OS_BASE = "https://v3.openstates.org";

export async function GET(req: NextRequest) {
  const lat = req.nextUrl.searchParams.get("lat") ?? "42.4440";
  const lng = req.nextUrl.searchParams.get("lng") ?? "-76.4969";

  const apiKey = process.env.OPEN_STATES_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "API key not configured" }, { status: 500 });
  }

  const headers: HeadersInit = { "X-API-KEY": apiKey };

  try {
    // Get state/local legislators at this geographic point
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

    // For each legislator, fetch their recent sponsored bills (parallel)
    const enriched = await Promise.all(
      people.slice(0, 8).map(async (person) => {
        let recentBills: any[] = [];
        try {
          const billsRes = await fetch(
            `${OS_BASE}/bills?jurisdiction=ny&sponsor_id=${encodeURIComponent(person.id)}&sort=updated_desc&per_page=6`,
            { headers, next: { revalidate: 3600 } }
          );
          if (billsRes.ok) {
            const billsData = await billsRes.json();
            recentBills = (billsData.results ?? []).slice(0, 6).map((b: any) => ({
              id:          b.id,
              identifier:  b.identifier,
              title:       b.title,
              updatedAt:   b.updated_at,
              status:      b.latest_action_description ?? "",
              subjects:    (b.subject ?? []).slice(0, 3),
            }));
          }
        } catch {
          // bills fetch failed — proceed without them
        }

        return {
          id:           person.id,
          name:         person.name,
          party:        person.party,
          chamber:      person.current_role?.org_classification ?? "",
          district:     person.current_role?.district ?? "",
          title:        person.current_role?.title ?? "",
          jurisdiction: person.jurisdiction?.name ?? "",
          photoUrl:     person.image ?? null,
          recentBills,
        };
      })
    );

    return NextResponse.json({ legislators: enriched });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
