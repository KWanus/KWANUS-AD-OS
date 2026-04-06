import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { retryFailedEnrollmentsForFlow } from "@/lib/integrations/emailFlowEngine";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const user = await getOrCreateUser();
    if (!user) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const flow = await prisma.emailFlow.findFirst({
      where: { id, userId: user.id },
      select: { id: true },
    });
    if (!flow) {
      return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
    }

    const result = await retryFailedEnrollmentsForFlow({
      flowId: flow.id,
      userId: user.id,
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    console.error("Retry failed enrollments error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}
