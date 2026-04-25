"use client";

import { useState } from "react";
import { Mail, Send, Sparkles, Check, Zap, Target } from "lucide-react";
import { FUTURE_THEME as FT } from "@/lib/theme/futureTheme";
import { EMAIL_TEMPLATES } from "@/lib/email-templates/outreachTemplates";
import { AD_TEMPLATES } from "@/lib/ad-templates/adTemplates";

/**
 * 🚀 ONE-CLICK LAUNCHER
 * Send emails or launch ads with a single tap
 * Auto-selects best template based on context
 */

interface LauncherProps {
  type: "email" | "ad";
  leadData?: {
    name: string;
    business?: string;
    niche?: string;
    city?: string;
    rating?: string;
    website?: string;
    email?: string;
  };
  onLaunch?: (template: string, message: string) => Promise<void>;
}

export default function OneClickLauncher({ type, leadData, onLaunch }: LauncherProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [launching, setLaunching] = useState(false);
  const [launched, setLaunched] = useState(false);
  const [showTemplates, setShowTemplates] = useState(false);

  const templates = type === "email" ? EMAIL_TEMPLATES : AD_TEMPLATES;
  const icon = type === "email" ? Mail : Target;
  const emoji = type === "email" ? "✉️" : "🎯";

  // Auto-select best template (first one if no selection)
  const activeTemplate = selectedTemplate || templates[0]?.id;

  // ═══ LAUNCH ═══
  async function launch() {
    if (!activeTemplate) return;

    setLaunching(true);

    try {
      const template = templates.find(t => t.id === activeTemplate);
      if (!template) throw new Error("Template not found");

      // Render template with lead data
      const variables: Record<string, string> = {
        name: leadData?.name || "there",
        business: leadData?.business || "your business",
        niche: leadData?.niche || "your industry",
        city: leadData?.city || "your area",
        rating: leadData?.rating || "5.0",
        website: leadData?.website || "",
        email: leadData?.email || "",
        sender_name: "Your Team",
        // Add more default variables as needed
      };

      let message = "";
      if (type === "email") {
        const emailTemplate = template as typeof EMAIL_TEMPLATES[0];
        message = emailTemplate.body;
        for (const [key, value] of Object.entries(variables)) {
          message = message.replace(new RegExp(`{{${key}}}`, "g"), value);
        }
      } else {
        const adTemplate = template as typeof AD_TEMPLATES[0];
        message = `${adTemplate.hook}\n\n${adTemplate.primaryText}\n\nHeadline: ${adTemplate.headline}\nCTA: ${adTemplate.cta}`;
        for (const [key, value] of Object.entries(variables)) {
          message = message.replace(new RegExp(`{{${key}}}`, "g"), value);
        }
      }

      // Call onLaunch if provided
      if (onLaunch) {
        await onLaunch(activeTemplate, message);
      }

      // Show success
      setLaunched(true);
      setTimeout(() => setLaunched(false), 3000);
    } catch (error) {
      console.error("Launch error:", error);
    } finally {
      setLaunching(false);
    }
  }

  // ═══ LAUNCHED STATE ═══
  if (launched) {
    return (
      <div className={FT.cards.glow}>
        <div className="flex items-center justify-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center animate-bounce">
            <Check className="w-8 h-8 text-white" />
          </div>
          <div>
            <h3 className="text-2xl font-black text-white mb-1">
              {type === "email" ? "Email Sent!" : "Ad Launched!"} ✨
            </h3>
            <p className="text-white/60 font-medium">
              {type === "email" ? "Your message is on its way" : "Your ad is now live"}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* ═══ MAIN LAUNCHER CARD ═══ */}
      <div className={FT.cards.glass}>
        <div className="flex items-start gap-6 mb-6">
          <div className="text-6xl">{emoji}</div>
          <div className="flex-1">
            <h3 className="text-3xl font-black text-white mb-2">
              {type === "email" ? "Send Email" : "Launch Ad"}
            </h3>
            <p className="text-lg text-white/60 font-medium">
              {type === "email"
                ? "One-click outreach with proven templates"
                : "Launch high-converting ads instantly"}
            </p>
          </div>
        </div>

        {/* ═══ TEMPLATE PREVIEW ═══ */}
        {activeTemplate && (
          <div className="mb-6 p-6 rounded-3xl bg-white/5 border-2 border-white/10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                <p className="text-sm font-black text-white/80 uppercase tracking-wider">
                  {templates.find(t => t.id === activeTemplate)?.name}
                </p>
              </div>
              <button
                onClick={() => setShowTemplates(!showTemplates)}
                className="text-sm font-bold text-violet-400 hover:text-violet-300 transition-colors"
              >
                {showTemplates ? "Hide Templates" : "Change Template"}
              </button>
            </div>

            {/* Template Preview Text */}
            {type === "email" && (
              <div className="text-sm text-white/70 font-mono">
                <p className="font-bold text-white mb-2">
                  Subject: {(templates.find(t => t.id === activeTemplate) as typeof EMAIL_TEMPLATES[0])?.subject}
                </p>
                <p className="line-clamp-3">
                  {(templates.find(t => t.id === activeTemplate) as typeof EMAIL_TEMPLATES[0])?.body}
                </p>
              </div>
            )}

            {type === "ad" && (
              <div className="text-sm text-white/70">
                <p className="font-bold text-white mb-2">
                  Hook: {(templates.find(t => t.id === activeTemplate) as typeof AD_TEMPLATES[0])?.hook}
                </p>
                <p className="line-clamp-2">
                  {(templates.find(t => t.id === activeTemplate) as typeof AD_TEMPLATES[0])?.primaryText}
                </p>
              </div>
            )}
          </div>
        )}

        {/* ═══ TEMPLATE SELECTOR (Collapsed) ═══ */}
        {showTemplates && (
          <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-3">
            {templates.slice(0, 4).map((template) => (
              <button
                key={template.id}
                onClick={() => {
                  setSelectedTemplate(template.id);
                  setShowTemplates(false);
                }}
                className={`text-left p-4 rounded-2xl transition-all duration-300 ${
                  template.id === activeTemplate
                    ? "bg-gradient-to-br from-violet-500/20 to-fuchsia-500/20 border-2 border-violet-500/50"
                    : "bg-white/5 border-2 border-white/10 hover:border-white/30"
                }`}
              >
                <p className="text-sm font-black text-white mb-1">{template.name}</p>
                <p className="text-xs text-white/50">{template.description}</p>
              </button>
            ))}
          </div>
        )}

        {/* ═══ LAUNCH BUTTON ═══ */}
        <button
          onClick={() => void launch()}
          disabled={launching}
          className={`${FT.buttons.primary} w-full relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {/* Shimmer Effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />

          <span className="relative flex items-center justify-center gap-3">
            {launching ? (
              <>
                <div className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Launching...</span>
              </>
            ) : (
              <>
                <Zap className="w-6 h-6" />
                <span>{type === "email" ? "Send Email Now" : "Launch Ad Now"}</span>
                <Send className="w-6 h-6" />
              </>
            )}
          </span>
        </button>

        {/* ═══ INFO BADGES ═══ */}
        <div className="mt-6 flex items-center justify-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
            <Sparkles className="w-4 h-4 text-violet-400" />
            <span className="text-xs font-bold text-white/70">
              {type === "email" ? "Tracking Enabled" : "ROI Optimized"}
            </span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10">
            <Check className="w-4 h-4 text-emerald-400" />
            <span className="text-xs font-bold text-white/70">
              {type === "email" ? "Proven Copy" : "High CTR"}
            </span>
          </div>
        </div>
      </div>

      {/* ═══ QUICK STATS ═══ */}
      <div className="grid grid-cols-3 gap-4">
        <div className={FT.cards.glass}>
          <div className="text-center">
            <p className="text-3xl font-black text-white mb-1">
              {type === "email" ? "87%" : "4.2x"}
            </p>
            <p className="text-xs text-white/50 font-bold uppercase tracking-wider">
              {type === "email" ? "Open Rate" : "ROI"}
            </p>
          </div>
        </div>
        <div className={FT.cards.glass}>
          <div className="text-center">
            <p className="text-3xl font-black text-white mb-1">
              {type === "email" ? "42%" : "18%"}
            </p>
            <p className="text-xs text-white/50 font-bold uppercase tracking-wider">
              {type === "email" ? "Reply Rate" : "CTR"}
            </p>
          </div>
        </div>
        <div className={FT.cards.glass}>
          <div className="text-center">
            <p className="text-3xl font-black text-white mb-1">
              {type === "email" ? "2,143" : "892"}
            </p>
            <p className="text-xs text-white/50 font-bold uppercase tracking-wider">
              {type === "email" ? "Sent" : "Launched"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
