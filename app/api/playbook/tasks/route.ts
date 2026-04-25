import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { getPlaybookProgress, completeWeeklyTask, uncompleteWeeklyTask } from "@/lib/himalaya/weeklyTasks";

/** GET — Fetch playbook progress and weekly tasks */
export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const progress = await getPlaybookProgress(user.id);
    return NextResponse.json(progress);
  } catch (err) {
    console.error("Playbook tasks GET error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

/** POST — Complete or uncomplete a weekly task */
export async function POST(req: Request) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const body = await req.json() as { taskId: string; completed: boolean };
    const { taskId, completed } = body;

    if (!taskId) {
      return NextResponse.json({ ok: false, error: "taskId required" }, { status: 400 });
    }

    if (completed) {
      await completeWeeklyTask(user.id, taskId);
    } else {
      await uncompleteWeeklyTask(user.id, taskId);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Playbook tasks POST error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}
