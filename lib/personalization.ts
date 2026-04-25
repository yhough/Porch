// ─── Income midpoints (bracket center for calculations) ───────────────────────
export const INCOME_MIDPOINTS: Record<string, number> = {
  "Under $25,000":        17_500,
  "$25,000 – $50,000":    37_500,
  "$50,000 – $75,000":    62_500,
  "$75,000 – $100,000":   87_500,
  "$100,000 – $150,000": 125_000,
  "$150,000+":           200_000,
};

// ─── 2024 federal income tax (single filer, standard deduction $14,600) ────────
function federalTax(gross: number): number {
  const taxable = Math.max(0, gross - 14_600);
  const slabs: [number, number][] = [
    [11_600, 0.10], [35_550, 0.12], [53_375, 0.22],
    [91_425, 0.24], [51_775, 0.32], [365_625, 0.35], [Infinity, 0.37],
  ];
  let tax = 0, rem = taxable;
  for (const [size, rate] of slabs) {
    if (rem <= 0) break;
    tax += Math.min(rem, size) * rate;
    rem -= size;
  }
  return Math.round(tax);
}

// ─── 2024 NY state income tax (single filer, std deduction ~$8,000) ───────────
function nyTax(gross: number): number {
  const taxable = Math.max(0, gross - 8_000);
  const slabs: [number, number][] = [
    [17_150, 0.040], [6_450, 0.045], [4_300, 0.0525],
    [133_650, 0.0585], [161_650, 0.0625], [Infinity, 0.0685],
  ];
  let tax = 0, rem = taxable;
  for (const [size, rate] of slabs) {
    if (rem <= 0) break;
    tax += Math.min(rem, size) * rate;
    rem -= size;
  }
  return Math.round(tax);
}

export interface TaxBreakdown {
  income: number;
  federal: number;
  stateNY: number;
  fica: number;            // Social Security + Medicare (employee share)
  local: number;           // Ithaca / Tompkins County estimate
  total: number;
  effectiveRate: number;   // as a percentage, e.g. 28.4
  takeHome: number;
  // Where local taxes go (annual $)
  localSchools:   number;
  localSafety:    number;
  localRoads:     number;
  localParks:     number;
  localOther:     number;
}

export function getTaxBreakdown(bracket: string): TaxBreakdown | null {
  const income = INCOME_MIDPOINTS[bracket];
  if (!income) return null;

  const federal  = federalTax(income);
  const stateNY  = nyTax(income);
  const fica     = Math.round(income * 0.0765);         // 6.2% SS + 1.45% Medicare
  const local    = Math.round(income * 0.026);          // Tompkins ~2.6%
  const total    = federal + stateNY + fica + local;

  return {
    income, federal, stateNY, fica, local, total,
    effectiveRate: Math.round((total / income) * 1000) / 10,
    takeHome:      income - total,
    localSchools:  Math.round(local * 0.31),
    localSafety:   Math.round(local * 0.21),
    localRoads:    Math.round(local * 0.09),
    localParks:    Math.round(local * 0.08),
    localOther:    Math.round(local * 0.31),
  };
}

// ─── Party ID → display label ─────────────────────────────────────────────────
const PARTY_ID_LABEL: Record<string, string> = {
  democratic:  "Democratic",
  republican:  "Republican",
  independent: "Independent",
  green:       "Green",
  libertarian: "Libertarian",
};

export function repIsAligned(repParty: string, userPartyId: string): boolean {
  const label = PARTY_ID_LABEL[userPartyId] ?? "";
  return !!label && repParty === label;
}

// ─── Issue → place category keywords ─────────────────────────────────────────
const ISSUE_PLACE_KW: Record<string, string[]> = {
  education:      ["tutor", "school", "library", "education", "learn"],
  healthcare:     ["food bank", "foodnet", "mental health", "health", "clinic", "medical"],
  housing:        ["shelter", "homeless", "housing", "habitat"],
  social_justice: ["legal aid", "legal", "community center", "community", "advocacy"],
  environment:    ["park", "conserv", "garden", "nature", "wildlife"],
  public_safety:  ["safety", "fire", "emergency", "crisis"],
  economics:      ["job", "workforce", "employment", "career", "business"],
  transportation: ["transit", "bus", "transport", "commut"],
};

export function placeMatchedIssues(
  category: string, name: string, userIssues: string[]
): string[] {
  const text = `${category} ${name}`.toLowerCase();
  return userIssues.filter((id) =>
    (ISSUE_PLACE_KW[id] ?? []).some((kw) => text.includes(kw))
  );
}

// ─── Issue → urgent-card topic keywords ───────────────────────────────────────
const ISSUE_CARD_KW: Record<string, string[]> = {
  environment:    ["energy", "climate", "green", "conserv", "tree", "environment"],
  housing:        ["housing", "garage", "shelter", "development", "afford", "street"],
  economics:      ["grant", "money", "million", "budget", "economy", "award", "fund"],
  social_justice: ["justice", "equity", "community", "civil", "discriminat"],
  education:      ["school", "educat", "college", "tuition", "learn"],
  public_safety:  ["safety", "fire", "police", "closed", "emergency", "shut"],
  voting_rights:  ["vote", "election", "council", "board", "civic", "sworn"],
  transportation: ["transit", "road", "street", "traffic", "parking", "garage"],
};

export function cardRelevanceScore(title: string, userIssues: string[]): number {
  const lower = title.toLowerCase();
  return userIssues.reduce((score, id) => {
    const hit = (ISSUE_CARD_KW[id] ?? []).some((kw) => lower.includes(kw));
    return score + (hit ? 1 : 0);
  }, 0);
}
