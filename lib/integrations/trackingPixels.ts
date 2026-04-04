// ---------------------------------------------------------------------------
// Tracking Pixels — Meta Pixel + Google Tag auto-injection for generated sites
// ---------------------------------------------------------------------------

export type TrackingConfig = {
  metaPixelId?: string | null;
  googleAnalyticsId?: string | null;
  tiktokPixelId?: string | null;
};

/** Generate the tracking script HTML to inject into site pages */
export function buildTrackingScript(config: TrackingConfig): string {
  const scripts: string[] = [];

  // Meta Pixel
  if (config.metaPixelId) {
    scripts.push(`
<!-- Meta Pixel -->
<script>
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${config.metaPixelId}');
fbq('track', 'PageView');
</script>
<noscript><img height="1" width="1" style="display:none"
src="https://www.facebook.com/tr?id=${config.metaPixelId}&ev=PageView&noscript=1"/></noscript>
<!-- End Meta Pixel -->`);
  }

  // Google Analytics / Google Tag
  if (config.googleAnalyticsId) {
    scripts.push(`
<!-- Google Tag -->
<script async src="https://www.googletagmanager.com/gtag/js?id=${config.googleAnalyticsId}"></script>
<script>
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${config.googleAnalyticsId}');
</script>
<!-- End Google Tag -->`);
  }

  // TikTok Pixel
  if (config.tiktokPixelId) {
    scripts.push(`
<!-- TikTok Pixel -->
<script>
!function (w, d, t) {
w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
ttq.load('${config.tiktokPixelId}');
ttq.page();
}(window, document, 'ttq');
</script>
<!-- End TikTok Pixel -->`);
  }

  return scripts.join("\n");
}

/** Build conversion event tracking code for specific actions */
export function buildConversionEvent(
  config: TrackingConfig,
  event: "Purchase" | "Lead" | "AddToCart" | "CompleteRegistration" | "Contact" | "Subscribe",
  value?: number,
  currency?: string
): string {
  const scripts: string[] = [];

  if (config.metaPixelId) {
    const params = value ? `, {value: ${value}, currency: '${currency ?? "USD"}'}` : "";
    scripts.push(`fbq('track', '${event}'${params});`);
  }

  if (config.googleAnalyticsId) {
    const gaEvent = event === "Purchase" ? "purchase" : event === "Lead" ? "generate_lead" : event === "Subscribe" ? "sign_up" : event.toLowerCase();
    const params = value ? `, { value: ${value}, currency: '${currency ?? "USD"}' }` : "";
    scripts.push(`gtag('event', '${gaEvent}'${params});`);
  }

  if (config.tiktokPixelId) {
    const ttEvent = event === "Purchase" ? "CompletePayment" : event === "Lead" ? "SubmitForm" : event;
    const params = value ? `, { value: ${value}, currency: '${currency ?? "USD"}' }` : "";
    scripts.push(`ttq.track('${ttEvent}'${params});`);
  }

  return scripts.join("\n");
}

/** Build a tracking-enabled form submission handler */
export function buildFormTrackingScript(config: TrackingConfig): string {
  return `
<script>
document.addEventListener('submit', function(e) {
  var form = e.target;
  if (form.tagName === 'FORM') {
    ${buildConversionEvent(config, "Lead")}
  }
});
</script>`;
}

/** Check if user has any tracking configured */
export function hasTracking(config: TrackingConfig): boolean {
  return !!(config.metaPixelId || config.googleAnalyticsId || config.tiktokPixelId);
}
