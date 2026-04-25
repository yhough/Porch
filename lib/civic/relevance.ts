import { CivicDocument } from "./types";
import { getAllDocuments } from "./store";

// Pull the city name out of a human-typed address.
// "210 N Tioga St, Ithaca, NY 14850" → "ithaca"
function cityFromAddress(address: string): string {
  const parts = address.split(",").map((s) => s.trim());
  if (parts.length >= 3) return parts[parts.length - 2].toLowerCase();
  if (parts.length === 2) return parts[0].toLowerCase();
  return address.toLowerCase();
}

// Pull meaningful tokens (length > 3) from the address for street-level matching.
function tokensFromAddress(address: string): string[] {
  return address
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 3 && !/^\d{5}$/.test(w)); // drop zip codes
}

function cityMatch(docCity: string, userCity: string): boolean {
  const a = docCity.toLowerCase();
  const b = userCity.toLowerCase();
  return a.includes(b) || b.includes(a);
}

function geoText(doc: CivicDocument): string {
  const geo = doc.structured.geographicScope;
  return [...geo.neighborhoods, ...geo.addresses, geo.city].join(" ").toLowerCase();
}

function scoreDocument(doc: CivicDocument, address: string): number {
  const userCity = cityFromAddress(address);
  const tokens = tokensFromAddress(address);
  const geo = doc.structured.geographicScope;
  let score = 0;

  // City-level match is the floor of relevance
  if (cityMatch(geo.city, userCity)) score += 10;

  // Street / neighborhood keyword hits above city
  const text = geoText(doc);
  for (const token of tokens) {
    if (text.includes(token)) score += 5;
  }

  // High-impact items surface first
  if (doc.structured.riskLevel === "high") score += 4;
  else if (doc.structured.riskLevel === "medium") score += 2;

  // Freshness — each day old costs a small fraction of a point
  const ageMs = Date.now() - new Date(doc.ingestedAt).getTime();
  const ageDays = ageMs / (1000 * 60 * 60 * 24);
  score -= Math.min(ageDays, 60) * 0.05;

  return score;
}

export function getRelevantDocuments(
  address: string,
  limit = 20,
): CivicDocument[] {
  const all = getAllDocuments();

  return all
    .map((doc) => ({ doc, score: scoreDocument(doc, address) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ doc }) => doc);
}
