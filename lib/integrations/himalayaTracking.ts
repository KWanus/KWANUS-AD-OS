// ---------------------------------------------------------------------------
// Himalaya Internal Tracking — works WITHOUT external pixels
//
// Problem: Users don't have Meta Pixel, Google Analytics, etc. configured.
// Solution: Himalaya tracks everything internally with zero setup.
//
// What it tracks (automatically):
// 1. Page views on published sites
// 2. Form submissions
// 3. Button clicks (CTAs)
// 4. Time on page
// 5. Scroll depth
// 6. Purchases/conversions
//
// This script gets injected into EVERY published site automatically.
// No configuration needed. Data flows into the Himalaya dashboard.
// ---------------------------------------------------------------------------

/** Generate the tracking script to inject into every site */
export function buildHimalayaTrackingScript(siteId: string): string {
  const endpoint = "/api/track";

  return `
<!-- Himalaya Internal Tracking (automatic, no setup required) -->
<script>
(function(){
  var sid = "${siteId}";
  var ep = "${endpoint}";
  var ss = Date.now();
  var md = 0;

  // Track page view
  function tv() {
    fetch(ep, {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({
        type: "pageview",
        siteId: sid,
        url: location.href,
        referrer: document.referrer,
        ua: navigator.userAgent,
        ts: Date.now()
      })
    }).catch(function(){});
  }
  tv();

  // Track scroll depth
  var maxScroll = 0;
  window.addEventListener("scroll", function() {
    var sh = document.documentElement.scrollHeight - window.innerHeight;
    if (sh > 0) {
      var pct = Math.round((window.scrollY / sh) * 100);
      if (pct > maxScroll) maxScroll = pct;
    }
  });

  // Track time on page + scroll on unload
  window.addEventListener("beforeunload", function() {
    var dur = Math.round((Date.now() - ss) / 1000);
    navigator.sendBeacon(ep, JSON.stringify({
      type: "engagement",
      siteId: sid,
      duration: dur,
      scrollDepth: maxScroll,
      url: location.href,
      ts: Date.now()
    }));
  });

  // Track all CTA button clicks
  document.addEventListener("click", function(e) {
    var t = e.target;
    if (t && (t.tagName === "A" || t.tagName === "BUTTON" || t.closest("a") || t.closest("button"))) {
      var el = t.closest("a") || t.closest("button") || t;
      fetch(ep, {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({
          type: "click",
          siteId: sid,
          element: el.textContent ? el.textContent.trim().substring(0, 100) : "button",
          href: el.href || "",
          url: location.href,
          ts: Date.now()
        })
      }).catch(function(){});
    }
  });

  // Track form submissions
  document.addEventListener("submit", function(e) {
    fetch(ep, {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({
        type: "form_submit",
        siteId: sid,
        url: location.href,
        ts: Date.now()
      })
    }).catch(function(){});
  });
})();
</script>`;
}
