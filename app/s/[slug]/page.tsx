import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import BlockRenderer, { Block } from "@/components/site-builder/BlockRenderer";
import PublicSiteShell from "@/components/site-builder/PublicSiteShell";
import { Metadata } from "next";
import Script from "next/script";

type PublicProduct = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  compareAt: number | null;
  images: string[];
  slug: string;
};

export const revalidate = 10; // ISR for blazing fast loads

function getPublicSiteUrl(site: { slug: string; customDomain?: string | null }) {
  if (site.customDomain?.trim()) {
    const normalized = site.customDomain.trim().replace(/^https?:\/\//, "");
    return `https://${normalized}`;
  }
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://himalaya.app";
  return `${appUrl}/s/${site.slug}`;
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  let site = null;
  try {
    site = await prisma.site.findUnique({
      where: { slug },
      include: { pages: { where: { published: true }, orderBy: { order: "asc" } } },
    });
  } catch {
    return { title: "Not Found" };
  }

  if (!site || site.pages.length === 0) return { title: "Not Found" };

  const home = site.pages.find((page) => page.slug === "home");
  if (!home) return { title: "Not Found" };
  const title = home.seoTitle || site.name;
  const description = home.seoDesc || site.description || "";
  const publicUrl = getPublicSiteUrl(site);

  return {
    title,
    description,
    icons: {
      icon: `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><text y=".9em" font-size="90">${site.faviconEmoji || "🚀"}</text></svg>`,
    },
    openGraph: {
      title,
      description,
      url: publicUrl,
      siteName: site.name,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    alternates: {
      canonical: publicUrl,
    },
  };
}

export default async function PublicSitePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let site = null;
  try {
    site = await prisma.site.findUnique({
      where: { slug },
      include: {
        pages: { where: { published: true }, orderBy: { order: "asc" } },
        products: { where: { status: "active" } },
        user: {
          select: {
            metaPixelId: true,
            googleAnalyticsId: true,
            tiktokPixelId: true,
            googleAdsId: true,
          },
        },
      },
    });
  } catch {
    notFound();
  }

  if (!site || !site.published || site.pages.length === 0) notFound();

  const page = site.pages.find((entry) => entry.slug === "home");
  if (!page) notFound();
  const theme = (site.theme as { primaryColor?: string; font?: string; mode?: "dark" | "light" }) || {};
  // Inject siteId into form/payment blocks for lead capture
  const rawBlocks = (page.blocks as unknown as Block[]) || [];
  const blocks = rawBlocks.map((block) => {
    if ((block.type === "form" || block.type === "payment") && block.props && !block.props.siteId) {
      return { ...block, props: { ...block.props, siteId: site.id, submitUrl: "/api/forms/submit" } };
    }
    return block;
  });
  const products = (site.products as unknown as PublicProduct[]) || [];
  const pixels = site.user;

  // Track view async (fire-and-forget)
  prisma.site.update({ where: { id: site.id }, data: { totalViews: { increment: 1 } } }).catch(() => {});
  prisma.sitePage.update({ where: { id: page.id }, data: { views: { increment: 1 } } }).catch(() => {});

  const bodyBg = theme.mode === "dark" ? "#020509" : "#f8fafc";
  const bodyColor = theme.mode === "dark" ? "#ffffff" : "#0f172a";
  const fontFamily = theme.font === "inter" ? "Inter, sans-serif" : "inherit";

  return (
    <>
      {/* ── Global styles ── */}
      <style>{`body{margin:0;padding:0;font-family:${fontFamily};background-color:${bodyBg};color:${bodyColor}}`}</style>

      {/* ── Cookie consent banner (GDPR/CCPA) ── */}
      <Script id="cookie-consent-banner" strategy="lazyOnload">{`
        if(!localStorage.getItem('cookie_consent_${site.id}')){
          var d=document.createElement('div');d.id='cookie-consent';
          d.style.cssText='position:fixed;bottom:0;left:0;right:0;background:#0c0a08;border-top:1px solid rgba(245,166,35,0.15);color:#f5f0e8;padding:12px 20px;font-size:12px;z-index:9998;display:flex;align-items:center;justify-content:space-between;gap:12px';
          d.innerHTML='<p style="margin:0;flex:1;opacity:0.6">We use cookies for analytics and to improve your experience.</p><div style="display:flex;gap:6px"><button onclick="this.parentElement.parentElement.remove();localStorage.setItem(\\'cookie_consent_${site.id}\\',\\'accepted\\')" style="background:#f5a623;color:#0c0a08;border:none;padding:6px 16px;border-radius:8px;font-size:11px;font-weight:bold;cursor:pointer">Accept</button><button onclick="this.parentElement.parentElement.remove();localStorage.setItem(\\'cookie_consent_${site.id}\\',\\'declined\\')" style="background:transparent;color:#999;border:1px solid #333;padding:6px 16px;border-radius:8px;font-size:11px;cursor:pointer">Decline</button></div>';
          document.body.appendChild(d);
        }
      `}</Script>

      {/* ── Meta (Facebook/Instagram) Pixel ── */}
      {pixels?.metaPixelId && (
        <>
          <Script id="meta-pixel" strategy="afterInteractive">{`
            !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${pixels.metaPixelId}');
            fbq('track', 'PageView');
          `}</Script>
          <noscript><img height="1" width="1" style={{ display: "none" }} src={`https://www.facebook.com/tr?id=${pixels.metaPixelId}&ev=PageView&noscript=1`} alt="" /></noscript>
        </>
      )}

      {/* ── Google Analytics (GA4) ── */}
      {pixels?.googleAnalyticsId && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${pixels.googleAnalyticsId}`} strategy="afterInteractive" />
          <Script id="google-analytics" strategy="afterInteractive">{`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${pixels.googleAnalyticsId}');
            ${pixels.googleAdsId ? `gtag('config', '${pixels.googleAdsId}');` : ""}
          `}</Script>
        </>
      )}

      {/* ── TikTok Pixel ── */}
      {pixels?.tiktokPixelId && (
        <Script id="tiktok-pixel" strategy="afterInteractive">{`
          !function (w, d, t) {
            w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"];ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{};ttq._i[e]=[];ttq._i[e]._u=i;ttq._t=ttq._t||{};ttq._t[e]=+new Date;ttq._o=ttq._o||{};ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript";o.async=!0;o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
            ttq.load('${pixels.tiktokPixelId}');
            ttq.page();
          }(window, document, 'ttq');
        `}</Script>
      )}

      {/* ── Site content ── */}
      <PublicSiteShell
        siteName={site.name}
        siteSlug={site.slug}
        customDomain={site.customDomain}
        currentPageSlug="home"
        faviconEmoji={site.faviconEmoji}
        theme={theme}
        pages={site.pages.map((entry) => ({ id: entry.id, title: entry.title, slug: entry.slug }))}
      >
        <div className="flex-1">
          {blocks.length === 0 ? (
            <div className="flex items-center justify-center min-h-[50vh] text-center px-4">
              <h1 className="text-2xl font-black opacity-30">This site has no content yet.</h1>
            </div>
          ) : (
            blocks.map((block) => (
              <BlockRenderer key={block.id} block={block} theme={theme} preview={false} products={products} siteId={site.id} />
            ))
          )}
        </div>
      </PublicSiteShell>

      {/* ── Chat Widget ── */}
      <Script id="himalaya-chat-widget" strategy="lazyOnload">{`
        (function(){
          var siteId='${site.id}';
          var vid=localStorage.getItem('h_visitor')||(function(){var id=Math.random().toString(36).slice(2,10);localStorage.setItem('h_visitor',id);return id})();
          var o=false;var r=document.createElement('div');r.id='himalaya-chat';r.style.cssText='position:fixed;bottom:20px;right:20px;z-index:9999;font-family:system-ui,sans-serif';document.body.appendChild(r);
          function render(){r.innerHTML=o?'<div style="width:340px;height:420px;background:#fff;border-radius:16px;box-shadow:0 8px 32px rgba(0,0,0,0.15);display:flex;flex-direction:column;overflow:hidden"><div style="background:linear-gradient(135deg,#f5a623,#e07850);padding:14px 16px;color:#fff;display:flex;justify-content:space-between;align-items:center"><div><strong style="font-size:13px">Chat with us</strong><br><span style="font-size:10px;opacity:0.8">We usually reply fast</span></div><button onclick="window._hcT()" style="background:none;border:none;color:#fff;font-size:18px;cursor:pointer">×</button></div><div id="hc-m" style="flex:1;padding:12px;overflow-y:auto;font-size:13px;color:#333"></div><form id="hc-f" onsubmit="return window._hcS(event)" style="padding:8px 12px;border-top:1px solid #eee;display:flex;gap:6px"><input name="msg" placeholder="Type a message..." style="flex:1;border:1px solid #ddd;border-radius:8px;padding:8px;font-size:12px;outline:none" required><button style="background:#f5a623;color:#fff;border:none;border-radius:8px;padding:8px 14px;font-size:11px;font-weight:bold;cursor:pointer">Send</button></form></div>':'<button onclick="window._hcT()" style="width:52px;height:52px;border-radius:50%;background:linear-gradient(135deg,#f5a623,#e07850);border:none;cursor:pointer;box-shadow:0 4px 16px rgba(245,166,35,0.3);display:flex;align-items:center;justify-content:center"><svg width="22" height="22" fill="none" stroke="#fff" stroke-width="2" viewBox="0 0 24 24"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg></button>'}
          window._hcT=function(){o=!o;render()};
          window._hcS=function(e){e.preventDefault();var i=document.querySelector('#hc-f input[name=msg]');if(!i||!i.value.trim())return false;var m=document.getElementById('hc-m');if(m)m.innerHTML+='<div style="background:#f5a623;color:#fff;padding:6px 10px;border-radius:10px;margin:3px 0;max-width:80%;margin-left:auto;font-size:12px">'+i.value+'</div>';fetch('/api/chat/message',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({siteId:siteId,visitorId:vid,message:i.value})}).catch(function(){});i.value='';if(m)m.scrollTop=m.scrollHeight;return false};
          render();
        })();
      `}</Script>
      {/* ── Predictive Intent Tracking ── */}
      <Script id="himalaya-intent-tracking" strategy="lazyOnload">{`
        (function(){
          var siteId='${site.id}';
          var vid=localStorage.getItem('h_visitor')||(function(){var id=Math.random().toString(36).slice(2,10);localStorage.setItem('h_visitor',id);return id})();
          var tracked={};
          function signal(type,meta){
            if(tracked[type+JSON.stringify(meta||{})])return;
            tracked[type+JSON.stringify(meta||{})]=1;
            fetch('/api/intent/signal',{method:'POST',headers:{'Content-Type':'application/json'},
              body:JSON.stringify({siteId:siteId,visitorId:vid,eventType:type,metadata:meta||{}})
            }).catch(function(){});
          }
          signal('page_view',{path:location.pathname});
          var lv=localStorage.getItem('h_lv_'+siteId);
          if(lv&&Date.now()-parseInt(lv)>3600000)signal('return_visit');
          localStorage.setItem('h_lv_'+siteId,Date.now().toString());
          if(location.pathname.includes('pric')||location.hash.includes('pric')||document.querySelector('[class*=pricing],[id*=pricing]'))signal('pricing_view');
          setTimeout(function(){signal('high_engagement',{duration:60})},60000);
          document.addEventListener('focus',function(e){if(e.target&&(e.target.tagName==='INPUT'||e.target.tagName==='TEXTAREA'))signal('form_start',{field:e.target.name||e.target.type});},true);
        })();
      `}</Script>
      {/* ── Comprehensive Analytics Tracking ── */}
      <Script id="himalaya-analytics" strategy="afterInteractive">{`
        (function(){
          var SITE_ID='${site.id}';
          var ENDPOINT='/api/analytics/track';
          var vid=localStorage.getItem('_hv_id');
          if(!vid){vid=crypto.randomUUID?crypto.randomUUID():(Math.random().toString(36).slice(2)+Math.random().toString(36).slice(2));localStorage.setItem('_hv_id',vid)}

          function getUTM(){
            var p=new URLSearchParams(location.search);
            var u={};
            ['utm_source','utm_medium','utm_campaign','utm_term','utm_content'].forEach(function(k){var v=p.get(k);if(v)u[k]=v});
            return u;
          }
          var utm=getUTM();

          function track(event,props){
            var payload=JSON.stringify({siteId:SITE_ID,visitorId:vid,event:event,properties:Object.assign({},props||{},utm,{url:location.href,timestamp:Date.now()})});
            try{navigator.sendBeacon(ENDPOINT,new Blob([payload],{type:'application/json'}))}catch(e){fetch(ENDPOINT,{method:'POST',headers:{'Content-Type':'application/json'},body:payload,keepalive:true}).catch(function(){})}
          }

          // 1. Page view
          track('page_view',{path:location.pathname,referrer:document.referrer,title:document.title});

          // 2. Scroll depth
          var scrollMarkers={25:false,50:false,75:false,100:false};
          function checkScroll(){
            var h=Math.max(document.body.scrollHeight,document.documentElement.scrollHeight)-window.innerHeight;
            if(h<=0)return;
            var pct=Math.round((window.scrollY/h)*100);
            [25,50,75,100].forEach(function(m){if(pct>=m&&!scrollMarkers[m]){scrollMarkers[m]=true;track('scroll_depth',{depth:m})}});
          }
          window.addEventListener('scroll',checkScroll,{passive:true});

          // 3. CTA clicks
          document.addEventListener('click',function(e){
            var el=e.target;while(el&&el!==document){
              if(el.hasAttribute&&el.hasAttribute('data-cta')||(el.className&&typeof el.className==='string'&&el.className.indexOf('cta')!==-1)){
                track('cta_click',{text:(el.textContent||'').trim().slice(0,100),tag:el.tagName,href:el.href||''});return;
              }
              // 5. Checkout clicks
              if(el.tagName==='A'&&el.href){
                var lh=el.href.toLowerCase();
                if(lh.indexOf('checkout')!==-1||lh.indexOf('buy')!==-1||lh.indexOf('stripe')!==-1){
                  track('checkout_click',{href:el.href,text:(el.textContent||'').trim().slice(0,100)});return;
                }
                // 7. Outbound clicks
                if(el.hostname&&el.hostname!==location.hostname){
                  track('outbound_click',{href:el.href,text:(el.textContent||'').trim().slice(0,100)});return;
                }
              }
              el=el.parentElement;
            }
          },true);

          // 4. Form interactions
          var formStarted={};
          document.addEventListener('focus',function(e){
            var t=e.target;
            if(t&&(t.tagName==='INPUT'||t.tagName==='TEXTAREA'||t.tagName==='SELECT')){
              var f=t.closest('form');var fk=f?f.id||f.action||'form':'field';
              if(!formStarted[fk]){formStarted[fk]=true;track('form_start',{form:fk,field:t.name||t.type})}
            }
          },true);
          document.addEventListener('submit',function(e){
            if(e.target&&e.target.tagName==='FORM'){
              track('form_submit',{form:e.target.id||e.target.action||'form'});
            }
          },true);

          // 6. Time on page
          var timeMarkers=[30,60,120,300];
          timeMarkers.forEach(function(s){
            setTimeout(function(){track('time_on_page',{seconds:s})},s*1000);
          });

          // 8. Video plays
          document.addEventListener('play',function(e){
            if(e.target&&e.target.tagName==='VIDEO'){
              track('video_play',{src:(e.target.currentSrc||e.target.src||'').slice(0,200),duration:e.target.duration||0});
            }
          },true);

          // Page unload — send final time
          window.addEventListener('visibilitychange',function(){
            if(document.visibilityState==='hidden'){
              var elapsed=Math.round((Date.now()-performance.timing.navigationStart)/1000);
              var payload=JSON.stringify({siteId:SITE_ID,visitorId:vid,event:'page_leave',properties:Object.assign({},{path:location.pathname,timeSpent:elapsed},utm)});
              navigator.sendBeacon(ENDPOINT,new Blob([payload],{type:'application/json'}));
            }
          });
        })();
      `}</Script>
    </>
  );
}
