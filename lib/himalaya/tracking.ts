// ---------------------------------------------------------------------------
// Himalaya Funnel Tracking — client-side
// Fire-and-forget. Never blocks UI. Never fails the user.
// ---------------------------------------------------------------------------

let sessionId: string | null = null;

function getSessionId(): string {
  if (sessionId) return sessionId;
  if (typeof window !== "undefined") {
    sessionId = sessionStorage.getItem("h_session") ?? crypto.randomUUID();
    sessionStorage.setItem("h_session", sessionId);
  }
  return sessionId ?? "unknown";
}

export function trackEvent(event: string, metadata?: Record<string, unknown>): void {
  if (typeof window === "undefined") return;

  const controller = new AbortController();
  setTimeout(() => controller.abort(), 2000);

  fetch("/api/himalaya/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event, sessionId: getSessionId(), metadata }),
    signal: controller.signal,
  }).catch(() => {
    // never fail
  });
}

// Convenience functions
export const track = {
  pageView: (page: string) => trackEvent("page_view", { page }),
  runStart: (mode: string, path?: string) => trackEvent("run_start", { mode, path }),
  runComplete: (runId: string, mode: string) => trackEvent("run_complete", { runId, mode }),
  resultsView: (runId: string) => trackEvent("results_view", { runId }),
  upgradeClick: (from: string) => trackEvent("upgrade_click", { from }),
  purchase: (tier: string) => trackEvent("purchase", { tier }),
  deploy: (runId: string, targets: string[]) => trackEvent("deploy", { runId, targets }),
  executeStart: (runId: string) => trackEvent("execute_start", { runId }),
  executeComplete: (runId: string) => trackEvent("execute_complete", { runId }),
  outcomeSubmit: (runId: string, result: string) => trackEvent("outcome_submit", { runId, result }),
};
