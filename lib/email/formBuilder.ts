// ---------------------------------------------------------------------------
// Sign-up Form & Pop-up Builder
// ---------------------------------------------------------------------------

export type FormFieldType = "email" | "text" | "phone" | "select" | "hidden";

export type FormField = {
  name: string;
  type: FormFieldType;
  label: string;
  required: boolean;
  placeholder?: string;
  options?: string[];
};

export type FormStyle = {
  brandColor: string;
  bgColor: string;
  textColor: string;
  borderRadius: number;
  position?: "center" | "bottom-right" | "bottom-left" | "top" | "bottom";
};

export type FormConfig = {
  id: string;
  userId: string;
  name: string;
  type: "inline" | "popup" | "bar" | "exit_intent";
  fields: FormField[];
  style: FormStyle;
  successMessage: string;
  redirectUrl?: string;
  tags: string[];
  triggerId?: string;
  settings: {
    showAfterSeconds?: number;
    showOnScroll?: number;
    showOnExit?: boolean;
    frequency: "every_visit" | "once" | "once_per_session";
    pages?: string[];
  };
};

// ---------------------------------------------------------------------------
// Internal: shared HTML helpers
// ---------------------------------------------------------------------------

function buildFieldsHtml(fields: FormField[], formId: string): string {
  return fields
    .map((f) => {
      if (f.type === "hidden") {
        return `<input type="hidden" name="${f.name}" value="" />`;
      }
      if (f.type === "select" && f.options?.length) {
        const opts = f.options.map((o) => `<option value="${o}">${o}</option>`).join("");
        return `<div class="hf-field">
  <label for="hf-${formId}-${f.name}">${f.label}${f.required ? " *" : ""}</label>
  <select id="hf-${formId}-${f.name}" name="${f.name}" ${f.required ? "required" : ""}>
    <option value="">${f.placeholder ?? "Select..."}</option>
    ${opts}
  </select>
</div>`;
      }
      const inputType = f.type === "phone" ? "tel" : f.type === "email" ? "email" : "text";
      return `<div class="hf-field">
  <label for="hf-${formId}-${f.name}">${f.label}${f.required ? " *" : ""}</label>
  <input type="${inputType}" id="hf-${formId}-${f.name}" name="${f.name}" placeholder="${f.placeholder ?? ""}" ${f.required ? "required" : ""} />
</div>`;
    })
    .join("\n");
}

function buildBaseStyles(style: FormStyle): string {
  return `
.hf-form { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: ${style.bgColor}; color: ${style.textColor}; border-radius: ${style.borderRadius}px; padding: 24px; box-sizing: border-box; }
.hf-form * { box-sizing: border-box; }
.hf-field { margin-bottom: 12px; }
.hf-field label { display: block; margin-bottom: 4px; font-size: 13px; font-weight: 600; }
.hf-field input, .hf-field select { width: 100%; padding: 10px 12px; border: 1px solid #ddd; border-radius: ${Math.max(4, style.borderRadius - 4)}px; font-size: 14px; outline: none; }
.hf-field input:focus, .hf-field select:focus { border-color: ${style.brandColor}; box-shadow: 0 0 0 2px ${style.brandColor}33; }
.hf-submit { width: 100%; padding: 12px; background: ${style.brandColor}; color: #fff; border: none; border-radius: ${Math.max(4, style.borderRadius - 4)}px; font-size: 15px; font-weight: 700; cursor: pointer; margin-top: 8px; }
.hf-submit:hover { opacity: 0.9; }
.hf-success { text-align: center; padding: 20px; font-size: 15px; font-weight: 600; }
.hf-error { color: #e53e3e; font-size: 12px; margin-top: 4px; }
`;
}

