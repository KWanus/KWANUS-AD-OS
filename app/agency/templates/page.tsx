"use client";

import { useState } from "react";
import SimplifiedNav from "@/components/SimplifiedNav";
import { toast } from "sonner";
import {
  Bot,
  Mail,
  Database,
  Share2,
  Target,
  Headphones,
  Loader2,
  Copy,
  Check,
  Download,
  ArrowLeft,
  FileText,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface Template {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  type: string;
}

// ---------------------------------------------------------------------------
// Data
// ---------------------------------------------------------------------------

const TEMPLATES: Template[] = [
  {
    id: "chatbot",
    title: "AI Chatbot Setup",
    description:
      "Full SOW and delivery checklist for deploying a trained AI chatbot on a client website. Covers knowledge base setup, widget integration, and testing.",
    icon: <Bot className="w-6 h-6" />,
    type: "ai_chatbot_setup",
  },
  {
    id: "email",
    title: "Email Automation",
    description:
      "SOW for end-to-end email automation buildout: welcome sequences, nurture flows, re-engagement campaigns, and deliverability setup.",
    icon: <Mail className="w-6 h-6" />,
    type: "email_automation",
  },
  {
    id: "crm",
    title: "CRM Setup & Cleanup",
    description:
      "Scope for CRM implementation or migration. Includes data cleanup, pipeline configuration, tagging strategy, and team training.",
    icon: <Database className="w-6 h-6" />,
    type: "crm_setup",
  },
  {
    id: "social",
    title: "Social Media Automation",
    description:
      "SOW for automated social media management: content calendar, scheduling, AI-generated posts, and engagement monitoring.",
    icon: <Share2 className="w-6 h-6" />,
    type: "social_media_automation",
  },
  {
    id: "leadgen",
    title: "Lead Gen System",
    description:
      "Complete lead generation system buildout: landing pages, ad campaigns, lead magnets, scraping, and qualification workflows.",
    icon: <Target className="w-6 h-6" />,
    type: "lead_gen_system",
  },
  {
    id: "support",
    title: "Customer Support Bot",
    description:
      "SOW for customer support chatbot deployment: FAQ training, ticket routing, escalation logic, and analytics dashboard.",
    icon: <Headphones className="w-6 h-6" />,
    type: "customer_support_bot",
  },
];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function TemplatesPage() {
  const [generating, setGenerating] = useState<string | null>(null);
  const [generatedDoc, setGeneratedDoc] = useState<string | null>(null);
  const [activeTemplate, setActiveTemplate] = useState<Template | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleGenerate(template: Template) {
    setGenerating(template.id);
    setGeneratedDoc(null);
    setActiveTemplate(template);

    try {
      const res = await fetch("/api/himalaya/tools", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tool: "generate_sow",
          input: { templateType: template.type, title: template.title },
        }),
      });

      if (!res.ok) throw new Error("Generation failed");

      const data = await res.json();
      const doc =
        data.result?.document ??
        data.result?.content ??
        data.output ??
        data.result ??
        generateFallbackSOW(template);

      setGeneratedDoc(typeof doc === "string" ? doc : JSON.stringify(doc, null, 2));
    } catch {
      // Fallback: generate a structured SOW locally
      setGeneratedDoc(generateFallbackSOW(template));
    } finally {
      setGenerating(null);
    }
  }

  function generateFallbackSOW(template: Template): string {
    const today = new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    return `
STATEMENT OF WORK
================================================================================
Service: ${template.title}
Date: ${today}
Prepared by: [Your Agency Name]
Prepared for: [Client Name]

────────────────────────────────────────────────────────────────────────────────

1. SCOPE OF WORK

   This engagement covers the full delivery of ${template.title.toLowerCase()} services,
   including discovery, configuration, testing, and launch support.

   Key areas:
   - Discovery & requirements gathering
   - System architecture & configuration
   - Integration with existing tools
   - Quality assurance & testing
   - Launch & go-live support
   - Post-launch monitoring (2 weeks)

────────────────────────────────────────────────────────────────────────────────

2. DELIVERABLES

   [ ] Discovery document & requirements sign-off
   [ ] System configuration & setup
   [ ] Integration with client platforms
   [ ] Testing & QA report
   [ ] Training documentation
   [ ] Go-live deployment
   [ ] Post-launch performance report

────────────────────────────────────────────────────────────────────────────────

3. TIMELINE

   Phase 1 — Discovery & Planning .............. Week 1
   Phase 2 — Build & Configuration ............. Weeks 2–3
   Phase 3 — Testing & Revisions ............... Week 4
   Phase 4 — Launch & Training ................. Week 5
   Phase 5 — Post-Launch Monitoring ............ Weeks 6–7

   Total estimated duration: 7 weeks

────────────────────────────────────────────────────────────────────────────────

4. PRICING

   Setup Fee ......................... $2,500
   Monthly Management ............... $500/mo
   Revisions (post-launch) .......... Included in management fee

   Payment terms: 50% upfront, 50% on go-live.

────────────────────────────────────────────────────────────────────────────────

5. TERMS & CONDITIONS

   - Client provides timely access to platforms, accounts, and assets.
   - Revisions beyond scope will be quoted separately.
   - Confidentiality: all client data is handled per our NDA.
   - Cancellation: 14-day written notice required.
   - This SOW is valid for 30 days from date of issue.

────────────────────────────────────────────────────────────────────────────────

SIGNATURES

Agency: ________________________   Date: ____________

Client: ________________________   Date: ____________
`.trim();
  }

  function handleCopy() {
    if (!generatedDoc) return;
    navigator.clipboard.writeText(generatedDoc);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  }

  function handleDownload() {
    if (!generatedDoc || !activeTemplate) return;
    const blob = new Blob([generatedDoc], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${activeTemplate.title.replace(/\s+/g, "_")}_SOW.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Downloaded");
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <SimplifiedNav />
      <div className="max-w-3xl mx-auto px-4 py-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="w-6 h-6 text-amber-400" />
            Service Templates
          </h1>
          <p className="text-gray-400 mt-1">
            SOWs, checklists, and onboarding docs for each service type
          </p>
        </div>

        {/* Generated Document View */}
        {generatedDoc && activeTemplate ? (
          <div className="mb-8">
            <button
              onClick={() => {
                setGeneratedDoc(null);
                setActiveTemplate(null);
              }}
              className="flex items-center gap-1 text-sm text-gray-400 hover:text-white mb-4 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to templates
            </button>

            <div className="border border-gray-800 rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 bg-gray-900/50 border-b border-gray-800">
                <h2 className="font-semibold text-sm">
                  {activeTemplate.title} — SOW
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs bg-gray-800 hover:bg-gray-700 rounded-lg transition"
                  >
                    {copied ? (
                      <Check className="w-3.5 h-3.5 text-green-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                    {copied ? "Copied" : "Copy"}
                  </button>
                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-1 px-3 py-1.5 text-xs bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 rounded-lg transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Download
                  </button>
                </div>
              </div>
              <pre className="p-4 text-sm text-gray-300 whitespace-pre-wrap font-mono leading-relaxed overflow-auto max-h-[70vh]">
                {generatedDoc}
              </pre>
            </div>
          </div>
        ) : (
          /* Template Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {TEMPLATES.map((t) => (
              <div
                key={t.id}
                className="border border-gray-800 rounded-xl p-5 hover:border-gray-700 transition"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
                    {t.icon}
                  </div>
                  <h3 className="font-semibold">{t.title}</h3>
                </div>
                <p className="text-sm text-gray-400 mb-4 leading-relaxed">
                  {t.description}
                </p>
                <button
                  onClick={() => handleGenerate(t)}
                  disabled={generating === t.id}
                  className="w-full py-2 text-sm font-medium rounded-lg bg-amber-500/20 text-amber-400 hover:bg-amber-500/30 disabled:opacity-50 transition flex items-center justify-center gap-2"
                >
                  {generating === t.id ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    "Generate"
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
