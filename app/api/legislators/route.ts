export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";

const OS_BASE = "https://v3.openstates.org";
const COLORS  = ["#5BA4CF", "#4CAF82", "#E8513A", "#9B59B6", "#E67E22", "#F5C842", "#1B2A4A", "#5BA4CF"];

function roleLabel(title: string, chamber: string): string {
  const t = title?.toLowerCase() ?? "";
  if (t.includes("assembly"))                         return "Controls state housing & education laws";
  if (t.includes("senator") && chamber === "upper")  return "Controls state budget & criminal law";
  if (t.includes("representative"))                   return "Controls federal funding for your area";
  if (t.includes("senator"))                          return "Controls federal legislation";
  return title ?? "Legislator";
}

function levelFor(chamber: string): "state" | "country" {
  return chamber === "upper" || chamber === "lower" ? "state" : "country";
}

// If the email field is a mailto address use it; if it's a URL it's a contact form
function parseEmail(raw: string | null): { email: string | null; url: string | null } {
  if (!raw) return { email: null, url: null };
  if (raw.startsWith("http")) return { email: null, url: raw };
  return { email: raw, url: null };
}

export async function GET(req: NextRequest) {
  const lat = req.nextUrl.searchParams.get("lat") ?? "42.4440";
  const lng = req.nextUrl.searchParams.get("lng") ?? "-76.4969";

  const apiKey = process.env.OPEN_STATES_API_KEY;
  if (!apiKey) return NextResponse.json({ error: "API key not configured" }, { status: 500 });

  const headers: HeadersInit = { "X-API-KEY": apiKey };

  try {
    const geoRes = await fetch(
      `${OS_BASE}/people.geo?lat=${lat}&lng=${lng}`,
      { headers, next: { revalidate: 86400 } }
    );
    if (!geoRes.ok) return NextResponse.json({ error: await geoRes.text() }, { status: geoRes.status });

    const people: any[] = (await geoRes.json()).results ?? [];

    const officials = await Promise.all(
      people.slice(0, 8).map(async (person, idx) => {
        // Fetch recent bills in parallel
        let recentBills: any[] = [];
        try {
          const br = await fetch(
            `${OS_BASE}/bills?jurisdiction=${encodeURIComponent(person.jurisdiction?.classification === "country" ? "us" : "ny")}&sponsor_id=${encodeURIComponent(person.id)}&sort=updated_desc&per_page=6`,
            { headers, next: { revalidate: 3600 } }
          );
          if (br.ok) {
            recentBills = ((await br.json()).results ?? []).slice(0, 6).map((b: any) => ({
              id:         b.id,
              identifier: b.identifier,
              title:      b.title,
              updatedAt:  b.updated_at,
              status:     b.latest_action_description ?? "",
              subjects:   (b.subject ?? []).slice(0, 3),
            }));
          }
        } catch { /* skip */ }

        const chamber   = person.current_role?.org_classification ?? "";
        const district  = person.current_role?.district ?? "";
        const title     = person.current_role?.title ?? "";
        const nameParts = (person.name ?? "").trim().split(" ");
        const initials  = nameParts.map((p: string) => p[0]).join("").slice(0, 2).toUpperCase();
        const { email, url: contactUrl } = parseEmail(person.email ?? null);

        return {
          id:          person.id,
          name:        person.name,
          role:        district ? `${title} — District ${district}` : title,
          roleLabel:   roleLabel(title, chamber),
          party:       person.party ?? "",
          phone:       null,
          email,
          url:         contactUrl ?? person.openstates_url ?? null,
          photoUrl:    person.image || null,
          level:       levelFor(chamber),
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
