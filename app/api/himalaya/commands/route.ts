import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { generateDailyCommands, completeCommand } from "@/lib/himalaya/dailyCommands";

/** GET — get today's commands */
export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const result = await generateDailyCommands(user.id);
    return NextResponse.json(result);
  } catch (err) {
    console.error("Commands error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

/** POST — mark a command completed */
export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const { commandId } = await req.json() as { commandId: string };
    await completeCommand(user.id, commandId);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Complete command error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}
