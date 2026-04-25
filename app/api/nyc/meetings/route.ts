export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

// NYC Council calendar — scraped from the public Legistar API.
// No API key required. Falls back to curated upcoming meetings on failure.

const LEGISTAR_BASE = "https://webapi.legistar.com/v1/nyc";

interface LegistarEvent {
  EventId: number;
  EventBodyName: string;
  EventDate: string;
  EventTime: string;
  EventLocation: string;
  EventAgendaStatusName: string;
  EventVideoPath: string | null;
  EventInSiteURL: string | null;
}

interface Meeting {
  id: string;
  body: string;
  date: string;
  time: string;
  location: string;
  status: string;
  videoUrl: string | null;
  agendaUrl: string | null;
}

function normalise(e: LegistarEvent): Meeting {
  return {
    id: String(e.EventId),
    body: e.EventBodyName,
    date: e.EventDate?.split("T")[0] ?? "",
    time: e.EventTime ?? "",
    location: e.EventLocation ?? "City Hall, NYC",
    status: e.EventAgendaStatusName ?? "",
    videoUrl: e.EventVideoPath ?? null,
    agendaUrl: e.EventInSiteURL ?? null,
  };
}

// Curated fallback — recent and upcoming NYC Council meetings
const FALLBACK: Meeting[] = [
  { id: "f1", body: "NYC City Council — Stated Meeting", date: "2026-04-24", time: "1:30 PM", location: "City Hall, Manhattan", status: "Final", videoUrl: "https://council.nyc.gov/live/", agendaUrl: "https://legistar.council.nyc.gov/Calendar.aspx" },
  { id: "f2", body: "Committee on Land Use", date: "2026-04-22", time: "10:00 AM", location: "City Hall, Room 2149", status: "Final", videoUrl: null, agendaUrl: "https://legistar.council.nyc.gov/Calendar.aspx" },
  { id: "f3", body: "Committee on Housing and Buildings", date: "2026-04-21", time: "10:00 AM", location: "City Hall, Room 2149", status: "Final", videoUrl: null, agendaUrl: "https://legistar.council.nyc.gov/Calendar.aspx" },
  { id: "f4", body: "Committee on Transportation and Infrastructure", date: "2026-04-17", time: "1:00 PM", location: "City Hall, Room 2149", status: "Final", videoUrl: null, agendaUrl: "https://legistar.council.nyc.gov/Calendar.aspx" },
  { id: "f5", body: "NYC City Council — Stated Meeting", date: "2026-05-08", time: "1:30 PM", location: "City Hall, Manhattan", status: "Tentative", videoUrl: null, agendaUrl: "https://legistar.council.nyc.gov/Calendar.aspx" },
];

export async function GET() {
  try {
    const today = new Date().toISOString().split("T")[0];
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const url =
      `${LEGISTAR_BASE}/events` +
      `?$top=8&$orderby=EventDate+desc` +
      `&$filter=EventDate+ge+datetime'${cutoff}'`;

    const res = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: 3600 },
    });

    if (!res.ok) throw new Error(`Legistar ${res.status}`);
    const data: LegistarEvent[] = await res.json();

    if (!Array.isArray(data) || data.length === 0) throw new Error("empty");

    return NextResponse.json({ meetings: data.map(normalise), source: "legistar", asOf: today });
  } catch {
    return NextResponse.json({ meetings: FALLBACK, source: "curated", asOf: new Date().toISOString().split("T")[0] });
  }
}
