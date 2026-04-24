"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Tab = "all-time" | "this-month" | "streaks";

interface LeaderboardEntry {
  rank: number;
  name: string;
  revenue: string;
  level: string;
  daysActive: number;
  streak?: number;
  isCurrentUser?: boolean;
}

const PLACEHOLDER_DATA: LeaderboardEntry[] = [];

const RANK_STYLES: Record<number, { bg: string; border: string; text: string; label: string }> = {
  1: { bg: "rgba(245, 166, 35, 0.12)", border: "rgba(245, 166, 35, 0.35)", text: "#f5a623", label: "GOLD" },
  2: { bg: "rgba(192, 192, 192, 0.08)", border: "rgba(192, 192, 192, 0.25)", text: "#c0c0c0", label: "SILVER" },
  3: { bg: "rgba(205, 127, 50, 0.08)", border: "rgba(205, 127, 50, 0.25)", text: "#cd7f32", label: "BRONZE" },
};

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span style={{ fontSize: 28 }}>👑</span>;
  if (rank === 2) return <span style={{ fontSize: 24 }}>🥈</span>;
  if (rank === 3) return <span style={{ fontSize: 24 }}>🥉</span>;
  return (
    <span style={{
      width: 32, height: 32, borderRadius: 8,
      display: "inline-flex", alignItems: "center", justifyContent: "center",
      fontSize: 14, fontWeight: 800, color: "rgba(245, 240, 232, 0.3)",
      background: "rgba(245, 240, 232, 0.04)",
    }}>
      {rank}
    </span>
  );
}

function LevelBadge({ level }: { level: string }) {
  const colors: Record<string, string> = {
    Starter: "#6b7280",
    Builder: "#3b82f6",
    Grower: "#22c55e",
    Scaler: "#f5a623",
    Legend: "#e07850",
  };
  const color = colors[level] ?? "#6b7280";
  return (
    <span style={{
      padding: "3px 10px", borderRadius: 100, fontSize: 11, fontWeight: 700,
      color, background: `${color}18`, border: `1px solid ${color}30`,
    }}>
      {level}
    </span>
  );
}

