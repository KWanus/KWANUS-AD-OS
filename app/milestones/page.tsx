"use client";

import { useEffect, useState } from "react";

interface Milestone {
  id: string;
  title: string;
  description: string;
  icon: string;
  earned: boolean;
  earnedAt?: string;
  amount?: string;
}

const MILESTONE_DEFINITIONS: Omit<Milestone, "earned" | "earnedAt">[] = [
  { id: "first-business", title: "First Business Built", description: "Created your first business", icon: "🏗️", amount: undefined },
  { id: "site-published", title: "Site Published", description: "Published your first site", icon: "🌐", amount: undefined },
  { id: "first-lead", title: "First Lead", description: "Captured your first lead", icon: "🎯", amount: undefined },
  { id: "first-sale", title: "First Sale", description: "Made your first sale", icon: "💰", amount: undefined },
  { id: "revenue-100", title: "$100 Revenue", description: "Earned $100 in revenue", icon: "📈", amount: "$100" },
  { id: "revenue-1k", title: "$1,000 Revenue", description: "Earned $1,000 in revenue", icon: "🚀", amount: "$1,000" },
  { id: "revenue-10k", title: "$10,000 Revenue", description: "Earned $10,000 in revenue", icon: "💎", amount: "$10,000" },
  { id: "streak-7", title: "7-Day Streak", description: "Active for 7 days straight", icon: "🔥", amount: undefined },
  { id: "streak-30", title: "30-Day Streak", description: "Active for 30 days straight", icon: "⚡", amount: undefined },
  { id: "leads-10", title: "10 Leads", description: "Captured 10 leads", icon: "📋", amount: undefined },
  { id: "leads-100", title: "100 Leads", description: "Captured 100 leads", icon: "🏆", amount: undefined },
];

function buildShareCardUrl(milestone: Milestone, userName: string) {
  const params = new URLSearchParams({
    title: milestone.title,
    amount: milestone.amount ?? "$0",
    days: "1",
    level: "Builder",
    name: userName,
  });
  return `/api/milestones/share-card?${params.toString()}`;
}

