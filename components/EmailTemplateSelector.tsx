"use client";

import { useState, useEffect } from "react";
import { FileText, Loader2, Check, Sparkles } from "lucide-react";

interface EmailTemplate {
  id: string;
  name: string;
  category: string;
  subject: string;
  body: string;
  description: string;
  variables: string[];
}

interface Props {
  onSelect: (subject: string, body: string) => void;
  leadData?: {
    name?: string;
    business?: string;
    niche?: string;
    city?: string;
    rating?: number;
    email?: string;
  };
  senderName?: string;
}

export default function EmailTemplateSelector({ onSelect, leadData, senderName }: Props) {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>("cold_outreach");
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);

  useEffect(() => {
    void fetchTemplates();
  }, []);

  async function fetchTemplates() {
    try {
      const res = await fetch("/api/email-templates");
      const data = await res.json() as { ok: boolean; templates?: EmailTemplate[] };
      if (data.ok && data.templates) {
        setTemplates(data.templates);
      }
    } catch (err) {
      console.error("Failed to fetch templates:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSelectTemplate(templateId: string) {
    setSelectedTemplate(templateId);

    // Build variables from lead data
    const variables: Record<string, string> = {
      name: leadData?.name || "there",
      business: leadData?.business || "your business",
      niche: leadData?.niche || "your industry",
      city: leadData?.city || "your area",
      rating: leadData?.rating?.toString() || "5",
      sender_name: senderName || "Your Name",
      original_subject: "our previous conversation",
      service: "Lead Generation System",
      deliverable_1: "Automated lead generation system",
      deliverable_2: "30 qualified leads per month",
      deliverable_3: "Complete setup and training",
      timeline: "2 weeks",
      price: "2,500",
      roi: "50,000",
      project: "your project",
      weeks: "2",
    };

    try {
      const res = await fetch("/api/email-templates", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ templateId, variables }),
      });

      const data = await res.json() as { ok: boolean; subject?: string; body?: string };
      if (data.ok && data.subject && data.body) {
        onSelect(data.subject, data.body);
      }
    } catch (err) {
      console.error("Failed to generate email:", err);
    }
  }

  const categories = [
    { id: "cold_outreach", label: "Cold Outreach", icon: FileText },
    { id: "followup", label: "Follow-up", icon: Sparkles },
    { id: "proposal", label: "Proposal", icon: Check },
    { id: "check_in", label: "Check-in", icon: Check },
  ];

  const filteredTemplates = templates.filter(
    (t) => t.category === selectedCategory
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <Loader2 className="w-5 h-5 animate-spin text-white/40" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold whitespace-nowrap transition ${
              selectedCategory === cat.id
                ? "bg-[#f5a623]/10 border border-[#f5a623]/20 text-[#f5a623]"
                : "bg-white/[0.02] border border-white/[0.07] text-white/60 hover:text-white"
            }`}
          >
            <cat.icon className="w-3.5 h-3.5" />
            {cat.label}
          </button>
        ))}
      </div>

      {/* Templates */}
      <div className="space-y-2">
        {filteredTemplates.length === 0 ? (
          <p className="text-sm text-white/40 text-center py-6">
            No templates in this category
          </p>
        ) : (
          filteredTemplates.map((template) => (
            <button
              key={template.id}
              onClick={() => void handleSelectTemplate(template.id)}
              className={`w-full text-left p-4 rounded-xl border transition ${
                selectedTemplate === template.id
                  ? "border-[#f5a623]/50 bg-[#f5a623]/[0.05]"
                  : "border-white/[0.07] bg-white/[0.02] hover:border-white/[0.14]"
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="text-sm font-bold text-white">{template.name}</h3>
                {selectedTemplate === template.id && (
                  <Check className="w-4 h-4 text-[#f5a623] shrink-0" />
                )}
              </div>
              <p className="text-xs text-white/40 mb-2">{template.description}</p>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-white/30">
                  Subject:
                </span>
                <span className="text-[10px] text-white/50">
                  {template.subject.substring(0, 50)}
                  {template.subject.length > 50 ? "..." : ""}
                </span>
              </div>
            </button>
          ))
        )}
      </div>

      <p className="text-[10px] text-white/30 text-center">
        Templates auto-populate with lead data. Edit before sending.
      </p>
    </div>
  );
}
