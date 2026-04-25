export type DocType =
  | "agenda"
  | "zoning"
  | "ordinance"
  | "budget"
  | "campaign_finance";

export type DecisionStage =
  | "proposal"
  | "hearing"
  | "vote"
  | "approved"
  | "rejected"
  | "ongoing"
  | "unknown";

export type RiskLevel = "low" | "medium" | "high";

export type EntityType = "official" | "org" | "developer" | "donor" | "other";

export interface KeyEntity {
  name: string;
  role: string;
  type: EntityType;
}

export interface TimelineEvent {
  date: string;
  event: string;
}

export interface HowToInfluence {
  publicComment: boolean;
  deadline: string | null;
  contactInfo: string[];
  meetingInfo: string | null;
}

export interface GeographicScope {
  city: string;
  neighborhoods: string[];
  addresses: string[];
}

export interface StructuredCivicItem {
  title: string;
  docType: DocType;
  summary: string;
  whatIsHappening: string;
  whyItMatters: string;
  whoIsAffected: string[];
  geographicScope: GeographicScope;
  decisionStage: DecisionStage;
  keyEntities: KeyEntity[];
  timeline: TimelineEvent[];
  possibleOutcomes: string[];
  howToInfluence: HowToInfluence;
  riskLevel: RiskLevel;
  confidenceScore: number;
}

export interface RawDocMetadata {
  title: string;
  source: string;
  date: string;
  docType: DocType;
}

export interface CivicDocument {
  id: string;
  rawText: string;
  metadata: RawDocMetadata;
  structured: StructuredCivicItem;
  ingestedAt: string;
}
