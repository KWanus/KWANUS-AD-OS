export type QuickActionPriority = "critical" | "high" | "medium" | "low";
export type QuickActionCategory = "client" | "campaign" | "scan" | "email" | "site" | "setup" | "system";

export interface QuickAction {
  id: string;
  priority: QuickActionPriority;
  category: QuickActionCategory;
  title: string;
  description: string;
  href: string;
  cta: string;
  executionTier?: "core" | "elite";
}

export function priorityTone(priority: QuickActionPriority): string {
  switch (priority) {
    case "critical":
      return "border-red-500/20 bg-red-500/10 text-red-200";
    case "high":
      return "border-amber-500/20 bg-amber-500/10 text-amber-200";
    case "medium":
      return "border-[#f5a623]/20 bg-[#f5a623]/10 text-[#f5a623]";
    default:
      return "border-white/[0.08] bg-white/[0.05] text-white/45";
  }
}

export function categoryLabel(category: QuickActionCategory): string {
  return category.replace(/_/g, " ");
}
