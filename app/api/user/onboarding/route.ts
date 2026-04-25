import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";
import { authOptions } from "@/lib/auth";
import { updateUserOnboarding } from "@/lib/users";

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { address, age, gender, ethnicity, issues, party } = await req.json();

  updateUserOnboarding(session.user.id, {
    address: address ?? "",
    age: age ? Number(age) : null,
    gender: gender ?? "",
    ethnicity: ethnicity ?? "",
    issues: Array.isArray(issues) ? issues : [],
    party: party ?? "",
  });

  return NextResponse.json({ ok: true });
}
