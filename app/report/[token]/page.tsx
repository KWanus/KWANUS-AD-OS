import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function PublicReportPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  // Find the share token
  const events = await prisma.himalayaFunnelEvent.findMany({
    where: { event: "client_share_token" },
    take: 500,
  }).catch(() => []);

  const match = events.find(e => {
    const meta = e.metadata as Record<string, unknown>;
    return meta?.token === token;
  });

  if (!match) notFound();

  const meta = match.metadata as Record<string, unknown>;
  const clientId = meta.clientId as string;
  const userId = match.userId ?? "";

  // Get client data
  const client = await prisma.client.findFirst({
    where: { id: clientId },
    include: { activities: { orderBy: { createdAt: "desc" }, take: 10 } },
  }).catch(() => null);

  if (!client) notFound();

  // Get workspace name
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { workspaceName: true, name: true },
  }).catch(() => null);

  const agencyName = user?.workspaceName ?? user?.name ?? "Your Agency";

  return (
    <main style={{ fontFamily: "-apple-system, sans-serif", maxWidth: 640, margin: "0 auto", padding: "40px 20px", color: "#1a1a1a" }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: 40 }}>
        <h1 style={{ fontSize: 24, fontWeight: 900, margin: "0 0 4px" }}>{client.name} — Performance Report</h1>
        <p style={{ fontSize: 13, color: "#888" }}>Prepared by {agencyName} · {new Date().toLocaleDateString()}</p>
      </div>

      {/* Key Metrics */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 32 }}>
        <div style={{ background: "#f8f8f8", borderRadius: 12, padding: 20, textAlign: "center" }}>
          <p style={{ fontSize: 28, fontWeight: 900, color: "#f5a623" }}>{client.healthScore ?? 0}</p>
          <p style={{ fontSize: 11, color: "#888" }}>Health Score</p>
        </div>
        <div style={{ background: "#f8f8f8", borderRadius: 12, padding: 20, textAlign: "center" }}>
          <p style={{ fontSize: 28, fontWeight: 900, color: "#10b981" }}>${((client.dealValue ?? 0) / 100).toLocaleString()}</p>
          <p style={{ fontSize: 11, color: "#888" }}>Deal Value</p>
        </div>
      </div>

      {/* Client Info */}
      <div style={{ background: "#f8f8f8", borderRadius: 12, padding: 20, marginBottom: 24 }}>
        <p style={{ fontSize: 10, fontWeight: 800, color: "#888", letterSpacing: 2, marginBottom: 8 }}>CLIENT DETAILS</p>
        <p style={{ fontSize: 14, fontWeight: 700 }}>{client.name}</p>
        {client.company && <p style={{ fontSize: 13, color: "#666" }}>{client.company}</p>}
        {client.email && <p style={{ fontSize: 13, color: "#666" }}>{client.email}</p>}
        <p style={{ fontSize: 12, color: "#888", marginTop: 8 }}>Stage: {client.pipelineStage} · Status: {client.healthStatus ?? "Active"}</p>
      </div>

      {/* Recent Activity */}
      <div style={{ marginBottom: 32 }}>
        <p style={{ fontSize: 10, fontWeight: 800, color: "#888", letterSpacing: 2, marginBottom: 12 }}>RECENT ACTIVITY</p>
        {client.activities.length === 0 ? (
          <p style={{ fontSize: 13, color: "#aaa" }}>No recent activity</p>
        ) : (
          <div>
            {client.activities.map((a: { id: string; type: string; note: string | null; createdAt: Date }) => (
              <div key={a.id} style={{ borderLeft: "3px solid #f5a623", paddingLeft: 12, marginBottom: 12 }}>
                <p style={{ fontSize: 13, fontWeight: 600 }}>{a.type.replace(/_/g, " ")}</p>
                {a.note && <p style={{ fontSize: 12, color: "#666" }}>{a.note}</p>}
                <p style={{ fontSize: 11, color: "#aaa" }}>{new Date(a.createdAt).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ textAlign: "center", borderTop: "1px solid #eee", paddingTop: 20 }}>
        <p style={{ fontSize: 11, color: "#ccc" }}>Powered by Himalaya</p>
      </div>
    </main>
  );
}
