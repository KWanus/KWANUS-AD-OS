/**
 * Email Flow Trigger Engine
 *
 * Handles event-based flow enrollment. When an event fires (signup, purchase,
 * cart_abandon, etc.), this engine finds matching flows and enrolls the contact.
 */

import { prisma } from "@/lib/prisma";
import { executeFlowForContact } from "./executeFlow";

export type TriggerEvent = {
  type: "signup" | "purchase" | "abandoned_cart" | "browse_abandon" | "win_back" | "custom" | "form_submit";
  email: string;
  firstName?: string;
  lastName?: string;
  userId: string; // the site/app owner's userId
  metadata?: Record<string, unknown>;
  tags?: string[];
};

/**
 * Fire a trigger event. Finds all matching active flows and enrolls the contact.
 */
export async function fireTrigger(event: TriggerEvent): Promise<{
  enrolled: number;
  errors: string[];
}> {
  const errors: string[] = [];
  let enrolled = 0;

  try {
    // Find all active flows matching this trigger type for this user
    const flows = await prisma.emailFlow.findMany({
      where: {
        userId: event.userId,
        trigger: event.type,
        status: "active",
      },
    });

    if (flows.length === 0) {
      return { enrolled: 0, errors: [] };
    }

    // Ensure contact exists
    const contact = await prisma.emailContact.upsert({
      where: {
        userId_email: {
          userId: event.userId,
          email: event.email,
        },
      },
      create: {
        userId: event.userId,
        email: event.email,
        firstName: event.firstName ?? null,
        lastName: event.lastName ?? null,
        status: "subscribed",
        source: event.type,
        tags: event.tags ?? [],
      },
      update: {
        firstName: event.firstName ?? undefined,
        lastName: event.lastName ?? undefined,
        // Add tags without duplicating
        ...(event.tags && event.tags.length > 0
          ? { tags: { push: event.tags } }
          : {}),
      },
    });

    // Get user's email settings
    const user = await prisma.user.findUnique({
      where: { id: event.userId },
      select: { resendApiKey: true, sendingFromEmail: true, sendingFromName: true },
    });

    // Enroll in each matching flow
    for (const flow of flows) {
      // Check if already enrolled and active
      const existing = await prisma.emailFlowEnrollment.findFirst({
        where: {
          flowId: flow.id,
          contactEmail: event.email,
          userId: event.userId,
          status: "active",
        },
      });

      if (existing) {
        // Already enrolled in this flow, skip
        continue;
      }

      try {
        // Execute the flow
        const result = await executeFlowForContact(
          flow.id,
          {
            email: contact.email,
            firstName: contact.firstName,
            lastName: contact.lastName,
          },
          {
            resendApiKey: user?.resendApiKey,
            sendingFromEmail: user?.sendingFromEmail,
            sendingFromName: user?.sendingFromName,
          },
        );

        if (result.ok) {
          enrolled++;
          // Update flow stats
          await prisma.emailFlow.update({
            where: { id: flow.id },
            data: { enrolled: { increment: 1 } },
          });
        } else {
          errors.push(`Flow ${flow.name}: ${result.errors.join(", ")}`);
        }
      } catch (err) {
        errors.push(`Flow ${flow.name}: ${err instanceof Error ? err.message : "execution failed"}`);
      }
    }
  } catch (err) {
    errors.push(`Trigger error: ${err instanceof Error ? err.message : "unknown"}`);
  }

  return { enrolled, errors };
}
