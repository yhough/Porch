import { NextRequest, NextResponse } from "next/server";

const USASPENDING_URL =
  "https://api.usaspending.gov/api/v2/search/spending_by_award/";

const GRANT_TYPE_CODES = ["02", "03", "04", "05", "F001"];

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const city = searchParams.get("city") === "nyc" ? "nyc" : "ithaca";

  const cityFilter =
    city === "nyc"
      ? { country: "USA", state: "NY", city: "New York" }
      : { country: "USA", state: "NY", city: "Ithaca" };

  const body = {
    filters: {
      award_type_codes: GRANT_TYPE_CODES,
      place_of_performance_locations: [cityFilter],
      time_period: [{ start_date: "2019-10-01", end_date: "2025-09-30" }],
    },
    fields: [
      "Award ID",
      "Recipient Name",
      "Award Amount",
      "Awarding Agency",
      "Awarding Sub Agency",
      "Start Date",
      "End Date",
      "Description",
      "Award Type",
    ],
    page: 1,
    limit: 12,
    sort: "Award Amount",
    order: "desc",
  };

  try {
    const res = await fetch(USASPENDING_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(body),
      next: { revalidate: 3600 },
    });

    const text = await res.text();
    if (!res.ok) {
      return NextResponse.json(
        { error: text || `USASpending returned ${res.status}` },
        { status: 502 }
      );
    }

    let data: {
      results?: Record<string, unknown>[];
      page_metadata?: unknown;
      messages?: string[];
    };
    try {
      data = JSON.parse(text);
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON from USASpending" },
        { status: 502 }
      );
    }

    return NextResponse.json({
      results: data.results ?? [],
      pageMetadata: data.page_metadata ?? null,
      messages: data.messages ?? [],
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Request failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
