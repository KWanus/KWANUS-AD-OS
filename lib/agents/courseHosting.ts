// ---------------------------------------------------------------------------
// Course/Membership Hosting — for coaches selling digital products
// Creates modules, lessons, tracks progress, gates content by payment
// ---------------------------------------------------------------------------

import { prisma } from "@/lib/prisma";

export type Course = {
  id: string;
  title: string;
  description: string;
  price: number;
  modules: CourseModule[];
  enrolledCount: number;
  published: boolean;
};

export type CourseModule = {
  id: string;
  title: string;
  order: number;
  lessons: CourseLesson[];
};

export type CourseLesson = {
  id: string;
  title: string;
  type: "video" | "text" | "quiz" | "download";
  content: string;       // HTML or video URL
  duration?: string;     // "15 min"
  order: number;
  free: boolean;         // Accessible without purchase
};

export type Enrollment = {
  id: string;
  courseId: string;
  studentEmail: string;
  completedLessons: string[];   // Array of lesson IDs
  progress: number;             // 0-100%
  enrolledAt: string;
};

/** Create a course */
export async function createCourse(input: {
  userId: string;
  title: string;
  description: string;
  price: number;
  modules: CourseModule[];
}): Promise<{ ok: boolean; courseId?: string }> {
  try {
    const event = await prisma.himalayaFunnelEvent.create({
      data: {
        userId: input.userId,
        event: "course_created",
        metadata: {
          title: input.title,
          description: input.description,
          price: input.price,
          modules: input.modules,
          published: false,
          enrolledCount: 0,
        },
      },
    });
    return { ok: true, courseId: event.id };
  } catch {
    return { ok: false };
  }
}

/** Enroll a student in a course */
export async function enrollStudent(input: {
  userId: string;      // Course owner
  courseId: string;
  studentEmail: string;
}): Promise<{ ok: boolean }> {
  try {
    await prisma.himalayaFunnelEvent.create({
      data: {
        userId: input.userId,
        event: "course_enrollment",
        metadata: {
          courseId: input.courseId,
          studentEmail: input.studentEmail,
          completedLessons: [],
          progress: 0,
          enrolledAt: new Date().toISOString(),
        },
      },
    });
    return { ok: true };
  } catch {
    return { ok: false };
  }
}

/** Mark a lesson as complete */
export async function completeLesson(input: {
  enrollmentId: string;
  lessonId: string;
  totalLessons: number;
}): Promise<{ ok: boolean; progress: number }> {
  try {
    const event = await prisma.himalayaFunnelEvent.findUnique({
      where: { id: input.enrollmentId },
    });
    if (!event) return { ok: false, progress: 0 };

    const meta = event.metadata as Record<string, unknown>;
    const completed = new Set((meta.completedLessons as string[]) ?? []);
    completed.add(input.lessonId);
    const progress = Math.round((completed.size / input.totalLessons) * 100);

    await prisma.himalayaFunnelEvent.update({
      where: { id: input.enrollmentId },
      data: {
        metadata: {
          ...meta,
          completedLessons: Array.from(completed),
          progress,
        },
      },
    });

    return { ok: true, progress };
  } catch {
    return { ok: false, progress: 0 };
  }
}

/** Get courses for a user */
export async function getUserCourses(userId: string): Promise<Course[]> {
  const events = await prisma.himalayaFunnelEvent.findMany({
    where: { userId, event: "course_created" },
    orderBy: { createdAt: "desc" },
  });

  return events.map((e) => {
    const meta = e.metadata as Record<string, unknown>;
    return {
      id: e.id,
      title: (meta.title as string) ?? "",
      description: (meta.description as string) ?? "",
      price: (meta.price as number) ?? 0,
      modules: (meta.modules as CourseModule[]) ?? [],
      enrolledCount: (meta.enrolledCount as number) ?? 0,
      published: (meta.published as boolean) ?? false,
    };
  });
}

/** Generate course structure from AI */
export function generateCourseStructure(topic: string, modules: number): CourseModule[] {
  // Placeholder — would use AI to generate
  return Array.from({ length: modules }, (_, i) => ({
    id: `mod-${i}`,
    title: `Module ${i + 1}`,
    order: i,
    lessons: Array.from({ length: 3 }, (_, j) => ({
      id: `mod-${i}-les-${j}`,
      title: `Lesson ${j + 1}`,
      type: "text" as const,
      content: "",
      duration: "15 min",
      order: j,
      free: i === 0 && j === 0, // First lesson free
    })),
  }));
}
