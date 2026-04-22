import { prisma } from "@/lib/prisma";

export type DiscountCode = {
  id: string;
  userId: string;
  code: string;
  type: "percentage" | "fixed";
  value: number; // percentage (0-100) or cents
  maxUses: number;
  usedCount: number;
  expiresAt: string | null;
  active: boolean;
  createdAt: string;
};

/** Create a discount code (stored as funnel event) */
export async function createDiscountCode(userId: string, input: {
  code: string;
  type: "percentage" | "fixed";
  value: number;
  maxUses?: number;
  expiresAt?: string;
}): Promise<DiscountCode> {
  const event = await prisma.himalayaFunnelEvent.create({
    data: {
      userId,
      event: "discount_code",
      metadata: {
        code: input.code.toUpperCase().trim(),
        type: input.type,
        value: input.value,
        maxUses: input.maxUses ?? 999999,
        usedCount: 0,
        expiresAt: input.expiresAt ?? null,
        active: true,
      },
    },
  });

  const meta = event.metadata as Record<string, unknown>;
  return {
    id: event.id,
    userId,
    code: meta.code as string,
    type: meta.type as "percentage" | "fixed",
    value: meta.value as number,
    maxUses: meta.maxUses as number,
    usedCount: 0,
    expiresAt: meta.expiresAt as string | null,
    active: true,
    createdAt: event.createdAt.toISOString(),
  };
}

/** Validate and apply a discount code */
export async function validateDiscountCode(userId: string, code: string): Promise<{
  valid: boolean;
  discount?: DiscountCode;
  error?: string;
}> {
  const events = await prisma.himalayaFunnelEvent.findMany({
    where: { userId, event: "discount_code" },
  });

  const upperCode = code.toUpperCase().trim();
  const match = events.find(e => {
    const meta = e.metadata as Record<string, unknown>;
    return (meta.code as string) === upperCode && meta.active === true;
  });

  if (!match) return { valid: false, error: "Invalid discount code" };

  const meta = match.metadata as Record<string, unknown>;
  const usedCount = (meta.usedCount as number) ?? 0;
  const maxUses = (meta.maxUses as number) ?? 999999;
  const expiresAt = meta.expiresAt as string | null;

  if (usedCount >= maxUses) return { valid: false, error: "This code has been used too many times" };
  if (expiresAt && new Date(expiresAt) < new Date()) return { valid: false, error: "This code has expired" };

  return {
    valid: true,
    discount: {
      id: match.id,
      userId,
      code: meta.code as string,
      type: meta.type as "percentage" | "fixed",
      value: meta.value as number,
      maxUses,
      usedCount,
      expiresAt,
      active: true,
      createdAt: match.createdAt.toISOString(),
    },
  };
}

/** Calculate discounted price */
export function applyDiscount(priceCents: number, discount: DiscountCode): number {
  if (discount.type === "percentage") {
    return Math.round(priceCents * (1 - discount.value / 100));
  }
  return Math.max(0, priceCents - discount.value);
}

/** Increment usage count after successful payment */
export async function incrementDiscountUsage(discountId: string): Promise<void> {
  const event = await prisma.himalayaFunnelEvent.findUnique({ where: { id: discountId } });
  if (!event) return;
  const meta = event.metadata as Record<string, unknown>;
  await prisma.himalayaFunnelEvent.update({
    where: { id: discountId },
    data: { metadata: { ...meta, usedCount: ((meta.usedCount as number) ?? 0) + 1 } },
  });
}

/** List all discount codes for a user */
export async function listDiscountCodes(userId: string): Promise<DiscountCode[]> {
  const events = await prisma.himalayaFunnelEvent.findMany({
    where: { userId, event: "discount_code" },
    orderBy: { createdAt: "desc" },
  });

  return events.map(e => {
    const meta = e.metadata as Record<string, unknown>;
    return {
      id: e.id,
      userId,
      code: meta.code as string,
      type: meta.type as "percentage" | "fixed",
      value: meta.value as number,
      maxUses: (meta.maxUses as number) ?? 999999,
      usedCount: (meta.usedCount as number) ?? 0,
      expiresAt: (meta.expiresAt as string) ?? null,
      active: (meta.active as boolean) ?? true,
      createdAt: e.createdAt.toISOString(),
    };
  });
}

/** Toggle discount code active/inactive */
export async function toggleDiscountCode(discountId: string, active: boolean): Promise<void> {
  const event = await prisma.himalayaFunnelEvent.findUnique({ where: { id: discountId } });
  if (!event) return;
  const meta = event.metadata as Record<string, unknown>;
  await prisma.himalayaFunnelEvent.update({
    where: { id: discountId },
    data: { metadata: { ...meta, active } },
  });
}
