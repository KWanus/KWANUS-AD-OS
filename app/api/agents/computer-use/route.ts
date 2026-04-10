import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { executeComputerUseTask, getTaskTemplates, type ComputerUseTask } from "@/lib/agents/computerUseAgent";

export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const templates = getTaskTemplates();
    return NextResponse.json({ ok: true, templates });
  } catch (err) {
    console.error("Computer use error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json() as {
      task: ComputerUseTask;
      assets?: { imageUrls?: string[]; videoUrls?: string[]; adCopy?: string; targetAudience?: string; budget?: number };
    };

    if (!body.task) return NextResponse.json({ ok: false, error: "task required" }, { status: 400 });

    const result = await executeComputerUseTask(body.task, body.assets as any);
    return NextResponse.json(result);
  } catch (err) {
    console.error("Computer use error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}
