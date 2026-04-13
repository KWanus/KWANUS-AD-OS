import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { getProgressComparison, getPostBuildTutorial } from "@/lib/himalaya/milestones";

export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false }, { status: 401 });

    const progress = await getProgressComparison(user.id);
    const tutorial = getPostBuildTutorial({
      hasSite: progress.now.sites > 0,
      hasCampaign: progress.now.campaigns > 0,
      hasEmails: true, // email flows are auto-created
    });

    return NextResponse.json({ ok: true, progress, tutorial });
  } catch (err) {
    console.error("Progress error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}
