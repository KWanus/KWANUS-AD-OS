import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";

export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const clients = await prisma.client.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: "desc" },
      take: 10000,
      include: { _count: { select: { activities: true } } },
    });

    // Build CSV
    const headers = [
      "Name", "Email", "Phone", "Company", "Website", "Niche",
      "Pipeline Stage", "Deal Value", "Health Score", "Health Status",
      "Priority", "Tags", "Last Contact", "Activities", "Created",
    ];

    const rows = clients.map(c => [
      escapeCsv(c.name),
      escapeCsv(c.email ?? ""),
      escapeCsv(c.phone ?? ""),
      escapeCsv(c.company ?? ""),
      escapeCsv(c.website ?? ""),
      escapeCsv(c.niche ?? ""),
      c.pipelineStage,
      c.dealValue?.toString() ?? "",
      c.healthScore.toString(),
      c.healthStatus,
      c.priority,
      (c.tags as string[]).join("; "),
      c.lastContactAt ? new Date(c.lastContactAt).toISOString().split("T")[0] : "",
      c._count.activities.toString(),
      new Date(c.createdAt).toISOString().split("T")[0],
    ]);

    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="clients-export-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (err) {
    console.error("Clients export:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

function escapeCsv(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
