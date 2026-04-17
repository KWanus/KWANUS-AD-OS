import type { ReactNode } from "react";

type PublicShellPage = {
  id: string;
  title: string;
  slug: string;
};

type PublicSiteShellProps = {
  siteName: string;
  siteSlug: string;
  customDomain?: string | null;
  currentPageSlug: string;
  faviconEmoji?: string | null;
  theme?: {
    primaryColor?: string;
    mode?: "dark" | "light";
    shell?: {
      navLabels?: Record<string, string>;
      headerCtaLabel?: string;
      headerCtaHref?: string;
      footerDescription?: string;
      footerLinks?: Array<{ label?: string; url?: string }>;
    };
  };
  pages: PublicShellPage[];
  children: ReactNode;
};

export default function PublicSiteShell({
  siteName,
  siteSlug,
  customDomain,
  currentPageSlug,
  faviconEmoji,
  theme,
  pages,
  children,
}: PublicSiteShellProps) {
  const isDark = theme?.mode !== "light";
  const primary = theme?.primaryColor || "#f5a623";
  const navBg = isDark ? "rgba(2,5,9,0.88)" : "rgba(255,255,255,0.88)";
  const navBorder = isDark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.08)";
  const textColor = isDark ? "#ffffff" : "#0f172a";
  const subColor = isDark ? "rgba(255,255,255,0.58)" : "rgba(15,23,42,0.58)";
  const shell = theme?.shell;
  const normalizedDomain = customDomain?.trim().replace(/^https?:\/\//, "") || null;
  const siteRoot = normalizedDomain ? `https://${normalizedDomain}` : `/s/${siteSlug}`;
  const links = pages.map((page) => ({
    ...page,
    label: shell?.navLabels?.[page.slug] || page.title,
    href: page.slug === "home" ? siteRoot : normalizedDomain ? `${siteRoot}/${page.slug}` : `${siteRoot}/${page.slug}`,
  }));
  const footerLinks = (shell?.footerLinks?.filter((link) => link?.label && link?.url) ?? []) as Array<{ label: string; url: string }>;

  return (
    <div className="min-h-screen w-full flex flex-col" style={{ borderTop: `4px solid ${primary}` }}>
      <header
        style={{
          position: "sticky",
          top: 0,
          zIndex: 20,
          backdropFilter: "blur(16px)",
          background: navBg,
          borderBottom: `1px solid ${navBorder}`,
        }}
      >
        <div
          style={{
            maxWidth: 1120,
            margin: "0 auto",
            padding: "16px 24px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 20,
            flexWrap: "wrap",
          }}
        >
          <a
            href={siteRoot}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 10,
              color: textColor,
              textDecoration: "none",
              fontWeight: 900,
              letterSpacing: "0.02em",
            }}
          >
            <span
              style={{
                width: 36,
                height: 36,
                borderRadius: 12,
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                background: isDark ? "rgba(255,255,255,0.06)" : "rgba(15,23,42,0.05)",
                border: `1px solid ${navBorder}`,
                fontSize: 18,
              }}
            >
              {faviconEmoji || "🚀"}
            </span>
            <span>{siteName}</span>
          </a>

          <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <nav style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
            {links.map((page) => {
              const active = page.slug === currentPageSlug;
              return (
                <a
                  key={page.id}
                  href={page.href}
                  style={{
                    padding: "9px 14px",
                    borderRadius: 999,
                    textDecoration: "none",
                    fontSize: 13,
                    fontWeight: 800,
                    letterSpacing: "0.02em",
                    color: active ? (isDark ? "#041018" : "#ffffff") : subColor,
                    background: active ? primary : "transparent",
                    border: active ? `1px solid ${primary}` : `1px solid ${navBorder}`,
                  }}
                >
                  {page.label}
                </a>
              );
            })}
          </nav>
          {shell?.headerCtaLabel && (
            <a
              href={shell.headerCtaHref || "#"}
              style={{
                padding: "10px 16px",
                borderRadius: 999,
                textDecoration: "none",
                fontSize: 13,
                fontWeight: 900,
                letterSpacing: "0.03em",
                color: isDark ? "#041018" : "#ffffff",
                background: primary,
                border: `1px solid ${primary}`,
                boxShadow: `0 10px 28px ${primary}33`,
              }}
            >
              {shell.headerCtaLabel}
            </a>
          )}
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      {links.length > 1 && (
        <footer
          style={{
            borderTop: `1px solid ${navBorder}`,
            background: isDark ? "#020509" : "#ffffff",
          }}
        >
          <div
            style={{
              maxWidth: 1120,
              margin: "0 auto",
              padding: "40px 24px",
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 24,
              flexWrap: "wrap",
            }}
          >
            <div>
              <p style={{ color: textColor, fontWeight: 900, fontSize: 18, margin: 0 }}>{siteName}</p>
              <p style={{ color: subColor, fontSize: 14, lineHeight: 1.7, margin: "10px 0 0" }}>
                {shell?.footerDescription || "Built as a multi-page conversion site with connected navigation."}
              </p>
            </div>
            <div>
              <p style={{ color: subColor, fontSize: 11, fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", margin: 0 }}>
                Site Navigation
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 14 }}>
                {links.map((page) => (
                  <a
                    key={page.id}
                    href={page.href}
                    style={{
                      color: page.slug === currentPageSlug ? primary : textColor,
                      textDecoration: "none",
                      fontSize: 14,
                      fontWeight: 700,
                    }}
                  >
                    {page.label}
                  </a>
                ))}
              </div>
            </div>
            {footerLinks.length > 0 && (
              <div>
                <p style={{ color: subColor, fontSize: 11, fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", margin: 0 }}>
                  Footer Links
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 10, marginTop: 14 }}>
                  {footerLinks.map((link) => (
                    <a
                      key={`${link.label}-${link.url}`}
                      href={link.url}
                      style={{
                        color: textColor,
                        textDecoration: "none",
                        fontSize: 14,
                        fontWeight: 700,
                      }}
                    >
                      {link.label}
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </footer>
      )}
    </div>
  );
}