export default function LeaderboardPage() {
  const [tab, setTab] = useState<Tab>("all-time");
  const [entries, setEntries] = useState<LeaderboardEntry[]>(PLACEHOLDER_DATA);
  const [loading, setLoading] = useState(true);
  const [comingSoon, setComingSoon] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const res = await fetch(`/api/leaderboard?tab=${tab}`);
        if (res.ok) {
          const data = await res.json();
          if (data.entries && data.entries.length > 0) {
            setEntries(data.entries);
            setComingSoon(false);
          } else {
            setEntries([]);
            setComingSoon(true);
          }
        } else {
          setEntries([]);
          setComingSoon(true);
        }
      } catch {
        setEntries([]);
        setComingSoon(true);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [tab]);

  const tabs: { id: Tab; label: string }[] = [
    { id: "all-time", label: "All Time" },
    { id: "this-month", label: "This Month" },
    { id: "streaks", label: "Streaks" },
  ];

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(180deg, #0c0a08 0%, #141210 100%)",
      padding: "48px 16px",
    }}>
      <div style={{ maxWidth: 640, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 40 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            padding: "6px 14px", borderRadius: 100, marginBottom: 16,
            background: "rgba(245, 166, 35, 0.08)",
            border: "1px solid rgba(245, 166, 35, 0.15)",
            fontSize: 12, fontWeight: 800, color: "#f5a623",
            letterSpacing: 2, textTransform: "uppercase" as const,
          }}>
            Live Rankings
          </div>
          <h1 style={{
            fontSize: 40, fontWeight: 900, color: "#f5f0e8",
            margin: "0 0 8px", lineHeight: 1.1,
          }}>
            Leaderboard
          </h1>
          <p style={{ fontSize: 16, color: "rgba(245, 240, 232, 0.35)", margin: 0 }}>
            The top builders on Himalaya
          </p>
        </div>

        {/* Tabs */}
        <div style={{
          display: "flex", gap: 4, padding: 4, borderRadius: 12,
          background: "rgba(245, 240, 232, 0.04)",
          border: "1px solid rgba(245, 240, 232, 0.06)",
          marginBottom: 32,
        }}>
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              style={{
                flex: 1, padding: "10px 0", borderRadius: 8,
                fontSize: 14, fontWeight: 700, cursor: "pointer",
                border: "none", transition: "all 0.2s",
                background: tab === t.id ? "rgba(245, 166, 35, 0.12)" : "transparent",
                color: tab === t.id ? "#f5a623" : "rgba(245, 240, 232, 0.35)",
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ textAlign: "center", color: "rgba(245, 240, 232, 0.3)", padding: 64 }}>
            Loading leaderboard...
          </div>
        ) : comingSoon ? (
          /* Coming Soon State */
          <div style={{
            textAlign: "center", padding: "64px 24px", borderRadius: 20,
            background: "rgba(245, 166, 35, 0.03)",
            border: "1px solid rgba(245, 166, 35, 0.1)",
          }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🏔️</div>
            <h2 style={{
              fontSize: 24, fontWeight: 900, color: "#f5f0e8",
              margin: "0 0 8px",
            }}>
              Coming soon
            </h2>
            <p style={{
              fontSize: 16, color: "rgba(245, 240, 232, 0.35)",
              margin: "0 0 32px", maxWidth: 360, marginLeft: "auto", marginRight: "auto",
            }}>
              Be the first to claim the #1 spot. Start building your business today and your name will appear here.
            </p>
            <div style={{
              display: "inline-flex", flexDirection: "column" as const, gap: 12,
              padding: "20px 32px", borderRadius: 16,
              background: "rgba(245, 240, 232, 0.03)",
              border: "1px solid rgba(245, 240, 232, 0.06)",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 20 }}>👑</span>
                <span style={{ fontSize: 16, fontWeight: 800, color: "#f5a623" }}>#1</span>
                <span style={{ fontSize: 16, color: "rgba(245, 240, 232, 0.2)", fontStyle: "italic" as const }}>
                  — This could be you
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 18 }}>🥈</span>
                <span style={{ fontSize: 16, fontWeight: 800, color: "rgba(245, 240, 232, 0.15)" }}>#2</span>
                <span style={{ fontSize: 16, color: "rgba(245, 240, 232, 0.1)" }}>Unclaimed</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <span style={{ fontSize: 18 }}>🥉</span>
                <span style={{ fontSize: 16, fontWeight: 800, color: "rgba(245, 240, 232, 0.15)" }}>#3</span>
                <span style={{ fontSize: 16, color: "rgba(245, 240, 232, 0.1)" }}>Unclaimed</span>
              </div>
            </div>
          </div>
        ) : (
          /* Leaderboard Entries */
          <div style={{ display: "flex", flexDirection: "column" as const, gap: 8 }}>
            {entries.map((entry) => {
              const special = RANK_STYLES[entry.rank];
              return (
                <div
                  key={entry.rank}
                  style={{
                    display: "flex", alignItems: "center", gap: 16,
                    padding: "16px 20px", borderRadius: 14,
                    background: special?.bg ?? "rgba(245, 240, 232, 0.02)",
                    border: `1px solid ${special?.border ?? "rgba(245, 240, 232, 0.06)"}`,
                    transition: "all 0.2s",
                    ...(entry.isCurrentUser ? {
                      boxShadow: "0 0 20px rgba(245, 166, 35, 0.15)",
                      border: "1px solid rgba(245, 166, 35, 0.4)",
                    } : {}),
                  }}
                >
                  <RankBadge rank={entry.rank} />

                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
                      <span style={{
                        fontSize: 16, fontWeight: 800,
                        color: special?.text ?? "#f5f0e8",
                      }}>
                        {entry.name}
                      </span>
                      {entry.isCurrentUser && (
                        <span style={{
                          padding: "2px 8px", borderRadius: 100,
                          fontSize: 10, fontWeight: 800, color: "#f5a623",
                          background: "rgba(245, 166, 35, 0.15)",
                        }}>
                          YOU
                        </span>
                      )}
                      <LevelBadge level={entry.level} />
                    </div>
                    <span style={{ fontSize: 12, color: "rgba(245, 240, 232, 0.25)" }}>
                      {entry.daysActive} days active
                      {tab === "streaks" && entry.streak ? ` · ${entry.streak}-day streak` : ""}
                    </span>
                  </div>

                  <div style={{
                    fontSize: 20, fontWeight: 900,
                    color: special?.text ?? "rgba(245, 240, 232, 0.6)",
                  }}>
                    {tab === "streaks" ? `${entry.streak ?? 0}d` : entry.revenue}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* CTA */}
        <div style={{
          textAlign: "center", marginTop: 48, padding: "32px 24px",
          borderRadius: 20,
          background: "linear-gradient(135deg, rgba(245, 166, 35, 0.06) 0%, rgba(224, 120, 80, 0.06) 100%)",
          border: "1px solid rgba(245, 166, 35, 0.12)",
        }}>
          <h3 style={{
            fontSize: 22, fontWeight: 900, color: "#f5f0e8",
            margin: "0 0 8px",
          }}>
            Join Himalaya and start building
          </h3>
          <p style={{
            fontSize: 14, color: "rgba(245, 240, 232, 0.35)",
            margin: "0 0 20px",
          }}>
            Launch your business, track your revenue, climb the ranks.
          </p>
          <Link
            href="/sign-up"
            style={{
              display: "inline-flex", padding: "12px 32px", borderRadius: 12,
              fontSize: 15, fontWeight: 800, textDecoration: "none",
              background: "linear-gradient(135deg, #f5a623, #e07850)",
              color: "#0c0a08", transition: "all 0.2s",
            }}
          >
            Get Started Free
          </Link>
        </div>

        {/* Brand footer */}
        <div style={{
          textAlign: "center", marginTop: 32, paddingBottom: 32,
          fontSize: 12, fontWeight: 800, letterSpacing: 4,
          color: "rgba(245, 240, 232, 0.08)",
        }}>
          HIMALAYA
        </div>
      </div>
    </div>
  );
}
