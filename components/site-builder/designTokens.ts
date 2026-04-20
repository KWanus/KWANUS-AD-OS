export const shadows = {
  sm: "0 2px 8px rgba(0,0,0,0.08)",
  md: "0 8px 32px rgba(0,0,0,0.12)",
  lg: "0 20px 60px rgba(0,0,0,0.18)",
  xl: "0 32px 80px rgba(0,0,0,0.25)",
  glow: (color: string, intensity = 0.4) => `0 8px 32px ${color}${Math.round(intensity * 255).toString(16).padStart(2, "0")}`,
  innerGlow: (color: string) => `inset 0 1px 0 ${color}22, 0 1px 2px rgba(0,0,0,0.1)`,
} as const;

export const glass = {
  card: (isDark: boolean) => ({
    background: isDark ? "rgba(255,255,255,0.03)" : "rgba(255,255,255,0.7)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    border: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.9)"}`,
  }),
  prominent: (isDark: boolean) => ({
    background: isDark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.85)",
    backdropFilter: "blur(20px)",
    WebkitBackdropFilter: "blur(20px)",
    border: `1px solid ${isDark ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.95)"}`,
  }),
  subtle: (isDark: boolean) => ({
    background: isDark ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.5)",
    backdropFilter: "blur(8px)",
    WebkitBackdropFilter: "blur(8px)",
    border: `1px solid ${isDark ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.7)"}`,
  }),
} as const;

export const gradients = {
  mesh: (primary: string) =>
    `radial-gradient(ellipse 80% 50% at 20% 40%, ${primary}15 0%, transparent 50%), ` +
    `radial-gradient(ellipse 60% 40% at 80% 20%, #8b5cf615 0%, transparent 50%), ` +
    `radial-gradient(ellipse 50% 60% at 50% 80%, #06b6d410 0%, transparent 50%)`,
  aurora: (primary: string) =>
    `radial-gradient(ellipse 100% 80% at 50% -20%, ${primary}20 0%, transparent 60%), ` +
    `radial-gradient(ellipse 60% 50% at 100% 50%, #8b5cf615 0%, transparent 50%), ` +
    `radial-gradient(ellipse 60% 50% at 0% 50%, #06b6d415 0%, transparent 50%)`,
  shimmer: (primary: string) =>
    `linear-gradient(110deg, transparent 25%, ${primary}08 37%, ${primary}15 50%, ${primary}08 63%, transparent 75%)`,
  borderGradient: (primary: string) =>
    `linear-gradient(135deg, ${primary}40, #8b5cf640, ${primary}40)`,
} as const;

export const radii = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  pill: 100,
} as const;

export const spacing = {
  section: "110px 24px",
  sectionCompact: "72px 24px",
  card: "32px 28px",
  cardLg: "40px 36px",
} as const;

export function colorWithAlpha(hex: string, alpha: number): string {
  const a = Math.round(alpha * 255).toString(16).padStart(2, "0");
  return hex.length === 7 ? `${hex}${a}` : hex;
}