function buildSubmitScript(formId: string, config: FormConfig): string {
  const endpoint = "/api/email-contacts/form-submit";
  return `
<script>
(function() {
  var form = document.getElementById('hf-${formId}');
  if (!form) return;
  form.addEventListener('submit', function(e) {
    e.preventDefault();
    var data = {};
    var fields = form.querySelectorAll('input, select');
    for (var i = 0; i < fields.length; i++) {
      if (fields[i].name) data[fields[i].name] = fields[i].value;
    }
    data._formId = '${formId}';
    data._tags = ${JSON.stringify(config.tags)};
    ${config.triggerId ? `data._triggerId = '${config.triggerId}';` : ""}

    fetch('${endpoint}', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(function(r) { return r.json(); }).then(function(res) {
      if (res.ok) {
        var wrapper = form.closest('.hf-form') || form.parentNode;
        wrapper.innerHTML = '<div class="hf-success">${config.successMessage.replace(/'/g, "\\'")}</div>';
        ${config.redirectUrl ? `setTimeout(function() { window.location.href = '${config.redirectUrl}'; }, 1500);` : ""}
      } else {
        var errEl = form.querySelector('.hf-error');
        if (!errEl) { errEl = document.createElement('div'); errEl.className = 'hf-error'; form.appendChild(errEl); }
        errEl.textContent = res.error || 'Something went wrong. Please try again.';
      }
    }).catch(function() {
      var errEl = form.querySelector('.hf-error');
      if (!errEl) { errEl = document.createElement('div'); errEl.className = 'hf-error'; form.appendChild(errEl); }
      errEl.textContent = 'Network error. Please try again.';
    });
  });
})();
</script>`;
}

function buildFrequencyCheck(formId: string, frequency: FormConfig["settings"]["frequency"]): string {
  if (frequency === "every_visit") return "";
  const storageKey = `hf_shown_${formId}`;
  if (frequency === "once") {
    return `if (localStorage.getItem('${storageKey}')) return; localStorage.setItem('${storageKey}', '1');`;
  }
  // once_per_session
  return `if (sessionStorage.getItem('${storageKey}')) return; sessionStorage.setItem('${storageKey}', '1');`;
}

function buildPageCheck(pages?: string[]): string {
  if (!pages || pages.length === 0) return "";
  const pagesJson = JSON.stringify(pages);
  return `var allowedPages = ${pagesJson}; var currentPath = window.location.pathname; if (!allowedPages.some(function(p) { return currentPath === p || currentPath.startsWith(p); })) return;`;
}

// ---------------------------------------------------------------------------
// Core Functions
// ---------------------------------------------------------------------------

export function generateFormHtml(config: FormConfig): string {
  const fieldsHtml = buildFieldsHtml(config.fields, config.id);
  const styles = buildBaseStyles(config.style);
  const script = buildSubmitScript(config.id, config);

  return `<!-- Himalaya Form: ${config.name} -->
<style>${styles}</style>
<div class="hf-form">
  <form id="hf-${config.id}">
    ${fieldsHtml}
    <button type="submit" class="hf-submit">Subscribe</button>
  </form>
</div>
${script}`;
}

export function generatePopupHtml(config: FormConfig): string {
  const fieldsHtml = buildFieldsHtml(config.fields, config.id);
  const styles = buildBaseStyles(config.style);
  const script = buildSubmitScript(config.id, config);

  const positionStyles: Record<string, string> = {
    center: "top:50%;left:50%;transform:translate(-50%,-50%);max-width:420px;width:90%;",
    "bottom-right": "bottom:20px;right:20px;max-width:380px;width:90%;",
    "bottom-left": "bottom:20px;left:20px;max-width:380px;width:90%;",
  };

  const pos = config.style.position ?? "center";
  const posStyle = positionStyles[pos] ?? positionStyles.center;
  const frequencyCheck = buildFrequencyCheck(config.id, config.settings.frequency);
  const pageCheck = buildPageCheck(config.settings.pages);

  let triggerLogic = "";
  if (config.settings.showAfterSeconds) {
    triggerLogic = `setTimeout(showPopup, ${config.settings.showAfterSeconds * 1000});`;
  } else if (config.settings.showOnScroll) {
    triggerLogic = `
    var scrollTriggered = false;
    window.addEventListener('scroll', function() {
      if (scrollTriggered) return;
      var scrollPercent = (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100;
      if (scrollPercent >= ${config.settings.showOnScroll}) { scrollTriggered = true; showPopup(); }
    });`;
  } else if (config.type === "exit_intent" || config.settings.showOnExit) {
    triggerLogic = `
    document.addEventListener('mouseout', function(e) {
      if (e.clientY <= 0) showPopup();
    }, { once: true });`;
  } else {
    triggerLogic = "showPopup();";
  }

  return `<!-- Himalaya Popup: ${config.name} -->
<style>
${styles}
.hf-overlay { display:none;position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.5);z-index:99998; }
.hf-popup { display:none;position:fixed;${posStyle}z-index:99999;box-shadow:0 20px 60px rgba(0,0,0,0.3); }
.hf-popup .hf-close { position:absolute;top:8px;right:12px;background:none;border:none;font-size:20px;cursor:pointer;color:${config.style.textColor};opacity:0.6; }
.hf-popup .hf-close:hover { opacity:1; }
</style>
<div class="hf-overlay" id="hf-overlay-${config.id}"></div>
<div class="hf-popup hf-form" id="hf-popup-${config.id}">
  <button class="hf-close" id="hf-close-${config.id}">&times;</button>
  <form id="hf-${config.id}">
    ${fieldsHtml}
    <button type="submit" class="hf-submit">Subscribe</button>
  </form>
</div>
${script}
<script>
(function() {
  ${frequencyCheck}
  ${pageCheck}
  var overlay = document.getElementById('hf-overlay-${config.id}');
  var popup = document.getElementById('hf-popup-${config.id}');
  var closeBtn = document.getElementById('hf-close-${config.id}');

  function showPopup() { overlay.style.display='block'; popup.style.display='block'; }
  function hidePopup() { overlay.style.display='none'; popup.style.display='none'; }

  closeBtn.addEventListener('click', hidePopup);
  overlay.addEventListener('click', hidePopup);

  ${triggerLogic}
})();
</script>`;
}

