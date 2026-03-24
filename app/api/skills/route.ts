/**
 * GET /api/skills
 * Returns the full skills registry — all available skills with their metadata.
 * Used by the Skills Hub UI to render skill cards and input forms.
 */

import { NextResponse } from "next/server";
import { SKILLS, SKILL_CATEGORIES } from "@/lib/skills/registry";

export async function GET() {
  return NextResponse.json({ ok: true, skills: SKILLS, categories: SKILL_CATEGORIES });
}
