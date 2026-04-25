import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { extractStructuredData } from "@/lib/civic/extract";
import { saveDocument } from "@/lib/civic/store";
import { CivicDocument, DocType } from "@/lib/civic/types";

const VALID_DOC_TYPES: DocType[] = [
  "agenda",
  "zoning",
  "ordinance",
  "budget",
  "campaign_finance",
];

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { rawText, title, source, date, docType } = body as Record<string, unknown>;

  if (!rawText || typeof rawText !== "string" || rawText.trim().length === 0) {
    return NextResponse.json({ error: "rawText is required" }, { status: 400 });
  }
  if (!title || typeof title !== "string") {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }
  if (!docType || !VALID_DOC_TYPES.includes(docType as DocType)) {
    return NextResponse.json(
      { error: `docType must be one of: ${VALID_DOC_TYPES.join(", ")}` },
      { status: 400 },
    );
  }

  const metadata = {
    title: title.trim(),
    source: typeof source === "string" ? source : "unknown",
    date: typeof date === "string" ? date : new Date().toISOString(),
    docType: docType as DocType,
  };

  let structured;
  try {
    structured = await extractStructuredData(rawText, metadata);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: `Extraction failed: ${message}` }, { status: 500 });
  }

  const doc: CivicDocument = {
    id: crypto.randomUUID(),
    rawText,
    metadata,
    structured,
    ingestedAt: new Date().toISOString(),
  };

  saveDocument(doc);

  return NextResponse.json({ id: doc.id, structured }, { status: 201 });
}
