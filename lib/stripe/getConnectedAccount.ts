import { prisma } from "@/lib/prisma";

/**
 * Get the connected Stripe account ID for a user.
 * Used by the checkout endpoint to route payments to the user's account.
 */
export async function getConnectedAccountId(userId: string): Promise<string | null> {
  try {
    const config = await prisma.himalayaFunnelEvent.findFirst({
      where: { userId, event: "stripe_connect" },
      orderBy: { createdAt: "desc" },
    });
    const meta = config?.metadata as Record<string, unknown> | null;
    return (meta?.accountId as string) ?? null;
  } catch {
    return null;
  }
}

/**
 * Get the platform fee percentage (what Himalaya keeps).
 * Default: 5% — the user gets 95%.
 */
export function getPlatformFeePercent(): number {
  return parseInt(process.env.PLATFORM_FEE_PERCENT ?? "5", 10);
}
