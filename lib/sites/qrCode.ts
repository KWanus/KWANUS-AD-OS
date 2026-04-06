// ---------------------------------------------------------------------------
// QR Code Generator — generates QR codes for site URLs
// Uses a public API (no package needed)
// ---------------------------------------------------------------------------

/** Generate a QR code data URL for a given URL */
export function getQRCodeUrl(siteUrl: string, size: number = 300): string {
  const encoded = encodeURIComponent(siteUrl);
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encoded}&format=png&margin=10`;
}

/** Generate a QR code with branding */
export function getQRCodeWithBranding(siteUrl: string): {
  qrUrl: string;
  printHtml: string;
} {
  const qrUrl = getQRCodeUrl(siteUrl, 400);

  const printHtml = `
    <div style="text-align:center;padding:40px;font-family:system-ui,sans-serif;">
      <img src="${qrUrl}" alt="QR Code" style="width:300px;height:300px;margin:0 auto 20px;" />
      <p style="font-size:14px;color:#666;margin:8px 0;">${siteUrl}</p>
      <p style="font-size:11px;color:#999;">Scan to visit</p>
    </div>
  `;

  return { qrUrl, printHtml };
}
