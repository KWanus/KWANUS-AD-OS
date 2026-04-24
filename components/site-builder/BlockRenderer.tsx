"use client";

import { shadows, glass, gradients, radii } from "./designTokens";
import { ANIMATION_STYLES, staggerDelay } from "./blockAnimations";

// ---------------------------------------------------------------------------
// BlockRenderer — World-class block designs for Himalaya site builder
// ---------------------------------------------------------------------------

export type BlockType =
  | "hero"
  | "video_hero"
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
  | "footer"
  | "stats"
  | "guarantee"
  | "trust_badges"
  | "process"
  | "before_after"
  | "urgency"
  | "countdown";

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
  overlayActions?: Array<{
    label: string;
    onClick: () => void;
  }>;
}

const DEFAULT_THEME: SiteTheme = { primaryColor: "#06b6d4", font: "inter", mode: "dark" };

function px(color: string) { return color ?? "#06b6d4"; }

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
// HERO — Cinematic mesh gradient hero with glassmorphism and animated elements
// ---------------------------------------------------------------------------

function HeroBlock({ props, theme }: { props: Block["props"]; theme: SiteTheme }) {
  const isDark = theme.mode !== "light";
  const primary = px(theme.primaryColor!);
  const meshBg = isDark
    ? `${gradients.mesh(primary)}, radial-gradient(ellipse 80% 60% at 50% -10%, ${primary}22 0%, transparent 60%), #050a14`
    : `${gradients.mesh(primary)}, radial-gradient(ellipse 80% 60% at 50% -10%, ${primary}15 0%, transparent 60%), #ffffff`;
  const bg = props.bgColor ?? meshBg;
  const textColor = isDark ? "#ffffff" : "#0f172a";
  const subColor = isDark ? "rgba(255,255,255,0.55)" : "rgba(15,23,42,0.6)";
  const align = props.textAlign ?? "center";
  const socialProof = props.socialProofText;
  const trustItems: string[] = props.trustItems ?? [];

  return (
    <section style={{ ...sectionBase(bg, "120px 24px 110px"), textAlign: align as "center" | "left", position: "relative", overflow: "hidden" }}>
      {/* Ambient glow orbs */}
      <div style={{ position: "absolute", top: "-20%", left: "10%", width: "40%", height: "60%", background: `radial-gradient(circle, ${primary}12 0%, transparent 70%)`, pointerEvents: "none", filter: "blur(60px)" }} />
      <div style={{ position: "absolute", bottom: "-10%", right: "15%", width: "30%", height: "50%", background: "radial-gradient(circle, #8b5cf612 0%, transparent 70%)", pointerEvents: "none", filter: "blur(60px)" }} />

      <div style={{ ...container(860), display: "flex", flexDirection: "column", alignItems: align === "center" ? "center" : "flex-start", gap: 0, position: "relative" }}>

        {/* Social proof pill with glass effect */}
        {socialProof && (
          <div className="hm-animate-in" style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            ...glass.subtle(isDark),
            borderRadius: radii.pill, padding: "8px 18px", marginBottom: 28,
          }}>
            <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e", display: "inline-block", flexShrink: 0, boxShadow: "0 0 8px #22c55e, 0 0 16px #22c55e44" }} />
            <span style={{ color: isDark ? "rgba(255,255,255,0.75)" : "rgba(0,0,0,0.6)", fontSize: 12, fontWeight: 600 }}>{socialProof}</span>
          </div>
        )}

        {props.eyebrow && (
          <p className="hm-animate-in hm-stagger-1" style={{ ...eyebrowStyle(primary), marginBottom: 16 }}>{props.eyebrow}</p>
        )}

        <h1 className="hm-animate-up" style={{
          ...headingStyle(textColor, "clamp(2.4rem,5.5vw,4.2rem)"),
          maxWidth: 820, textAlign: align as "center" | "left", marginBottom: 24,
          background: props.gradientText !== false ? `linear-gradient(135deg, ${textColor} 30%, ${primary} 100%)` : undefined,
          backgroundClip: props.gradientText !== false ? "text" : undefined,
          WebkitBackgroundClip: props.gradientText !== false ? "text" : undefined,
          WebkitTextFillColor: props.gradientText !== false ? "transparent" : undefined,
          letterSpacing: "-0.02em",
        }}>
          {props.headline || "Your Headline Here"}
        </h1>

        {props.subheadline && (
          <p className="hm-animate-in hm-stagger-2" style={{ color: subColor, fontSize: "clamp(1.05rem,2vw,1.25rem)", maxWidth: 620, lineHeight: 1.75, marginBottom: 44, textAlign: align as "center" | "left" }}>
            {props.subheadline}
          </p>
        )}

        {/* CTAs with glow */}
        {props.buttonText && (
          <div className="hm-animate-in hm-stagger-3" style={{ display: "flex", gap: 16, justifyContent: align === "center" ? "center" : "flex-start", flexWrap: "wrap", marginBottom: trustItems.length ? 48 : 0 }}>
            <a href={props.buttonUrl ?? "#"} className="hm-pulse-btn" style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "16px 38px", borderRadius: radii.md,
              background: `linear-gradient(135deg, ${primary}, #8b5cf6)`,
              boxShadow: `0 8px 32px ${primary}55, 0 2px 8px rgba(0,0,0,0.2)`,
              color: "#fff", fontWeight: 800, fontSize: 15, textDecoration: "none",
              letterSpacing: "0.01em",
              ["--hm-pulse-color" as string]: `${primary}55`,
            }}>
              {props.buttonText}
              <span style={{ fontSize: 16 }}>→</span>
            </a>
            {props.secondaryButtonText && (
              <a href={props.secondaryButtonUrl ?? "#"} style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "16px 38px", borderRadius: radii.md,
                ...glass.card(isDark),
                color: textColor, fontWeight: 700, fontSize: 15, textDecoration: "none",
              }}>
                {props.secondaryButtonText}
              </a>
            )}
          </div>
        )}

        {/* Trust items with stagger */}
        {trustItems.length > 0 && (
          <div style={{ display: "flex", gap: 24, flexWrap: "wrap", justifyContent: align === "center" ? "center" : "flex-start" }}>
            {trustItems.map((item: string, i: number) => (
              <span key={i} className="hm-animate-in" style={{ display: "flex", alignItems: "center", gap: 7, color: isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)", fontSize: 13, fontWeight: 600, animationDelay: staggerDelay(i + 4) }}>
                <span style={{ color: "#22c55e", textShadow: "0 0 4px #22c55e66" }}>✓</span> {item}
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// VIDEO HERO — Full hero with embedded video, Gadzhi-style
// ---------------------------------------------------------------------------

function VideoHeroBlock({ props, theme }: { props: Block["props"]; theme: SiteTheme }) {
  const isDark = theme.mode !== "light";
  const primary = px(theme.primaryColor!);
  const meshBg = isDark
    ? `${gradients.mesh(primary)}, radial-gradient(ellipse 80% 60% at 50% -10%, ${primary}22 0%, transparent 60%), #050a14`
    : `${gradients.mesh(primary)}, radial-gradient(ellipse 80% 60% at 50% -10%, ${primary}15 0%, transparent 60%), #ffffff`;
  const bg = props.bgColor ?? meshBg;
  const textColor = isDark ? "#ffffff" : "#0f172a";
  const subColor = isDark ? "rgba(255,255,255,0.55)" : "rgba(15,23,42,0.6)";
  const layout = props.layout ?? "side"; // "side" = text+video side by side, "stacked" = text above video
  const trustItems: string[] = props.trustItems ?? [];

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

  const videoEl = props.videoUrl ? (
    <div className="hm-animate-scale hm-stagger-3" style={{
      position: "relative", paddingTop: "56.25%", borderRadius: radii.lg,
      overflow: "hidden", boxShadow: `0 32px 80px rgba(0,0,0,0.5), ${shadows.glow(primary, 0.15)}`,
      border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}`,
    }}>
      <iframe src={getEmbedUrl(props.videoUrl as string)}
        style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: "none" }}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen />
    </div>
  ) : (
    <div className="hm-animate-scale hm-stagger-3" style={{
      width: "100%", aspectRatio: "16/9",
      background: isDark ? "rgba(255,255,255,0.04)" : "#f1f5f9",
      borderRadius: radii.lg, display: "flex", alignItems: "center", justifyContent: "center",
      border: `2px dashed ${isDark ? "rgba(255,255,255,0.1)" : "#e2e8f0"}`,
    }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>▶</div>
        <span style={{ color: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.35)", fontSize: 14 }}>Add a video URL</span>
      </div>
    </div>
  );

  return (
    <section style={{ ...sectionBase(bg, "100px 24px"), position: "relative", overflow: "hidden" }}>
      {/* Ambient orbs */}
      <div style={{ position: "absolute", top: "-15%", left: "5%", width: "35%", height: "50%", background: `radial-gradient(circle, ${primary}15 0%, transparent 70%)`, pointerEvents: "none", filter: "blur(60px)" }} />
      <div style={{ position: "absolute", bottom: "-10%", right: "10%", width: "30%", height: "45%", background: "radial-gradient(circle, #8b5cf612 0%, transparent 70%)", pointerEvents: "none", filter: "blur(60px)" }} />

      <div style={{
        ...container(1200), display: "flex",
        flexDirection: layout === "side" ? "row" : "column",
        alignItems: layout === "side" ? "center" : "center",
        gap: layout === "side" ? 64 : 48,
        position: "relative",
      }}>
        {/* Text side */}
        <div style={{ flex: layout === "side" ? "0 0 45%" : "none", maxWidth: layout === "side" ? "45%" : 780, textAlign: layout === "side" ? "left" : "center" }}>
          {props.socialProofText && (
            <div className="hm-animate-in" style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              ...glass.subtle(isDark),
              borderRadius: radii.pill, padding: "8px 18px", marginBottom: 28,
            }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#22c55e", display: "inline-block", boxShadow: "0 0 8px #22c55e, 0 0 16px #22c55e44" }} />
              <span style={{ color: isDark ? "rgba(255,255,255,0.75)" : "rgba(0,0,0,0.6)", fontSize: 12, fontWeight: 600 }}>{props.socialProofText}</span>
            </div>
          )}

          {props.eyebrow && (
            <p className="hm-animate-in hm-stagger-1" style={{ ...eyebrowStyle(primary), marginBottom: 16 }}>{props.eyebrow}</p>
          )}

          <h1 className="hm-animate-up" style={{
            ...headingStyle(textColor, "clamp(2rem,4.5vw,3.4rem)"),
            marginBottom: 20,
            background: `linear-gradient(135deg, ${textColor} 30%, ${primary} 100%)`,
            backgroundClip: "text", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            letterSpacing: "-0.02em",
          }}>
            {props.headline || "Watch How It Works"}
          </h1>

          {props.subheadline && (
            <p className="hm-animate-in hm-stagger-2" style={{
              color: subColor, fontSize: "clamp(1rem,1.8vw,1.15rem)", lineHeight: 1.75, marginBottom: 32,
            }}>
              {props.subheadline}
            </p>
          )}

          {props.buttonText && (
            <div className="hm-animate-in hm-stagger-3" style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: layout === "side" ? "flex-start" : "center", marginBottom: trustItems.length ? 32 : 0 }}>
              <a href={props.buttonUrl ?? "#"} className="hm-pulse-btn" style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "16px 38px", borderRadius: radii.md,
                background: `linear-gradient(135deg, ${primary}, #8b5cf6)`,
                boxShadow: `0 8px 32px ${primary}55, 0 2px 8px rgba(0,0,0,0.2)`,
                color: "#fff", fontWeight: 800, fontSize: 15, textDecoration: "none",
                ["--hm-pulse-color" as string]: `${primary}55`,
              }}>
                {props.buttonText} <span style={{ fontSize: 16 }}>→</span>
              </a>
            </div>
          )}

          {trustItems.length > 0 && (
            <div style={{ display: "flex", gap: 20, flexWrap: "wrap", justifyContent: layout === "side" ? "flex-start" : "center" }}>
              {trustItems.map((item: string, i: number) => (
                <span key={i} className="hm-animate-in" style={{ display: "flex", alignItems: "center", gap: 7, color: isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.45)", fontSize: 13, fontWeight: 600, animationDelay: staggerDelay(i + 4) }}>
                  <span style={{ color: "#22c55e", textShadow: "0 0 4px #22c55e66" }}>✓</span> {item}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Video side */}
        <div style={{ flex: layout === "side" ? 1 : "none", width: layout === "side" ? undefined : "100%", maxWidth: layout === "stacked" ? 900 : undefined, margin: layout === "stacked" ? "0 auto" : undefined }}>
          {videoEl}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// COUNTDOWN — Live countdown timer with glassmorphism digit cards
// ---------------------------------------------------------------------------

function CountdownBlock({ props, theme }: { props: Block["props"]; theme: SiteTheme }) {
  const isDark = theme.mode !== "light";
  const primary = px(theme.primaryColor!);
  const bg = props.bgColor ?? (isDark
    ? `${gradients.aurora(primary)}, #050a14`
    : `linear-gradient(135deg, #f8fafc, #e2e8f0)`);
  const textColor = isDark ? "#ffffff" : "#0f172a";
  const subColor = isDark ? "rgba(255,255,255,0.5)" : "rgba(15,23,42,0.55)";
  const targetDate = props.targetDate ?? "";
  const compact = props.compact ?? false;

  const countdownScript = `
(function(){
  var el=document.getElementById('hm-cd-${props.__blockId ?? "timer"}');
  if(!el)return;
  var target=new Date('${targetDate}').getTime();
  function update(){
    var now=Date.now(),diff=Math.max(0,target-now);
    var d=Math.floor(diff/86400000),h=Math.floor((diff%86400000)/3600000),
        m=Math.floor((diff%3600000)/60000),s=Math.floor((diff%60000)/1000);
    var spans=el.querySelectorAll('[data-cd]');
    if(spans[0])spans[0].textContent=String(d).padStart(2,'0');
    if(spans[1])spans[1].textContent=String(h).padStart(2,'0');
    if(spans[2])spans[2].textContent=String(m).padStart(2,'0');
    if(spans[3]){spans[3].textContent=String(s).padStart(2,'0');spans[3].style.animation='none';void spans[3].offsetWidth;spans[3].style.animation='hm-tick 1s ease-in-out';}
    if(diff<=0){clearInterval(tid);el.querySelectorAll('[data-cd]').forEach(function(s){s.textContent='00'});}
  }
  var tid=setInterval(update,1000);update();
})();`;

  const units = ["Days", "Hours", "Minutes", "Seconds"];
  const placeholders = ["00", "00", "00", "00"];

  const digitCardStyle = (i: number): React.CSSProperties => ({
    display: "flex", flexDirection: "column", alignItems: "center", gap: compact ? 4 : 8,
    animationDelay: staggerDelay(i + 1),
  });

  const digitStyle: React.CSSProperties = {
    ...glass.prominent(isDark),
    borderRadius: radii.md,
    padding: compact ? "12px 16px" : "20px 24px",
    minWidth: compact ? 56 : 80,
    textAlign: "center",
    fontSize: compact ? "clamp(1.4rem,3vw,2rem)" : "clamp(2rem,5vw,3.5rem)",
    fontWeight: 900,
    color: textColor,
    fontVariantNumeric: "tabular-nums",
    boxShadow: `${shadows.lg}, ${shadows.glow(primary, 0.1)}`,
    letterSpacing: "-0.02em",
  };

  const labelStyle: React.CSSProperties = {
    color: subColor, fontSize: compact ? 10 : 12,
    fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em",
  };

  const separatorStyle: React.CSSProperties = {
    fontSize: compact ? 24 : 36, fontWeight: 900,
    color: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.15)",
    alignSelf: "flex-start", paddingTop: compact ? 12 : 20,
  };

  return (
    <section style={{ ...sectionBase(bg, compact ? "48px 24px" : "80px 24px"), position: "relative", overflow: "hidden" }}>
      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "60%", height: "100%", background: `radial-gradient(circle, ${primary}10 0%, transparent 60%)`, pointerEvents: "none", filter: "blur(80px)" }} />

      <div style={{ ...container(900), textAlign: "center", position: "relative" }}>
        {props.eyebrow && <p className="hm-animate-in" style={{ ...eyebrowStyle(primary), marginBottom: 8 }}>{props.eyebrow}</p>}
        {props.headline && <h2 className="hm-animate-up" style={{ ...headingStyle(textColor, compact ? "clamp(1.3rem,3vw,1.8rem)" : "clamp(1.6rem,4vw,2.4rem)"), marginBottom: compact ? 16 : 24 }}>{props.headline}</h2>}
        {props.subheadline && !compact && <p className="hm-animate-in hm-stagger-1" style={{ color: subColor, fontSize: 16, maxWidth: 560, margin: "0 auto 32px", lineHeight: 1.7 }}>{props.subheadline}</p>}

        <div id={`hm-cd-${props.__blockId ?? "timer"}`} style={{ display: "flex", justifyContent: "center", alignItems: "flex-start", gap: compact ? 8 : 16, flexWrap: "wrap" }}>
          {placeholders.map((ph, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: compact ? 8 : 16 }}>
              <div className="hm-animate-in" style={digitCardStyle(i)}>
                <span data-cd="" style={digitStyle}>{ph}</span>
                <span style={labelStyle}>{units[i]}</span>
              </div>
              {i < 3 && <span style={separatorStyle}>:</span>}
            </div>
          ))}
        </div>

        {props.buttonText && (
          <div className="hm-animate-in hm-stagger-5" style={{ marginTop: compact ? 20 : 40 }}>
            <a href={props.buttonUrl ?? "#"} className="hm-pulse-btn" style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: compact ? "12px 28px" : "16px 38px", borderRadius: radii.md,
              background: `linear-gradient(135deg, ${primary}, #8b5cf6)`,
              boxShadow: `0 8px 32px ${primary}55`,
              color: "#fff", fontWeight: 800, fontSize: compact ? 14 : 16, textDecoration: "none",
              ["--hm-pulse-color" as string]: `${primary}55`,
            }}>
              {props.buttonText} <span>→</span>
            </a>
          </div>
        )}
      </div>

      {targetDate && <script dangerouslySetInnerHTML={{ __html: countdownScript }} />}
    </section>
  );
}

// ---------------------------------------------------------------------------
// FEATURES — Glassmorphism cards with hover-lift and gradient icon panels
// ---------------------------------------------------------------------------

function FeaturesBlock({ props, theme }: { props: Block["props"]; theme: SiteTheme }) {
  const isDark = theme.mode !== "light";
  const primary = px(theme.primaryColor!);
  const bg = props.bgColor ?? (isDark ? "#07101f" : "#f8fafc");
  const textColor = isDark ? "#ffffff" : "#0f172a";
  const subColor = isDark ? "rgba(255,255,255,0.5)" : "rgba(15,23,42,0.55)";
  const cols = props.columns ?? 3;
  const items: { icon?: string; title?: string; body?: string; number?: string }[] = props.items ?? [];
  const layout = props.layout ?? "grid";

  return (
    <section style={sectionBase(bg)}>
      <div style={container()}>
        {(props.eyebrow || props.title) && (
          <div className="hm-animate-in" style={{ textAlign: "center", marginBottom: 64 }}>
            {props.eyebrow && <p style={{ ...eyebrowStyle(primary), marginBottom: 12 }}>{props.eyebrow}</p>}
            {props.title && <h2 style={{ ...headingStyle(textColor), marginBottom: 16 }}>{props.title}</h2>}
            {props.subtitle && <p style={{ color: subColor, fontSize: 17, maxWidth: 560, margin: "0 auto", lineHeight: 1.7 }}>{props.subtitle}</p>}
          </div>
        )}
        <div style={{
          display: "grid",
          gridTemplateColumns: layout === "list"
            ? "1fr"
            : `repeat(${Math.min(cols, items.length || cols)}, 1fr)`,
          gap: layout === "list" ? 14 : 22,
        }}>
          {items.map((item, i) => (
            <div key={i} className="hm-hover-lift hm-animate-in" style={{
              ...glass.card(isDark),
              borderRadius: radii.lg,
              padding: layout === "list" ? "22px 26px" : "34px 30px",
              display: "flex",
              flexDirection: layout === "list" ? "row" : "column",
              gap: layout === "list" ? 16 : 20,
              alignItems: layout === "list" ? "flex-start" : undefined,
              animationDelay: staggerDelay(i),
              boxShadow: isDark ? shadows.md : shadows.sm,
            }}>
              {item.icon && (
                <div style={{
                  width: 56, height: 56, borderRadius: radii.md, flexShrink: 0,
                  background: `linear-gradient(135deg, ${primary}20, #8b5cf620)`,
                  border: `1px solid ${primary}30`,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26,
                  boxShadow: `0 4px 16px ${primary}20`,
                }}>
                  {item.icon}
                </div>
              )}
              {!item.icon && item.number && (
                <div style={{
                  width: 44, height: 44, borderRadius: "50%", flexShrink: 0,
                  background: `linear-gradient(135deg, ${primary}, #8b5cf6)`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#fff", fontWeight: 900, fontSize: 15,
                  boxShadow: shadows.glow(primary, 0.3),
                }}>
                  {item.number ?? i + 1}
                </div>
              )}
              <div>
                {item.title && <h3 style={{ color: textColor, fontSize: 17, fontWeight: 800, marginBottom: 8 }}>{item.title}</h3>}
                {item.body && <p style={{ color: subColor, fontSize: 14, lineHeight: 1.75, margin: 0 }}>{item.body}</p>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// STATS / NUMBERS — Animated counter bar with glass dividers
// ---------------------------------------------------------------------------

function StatsBlock({ props, theme }: { props: Block["props"]; theme: SiteTheme }) {
  const isDark = theme.mode !== "light";
  const primary = px(theme.primaryColor!);
  const bg = props.bgColor ?? (isDark
    ? `${gradients.aurora(primary)}, #06101e`
    : `linear-gradient(135deg, ${primary}08 0%, transparent 50%), #f0f9ff`);
  const subColor = isDark ? "rgba(255,255,255,0.45)" : "rgba(15,23,42,0.5)";
  const stats: { number?: string; label?: string; suffix?: string }[] = props.stats ?? [
    { number: "500+", label: "Happy Clients" },
    { number: "98%", label: "Satisfaction Rate" },
    { number: "5★", label: "Average Rating" },
    { number: "24h", label: "Response Time" },
  ];

  return (
    <section style={sectionBase(bg, "80px 24px")}>
      <div style={container()}>
        <div style={{
          display: "grid",
          gridTemplateColumns: `repeat(${Math.min(stats.length, 4)}, 1fr)`,
          gap: 0,
          ...glass.prominent(isDark),
          borderRadius: radii.xl, overflow: "hidden",
          boxShadow: isDark ? shadows.lg : shadows.md,
        }}>
          {stats.map((stat, i) => (
            <div key={i} className="hm-animate-in" style={{
              padding: "40px 24px",
              textAlign: "center",
              borderRight: i < stats.length - 1 ? `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)"}` : "none",
              animationDelay: staggerDelay(i),
            }}>
              <div style={{
                fontSize: "clamp(2.2rem,4.5vw,3.2rem)", fontWeight: 900, lineHeight: 1, marginBottom: 10,
                background: `linear-gradient(135deg, ${primary}, #8b5cf6)`,
                backgroundClip: "text", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
              }}>
                {stat.number}{stat.suffix}
              </div>
              <div style={{ color: subColor, fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em" }}>
                {stat.label}
              </div>
            </div>
          ))}
        </div>
        {props.caption && (
          <p style={{ color: subColor, textAlign: "center", fontSize: 13, marginTop: 20 }}>{props.caption}</p>
        )}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// TESTIMONIALS — Glass cards with gradient borders and hover lift
// ---------------------------------------------------------------------------

function TestimonialsBlock({ props, theme }: { props: Block["props"]; theme: SiteTheme }) {
  const isDark = theme.mode !== "light";
  const primary = px(theme.primaryColor!);
  const bg = props.bgColor ?? (isDark ? "#050a14" : "#f8fafc");
  const textColor = isDark ? "#ffffff" : "#0f172a";
  const subColor = isDark ? "rgba(255,255,255,0.65)" : "rgba(15,23,42,0.65)";
  const items: { name?: string; role?: string; company?: string; quote?: string; avatar?: string; stars?: number; verified?: boolean; result?: string }[] = props.items ?? [];

  return (
    <section style={sectionBase(bg)}>
      <div style={container()}>
        {(props.eyebrow || props.title) && (
          <div className="hm-animate-in" style={{ textAlign: "center", marginBottom: 64 }}>
            {props.eyebrow && <p style={{ ...eyebrowStyle(primary), marginBottom: 12 }}>{props.eyebrow}</p>}
            {props.title && <h2 style={{ ...headingStyle(textColor), marginBottom: 16 }}>{props.title}</h2>}
            {props.subtitle && <p style={{ color: subColor, fontSize: 16, maxWidth: 540, margin: "0 auto" }}>{props.subtitle}</p>}
          </div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 22 }}>
          {items.map((item, i) => (
            <div key={i} className="hm-hover-lift hm-animate-in" style={{
              ...glass.card(isDark),
              borderRadius: radii.xl, padding: "34px 30px",
              display: "flex", flexDirection: "column", gap: 20,
              position: "relative",
              boxShadow: isDark ? shadows.md : shadows.sm,
              animationDelay: staggerDelay(i),
            }}>
              {/* Result callout with glow */}
              {item.result && (
                <div style={{
                  position: "absolute", top: -1, right: 20,
                  background: `linear-gradient(135deg, ${primary}, #8b5cf6)`,
                  color: "#fff", fontSize: 11, fontWeight: 800,
                  padding: "5px 14px", borderRadius: "0 0 12px 12px",
                  letterSpacing: "0.05em",
                  boxShadow: shadows.glow(primary, 0.25),
                }}>
                  {item.result}
                </div>
              )}
              {/* Stars */}
              <div style={{ display: "flex", gap: 3 }}>
                {[...Array(item.stars ?? 5)].map((_, j) => (
                  <span key={j} style={{ color: "#f59e0b", fontSize: 16, textShadow: "0 0 4px #f59e0b44" }}>★</span>
                ))}
              </div>
              {/* Quote */}
              <div>
                <div style={{ color: primary, fontSize: 52, lineHeight: 0.6, fontFamily: "Georgia, serif", opacity: 0.3, marginBottom: 10 }}>&ldquo;</div>
                {item.quote && <p style={{ color: subColor, fontSize: 15, lineHeight: 1.8, margin: 0 }}>{item.quote}</p>}
              </div>
              {/* Author */}
              <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: "auto", paddingTop: 8, borderTop: `1px solid ${isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)"}` }}>
                {item.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.avatar} alt={item.name ?? ""} style={{ width: 46, height: 46, borderRadius: "50%", objectFit: "cover", flexShrink: 0, border: `2px solid ${primary}33` }} />
                ) : (
                  <div style={{
                    width: 46, height: 46, borderRadius: "50%", flexShrink: 0,
                    background: `linear-gradient(135deg, ${primary}, #8b5cf6)`,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    color: "#fff", fontWeight: 800, fontSize: 16,
                    boxShadow: shadows.glow(primary, 0.2),
                  }}>
                    {(item.name ?? "A").charAt(0).toUpperCase()}
                  </div>
                )}
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {item.name && <span style={{ color: textColor, fontSize: 14, fontWeight: 700 }}>{item.name}</span>}
                    {item.verified !== false && (
                      <span style={{ color: "#3b82f6", fontSize: 13, background: "#3b82f615", borderRadius: 4, padding: "1px 4px" }}>✓</span>
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
// PRICING — Glass tier cards with prominent popular tier and glow
// ---------------------------------------------------------------------------

function PricingBlock({ props, theme }: { props: Block["props"]; theme: SiteTheme }) {
  const isDark = theme.mode !== "light";
  const primary = px(theme.primaryColor!);
  const bg = props.bgColor ?? (isDark ? "#07101f" : "#f8fafc");
  const textColor = isDark ? "#ffffff" : "#0f172a";
  const subColor = isDark ? "rgba(255,255,255,0.45)" : "rgba(15,23,42,0.5)";
  const tiers: { label?: string; price?: string; period?: string; description?: string; features?: string[]; buttonText?: string; buttonUrl?: string; highlight?: boolean; badge?: string; strikePrice?: string }[] = props.tiers ?? [];

  return (
    <section style={{ ...sectionBase(bg), position: "relative", overflow: "hidden" }}>
      {/* Background glow for pricing */}
      <div style={{ position: "absolute", top: "30%", left: "50%", width: "50%", height: "50%", transform: "translateX(-50%)", background: `radial-gradient(circle, ${primary}08 0%, transparent 70%)`, pointerEvents: "none", filter: "blur(80px)" }} />
      <div style={{ ...container(), position: "relative" }}>
        {(props.eyebrow || props.title) && (
          <div className="hm-animate-in" style={{ textAlign: "center", marginBottom: 64 }}>
            {props.eyebrow && <p style={{ ...eyebrowStyle(primary), marginBottom: 12 }}>{props.eyebrow}</p>}
            {props.title && <h2 style={{ ...headingStyle(textColor), marginBottom: 16 }}>{props.title}</h2>}
            {props.subtitle && <p style={{ color: subColor, fontSize: 16, maxWidth: 520, margin: "0 auto" }}>{props.subtitle}</p>}
          </div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(tiers.length || 3, 3)}, 1fr)`, gap: 22, alignItems: "start" }}>
          {tiers.map((tier, i) => (
            <div key={i} className="hm-hover-lift hm-animate-in" style={{
              ...(tier.highlight ? glass.prominent(isDark) : glass.card(isDark)),
              borderRadius: radii.xl,
              padding: "40px 30px",
              display: "flex", flexDirection: "column", gap: 24,
              position: "relative",
              boxShadow: tier.highlight
                ? `${shadows.glow(primary, 0.2)}, ${shadows.lg}`
                : shadows.sm,
              transform: tier.highlight ? "scale(1.04)" : "none",
              borderColor: tier.highlight ? `${primary}60` : undefined,
              animationDelay: staggerDelay(i),
            }}>
              {/* Popular badge with glow */}
              {tier.badge && (
                <div style={{
                  position: "absolute", top: -14, left: "50%", transform: "translateX(-50%)",
                  background: `linear-gradient(135deg, ${primary}, #8b5cf6)`,
                  color: "#fff", fontSize: 11, fontWeight: 800,
                  padding: "5px 20px", borderRadius: radii.pill,
                  letterSpacing: "0.1em", textTransform: "uppercase", whiteSpace: "nowrap",
                  boxShadow: shadows.glow(primary, 0.35),
                }}>
                  {tier.badge}
                </div>
              )}

              <div>
                {tier.label && <p style={{ color: tier.highlight ? primary : subColor, fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.12em", margin: "0 0 14px" }}>{tier.label}</p>}
                <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                  {tier.strikePrice && (
                    <span style={{ color: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.25)", fontSize: 20, textDecoration: "line-through", marginRight: 4 }}>{tier.strikePrice}</span>
                  )}
                  <span style={{ color: textColor, fontSize: 44, fontWeight: 900, lineHeight: 1 }}>{tier.price}</span>
                  {tier.period && <span style={{ color: subColor, fontSize: 14, marginLeft: 4 }}>{tier.period}</span>}
                </div>
                {tier.description && <p style={{ color: subColor, fontSize: 14, marginTop: 12, lineHeight: 1.6, margin: "12px 0 0" }}>{tier.description}</p>}
              </div>

              {tier.buttonText && (
                <a href={tier.buttonUrl ?? "#"} className={tier.highlight ? "hm-pulse-btn" : ""} style={{
                  display: "block", textAlign: "center",
                  padding: "14px 24px", borderRadius: radii.md,
                  background: tier.highlight ? `linear-gradient(135deg, ${primary}, #8b5cf6)` : "transparent",
                  border: tier.highlight ? "none" : `1px solid ${isDark ? "rgba(255,255,255,0.12)" : "#e2e8f0"}`,
                  color: tier.highlight ? "#fff" : textColor,
                  fontWeight: 800, fontSize: 14, textDecoration: "none",
                  boxShadow: tier.highlight ? shadows.glow(primary, 0.35) : "none",
                  ["--hm-pulse-color" as string]: tier.highlight ? `${primary}44` : "transparent",
                }}>
                  {tier.buttonText}
                </a>
              )}

              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: 12 }}>
                {(tier.features ?? []).map((f: string, j: number) => (
                  <li key={j} style={{ display: "flex", alignItems: "flex-start", gap: 10, color: isDark ? "rgba(255,255,255,0.7)" : "rgba(15,23,42,0.7)", fontSize: 14, lineHeight: 1.5 }}>
                    <span style={{ color: tier.highlight ? primary : "#22c55e", fontSize: 15, flexShrink: 0, marginTop: 1 }}>✓</span>
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        {props.guarantee && (
          <p className="hm-animate-in hm-stagger-4" style={{ color: subColor, textAlign: "center", fontSize: 13, marginTop: 36, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
            <span style={{ fontSize: 14 }}>🔒</span> {props.guarantee}
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
  const bg = props.bgColor ?? (isDark ? "#050a14" : "#ffffff");
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
            {props.subtitle && <p style={{ color: subColor, fontSize: 16, maxWidth: 520, margin: "0 auto" }}>{props.subtitle}</p>}
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
                background: `linear-gradient(135deg, ${primary}, #8b5cf6)`,
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
// CTA — High-impact conversion with animated gradient and glass button
// ---------------------------------------------------------------------------

function CTABlock({ props, theme }: { props: Block["props"]; theme: SiteTheme }) {
  const primary = px(theme.primaryColor!);
  const bg = props.bgColor ?? `linear-gradient(135deg, ${primary}ee 0%, #8b5cf6ee 50%, ${primary}dd 100%)`;
  const trustItems: string[] = props.trustItems ?? [];

  return (
    <section style={{ background: bg, backgroundSize: "200% 200%", padding: "110px 24px", textAlign: "center", position: "relative", overflow: "hidden" }}>
      {/* Ambient light orbs */}
      <div style={{ position: "absolute", top: "-30%", right: "-10%", width: "50%", height: "80%", background: "radial-gradient(circle, rgba(255,255,255,0.08) 0%, transparent 60%)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: "-20%", left: "-10%", width: "40%", height: "60%", background: "radial-gradient(circle, rgba(255,255,255,0.06) 0%, transparent 60%)", pointerEvents: "none" }} />
      {/* Noise texture */}
      <div style={{
        position: "absolute", inset: 0, opacity: 0.04,
        backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='40' height='40' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")",
        pointerEvents: "none",
      }} />
      <div style={{ ...container(740), position: "relative" }}>
        {props.eyebrow && <p className="hm-animate-in" style={{ ...eyebrowStyle("rgba(255,255,255,0.75)"), marginBottom: 18 }}>{props.eyebrow}</p>}
        <h2 className="hm-animate-up" style={{ ...headingStyle("#ffffff", "clamp(2.2rem,5vw,3.5rem)"), marginBottom: 22, letterSpacing: "-0.02em" }}>
          {props.headline || "Ready to get started?"}
        </h2>
        {props.subheadline && (
          <p className="hm-animate-in hm-stagger-2" style={{ color: "rgba(255,255,255,0.82)", fontSize: 18, lineHeight: 1.75, marginBottom: 44, maxWidth: 580, margin: "0 auto 44px" }}>
            {props.subheadline}
          </p>
        )}
        {props.buttonText && (
          <div className="hm-animate-in hm-stagger-3" style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap", marginBottom: 32 }}>
            <a href={props.buttonUrl ?? "#"} className="hm-pulse-btn" style={{
              display: "inline-flex", alignItems: "center", gap: 8,
              padding: "18px 44px", borderRadius: radii.md,
              background: "#ffffff",
              color: "#0f172a", fontWeight: 900, fontSize: 16, textDecoration: "none",
              boxShadow: "0 12px 40px rgba(0,0,0,0.3), 0 4px 12px rgba(0,0,0,0.1)",
              ["--hm-pulse-color" as string]: "rgba(255,255,255,0.3)",
            }}>
              {props.buttonText} <span style={{ fontSize: 18 }}>→</span>
            </a>
            {props.secondaryButtonText && (
              <a href={props.secondaryButtonUrl ?? "#"} style={{
                display: "inline-flex", alignItems: "center", gap: 8,
                padding: "18px 44px", borderRadius: radii.md,
                border: "1px solid rgba(255,255,255,0.3)",
                background: "rgba(255,255,255,0.08)",
                backdropFilter: "blur(8px)",
                color: "#ffffff", fontWeight: 700, fontSize: 16, textDecoration: "none",
              }}>
                {props.secondaryButtonText}
              </a>
            )}
          </div>
        )}
        {trustItems.length > 0 && (
          <div className="hm-animate-in hm-stagger-4" style={{ display: "flex", gap: 22, flexWrap: "wrap", justifyContent: "center" }}>
            {trustItems.map((item: string, i: number) => (
              <span key={i} style={{ display: "flex", alignItems: "center", gap: 6, color: "rgba(255,255,255,0.7)", fontSize: 13, fontWeight: 600 }}>
                <span style={{ textShadow: "0 0 4px rgba(255,255,255,0.4)" }}>✓</span> {item}
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// GUARANTEE — Glass trust shield with gradient accent
// ---------------------------------------------------------------------------

function GuaranteeBlock({ props, theme }: { props: Block["props"]; theme: SiteTheme }) {
  const isDark = theme.mode !== "light";
  const primary = px(theme.primaryColor!);
  const bg = props.bgColor ?? (isDark ? "#050a14" : "#ffffff");
  const textColor = isDark ? "#ffffff" : "#0f172a";
  const subColor = isDark ? "rgba(255,255,255,0.6)" : "rgba(15,23,42,0.6)";

  return (
    <section style={sectionBase(bg, "72px 24px")}>
      <div style={{ ...container(700) }}>
        <div className="hm-animate-in" style={{
          display: "flex", gap: 28, alignItems: "flex-start",
          ...glass.prominent(isDark),
          borderRadius: radii.xl, padding: "44px 40px",
          boxShadow: isDark ? shadows.lg : shadows.md,
        }}>
          <div className="hm-float" style={{
            width: 76, height: 76, borderRadius: "50%", flexShrink: 0,
            background: `linear-gradient(135deg, ${primary}25, #22c55e25)`,
            border: `2px solid ${primary}40`,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: 34,
            boxShadow: `0 8px 24px ${primary}20`,
          }}>
            {props.icon ?? "🛡️"}
          </div>
          <div>
            <h3 style={{ color: textColor, fontSize: 22, fontWeight: 900, marginBottom: 12 }}>
              {props.headline ?? "100% Money-Back Guarantee"}
            </h3>
            <p style={{ color: subColor, fontSize: 15, lineHeight: 1.8, margin: 0 }}>
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
        <div className="hm-animate-in" style={{
          display: "flex", gap: 0, justifyContent: "center",
          overflow: "hidden",
          flexWrap: "wrap",
          ...glass.subtle(isDark),
          border: `1px solid ${borderColor}`,
          borderRadius: radii.lg,
          boxShadow: isDark ? shadows.sm : "none",
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
// PROCESS — Numbered steps with gradient connector lines and glass cards
// ---------------------------------------------------------------------------

function ProcessBlock({ props, theme }: { props: Block["props"]; theme: SiteTheme }) {
  const isDark = theme.mode !== "light";
  const primary = px(theme.primaryColor!);
  const bg = props.bgColor ?? (isDark ? "#07101f" : "#f8fafc");
  const textColor = isDark ? "#ffffff" : "#0f172a";
  const subColor = isDark ? "rgba(255,255,255,0.5)" : "rgba(15,23,42,0.55)";
  const steps: { icon?: string; title?: string; body?: string }[] = props.steps ?? [];

  return (
    <section style={sectionBase(bg)}>
      <div style={container()}>
        {(props.eyebrow || props.title) && (
          <div className="hm-animate-in" style={{ textAlign: "center", marginBottom: 64 }}>
            {props.eyebrow && <p style={{ ...eyebrowStyle(primary), marginBottom: 12 }}>{props.eyebrow}</p>}
            {props.title && <h2 style={{ ...headingStyle(textColor), marginBottom: 16 }}>{props.title}</h2>}
            {props.subtitle && <p style={{ color: subColor, fontSize: 16, maxWidth: 520, margin: "0 auto" }}>{props.subtitle}</p>}
          </div>
        )}
        <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.min(steps.length || 3, 4)}, 1fr)`, gap: 22, position: "relative" }}>
          {steps.map((step, i) => (
            <div key={i} className="hm-animate-in" style={{ textAlign: "center", padding: "0 12px", position: "relative", animationDelay: staggerDelay(i) }}>
              {/* Gradient connector line */}
              {i < steps.length - 1 && (
                <div style={{
                  position: "absolute", top: 28, left: "calc(50% + 30px)", right: "calc(-50% + 30px)",
                  height: 2, background: `linear-gradient(90deg, ${primary}80, #8b5cf660, ${primary}20)`,
                  borderRadius: 1,
                }} />
              )}
              <div style={{
                width: 56, height: 56, borderRadius: "50%", margin: "0 auto 22px",
                background: `linear-gradient(135deg, ${primary}, #8b5cf6)`,
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#fff", fontWeight: 900, fontSize: step.icon ? 24 : 18,
                boxShadow: `${shadows.glow(primary, 0.35)}, 0 4px 12px rgba(0,0,0,0.2)`,
                position: "relative", zIndex: 1,
              }}>
                {step.icon ?? (i + 1)}
              </div>
              {step.title && <h3 style={{ color: textColor, fontSize: 17, fontWeight: 800, marginBottom: 10 }}>{step.title}</h3>}
              {step.body && <p style={{ color: subColor, fontSize: 14, lineHeight: 1.75 }}>{step.body}</p>}
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
  const bg = props.bgColor ?? (isDark ? "#050a14" : "#ffffff");
  const textColor = isDark ? "#ffffff" : "#0f172a";
  const subColor = isDark ? "rgba(255,255,255,0.5)" : "rgba(15,23,42,0.55)";
  const beforeItems: string[] = props.beforeItems ?? [];
  const afterItems: string[] = props.afterItems ?? [];

  return (
    <section className="hm-animate-in" style={sectionBase(bg)}>
      <div style={container(860)}>
        {props.title && (
          <h2 style={{ ...headingStyle(textColor), textAlign: "center", marginBottom: 48 }}>{props.title}</h2>
        )}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          {/* Before */}
          <div className="hm-hover-lift" style={{
            ...glass.card(isDark),
            border: `1px solid rgba(239,68,68,0.2)`,
            borderRadius: radii.xl, padding: "28px 24px",
            boxShadow: "0 8px 24px rgba(239,68,68,0.08)",
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
          <div className="hm-hover-lift" style={{
            ...glass.card(isDark),
            border: `1px solid ${primary}33`,
            borderRadius: radii.xl, padding: "28px 24px",
            boxShadow: shadows.glow(primary, 0.15),
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
    <div className="hm-shimmer-bg" style={{
      background: bg, padding: "12px 24px",
      display: "flex", alignItems: "center", justifyContent: "center", gap: 24,
      flexWrap: "wrap",
      backgroundSize: "200% 100%",
      boxShadow: "0 4px 20px rgba(220,38,38,0.3)",
      borderRadius: radii.md,
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
  const bg = props.bgColor ?? (isDark ? "#050a14" : "#ffffff");
  const textColor = isDark ? "rgba(255,255,255,0.8)" : "#1e293b";

  return (
    <section style={sectionBase(bg, "60px 24px")}>
      <div style={{ ...container(720), color: textColor, fontSize: 16, lineHeight: 1.85 }}
        dangerouslySetInnerHTML={{ __html: (props.html || props.content || "").replace(/\n/g, "<br/>") }}
      />
    </section>
  );
}

// ---------------------------------------------------------------------------
// IMAGE
// ---------------------------------------------------------------------------

function ImageBlock({ props, theme }: { props: Block["props"]; theme: SiteTheme }) {
  const isDark = theme.mode !== "light";
  const bg = props.bgColor ?? (isDark ? "#050a14" : "#ffffff");
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
  const bg = props.bgColor ?? (isDark ? "#050a14" : "#ffffff");

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
// FORM — Lead capture with live submission and glass container
// ---------------------------------------------------------------------------

function FormBlock({ props, theme }: { props: Block["props"]; theme: SiteTheme }) {
  const isDark = theme.mode !== "light";
  const primary = px(theme.primaryColor!);
  const bg = props.bgColor ?? (isDark ? "#07101f" : "#f8fafc");
  const textColor = isDark ? "#ffffff" : "#0f172a";
  const subColor = isDark ? "rgba(255,255,255,0.5)" : "rgba(15,23,42,0.5)";
  const inputBg = isDark ? "rgba(255,255,255,0.05)" : "#ffffff";
  const inputBorder = isDark ? "rgba(255,255,255,0.1)" : "#e2e8f0";
  const fields: { name?: string; type?: string; placeholder?: string; required?: boolean }[] = props.fields ?? [
    { name: "name", type: "text", placeholder: "Your Name", required: true },
    { name: "email", type: "email", placeholder: "Email Address", required: true },
    { name: "phone", type: "tel", placeholder: "Phone (optional)" },
  ];

  const siteId = props.__siteId;
  const pageId = props.__pageId;
  const blockId = props.__blockId;

  const handleSubmit = siteId ? `
    (function(e){
      e.preventDefault();
      var btn=e.target.querySelector('button[type=submit]');
      btn.disabled=true;btn.textContent='Sending...';
      var data={};
      e.target.querySelectorAll('input,textarea').forEach(function(el){
        if(el.name)data[el.name]=el.value;
      });
      fetch('/api/sites/'+${JSON.stringify(siteId)}+'/submissions',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({data:data,pageId:${JSON.stringify(pageId ?? null)},blockId:${JSON.stringify(blockId ?? null)}})
      }).then(function(r){return r.json()}).then(function(r){
        if(r.ok){
          e.target.reset();btn.textContent='Sent ✓';btn.style.background='#22c55e';
          setTimeout(function(){btn.textContent=${JSON.stringify(props.buttonText ?? "Submit")};btn.disabled=false;btn.style.background='';},3000);
        }else{btn.textContent='Try again';btn.disabled=false;}
      }).catch(function(){btn.textContent='Try again';btn.disabled=false;});
    })(event)
  ` : undefined;

  return (
    <section style={sectionBase(bg)}>
      <div style={{ ...container(560) }}>
        {(props.eyebrow || props.title) && (
          <div className="hm-animate-in" style={{ textAlign: "center", marginBottom: 40 }}>
            {props.eyebrow && <p style={{ ...eyebrowStyle(primary), marginBottom: 12 }}>{props.eyebrow}</p>}
            {props.title && <h2 style={{ ...headingStyle(textColor, "clamp(1.5rem,3vw,2rem)"), marginBottom: 12 }}>{props.title}</h2>}
            {props.subtitle && <p style={{ color: subColor, fontSize: 15, lineHeight: 1.7 }}>{props.subtitle}</p>}
          </div>
        )}
        <div className="hm-animate-in hm-stagger-2" style={{
          ...glass.prominent(isDark),
          borderRadius: radii.xl, padding: "44px 38px",
          boxShadow: isDark ? shadows.lg : shadows.md,
        }}>
          <form onSubmit={handleSubmit ? undefined : (e) => e.preventDefault()}
            {...(handleSubmit ? { dangerouslySetInnerHTML: undefined } : {})}
            action="javascript:void(0)"
            data-hm-submit={handleSubmit ? "true" : undefined}
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {fields.map((field, i) => (
                <div key={i}>
                  {field.type === "textarea" ? (
                    <textarea name={field.name} placeholder={field.placeholder ?? field.name} rows={4} required={field.required}
                      style={{ width: "100%", background: inputBg, border: `1px solid ${inputBorder}`, borderRadius: radii.md, padding: "14px 16px", color: textColor, fontSize: 15, outline: "none", resize: "vertical", fontFamily: "inherit", transition: "border-color 0.2s" }} />
                  ) : (
                    <input type={field.type ?? "text"} name={field.name} placeholder={field.placeholder ?? field.name} required={field.required}
                      style={{ width: "100%", background: inputBg, border: `1px solid ${inputBorder}`, borderRadius: radii.md, padding: "14px 16px", color: textColor, fontSize: 15, outline: "none", transition: "border-color 0.2s" }} />
                  )}
                </div>
              ))}
              <button type="submit" className="hm-pulse-btn" style={{
                width: "100%", padding: "16px", borderRadius: radii.md, border: "none",
                background: `linear-gradient(135deg, ${primary}, #8b5cf6)`,
                color: "#fff", fontWeight: 800, fontSize: 16, cursor: "pointer",
                boxShadow: shadows.glow(primary, 0.35), marginTop: 10,
                transition: "transform 0.2s, box-shadow 0.2s",
                ["--hm-pulse-color" as string]: `${primary}44`,
              }}>
                {props.buttonText ?? "Submit"}
              </button>
              {props.privacyText && (
                <p style={{ color: subColor, fontSize: 12, textAlign: "center", margin: "4px 0 0" }}>{props.privacyText}</p>
              )}
            </div>
          </form>
          {handleSubmit && (
            <script dangerouslySetInnerHTML={{ __html: `
              document.currentScript.previousElementSibling.addEventListener('submit', function(event){${handleSubmit}});
            ` }} />
          )}
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
        <div className="hm-animate-in" style={{
          ...glass.prominent(isDark),
          borderRadius: 24, padding: "44px 40px",
          border: `1px solid ${borderColor}`,
          boxShadow: shadows.xl,
        }}>
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <p style={{ color: subColor, fontSize: 11, fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", marginBottom: 8 }}>SECURE ORDER FORM</p>
            <h2 style={{ ...headingStyle(textColor, "1.6rem"), marginBottom: 8 }}>{props.title ?? "Complete Your Order"}</h2>
            {props.subtitle && <p style={{ color: subColor, fontSize: 14 }}>{props.subtitle}</p>}
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

          <button type="button" className="hm-pulse-btn" style={{
            width: "100%", padding: "18px", borderRadius: 14, border: "none",
            background: `linear-gradient(135deg, ${primary}, #8b5cf6)`,
            color: "#fff", fontWeight: 900, fontSize: 17, cursor: "pointer",
            boxShadow: `0 8px 32px ${primary}50`,
            ["--hm-pulse-color" as string]: primary + "44",
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
}: {
  props: Block["props"];
  theme: SiteTheme;
  products?: SiteProduct[];
}) {
  const isDark = theme.mode !== "light";
  const primary = px(theme.primaryColor!);
  const bg = props.bgColor ?? (isDark ? "#050a14" : "#ffffff");
  const textColor = isDark ? "#ffffff" : "#0f172a";
  const subColor = isDark ? "rgba(255,255,255,0.35)" : "rgba(15,23,42,0.4)";
  const cardBg = isDark ? "rgba(255,255,255,0.03)" : "#ffffff";
  const cardBorder = isDark ? "rgba(255,255,255,0.08)" : "#e2e8f0";
  const columns = Math.max(1, Math.min(Number(props.columns ?? 3), 4));

  return (
    <section style={sectionBase(bg)}>
      <div style={container()}>
        {props.title && <h2 style={{ ...headingStyle(textColor), textAlign: "center", marginBottom: 16 }}>{props.title}</h2>}
        {props.subtitle && (
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

                    <a
                      href={props.buttonUrl ?? "#"}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "100%",
                        padding: "14px 18px",
                        borderRadius: 14,
                        textDecoration: "none",
                        background: `linear-gradient(135deg, ${primary}, #8b5cf6)`,
                        color: "#ffffff",
                        fontSize: 14,
                        fontWeight: 800,
                        boxShadow: `0 12px 30px ${primary}33`,
                      }}
                    >
                      {props.buttonText ?? "Shop now"}
                    </a>
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
  const bg = props.bgColor ?? (isDark ? "#050a14" : "#ffffff");
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

function FooterBlock({ props, theme }: { props: Block["props"]; theme: SiteTheme }) {
  const isDark = theme.mode !== "light";
  const primary = px(theme.primaryColor!);
  const bg = props.bgColor ?? (isDark ? "#020509" : "#0f172a");
  const textColor = isDark ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.4)";
  const links: { label?: string; url?: string }[] = props.links ?? [];
  const columns: { title?: string; links?: { label?: string; url?: string }[] }[] = props.columns ?? [];

  return (
    <footer style={{ background: bg, padding: "60px 24px 32px" }}>
      <div style={{ height: 1, background: `linear-gradient(90deg, transparent, ${primary}40, transparent)` }} />
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

function AnimationStyles() {
  return <style dangerouslySetInnerHTML={{ __html: ANIMATION_STYLES }} />;
}

export default function BlockRenderer({ block, theme, preview, selected, onClick, products, overlayActions }: Props) {
  const t = { ...DEFAULT_THEME, ...theme };

  const rendered = (() => {
    switch (block.type) {
      case "hero": return <HeroBlock props={block.props} theme={t} />;
      case "video_hero": return <VideoHeroBlock props={block.props} theme={t} />;
      case "countdown": return <CountdownBlock props={block.props} theme={t} />;
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
      case "products": return <ProductsBlock props={block.props} theme={t} products={products} />;
      case "checkout": return <CheckoutBlock props={block.props} theme={t} />;
      case "footer": return <FooterBlock props={block.props} theme={t} />;
      case "guarantee": return <GuaranteeBlock props={block.props} theme={t} />;
      case "trust_badges": return <TrustBadgesBlock props={block.props} theme={t} />;
      case "process": return <ProcessBlock props={block.props} theme={t} />;
      case "before_after": return <BeforeAfterBlock props={block.props} theme={t} />;
      case "urgency": return <UrgencyBlock props={block.props} theme={t} />;
      default: return null;
    }
  })();

  if (!preview) return <><AnimationStyles />{rendered}</>;

  return (
    <div
      onClick={onClick}
      style={{
        position: "relative",
        cursor: "pointer",
        outline: selected ? `2px solid #06b6d4` : "none",
        outlineOffset: -2,
        transition: "outline 0.1s",
      }}
    >
      <AnimationStyles />
      {rendered}
      {selected && (
        <>
          <div style={{
            position: "absolute", top: 8, right: 8,
            background: "#06b6d4", color: "#050a14",
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
