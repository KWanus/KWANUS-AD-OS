export type AnalysisMode = "operator" | "consultant" | "saas";

export type NormalizedInput = {
  url: string;
  mode: AnalysisMode;
  valid: boolean;
  error?: string;
};

export function normalizeInput(rawUrl: string, rawMode: string): NormalizedInput {
  const mode: AnalysisMode =
    rawMode === "consultant" ? "consultant"
    : rawMode === "saas" ? "saas"
    : "operator";

  if (!rawUrl || typeof rawUrl !== "string" || !rawUrl.trim()) {
    return { url: "", mode, valid: false, error: "URL is required." };
  }

  let url = rawUrl.trim();
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    url = "https://" + url;
  }

  try {
    new URL(url);
  } catch {
    return { url, mode, valid: false, error: "Invalid URL format." };
  }

  return { url, mode, valid: true };
}
