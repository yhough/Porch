import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { getRelevantDocuments } from "@/lib/civic/relevance";

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const address = searchParams.get("address")?.trim();
  const rawLimit = Number(searchParams.get("limit") ?? "20");
  const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(rawLimit, 1), 50) : 20;

  if (!address) {
    return NextResponse.json({ error: "address query param is required" }, { status: 400 });
  }

  const docs = getRelevantDocuments(address, limit);

  return NextResponse.json({
    address,
    count: docs.length,
    items: docs.map((doc) => ({
      id: doc.id,
      title: doc.structured.title,
      docType: doc.structured.docType,
      summary: doc.structured.summary,
      whatIsHappening: doc.structured.whatIsHappening,
      whyItMatters: doc.structured.whyItMatters,
      riskLevel: doc.structured.riskLevel,
      decisionStage: doc.structured.decisionStage,
      geographicScope: doc.structured.geographicScope,
      howToInfluence: doc.structured.howToInfluence,
      timeline: doc.structured.timeline,
      ingestedAt: doc.ingestedAt,
      metadata: {
        title: doc.metadata.title,
        source: doc.metadata.source,
        date: doc.metadata.date,
        docType: doc.metadata.docType,
      },
    })),
  });
}
