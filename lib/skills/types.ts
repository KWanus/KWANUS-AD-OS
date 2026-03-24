export type SkillCategory = "website" | "ads" | "email" | "leads";

export type SkillInputField = {
  key: string;
  label: string;
  type: "url" | "text" | "textarea" | "select";
  placeholder?: string;
  required?: boolean;
  options?: string[]; // for select type
  hint?: string;
};

export type SkillMeta = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  icon: string; // emoji
  category: SkillCategory;
  credits: number;
  inputs: SkillInputField[];
  outputs: string[]; // human-readable list of what it creates
};

export type SkillInput = Record<string, string>;

export type SkillCreated = {
  clientId?: string;
  campaignId?: string;
  siteId?: string;
  emailFlowId?: string;
  broadcastId?: string;
};

export type SkillResult = {
  ok: boolean;
  skill: string;
  summary: string;
  created: SkillCreated;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: Record<string, any>;
  error?: string;
};
