// ---------------------------------------------------------------------------
// PDF-style Export — generates rich HTML for PDF conversion
// Used by: proposals, invoices, reports, client deliverables
// Can be opened in browser and printed to PDF (Cmd+P)
// ---------------------------------------------------------------------------

export function generatePrintableHtml(input: {
  title: string;
  subtitle?: string;
  logo?: string;
  sections: { heading: string; content: string }[];
  footer?: string;
  brandColor?: string;
}): string {
  const color = input.brandColor ?? "#06b6d4";

  const sectionHtml = input.sections.map((s) => `
    <div style="margin-bottom:32px;">
      <h2 style="font-size:18px;font-weight:800;color:#0f172a;margin:0 0 12px;padding-bottom:8px;border-bottom:2px solid ${color}20;">${s.heading}</h2>
      <div style="font-size:14px;line-height:1.8;color:#475569;">${s.content.replace(/\n/g, "<br>")}</div>
    </div>
  `).join("");

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width">
<title>${input.title}</title>
<style>
  @media print {
    body { margin: 0; padding: 0; }
    .no-print { display: none; }
  }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 40px; background: #fff; color: #0f172a; }
  .container { max-width: 800px; margin: 0 auto; }
</style>
</head>
<body>
<div class="container">
  <!-- Header -->
  <div style="margin-bottom:40px;padding-bottom:20px;border-bottom:3px solid ${color};">
    <h1 style="font-size:28px;font-weight:900;margin:0;color:#0f172a;">${input.title}</h1>
    ${input.subtitle ? `<p style="font-size:14px;color:#64748b;margin:8px 0 0;">${input.subtitle}</p>` : ""}
  </div>

  <!-- Sections -->
  ${sectionHtml}

  <!-- Footer -->
  ${input.footer ? `<div style="margin-top:48px;padding-top:16px;border-top:1px solid #e2e8f0;font-size:11px;color:#94a3b8;text-align:center;">${input.footer}</div>` : ""}

  <!-- Print button -->
  <div class="no-print" style="margin-top:32px;text-align:center;">
    <button onclick="window.print()" style="padding:12px 32px;background:${color};color:#fff;border:none;border-radius:8px;font-weight:700;cursor:pointer;font-size:14px;">
      Print / Save as PDF
    </button>
  </div>
</div>
</body>
</html>`;
}
