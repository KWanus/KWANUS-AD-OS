"use client";

// ---------------------------------------------------------------------------
// BlockRenderer — World-class block designs for Himalaya site builder
// ---------------------------------------------------------------------------

export type BlockType =
  | "hero"
  | "features"
  | "text"
  | "image"
  | "cta"
  | "testimonials"
  | "pricing"
  | "faq"
  | "form"
  | "video"
  | "products"
  | "divider"
  | "checkout"
  | "payment"
  | "footer"
  | "stats"
  | "guarantee"
  | "trust_badges"
  | "process"
  | "before_after"
  | "urgency"
  | "booking";

export interface Block {
  id: string;
  type: BlockType;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  props: Record<string, any>;
}

interface SiteTheme {
  primaryColor?: string;
  font?: string;
  mode?: "dark" | "light";
}

interface SiteProduct {
  id: string;
  name: string;
  description?: string | null;
  price: number;
  compareAt?: number | null;
  images: string[];
  slug?: string;
}

interface Props {
  block: Block;
  theme?: SiteTheme;
  preview?: boolean;
  selected?: boolean;
  onClick?: () => void;
  products?: SiteProduct[];
  siteId?: string;
  overlayActions?: Array<{
    label: string;
    onClick: () => void;
  }>;
}

const DEFAULT_THEME: SiteTheme = { primaryColor: "#f5a623", font: "inter", mode: "dark" };

function px(color: string) { return color ?? "#f5a623"; }

// ---------------------------------------------------------------------------
// Shared style helpers
// ---------------------------------------------------------------------------

function sectionBase(bg: string, padding = "100px 24px"): React.CSSProperties {
  return { background: bg, padding };
}

function container(maxWidth = 1100): React.CSSProperties {
  return { maxWidth, margin: "0 auto", width: "100%" };
}

function headingStyle(color: string, size = "clamp(1.75rem,4vw,2.75rem)"): React.CSSProperties {
  return { color, fontSize: size, fontWeight: 900, lineHeight: 1.1, margin: 0 };
}

function eyebrowStyle(color: string): React.CSSProperties {
  return { color, fontSize: 11, fontWeight: 800, letterSpacing: "0.22em", textTransform: "uppercase" as const, margin: 0 };
}

// ---------------------------------------------------------------------------
// HERO — Cinematic gradient hero with social proof and dual CTAs
// ---------------------------------------------------------------------------

