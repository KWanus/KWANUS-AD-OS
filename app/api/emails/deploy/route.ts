// ---------------------------------------------------------------------------
// Email Deployment API — trigger email flow deployments
// POST /api/emails/deploy
// ---------------------------------------------------------------------------

import { NextRequest, NextResponse } from "next/server";
import { deployFlowToSubscriber, deployFlowToSubscribers } from "@/lib/email/emailDeployment";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { flowId, subscriberEmail, subscriberEmails, variables } = body;

    if (!flowId) {
      return NextResponse.json({ error: "flowId is required" }, { status: 400 });
    }

    // Deploy to single subscriber
    if (subscriberEmail) {
      const result = await deployFlowToSubscriber(flowId, subscriberEmail, variables);
      return NextResponse.json(result);
    }

    // Deploy to multiple subscribers
    if (subscriberEmails && Array.isArray(subscriberEmails)) {
      const result = await deployFlowToSubscribers(flowId, subscriberEmails, variables);
      return NextResponse.json(result);
    }

    return NextResponse.json(
      { error: "Either subscriberEmail or subscriberEmails is required" },
      { status: 400 }
    );
  } catch (err) {
    console.error("[API] Email deployment error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
