"use client";

import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

interface Stats {
  totalUsers: number;
  activeUsers: number;
  publishedSites: number;
  proUsers: number;
  businessUsers: number;
  mrr: number;
  creditPurchases: number;
  totalOrders: number;
  gmv: number;
  weeklySignups: { week: string; count: number }[];
  recentUsers: {
    email: string;
    name: string | null;
    plan: string;
    credits: number;
    joinedAt: string;
  }[];
  topSites: { name: string; views: number; published: boolean }[];
  totalActiveFlows: number;
  totalEmailsSent: number;
}

const ADMIN_EMAILS = ["kwanus@gmail.com"];

export default function AdminDashboard() {
  const { user, isLoaded } = useUser();
  const router = useRouter();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const isAdmin =
    isLoaded &&
    user?.primaryEmailAddress?.emailAddress &&
    ADMIN_EMAILS.includes(user.primaryEmailAddress.emailAddress);

  useEffect(() => {
    if (isLoaded && !isAdmin) return;
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((d) => {
        if (d.ok) setStats(d.stats);
        else setError(d.error || "Failed to load stats");
      })
      .catch(() => setError("Network error"))
      .finally(() => setLoading(false));
  }, [isLoaded, isAdmin]);

  if (!isLoaded) return null;

  if (!isAdmin) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0a",
          color: "#fff",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <h1
            style={{
              fontSize: "2rem",
              fontWeight: 700,
              color: "#C8A97E",
              marginBottom: "0.5rem",
            }}
          >
            Access Denied
          </h1>
          <p style={{ color: "#888" }}>
            You do not have admin access to this page.
          </p>
          <button
            onClick={() => router.push("/")}
            style={{
              marginTop: "1.5rem",
              padding: "0.6rem 1.5rem",
              background: "#C8A97E",
              color: "#0a0a0a",
              border: "none",
              borderRadius: "8px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0a",
          color: "#C8A97E",
          fontSize: "1.2rem",
        }}
      >
        Loading admin dashboard...
      </div>
    );
  }

  if (error || !stats) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0a0a0a",
          color: "#f87171",
          fontSize: "1.2rem",
        }}
      >
        {error || "Failed to load data"}
      </div>
    );
  }

  const maxSignup = Math.max(...stats.weeklySignups.map((w) => w.count), 1);
  const subscriptionRevenue = stats.mrr;
  const creditRev = stats.creditPurchases * 5; // estimate $5 per credit pack
  const platformFees = stats.gmv * 0.05; // 5% platform fee estimate
  const totalRevenue = subscriptionRevenue + creditRev + platformFees;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0a0a0a",
        color: "#fff",
        padding: "2rem",
      }}
    >
      <div style={{ maxWidth: "1152px", margin: "0 auto" }}>
        {/* Header */}
        <div
          style={{
            marginBottom: "2rem",
            borderBottom: "1px solid #222",
            paddingBottom: "1rem",
          }}
        >
          <h1
            style={{
              fontSize: "1.75rem",
              fontWeight: 700,
              color: "#C8A97E",
              margin: 0,
            }}
          >
            Himalaya Admin
          </h1>
          <p style={{ color: "#888", marginTop: "0.25rem", fontSize: "0.9rem" }}>
            Platform metrics and management
          </p>
        </div>

        {/* Stat Cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))",
            gap: "1rem",
            marginBottom: "2rem",
          }}
        >
          <StatCard label="Total Users" value={stats.totalUsers} />
          <StatCard label="Active (7d)" value={stats.activeUsers} />
          <StatCard
            label="Total Revenue"
            value={`$${totalRevenue.toLocaleString()}`}
          />
          <StatCard label="Sites Published" value={stats.publishedSites} />
        </div>

        {/* MRR + Revenue Breakdown */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "1rem",
            marginBottom: "2rem",
          }}
        >
          {/* MRR Card */}
          <div style={cardStyle}>
            <h3 style={cardTitleStyle}>Monthly Recurring Revenue</h3>
            <div
              style={{
                fontSize: "2.5rem",
                fontWeight: 700,
                color: "#C8A97E",
                marginBottom: "1rem",
              }}
            >
              ${stats.mrr.toLocaleString()}
            </div>
            <div
              style={{
                display: "flex",
                gap: "2rem",
                fontSize: "0.85rem",
                color: "#aaa",
              }}
            >
              <div>
                <span style={{ color: "#C8A97E" }}>{stats.proUsers}</span> Pro
                ($29/mo)
              </div>
              <div>
                <span style={{ color: "#C8A97E" }}>{stats.businessUsers}</span>{" "}
                Business ($79/mo)
              </div>
            </div>
          </div>

          {/* Revenue Breakdown */}
          <div style={cardStyle}>
            <h3 style={cardTitleStyle}>Revenue Breakdown</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              <RevenueRow
                label="Subscriptions"
                amount={subscriptionRevenue}
                total={totalRevenue}
                color="#C8A97E"
              />
              <RevenueRow
                label="Credit Purchases"
                amount={creditRev}
                total={totalRevenue}
                color="#f5a623"
              />
              <RevenueRow
                label="Platform Fees (5%)"
                amount={platformFees}
                total={totalRevenue}
                color="#a78bfa"
              />
            </div>
          </div>
        </div>

        {/* Weekly Signups Chart */}
        <div style={{ ...cardStyle, marginBottom: "2rem" }}>
          <h3 style={cardTitleStyle}>User Growth (Last 8 Weeks)</h3>
          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              gap: "0.5rem",
              height: "160px",
              paddingTop: "1rem",
            }}
          >
            {stats.weeklySignups.map((w, i) => (
              <div
                key={i}
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  height: "100%",
                  justifyContent: "flex-end",
                }}
              >
                <span
                  style={{
                    fontSize: "0.7rem",
                    color: "#C8A97E",
                    marginBottom: "0.25rem",
                    fontWeight: 600,
                  }}
                >
                  {w.count}
                </span>
                <div
                  style={{
                    width: "100%",
                    maxWidth: "48px",
                    background:
                      "linear-gradient(180deg, #C8A97E 0%, #8B7355 100%)",
                    borderRadius: "4px 4px 0 0",
                    height: `${(w.count / maxSignup) * 120}px`,
                    minHeight: w.count > 0 ? "4px" : "0",
                    transition: "height 0.3s ease",
                  }}
                />
                <span
                  style={{
                    fontSize: "0.6rem",
                    color: "#666",
                    marginTop: "0.35rem",
                    whiteSpace: "nowrap",
                  }}
                >
                  {w.week.slice(5)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* System Health */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
            gap: "1rem",
            marginBottom: "2rem",
          }}
        >
          <StatCard
            label="Active Email Flows"
            value={stats.totalActiveFlows}
          />
          <StatCard
            label="Emails Sent"
            value={stats.totalEmailsSent.toLocaleString()}
          />
          <StatCard label="Total Orders" value={stats.totalOrders} />
          <StatCard
            label="GMV"
            value={`$${stats.gmv.toLocaleString()}`}
          />
        </div>

        {/* Recent Signups Table */}
        <div style={{ ...cardStyle, marginBottom: "2rem", overflowX: "auto" }}>
          <h3 style={cardTitleStyle}>Recent Signups</h3>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "0.85rem",
            }}
          >
            <thead>
              <tr style={{ borderBottom: "1px solid #333" }}>
                <th style={thStyle}>Name</th>
                <th style={thStyle}>Email</th>
                <th style={thStyle}>Plan</th>
                <th style={thStyle}>Credits</th>
                <th style={thStyle}>Joined</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentUsers.map((u, i) => (
                <tr
                  key={i}
                  style={{
                    borderBottom: "1px solid #1a1a1a",
                    background: i % 2 === 0 ? "transparent" : "#111",
                  }}
                >
                  <td style={tdStyle}>{u.name || "--"}</td>
                  <td style={{ ...tdStyle, color: "#aaa" }}>{u.email}</td>
                  <td style={tdStyle}>
                    <PlanBadge plan={u.plan} />
                  </td>
                  <td style={{ ...tdStyle, color: "#C8A97E" }}>{u.credits}</td>
                  <td style={{ ...tdStyle, color: "#888" }}>
                    {new Date(u.joinedAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Top Sites */}
        <div style={{ ...cardStyle, marginBottom: "2rem", overflowX: "auto" }}>
          <h3 style={cardTitleStyle}>Top Sites by Views</h3>
          <table
            style={{
              width: "100%",
              borderCollapse: "collapse",
              fontSize: "0.85rem",
            }}
          >
            <thead>
              <tr style={{ borderBottom: "1px solid #333" }}>
                <th style={thStyle}>Site</th>
                <th style={thStyle}>Views</th>
                <th style={thStyle}>Status</th>
              </tr>
            </thead>
            <tbody>
              {stats.topSites.map((s, i) => (
                <tr
                  key={i}
                  style={{
                    borderBottom: "1px solid #1a1a1a",
                    background: i % 2 === 0 ? "transparent" : "#111",
                  }}
                >
                  <td style={tdStyle}>{s.name}</td>
                  <td style={{ ...tdStyle, color: "#C8A97E" }}>
                    {s.views.toLocaleString()}
                  </td>
                  <td style={tdStyle}>
                    <span
                      style={{
                        padding: "2px 8px",
                        borderRadius: "4px",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        background: s.published
                          ? "rgba(34,197,94,0.15)"
                          : "rgba(248,113,113,0.15)",
                        color: s.published ? "#22c55e" : "#f87171",
                      }}
                    >
                      {s.published ? "Live" : "Draft"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ---- Sub-components ---- */

function StatCard({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div style={cardStyle}>
      <div style={{ fontSize: "0.8rem", color: "#888", marginBottom: "0.35rem" }}>
        {label}
      </div>
      <div style={{ fontSize: "1.75rem", fontWeight: 700, color: "#C8A97E" }}>
        {value}
      </div>
    </div>
  );
}

function PlanBadge({ plan }: { plan: string }) {
  const colors: Record<string, { bg: string; text: string }> = {
    free: { bg: "rgba(120,120,120,0.2)", text: "#888" },
    pro: { bg: "rgba(200,169,126,0.2)", text: "#C8A97E" },
    business: { bg: "rgba(167,139,250,0.2)", text: "#a78bfa" },
  };
  const c = colors[plan] || colors.free;
  return (
    <span
      style={{
        padding: "2px 8px",
        borderRadius: "4px",
        fontSize: "0.75rem",
        fontWeight: 600,
        background: c.bg,
        color: c.text,
        textTransform: "capitalize",
      }}
    >
      {plan}
    </span>
  );
}

function RevenueRow({
  label,
  amount,
  total,
  color,
}: {
  label: string;
  amount: number;
  total: number;
  color: string;
}) {
  const pct = total > 0 ? (amount / total) * 100 : 0;
  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: "0.85rem",
          marginBottom: "0.25rem",
        }}
      >
        <span style={{ color: "#ccc" }}>{label}</span>
        <span style={{ color, fontWeight: 600 }}>
          ${amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}
        </span>
      </div>
      <div
        style={{
          height: "6px",
          background: "#1a1a1a",
          borderRadius: "3px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: color,
            borderRadius: "3px",
            transition: "width 0.3s ease",
          }}
        />
      </div>
    </div>
  );
}

/* ---- Shared styles ---- */

const cardStyle: React.CSSProperties = {
  background: "#111",
  border: "1px solid #222",
  borderRadius: "12px",
  padding: "1.25rem",
};

const cardTitleStyle: React.CSSProperties = {
  fontSize: "0.9rem",
  fontWeight: 600,
  color: "#888",
  marginTop: 0,
  marginBottom: "1rem",
};

const thStyle: React.CSSProperties = {
  textAlign: "left",
  padding: "0.5rem 0.75rem",
  color: "#666",
  fontWeight: 600,
  fontSize: "0.75rem",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};

const tdStyle: React.CSSProperties = {
  padding: "0.5rem 0.75rem",
  color: "#ddd",
};
