// ---------------------------------------------------------------------------
// Video Templates — create TikTok/Reel-ready videos from scripts
//
// These generate HTML/CSS animations that can be:
// 1. Previewed in browser
// 2. Screen-recorded for posting
// 3. Exported as embeddable widgets
//
// No external video API needed — pure CSS animations.
// ---------------------------------------------------------------------------

export type VideoTemplate = {
  id: string;
  name: string;
  duration: number; // seconds
  style: "kinetic_text" | "slide_show" | "countdown" | "quote_reveal" | "hook_body_cta";
  aspectRatio: "9:16" | "1:1";
};

export const VIDEO_TEMPLATES: VideoTemplate[] = [
  { id: "kinetic-hook", name: "Kinetic Hook", duration: 15, style: "kinetic_text", aspectRatio: "9:16" },
  { id: "slide-3", name: "3-Slide Story", duration: 15, style: "slide_show", aspectRatio: "9:16" },
  { id: "quote-reveal", name: "Quote Reveal", duration: 10, style: "quote_reveal", aspectRatio: "9:16" },
  { id: "hook-body-cta", name: "Hook → Body → CTA", duration: 20, style: "hook_body_cta", aspectRatio: "9:16" },
  { id: "countdown-offer", name: "Countdown Offer", duration: 12, style: "countdown", aspectRatio: "9:16" },
];

export function generateVideoHtml(input: {
  templateId: string;
  hook: string;
  body: string;
  cta: string;
  brandColor?: string;
  businessName?: string;
}): string {
  const color = input.brandColor ?? "#f5a623";
  const bg = "#0c0a08";

  const template = VIDEO_TEMPLATES.find(t => t.id === input.templateId);
  const style = template?.style ?? "hook_body_cta";
  const duration = template?.duration ?? 15;

  const hookDur = Math.round(duration * 0.25);
  const bodyDur = Math.round(duration * 0.45);
  const ctaDur = duration - hookDur - bodyDur;

  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
* { margin:0; padding:0; box-sizing:border-box; }
body { background:${bg}; color:#fff; font-family:Arial,Helvetica,sans-serif; overflow:hidden; }
.container { width:100vw; height:100vh; display:flex; flex-direction:column; align-items:center; justify-content:center; position:relative; }
.scene { position:absolute; inset:0; display:flex; flex-direction:column; align-items:center; justify-content:center; padding:40px; opacity:0; animation-fill-mode:forwards; }

/* Hook scene */
.scene-hook { animation: fadeSlideUp 0.5s ease forwards; }
@keyframes fadeSlideUp { from { opacity:0; transform:translateY(30px); } to { opacity:1; transform:translateY(0); } }

/* Body scene */
.scene-body { animation: fadeSlideUp 0.5s ${hookDur}s ease forwards; }

/* CTA scene */
.scene-cta { animation: fadeSlideUp 0.5s ${hookDur + bodyDur}s ease forwards; }

.hook-text { font-size:clamp(28px,6vw,48px); font-weight:900; text-align:center; line-height:1.2; max-width:90%; }
.body-text { font-size:clamp(18px,4vw,28px); font-weight:400; text-align:center; line-height:1.6; max-width:85%; color:rgba(255,255,255,0.7); }
.cta-btn { display:inline-flex; padding:16px 40px; border-radius:14px; background:${color}; color:${bg}; font-size:22px; font-weight:800; margin-top:20px; }
.brand { position:absolute; top:20px; left:50%; transform:translateX(-50%); font-size:14px; font-weight:700; color:${color}; letter-spacing:2px; }
.progress { position:absolute; bottom:0; left:0; height:4px; background:${color}; animation: progress ${duration}s linear forwards; }
@keyframes progress { from { width:0; } to { width:100%; } }
.accent-line { width:60px; height:4px; background:${color}; border-radius:2px; margin:16px auto; }

${style === "kinetic_text" ? `
.scene-hook .hook-text span { display:inline-block; opacity:0; animation:wordPop 0.3s ease forwards; }
${input.hook.split(" ").map((_, i) => `.scene-hook .hook-text span:nth-child(${i+1}) { animation-delay:${i*0.15}s; }`).join("\n")}
@keyframes wordPop { from { opacity:0; transform:scale(0.5); } to { opacity:1; transform:scale(1); } }
` : ""}

${style === "quote_reveal" ? `
.quote-mark { font-size:120px; color:${color}; opacity:0.2; position:absolute; top:15%; left:10%; }
` : ""}
</style></head><body>
<div class="container">
  ${input.businessName ? `<div class="brand">${escHtml(input.businessName)}</div>` : ""}

  <!-- Hook -->
  <div class="scene scene-hook">
    ${style === "quote_reveal" ? `<div class="quote-mark">"</div>` : ""}
    <div class="hook-text">
      ${style === "kinetic_text"
        ? input.hook.split(" ").map(w => `<span>${escHtml(w)} </span>`).join("")
        : escHtml(input.hook)
      }
    </div>
    <div class="accent-line"></div>
  </div>

  <!-- Body -->
  <div class="scene scene-body">
    <div class="body-text">${escHtml(input.body)}</div>
  </div>

  <!-- CTA -->
  <div class="scene scene-cta">
    <div class="hook-text" style="font-size:clamp(22px,5vw,36px);margin-bottom:10px;">${escHtml(input.cta)}</div>
    <div class="cta-btn">Link in bio →</div>
  </div>

  <div class="progress"></div>
</div>

<script>
// Auto-transition scenes
const scenes = document.querySelectorAll('.scene');
let current = 0;
const durations = [${hookDur * 1000}, ${bodyDur * 1000}, ${ctaDur * 1000}];
function showScene(i) {
  scenes.forEach((s, idx) => { s.style.opacity = idx === i ? '1' : '0'; });
}
showScene(0);
setTimeout(() => showScene(1), durations[0]);
setTimeout(() => showScene(2), durations[0] + durations[1]);
</script>
</body></html>`;
}

function escHtml(text: string): string {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}
