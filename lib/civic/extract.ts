import Anthropic from "@anthropic-ai/sdk";
import { RawDocMetadata, StructuredCivicItem } from "./types";

const SCHEMA = `{
  "title": "string — clear, concise title",
  "docType": "agenda | zoning | ordinance | budget | campaign_finance",
  "summary": "string — 2-3 plain English sentences for a general audience",
  "whatIsHappening": "string — concrete description of the action or decision",
  "whyItMatters": "string — real-world impact on residents",
  "whoIsAffected": ["array of affected groups or demographics"],
  "geographicScope": {
    "city": "string — primary city",
    "neighborhoods": ["specific neighborhoods mentioned"],
    "addresses": ["specific addresses or intersections mentioned"]
  },
  "decisionStage": "proposal | hearing | vote | approved | rejected | ongoing | unknown",
  "keyEntities": [
    { "name": "string", "role": "string", "type": "official | org | developer | donor | other" }
  ],
  "timeline": [
    { "date": "string — ISO 8601 or descriptive", "event": "string" }
  ],
  "possibleOutcomes": ["2-4 realistic outcomes"],
  "howToInfluence": {
    "publicComment": "boolean",
    "deadline": "string | null — ISO 8601 date or null if unknown",
    "contactInfo": ["emails, phone numbers, office names"],
    "meetingInfo": "string | null — meeting time, date, location or null"
  },
  "riskLevel": "low | medium | high — impact on residents daily life",
  "confidenceScore": "number 0.0-1.0 — how complete and clear the source document was"
}`;

export async function extractStructuredData(
  rawText: string,
  metadata: RawDocMetadata,
): Promise<StructuredCivicItem> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set");

  const client = new Anthropic({ apiKey });

  const response = await client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 2048,
    system: `You are a civic intelligence assistant. You analyze local government documents and extract structured information for residents who need to understand what their government is doing.

Your job: translate bureaucratic language into clear, plain English without losing accuracy.

Rules:
- Respond ONLY with valid JSON matching the exact schema. No prose, no markdown fences, no explanation.
- Never invent facts not in the document. Use "unknown" or empty arrays for missing info.
- Extract actual street names, neighborhoods, and addresses when mentioned — do not generalize.
- Risk level: "high" = directly changes something residents rely on (housing, safety, taxes, infrastructure). "medium" = affects a subset or introduces a policy shift. "low" = administrative or informational.
- Confidence score: 1.0 = complete and unambiguous document. 0.0 = almost no usable information.`,
    messages: [
      {
        role: "user",
        content: `Analyze this ${metadata.docType} document and return structured civic information.

Title: ${metadata.title}
Source: ${metadata.source}
Date: ${metadata.date}

Document:
${rawText.slice(0, 10_000)}

Return JSON matching this schema exactly:
${SCHEMA}`,
      },
    ],
  });

  const block = response.content[0];
  if (block.type !== "text") throw new Error("Unexpected response type from model");

  // Strip markdown fences if the model adds them despite instructions
  const jsonText = block.text
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "")
    .trim();

  try {
    return JSON.parse(jsonText) as StructuredCivicItem;
  } catch {
    throw new Error(`Model returned invalid JSON: ${jsonText.slice(0, 200)}`);
  }
}
