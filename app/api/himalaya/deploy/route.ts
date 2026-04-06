import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { deployRun, type DeployTarget } from "@/lib/himalaya/deployRun";

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const body = (await req.json()) as { runId: string; targets?: DeployTarget[] };
    if (!body.runId) return NextResponse.json({ ok: false, error: "runId required" }, { status: 400 });
    const result = await deployRun({
      userId: user.id,
      runId: body.runId,
      targets: body.targets,
    });
    if (!result.ok) {
      return NextResponse.json(
        { ok: false, error: result.error },
        { status: result.status }
      );
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error("Deploy error:", err);
    return NextResponse.json({ ok: false, error: "Deploy failed" }, { status: 500 });
  }
}
