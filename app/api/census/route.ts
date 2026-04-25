import { NextRequest, NextResponse } from "next/server";

/** ACS 5-year — supports Ithaca (place 38077) and NYC (place 51000), state 36. */
const CENSUS_URL = "https://api.census.gov/data/2022/acs/acs5";

const VARIABLES = [
  "NAME",
  "B01003_001E", // total population
  "B19013_001E", // median household income
  "B25077_001E", // median value (owner-occupied)
  "B25064_001E", // median gross rent
  "B25003_002E", // owner-occupied housing units
  "B25003_003E", // renter-occupied housing units
].join(",");

function parseCensusInt(raw: string | undefined): number | null {
  if (raw == null || raw === "") return null;
  const n = Number(raw);
  if (!Number.isFinite(n) || n < 0) return null;
  return n;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const city = searchParams.get("city") === "nyc" ? "nyc" : "ithaca";
  const placeCode = city === "nyc" ? "51000" : "38077";

  const key = process.env.CENSUS_API_KEY?.trim();
  if (!key) {
    return NextResponse.json(
      { error: "CENSUS_API_KEY is not configured" },
      { status: 500 }
    );
  }

  const params = new URLSearchParams({
    get: VARIABLES,
    for: `place:${placeCode}`,
    in: "state:36",
    key,
  });

  try {
    const res = await fetch(`${CENSUS_URL}?${params.toString()}`, {
      next: { revalidate: 86400 },
    });
    const text = await res.text();
    if (!res.ok) {
      return NextResponse.json(
        { error: text || `Census API returned ${res.status}` },
        { status: 502 }
      );
    }

    const data: unknown = JSON.parse(text);
    if (!Array.isArray(data) || data.length < 2 || !Array.isArray(data[0]) || !Array.isArray(data[1])) {
      return NextResponse.json(
        { error: "Unexpected response from Census API" },
        { status: 502 }
      );
    }

    const headers = data[0] as string[];
    const row = data[1] as string[];
    const rec: Record<string, string> = {};
    headers.forEach((h, i) => {
      rec[h] = row[i];
    });

    const owner = parseCensusInt(rec.B25003_002E);
    const renter = parseCensusInt(rec.B25003_003E);
    const occupied = owner != null && renter != null ? owner + renter : null;
    const renterShare =
      occupied && occupied > 0 && renter != null
        ? Math.round((renter / occupied) * 1000) / 10
        : null;

    return NextResponse.json({
      name: rec.NAME ?? (city === "nyc" ? "New York city, New York" : "Ithaca city, New York"),
      population: parseCensusInt(rec.B01003_001E),
      medianHouseholdIncome: parseCensusInt(rec.B19013_001E),
      medianHomeValue: parseCensusInt(rec.B25077_001E),
      medianGrossRent: parseCensusInt(rec.B25064_001E),
      ownerOccupied: owner,
      renterOccupied: renter,
      renterSharePercent: renterShare,
      vintage: 2022,
      dataset: "acs/acs5",
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Census request failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