function ShareButtons({ milestone, userName }: { milestone: Milestone; userName: string }) {
  const [copied, setCopied] = useState(false);
  const cardUrl = typeof window !== "undefined"
    ? `${window.location.origin}${buildShareCardUrl(milestone, userName)}`
    : buildShareCardUrl(milestone, userName);

  const tweetText = encodeURIComponent(`I just hit ${milestone.title} with @HimalayaApp!`);
  const twitterUrl = `https://twitter.com/intent/tweet?text=${tweetText}&url=${encodeURIComponent(cardUrl)}`;
  const linkedInUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(cardUrl)}`;

  const copyLink = async () => {
    await navigator.clipboard.writeText(cardUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
      <a
        href={twitterUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          padding: "6px 12px", borderRadius: 8, fontSize: 13, fontWeight: 600,
          background: "rgba(29, 155, 240, 0.15)", color: "#1d9bf0",
          border: "1px solid rgba(29, 155, 240, 0.25)", textDecoration: "none",
          transition: "all 0.2s",
        }}
      >
        Twitter
      </a>
      <a
        href={linkedInUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          padding: "6px 12px", borderRadius: 8, fontSize: 13, fontWeight: 600,
          background: "rgba(10, 102, 194, 0.15)", color: "#0a66c2",
          border: "1px solid rgba(10, 102, 194, 0.25)", textDecoration: "none",
          transition: "all 0.2s",
        }}
      >
        LinkedIn
      </a>
      <button
        onClick={copyLink}
        style={{
          padding: "6px 12px", borderRadius: 8, fontSize: 13, fontWeight: 600,
          background: "rgba(245, 166, 35, 0.1)", color: "#f5a623",
          border: "1px solid rgba(245, 166, 35, 0.25)", cursor: "pointer",
          transition: "all 0.2s",
        }}
      >
        {copied ? "Copied!" : "Copy Link"}
      </button>
    </div>
  );
}

export default function MilestonesPage() {
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [userName, setUserName] = useState("Entrepreneur");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/himalaya/success");
        if (res.ok) {
          const data = await res.json();
          if (data.milestones) {
            // Merge API milestones with definitions
            const merged = MILESTONE_DEFINITIONS.map((def) => {
              const match = data.milestones?.find((m: { id: string }) => m.id === def.id);
              return {
                ...def,
                earned: !!match,
                earnedAt: match?.earnedAt,
              };
            });
            setMilestones(merged);
          } else {
            setMilestones(MILESTONE_DEFINITIONS.map((d) => ({ ...d, earned: false })));
          }
          if (data.name) setUserName(data.name);
        } else {
          setMilestones(MILESTONE_DEFINITIONS.map((d) => ({ ...d, earned: false })));
        }
      } catch {
        setMilestones(MILESTONE_DEFINITIONS.map((d) => ({ ...d, earned: false })));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const earned = milestones.filter((m) => m.earned);
  const locked = milestones.filter((m) => !m.earned);

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(180deg, #0c0a08 0%, #141210 100%)",
      padding: "48px 16px",
    }}>
      <div style={{ maxWidth: 768, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <h1 style={{
            fontSize: 36, fontWeight: 900, color: "#f5f0e8",
            margin: "0 0 8px",
          }}>
            Your Milestones
          </h1>
          <p style={{ fontSize: 16, color: "rgba(245, 240, 232, 0.4)", margin: 0 }}>
            Track your progress and share your wins
          </p>
          <div style={{
            marginTop: 16, display: "inline-flex", alignItems: "center", gap: 8,
            padding: "8px 16px", borderRadius: 100,
            background: "rgba(245, 166, 35, 0.08)",
            border: "1px solid rgba(245, 166, 35, 0.15)",
          }}>
            <span style={{ fontSize: 14, fontWeight: 700, color: "#f5a623" }}>
              {earned.length} / {milestones.length} earned
            </span>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", color: "rgba(245, 240, 232, 0.3)", padding: 64 }}>
            Loading milestones...
          </div>
        ) : (
          <>
            {/* Earned milestones */}
            {earned.length > 0 && (
              <div style={{ marginBottom: 48 }}>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: "#f5a623", margin: "0 0 20px" }}>
                  Earned
                </h2>
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(340, 1fr))",
                  gap: 16,
                }}>
                  {earned.map((m) => (
                    <div
                      key={m.id}
                      style={{
                        padding: 24, borderRadius: 16,
                        background: "rgba(245, 166, 35, 0.04)",
                        border: "1px solid rgba(245, 166, 35, 0.15)",
                        transition: "all 0.2s",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                        <span style={{ fontSize: 32 }}>{m.icon}</span>
                        <div>
                          <div style={{ fontSize: 18, fontWeight: 800, color: "#f5f0e8" }}>
                            {m.title}
                          </div>
                          <div style={{ fontSize: 13, color: "rgba(245, 240, 232, 0.35)" }}>
                            {m.earnedAt
                              ? `Earned ${new Date(m.earnedAt).toLocaleDateString()}`
                              : m.description}
                          </div>
                        </div>
                      </div>
                      <ShareButtons milestone={m} userName={userName} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Locked milestones */}
            {locked.length > 0 && (
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 700, color: "rgba(245, 240, 232, 0.25)", margin: "0 0 20px" }}>
                  Locked
                </h2>
                <div style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))",
                  gap: 16,
                }}>
                  {locked.map((m) => (
                    <div
                      key={m.id}
                      style={{
                        padding: 24, borderRadius: 16,
                        background: "rgba(245, 240, 232, 0.02)",
                        border: "1px solid rgba(245, 240, 232, 0.06)",
                        opacity: 0.5,
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <span style={{ fontSize: 32, filter: "grayscale(1)" }}>{m.icon}</span>
                        <div>
                          <div style={{ fontSize: 18, fontWeight: 800, color: "rgba(245, 240, 232, 0.35)" }}>
                            {m.title}
                          </div>
                          <div style={{ fontSize: 13, color: "rgba(245, 240, 232, 0.2)" }}>
                            Keep going — you&apos;ll get there
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
