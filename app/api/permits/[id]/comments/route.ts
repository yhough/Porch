import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const PERMITS_FILE = path.join(process.cwd(), "data", "permits.json");

function readPermits() {
  return JSON.parse(fs.readFileSync(PERMITS_FILE, "utf-8"));
}

function writePermits(data: unknown[]) {
  fs.writeFileSync(PERMITS_FILE, JSON.stringify(data, null, 2));
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const permits = readPermits();
  const permit = permits.find((p: Record<string, unknown>) => p.id === params.id);
  if (!permit) return NextResponse.json({ comments: [] }, { status: 404 });
  return NextResponse.json({
    comments: permit.comments ?? [],
    totalCommentCount: permit.totalCommentCount ?? 0,
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await req.json();
  const { author, neighborhood, text } = body;
  if (!text?.trim()) {
    return NextResponse.json({ error: "Comment text is required" }, { status: 400 });
  }

  const permits = readPermits();
  const idx = permits.findIndex((p: Record<string, unknown>) => p.id === params.id);
  if (idx === -1) return NextResponse.json({ error: "Permit not found" }, { status: 404 });

  const newComment = {
    id: `c-${Date.now()}`,
    author: author || "Anonymous",
    neighborhood: neighborhood || "Ithaca",
    text: text.trim(),
    time: "Just now",
    isNew: true,
  };

  permits[idx].comments = [newComment, ...(permits[idx].comments ?? [])];
  permits[idx].totalCommentCount = (permits[idx].totalCommentCount ?? 0) + 1;

  try {
    writePermits(permits);
  } catch {
    // In read-only environments, still return success — comment shown in UI
  }

  return NextResponse.json({ comment: newComment, totalCommentCount: permits[idx].totalCommentCount });
}