export function generateBarHtml(config: FormConfig): string {
  const position = config.style.position === "bottom" ? "bottom" : "top";
  const fieldsHtml = config.fields
    .filter((f) => f.type !== "hidden")
    .map((f) => {
      const inputType = f.type === "phone" ? "tel" : f.type === "email" ? "email" : "text";
      return `<input type="${inputType}" name="${f.name}" placeholder="${f.placeholder ?? f.label}" ${f.required ? "required" : ""} style="padding:8px 12px;border:none;border-radius:4px;font-size:14px;margin:0 4px;min-width:200px;" />`;
    })
    .join("");

  const hiddenFields = config.fields
    .filter((f) => f.type === "hidden")
    .map((f) => `<input type="hidden" name="${f.name}" value="" />`)
    .join("");

  const script = buildSubmitScript(config.id, config);
  const frequencyCheck = buildFrequencyCheck(config.id, config.settings.frequency);

  return `<!-- Himalaya Bar: ${config.name} -->
<style>
.hf-bar { display:none;position:fixed;${position}:0;left:0;width:100%;background:${config.style.brandColor};padding:10px 20px;z-index:99999;box-shadow:0 2px 10px rgba(0,0,0,0.15);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif; }
.hf-bar form { display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:8px;max-width:800px;margin:0 auto; }
.hf-bar .hf-bar-text { color:#fff;font-size:14px;font-weight:600;margin-right:8px; }
.hf-bar .hf-bar-submit { padding:8px 20px;background:#fff;color:${config.style.brandColor};border:none;border-radius:4px;font-size:14px;font-weight:700;cursor:pointer; }
.hf-bar .hf-bar-close { position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;color:#fff;font-size:18px;cursor:pointer;opacity:0.7; }
.hf-bar .hf-bar-close:hover { opacity:1; }
.hf-bar .hf-success { color:#fff; }
</style>
<div class="hf-bar hf-form" id="hf-bar-${config.id}">
  <form id="hf-${config.id}" style="display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:8px;">
    <span class="hf-bar-text">${config.name}</span>
    ${hiddenFields}
    ${fieldsHtml}
    <button type="submit" class="hf-bar-submit">Subscribe</button>
  </form>
  <button class="hf-bar-close" id="hf-bar-close-${config.id}">&times;</button>
</div>
${script}
<script>
(function() {
  ${frequencyCheck}
  var bar = document.getElementById('hf-bar-${config.id}');
  var closeBtn = document.getElementById('hf-bar-close-${config.id}');
  bar.style.display = 'block';
  closeBtn.addEventListener('click', function() { bar.style.display = 'none'; });
})();
</script>`;
}

