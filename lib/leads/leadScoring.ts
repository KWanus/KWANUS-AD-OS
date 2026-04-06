// ---------------------------------------------------------------------------
// Lead Scoring Engine — auto-scores leads based on behavior signals
// Runs on form submission, email opens, page views, purchases
// ---------------------------------------------------------------------------

export type LeadSignal = {
  type: "form_submit" | "email_open" | "email_click" | "page_view" | "purchase" | "return_visit";
  weight: number;
};

const SIGNAL_WEIGHTS: Record<string, number> = {
  form_submit: 30,     // Filled out a form — high intent
  purchase: 50,        // Bought something — highest intent
  email_click: 15,     // Clicked a link in email — engaged
  email_open: 5,       // Opened email — some interest
  page_view: 2,        // Viewed a page — passive
  return_visit: 10,    // Came back — increasing intent
  has_phone: 10,       // Provided phone — serious
  has_message: 5,      // Wrote a message — engaged
};

export type LeadScore = {
  score: number;       // 0-100
  grade: "hot" | "warm" | "cold";
  signals: string[];
};

export function scoreLeadFromSubmission(input: {
  hasPhone: boolean;
  hasMessage: boolean;
  hasEmail: boolean;
  enrolledInFlow: boolean;
}): LeadScore {
  let score = 0;
  const signals: string[] = [];

  // Form submission itself
  score += SIGNAL_WEIGHTS.form_submit;
  signals.push("Submitted contact form");

  if (input.hasPhone) {
    score += SIGNAL_WEIGHTS.has_phone;
    signals.push("Provided phone number");
  }

  if (input.hasMessage) {
    score += SIGNAL_WEIGHTS.has_message;
    signals.push("Wrote a message");
  }

  if (input.enrolledInFlow) {
    score += 5;
    signals.push("Enrolled in email flow");
  }

  // Cap at 100
  score = Math.min(100, score);

  const grade = score >= 60 ? "hot" : score >= 30 ? "warm" : "cold";

  return { score, grade, signals };
}

export function scoreFromEmailEngagement(input: {
  currentScore: number;
  event: "open" | "click";
}): number {
  const addition = input.event === "click" ? SIGNAL_WEIGHTS.email_click : SIGNAL_WEIGHTS.email_open;
  return Math.min(100, input.currentScore + addition);
}

export function scoreFromPurchase(currentScore: number): number {
  return Math.min(100, currentScore + SIGNAL_WEIGHTS.purchase);
}

export function getGrade(score: number): "hot" | "warm" | "cold" {
  return score >= 60 ? "hot" : score >= 30 ? "warm" : "cold";
}
