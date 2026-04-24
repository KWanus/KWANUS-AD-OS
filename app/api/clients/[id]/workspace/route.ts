import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getOrCreateUser } from "@/lib/auth";
import {
  getClientChecklist,
  getClientInvoices,
  getClientProjects,
  toggleChecklistItem,
} from "@/lib/clients/autoOnboard";

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const { id } = await params;

    const [checklist, invoices, projects] = await Promise.all([
      getClientChecklist(user.id, id),
      getClientInvoices(user.id, id),
      getClientProjects(user.id),
    ]);

    const project = projects.find((p) => p.clientId === id) ?? null;

    return NextResponse.json({ ok: true, checklist, invoices, project });
  } catch (err) {
    console.error("Client workspace error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const user = await getOrCreateUser();
    if (!user) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

    const body = (await req.json()) as { action: string; itemId?: string; done?: boolean };

    if (body.action === "toggle_checklist" && body.itemId != null) {
      const ok = await toggleChecklistItem(user.id, body.itemId, Boolean(body.done));
      return NextResponse.json({ ok });
    }

    return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
  } catch (err) {
    console.error("Client workspace PATCH error:", err);
    return NextResponse.json({ ok: false, error: "Failed" }, { status: 500 });
  }
}
