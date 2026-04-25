import fs from "fs";
import path from "path";
import { CivicDocument } from "./types";

const CIVIC_FILE = path.join(process.cwd(), "data", "civic.json");

function read(): CivicDocument[] {
  try {
    if (!fs.existsSync(CIVIC_FILE)) return [];
    return JSON.parse(fs.readFileSync(CIVIC_FILE, "utf-8"));
  } catch {
    return [];
  }
}

function write(docs: CivicDocument[]): void {
  fs.mkdirSync(path.dirname(CIVIC_FILE), { recursive: true });
  fs.writeFileSync(CIVIC_FILE, JSON.stringify(docs, null, 2));
}

export function saveDocument(doc: CivicDocument): void {
  const docs = read();
  const idx = docs.findIndex((d) => d.id === doc.id);
  if (idx >= 0) docs[idx] = doc;
  else docs.push(doc);
  write(docs);
}

export function getDocument(id: string): CivicDocument | null {
  return read().find((d) => d.id === id) ?? null;
}

export function getAllDocuments(): CivicDocument[] {
  return read();
}

export function queryDocuments(filters: {
  docType?: string;
  riskLevel?: string;
  city?: string;
}): CivicDocument[] {
  return read().filter((doc) => {
    if (filters.docType && doc.metadata.docType !== filters.docType) return false;
    if (filters.riskLevel && doc.structured.riskLevel !== filters.riskLevel) return false;
    if (filters.city) {
      const city = filters.city.toLowerCase();
      const docCity = doc.structured.geographicScope.city.toLowerCase();
      if (!docCity.includes(city) && !city.includes(docCity)) return false;
    }
    return true;
  });
}
