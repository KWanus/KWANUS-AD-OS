import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { exportUserData } from "@/lib/himalaya/milestones";

export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false }, { status: 401 });

    const data = await exportUserData(user.id);

    return new NextResponse(JSON.stringify(data, null, 2), {
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="himalaya-export-${new Date().toISOString().split("T")[0]}.json"`,
      },
    });
  } catch (err) {
    console.error("Export error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}
