import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";

/**
 * GET /api/email-contacts/export
 * Export all email contacts as CSV.
 */
export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const contacts = await prisma.emailContact.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: "desc" },
      take: 100_000,
    });

    const headers = ["Email", "First Name", "Last Name", "Tags", "Status", "Source", "Created"];

    const rows = contacts.map(c => [
      escapeCsv(c.email),
      escapeCsv(c.firstName ?? ""),
      escapeCsv(c.lastName ?? ""),
      escapeCsv((c.tags as string[]).join("; ")),
      c.status,
      c.source ?? "",
      new Date(c.createdAt).toISOString().split("T")[0],
    ]);

    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="contacts-export-${new Date().toISOString().split("T")[0]}.csv"`,
      },
    });
  } catch (err) {
    console.error("Contacts export:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

function escapeCsv(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