function HeroBlock({ props, theme }: { props: Block["props"]; theme: SiteTheme }) {
  const isDark = theme.mode !== "light";
  const primary = px(theme.primaryColor!);
  const bg = props.bgColor ?? (isDark
    ? `radial-gradient(ellipse 80% 60% at 50% -10%, ${primary}22 0%, transparent 60%), #0c0a08`
    : `radial-gradient(ellipse 80% 60% at 50% -10%, ${primary}15 0%, transparent 60%), #ffffff`);
  const textColor = isDark ? "#ffffff" : "#0f172a";
  const subColor = isDark ? "rgba(255,255,255,0.55)" : "rgba(15,23,42,0.6)";
  const align = props.textAlign ?? "center";
  const socialProof = props.socialProofText;
  const trustItems: string[] = props.trustItems ?? [];

  return (
    <section style={{ ...sectionBase(bg, "110px 24px 100px"), textAlign: align as "center" | "left" }}>
      <div style={{ ...container(860), display: "flex", flexDirection: "column", alignItems: align === "center" ? "center" : "flex-start", gap: 0 }}>

        {/* Social proof pill */}
        {socialProof && (
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
            border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"}`,
            borderRadius: 100, padding: "6px 14px", marginBottom: 28,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#22c55e", display: "inline-block", flexShrink: 0, boxShadow: "0 0 6px #22c55e" }} />
            <span style={{ color: isDark ? "rgba(255,255,255,0.7)" : "rgba(0,0,0,0.6)", fontSize: 12, fontWeight: 600 }}>{socialProof}</span>
          </div>
        )}

        {props.eyebrow && (
          <p style={{ ...eyebrowStyle(primary), marginBottom: 16 }}>{props.eyebrow}</p>
        )}

        <h1 style={{ ...headingStyle(textColor, "clamp(2.2rem,5.5vw,4rem)"), maxWidth: 800, textAlign: align as "center" | "left", marginBottom: 24 }}>
          {props.headline || "Your Headline Here"}
        </h1>

        {props.subheadline && (
          <p style={{ color: subColor, fontSize: "clamp(1rem,2vw,1.2rem)", maxWidth: 600, lineHeight: 1.7, marginBottom: 40, textAlign: align as "center" | "left" }}>
            {props.subheadline}
          </p>
        )}

        {/* CTAs */}
        {props.buttonText && (
          <div style={{ display: "flex", gap: 14, justifyContent: align === "center" ? "center" : "flex-start", flexWrap: "wrap", marginBottom: trustItems.length ? 48 : 0 }}>
            <a href={props.buttonUrl ?? "#"} style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "15px 34px", borderRadius: 14,
              background: `linear-gradient(135deg, ${primary}, #e07850)`,
              boxShadow: `0 8px 32px ${primary}55`,
              color: "#fff", fontWeight: 800, fontSize: 15, textDecoration: "none",
              letterSpacing: "0.01em",
            }}>
              {props.buttonText}
              <span style={{ fontSize: 16 }}>→</span>
            </a>
            {props.secondaryButtonText && (
              <a href={props.secondaryButtonUrl ?? "#"} style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "15px 34px", borderRadius: 14,
                border: `1px solid ${isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.15)"}`,
                color: textColor, fontWeight: 700, fontSize: 15, textDecoration: "none",
                background: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.02)",
              }}>
                {props.secondaryButtonText}
              </a>
            )}
          </div>
        )}

        {/* Trust items */}
        {trustItems.length > 0 && (
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap", justifyContent: align === "center" ? "center" : "flex-start", marginTop: props.buttonText ? 0 : 0 }}>
            {trustItems.map((item: string, i: number) => (
              <span key={i} style={{ display: "flex", alignItems: "center", gap: 6, color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.45)", fontSize: 12, fontWeight: 600 }}>
                <span style={{ color: "#22c55e" }}>✓</span> {item}
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// FEATURES — Gradient icon grid with hover-ready cards
// ---------------------------------------------------------------------------

function FeaturesBlock({ props, theme }: { props: Block["props"]; theme: SiteTheme }) {
  const isDark = theme.mode !== "light";
  const primary = px(theme.primaryColor!);
  const bg = props?.bgColor ?? (isDark ? "#07101f" : "#f8fafc");
  const textColor = isDark ? "#ffffff" : "#0f172a";
  const subColor = isDark ? "rgba(255,255,255,0.5)" : "rgba(15,23,42,0.55)";
  const cardBg = isDark ? "rgba(255,255,255,0.03)" : "#ffffff";
  const cardBorder = isDark ? "rgba(255,255,255,0.07)" : "#e2e8f0";
  const cols = props?.columns ?? 3;
  const items: { icon?: string; title?: string; body?: string; number?: string }[] = props?.items ?? [];
  const layout = props?.layout ?? "grid"; // "grid" | "list" | "icon-top"

  return (
    <section style={sectionBase(bg)}>
      <div style={container()}>
        {(props?.eyebrow || props?.title) && (
          <div style={{ textAlign: "center", marginBottom: 60 }}>
            {props?.eyebrow && <p style={{ ...eyebrowStyle(primary), marginBottom: 12 }}>{props.eyebrow}</p>}
            {props?.title && <h2 style={{ ...headingStyle(textColor), marginBottom: 16 }}>{props.title}</h2>}
            {props?.subtitle && <p style={{ color: subColor, fontSize: 17, maxWidth: 560, margin: "0 auto", lineHeight: 1.7 }}>{props.subtitle}</p>}
          </div>
        )}
        <div style={{
          display: "grid",
          gridTemplateColumns: layout === "list"
            ? "1fr"
            : `repeat(${Math.min(cols, items.length || cols)}, 1fr)`,
          gap: layout === "list" ? 12 : 20,
        }}>
          {items.map((item, i) => (
            <div key={i} style={{
              background: cardBg,
              border: `1px solid ${cardBorder}`,
              borderRadius: 20,
              padding: layout === "list" ? "20px 24px" : "32px 28px",
              display: "flex",
              flexDirection: layout === "list" ? "row" : "column",
              gap: layout === "list" ? 16 : 18,
              alignItems: layout === "list" ? "flex-start" : undefined,
            }}>
              {item.icon && (
                <div style={{
                  width: 52, height: 52, borderRadius: 14, flexShrink: 0,
                  background: `linear-gradient(135deg, ${primary}22, #e0785022)`,
                  border: `1px solid ${primary}33`,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24,
                }}>
                  {item.icon}
                </div>
              )}
              {!item.icon && item.number && (
                <div style={{
                  width: 40, height: 40, borderRadius: "50%", flexShrink: 0,
                  background: `linear-gradient(135deg, ${primary}, #e07850)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#fff", fontWeight: 900, fontSize: 15,
                }}>
                  {item.number ?? i + 1}
                </div>
              )}
              <div>
                {item.title && <h3 style={{ color: textColor, fontSize: 17, fontWeight: 800, marginBottom: 8 }}>{item.title}</h3>}
                {item.body && <p style={{ color: subColor, fontSize: 14, lineHeight: 1.7, margin: 0 }}>{item.body}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// STATS / NUMBERS — Social proof bar (new top-1% conversion block)
// ---------------------------------------------------------------------------

function StatsBlock({ props, theme }: { props: Block["props"]; theme: SiteTheme }) {
  const isDark = theme.mode !== "light";
  const primary = px(theme.primaryColor!);
  const bg = props?.bgColor ?? (isDark
    ? `linear-gradient(135deg, ${primary}18 0%, transparent 50%), #06101e`
    : `linear-gradient(135deg, ${primary}0a 0%, transparent 50%), #f0f9ff`);
  const textColor = isDark ? "#ffffff" : "#0f172a";
  const subColor = isDark ? "rgba(255,255,255,0.45)" : "rgba(15,23,42,0.5)";
  const borderColor = isDark ? "rgba(255,255,255,0.07)" : "#e2e8f0";
  const stats: { number?: string; label?: string; suffix?: string }[] = props?.stats ?? [
    { number: "500+", label: "Happy Clients" },
    { number: "98%", label: "Satisfaction Rate" },
    { number: "5★", label: "Average Rating" },
    { number: "24h", label: "Response Time" },
  ];

  return (
    <section style={sectionBase(bg, "72px 24px")}>
      <div style={container()}>
        <div style={{
          display: "grid",
          gridTemplateColumns: `repeat(${Math.min(stats.length, 4)}, 1fr)`,
          gap: 0,
          border: `1px solid ${borderColor}`,
          borderRadius: 20, overflow: "hidden",
        }}>
          {stats.map((stat, i) => (
            <div key={i} style={{
              padding: "36px 24px",
              textAlign: "center",
              borderRight: i < stats.length - 1 ? `1px solid ${borderColor}` : "none",
            }}>
              <div style={{ fontSize: "clamp(2rem,4vw,3rem)", fontWeight: 900, color: primary, lineHeight: 1, marginBottom: 8 }}>
                {stat.number}{stat.suffix}
              </div>
              <div style={{ color: subColor, fontSize: 13, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
        {props?.caption && (
          <p style={{ color: subColor, textAlign: "center", fontSize: 13, marginTop: 20 }}>{props.caption}</p>
        )}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// TESTIMONIALS — Masonry-style with verified badges and large quotes
// ---------------------------------------------------------------------------

function TestimonialsBlock({ props, theme }: { props: Block["props"]; theme: SiteTheme }) {
  const isDark = theme.mode !== "light";
  const primary = px(theme.primaryColor!);
  const bg = props.bgColor ?? (isDark ? "#0c0a08" : "#f8fafc");
  const textColor = isDark ? "#ffffff" : "#0f172a";
  const subColor = isDark ? "rgba(255,255,255,0.65)" : "rgba(15,23,42,0.65)";
  const cardBg = isDark ? "rgba(255,255,255,0.035)" : "#ffffff";
  const cardBorder = isDark ? "rgba(255,255,255,0.08)" : "#e2e8f0";
  const items: { name?: string; role?: string; company?: string; quote?: string; avatar?: string; stars?: number; verified?: boolean; result?: string }[] = props.items ?? [];

  return (
    <section style={sectionBase(bg)}>
      <div style={container()}>
        {(props.eyebrow || props.title) && (
          <div style={{ textAlign: "center", marginBottom: 60 }}>
            {props.eyebrow && <p style={{ ...eyebrowStyle(primary), marginBottom: 12 }}>{props.eyebrow}</p>}
            {props.title && <h2 style={{ ...headingStyle(textColor), marginBottom: 16 }}>{props.title}</h2>}
            {props?.subtitle && <p style={{ color: subColor, fontSize: 16, maxWidth: 540, margin: "0 auto" }}>{props.subtitle}</p>}
          </div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
          {items.map((item, i) => (
            <div key={i} style={{
              background: cardBg,
              border: `1px solid ${cardBorder}`,
              borderRadius: 20, padding: "32px 28px",
              display: "flex", flexDirection: "column", gap: 20,
              position: "relative",
            }}>
              {/* Result callout */}
              {item.result && (
                <div style={{
                  position: "absolute", top: -1, right: 20,
                  background: `linear-gradient(135deg, ${primary}, #e07850)`,
                  color: "#fff", fontSize: 11, fontWeight: 800,
                  padding: "4px 12px", borderRadius: "0 0 10px 10px",
                  letterSpacing: "0.05em",
                }}>
                  {item.result}
                </div>
              )}
              {/* Stars */}
              <div style={{ display: "flex", gap: 3 }}>
                {[...Array(item.stars ?? 5)].map((_, j) => (
                  <span key={j} style={{ color: "#f59e0b", fontSize: 16 }}>★</span>
                ))}
              </div>
              {/* Quote */}
              <div>
                <div style={{ color: primary, fontSize: 48, lineHeight: 0.6, fontFamily: "Georgia, serif", opacity: 0.4, marginBottom: 8 }}>&ldquo;</div>
                {item.quote && <p style={{ color: subColor, fontSize: 15, lineHeight: 1.75, margin: 0 }}>{item.quote}</p>}
              </div>
              {/* Author */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: "auto" }}>
                {item.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.avatar} alt={item.name ?? ""} style={{ width: 44, height: 44, borderRadius: "50%", objectFit: "cover", flexShrink: 0 }} />
                ) : (
                  <div style={{
                    width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
                    background: `linear-gradient(135deg, ${primary}, #e07850)`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#fff", fontWeight: 800, fontSize: 15,
                  }}>
                    {(item.name ?? "A").charAt(0).toUpperCase()}
                  </div>
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {item.name && <span style={{ color: textColor, fontSize: 14, fontWeight: 700 }}>{item.name}</span>}
                    {item.verified !== false && (
                      <span style={{ color: "#3b82f6", fontSize: 14 }}>✓</span>
                    )}
                  </div>
                  {(item.role || item.company) && (
                    <span style={{ color: isDark ? "rgba(255,255,255,0.38)" : "rgba(0,0,0,0.4)", fontSize: 12 }}>
                      {[item.role, item.company].filter(Boolean).join(" · ")}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// PRICING — 3-tier with highlighted popular tier, feature list, shadow
// ---------------------------------------------------------------------------

function PricingBlock({ props, theme }: { props: Block["props"]; theme: SiteTheme }) {
  const isDark = theme.mode !== "light";
  const primary = px(theme.primaryColor!);
  const bg = props.bgColor ?? (isDark ? "#07101f" : "#f8fafc");
  const textColor = isDark ? "#ffffff" : "#0f172a";
  const subColor = isDark ? "rgba(255,255,255,0.45)" : "rgba(15,23,42,0.5)";
  const cardBg = isDark ? "rgba(255,255,255,0.025)" : "#ffffff";
  const cardBorder = isDark ? "rgba(255,255,255,0.08)" : "#e2e8f0";
  const tiers: { label?: string; price?: string; period?: string; description?: string; features?: string[]; buttonText?: string; buttonUrl?: string; highlight?: boolean; badge?: string; strikePrice?: string }[] = props.tiers ?? [];

  return (
    <section style={sectionBase(bg)}>
      <div style={container()}>
        {(props.eyebrow || props.title) && (
          <div style={{ textAlign: "center", marginBottom: 60 }}>
            {props.eyebrow && <p style={{ ...eyebrowStyle(primary), marginBottom: 12 }}>{props.eyebrow}</p>}
            {props.title && <h2 style={{ ...headingStyle(textColor), marginBottom: 16 }}>{props.title}</h2>}
            {props?.subtitle && <p style={{ color: subColor, fontSize: 16, maxWidth: 520, margin: "0 auto" }}>{props.subtitle}</p>}
          </div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(tiers.length || 3, 3)}, 1fr)`, gap: 20, alignItems: "start" }}>
          {tiers.map((tier, i) => (
            <div key={i} style={{
              background: tier.highlight
                ? isDark ? "rgba(255,255,255,0.06)" : "#ffffff"
                : cardBg,
              border: `1px solid ${tier.highlight ? primary : cardBorder}`,
              borderRadius: 22,
              padding: "36px 28px",
              display: "flex", flexDirection: "column", gap: 24,
              position: "relative",
              boxShadow: tier.highlight
                ? `0 20px 60px ${primary}25, 0 0 0 1px ${primary}40`
                : "none",
              transform: tier.highlight ? "scale(1.03)" : "none",
            }}>
              {/* Popular badge */}
              {tier.badge && (
                <div style={{
                  position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)",
                  background: `linear-gradient(135deg, ${primary}, #e07850)`,
                  color: "#fff", fontSize: 11, fontWeight: 800,
                  padding: "4px 18px", borderRadius: 100,
                  letterSpacing: "0.1em", textTransform: "uppercase", whiteSpace: "nowrap",
                }}>
                  {tier.badge}
                </div>
              )}

              <div>
                {tier.label && <p style={{ color: tier.highlight ? primary : subColor, fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", margin: "0 0 12px" }}>{tier.label}</p>}
                <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                  {tier.strikePrice && (
                    <span style={{ color: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.25)", fontSize: 20, textDecoration: "line-through", marginRight: 4 }}>{tier.strikePrice}</span>
                  )}
                  <span style={{ color: textColor, fontSize: 42, fontWeight: 900, lineHeight: 1 }}>{tier.price}</span>
                  {tier.period && <span style={{ color: subColor, fontSize: 14 }}>{tier.period}</span>}
                </div>
                {tier.description && <p style={{ color: subColor, fontSize: 14, marginTop: 10, lineHeight: 1.6, margin: "10px 0 0" }}>{tier.description}</p>}
              </div>

              {tier.buttonText && (
                <a href={tier.buttonUrl ?? "#"} style={{
                  display: "block", textAlign: "center",
                  padding: "13px 24px", borderRadius: 12,
                  background: tier.highlight ? `linear-gradient(135deg, ${primary}, #e07850)` : "transparent",
                  border: tier.highlight ? "none" : `1px solid ${cardBorder}`,
                  color: tier.highlight ? "#fff" : textColor,
                  fontWeight: 800, fontSize: 14, textDecoration: "none",
                  boxShadow: tier.highlight ? `0 4px 20px ${primary}40` : "none",
                }}>
                  {tier.buttonText}
                </a>
              )}

              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 11 }}>
                {(tier.features ?? []).map((f: string, j: number) => (
                  <li key={j} style={{ display: "flex", alignItems: "flex-start", gap: 10, color: isDark ? "rgba(255,255,255,0.7)" : "rgba(15,23,42,0.7)", fontSize: 14, lineHeight: 1.5 }}>
                    <span style={{ color: tier.highlight ? primary : "#22c55e", fontSize: 16, flexShrink: 0, marginTop: 1 }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        {props.guarantee && (
          <p style={{ color: subColor, textAlign: "center", fontSize: 13, marginTop: 32 }}>
            🔒 {props.guarantee}
          </p>
        )}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// FAQ — Clean accordion with animated chevron indicator
// ---------------------------------------------------------------------------

function FAQBlock({ props, theme }: { props: Block["props"]; theme: SiteTheme }) {
  const isDark = theme.mode !== "light";
  const primary = px(theme.primaryColor!);
  const bg = props.bgColor ?? (isDark ? "#0c0a08" : "#ffffff");
  const textColor = isDark ? "#ffffff" : "#0f172a";
  const subColor = isDark ? "rgba(255,255,255,0.6)" : "rgba(15,23,42,0.65)";
  const borderColor = isDark ? "rgba(255,255,255,0.07)" : "#e8edf2";
  const items: { q?: string; a?: string }[] = props.items ?? [];

  return (
    <section style={sectionBase(bg)}>
      <div style={{ ...container(780) }}>
        {(props.eyebrow || props.title) && (
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            {props.eyebrow && <p style={{ ...eyebrowStyle(primary), marginBottom: 12 }}>{props.eyebrow}</p>}
            {props.title && <h2 style={{ ...headingStyle(textColor), marginBottom: 16 }}>{props.title}</h2>}
            {props?.subtitle && <p style={{ color: subColor, fontSize: 16, maxWidth: 520, margin: "0 auto" }}>{props.subtitle}</p>}
          </div>
        )}
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          {items.map((item, i) => (
            <details key={i} style={{
              background: isDark ? "rgba(255,255,255,0.025)" : "rgba(0,0,0,0.02)",
              border: `1px solid ${borderColor}`,
              borderRadius: 14, overflow: "hidden",
            }}>
              <summary style={{
                color: textColor, fontSize: 16, fontWeight: 700,
                cursor: "pointer", padding: "20px 24px",
                listStyle: "none", display: "flex",
                justifyContent: "space-between", alignItems: "center", gap: 16,
              }}>
                <span>{item.q ?? "Question"}</span>
                <span style={{
                  width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                  background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: primary, fontSize: 18, fontWeight: 400,
                }}>+</span>
              </summary>
              <div style={{ padding: "0 24px 20px", borderTop: `1px solid ${borderColor}` }}>
                <p style={{ color: subColor, fontSize: 15, lineHeight: 1.75, margin: "16px 0 0" }}>
                  {item.a ?? "Answer"}
                </p>
              </div>
            </details>
          ))}
        </div>
        {props.ctaText && (
          <div style={{ textAlign: "center", marginTop: 48 }}>
            <p style={{ color: subColor, fontSize: 15, marginBottom: 16 }}>{props.ctaText}</p>
            {props.ctaButtonText && (
              <a href={props.ctaButtonUrl ?? "#"} style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "13px 28px", borderRadius: 12,
                background: `linear-gradient(135deg, ${primary}, #e07850)`,
                color: "#fff", fontWeight: 800, fontSize: 14, textDecoration: "none",
              }}>
                {props.ctaButtonText}
              </a>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// CTA — High-urgency conversion section with gradient bg and guarantee
// ---------------------------------------------------------------------------

function CTABlock({ props, theme }: { props: Block["props"]; theme: SiteTheme }) {
  const primary = px(theme.primaryColor!);
  const bg = props.bgColor ?? `linear-gradient(135deg, ${primary}ee 0%, #e07850ee 100%)`;
  const trustItems: string[] = props.trustItems ?? [];

  return (
    <section style={{ background: bg, padding: "100px 24px", textAlign: "center", position: "relative", overflow: "hidden" }}>
      {/* Subtle noise overlay */}
      <div style={{
        position: "absolute", inset: 0, opacity: 0.05,
        backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")",
        pointerEvents: "none",
      }} />
      <div style={{ ...container(720), position: "relative" }}>
        {props.eyebrow && <p style={{ ...eyebrowStyle("rgba(255,255,255,0.7)"), marginBottom: 16 }}>{props.eyebrow}</p>}
        <h2 style={{ ...headingStyle("#ffffff", "clamp(2rem,4.5vw,3.25rem)"), marginBottom: 20 }}>
          {props.headline || "Ready to get started?"}
        </h2>
        {props.subheadline && (
          <p style={{ color: "rgba(255,255,255,0.8)", fontSize: 18, lineHeight: 1.7, marginBottom: 40, maxWidth: 560, margin: "0 auto 40px" }}>
            {props.subheadline}
          </p>
        )}
        {props.buttonText && (
          <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap", marginBottom: 28 }}>
            <a href={props.buttonUrl ?? "#"} style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "16px 40px", borderRadius: 14,
              background: "#ffffff",
              color: "#0f172a", fontWeight: 900, fontSize: 16, textDecoration: "none",
              boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
            }}>
              {props.buttonText} <span style={{ fontSize: 18 }}>→</span>
            </a>
            {props.secondaryButtonText && (
              <a href={props.secondaryButtonUrl ?? "#"} style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "16px 40px", borderRadius: 14,
                border: "1px solid rgba(255,255,255,0.35)",
                color: "#ffffff", fontWeight: 700, fontSize: 16, textDecoration: "none",
              }}>
                {props.secondaryButtonText}
              </a>
            )}
          </div>
        )}
        {trustItems.length > 0 && (
          <div style={{ display: "flex", gap: 20, flexWrap: "wrap", justifyContent: "center" }}>
            {trustItems.map((item: string, i: number) => (
              <span key={i} style={{ display: "flex", alignItems: "center", gap: 6, color: "rgba(255,255,255,0.65)", fontSize: 13, fontWeight: 600 }}>
                <span>✓</span> {item}
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// GUARANTEE — Trust shield block
// ---------------------------------------------------------------------------

function GuaranteeBlock({ props, theme }: { props: Block["props"]; theme: SiteTheme }) {
  const isDark = theme.mode !== "light";
  const primary = px(theme.primaryColor!);
  const bg = props.bgColor ?? (isDark ? "#0c0a08" : "#ffffff");
  const textColor = isDark ? "#ffffff" : "#0f172a";
  const subColor = isDark ? "rgba(255,255,255,0.6)" : "rgba(15,23,42,0.6)";
  const borderColor = isDark ? "rgba(255,255,255,0.08)" : "#e2e8f0";

  return (
    <section style={sectionBase(bg, "72px 24px")}>
      <div style={{ ...container(680) }}>
        <div style={{
          display: "flex", gap: 28, alignItems: "flex-start",
          background: isDark ? "rgba(255,255,255,0.03)" : "#f8fafc",
          border: `2px solid ${borderColor}`,
          borderRadius: 24, padding: "40px 36px",
        }}>
          <div style={{
            width: 72, height: 72, borderRadius: "50%", flexShrink: 0,
            background: `linear-gradient(135deg, ${primary}22, #22c55e22)`,
            border: `2px solid ${primary}44`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 32,
          }}>
            {props.icon ?? "🛡️"}
          </div>
          <div>
            <h3 style={{ color: textColor, fontSize: 22, fontWeight: 900, marginBottom: 10 }}>
              {props.headline ?? "100% Money-Back Guarantee"}
            </h3>
            <p style={{ color: subColor, fontSize: 15, lineHeight: 1.75, margin: 0 }}>
              {props.body ?? "If you're not completely satisfied within 30 days, we'll refund every penny. No questions asked. No hassle. We stand behind our work 100%."}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// TRUST BADGES — Row of trust/payment/security icons
// ---------------------------------------------------------------------------

function TrustBadgesBlock({ props, theme }: { props: Block["props"]; theme: SiteTheme }) {
  const isDark = theme.mode !== "light";
  const bg = props.bgColor ?? (isDark ? "#07101f" : "#f8fafc");
  const subColor = isDark ? "rgba(255,255,255,0.35)" : "rgba(15,23,42,0.35)";
  const borderColor = isDark ? "rgba(255,255,255,0.07)" : "#e8edf2";
  const badges: { icon?: string; label?: string }[] = props.badges ?? [
    { icon: "🔒", label: "SSL Secured" },
    { icon: "💳", label: "Secure Payment" },
    { icon: "✅", label: "Verified Business" },
    { icon: "⭐", label: "5-Star Rated" },
    { icon: "🔄", label: "Money-Back" },
  ];

  return (
    <section style={sectionBase(bg, "48px 24px")}>
      <div style={container()}>
        {props.title && (
          <p style={{ color: subColor, textAlign: "center", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 28 }}>
            {props.title}
          </p>
        )}
        <div style={{
          display: "flex", gap: 0, justifyContent: "center",
          border: `1px solid ${borderColor}`, borderRadius: 14, overflow: "hidden",
          flexWrap: "wrap",
        }}>
          {badges.map((badge, i) => (
            <div key={i} style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "16px 24px",
              borderRight: i < badges.length - 1 ? `1px solid ${borderColor}` : "none",
              flex: "1 1 auto", justifyContent: "center",
            }}>
              <span style={{ fontSize: 20 }}>{badge.icon}</span>
              <span style={{ color: subColor, fontSize: 13, fontWeight: 600, whiteSpace: "nowrap" }}>{badge.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// PROCESS — Numbered steps with connector lines
// ---------------------------------------------------------------------------

function ProcessBlock({ props, theme }: { props: Block["props"]; theme: SiteTheme }) {
  const isDark = theme.mode !== "light";
  const primary = px(theme.primaryColor!);
  const bg = props.bgColor ?? (isDark ? "#07101f" : "#f8fafc");
  const textColor = isDark ? "#ffffff" : "#0f172a";
  const subColor = isDark ? "rgba(255,255,255,0.5)" : "rgba(15,23,42,0.55)";
  const borderColor = isDark ? "rgba(255,255,255,0.07)" : "#e2e8f0";
  const steps: { icon?: string; title?: string; body?: string }[] = props.steps ?? [];

  return (
    <section style={sectionBase(bg)}>
      <div style={container()}>
        {(props.eyebrow || props.title) && (
          <div style={{ textAlign: "center", marginBottom: 60 }}>
            {props.eyebrow && <p style={{ ...eyebrowStyle(primary), marginBottom: 12 }}>{props.eyebrow}</p>}
            {props.title && <h2 style={{ ...headingStyle(textColor), marginBottom: 16 }}>{props.title}</h2>}
            {props?.subtitle && <p style={{ color: subColor, fontSize: 16, maxWidth: 520, margin: "0 auto" }}>{props.subtitle}</p>}
          </div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(steps.length || 3, 4)}, 1fr)`, gap: 20, position: "relative" }}>
          {steps.map((step, i) => (
            <div key={i} style={{ textAlign: "center", padding: "0 12px", position: "relative" }}>
              {/* Connector line */}
              {i < steps.length - 1 && (
                <div style={{
                  position: "absolute", top: 26, left: "calc(50% + 26px)", right: "calc(-50% + 26px)",
                  height: 1, background: `linear-gradient(90deg, ${primary}66, ${primary}00)`,
                }} />
              )}
              <div style={{
                width: 52, height: 52, borderRadius: "50%", margin: "0 auto 20px",
                background: `linear-gradient(135deg, ${primary}, #e07850)`,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontWeight: 900, fontSize: step.icon ? 22 : 18,
                boxShadow: `0 8px 24px ${primary}44`,
              }}>
                {step.icon ?? (i + 1)}
              </div>
              {step.title && <h3 style={{ color: textColor, fontSize: 17, fontWeight: 800, marginBottom: 10 }}>{step.title}</h3>}
              {step.body && <p style={{ color: subColor, fontSize: 14, lineHeight: 1.7 }}>{step.body}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// BEFORE / AFTER — Side-by-side comparison
// ---------------------------------------------------------------------------

function BeforeAfterBlock({ props, theme }: { props: Block["props"]; theme: SiteTheme }) {
  const isDark = theme.mode !== "light";
  const primary = px(theme.primaryColor!);
  const bg = props.bgColor ?? (isDark ? "#0c0a08" : "#ffffff");
  const textColor = isDark ? "#ffffff" : "#0f172a";
  const subColor = isDark ? "rgba(255,255,255,0.5)" : "rgba(15,23,42,0.55)";
  const beforeItems: string[] = props.beforeItems ?? [];
  const afterItems: string[] = props.afterItems ?? [];

  return (
    <section style={sectionBase(bg)}>
      <div style={container(860)}>
        {props.title && (
          <h2 style={{ ...headingStyle(textColor), textAlign: "center", marginBottom: 48 }}>{props.title}</h2>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          {/* Before */}
          <div style={{
            background: isDark ? "rgba(239,68,68,0.06)" : "#fff5f5",
            border: `1px solid rgba(239,68,68,0.2)`,
            borderRadius: 20, padding: "28px 24px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
              <span style={{ fontSize: 20 }}>❌</span>
              <span style={{ color: "#ef4444", fontWeight: 800, fontSize: 14, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                {props.beforeLabel ?? "Before"}
              </span>
            </div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
              {beforeItems.map((item: string, i: number) => (
                <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, color: subColor, fontSize: 14, lineHeight: 1.6 }}>
                  <span style={{ color: "#ef4444", flexShrink: 0, marginTop: 2 }}>✗</span> {item}
                </li>
              ))}
            </ul>
          </div>
          {/* After */}
          <div style={{
            background: isDark ? `rgba(245,166,35,0.06)` : "#f0fdf4",
            border: `1px solid ${primary}33`,
            borderRadius: 20, padding: "28px 24px",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
              <span style={{ fontSize: 20 }}>✅</span>
              <span style={{ color: primary, fontWeight: 800, fontSize: 14, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                {props.afterLabel ?? "After"}
              </span>
            </div>
            <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 10 }}>
              {afterItems.map((item: string, i: number) => (
                <li key={i} style={{ display: "flex", alignItems: "flex-start", gap: 10, color: textColor, fontSize: 14, lineHeight: 1.6, fontWeight: 500 }}>
                  <span style={{ color: primary, flexShrink: 0, marginTop: 2 }}>✓</span> {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// URGENCY — Scarcity / deadline bar
// ---------------------------------------------------------------------------

function UrgencyBlock({ props, theme }: { props: Block["props"]; theme: SiteTheme }) {
  const primary = px(theme.primaryColor!);
  const bg = props.bgColor ?? `linear-gradient(90deg, #dc2626, #b91c1c)`;
  const items: string[] = props.items ?? [];

  return (
    <div style={{
      background: bg, padding: "12px 24px",
      display: "flex", alignItems: "center", justifyContent: "center", gap: 24,
      flexWrap: "wrap",
    }}>
      {props.icon && <span style={{ fontSize: 18 }}>{props.icon}</span>}
      <span style={{ color: "#ffffff", fontWeight: 800, fontSize: 14, textAlign: "center" }}>
        {props.text ?? "⚡ Limited Time Offer — Act Now!"}
      </span>
      {items.map((item: string, i: number) => (
        <span key={i} style={{ color: "rgba(255,255,255,0.8)", fontSize: 13, fontWeight: 600 }}>· {item}</span>
      ))}
      {props.buttonText && (
        <a href={props.buttonUrl ?? "#"} style={{
          padding: "6px 16px", borderRadius: 8,
          background: "#ffffff", color: "#dc2626",
          fontWeight: 800, fontSize: 13, textDecoration: "none",
        }}>
          {props.buttonText}
        </a>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// TEXT — Rich content block
// ---------------------------------------------------------------------------

function TextBlock({ props, theme }: { props: Block["props"]; theme: SiteTheme }) {
  const isDark = theme.mode !== "light";
  const bg = props?.bgColor ?? (isDark ? "#0c0a08" : "#ffffff");
  const textColor = isDark ? "rgba(255,255,255,0.8)" : "#1e293b";

  return (
    <section style={sectionBase(bg, "60px 24px")}>
      <div style={{ ...container(720), color: textColor, fontSize: 16, lineHeight: 1.85 }}
        dangerouslySetInnerHTML={{ __html: (props?.html || props?.content || "").replace(/\n/g, "<br/>") }}
      />
    </section>
  );
}

// ---------------------------------------------------------------------------
// IMAGE
// ---------------------------------------------------------------------------

function ImageBlock({ props, theme }: { props: Block["props"]; theme: SiteTheme }) {
  const isDark = theme.mode !== "light";
  const bg = props.bgColor ?? (isDark ? "#0c0a08" : "#ffffff");
  const textColor = isDark ? "rgba(255,255,255,0.35)" : "rgba(15,23,42,0.35)";

  return (
    <section style={sectionBase(bg, "40px 24px")}>
      <div style={{ maxWidth: props.fullWidth ? "100%" : 1100, margin: "0 auto" }}>
        {props.src ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={props.src as string} alt={(props.alt as string) ?? ""} style={{ width: "100%", borderRadius: props.rounded ? 20 : 0, display: "block" }} />
        ) : (
          <div style={{ width: "100%", aspectRatio: "16/9", background: isDark ? "rgba(255,255,255,0.04)" : "#f1f5f9", borderRadius: 20, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ color: textColor, fontSize: 14 }}>Add an image URL in the editor</span>
          </div>
        )}
        {props.caption && <p style={{ color: textColor, fontSize: 13, textAlign: "center", marginTop: 12 }}>{props.caption}</p>}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// VIDEO
// ---------------------------------------------------------------------------

function VideoBlock({ props, theme }: { props: Block["props"]; theme: SiteTheme }) {
  const isDark = theme.mode !== "light";
  const primary = px(theme.primaryColor!);
  const bg = props.bgColor ?? (isDark ? "#0c0a08" : "#ffffff");

  function getEmbedUrl(url: string) {
    try {
      if (url.includes("youtube.com") || url.includes("youtu.be")) {
        const id = url.includes("youtu.be")
          ? url.split("youtu.be/")[1]?.split("?")[0]
          : new URL(url).searchParams.get("v");
        return `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1`;
      }
      if (url.includes("vimeo.com")) {
        const id = url.split("vimeo.com/")[1]?.split("?")[0];
        return `https://player.vimeo.com/video/${id}`;
      }
      return url;
    } catch { return url; }
  }

  return (
    <section style={sectionBase(bg, "72px 24px")}>
      <div style={container(900)}>
        {props.title && <h2 style={{ ...headingStyle(isDark ? "#fff" : "#0f172a"), textAlign: "center", marginBottom: 32 }}>{props.title}</h2>}
        {props.url ? (
          <div style={{ position: "relative", paddingTop: "56.25%", borderRadius: 20, overflow: "hidden", boxShadow: `0 32px 64px rgba(0,0,0,0.4)` }}>
            <iframe src={getEmbedUrl(props.url as string)}
              style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen />
          </div>
        ) : (
          <div style={{ width: "100%", aspectRatio: "16/9", background: isDark ? "rgba(255,255,255,0.04)" : "#f1f5f9", borderRadius: 20, display: "flex", alignItems: "center", justifyContent: "center", border: `2px dashed ${isDark ? "rgba(255,255,255,0.1)" : "#e2e8f0"}` }}>
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>▶</div>
              <span style={{ color: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.35)", fontSize: 14 }}>Add a YouTube or Vimeo URL in the editor</span>
            </div>
          </div>
        )}
        {props.caption && <p style={{ color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)", textAlign: "center", fontSize: 13, marginTop: 16 }}>{props.caption}</p>}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// FORM — Lead capture / contact form
// ---------------------------------------------------------------------------

function FormBlock({ props, theme }: { props: Block["props"]; theme: SiteTheme }) {
  const isDark = theme.mode !== "light";
  const primary = px(theme.primaryColor!);
  const bg = props?.bgColor ?? (isDark ? "#07101f" : "#f8fafc");
  const textColor = isDark ? "#ffffff" : "#0f172a";
  const subColor = isDark ? "rgba(255,255,255,0.5)" : "rgba(15,23,42,0.5)";
  const inputBg = isDark ? "rgba(255,255,255,0.05)" : "#ffffff";
  const inputBorder = isDark ? "rgba(255,255,255,0.1)" : "#e2e8f0";
  const fields: { name?: string; type?: string; placeholder?: string; required?: boolean }[] = props?.fields ?? [
    { name: "name", type: "text", placeholder: "Your Name", required: true },
    { name: "email", type: "email", placeholder: "Email Address", required: true },
    { name: "phone", type: "tel", placeholder: "Phone (optional)" },
  ];
  const siteId = props?.siteId ?? "";
  const submitUrl = props?.submitUrl ?? "/api/forms/submit";

  // Form submission script injected inline for public sites
  const formScript = `
    (function(){
      var form = document.getElementById('himalaya-form-${siteId}');
      if(!form) return;
      var btn = form.querySelector('button[type="submit"]');
      var msg = form.querySelector('.form-message');
      // Capture partial form data (email blur) for abandoned form recovery
      var emailInput = form.querySelector('input[name="email"]');
      if(emailInput){
        var partialSent = false;
        emailInput.addEventListener('blur', function(){
          if(!partialSent && emailInput.value && emailInput.value.includes('@')){
            partialSent = true;
            fetch('/api/forms/partial',{
              method:'POST',
              headers:{'Content-Type':'application/json'},
              body:JSON.stringify({siteId:'${siteId}',email:emailInput.value,name:(form.querySelector('input[name="name"]')||{}).value||''})
            }).catch(function(){});
          }
        });
      }
      form.addEventListener('submit', function(e){
        e.preventDefault();
        if(btn){ btn.disabled=true; btn.textContent='Sending...'; }
        var data = {};
        form.querySelectorAll('input,textarea').forEach(function(el){
          if(el.name) data[el.name] = el.value;
        });
        data.siteId = '${siteId}';
        fetch('${submitUrl}',{
          method:'POST',
          headers:{'Content-Type':'application/json'},
          body:JSON.stringify(data)
        }).then(function(r){return r.json()}).then(function(r){
          if(r.ok){
            if(msg){
              if(r.enrollmentStatus === 'failed' && r.warning){
                msg.textContent='Thanks! Your request was received. Email follow-up is still being configured.';
                msg.style.color='#f59e0b';
                msg.title = String(r.warning);
              } else {
                msg.textContent='Thank you! We\\'ll be in touch.';
                msg.style.color='#10b981';
                msg.title = '';
              }
            }
            form.querySelectorAll('input,textarea').forEach(function(el){el.value='';});
            // Fire conversion events
            if(typeof fbq==='function') fbq('track','Lead');
            if(typeof gtag==='function') gtag('event','generate_lead');
            if(typeof ttq!=='undefined') ttq.track('SubmitForm');
          } else {
            if(msg){msg.textContent='Something went wrong. Please try again.';msg.style.color='#ef4444';}
          }
          if(btn){btn.disabled=false;btn.textContent='${(props?.buttonText ?? "Submit").replace(/'/g, "\\'")}';}
        }).catch(function(){
          if(msg){msg.textContent='Network error. Please try again.';msg.style.color='#ef4444';}
          if(btn){btn.disabled=false;btn.textContent='${(props?.buttonText ?? "Submit").replace(/'/g, "\\'")}';}
        });
      });
    })();
  `;

  return (
    <section style={sectionBase(bg)}>
      <div style={{ ...container(560) }}>
        {(props.eyebrow || props.title) && (
          <div style={{ textAlign: "center", marginBottom: 40 }}>
            {props.eyebrow && <p style={{ ...eyebrowStyle(primary), marginBottom: 12 }}>{props.eyebrow}</p>}
            {props.title && <h2 style={{ ...headingStyle(textColor, "clamp(1.5rem,3vw,2rem)"), marginBottom: 12 }}>{props.title}</h2>}
            {props?.subtitle && <p style={{ color: subColor, fontSize: 15, lineHeight: 1.7 }}>{props.subtitle}</p>}
          </div>
        )}
        <div style={{
          background: isDark ? "rgba(255,255,255,0.025)" : "#ffffff",
          border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "#e2e8f0"}`,
          borderRadius: 24, padding: "40px 36px",
        }}>
          <form id={`himalaya-form-${siteId}`} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {fields.map((field, i) => (
              <div key={i}>
                {field.type === "textarea" ? (
                  <textarea name={field.name ?? `field_${i}`} placeholder={field.placeholder ?? field.name} rows={4}
                    style={{ width: "100%", background: inputBg, border: `1px solid ${inputBorder}`, borderRadius: 12, padding: "13px 16px", color: textColor, fontSize: 15, outline: "none", resize: "vertical", fontFamily: "inherit" }} />
                ) : (
                  <input name={field.name ?? `field_${i}`} type={field.type ?? "text"} placeholder={field.placeholder ?? field.name}
                    required={field.required}
                    style={{ width: "100%", background: inputBg, border: `1px solid ${inputBorder}`, borderRadius: 12, padding: "13px 16px", color: textColor, fontSize: 15, outline: "none" }} />
                )}
              </div>
            ))}
            <button type="submit" style={{
              width: "100%", padding: "15px", borderRadius: 12, border: "none",
              background: `linear-gradient(135deg, ${primary}, #e07850)`,
              color: "#fff", fontWeight: 800, fontSize: 16, cursor: "pointer",
              boxShadow: `0 8px 24px ${primary}40`, marginTop: 8,
            }}>
              {props.buttonText ?? "Submit"}
            </button>
            <p className="form-message" style={{ color: subColor, fontSize: 14, textAlign: "center", margin: "8px 0 0", minHeight: 20 }}></p>
            {props.privacyText && (
              <p style={{ color: subColor, fontSize: 12, textAlign: "center", margin: "4px 0 0" }}>{props.privacyText}</p>
            )}
          </form>
          {siteId && <script dangerouslySetInnerHTML={{ __html: formScript }} />}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// CHECKOUT — Conversion-optimized order form
// ---------------------------------------------------------------------------

function CheckoutBlock({ props, theme }: { props: Block["props"]; theme: SiteTheme }) {
  const isDark = theme.mode !== "light";
  const primary = px(theme.primaryColor!);
  const bg = props.bgColor ?? (isDark ? "#07101f" : "#f8fafc");
  const textColor = isDark ? "#ffffff" : "#0f172a";
  const subColor = isDark ? "rgba(255,255,255,0.5)" : "rgba(15,23,42,0.5)";
  const cardBg = isDark ? "#0a1324" : "#ffffff";
  const borderColor = isDark ? "rgba(255,255,255,0.1)" : "#e2e8f0";

  return (
    <section style={sectionBase(bg)}>
      <div style={{ ...container(600) }}>
        <div style={{
          background: cardBg, borderRadius: 24, padding: "44px 40px",
          border: `1px solid ${borderColor}`,
          boxShadow: isDark ? "0 32px 64px rgba(0,0,0,0.5)" : "0 32px 64px rgba(0,0,0,0.08)",
        }}>
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <p style={{ color: subColor, fontSize: 11, fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 8 }}>SECURE ORDER FORM</p>
            <h2 style={{ ...headingStyle(textColor, "1.6rem"), marginBottom: 8 }}>{props.title ?? "Complete Your Order"}</h2>
            {props?.subtitle && <p style={{ color: subColor, fontSize: 14 }}>{props.subtitle}</p>}
          </div>

          {/* Order summary */}
          <div style={{ background: isDark ? "rgba(255,255,255,0.03)" : "#f8fafc", borderRadius: 14, padding: "20px", marginBottom: 20, border: `1px solid ${borderColor}` }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: textColor, fontWeight: 700, fontSize: 15 }}>
              <span>{props.productName ?? "Digital Product"}</span>
              <span>{props.price ?? "$97.00"}</span>
            </div>
            {props.originalPrice && (
              <div style={{ display: "flex", justifyContent: "space-between", color: subColor, fontSize: 13, marginTop: 6 }}>
                <span>Regular Price</span>
                <span style={{ textDecoration: "line-through" }}>{props.originalPrice}</span>
              </div>
            )}
          </div>

          {/* Order bump */}
          {props.showOrderBump && (
            <div style={{
              background: `${primary}10`, border: `2px dashed ${primary}60`,
              borderRadius: 14, padding: "20px", marginBottom: 20, cursor: "pointer",
            }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
                <input type="checkbox" style={{ width: 18, height: 18, marginTop: 2, accentColor: primary, flexShrink: 0 }} />
                <div>
                  <p style={{ color: primary, fontWeight: 800, fontSize: 14, marginBottom: 4 }}>
                    ⚡ {props.bumpHeadline ?? "YES! Add the VIP Bonus — Only $19 More"}
                  </p>
                  <p style={{ color: subColor, fontSize: 13, lineHeight: 1.6 }}>{props.bumpText ?? "Get exclusive access to the advanced training modules. One-time offer."}</p>
                </div>
              </div>
            </div>
          )}

          <button type="button" style={{
            width: "100%", padding: "18px", borderRadius: 14, border: "none",
            background: `linear-gradient(135deg, ${primary}, #e07850)`,
            color: "#fff", fontWeight: 900, fontSize: 17, cursor: "pointer",
            boxShadow: `0 8px 32px ${primary}50`,
          }}>
            {props.buttonText ?? "Complete Purchase →"}
          </button>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 20, marginTop: 20, flexWrap: "wrap" }}>
            {["🔒 SSL Secured", "💳 Safe Payment", "✅ Guaranteed"].map((item, i) => (
              <span key={i} style={{ color: subColor, fontSize: 12, fontWeight: 600 }}>{item}</span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// PRODUCTS placeholder
// ---------------------------------------------------------------------------

function ProductsBlock({
  props,
  theme,
  products = [],
  siteId,
  preview,
}: {
  props: Block["props"];
  theme: SiteTheme;
  products?: SiteProduct[];
  siteId?: string;
  preview?: boolean;
}) {
  const isDark = theme.mode !== "light";
  const primary = px(theme.primaryColor!);
  const bg = props.bgColor ?? (isDark ? "#0c0a08" : "#ffffff");
  const textColor = isDark ? "#ffffff" : "#0f172a";
  const subColor = isDark ? "rgba(255,255,255,0.35)" : "rgba(15,23,42,0.4)";
  const cardBg = isDark ? "rgba(255,255,255,0.03)" : "#ffffff";
  const cardBorder = isDark ? "rgba(255,255,255,0.08)" : "#e2e8f0";
  const columns = Math.max(1, Math.min(Number(props.columns ?? 3), 4));

  // Real checkout: call /api/checkout → redirect to Stripe
  async function handleBuyNow(productId: string) {
    if (preview || !siteId) return;
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteId, productId }),
      });
      const data = await res.json() as { url?: string; error?: string };
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error ?? "Checkout unavailable. Please try again.");
      }
    } catch {
      alert("Could not start checkout. Please try again.");
    }
  }

  return (
    <section style={sectionBase(bg)}>
      <div style={container()}>
        {props.title && <h2 style={{ ...headingStyle(textColor), textAlign: "center", marginBottom: 16 }}>{props.title}</h2>}
        {props?.subtitle && (
          <p style={{ color: subColor, textAlign: "center", fontSize: 15, maxWidth: 620, margin: "0 auto 40px", lineHeight: 1.7 }}>
            {props.subtitle}
          </p>
        )}

        {products.length === 0 ? (
          <div style={{ color: subColor, textAlign: "center", fontSize: 14, border: `2px dashed ${isDark ? "rgba(255,255,255,0.08)" : "#e2e8f0"}`, borderRadius: 20, padding: "60px 24px" }}>
            Products from your store will appear here once added.
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: `repeat(${Math.min(columns, products.length)}, minmax(0, 1fr))`,
              gap: 24,
            }}
          >
            {products.map((product) => {
              const hasSale = typeof product.compareAt === "number" && product.compareAt > product.price;
              const price = `$${(product.price / 100).toFixed(2)}`;
              const compareAt = hasSale ? `$${((product.compareAt ?? 0) / 100).toFixed(2)}` : null;

              return (
                <article
                  key={product.id}
                  style={{
                    background: cardBg,
                    border: `1px solid ${cardBorder}`,
                    borderRadius: 24,
                    overflow: "hidden",
                    boxShadow: isDark ? "0 20px 60px rgba(0,0,0,0.25)" : "0 20px 60px rgba(15,23,42,0.06)",
                  }}
                >
                  <div
                    style={{
                      aspectRatio: "4 / 3",
                      background: isDark ? "linear-gradient(135deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01))" : "linear-gradient(135deg, #f8fafc, #eef2ff)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      overflow: "hidden",
                    }}
                  >
                    {product.images[0] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                      />
                    ) : (
                      <div style={{ fontSize: 40, opacity: 0.35 }}>🛍️</div>
                    )}
                  </div>

                  <div style={{ padding: 24 }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, marginBottom: 10 }}>
                      <h3 style={{ color: textColor, fontSize: 20, fontWeight: 800, margin: 0 }}>{product.name}</h3>
                      <div style={{ textAlign: "right", flexShrink: 0 }}>
                        {compareAt && (
                          <div style={{ color: subColor, fontSize: 12, textDecoration: "line-through" }}>{compareAt}</div>
                        )}
                        <div style={{ color: textColor, fontSize: 18, fontWeight: 900 }}>{price}</div>
                      </div>
                    </div>

                    {product.description && (
                      <p style={{ color: subColor, fontSize: 14, lineHeight: 1.7, margin: "0 0 18px" }}>
                        {product.description}
                      </p>
                    )}

                    <button
                      onClick={() => void handleBuyNow(product.id)}
                      disabled={preview || !siteId}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "100%",
                        padding: "14px 18px",
                        borderRadius: 14,
                        border: "none",
                        cursor: preview ? "default" : "pointer",
                        background: `linear-gradient(135deg, ${primary}, #e07850)`,
                        color: "#ffffff",
                        fontSize: 14,
                        fontWeight: 800,
                        boxShadow: `0 12px 30px ${primary}33`,
                      }}
                    >
                      {props.buttonText ?? "Buy Now"}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// DIVIDER
// ---------------------------------------------------------------------------

function DividerBlock({ props, theme }: { props: Block["props"]; theme: SiteTheme }) {
  const isDark = theme.mode !== "light";
  const bg = props.bgColor ?? (isDark ? "#0c0a08" : "#ffffff");
  const lineColor = isDark ? "rgba(255,255,255,0.06)" : "#e8edf2";
  const height = props.height ?? 48;

  return (
    <section style={{ background: bg, padding: `${height}px 24px`, display: "flex", alignItems: "center" }}>
      {props.showLine && <div style={{ width: "100%", maxWidth: 1100, margin: "0 auto", height: 1, background: lineColor }} />}
    </section>
  );
}

// ---------------------------------------------------------------------------
// FOOTER
// ---------------------------------------------------------------------------
// PAYMENT — Stripe payment link integration
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// BOOKING — appointment scheduling block for public sites
// ---------------------------------------------------------------------------

function BookingBlock({ props, theme }: { props: Block["props"]; theme: SiteTheme }) {
  const isDark = theme.mode !== "light";
  const primary = px(theme.primaryColor!);
  const bg = props.bgColor ?? (isDark ? "#07101f" : "#f0fdf4");
  const textColor = isDark ? "#ffffff" : "#0f172a";
  const userId = props.userId ?? "";
  const headline = (props.headline as string) ?? "Book a Free Consultation";
  const subtitle = (props.subtitle as string) ?? "Pick a time that works for you. We'll confirm within minutes.";

  const bookingScript = `
    (function(){
      var userId = '${userId}';
      var container = document.getElementById('booking-widget-${userId}');
      if(!container || !userId) return;
      container.innerHTML = '<p style="color:${isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)"};font-size:13px;">Loading available times...</p>';
      fetch('/api/bookings?userId=' + userId)
        .then(function(r){return r.json()})
        .then(function(data){
          if(!data.ok || !data.slots) { container.innerHTML = '<p style="color:${isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)"};font-size:12px;">No available times right now. Contact us directly.</p>'; return; }
          var available = data.slots.filter(function(s){return s.available});
          var grouped = {};
          available.forEach(function(s){ if(!grouped[s.date]) grouped[s.date]=[]; grouped[s.date].push(s); });
          var dates = Object.keys(grouped).slice(0,5);
          var html = '<div style="display:flex;flex-direction:column;gap:8px;">';
          dates.forEach(function(date){
            var d = new Date(date+'T12:00:00');
            var label = d.toLocaleDateString(undefined,{weekday:'short',month:'short',day:'numeric'});
            html += '<div><p style="font-size:11px;font-weight:700;color:${isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)"};margin:0 0 4px;text-transform:uppercase;letter-spacing:0.1em;">'+label+'</p>';
            html += '<div style="display:flex;flex-wrap:wrap;gap:4px;">';
            grouped[date].slice(0,6).forEach(function(slot){
              html += '<button onclick="window._bookSlot(\\''+date+'\\',\\''+slot.startTime+'\\',\\''+slot.endTime+'\\')" style="padding:6px 12px;border-radius:8px;border:1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.1)"};background:${isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.03)"};color:${textColor};font-size:12px;cursor:pointer;">'+slot.startTime+'</button>';
            });
            html += '</div></div>';
          });
          html += '</div>';
          container.innerHTML = html;
        }).catch(function(){ container.innerHTML = '<p style="font-size:12px;color:${isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)"};">Could not load times.</p>'; });

      window._bookSlot = function(date,start,end){
        var name = prompt('Your name:');
        if(!name) return;
        var email = prompt('Your email:');
        if(!email) return;
        fetch('/api/bookings',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({userId:userId,date:date,startTime:start,endTime:end,clientName:name,clientEmail:email})})
          .then(function(r){return r.json()})
          .then(function(data){
            if(data.ok) { container.innerHTML = '<div style="text-align:center;padding:20px;"><p style="font-size:16px;font-weight:700;color:${primary};">Booked!</p><p style="font-size:12px;color:${isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)"};">'+date+' at '+start+'. Check your email for confirmation.</p></div>'; }
            else { alert(data.error || 'Booking failed. Try again.'); }
          }).catch(function(){ alert('Connection error.'); });
      };
    })();
  `;

  return (
    <section style={sectionBase(bg)} id="booking">
      <div style={{ ...container(600), textAlign: "center" }}>
        <h2 style={{ ...headingStyle(textColor, "clamp(1.3rem,2.5vw,1.8rem)"), marginBottom: 8 }}>{headline}</h2>
        <p style={{ color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)", fontSize: 14, marginBottom: 24 }}>{subtitle}</p>
        <div id={`booking-widget-${userId}`} style={{ minHeight: 100 }} />
        {userId && <script dangerouslySetInnerHTML={{ __html: bookingScript }} />}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// PAYMENT — Stripe payment link integration
// ---------------------------------------------------------------------------

function PaymentBlock({ props, theme }: { props: Block["props"]; theme: SiteTheme }) {
  const isDark = theme.mode !== "light";
  const primary = px(theme.primaryColor!);
  const bg = props?.bgColor ?? (isDark ? "#0c0a08" : "#f0fdf4");
  const textColor = isDark ? "#ffffff" : "#0f172a";
  const paymentUrl = props?.paymentUrl ?? "#";
  const price = props?.price ?? "";
  const buttonText = props?.buttonText ?? "Get Started Now";

  return (
    <section style={sectionBase(bg)} id="payment">
      <div style={{ ...container(560), textAlign: "center" }}>
        {props?.title && <h2 style={{ ...headingStyle(textColor, "clamp(1.5rem,3vw,2.2rem)"), marginBottom: 16 }}>{props.title}</h2>}
        {price && (
          <p style={{ fontSize: "clamp(2rem,5vw,3rem)", fontWeight: 900, color: primary, marginBottom: 8 }}>
            {price}
          </p>
        )}
        {props?.subtitle && <p style={{ color: isDark ? "rgba(255,255,255,0.6)" : "rgba(0,0,0,0.5)", fontSize: 16, marginBottom: 32 }}>{props.subtitle}</p>}
        <a
          href={paymentUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: "inline-block", padding: "18px 48px", borderRadius: 14, border: "none",
            background: `linear-gradient(135deg, ${primary}, #e07850)`,
            color: "#fff", fontWeight: 800, fontSize: 18, cursor: "pointer",
            textDecoration: "none",
            boxShadow: `0 12px 32px ${primary}40`,
            transition: "transform 0.2s, box-shadow 0.2s",
          }}
        >
          {buttonText}
        </a>
        <p style={{ color: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)", fontSize: 12, marginTop: 16 }}>
          Secure checkout powered by Stripe
        </p>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------

function FooterBlock({ props, theme }: { props: Block["props"]; theme: SiteTheme }) {
  const isDark = theme.mode !== "light";
  const primary = px(theme.primaryColor!);
  const bg = props.bgColor ?? (isDark ? "#020509" : "#0f172a");
  const textColor = isDark ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.4)";
  const links: { label?: string; url?: string }[] = props.links ?? [];
  const columns: { title?: string; links?: { label?: string; url?: string }[] }[] = props.columns ?? [];

  return (
    <footer style={{ background: bg, padding: "60px 24px 32px" }}>
      <div style={container()}>
        {/* Multi-column footer */}
        {columns.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(columns.length, 4)}, 1fr)`, gap: 40, marginBottom: 48, paddingBottom: 40, borderBottom: `1px solid rgba(255,255,255,0.07)` }}>
            {columns.map((col, i) => (
              <div key={i}>
                {col.title && <p style={{ color: "rgba(255,255,255,0.7)", fontWeight: 700, fontSize: 13, marginBottom: 16, textTransform: "uppercase", letterSpacing: "0.1em" }}>{col.title}</p>}
                {(col.links ?? []).map((l, j) => (
                  <a key={j} href={l.url ?? "#"} style={{ display: "block", color: textColor, fontSize: 13, marginBottom: 10, textDecoration: "none" }}>{l.label}</a>
                ))}
              </div>
            ))}
          </div>
        )}
        {/* Simple footer */}
        {links.length > 0 && (
          <div style={{ display: "flex", justifyContent: "center", gap: 28, marginBottom: 20, flexWrap: "wrap" }}>
            {links.map((l, i) => (
              <a key={i} href={l.url ?? "#"} style={{ color: textColor, fontSize: 13, textDecoration: "none" }}>{l.label}</a>
            ))}
          </div>
        )}
        <p style={{ color: textColor, fontSize: 13, textAlign: "center" }}>
          {props.copyright ?? `© ${new Date().getFullYear()} All rights reserved.`}
        </p>
        {props.showPoweredBy !== false && (
          <p style={{ color: "rgba(255,255,255,0.1)", fontSize: 11, textAlign: "center", marginTop: 8 }}>Built with Himalaya</p>
        )}
      </div>
    </footer>
  );
}

// ---------------------------------------------------------------------------
// Main renderer
// ---------------------------------------------------------------------------

export default function BlockRenderer({ block, theme, preview, selected, onClick, products, siteId, overlayActions }: Props) {
  const t = { ...DEFAULT_THEME, ...theme };

  const rendered = (() => {
    switch (block.type) {
      case "hero": return <HeroBlock props={block.props} theme={t} />;
      case "features": return <FeaturesBlock props={block.props} theme={t} />;
      case "stats": return <StatsBlock props={block.props} theme={t} />;
      case "text": return <TextBlock props={block.props} theme={t} />;
      case "image": return <ImageBlock props={block.props} theme={t} />;
      case "cta": return <CTABlock props={block.props} theme={t} />;
      case "testimonials": return <TestimonialsBlock props={block.props} theme={t} />;
      case "pricing": return <PricingBlock props={block.props} theme={t} />;
      case "faq": return <FAQBlock props={block.props} theme={t} />;
      case "form": return <FormBlock props={block.props} theme={t} />;
      case "video": return <VideoBlock props={block.props} theme={t} />;
      case "divider": return <DividerBlock props={block.props} theme={t} />;
      case "products": return <ProductsBlock props={block.props} theme={t} products={products} siteId={siteId} preview={preview} />;
      case "checkout": return <CheckoutBlock props={block.props} theme={t} />;
      case "payment": return <PaymentBlock props={block.props} theme={t} />;
      case "footer": return <FooterBlock props={block.props} theme={t} />;
      case "guarantee": return <GuaranteeBlock props={block.props} theme={t} />;
      case "trust_badges": return <TrustBadgesBlock props={block.props} theme={t} />;
      case "process": return <ProcessBlock props={block.props} theme={t} />;
      case "before_after": return <BeforeAfterBlock props={block.props} theme={t} />;
      case "urgency": return <UrgencyBlock props={block.props} theme={t} />;
      case "booking": return <BookingBlock props={block.props} theme={t} />;
      default: return null;
    }
  })();

  if (!preview) return rendered;

  return (
    <div
      onClick={onClick}
      style={{
        position: "relative",
        cursor: "pointer",
        outline: selected ? `2px solid #f5a623` : "none",
        outlineOffset: -2,
        transition: "outline 0.1s",
      }}
    >
      {rendered}
      {selected && (
        <>
          <div style={{
            position: "absolute", top: 8, right: 8,
            background: "#f5a623", color: "#0c0a08",
            fontSize: 10, fontWeight: 800, padding: "3px 8px",
            borderRadius: 6, textTransform: "uppercase", letterSpacing: "0.1em", pointerEvents: "none",
          }}>
            {block.type}
          </div>
          {overlayActions?.length ? (
            <div
              style={{
                position: "absolute",
                top: 8,
                left: 8,
                display: "flex",
                gap: 8,
                flexWrap: "wrap",
                zIndex: 2,
              }}
            >
              {overlayActions.map((action) => (
                <button
                  key={action.label}
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    action.onClick();
                  }}
                  style={{
                    border: "1px solid rgba(255,255,255,0.18)",
                    background: "rgba(5,10,20,0.88)",
                    color: "#d9f5ff",
                    borderRadius: 999,
                    padding: "6px 12px",
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: "0.04em",
                    cursor: "pointer",
                    backdropFilter: "blur(10px)",
                  }}
                >
                  {action.label}
                </button>
              ))}
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
