// ---------------------------------------------------------------------------
// XP System — Duolingo-style gamification for Simple Mode
//
// Every action earns XP. XP levels up. Levels unlock features.
// This keeps users coming back and executing the daily commands.
// ---------------------------------------------------------------------------

export type XPLevel = {
  level: number;
  name: string;
  minXP: number;
  maxXP: number;
  reward: string;
};

export const LEVELS: XPLevel[] = [
  { level: 1, name: "Starter", minXP: 0, maxXP: 100, reward: "Access to daily commands" },
  { level: 2, name: "Builder", minXP: 100, maxXP: 300, reward: "Unlock ad image generation" },
  { level: 3, name: "Launcher", minXP: 300, maxXP: 600, reward: "Unlock webinar generator" },
  { level: 4, name: "Grower", minXP: 600, maxXP: 1000, reward: "Unlock VSL generator" },
  { level: 5, name: "Earner", minXP: 1000, maxXP: 1500, reward: "Unlock quiz funnel" },
  { level: 6, name: "Scaler", minXP: 1500, maxXP: 2500, reward: "Unlock AI strategic advisor" },
  { level: 7, name: "Expert", minXP: 2500, maxXP: 4000, reward: "Unlock all growth tools" },
  { level: 8, name: "Master", minXP: 4000, maxXP: 6000, reward: "Unlock white-label" },
  { level: 9, name: "Legend", minXP: 6000, maxXP: 10000, reward: "Unlock everything" },
  { level: 10, name: "Himalaya", minXP: 10000, maxXP: Infinity, reward: "You are the mountain" },
];

export const XP_ACTIONS: Record<string, number> = {
  complete_command: 20,
  post_content: 30,
  first_lead: 50,
  first_sale: 100,
  share_site: 15,
  check_analytics: 10,
  follow_up_lead: 25,
  launch_ads: 40,
  complete_all_daily: 50,
  streak_3_days: 30,
  streak_7_days: 75,
  streak_30_days: 200,
  build_business: 100,
  milestone_achieved: 50,
};

export function getLevel(xp: number): XPLevel {
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (xp >= LEVELS[i].minXP) return LEVELS[i];
  }
  return LEVELS[0];
}

export function getNextLevel(xp: number): XPLevel | null {
  const current = getLevel(xp);
  const idx = LEVELS.indexOf(current);
  return idx < LEVELS.length - 1 ? LEVELS[idx + 1] : null;
}

export function getLevelProgress(xp: number): number {
  const level = getLevel(xp);
  const next = getNextLevel(xp);
  if (!next) return 100;
  const range = next.minXP - level.minXP;
  const progress = xp - level.minXP;
  return Math.round((progress / range) * 100);
}
