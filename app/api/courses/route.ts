// ---------------------------------------------------------------------------
// GET /api/courses — list user's courses
// POST /api/courses — create a new course
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import { createCourse, getUserCourses } from "@/lib/agents/courseHosting";

export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const courses = await getUserCourses(user.id);
    return NextResponse.json({ ok: true, courses });
  } catch (err) {
    console.error("Courses error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json() as {
      title: string;
      description: string;
      price: number;
      modules: { title: string; order: number; lessons: { title: string; type: string; content: string; order: number; free: boolean }[] }[];
    };

    if (!body.title) return NextResponse.json({ ok: false, error: "title required" }, { status: 400 });

    const result = await createCourse({
      userId: user.id,
      title: body.title,
      description: body.description ?? "",
      price: body.price ?? 0,
      modules: (body.modules ?? []) as any,
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("Course creation error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}