export function getFormEmbedScript(formId: string): string {
  const baseUrl = typeof process !== "undefined" && process.env?.NEXT_PUBLIC_APP_URL
    ? process.env.NEXT_PUBLIC_APP_URL
    : "https://app.himalaya.dev";

  return `<script src="${baseUrl}/api/forms/${formId}/embed.js" async></script>\n<div id="hf-embed-${formId}"></div>`;
}

// ---------------------------------------------------------------------------
// Form Templates
// ---------------------------------------------------------------------------

const DEFAULT_BRAND_COLOR = "#f5a623";

export function getFormTemplate(
  template: "newsletter" | "lead_magnet" | "vip" | "exit_offer" | "quiz",
  overrides?: Partial<FormConfig>
): FormConfig {
  const base: Omit<FormConfig, "fields" | "name" | "type" | "successMessage" | "settings"> = {
    id: overrides?.id ?? `form_${Date.now()}`,
    userId: overrides?.userId ?? "",
    style: overrides?.style ?? {
      brandColor: DEFAULT_BRAND_COLOR,
      bgColor: "#ffffff",
      textColor: "#1a1a1a",
      borderRadius: 12,
      position: "center",
    },
    tags: overrides?.tags ?? [],
    triggerId: overrides?.triggerId,
    redirectUrl: overrides?.redirectUrl,
  };

  const templates: Record<string, FormConfig> = {
    newsletter: {
      ...base,
      name: "Newsletter Signup",
      type: "inline",
      fields: [
        { name: "email", type: "email", label: "Email", required: true, placeholder: "your@email.com" },
      ],
      successMessage: "You're in! Check your inbox for a confirmation.",
      tags: [...base.tags, "newsletter"],
      settings: { frequency: "once" },
    },
    lead_magnet: {
      ...base,
      name: "Get My Free Guide",
      type: "popup",
      fields: [
        { name: "firstName", type: "text", label: "First Name", required: true, placeholder: "Your first name" },
        { name: "email", type: "email", label: "Email", required: true, placeholder: "your@email.com" },
      ],
      successMessage: "Check your email — your free guide is on its way!",
      tags: [...base.tags, "lead-magnet"],
      settings: { showAfterSeconds: 5, frequency: "once" },
    },
    vip: {
      ...base,
      name: "VIP Access",
      type: "popup",
      style: {
        brandColor: "#e53e3e",
        bgColor: "#1a1a1a",
        textColor: "#ffffff",
        borderRadius: 16,
        position: "center",
      },
      fields: [
        { name: "email", type: "email", label: "Email", required: true, placeholder: "your@email.com" },
      ],
      successMessage: "Welcome to the VIP list. Exclusive access unlocked.",
      tags: [...base.tags, "vip"],
      settings: { showAfterSeconds: 10, frequency: "once" },
    },
    exit_offer: {
      ...base,
      name: "Wait — Before You Go",
      type: "exit_intent",
      style: {
        brandColor: DEFAULT_BRAND_COLOR,
        bgColor: "#ffffff",
        textColor: "#1a1a1a",
        borderRadius: 16,
        position: "center",
      },
      fields: [
        { name: "email", type: "email", label: "Email", required: true, placeholder: "your@email.com" },
      ],
      successMessage: "Your discount code is on the way. Check your inbox!",
      tags: [...base.tags, "exit-offer", "discount"],
      settings: { showOnExit: true, frequency: "once" },
    },
    quiz: {
      ...base,
      name: "Take the Quiz",
      type: "popup",
      fields: [
        { name: "firstName", type: "text", label: "First Name", required: true, placeholder: "Your first name" },
        { name: "email", type: "email", label: "Email", required: true, placeholder: "your@email.com" },
      ],
      successMessage: "Let's go! Your personalized results are being generated...",
      tags: [...base.tags, "quiz"],
      settings: { showAfterSeconds: 3, frequency: "once_per_session" },
    },
  };

  const result = templates[template] ?? templates.newsletter;

  // Apply any field-level overrides
  if (overrides) {
    return { ...result, ...overrides, style: { ...result.style, ...overrides.style }, settings: { ...result.settings, ...overrides.settings } } as FormConfig;
  }

  return result;
}

/**
 * Convenience: list all available template names.
 */
export const FORM_TEMPLATES = ["newsletter", "lead_magnet", "vip", "exit_offer", "quiz"] as const;
export type FormTemplateName = (typeof FORM_TEMPLATES)[number];
